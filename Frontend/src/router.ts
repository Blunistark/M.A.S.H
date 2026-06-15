import { getIcon } from './assets/icons';

export interface View {
  render(params?: any): string | Promise<string>;
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

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.routeFromHash();
    });
  }

  public routeFromHash() {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    if (hash === 'pharmacy') {
      this.navigate('pharmacy');
    } else if (hash.startsWith('patient-profile/')) {
      const patientId = hash.split('/')[1];
      this.navigate('patient-profile', { patientId });
    } else if (hash === 'patients') {
      this.navigate('patients');
    } else if (hash === 'prescriptions') {
      this.navigate('prescriptions');
    } else if (hash === 'schedule') {
      this.navigate('schedule');
    } else {
      this.navigate('dashboard');
    }
  }

  public registerView(name: string, view: View) {
    this.views[name] = view;
  }

  public navigate(routeName: string, params: any = {}) {
    this.currentRoute = routeName;
    this.currentParams = params;
    
    // Sync hash with navigation state
    let targetHash = routeName;
    if (routeName === 'patient-profile' && params.patientId) {
      targetHash = `patient-profile/${params.patientId}`;
    }
    
    if (window.location.hash.replace('#', '') !== targetHash) {
      window.location.hash = targetHash;
    }

    this.renderCurrentView();
  }

  private async renderCurrentView() {
    const view = this.views[this.currentRoute];
    if (!view) {
      console.error(`View ${this.currentRoute} not registered`);
      return;
    }

    // SPECIAL CASE: Pharmacy Page - Separate Dashboard Layout
    if (this.currentRoute === 'pharmacy') {
      this.appContainer.className = 'app-container pharmacy-portal-container';
      this.appContainer.innerHTML = `
        <main class="pharmacy-viewport" id="viewport-container" style="width: 100%; min-height: 100vh; background-color: #f8fafc;"></main>
      `;

      const viewport = this.appContainer.querySelector('#viewport-container') as HTMLElement;
      
      // Loading state
      viewport.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #64748b; font-family: var(--font-sans);">
          <div style="border: 3px solid #f3f3f3; border-top: 3px solid var(--accent-blue); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
          <span>Loading pharmacy portal data...</span>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;

      try {
        const htmlContent = await view.render(this.currentParams);
        viewport.innerHTML = htmlContent;
      } catch (err) {
        console.error('Render error:', err);
        viewport.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; color: #ef4444; font-family: var(--font-sans); text-align: center; padding: 20px;">
            <span style="font-size: 40px; margin-bottom: 16px;">⚠️</span>
            <h3 style="margin-bottom: 8px;">Failed to load pharmacy data</h3>
            <p style="color: #64748b; max-width: 400px; font-size: 14px;">Please check that your backend server is running and connected to Supabase.</p>
          </div>
        `;
      }

      if (view.onMount) {
        view.onMount(viewport, this);
      }
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

    // Render the active view and mount with loading indicator
    viewport.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; color: #64748b; font-family: var(--font-sans);">
        <div style="border: 3px solid #f3f3f3; border-top: 3px solid var(--accent-blue); border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-bottom: 16px;"></div>
        <span>Loading portal data...</span>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    try {
      const htmlContent = await view.render(this.currentParams);
      viewport.innerHTML = htmlContent;
    } catch (err) {
      console.error('Render error:', err);
      viewport.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; color: #ef4444; font-family: var(--font-sans); text-align: center; padding: 20px;">
          <span style="font-size: 40px; margin-bottom: 16px;">⚠️</span>
          <h3 style="margin-bottom: 8px;">Failed to load data</h3>
          <p style="color: #64748b; max-width: 400px; font-size: 14px;">Please check that your backend server is running and connected to Supabase.</p>
        </div>
      `;
    }
    
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
