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
let activeTab: 'prescriptions' | 'history' = 'prescriptions';
let selectedPrescriptionId: string | null = null;

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
    <div class="rx-prompt-modal" style="text-align: center; padding: 32px 24px; max-width: 400px; width: 90%; border-radius: 16px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <div style="width: 48px; height: 48px; border-radius: 50%; background-color: ${iconBg}; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin: 0 auto 16px auto; box-shadow: 0 4px 12px ${iconBg}40;">
        ${iconHtml}
      </div>
      <h3 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #ffffff;">${title}</h3>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">${message}</p>
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
    <div class="rx-prompt-modal" style="padding: 24px; max-width: 400px; width: 90%; border-radius: 16px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
      <h3 style="margin: 0 0 8px 0; font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: #ffffff;">${title}</h3>
      <p style="margin: 0 0 16px 0; font-size: 13px; color: #94a3b8; line-height: 1.4;">${message}</p>
      <textarea id="overlay-prompt-input" placeholder="${placeholder}" style="width: 100%; height: 80px; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: #ffffff; font-family: var(--font-sans); font-size: 13px; margin-bottom: 20px; resize: none; outline: none; box-sizing: border-box;"></textarea>
      <div style="display: flex; gap: 8px; justify-content: flex-end;">
        <button class="rx-prompt-btn btn-complete" style="padding: 10px 20px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: #e2e8f0; cursor: pointer;" id="overlay-prompt-cancel-btn">Cancel</button>
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

    // Split prescriptions into Active/Incoming and Fulfilled (History)
    const activePrescriptions = prescriptions.filter(rx => rx.status !== 'fulfilled');
    const historyPrescriptions = prescriptions.filter(rx => rx.status === 'fulfilled');

    // Default selectedPrescriptionId if not set or invalid
    const currentTabPrescriptions = activeTab === 'prescriptions' ? activePrescriptions : (activeTab === 'history' ? historyPrescriptions : []);
    let selectedRx = prescriptions.find(rx => rx.id === selectedPrescriptionId);
    if (!selectedRx && currentTabPrescriptions.length > 0) {
      selectedRx = currentTabPrescriptions[0];
      selectedPrescriptionId = selectedRx.id;
    }

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

    // Determine the content view HTML based on the activeTab
    let contentHTML = '';

    if (activeTab === 'prescriptions') {
      contentHTML = `
        <div class="rx-pharma-layout-grid">
          <!-- Left Column: Today's Prescriptions -->
          <div class="rx-pharma-section rx-prescriptions-list-col">
            <h3 class="pharma-section-title">Today's Prescriptions</h3>
            <div class="rx-pharma-list">
              ${activePrescriptions.map(rx => {
                const isSelected = rx.id === selectedPrescriptionId;
                
                let statusLabel = 'PENDING';
                let statusClass = 'pending';
                if (rx.status === 'alternative_requested') {
                  statusLabel = 'ALT REQUESTED';
                  statusClass = 'alt-requested';
                } else if (rx.status === 'pending_check') {
                  statusLabel = 'PENDING CHECK';
                  statusClass = 'pending';
                }

                const itemsPreview = rx.items.map((item: any) => `${item.medicine_name} (${item.quantity})`).join(', ');

                return `
                  <div class="rx-list-card ${isSelected ? 'active-rx' : ''}" data-rx-id="${rx.id}">
                    <div class="rx-list-card-header">
                      <div>
                        <h4>${rx.patient_name}</h4>
                        <span class="doctor-subtext">Dr. ${rx.doctor_name.replace('Dr. ', '')}</span>
                      </div>
                      <span class="rx-status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <div class="rx-list-card-preview">
                      ${itemsPreview}
                    </div>
                  </div>
                `;
              }).join('') || `
                <div class="rx-empty-state">
                  <span class="empty-icon">💊</span>
                  <p>No active prescriptions today.</p>
                </div>
              `}
            </div>
          </div>

          <!-- Right Column: Top: Selected Detail, Bottom: Medicine Inventory -->
          <div class="rx-pharma-section rx-details-col">
            <!-- Prescription Details Card -->
            <div class="rx-details-card">
              <h3 class="rx-details-card-title">Prescription Details</h3>
              ${selectedRx ? `
                <div class="rx-details-content">
                  <div class="rx-details-top-header">
                    <div>
                      <h2>${selectedRx.patient_name}</h2>
                      <span class="doctor-lead-text">
                        Prescribed by: <strong>Dr. ${selectedRx.doctor_name.replace('Dr. ', '')}</strong>
                      </span>
                    </div>
                    <div style="text-align: right;">
                      <span style="font-size: 11px; color: #94a3b8; display: block; text-transform: uppercase;">Status</span>
                      <span class="rx-status-badge ${selectedRx.status === 'alternative_requested' ? 'alt-requested' : (selectedRx.status === 'fulfilled' ? 'fulfilled' : 'pending')}" style="margin-top: 4px; display: inline-block;">
                        ${selectedRx.status === 'alternative_requested' ? 'ALT REQUESTED' : (selectedRx.status === 'fulfilled' ? 'FULFILLED' : 'PENDING')}
                      </span>
                    </div>
                  </div>

                  <div class="rx-details-items-section">
                    <h4>Prescribed Medications</h4>
                    <div class="rx-details-items-list">
                      ${selectedRx.items.map((item: any) => {
                        const stockClass = item.inStock ? 'status-dot green' : 'status-dot red';
                        const stockText = item.inStock ? 'Available' : `Low Stock (${item.current_stock} available)`;
                        return `
                          <div class="rx-details-item-row">
                            <div>
                              <strong>${item.medicine_name}</strong>
                              <span>${item.dosage}</span>
                            </div>
                            <div style="text-align: right;">
                              <span class="qty-text">Qty: ${item.quantity}</span>
                              <span class="stock-indicator-text" style="color: ${item.inStock ? '#10b981' : '#ef4444'};">
                                <span class="${stockClass}"></span>
                                ${stockText}
                              </span>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>

                  ${selectedRx.doctor_comments ? `
                    <div class="rx-details-notes">
                      <strong>Doctor Comments / Notes</strong>
                      <p>"${selectedRx.doctor_comments}"</p>
                    </div>
                  ` : ''}

                  <div class="rx-details-actions">
                    ${selectedRx.status !== 'fulfilled' ? `
                      <button class="rx-pharma-btn btn-fulfill" ${!selectedRx.allInStock ? 'disabled' : ''} data-rx-id="${selectedRx.id}">
                        ${getIcon('check-circle', 'nav-icon')}
                        <span>Fulfill Prescription</span>
                      </button>
                      ${selectedRx.status !== 'alternative_requested' ? `
                        <button class="rx-pharma-btn btn-alt-req" data-rx-id="${selectedRx.id}">
                          Request Alternative
                        </button>
                      ` : ''}
                    ` : `
                      <div class="rx-pharma-fulfilled-banner">
                        ${getIcon('check-circle', 'fulfilled-icon')}
                        <span>Prescribed order completed and successfully fulfilled</span>
                      </div>
                    `}
                  </div>
                </div>
              ` : `
                <div class="rx-empty-state">
                  <p>Select a prescription from the left column to view details.</p>
                </div>
              `}
            </div>

            <!-- Medicine Inventory (Right Bottom) -->
            <div class="rx-details-card rx-inventory-block">
              <div class="rx-inventory-block-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; flex-wrap: wrap; gap: 12px;">
                <div>
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #0f172a;">Medicine Inventory</h3>
                  <span style="font-size: 12px; color: #64748b;">Short on stock? Restock instantly</span>
                </div>
                <div class="rx-search-filter-controls" style="display: flex; gap: 12px; align-items: center;">
                  <!-- Search Input -->
                  <div class="rx-search-input-wrapper" style="background: #ffffff; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 8px; width: 180px;">
                    ${getIcon('search', 'nav-icon')}
                    <input type="text" id="inventory-search-input" value="${inventorySearchQuery}" placeholder="Search..." style="background: transparent; border: none; outline: none; font-size: 13px; color: #1e293b; width: 100%; font-family: var(--font-sans);" />
                  </div>
                  <!-- Filter Dropdown -->
                  <select id="inventory-stock-filter" style="background: #ffffff; color: #475569; padding: 6px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; cursor: pointer; font-family: var(--font-sans);">
                    <option value="all" ${inventoryFilter === 'all' ? 'selected' : ''}>All Stock</option>
                    <option value="high" ${inventoryFilter === 'high' ? 'selected' : ''}>In Stock</option>
                    <option value="low" ${inventoryFilter === 'low' ? 'selected' : ''}>Low/Out</option>
                  </select>
                </div>
              </div>
              <div class="rx-table-container full-inventory-table">
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
                    ${filteredInventory.map(med => {
                      const isLow = med.current_stock <= med.reorder_threshold;
                      const progressPercent = Math.min(100, (med.current_stock / 200) * 100);
                      return `
                        <tr class="${isLow ? 'inventory-row-low' : ''}">
                          <td>
                            <div class="med-inventory-name-cell">
                              <span class="status-dot ${isLow ? 'red' : 'green'}"></span>
                              <strong>${med.medicine_name}</strong>
                              ${isLow ? `<span class="low-stock-alert-tag">Low Stock</span>` : ''}
                            </div>
                          </td>
                          <td>
                            <div class="stock-progress-bar">
                              <div class="progress-fill" style="width: ${progressPercent}%; background: ${isLow ? '#ef4444' : '#10b981'};"></div>
                            </div>
                            <span class="stock-count-label">${med.current_stock} / 200 units</span>
                          </td>
                          <td style="color: #475569;">${med.reorder_threshold} units</td>
                          <td>
                            <button class="rx-inventory-restock-btn btn-action" data-med-id="${med.id}">
                              +100
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('') || `
                      <tr>
                        <td colspan="4" style="text-align: center; color: #94a3b8; padding: 40px 0;">No matching inventory details available.</td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === 'history') {
      contentHTML = `
        <div class="rx-pharma-section rx-history-section-full">
          <h3 class="pharma-section-title">Fulfillment History</h3>
          <div class="rx-details-card">
            <div class="rx-table-container">
              <table class="rx-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Medications</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${historyPrescriptions.map(rx => {
                    const medsList = rx.items.map((i: any) => `${i.medicine_name} (${i.quantity})`).join(', ');
                    return `
                      <tr>
                        <td>
                          <strong style="color: #0f172a; font-size: 14px;">${rx.patient_name}</strong>
                        </td>
                        <td style="color: #475569;">Dr. ${rx.doctor_name}</td>
                        <td style="color: #64748b; max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${medsList}</td>
                        <td>
                          <span class="rx-status-badge fulfilled">FULFILLED</span>
                        </td>
                      </tr>
                    `;
                  }).join('') || `
                    <tr>
                      <td colspan="4" style="text-align: center; color: #94a3b8; padding: 40px 0;">No prescriptions have been fulfilled yet.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <!-- Main Content Container -->
      <div class="page-content pharmacy-view-container">
        
        <header class="main-header">
          <div class="header-title-section" style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; flex-direction: row; align-items: center; gap: 12px;">
              <div class="brand-icon-wrapper" style="width: 36px; height: 36px; min-width: 36px; border-radius: 10px; background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%); display: flex; align-items: center; justify-content: center; color: var(--accent-cyan); border: 1px solid rgba(6, 182, 212, 0.3);">
                ${getIcon('activity', 'brand-icon')}
              </div>
              <h1 class="header-title" style="color: #ffffff; margin: 0; font-size: 20px; line-height: 1.2;">MASH Pharmacy Panel</h1>
            </div>
            <span class="header-subtitle" style="font-size: 13px; margin-left: 48px; color: rgba(255, 255, 255, 0.65);">Process incoming prescriptions and restock medicine inventory</span>
          </div>
          <div class="header-actions" style="display: flex; gap: 12px; align-items: center;">
            <button class="btn-secondary" id="refresh-pharma-data" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.1); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer; padding: 10px 16px; border-radius: 8px; font-weight: 500; transition: all 0.2s; font-size: 13px;">
              ${getIcon('activity', 'nav-icon')}
              <span>Refresh</span>
            </button>
            <button class="btn-primary" id="switch-to-doctor-portal" style="display: inline-flex; align-items: center; gap: 8px; background: #ffffff; color: #1e3a8a; border: none; cursor: pointer; padding: 10px 18px; border-radius: 8px; font-weight: 600; transition: all 0.2s; box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2); font-size: 13px;">
              ${getIcon('log-out', 'nav-icon')}
              <span>Doctor Portal</span>
            </button>
          </div>
        </header>

        <!-- Navigation Tabs -->
        <div class="pharma-tabs-bar">
          <button class="pharma-tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}" data-tab="prescriptions">
            <span>Prescriptions</span>
            <span class="pharma-badge-count">${activePrescriptions.length}</span>
          </button>
          <button class="pharma-tab-btn ${activeTab === 'history' ? 'active' : ''}" data-tab="history">
            <span>History</span>
          </button>
        </div>

        <!-- Render active tab's HTML -->
        <div class="pharma-tab-content-wrapper">
          ${contentHTML}
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

    // Tab switcher binding
    const tabBtns = container.querySelectorAll('.pharma-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as 'prescriptions' | 'history';
        if (tab) {
          activeTab = tab;
          // Reset inventory state query when switching tabs to avoid confusion
          if (tab !== 'prescriptions') {
            inventorySearchQuery = '';
            inventoryFilter = 'all';
          }
          router.navigate('pharmacy');
        }
      });
    });

    // Prescription card click binding
    const listCards = container.querySelectorAll('.rx-list-card');
    listCards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-rx-id');
        if (id) {
          selectedPrescriptionId = id;
          router.navigate('pharmacy');
        }
      });
    });

    // Fulfill click handlers
    const fulfillBtns = container.querySelectorAll('.btn-fulfill');
    fulfillBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const rxId = btn.getAttribute('data-rx-id');
        if (rxId) {
          try {
            await fulfillPrescription(rxId);
            showOverlayAlert('Success', 'Prescription successfully fulfilled and stock deducted.', 'success', () => {
              selectedPrescriptionId = null; // reset selected
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
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const medId = btn.getAttribute('data-med-id');
        if (medId) {
          try {
            await restockMedicine(medId, 100);
            showOverlayAlert('Success', 'Inventory successfully restocked with 100 units.', 'success', () => {
              router.navigate('pharmacy');
            });
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

        const rows = container.querySelectorAll('.full-inventory-table tbody tr');
        rows.forEach(row => {
          const medNameEl = row.querySelector('.med-inventory-name-cell strong');
          if (medNameEl) {
            const medName = medNameEl.textContent?.toLowerCase() || '';
            const matchesQuery = medName.includes(query);

            const isLow = row.classList.contains('inventory-row-low') || row.querySelector('.low-stock-alert-tag') !== null;
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
