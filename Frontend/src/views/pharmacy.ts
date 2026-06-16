import { type View, Router } from '../router';
import { getIcon } from '../assets/icons';
import {
  fetchPharmacyData,
  fulfillPrescription,
  requestAlternativePrescription,
  restockMedicine
} from '../api';
import type { MedicineInventory } from '../types';

let inventoryFilter: 'all' | 'high' | 'low' = 'all';
let inventorySearchQuery: string = '';

function showOverlayAlert(title: string, message: string, type: 'success' | 'error' | 'info' = 'info', callback?: () => void) {
  const overlay = document.createElement('div');
  overlay.className = 'rx-prompt-modal-overlay';

  let iconHtml = 'ⓘ';
  let iconBg = '#3b82f6';
  if (type === 'success') {
    iconHtml = '✓';
    iconBg = '#10b981';
  } else if (type === 'error') {
    iconHtml = '✕';
    iconBg = '#ef4444';
  }

  overlay.innerHTML = `
    <div class="rx-prompt-modal" style="text-align: center; padding: 32px 24px; max-width: 400px; width: 90%; border-radius: 16px; background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
      <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${iconBg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 16px auto; box-shadow: 0 4px 12px ${iconBg}40;">
        ${iconHtml}
      </div>
      <h3 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #1e293b;">${title}</h3>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.5;">${message}</p>
      <button class="rx-prompt-btn" style="background: var(--primary-blue-light); color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: all 0.2s;" id="overlay-alert-ok-btn">OK</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const okBtn = overlay.querySelector('#overlay-alert-ok-btn');
  if (okBtn) {
    okBtn.addEventListener('click', () => {
      overlay.remove();
      if (callback) callback();
    });
  }
}

function showOverlayPrompt(title: string, message: string, placeholder: string, callback: (value: string | null) => void) {
  const overlay = document.createElement('div');
  overlay.className = 'rx-prompt-modal-overlay';

  overlay.innerHTML = `
    <div class="rx-prompt-modal" style="padding: 24px; max-width: 400px; width: 90%; border-radius: 16px; background: #ffffff; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
      <h3 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #1e293b;">${title}</h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #64748b; line-height: 1.4;">${message}</p>
      <textarea id="overlay-prompt-input" placeholder="${placeholder}" style="width: 100%; height: 80px; padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-family: var(--font-sans); font-size: 13px; margin-bottom: 20px; resize: none; outline: none; box-sizing: border-box;"></textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="rx-prompt-btn btn-complete" style="padding: 10px 20px; border-radius: 8px;" id="overlay-prompt-cancel-btn">Cancel</button>
        <button class="rx-prompt-btn" style="background: var(--primary-blue-light); color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s;" id="overlay-prompt-submit-btn">Submit</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const textarea = overlay.querySelector('#overlay-prompt-input') as HTMLTextAreaElement;
  textarea.focus();

  const cancelBtn = overlay.querySelector('#overlay-prompt-cancel-btn');
  cancelBtn?.addEventListener('click', () => {
    overlay.remove();
    callback(null);
  });

  const submitBtn = overlay.querySelector('#overlay-prompt-submit-btn');
  submitBtn?.addEventListener('click', () => {
    const val = textarea.value.trim();
    overlay.remove();
    callback(val);
  });
}

