import { type View, Router } from '../router';
import { mockProfiles, mockMedicalRecords } from '../mockData';
import { getIcon } from '../assets/icons';

let searchQuery = '';

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export class PatientsListView implements View {
  public render(): string {
    const patients = mockProfiles.filter(p => p.role === 'patient');

    // Filter patients based on search query
    const filteredPatients = patients.filter(patient => {
      const records = mockMedicalRecords.filter(r => r.patient_id === patient.id);
      return patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             records.some(r => r.description.toLowerCase().includes(searchQuery.toLowerCase()));
    });

    // Generate patient cards
    const patientCards = filteredPatients.map(patient => {
      const initials = getInitials(patient.full_name);
      
      return `
        <div class="patient-profile-card">
          <div class="patient-card-avatar-wrapper" style="background: var(--accent-blue); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">
            ${initials}
          </div>
          <h3 class="patient-card-name">${patient.full_name}</h3>
          <div class="patient-card-details">
            Patient
          </div>

          <div class="patient-card-contacts">
            <div class="patient-contact-item">
              ${getIcon('phone', 'patient-contact-icon')}
              <span>${patient.contact_number || 'N/A'}</span>
            </div>
            <div class="patient-contact-item" style="opacity: 0.5;">
              ${getIcon('mail', 'patient-contact-icon')}
              <span>No email provided</span>
            </div>
          </div>

          <button class="patient-card-action-btn" data-patient-id="${patient.id}">
            View Full Profile
          </button>
        </div>
      `;
    }).join('');

    return `
      <!-- Header -->
      <header class="main-header">
        <div class="header-title-section">
          <h1 class="header-title">Patients Directory</h1>
          <span class="header-subtitle">Overview of registered patients</span>
        </div>
        <div class="header-actions">
          <!-- Interactive Search Bar -->
          <div class="header-utility-icons" style="gap: 12px; background: #ffffff; padding: 6px 12px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; width: 300px;">
            ${getIcon('search', 'nav-icon')}
            <input type="text" id="patient-search-input" placeholder="Search by name, conditions..." value="${searchQuery}" style="border: none; outline: none; font-size: 13px; width: 100%; font-family: var(--font-sans);" />
          </div>
          <div class="header-utility-icons">
            <button class="header-icon-btn">
              ${getIcon('bell', 'nav-icon')}
              <div class="badge-dot"></div>
            </button>
            <div class="user-quick-profile">
              <span class="user-name">Dr. Smith</span>
              <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150" alt="Dr. Smith" class="user-avatar" />
            </div>
          </div>
        </div>
      </header>

      <!-- Patient Grid Content -->
      <div class="page-content">
        ${
          filteredPatients.length > 0 
            ? `<div class="patients-grid-layout">${patientCards}</div>`
            : `
              <div style="text-align: center; padding: 60px; color: #64748b;">
                <h3>No patients found</h3>
                <p style="margin-top: 8px;">Try searching for a different name or condition.</p>
              </div>
            `
        }
      </div>
    `;
  }

  public onMount(container: HTMLElement, router: Router): void {
    // Navigate on view profile click
    const actionBtns = container.querySelectorAll('.patient-card-action-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const patientId = btn.getAttribute('data-patient-id');
        if (patientId) {
          router.navigate('patient-profile', { patientId });
        }
      });
    });

    // Handle search input events
    const searchInput = container.querySelector('#patient-search-input') as HTMLInputElement;
    if (searchInput) {
      // Focus cursor at end of text after rerender
      searchInput.focus();
      searchInput.setSelectionRange(searchQuery.length, searchQuery.length);

      searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        searchQuery = target.value;
        
        // Fast rerender
        router.navigate('patients');
      });
    }
  }
}
