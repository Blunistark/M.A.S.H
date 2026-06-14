import { type View, Router } from '../router';
import { mockPatients } from '../mockData';
import { getIcon } from '../assets/icons';

export class PatientProfileView implements View {
  public render(params?: { patientId: string }): string {
    const patientId = params?.patientId || 'john-doe';
    const patient = mockPatients.find(p => p.id === patientId) || mockPatients[0];

    // Care team list generator
    const careTeamHTML = (patient.careTeam || [
      {
        name: 'Dr. Smith',
        role: 'Primary Care',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
        active: true
      }
    ]).map(member => `
      <div class="care-team-badge ${member.active ? 'active' : ''}">
        <img src="${member.avatar}" alt="${member.name}" class="care-team-avatar" />
        <div class="care-team-text">
          <div class="care-team-name">${member.name}</div>
          <div class="care-team-role">${member.role}</div>
        </div>
      </div>
    `).join('');

    // Chronic conditions list
    const conditionsHTML = (patient.chronicConditions || [])
      .map(cond => `<li>${cond}</li>`)
      .join('');

    // Allergies list
    const allergiesHTML = (patient.allergies || [])
      .map(allergy => `
        <li class="allergy-item">
          ${allergy.name} <span class="allergy-severity">(${allergy.severity})</span>
        </li>
      `).join('');

    // Medications list
    const medicationsHTML = (patient.medications || [])
      .map(med => `
        <div class="medication-item">
          <div class="medication-info">
            <span class="medication-name">${med.name}</span>
            <span class="medication-dosage">${med.dosage}</span>
          </div>
          <div class="medication-check-circle">
            ${getIcon('check-circle', 'nav-icon')}
          </div>
        </div>
      `).join('');

    // Past tests rows
    const testsHTML = (patient.pastTests || [])
      .map(test => `
        <tr>
          <td>${test.date}</td>
          <td><strong>${test.name}</strong></td>
          <td><span class="test-result-pill ${test.resultClass}">${test.result}</span></td>
          <td>
            <a href="#" class="view-test-link" data-test="${test.name}">
              View ${getIcon('eye', 'test-action-icon')}
            </a>
          </td>
        </tr>
      `).join('');

    // Surgical history timeline
    const surgicalHTML = (patient.surgicalHistory || [])
      .map(surg => `
        <div class="timeline-item">
          <div class="timeline-marker-column">
            <div class="timeline-dot ${surg.checked ? 'checked' : ''}">
              ${surg.checked ? getIcon('check-circle', 'nav-icon') : ''}
            </div>
            <div class="timeline-connector"></div>
          </div>
          <div class="timeline-content-card">
            <div class="timeline-header">
              <span class="timeline-title">${surg.name}</span>
              <span class="timeline-date">${surg.date}</span>
            </div>
            <p class="timeline-description">${surg.description}</p>
          </div>
        </div>
      `).join('');

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
            <button class="btn-primary" id="book-appointment-action">
              ${getIcon('plus', 'nav-icon')}
              <span>New Appointment</span>
            </button>
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
          <img src="${patient.photo}" alt="${patient.name}" class="patient-hero-avatar-large" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300'"/>
        </div>

      </section>

      <!-- Floating Patient Demographics Glass Card -->
      <section class="patient-floating-card">
        <div class="floating-patient-info">
          <div class="floating-avatar-circle">
            <img src="${patient.photo}" alt="${patient.name}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'"/>
          </div>
          <div class="floating-details-block">
            <h2 class="floating-patient-name">${patient.name}</h2>
            <div class="floating-demographics">
              ${patient.age} yrs (DOB: ${patient.dob}) &bull; ${patient.gender} &bull; Blood Type: ${patient.bloodType}
            </div>
            <div class="floating-contacts-row">
              <div class="floating-contact-item">
                ${getIcon('phone', 'floating-contact-icon')}
                <span>${patient.phone}</span>
              </div>
              <div class="floating-contact-item">
                ${getIcon('mail', 'floating-contact-icon')}
                <span>${patient.email}</span>
              </div>
              <div class="floating-contact-item">
                ${getIcon('map-pin', 'floating-contact-icon')}
                <span>${patient.address}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="floating-actions-right">
          <button class="btn-secondary-dark" id="view-history-btn">View History</button>
          <button class="btn-secondary-dark" id="write-prescription-floating" data-patient-id="${patient.id}">Write Prescription</button>
          <button class="btn-teal" id="book-appt-floating">Book Appointment</button>
        </div>
      </section>

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
                <span class="vital-sign-value">${patient.vitals?.bp || 'N/A'}</span>
                <span class="vital-sign-status">Normal</span>
              </div>
              <div class="vital-sign-card" style="background: linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(20, 184, 166, 0.05) 100%);">
                <span class="vital-sign-label">Heart Rate</span>
                <span class="vital-sign-value">${patient.vitals?.hr || 'N/A'}</span>
                <span class="vital-sign-status resting">Resting</span>
              </div>
              <div class="vital-sign-card" style="background: linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(30, 58, 138, 0.05) 100%);">
                <span class="vital-sign-label">Weight</span>
                <span class="vital-sign-value">${patient.vitals?.weight || 'N/A'}</span>
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
    `;
  }

  public onMount(container: HTMLElement, router: Router): void {
    // Back navigation button
    const backBtn = container.querySelector('#back-to-patients-list');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        router.navigate('patients');
      });
    }

    // Button actions alert placeholders
    const buttons = [
      '#book-appointment-action',
      '#view-history-btn',
      '#book-appt-floating',
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

    // Write Prescription navigation
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

    // Test detail click
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
