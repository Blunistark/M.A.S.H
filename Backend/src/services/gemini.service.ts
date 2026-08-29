import { GEMINI_API_KEY } from '../config/env';

export interface MedicalHistorySummary {
  conditions: string[];
  allergies: string[];
  surgeries: string[];
  medications: string[];
  family_history: string[];
  summary: string;
}

export async function summarizeMedicalHistory(rawText: string): Promise<MedicalHistorySummary> {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY not set, returning raw text as summary');
    return {
      conditions: [],
      allergies: [],
      surgeries: [],
      medications: [],
      family_history: [],
      summary: rawText
    };
  }

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `You are a medical data extraction assistant. A patient has described their medical history in plain text. Extract and structure the information into the following JSON format. Be thorough but concise. If a category has no relevant information, use an empty array.

Patient's input:
"""
${rawText}
"""

Respond with ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "conditions": ["list of medical conditions/diagnoses"],
  "allergies": ["list of allergies"],
  "surgeries": ["list of surgeries with year if mentioned"],
  "medications": ["list of current medications with dosage if mentioned"],
  "family_history": ["list of family medical history items"],
  "summary": "A brief 2-3 sentence clinical summary of the patient's medical history"
}`;

  try {
    const response = await globalThis.fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini summarization error:', errText);
      return {
        conditions: [],
        allergies: [],
        surgeries: [],
        medications: [],
        family_history: [],
        summary: rawText
      };
    }

    const resData = (await response.json()) as any;
    const text = resData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Parse the JSON response, handling potential markdown code fences
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);

    return {
      conditions: parsed.conditions || [],
      allergies: parsed.allergies || [],
      surgeries: parsed.surgeries || [],
      medications: parsed.medications || [],
      family_history: parsed.family_history || [],
      summary: parsed.summary || rawText
    };
  } catch (err) {
    console.error('Failed to summarize medical history with Gemini:', err);
    return {
      conditions: [],
      allergies: [],
      surgeries: [],
      medications: [],
      family_history: [],
      summary: rawText
    };
  }
}
