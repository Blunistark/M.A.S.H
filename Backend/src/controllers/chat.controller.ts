import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AGENTS_URL, GEMINI_API_KEY } from '../config/env';

export async function doctorChat(req: Request, res: Response): Promise<void> {
  try {
    const { message, history, doctorId, doctorName } = req.body;
    if (!message) {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/doctor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history, doctorId, doctorName })
      });
      if (agentResponse.ok) {
        const agentData = (await agentResponse.json()) as { reply: string; action?: any };
        console.log('Response from Python DoctorAgent received successfully.');
        res.json({ reply: agentData.reply, action: agentData.action });
        return;
      } else {
        console.warn('Python agent server returned non-ok status, falling back to direct Gemini call.');
      }
    } catch (err) {
      console.warn('Python agent server is unreachable, falling back to direct Gemini call:', err);
    }

    if (!GEMINI_API_KEY) {
      res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    // 1. Fetch today's appointments for Dr. Smith
    const fbTodayStart = new Date();
    fbTodayStart.setUTCHours(0, 0, 0, 0);
    const fbTodayEnd = new Date();
    fbTodayEnd.setUTCHours(23, 59, 59, 999);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd')
      .gte('scheduled_time', fbTodayStart.toISOString())
      .lte('scheduled_time', fbTodayEnd.toISOString());

    // 2. Fetch profiles to match patient names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    // 3. Fetch medical records and patient_records (AI intake & visit summaries)
    const [{ data: medicalRecords }, { data: patientRecords }] = await Promise.all([
      supabase.from('medical_records').select('*'),
      supabase.from('patient_records').select('*')
    ]);

    // 4. Fetch inventory details
    const { data: inventory } = await supabase
      .from('medicine_inventory')
      .select('*');

    // Format schedule
    const scheduleStr = (appointments || []).map(appt => {
      const patient = (profiles || []).find(p => p.id === appt.patient_id);
      const patientName = patient ? patient.full_name : 'Unknown Patient';
      return `- Time: ${appt.scheduled_time}, Patient: ${patientName}, Status: ${appt.status}`;
    }).join('\n');

    // Format medical records from both medical_records and patient_records
    const legacyRecordsStr = (medicalRecords || []).map(record => {
      const patient = (profiles || []).find(p => p.id === record.patient_id);
      if (!patient) return null;
      let desc = record.description;
      return `- Patient: ${patient.full_name}, Record Type: ${record.record_type}, Details: ${desc}`;
    }).filter(Boolean);

    const patientRecordsStr = (patientRecords || []).map(record => {
      const patient = (profiles || []).find(p => p.id === record.patient_id);
      if (!patient) return null;
      const report = record.doctor_report || {};
      const intake = report.ai_intake_summary || {};
      const parts = [];
      if (intake.summary) parts.push(`Summary: ${intake.summary}`);
      if (intake.conditions?.length) parts.push(`Conditions: ${intake.conditions.join(', ')}`);
      if (intake.medications?.length) parts.push(`Medications: ${intake.medications.join(', ')}`);
      if (intake.allergies?.length) parts.push(`Allergies: ${intake.allergies.join(', ')}`);
      if (intake.family_history?.length) parts.push(`Family History: ${intake.family_history.join(', ')}`);
      if (intake.surgeries?.length) parts.push(`Surgeries: ${intake.surgeries.join(', ')}`);
      if (report.source === 'post_visit') {
        parts.push(`Visit Notes: ${report.doctor_comments || 'N/A'}`);
      }
      return `- Patient: ${patient.full_name}, Medical History (patient_records): ${parts.join(' | ')}`;
    }).filter(Boolean);

    const recordsStr = [...legacyRecordsStr, ...patientRecordsStr].join('\n');

    // Format inventory
    const inventoryStr = (inventory || []).map(item => {
      return `- Medicine: ${item.medicine_name}, Stock: ${item.current_stock}, Reorder Threshold: ${item.reorder_threshold}`;
    }).join('\n');

    const systemInstruction = `You are the personal AI assistant for Dr. Anita Desai (also known as Dr. Smith). 
You speak like a friendly, knowledgeable clinical colleague — not a stiff chatbot or a report generator.

Today's Schedule / Appointments:
${scheduleStr || 'No appointments scheduled today.'}

Patient Medical History Context:
${recordsStr || 'No patient records found.'}

Medicine Inventory Stock Levels:
${inventoryStr || 'No stock details available.'}

Guidelines:
1. Speak like a real professional clinical assistant.
2. When asked about patient history or today's schedule, summarize details conversationally.
3. Be friendly, brief, and concise. Speak in short paragraphs. No huge lists or markdown tables unless requested.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    // Map history to Gemini API format
    const contents = (history || []).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    // Append the current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await globalThis.fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      res.status(500).json({ message: `Gemini API returned error: ${response.status}` });
      return;
    }

    const resData = (await response.json()) as any;
    const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // --- Extract navigation action from the user's message (fallback action extraction) ---
    let action: any = undefined;
    const msgLower = message.toLowerCase();

    // Check for patient profile navigation intent
    const patientNavPatterns = [
      /(?:open|show|go\s+to|view|navigate\s+to)\s+(?:patient\s+)?(?:profile\s+(?:of|for)\s+)?(.+?)(?:'s)?\s*(?:profile|page|record)?$/i,
      /(?:open|show|go\s+to|view)\s+(.+?)(?:'s)?\s*(?:profile|page)?$/i,
    ];

    // Check for prescription writing intent
    const prescriptionPatterns = [
      /(?:write|create|send)\s+(?:a\s+)?prescription\s+(?:to|for)\s+(.+?)(?:\s+|$)/i,
      /prescribe\s+(?:.+?)\s+(?:to|for)\s+(.+?)(?:\s+|$)/i,
      /prescription\s+(?:to|for)\s+(.+?)(?:\s+|$)/i
    ];

    let extractedName: string | null = null;
    let isPrescriptionIntent = false;

    for (const pattern of patientNavPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        extractedName = match[1].trim();
        break;
      }
    }

    if (!extractedName) {
      for (const pattern of prescriptionPatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          extractedName = match[1].trim();
          isPrescriptionIntent = true;
          break;
        }
      }
    }

    if (extractedName && profiles) {
      const searchLower = extractedName.toLowerCase();
      const searchWords = searchLower.split(/\s+/).filter((w: string) => w.length > 1);
      const patients = (profiles as any[]).filter((p: any) => p.role === 'patient');

      let bestMatch: any = null;
      let bestScore = 0;

      for (const p of patients) {
        const fullName = (p.full_name || '').toLowerCase();
        const nameWords = fullName.split(/\s+/);
        let score = 0;

        if (fullName === searchLower) { score += 20; }
        else if (fullName.includes(searchLower)) { score += 10; }

        for (const sw of searchWords) {
          if (nameWords.some((nw: string) => nw === sw)) score += 5;
          else if (nameWords.some((nw: string) => nw.startsWith(sw))) score += 3;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = p;
        }
      }

      if (bestMatch && bestScore >= 3) {
        action = {
          type: 'navigate',
          route: isPrescriptionIntent ? 'prescriptions' : 'patient-profile',
          patientId: bestMatch.id
        };
        console.log(`[Fallback] Resolved patient '${extractedName}' → ${bestMatch.full_name} (${bestMatch.id})`);
      }
    }

    // Check for simple page navigation intent
    if (!action) {
      const routeMap: Record<string, string> = {
        'dashboard': 'dashboard',
        'home': 'dashboard',
        'main page': 'dashboard',
        'prescriptions': 'prescriptions',
        'prescription writer': 'prescriptions',
        'schedule': 'schedule',
        'calendar': 'schedule',
        'appointments': 'schedule',
        'patients': 'patients',
        'patients list': 'patients',
        'patients directory': 'patients',
        'pharmacy': 'pharmacy',
        'stock': 'pharmacy',
      };

      const navPrefixes = ['go to', 'navigate to', 'open', 'show', 'take me to'];
      for (const prefix of navPrefixes) {
        if (msgLower.includes(prefix)) {
          const afterPrefix = msgLower.split(prefix).pop()?.trim() || '';
          for (const [keyword, route] of Object.entries(routeMap)) {
            if (afterPrefix.includes(keyword)) {
              action = { type: 'navigate', route };
              break;
            }
          }
          if (action) break;
        }
      }

      // Also check if message itself is just the page name
      if (!action) {
        for (const [keyword, route] of Object.entries(routeMap)) {
          if (msgLower === keyword || msgLower === `go to ${keyword}`) {
            action = { type: 'navigate', route };
            break;
          }
        }
      }

      // Check for appointment booking intent
      if (!action && (msgLower.includes('new appointment') || msgLower.includes('book appointment') || msgLower.includes('create appointment'))) {
        action = { type: 'navigate', route: 'new-appointment' };
      }
    }

    res.json({ reply: replyText, action });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function patientChat(req: Request, res: Response): Promise<void> {
  try {
    const { message, history, patientId, patientName } = req.body;
    console.log(`[Patient Chat API] Received message. AGENTS_URL=${AGENTS_URL}, patientId=${patientId}`);
    if (!message) {
      console.log(`[Patient Chat API] Rejected: message is missing`);
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/patient-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history, patientId, patientName })
      });
      if (agentResponse.ok) {
        const agentData = (await agentResponse.json()) as { reply: string; action?: any };
        console.log('Response from Python PatientAgent received successfully.');
        res.json({ reply: agentData.reply, action: agentData.action });
        return;
      } else {
        const errorData = (await agentResponse.json().catch(() => ({}))) as { detail?: string };
        console.warn('Python agent server (patient) returned non-ok status:', agentResponse.status, errorData);
        res.status(agentResponse.status).json({ message: errorData.detail || 'Error from patient agent server' });
        return;
      }
    } catch (err) {
      console.warn('Python agent server (patient) is unreachable:', err);
      res.status(503).json({ message: 'Patient agent server is unreachable' });
      return;
    }
  } catch (err: any) {
    console.error('Patient Chat error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

export async function pharmacistChat(req: Request, res: Response): Promise<void> {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ message: 'Message is required' });
      return;
    }

    // Try delegating to the python agent_server on port 8000
    try {
      const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/pharmacist-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message, history })
      });
      if (agentResponse.ok) {
        const agentData = (await agentResponse.json()) as { reply: string; action?: any };
        console.log('Response from Python PharmacistAgent received successfully.');
        res.json({ reply: agentData.reply, action: agentData.action });
        return;
      } else {
        console.warn('Python agent server (pharmacist) returned non-ok status, falling back to direct Gemini call.');
      }
    } catch (err) {
      console.warn('Python agent server (pharmacist) is unreachable, falling back to direct Gemini call:', err);
    }

    if (!GEMINI_API_KEY) {
      res.status(500).json({ message: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    // Fallback: fetch pharmacy context and use Gemini directly
    const { data: inventory } = await supabase
      .from('medicine_inventory')
      .select('*');

    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('*')
      .in('status', ['pushed_to_pharma', 'alternative_requested', 'pending_check']);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, role');

    // Format inventory
    const inventoryStr = (inventory || []).map(item => {
      const status = item.current_stock <= item.reorder_threshold ? 'LOW STOCK' : 'OK';
      return `- ${item.medicine_name}: ${item.current_stock} units (reorder at ${item.reorder_threshold}) [${status}]`;
    }).join('\n');

    // Format pending prescriptions
    const rxStr = (prescriptions || []).map(rx => {
      const patient = (profiles || []).find(p => p.id === rx.patient_id);
      const patientName = patient ? patient.full_name : 'Unknown Patient';
      return `- [${rx.status}] Patient: ${patientName}, ID: ${rx.id}`;
    }).join('\n');

    const systemInstruction = `You are the AI pharmacy assistant for the hospital pharmacy panel.
You help the pharmacist manage inventory, fulfill prescription orders, restock medicines, and handle stock alerts.
You speak like a friendly, efficient colleague — brief and action-oriented.

Current Medicine Inventory:
${inventoryStr || 'No inventory data available.'}

Pending Prescription Orders:
${rxStr || 'No pending prescriptions.'}

Guidelines:
1. Be concise, friendly, and practical.
2. When asked about stock, summarize the key points (especially low-stock items).
3. When asked to fulfill or restock, confirm the action clearly.
4. No markdown tables or long dumps unless the user explicitly requests them.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const contents = (history || []).map((h: any) => ({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }]
    }));

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await globalThis.fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error (pharmacist):', errorText);
      res.status(500).json({ message: `Gemini API returned error: ${response.status}` });
      return;
    }

    const resData = (await response.json()) as any;
    const replyText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // Extract navigation actions from message
    let action: any = undefined;
    const msgLower = message.toLowerCase();

    const routeMap: Record<string, string> = {
      'dashboard': 'dashboard',
      'doctor portal': 'dashboard',
      'doctor dashboard': 'dashboard',
      'prescriptions': 'prescriptions',
      'patients': 'patients',
      'schedule': 'schedule',
      'pharmacy': 'pharmacy',
    };

    const navPrefixes = ['go to', 'navigate to', 'open', 'show', 'switch to', 'take me to'];
    for (const prefix of navPrefixes) {
      if (msgLower.includes(prefix)) {
        const afterPrefix = msgLower.split(prefix).pop()?.trim() || '';
        for (const [keyword, route] of Object.entries(routeMap)) {
          if (afterPrefix.includes(keyword)) {
            action = { type: 'navigate', route };
            break;
          }
        }
        if (action) break;
      }
    }

    res.json({ reply: replyText, action });
  } catch (err: any) {
    console.error('Pharmacist chat error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}