export class PharmacyView implements View {
  public async render(): Promise<string> {
    // 1. Fetch aggregated data from backend /pharmacy endpoint
    let prescriptions: any[] = [];
    let inventory: MedicineInventory[] = [];

    try {
      const data = await fetchPharmacyData();
      prescriptions = data.prescriptions;
      inventory = data.inventory;
    } catch (err) {
      console.error('Error loading pharmacy data:', err);
    }

    // 2. Render Incoming Prescriptions Section
    const rxCardsHTML = prescriptions.map(rx => {
      // Generate items HTML list from pre-joined array
      const itemsHTML = rx.items.map((item: any) => {
        const stockClass = item.inStock ? 'stock-ok' : 'stock-low';
        const stockText = item.inStock ? 'Available' : 'Out of Stock';

        return `
          <div class="rx-item-row">
            <div class="rx-item-info">
              <span class="rx-item-name">${item.medicine_name}</span>
              <span class="rx-item-dosage">${item.dosage}</span>
            </div>
            <div class="rx-item-qty">Qty: ${item.quantity}</div>
            <div class="rx-item-stock-status ${stockClass}">${stockText}</div>
          </div>
        `;
      }).join('');

      let statusLabel = '';
      let statusClass = '';
      if (rx.status === 'pushed_to_pharma') {
        statusLabel = 'Incoming';
        statusClass = 'incoming';
      } else if (rx.status === 'alternative_requested') {
        statusLabel = 'Alt Requested';
        statusClass = 'alt-requested';
      } else if (rx.status === 'pending_check') {
        statusLabel = 'Pending';
        statusClass = 'pending';
      } else if (rx.status === 'fulfilled') {
        statusLabel = 'Fulfilled';
        statusClass = 'fulfilled';
      }

      const isFulfillable = rx.status !== 'fulfilled' && rx.allInStock;
      const isAltRequestable = rx.status !== 'fulfilled' && rx.status !== 'alternative_requested';

      return `
        <div class="rx-pharma-card rx-status-${rx.status}" data-rx-id="${rx.id}">
          <div class="rx-pharma-card-header">
            <div class="rx-pharma-card-title">
              <h4>${rx.patient_name}</h4>
              <span class="rx-doctor-tag">Dr. ${rx.doctor_name.replace('Dr. ', '')}</span>
            </div>
            <span class="rx-status-badge ${statusClass}">${statusLabel}</span>
          </div>

          <div class="rx-pharma-items">
            ${itemsHTML || '<div class="rx-no-items">No items in prescription.</div>'}
          </div>

          ${rx.doctor_comments ? `
            <div class="rx-pharma-comments">
              <strong>Comments:</strong> ${rx.doctor_comments}
            </div>
          ` : ''}

          ${rx.status !== 'fulfilled' ? `
            <div class="rx-pharma-card-actions">
              <button class="rx-pharma-btn btn-fulfill" ${!isFulfillable ? 'disabled' : ''} data-rx-id="${rx.id}">
                Fulfill Order
              </button>
              ${isAltRequestable ? `
                <button class="rx-pharma-btn btn-alt-req" data-rx-id="${rx.id}">
                  Request Alt
                </button>
              ` : ''}
            </div>
          ` : `
            <div class="rx-pharma-fulfilled-note">
              ${getIcon('check-circle', 'fulfilled-icon')} Prescribed order completed
            </div>
          `}
        </div>
      `;
    }).join('');

    // Filter inventory based on inventoryFilter and search query
    const filteredInventory = inventory.filter(med => {
      const isLow = med.current_stock <= med.reorder_threshold;

      let matchesFilter = true;
      if (inventoryFilter === 'low') {
        matchesFilter = isLow;
      } else if (inventoryFilter === 'high') {
        matchesFilter = !isLow;
      }

      let matchesSearch = true;
      if (inventorySearchQuery.trim()) {
        const query = inventorySearchQuery.toLowerCase().trim();
        matchesSearch = med.medicine_name.toLowerCase().includes(query);
      }

      return matchesFilter && matchesSearch;
    });

    // 3. Render Inventory Stock Section
    const inventoryHTML = filteredInventory.map(med => {
      const isLow = med.current_stock <= med.reorder_threshold;
      const rowClass = isLow ? 'inventory-row-low' : '';
      const progressPercent = Math.min(100, (med.current_stock / 200) * 100); // 200 max capacity estimate

      return `
        <tr class="${rowClass}" data-med-id="${med.id}">
          <td>
            <div class="med-inventory-name">
              <strong>${med.medicine_name}</strong>
              ${isLow ? `<span class="low-stock-alert-tag">Low Stock</span>` : ''}
            </div>
          </td>
          <td>
            <div class="med-inventory-progress">
              <div class="med-progress-bar" style="width: ${progressPercent}%; background-color: ${isLow ? '#ef4444' : '#10b981'}"></div>
            </div>
            <span class="med-stock-text">${med.current_stock} / 200 units</span>
          </td>
          <td>${med.reorder_threshold} units</td>
          <td>
            <button class="rx-inventory-restock-btn" data-med-id="${med.id}">
              Restock (+100)
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- Main Content Container -->
      <div class="page-content">
        
        <header class="main-header">
          <div class="header-title-section">
            <h1 class="header-title">Pharmacy Panel</h1>
            <span class="header-subtitle">Process incoming prescriptions and restock medicine inventory</span>
          </div>
          <div class="header-actions" style="display: flex; gap: 8px; align-items: center;">
            <button class="btn-primary" id="refresh-pharma-data">
              ${getIcon('activity', 'nav-icon')}
              <span>Refresh Panel</span>
            </button>
            <button class="btn-secondary" id="switch-to-doctor-portal" style="display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); background: #ffffff; color: var(--text-muted); cursor: pointer; padding: 10px 16px; border-radius: 8px; font-weight: 500; transition: all 0.2s;">
              ${getIcon('log-out', 'nav-icon')}
              <span>Switch to Doctor Portal</span>
            </button>
          </div>
        </header>

        <div class="rx-pharma-layout">
          <!-- Left: Incoming Prescriptions -->
          <div class="rx-pharma-section rx-prescriptions-section">
            <h3 class="pharma-section-title">Incoming Prescriptions</h3>
            <div class="rx-pharma-grid">
              ${rxCardsHTML || `
                <div class="rx-empty-state">
                  <span class="empty-icon">💊</span>
                  <p>No active prescriptions fetched from the database.</p>
                </div>
              `}
            </div>
          </div>

          <!-- Right: Stock Inventory -->
          <div class="rx-pharma-section rx-inventory-section">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px;">
              <h3 class="pharma-section-title" style="margin: 0;">Medicine Inventory</h3>
              <div style="display: flex; gap: 8px; align-items: center;">
                <div class="rx-input-with-icon" style="margin: 0; padding: 4px 10px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; display: inline-flex; align-items: center; gap: 6px; box-sizing: border-box;">
                  ${getIcon('search', 'rx-search-icon')}
                  <input type="text" id="inventory-search-input" value="${inventorySearchQuery}" placeholder="Search medicine..." style="border: none; outline: none; font-size: 12px; font-family: var(--font-sans); color: #475569; width: 140px; background: transparent; padding: 2px 0;" />
                </div>
                <select id="inventory-stock-filter" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 600; color: #475569; background: #ffffff; outline: none; cursor: pointer; font-family: var(--font-sans);">
                  <option value="all" ${inventoryFilter === 'all' ? 'selected' : ''}>All Stock</option>
                  <option value="high" ${inventoryFilter === 'high' ? 'selected' : ''}>In Stock</option>
                  <option value="low" ${inventoryFilter === 'low' ? 'selected' : ''}>Low/Out of Stock</option>
                </select>
              </div>
            </div>
            <div class="rx-pharma-card rx-inventory-card">
              <div class="rx-table-container">
                <table class="rx-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Stock Level</th>
                      <th>Reorder Point</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${inventoryHTML || `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 40px 0;">No stock details available.</td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  public onMount(container: HTMLElement, router: Router): void {
    // Refresh button click
    const refreshBtn = container.querySelector('#refresh-pharma-data');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        router.navigate('pharmacy');
      });
    }

