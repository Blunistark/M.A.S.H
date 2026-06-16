import { type View, Router } from '../router';
import { fetchAppointments, fetchProfiles, fetchMetrics, createAppointment } from '../api';
import type { Appointment, Profile, DashboardMetrics } from '../types';
import { getIcon } from '../assets/icons';

// Internal state
let queueAppointments: Appointment[] = [];
let profiles: Profile[] = [];
let metrics: DashboardMetrics = {
  todayAppointmentsCount: 0,
  remainingAppointmentsCount: 0,
  pendingReschedulesCount: 0,
  notificationsCount: 0,
  stockAlertsCount: 0
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export class DashboardView implements View {
  public async render(): Promise<string> {
    queueAppointments = await fetchAppointments();
    profiles = await fetchProfiles();
    metrics = await fetchMetrics();

    // Generate queue rows
    const tableRows = queueAppointments.map(appt => {
      const patient = profiles.find(p => p.id === appt.patient_id);
      if (!patient) return '';

      let statusClass = 'waiting';
      if (appt.status === 'in_progress') statusClass = 'in-progress';
      else if (appt.status === 'completed') statusClass = 'done';

      const initials = getInitials(patient.full_name);
      const avatarClass = `avatar-${initials.toLowerCase()}`;
      const timeStr = formatTime(appt.scheduled_time);

      return `
        <tr class="patient-row-btn" data-patient-id="${patient.id}">
          <td>
            <div class="patient-cell">
              <div class="patient-initials-avatar ${avatarClass}">
                ${initials}
              </div>
              <span class="patient-name-bold">${patient.full_name}</span>
            </div>
          </td>
          <td>${timeStr}</td>
          <td>
            <span class="status-pill ${statusClass}">${appt.status.replace('_', ' ')}</span>
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

          <aside class="dashboard-sidebar-column">
            
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
                  ${profiles.filter(p => p.role === 'patient').map(p => `<option value="${p.id}">${p.full_name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="appointment-time">Time</label>
                <input type="time" class="form-input" id="appointment-time" required value="09:30"/>
              </div>
              <div class="form-group">
                <label class="form-label" for="appointment-status">Status</label>
                <select class="form-select" id="appointment-status" required>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
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
    const rows = container.querySelectorAll('.patient-row-btn');
    rows.forEach(row => {
      row.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.action-info-btn')) return;
        const patientId = row.getAttribute('data-patient-id');
        if (patientId) router.navigate('patient-profile', { patientId });
      });
    });

    const infoBtns = container.querySelectorAll('.action-info-btn');
    infoBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const patientId = btn.getAttribute('data-patient-id');
        if (patientId) router.navigate('patient-profile', { patientId });
      });
    });

    const viewAllLink = container.querySelector('#view-all-patients');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        router.navigate('patients');
      });
    }

    const chatBtn = container.querySelector('#upcoming-chat-btn');
    if (chatBtn) {
      chatBtn.addEventListener('click', () => {
        const patientId = chatBtn.getAttribute('data-patient-id');
        if (patientId) router.navigate('patient-profile', { patientId });
      });
    }

    const appointmentModal = container.querySelector('#appointment-modal') as HTMLElement;
    const openModalBtn = container.querySelector('#open-appointment-btn') as HTMLElement;
    const closeModalBtn = container.querySelector('#close-modal-btn') as HTMLElement;
    const cancelModalBtn = container.querySelector('#cancel-modal-btn') as HTMLElement;
    const appointmentForm = container.querySelector('#new-appointment-form') as HTMLFormElement;

    const openModal = () => appointmentModal.classList.add('open');
    const closeModal = () => {
      appointmentModal.classList.remove('open');
      appointmentForm.reset();
    };

    if (openModalBtn) openModalBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    if (appointmentForm) {
      appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const patientIdSelect = container.querySelector('#patient-select') as HTMLSelectElement;
        const timeInput = container.querySelector('#appointment-time') as HTMLInputElement;
        const statusSelect = container.querySelector('#appointment-status') as HTMLSelectElement;

        const selectedPatientId = patientIdSelect.value;
        const timeVal = timeInput.value;
        const statusVal = statusSelect.value;

        const patient = profiles.find(p => p.id === selectedPatientId);
        if (!patient) {
          closeModal();
          return;
        }

        const date = new Date();
        const [hours, mins] = timeVal.split(':');
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(mins, 10));

        createAppointment({
          patient_id: selectedPatientId,
          doctor_id: 'dr-smith',
          scheduled_time: date.toISOString(),
          status: statusVal
        }).then(() => {
          closeModal();
          router.navigate('dashboard');
        }).catch(err => {
          console.error(err);
          alert('Failed to save appointment to the database.');
          closeModal();
        });
      });
    }
  }
}
