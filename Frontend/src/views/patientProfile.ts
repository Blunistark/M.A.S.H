import { type View, Router } from '../router';
import {
  fetchProfiles,
  fetchMedicalRecords,
  fetchPrescriptions,
  fetchPrescriptionItems,
  fetchMedicineInventory,
  fetchDoctorDetails,
  fetchAppointments,
  fetchPatientRecords,
  getPatientPhotoUrl
} from '../api';
import type { Profile, PatientRecord } from '../types';
import { getIcon } from '../assets/icons';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export class PatientProfileView implements View {
  public async render(params?: { patientId: string }): Promise<string> {
    let allProfiles: Profile[] = [];
    let allRecords: any[] = [];
    let allPrescriptions: any[] = [];
    let allPrescriptionItems: any[] = [];
    let allInventory: any[] = [];
    let allDoctorDetails: any[] = [];
    let allAppointments: any[] = [];
    let patientRecords: PatientRecord[] = [];

    try {
      [
        allProfiles,
        allRecords,
        allPrescriptions,
        allPrescriptionItems,
        allInventory,
        allDoctorDetails,
        allAppointments
      ] = await Promise.all([
        fetchProfiles(),
        fetchMedicalRecords(),
        fetchPrescriptions(),
        fetchPrescriptionItems(),
        fetchMedicineInventory(),
        fetchDoctorDetails(),
        fetchAppointments()
      ]);
    } catch (err) {
      console.error('Failed to fetch patient profile data:', err);
    }

    const patients = allProfiles.filter(p => p.role === 'patient');

    if (patients.length === 0) {
      return `
        <div style="flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #64748b; font-family: var(--font-sans); padding: 40px; box-sizing: border-box; height: 100%;">
          <h3 style="font-family: var(--font-heading); font-size: 24px; font-weight: 600; color: #0f172a; margin: 0;">no patients</h3>
        </div>
      `;
    }

    let patientId = params?.patientId || '550e8400-e29b-41d4-a716-446655440000';
    if (!patients.some(p => p.id === patientId)) {
      patientId = patients[0].id;
    }

    const patient = allProfiles.find(p => p.id === patientId) || patients[0];

    const initials = getInitials(patient.full_name);

    // Get medical records for this patient
    const records = allRecords.filter(r => r.patient_id === patientId);
    const conditions = records.filter(r => r.record_type === 'Condition');
    const allergies = records.filter(r => r.record_type === 'Allergy');
    const vitals = records.filter(r => r.record_type === 'Vital');
    const tests = records.filter(r => r.record_type === 'Test');
    const surgeries = records.filter(r => r.record_type === 'Surgery');
    const aiSummaries = records.filter(r => r.record_type === 'ai_summary');
    const latestAiSummary = aiSummaries.length > 0 ? aiSummaries[aiSummaries.length - 1] : null;

    // Fetch patient_records (AI intake summaries + visit records)
    try {
      patientRecords = await fetchPatientRecords(patientId);
    } catch (err) {
      console.warn('Failed to fetch patient records:', err);
    }

    const demoRec = records.find(r => r.record_type === 'demographics');
    let gender = 'Not Specified';
    if (demoRec) {
      try {
        const demo = JSON.parse(demoRec.description);
        gender = demo.gender || 'Not Specified';
      } catch (e) { }
    }

    let aiSummaryCardHTML = '';
    if (latestAiSummary) {
      aiSummaryCardHTML = `
      <!-- AI Clinical Summary Glass Card -->
      <section class="ai-summary-glass-card">
        <div class="ai-summary-header">
          <span class="ai-summary-icon">${getIcon('activity', 'nav-icon')}</span>
          <div class="ai-summary-title">
            <span>AI Clinical Summary</span>
            <span class="ai-summary-badge">M.A.S.H Automated</span>
          </div>
        </div>
        <div class="ai-summary-body">${latestAiSummary.description}</div>
      </section>
      `;
    }

    // Care team list generator
    const careTeamIds = new Set(records.map(r => r.doctor_id));
    if (careTeamIds.size === 0) careTeamIds.add('dr-smith'); // fallback
    const careTeamHTML = Array.from(careTeamIds).map(doctorId => {
      const doctor = allProfiles.find(p => p.id === doctorId);
      const details = allDoctorDetails.find(d => d.doctor_id === doctorId);
      if (!doctor) return '';
      return `
        <div class="care-team-badge active">
          <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--surface-200); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px;">
            ${getInitials(doctor.full_name)}
          </div>
          <div class="care-team-text">
            <div class="care-team-name">${doctor.full_name}</div>
            <div class="care-team-role">${details?.specialty || 'Doctor'}</div>
          </div>
        </div>
      `;
    }).join('');

    const conditionsHTML = conditions
      .map(cond => `<li>${cond.description}</li>`)
      .join('');

    const allergiesHTML = allergies
      .map(allergy => {
        const severity = allergy.metadata?.severity || 'Unknown severity';
        return `
          <li class="allergy-item">
            ${allergy.description} <span class="allergy-severity">(${severity})</span>
          </li>
        `;
      }).join('');

    // Active prescriptions
    const activePrescriptions = allPrescriptions.filter(p => p.patient_id === patientId && p.status === 'active');
    const activeItems = allPrescriptionItems.filter(i => activePrescriptions.some(p => p.id === i.prescription_id));

    const medicationsHTML = activeItems
      .map(item => {
        const med = allInventory.find(m => m.id === item.medicine_id);
        return `
          <div class="medication-item">
            <div class="medication-info">
              <span class="medication-name">${med?.medicine_name || 'Unknown'}</span>
              <span class="medication-dosage">${item.dosage}</span>
            </div>
            <div class="medication-check-circle">
              ${getIcon('check-circle', 'nav-icon')}
            </div>
          </div>
        `;
      }).join('');

    // Past tests rows
    const testsHTML = tests
      .map(test => `
        <tr>
          <td>${new Date(test.record_date).toLocaleDateString()}</td>
          <td><strong>${test.description}</strong></td>
          <td><span class="test-result-pill normal">Recorded</span></td>
          <td>
            <a href="#" class="view-test-link" data-test="${test.description}">
              View ${getIcon('eye', 'test-action-icon')}
            </a>
          </td>
        </tr>
      `).join('');

    // Surgical history timeline
    const surgicalHTML = surgeries
      .map(surg => `
        <div class="timeline-item">
          <div class="timeline-marker-column">
            <div class="timeline-dot checked">
              ${getIcon('check-circle', 'nav-icon')}
            </div>
            <div class="timeline-connector"></div>
          </div>
          <div class="timeline-content-card">
            <div class="timeline-header">
              <span class="timeline-title">${surg.description}</span>
              <span class="timeline-date">${new Date(surg.record_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      `).join('');

    // Get latest vitals
    const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1].metadata : null;

    return `
      <!-- Top banner backdrop (Deep dark gradient containing patient portrait) -->
      <section class="profile-top-banner">
        
        <!-- Navigation bar inside banner -->
        <div class="profile-banner-nav">
          <button class="back-link-btn" id="back-to-patients-list">
            ${getIcon('chevron-left', 'nav-icon')}
            <span>Back to list</span>
          </button>
          
          <div class="profile-actions">
            <button class="btn-secondary" id="write-prescription-action" data-patient-id="${patient.id}">Write Prescription</button>
          </div>
        </div>

        <!-- Care Team Badge row inside banner -->
        <div class="care-team-section">
          <span class="care-team-label">Care Team</span>
          <div class="care-team-list">
            ${careTeamHTML}
          </div>
        </div>

        <!-- Centered Glowing Patient Photo inside banner -->
        <div class="patient-hero-content">
          <div class="patient-glowing-aura"></div>
          <div class="patient-hero-avatar-large" style="background: #0ea5e9; display: flex; align-items: center; justify-content: center; color: white; font-size: 48px; font-weight: bold; border-radius: 50%; width: 120px; height: 120px; border: 4px solid white; position: relative; overflow: hidden;">
            <img src="${getPatientPhotoUrl(patient.full_name, gender)}" alt="${patient.full_name}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';" />
            <span>${initials}</span>
          </div>
        </div>

      </section>

      <!-- Floating Patient Demographics Glass Card -->
      <section class="patient-floating-card">
        <div class="floating-patient-info">
          <div class="floating-avatar-circle" style="background: #0ea5e9; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; position: relative; overflow: hidden;">
            <img src="${getPatientPhotoUrl(patient.full_name, gender)}" alt="${patient.full_name}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';" />
            <span>${initials}</span>
          </div>
          <div class="floating-details-block">
            <h2 class="floating-patient-name">${patient.full_name}</h2>
            <div class="floating-demographics">
              Patient
            </div>
            
            ${(() => {
        const patientAppointments = allAppointments.filter(a => a.patient_id === patientId);
        const latestAppt = patientAppointments
          .sort((a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime())[0];

        if (latestAppt) {
          const apptDate = new Date(latestAppt.scheduled_time);
          const formattedDate = apptDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'UTC'
          });
          let hours = apptDate.getUTCHours();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12;
          hours = hours ? hours : 12;
          const minutes = apptDate.getUTCMinutes().toString().padStart(2, '0');
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
          const statusLabel = latestAppt.status.toUpperCase().replace('_', ' ');

          return `
                  <div class="floating-contacts-row" style="margin-bottom: 8px;">
                    <div class="floating-contact-item" style="background: rgba(59, 130, 246, 0.1); padding: 4px 10px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2); font-weight: 500;">
                      ${getIcon('calendar', 'floating-contact-icon')}
                      <span style="color: var(--primary-blue);">Appointment (${statusLabel}): <strong>${formattedDate} at ${formattedTime}</strong></span>
                    </div>
                  </div>
                `;
        }
        return '';
      })()}

            <div class="floating-contacts-row">
              <div class="floating-contact-item">
                ${getIcon('phone', 'floating-contact-icon')}
                <span>${patient.contact_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="floating-actions-right">
          <button class="btn-secondary-dark" id="view-history-btn">View History</button>
          <button class="btn-secondary-dark" id="write-prescription-floating" data-patient-id="${patient.id}">Write Prescription</button>
        </div>
      </section>


      ${aiSummaryCardHTML}

      <!-- Profile Grid Details -->
      <div class="profile-content-layout">
        
        <!-- Left Column: Medical History & Medications -->
        <div class="profile-column">
          
          <!-- Medical History -->
          <div class="dashboard-card medical-history-card">
            <div class="section-title">
              ${getIcon('activity', 'nav-icon')}
              <span>Medical History</span>
            </div>
            
            <div class="history-subsection">
              <div class="history-subsection-label">Chronic Conditions</div>
              <ul class="history-list">
                ${conditionsHTML || '<li>No documented chronic conditions.</li>'}
              </ul>
            </div>

            <div class="history-subsection" style="margin-top: 24px;">
              <div class="history-subsection-label">Allergies</div>
              <ul class="history-list allergies">
                ${allergiesHTML || '<li>No known drug or environmental allergies.</li>'}
              </ul>
            </div>
          </div>

          <!-- Current Medications -->
          <div class="dashboard-card medications-card">
            <div class="section-title" style="display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 8px;">
              ${getIcon('pill', 'nav-icon')}
              <span>Current Medications</span>
            </div>
            <div class="medications-list">
              ${medicationsHTML || '<p style="font-size: 13px; color: #64748b;">No active medications.</p>'}
            </div>
          </div>

        </div>

        <!-- Right Column: Vitals, Tests & Timeline -->
        <div class="profile-column">
          
          <!-- Vital Signs -->
          <div class="dashboard-card vital-signs-section-card">
            <div class="section-title" style="display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: #0f172a;">
              ${getIcon('activity', 'nav-icon')}
              <span>Vital Signs</span>
            </div>
            <div class="vital-signs-grid">
              <div class="vital-sign-card">
                <span class="vital-sign-label">Blood Pressure</span>
                <span class="vital-sign-value">${latestVitals?.bp || 'N/A'}</span>
                <span class="vital-sign-status">Normal</span>
              </div>
              <div class="vital-sign-card" style="background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%);">
                <span class="vital-sign-label">Heart Rate</span>
                <span class="vital-sign-value">${latestVitals?.hr || 'N/A'}</span>
                <span class="vital-sign-status resting">Resting</span>
              </div>
              <div class="vital-sign-card" style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(30, 58, 138, 0.05) 100%);">
                <span class="vital-sign-label">Weight</span>
                <span class="vital-sign-value">${latestVitals?.weight || 'N/A'}</span>
                <span class="vital-sign-status stable">Stable</span>
              </div>
            </div>
          </div>

          <!-- Past Tests -->
          <div class="dashboard-card past-tests-card">
            <div class="card-header" style="padding: 0 0 16px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
              <div class="section-title" style="display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: #0f172a; margin: 0;">
                ${getIcon('flask', 'nav-icon')}
                <span>Past Tests</span>
              </div>
              <a href="#" class="card-header-link" id="view-all-tests-btn">View All</a>
            </div>
            <table class="tests-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Test Name</th>
                  <th>Result</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${testsHTML || '<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 12px 0;">No test reports recorded.</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- Surgical History -->
          <div class="dashboard-card surgical-history-card">
            <div class="section-title" style="display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: #0f172a;">
              ${getIcon('activity', 'nav-icon')}
              <span>Surgical History</span>
            </div>
            
            <div class="timeline-container">
              ${surgicalHTML || '<p style="font-size: 13px; color: #64748b;">No surgical history documented.</p>'}
            </div>
          </div>

        </div>

      </div>

      <!-- Patient Records Timeline (AI Intake + Visit History) -->
      ${(() => {
        if (patientRecords.length === 0) return '';

        // Find the registration intake record
        const intakeRecord = patientRecords.find(r => r.doctor_report?.source === 'registration');
        const visitRecords = patientRecords.filter(r => r.doctor_report?.source === 'post_visit');

        let intakeHTML = '';
        if (intakeRecord && intakeRecord.doctor_report?.ai_intake_summary) {
          const intake = intakeRecord.doctor_report.ai_intake_summary;
          const summarizedDate = intakeRecord.doctor_report.summarized_at 
            ? new Date(intakeRecord.doctor_report.summarized_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : new Date(intakeRecord.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

          const conditionPills = (intake.conditions || []).map((c: string) => 
            `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; font-size: 12px; font-weight: 500; margin: 2px 4px 2px 0; border: 1px solid rgba(59, 130, 246, 0.15);">${c}</span>`
          ).join('');
          const allergyPills = (intake.allergies || []).map((a: string) => 
            `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; background: rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 12px; font-weight: 500; margin: 2px 4px 2px 0; border: 1px solid rgba(239, 68, 68, 0.15);">${a}</span>`
          ).join('');
          const surgeryPills = (intake.surgeries || []).map((s: string) => 
            `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; background: rgba(168, 85, 247, 0.1); color: #a855f7; font-size: 12px; font-weight: 500; margin: 2px 4px 2px 0; border: 1px solid rgba(168, 85, 247, 0.15);">${s}</span>`
          ).join('');
          const medPills = (intake.medications || []).map((m: string) => 
            `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; background: rgba(20, 184, 166, 0.1); color: #14b8a6; font-size: 12px; font-weight: 500; margin: 2px 4px 2px 0; border: 1px solid rgba(20, 184, 166, 0.15);">${m}</span>`
          ).join('');
          const familyPills = (intake.family_history || []).map((f: string) => 
            `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; font-size: 12px; font-weight: 500; margin: 2px 4px 2px 0; border: 1px solid rgba(245, 158, 11, 0.15);">${f}</span>`
          ).join('');

          intakeHTML = `
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); border: 1px solid rgba(99, 102, 241, 0.12); border-radius: 16px; padding: 20px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #3b82f6); display: flex; align-items: center; justify-content: center;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
                <span style="font-weight: 600; font-size: 14px; color: #0f172a;">AI-Summarized Patient Intake</span>
                <span style="margin-left: auto; font-size: 11px; color: #94a3b8;">${summarizedDate}</span>
              </div>

              ${intake.summary ? `<p style="font-size: 13px; color: #334155; line-height: 1.6; margin: 0 0 14px 0; padding: 10px 14px; background: rgba(255,255,255,0.6); border-radius: 10px; border-left: 3px solid #6366f1;">${intake.summary}</p>` : ''}

              ${conditionPills ? `<div style="margin-bottom: 10px;"><span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Conditions</span><div style="margin-top: 4px;">${conditionPills}</div></div>` : ''}
              ${allergyPills ? `<div style="margin-bottom: 10px;"><span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Allergies</span><div style="margin-top: 4px;">${allergyPills}</div></div>` : ''}
              ${medPills ? `<div style="margin-bottom: 10px;"><span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Medications</span><div style="margin-top: 4px;">${medPills}</div></div>` : ''}
              ${surgeryPills ? `<div style="margin-bottom: 10px;"><span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Surgeries</span><div style="margin-top: 4px;">${surgeryPills}</div></div>` : ''}
              ${familyPills ? `<div style="margin-bottom: 0;"><span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Family History</span><div style="margin-top: 4px;">${familyPills}</div></div>` : ''}
            </div>
          `;
        }

        const visitEntriesHTML = visitRecords.map(vr => {
          const report = vr.doctor_report;
          const visitDate = report?.visit_date 
            ? new Date(report.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : new Date(vr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          
          const doctorProfile = vr.created_by ? allProfiles.find(p => p.id === vr.created_by) : null;
          const doctorName = doctorProfile?.full_name || 'Doctor';
          
          const rxList = (report?.prescriptions_given || []).map((rx: any) => 
            `<div style="display: flex; align-items: center; gap: 6px; padding: 4px 0;">
              <span style="width: 5px; height: 5px; border-radius: 50%; background: #14b8a6; flex-shrink: 0;"></span>
              <span style="font-size: 12px; color: #334155;">${rx.medicine} — ${rx.dosage} (qty: ${rx.quantity})</span>
            </div>`
          ).join('');

          return `
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></div>
                  <span style="font-weight: 600; font-size: 13px; color: #0f172a;">Hospital Visit</span>
                </div>
                <span style="font-size: 11px; color: #94a3b8;">${visitDate}</span>
              </div>
              <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Attended by: <strong>${doctorName}</strong></div>
              ${report?.doctor_comments ? `<p style="font-size: 12px; color: #475569; margin: 6px 0; padding: 8px 10px; background: #f8fafc; border-radius: 8px; border-left: 2px solid #3b82f6;">"${report.doctor_comments}"</p>` : ''}
              ${rxList ? `<div style="margin-top: 6px;"><span style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;">Prescribed</span>${rxList}</div>` : ''}
            </div>
          `;
        }).join('');

        return `
          <div class="dashboard-card" style="margin: 0 40px 40px 40px; box-sizing: border-box;">
            <div class="section-title" style="display: flex; align-items: center; gap: 10px; font-family: var(--font-heading); font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px;">
              ${getIcon('file-text', 'nav-icon')}
              <span>Patient Records Timeline</span>
              <span style="margin-left: auto; font-size: 12px; font-weight: 500; color: #94a3b8; background: #f1f5f9; padding: 3px 10px; border-radius: 12px;">${patientRecords.length} record${patientRecords.length !== 1 ? 's' : ''}</span>
            </div>
            ${intakeHTML}
            ${visitEntriesHTML}
            ${!intakeHTML && !visitEntriesHTML ? '<p style="font-size: 13px; color: #64748b;">No patient records yet.</p>' : ''}
          </div>
        `;
      })()}
    `;
  }

  public onMount(container: HTMLElement, router: Router): void {
    const backBtn = container.querySelector('#back-to-patients-list');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        router.navigate('patients');
      });
    }

    const buttons = [
      '#view-history-btn',
      '#view-all-tests-btn'
    ];

    buttons.forEach(selector => {
      const btn = container.querySelector(selector);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const actionText = btn.textContent?.trim() || 'action';
          alert(`Triggering "${actionText}" operation...`);
        });
      }
    });

    const writeRxBtn = container.querySelector('#write-prescription-action') as HTMLElement;
    if (writeRxBtn) {
      writeRxBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = writeRxBtn.getAttribute('data-patient-id');
        router.navigate('prescriptions', { patientId: pId });
      });
    }

    const writeRxFloatingBtn = container.querySelector('#write-prescription-floating') as HTMLElement;
    if (writeRxFloatingBtn) {
      writeRxFloatingBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const pId = writeRxFloatingBtn.getAttribute('data-patient-id');
        router.navigate('prescriptions', { patientId: pId });
      });
    }

    const testLinks = container.querySelectorAll('.view-test-link');
    testLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const testName = link.getAttribute('data-test');
        alert(`Opening diagnostic panel for: ${testName}`);
      });
    });
  }
}