    // Switch to Doctor Portal button click
    const switchBtn = container.querySelector('#switch-to-doctor-portal');
    if (switchBtn) {
      switchBtn.addEventListener('click', () => {
        router.navigate('dashboard');
      });
    }

    // Fulfill click handlers
    const fulfillBtns = container.querySelectorAll('.btn-fulfill');
    fulfillBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const rxId = btn.getAttribute('data-rx-id');
        if (rxId) {
          try {
            await fulfillPrescription(rxId);
            showOverlayAlert('Success', 'Prescription successfully fulfilled and stock deducted.', 'success', () => {
              router.navigate('pharmacy');
            });
          } catch (err) {
            console.error('Fulfillment error:', err);
            showOverlayAlert('Error', 'Failed to fulfill prescription order.', 'error');
          }
        }
      });
    });

    // Request alternative click handlers
    const altReqBtns = container.querySelectorAll('.btn-alt-req');
    altReqBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rxId = btn.getAttribute('data-rx-id');
        if (rxId) {
          showOverlayPrompt(
            'Request Alternative',
            'Enter a comment/reason for requesting alternative medication:',
            'Please check for alternatives due to stock constraints.',
            (reason) => {
              if (reason !== null) {
                requestAlternativePrescription(rxId, reason || 'Please check for alternatives due to stock constraints.').then(() => {
                  showOverlayAlert('Success', 'Alternative request successfully submitted to the physician.', 'success', () => {
                    router.navigate('pharmacy');
                  });
                }).catch(err => {
                  console.error('Alternative request error:', err);
                  showOverlayAlert('Error', 'Failed to request alternative.', 'error');
                });
              }
            }
          );
        }
      });
    });

    // Restock stock level handlers
    const restockBtns = container.querySelectorAll('.rx-inventory-restock-btn');
    restockBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const medId = btn.getAttribute('data-med-id');
        if (medId) {
          try {
            await restockMedicine(medId, 100);
            router.navigate('pharmacy');
          } catch (err) {
            console.error('Restocking error:', err);
            showOverlayAlert('Error', 'Failed to restock medicine.', 'error');
          }
        }
      });
    });

    // Handle inventory stock filter change
    const filterSelect = container.querySelector('#inventory-stock-filter') as HTMLSelectElement;
    const searchInput = container.querySelector('#inventory-search-input') as HTMLInputElement;
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        inventoryFilter = target.value as 'all' | 'high' | 'low';
        if (searchInput) {
          inventorySearchQuery = searchInput.value;
        }
        router.navigate('pharmacy');
      });
    }

    // Handle inventory stock search
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        const query = target.value.toLowerCase().trim();
        inventorySearchQuery = target.value;

        const rows = container.querySelectorAll('.rx-inventory-card tbody tr');
        rows.forEach(row => {
          const medNameEl = row.querySelector('.med-inventory-name strong');
          if (medNameEl) {
            const medName = medNameEl.textContent?.toLowerCase() || '';
            const matchesQuery = medName.includes(query);

            const isLow = row.classList.contains('inventory-row-low');
            let matchesStatus = true;
            if (inventoryFilter === 'low') {
              matchesStatus = isLow;
            } else if (inventoryFilter === 'high') {
              matchesStatus = !isLow;
            }

            if (matchesQuery && matchesStatus) {
              (row as HTMLElement).style.display = '';
            } else {
              (row as HTMLElement).style.display = 'none';
            }
          }
        });
      });

      searchInput.addEventListener('blur', (e) => {
        const target = e.target as HTMLInputElement;
        inventorySearchQuery = target.value;
      });
    }
  }
}
