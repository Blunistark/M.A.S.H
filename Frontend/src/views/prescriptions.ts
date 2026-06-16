import { type View, Router } from '../router';
import { getIcon } from '../assets/icons';
import { 
  fetchProfileById,
  fetchMedicalRecords,
  fetchPrescriptions,
  fetchPrescriptionItems,
  fetchMedicineInventory,
  completeAppointmentForPatient,
  sendPrescriptionToPharmacy
} from '../api';
import type { Profile } from '../types';

interface RxItem {
  medicine_id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: number;
  durationUnit: string;
  stockStatus: 'In Stock' | 'Out of Stock';
  notes?: string;
}

// Module-level state to hold prescriptions being edited per patient
const rxState: Record<string, RxItem[]> = {};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export class PrescriptionsView implements View {
  private currentPatientId: string = 'john-doe';

  public async render(params?: { patientId: string }): Promise<string> {
    const patientId = params?.patientId || this.currentPatientId;
    this.currentPatientId = patientId;

    let patient: Profile;
    try {
      patient = await fetchProfileById(patientId);
    } catch (err) {
      return `<div style="padding: 40px; text-align: center;">Patient not found.</div>`;
    }

    const allRecords = await fetchMedicalRecords();
    const allergies = allRecords.filter(r => r.patient_id === patientId && r.record_type === 'Allergy');

    // Ensure state exists for this patient
    if (!rxState[patient.id]) {
      const activeRxList = await fetchPrescriptions();
      const activeItemsList = await fetchPrescriptionItems();
      const inventoryList = await fetchMedicineInventory();

      const activeRx = activeRxList.filter(p => p.patient_id === patientId && p.status === 'active');
      const activeItems = activeItemsList.filter(i => activeRx.some(r => r.id === i.prescription_id));
      
      rxState[patient.id] = activeItems.map(m => {
        const medInfo = inventoryList.find(inv => inv.id === m.medicine_id);
        const dosagePart = m.dosage.split(' - ')[0] || m.dosage;
        const freqPart = m.dosage.split(' - ')[1] || 'Once daily';
        return {
          medicine_id: m.medicine_id,
          name: medInfo?.medicine_name || 'Unknown',
          dosage: dosagePart,
          frequency: freqPart,
          duration: m.quantity,
          durationUnit: 'Days',
          stockStatus: (medInfo?.current_stock || 0) > 0 ? 'In Stock' : 'Out of Stock'
        };
      });
    }

    const items = rxState[patient.id];

    // Generate allergy badges
    const allergiesHTML = (allergies.length > 0)
      ? allergies.map(a => `<span class="rx-allergy-badge">${a.description} Allergy</span>`).join('')
      : '<span class="rx-allergy-badge none">NKDA (No Known Drug Allergies)</span>';

    // Generate current prescription rows
    const tableRowsHTML = items.map((item, index) => {
      const isInStock = item.stockStatus === 'In Stock';
      const stockBadge = isInStock 
        ? `<span class="rx-stock-badge in-stock">${getIcon('check', 'stock-icon-check')} In Stock</span>`
        : `<div class="rx-stock-col-out">
             <span class="rx-stock-badge out-of-stock">✕ Out of Stock</span>
             <button class="rx-suggest-alt-btn" data-index="${index}">${getIcon('activity', 'suggest-icon')} Suggest Alt</button>
           </div>`;

      // Check if item name contains Lisinopril, show tooltip info icon
      const hasWarning = item.name.toLowerCase().includes('lisinopril');
      const warningIcon = hasWarning ? `<span class="rx-warning-tooltip" title="Patient has active condition/interaction check">ⓘ</span>` : '';

      return `
        <tr data-row-index="${index}">
          <td>
            <div class="rx-med-name">
              <strong>${item.name}</strong>
              ${warningIcon}
            </div>
            ${item.notes ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px; font-style: italic;">Note: ${item.notes}</div>` : ''}
          </td>
          <td>${item.frequency}</td>
          <td>${item.duration} ${item.durationUnit}</td>
          <td>${stockBadge}</td>
          <td>
            <button class="rx-row-delete-btn" data-index="${index}">
              ${getIcon('trash', 'rx-delete-icon')}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- Main Content Container -->
      <div class="page-content rx-page-viewport">
        
        <!-- Top Patient Context Banner Card -->
        <div class="rx-patient-banner">
          <div class="rx-patient-info-left">
            <div class="rx-patient-avatar" style="background: var(--accent-blue); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
              ${getInitials(patient.full_name)}
            </div>
            <div class="rx-patient-text">
              <h2 class="rx-patient-name">${patient.full_name}</h2>
              <span class="rx-patient-meta">Patient &bull; ID: ${patient.id.toUpperCase().substring(0, 8)}</span>
            </div>
          </div>
          <div class="rx-patient-allergies">
            ${allergiesHTML}
          </div>
        </div>

        <!-- Two Column Grid for forms -->
        <div class="rx-main-grid">
          
          <!-- Left: Add Medication Form Card -->
          <div class="rx-card rx-form-card">
            <h3 class="rx-card-title">Add Medication</h3>
            <form id="rx-add-form" class="rx-form">
              <div class="rx-form-group">
                <label class="rx-label" for="rx-name">Medicine Name</label>
                <div class="rx-input-with-icon">
                  ${getIcon('search', 'rx-search-icon')}
                  <input type="text" id="rx-name" placeholder="Search medication..." required />
                </div>
              </div>

              <div class="rx-form-row">
                <div class="rx-form-group">
                  <label class="rx-label" for="rx-dosage">Dosage</label>
                  <input type="text" id="rx-dosage" placeholder="e.g. 500mg" required />
                </div>
                <div class="rx-form-group">
                  <label class="rx-label" for="rx-frequency">Frequency</label>
                  <input type="text" id="rx-frequency" placeholder="BID (Twice daily) or autogenerated" required />
                </div>
              </div>

              <!-- Meal & Timing Instructions (Radio Buttons) -->
              <div class="rx-form-group">
                <label class="rx-label">Meal & Timing Instructions</label>
                <div class="rx-timing-grid">
                  <!-- Morning -->
                  <div class="rx-timing-row">
                    <span class="rx-timing-label">Morning</span>
                    <div class="rx-radio-group">
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-morning" value="" checked /> None
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-morning" value="Before Food" /> Before
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-morning" value="After Food" /> After
                      </label>
                    </div>
                  </div>
                  <!-- Lunch -->
                  <div class="rx-timing-row">
                    <span class="rx-timing-label">Lunch</span>
                    <div class="rx-radio-group">
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-lunch" value="" checked /> None
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-lunch" value="Before Food" /> Before
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-lunch" value="After Food" /> After
                      </label>
                    </div>
                  </div>
                  <!-- Evening -->
                  <div class="rx-timing-row">
                    <span class="rx-timing-label">Evening</span>
                    <div class="rx-radio-group">
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-evening" value="" checked /> None
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-evening" value="Before Food" /> Before
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-evening" value="After Food" /> After
                      </label>
                    </div>
                  </div>
                  <!-- Night -->
                  <div class="rx-timing-row">
                    <span class="rx-timing-label">Night</span>
                    <div class="rx-radio-group">
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-night" value="" checked /> None
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-night" value="Before Food" /> Before
                      </label>
                      <label class="rx-radio-label">
                        <input type="radio" name="rx-night" value="After Food" /> After
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="rx-form-row">
                <div class="rx-form-group duration-num-group" style="flex: 1;">
                  <label class="rx-label" for="rx-duration">Duration</label>
                  <input type="number" id="rx-duration" value="7" min="1" required />
                </div>
                <div class="rx-form-group duration-unit-group" style="flex: 1;">
                  <label class="rx-label" for="rx-duration-unit">&nbsp;</label>
                  <select id="rx-duration-unit">
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
              </div>

              <div class="rx-form-group">
                <label class="rx-label" for="rx-notes">Notes (Optional)</label>
                <textarea id="rx-notes" placeholder="Take with food..."></textarea>
              </div>

              <button type="submit" class="rx-submit-btn">
                ${getIcon('plus', 'rx-btn-icon')}
                <span>Add Medicine</span>
              </button>
            </form>
          </div>

          <!-- Right: Current Prescription Table Card -->
          <div class="rx-card rx-table-card">
            <div class="rx-table-header">
              <h3 class="rx-card-title">Current Prescription</h3>
              <span class="rx-items-count-badge">${items.length} items</span>
            </div>
            
            <div class="rx-table-container">
              <table class="rx-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Sig</th>
                    <th>Duration</th>
                    <th>Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsHTML || `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 40px 0;">No medications added to this prescription yet.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Footer Actions bar -->
        <div class="rx-footer-actions">
          <button class="rx-btn-secondary" id="rx-save-draft">Save Draft</button>
          <button class="rx-btn-primary" id="rx-send">
            ${getIcon('chevron-right', 'rx-send-icon')}
            <span>Send to Pharmacy</span>
          </button>
        </div>

      </div>
    `;
  }

  public onMount(container: HTMLElement, router: Router): void {
    const patientId = this.currentPatientId;

    // Dynamically auto-generate Frequency based on radio buttons
    const updateFrequencyField = () => {
      const freqInput = container.querySelector('#rx-frequency') as HTMLInputElement;
      if (!freqInput) return;

      const morningRadio = container.querySelector('input[name="rx-morning"]:checked') as HTMLInputElement;
      const lunchRadio = container.querySelector('input[name="rx-lunch"]:checked') as HTMLInputElement;
      const eveningRadio = container.querySelector('input[name="rx-evening"]:checked') as HTMLInputElement;
      const nightRadio = container.querySelector('input[name="rx-night"]:checked') as HTMLInputElement;

      const parts: string[] = [];
      if (morningRadio && morningRadio.value) {
        parts.push(`Morning (${morningRadio.value})`);
      }
      if (lunchRadio && lunchRadio.value) {
        parts.push(`Lunch (${lunchRadio.value})`);
      }
      if (eveningRadio && eveningRadio.value) {
        parts.push(`Evening (${eveningRadio.value})`);
      }
      if (nightRadio && nightRadio.value) {
        parts.push(`Night (${nightRadio.value})`);
      }

      freqInput.value = parts.join(', ');
    };

    // Attach listeners to all the timing radios
    ['rx-morning', 'rx-lunch', 'rx-evening', 'rx-night'].forEach(name => {
      const radios = container.querySelectorAll(`input[name="${name}"]`);
      radios.forEach(radio => {
        radio.addEventListener('change', updateFrequencyField);
      });
    });

    // Form submission
    const form = container.querySelector('#rx-add-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nameInput = container.querySelector('#rx-name') as HTMLInputElement;
        const dosageInput = container.querySelector('#rx-dosage') as HTMLInputElement;
        const freqInput = container.querySelector('#rx-frequency') as HTMLInputElement;
        const durInput = container.querySelector('#rx-duration') as HTMLInputElement;
        const unitSelect = container.querySelector('#rx-duration-unit') as HTMLSelectElement;
        const notesInput = container.querySelector('#rx-notes') as HTMLTextAreaElement;

        const newRx: RxItem = {
          medicine_id: `temp-${Date.now()}`,
          name: nameInput.value,
          dosage: dosageInput.value,
          frequency: freqInput.value,
          duration: parseInt(durInput.value) || 7,
          durationUnit: unitSelect.value,
          stockStatus: 'In Stock',
          notes: notesInput.value
        };

        // Add to active patient rxState
        if (!rxState[patientId]) {
          rxState[patientId] = [];
        }
        rxState[patientId].push(newRx);

        // Rerender view
        router.navigate('prescriptions', { patientId });
      });
    }

    // Delete item click handlers
    const deleteBtns = container.querySelectorAll('.rx-row-delete-btn');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const indexAttr = btn.getAttribute('data-index');
        if (indexAttr !== null) {
          const idx = parseInt(indexAttr);
          if (rxState[patientId]) {
            rxState[patientId].splice(idx, 1);
          }
          router.navigate('prescriptions', { patientId });
        }
      });
    });

    // Suggest Alt click
    const suggestBtns = container.querySelectorAll('.rx-suggest-alt-btn');
    suggestBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const indexAttr = btn.getAttribute('data-index');
        if (indexAttr !== null) {
          const idx = parseInt(indexAttr);
          const item = rxState[patientId][idx];
          alert(`Suggesting alternative medication for ${item.name}...`);
        }
      });
    });

    // Save Draft click
    const saveBtn = container.querySelector('#rx-save-draft');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        alert('Draft saved successfully!');
      });
    }

    // Send to Pharmacy click
    const sendBtn = container.querySelector('#rx-send');
    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        const currentItems = rxState[patientId];
        if (!currentItems || currentItems.length === 0) {
          alert('Please add at least one medication before sending to pharmacy.');
          return;
        }

        try {
          // 1. Actually persist the prescription to Supabase via backend
          await sendPrescriptionToPharmacy({
            patient_id: patientId,
            items: currentItems.map(item => ({
              name: item.name,
              dosage: item.dosage,
              frequency: item.frequency,
              duration: item.duration,
              quantity: item.duration // Use duration as quantity
            }))
          });

          // 2. Clear local rxState after successful save
          delete rxState[patientId];

          // 3. Fetch patient info for the success modal
          const patient = await fetchProfileById(patientId);

          // 4. Show the success modal
          const modal = document.createElement('div');
          modal.className = 'rx-prompt-modal-overlay';
          modal.innerHTML = `
            <div class="rx-prompt-modal">
              <div class="rx-prompt-header">
                <div class="rx-prompt-success-icon">✓</div>
                <h3>Prescription Sent!</h3>
                <p>The prescription has been successfully sent to the pharmacy. What would you like to do next for ${patient.full_name}?</p>
              </div>
              <div class="rx-prompt-actions">
                <button class="rx-prompt-btn btn-schedule" id="rx-prompt-schedule">
                  <span class="btn-icon">📅</span>
                  <span>Schedule Next Appointment</span>
                </button>
                <button class="rx-prompt-btn btn-complete" id="rx-prompt-complete">
                  <span class="btn-icon">✓</span>
                  <span>Treatment Complete</span>
                </button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          // Bind modal buttons
          const scheduleBtn = modal.querySelector('#rx-prompt-schedule');
          if (scheduleBtn) {
            scheduleBtn.addEventListener('click', () => {
              modal.remove();
              router.navigate('schedule');
            });
          }

          const completeBtn = modal.querySelector('#rx-prompt-complete');
          if (completeBtn) {
            completeBtn.addEventListener('click', async () => {
              try {
                await completeAppointmentForPatient(patientId);
              } catch (err) {
                console.error('Failed to complete appointment via API:', err);
              }
              modal.remove();
              router.navigate('patient-profile', { patientId });
            });
          }
        } catch (err) {
          console.error('Failed to send prescription to pharmacy:', err);
          alert('Failed to send prescription to pharmacy. Please check your connection and try again.');
        }
      });
    }
  }
}
