import type { View } from '../router';
import { getIcon } from '../assets/icons';

export class ScheduleView implements View {
  public render(): string {
    return `
      <header class="main-header">
        <div class="header-title-section">
          <h1 class="header-title">Clinician Schedule</h1>
          <span class="header-subtitle">Manage availability and patient sessions</span>
        </div>
        <div class="header-actions">
          <button class="btn-primary" id="add-schedule-event">
            ${getIcon('plus', 'nav-icon')}
            <span>Add Block</span>
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

      <div class="page-content">
        <div class="dashboard-card" style="padding: 40px; text-align: center; color: #64748b;">
          ${getIcon('calendar', 'nav-icon')}
          <h2 class="card-title" style="margin: 16px 0 8px 0; font-size: 20px;">Calendar Coordinator</h2>
          <p style="font-size: 14px; max-width: 500px; margin: 0 auto 24px auto;">Sync clinic calendars with digital check-ins, telehealth links, and custom out-of-office blocks.</p>
          <button class="btn-primary" style="margin: 0 auto; display: inline-flex;" id="schedule-demo-btn">Configure Schedule Blocks</button>
        </div>
      </div>
    `;
  }

  public onMount(container: HTMLElement): void {
    const addBtn = container.querySelector('#add-schedule-event');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        alert('Opening slot coordinator...');
      });
    }

    const demoBtn = container.querySelector('#schedule-demo-btn');
    if (demoBtn) {
      demoBtn.addEventListener('click', () => {
        alert('Opening schedule configuration...');
      });
    }
  }
}
