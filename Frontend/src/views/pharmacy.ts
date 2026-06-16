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

    // Filter inventory based on inventoryFilter
    const filteredInventory = inventory.filter(med => {
      const isLow = med.current_stock <= med.reorder_threshold;
      if (inventoryFilter === 'low') {
        return isLow;
      } else if (inventoryFilter === 'high') {
        return !isLow;
      }
      return true;
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
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
              <h3 class="pharma-section-title">Medicine Inventory</h3>
              <select id="inventory-stock-filter" style="padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 12px; font-weight: 600; color: #475569; background: #ffffff; outline: none; cursor: pointer; font-family: var(--font-sans);">
                <option value="all" ${inventoryFilter === 'all' ? 'selected' : ''}>All Stock</option>
                <option value="high" ${inventoryFilter === 'high' ? 'selected' : ''}>In Stock</option>
                <option value="low" ${inventoryFilter === 'low' ? 'selected' : ''}>Low/Out of Stock</option>
              </select>
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
            alert('Prescription successfully fulfilled and stock deducted.');
            router.navigate('pharmacy');
          } catch (err) {
            console.error('Fulfillment error:', err);
            alert('Failed to fulfill prescription order.');
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
          const reason = prompt('Enter a comment/reason for requesting alternative medication:');
          if (reason !== null) {
            requestAlternativePrescription(rxId, reason || 'Please check for alternatives due to stock constraints.').then(() => {
              alert('Alternative request successfully submitted to the physician.');
              router.navigate('pharmacy');
            }).catch(err => {
              console.error('Alternative request error:', err);
              alert('Failed to request alternative.');
            });
          }
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
            alert('Failed to restock medicine.');
          }
        }
      });
    });

    // Handle inventory stock filter change
    const filterSelect = container.querySelector('#inventory-stock-filter') as HTMLSelectElement;
    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        inventoryFilter = target.value as 'all' | 'high' | 'low';
        router.navigate('pharmacy');
      });
    }
  }
}
