import { getIcon } from './assets/icons';

export interface View {
  render(params?: any): string;
  onMount?(container: HTMLElement, router: Router): void;
}

export class Router {
  public currentRoute: string = 'dashboard';
  private currentParams: any = {};
  private views: Record<string, View> = {};
  private appContainer: HTMLElement;

  constructor(appContainerId: string) {
    const container = document.getElementById(appContainerId);
    if (!container) {
      throw new Error(`Container with ID #${appContainerId} not found`);
    }
    this.appContainer = container;
  }

  public registerView(name: string, view: View) {
    this.views[name] = view;
  }

  public navigate(routeName: string, params: any = {}) {
    this.currentRoute = routeName;
    this.currentParams = params;
    this.renderCurrentView();
  }

  private renderCurrentView() {
    const view = this.views[this.currentRoute];
    if (!view) {
      console.error(`View ${this.currentRoute} not registered`);
      return;
    }

    // Sidebar theme selection
    // In dr dashboard.png, sidebar is dark.
    // In patient profile.png, sidebar is light.
    const isDarkSidebar = this.currentRoute === 'dashboard';
    const sidebarThemeClass = isDarkSidebar ? 'theme-dark' : 'theme-light';

    // Set wrapper container layout
    this.appContainer.className = 'app-container';
    this.appContainer.innerHTML = `
      <!-- Sidebar Navigation -->
      <aside class="sidebar ${sidebarThemeClass}">
        <div class="sidebar-top">
          <div class="sidebar-logo">
            ${getIcon('activity', 'nav-icon')}
            <span>MedConnect<span class="logo-highlight"> Pro</span></span>
          </div>

          <!-- Doctor profile info card -->
          <div class="doctor-profile-badge">
            <div class="doctor-avatar-container">
              <img src="/src/assets/dr-profile.jpg" alt="Dr. Smith" class="doctor-avatar" onerror="this.src='https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'"/>
            </div>
            <div class="doctor-info-text">
              <span class="doctor-name">Dr. Smith</span>
              <span class="doctor-specialty">Cardiologist</span>
            </div>
          </div>

          <!-- Main Nav List -->
          <nav class="sidebar-nav">
            <a href="#" class="nav-item ${this.currentRoute === 'dashboard' ? 'active' : ''}" data-route="dashboard">
              ${getIcon('grid', 'nav-icon')}
              <span>Dashboard</span>
            </a>
            <a href="#" class="nav-item ${this.currentRoute === 'patients' || this.currentRoute === 'patient-profile' ? 'active' : ''}" data-route="patients">
              ${getIcon('users', 'nav-icon')}
              <span>Patients</span>
            </a>
            <a href="#" class="nav-item ${this.currentRoute === 'prescriptions' ? 'active' : ''}" data-route="prescriptions">
              ${getIcon('pill', 'nav-icon')}
              <span>Prescriptions</span>
            </a>
            <a href="#" class="nav-item ${this.currentRoute === 'schedule' ? 'active' : ''}" data-route="schedule">
              ${getIcon('calendar', 'nav-icon')}
              <span>Schedule</span>
            </a>
          </nav>
        </div>

        <!-- Logout Button -->
        <button class="logout-btn">
          ${getIcon('log-out', 'nav-icon')}
          <span>Logout</span>
        </button>
      </aside>

      <!-- Main Page Content Viewport -->
      <main class="main-viewport" id="viewport-container"></main>
    `;

    const viewport = this.appContainer.querySelector('#viewport-container') as HTMLElement;
    
    // Add page-specific backgrounds
    if (this.currentRoute === 'patient-profile') {
      viewport.className = 'main-viewport profile-main-viewport';
    } else {
      viewport.className = 'main-viewport';
    }

    // Render the active view and mount
    viewport.innerHTML = view.render(this.currentParams);
    
    if (view.onMount) {
      view.onMount(viewport, this);
    }

    this.bindLayoutEvents();
  }

  private bindLayoutEvents() {
    // Nav links binding
    const navItems = this.appContainer.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route');
        if (route) {
          this.navigate(route);
        }
      });
    });

    // Logout button binding
    const logoutBtn = this.appContainer.querySelector('.logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        alert('Logging out of MedConnect Pro...');
      });
    }
  }
}
