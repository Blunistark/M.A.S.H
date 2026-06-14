import { type View, Router } from '../router';
import { mockPatients, initialMetrics, type Patient } from '../mockData';
import { getIcon } from '../assets/icons';

// Internal state to hold session appointments
let queuePatients = [...mockPatients];
let metrics = { ...initialMetrics };

export class DashboardView implements View {
  public render(): string {
    // Generate patient rows
    const tableRows = queuePatients.map(patient => {
      // Determine status pill color class
      let statusClass = 'waiting';
      if (patient.status === 'In Progress') {
        statusClass = 'in-progress';
      } else if (patient.status === 'Done') {
        statusClass = 'done';
      }

      // Determine avatar initials class based on ID
      const avatarClass = `avatar-${patient.initials.toLowerCase()}`;

      return `
        <tr class="patient-row-btn" data-patient-id="${patient.id}">
          <td>
            <div class="patient-cell">
              <div class="patient-initials-avatar ${avatarClass}">
                ${patient.initials}
              </div>
              <span class="patient-name-bold">${patient.name}</span>
            </div>
          </td>
          <td>${patient.time || '12:00 PM'}</td>
          <td>
            <span class="status-pill ${statusClass}">${patient.status || 'Waiting'}</span>
          </td>
          <td>
            <button class="action-info-btn" data-patient-id="${patient.id}">
              ${getIcon('info', 'nav-icon')}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!-- Header -->
      <header class="main-header">
        <div class="header-title-section">
          <h1 class="header-title">Good morning, Dr. Smith</h1>
          <span class="header-subtitle">Sunday, June 14, 2026</span>
        </div>
        <div class="header-actions">
          <button class="btn-primary" id="open-appointment-btn">
            ${getIcon('plus', 'nav-icon')}
            <span>New Appointment</span>
          </button>
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

      <!-- Main Dashboard Grid -->
      <div class="page-content">
        <!-- Metrics Cards -->
        <section class="metrics-grid">
          <!-- Card 1: Today's Appointments -->
          <div class="metric-card metric-appointments">
            <div class="metric-card-content">
              <span class="metric-label">Today's Appointments</span>
              <div class="metric-number-row">
                <span class="metric-value">${metrics.todayAppointmentsCount}</span>
                <span class="metric-badge green">${metrics.remainingAppointmentsCount} Remaining</span>
              </div>
            </div>
            <div class="metric-icon-wrapper">
              ${getIcon('calendar', 'nav-icon')}
            </div>
          </div>

          <!-- Card 2: Pending Reschedules -->
          <div class="metric-card metric-reschedules">
            <div class="metric-card-content">
              <span class="metric-label">Pending Reschedules</span>
              <div class="metric-number-row">
                <span class="metric-value">${metrics.pendingReschedulesCount}</span>
              </div>
            </div>
            <div class="metric-icon-wrapper">
              ${getIcon('clock', 'nav-icon')}
            </div>
          </div>

          <!-- Card 3: Notifications -->
          <div class="metric-card metric-notifications">
            <div class="metric-card-content">
              <span class="metric-label">Notifications</span>
              <div class="metric-number-row">
                <span class="metric-value">${metrics.notificationsCount}</span>
                <span class="metric-badge green">New alerts</span>
              </div>
            </div>
            <div class="metric-icon-wrapper">
              ${getIcon('bell', 'nav-icon')}
            </div>
          </div>

          <!-- Card 4: Stock Alerts -->
          <div class="metric-card metric-stock">
            <div class="metric-card-content">
              <span class="metric-label">Stock Alerts</span>
              <div class="metric-number-row">
                <span class="metric-value">${metrics.stockAlertsCount}</span>
                <span class="metric-badge red">Low Stock</span>
              </div>
            </div>
            <div class="metric-icon-wrapper">
              ${getIcon('box', 'nav-icon')}
            </div>
          </div>
        </section>

        <!-- Main Cards Grid Layout -->
        <div class="dashboard-grid">
          
          <!-- Column Left: Today's Patient Queue -->
          <section class="dashboard-card">
            <div class="card-header">
              <h2 class="card-title">Today's Patient Queue</h2>
              <a href="#" class="card-header-link" id="view-all-patients">View All</a>
            </div>
            <div class="queue-table-container">
              <table class="queue-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="queue-table-body">
                  ${tableRows}
                </tbody>
              </table>
            </div>
          </section>

          <!-- Column Right: Calendar & Upcoming Patient -->
          <aside class="dashboard-sidebar-column">
            
            <!-- Card Calendar Widget -->
            <div class="dashboard-card calendar-card">
              <div class="card-header">
                <h2 class="card-title">Calendar Widget</h2>
                <div class="calendar-navigation">
                  <button class="calendar-arrow-btn">${getIcon('chevron-left', 'nav-icon')}</button>
                  <button class="calendar-arrow-btn">${getIcon('chevron-right', 'nav-icon')}</button>
                </div>
              </div>
              <div class="calendar-body">
                <div class="calendar-days-header">
                  <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                </div>
                <div class="calendar-days-grid">
                  <div class="calendar-day">28</div>
                  <div class="calendar-day">29</div>
                  <div class="calendar-day">30</div>
                  <div class="calendar-day current-month">1</div>
                  <div class="calendar-day current-month">2</div>
                  <div class="calendar-day current-month active has-event">3</div>
                  <div class="calendar-day current-month">4</div>
                </div>
                <div class="upcoming-today-section">
                  <div class="upcoming-section-title">Upcoming Today</div>
                  <div class="upcoming-events-list">
                    <div class="upcoming-event-item">
                      <div class="event-time">13:00</div>
                      <div class="event-details">
                        <span class="event-title">Dr. Consult Board</span>
                        <span class="event-location">Room 4B</span>
                      </div>
                    </div>
                    <div class="upcoming-event-item" style="border-left-color: var(--accent-cyan);">
                      <div class="event-time">14:30</div>
                      <div class="event-details">
                        <span class="event-title">Patient Follow-up</span>
                        <span class="event-location">Telehealth</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Upcoming Patient -->
            <div class="dashboard-card upcoming-patient-card">
              <h2 class="card-title" style="margin-bottom: 12px;">Upcoming Patient</h2>
              <div class="upcoming-patient-body">
                <div class="upcoming-patient-info">
                  <div class="patient-avatar-wrapper">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" alt="Alice Johnson" class="patient-avatar-img" />
                  </div>
                  <div class="upcoming-patient-text">
                    <span class="upcoming-patient-name">Alice Johnson</span>
                    <span class="upcoming-patient-schedule">09:00 AM - Checkup</span>
                  </div>
                </div>
                <button class="chat-bubble-btn" id="upcoming-chat-btn" data-patient-id="alice-johnson">
                  ${getIcon('message-square', 'nav-icon')}
                </button>
              </div>
            </div>

          </aside>
        </div>
      </div>

      <!-- Add Appointment Modal -->
      <div class="modal-backdrop" id="appointment-modal">
        <div class="modal-card">
          <header class="modal-header">
            <h3 class="modal-title">New Appointment</h3>
            <button class="modal-close-btn" id="close-modal-btn">✕</button>
          </header>
          <form id="new-appointment-form">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="patient-select">Patient</label>
                <select class="form-select" id="patient-select" required>
                  <option value="">Select Patient...</option>
                  <option value="john-doe">John Doe</option>
                  <option value="alice-johnson">Alice Johnson</option>
                  <option value="bob-smith">Bob Smith</option>
                  <option value="carol-davis">Carol Davis</option>
                  <option value="evan-wright">Evan Wright</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="appointment-time">Time</label>
                <input type="time" class="form-input" id="appointment-time" required value="09:30"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="appointment-status">Status</label>
                <select class="form-select" id="appointment-status" required>
                  <option value="Waiting">Waiting</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
            <footer class="modal-footer">
              <button type="button" class="btn-secondary-dark" id="cancel-modal-btn">Cancel</button>
              <button type="submit" class="btn-primary">Add Appointment</button>
            </footer>
          </form>
        </div>
      </div>
    `;
  }

  public onMount(container: HTMLElement, router: Router): void {
    // Navigate on row click (excluding the action column)
    const rows = container.querySelectorAll('.patient-row-btn');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        // Prevent click if we hit the info button itself
        const target = e.target as HTMLElement;
        if (target.closest('.action-info-btn')) return;

        const patientId = row.getAttribute('data-patient-id');
        if (patientId) {
          router.navigate('patient-profile', { patientId });
        }
      });
    });

    // Info buttons navigation
    const infoBtns = container.querySelectorAll('.action-info-btn');
    infoBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const patientId = btn.getAttribute('data-patient-id');
        if (patientId) {
          router.navigate('patient-profile', { patientId });
        }
      });
    });

    // View All Patients Link
    const viewAllLink = container.querySelector('#view-all-patients');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('patients');
      });
    }

    // Chat with upcoming patient
    const chatBtn = container.querySelector('#upcoming-chat-btn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        const patientId = chatBtn.getAttribute('data-patient-id');
        if (patientId) {
          router.navigate('patient-profile', { patientId });
        }
      });
    }

    // Modal elements
    const appointmentModal = container.querySelector('#appointment-modal') as HTMLElement;
    const openModalBtn = container.querySelector('#open-appointment-btn') as HTMLElement;
    const closeModalBtn = container.querySelector('#close-modal-btn') as HTMLElement;
    const cancelModalBtn = container.querySelector('#cancel-modal-btn') as HTMLElement;
    const appointmentForm = container.querySelector('#new-appointment-form') as HTMLFormElement;

    const openModal = () => {
      appointmentModal.classList.add('open');
    };

    const closeModal = () => {
      appointmentModal.classList.remove('open');
      appointmentForm.reset();
    };

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    // Form submission
    if (appointmentForm) {
      appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const patientIdSelect = container.querySelector('#patient-select') as HTMLSelectElement;
        const timeInput = container.querySelector('#appointment-time') as HTMLInputElement;
        const statusSelect = container.querySelector('#appointment-status') as HTMLSelectElement;

        const selectedPatientId = patientIdSelect.value;
        const timeVal = timeInput.value;
        const statusVal = statusSelect.value as 'In Progress' | 'Waiting' | 'Done';

        // Find the patient blueprint from base patients list
        const patientBlueprint = mockPatients.find(p => p.id === selectedPatientId);
        if (!patientBlueprint) {
          closeModal();
          return;
        }

        // Create a copy and insert into our active queue
        const newPatientQueueItem: Patient = {
          ...patientBlueprint,
          time: formatTime(timeVal),
          status: statusVal
        };

        // Prepend to queue
        queuePatients.unshift(newPatientQueueItem);

        // Update metrics
        metrics.todayAppointmentsCount += 1;
        if (statusVal !== 'Done') {
          metrics.remainingAppointmentsCount += 1;
        }

        closeModal();

        // Rerender view in router
        router.navigate('dashboard');
      });
    }
  }
}

// Helpers
function formatTime(time24: string): string {
  if (!time24) return '09:00 AM';
  const [hoursStr, minutesStr] = time24.split(':');
  let hours = parseInt(hoursStr);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = minutesStr;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}
