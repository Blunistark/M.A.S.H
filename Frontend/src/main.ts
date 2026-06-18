import './style.css';
import { Router } from './router';
import { DashboardView } from './views/dashboard';
import { PatientsListView } from './views/patientsList';
import { PatientProfileView } from './views/patientProfile';
import { PrescriptionsView } from './views/prescriptions';
import { ScheduleView } from './views/schedule';
import { PharmacyView } from './views/pharmacy';
import { TelemetryView } from './views/telemetry';
import { AuthView } from './views/auth';
import { VoiceOrb } from './voiceOrb';

// Instantiate the router targeting the main #app div
const router = new Router('app');

// Register all screen views
router.registerView('auth', new AuthView());
router.registerView('dashboard', new DashboardView());
router.registerView('patients', new PatientsListView());
router.registerView('patient-profile', new PatientProfileView());
router.registerView('prescriptions', new PrescriptionsView());
router.registerView('schedule', new ScheduleView());
router.registerView('pharmacy', new PharmacyView());
router.registerView('telemetry', new TelemetryView());

// Initialize MASH Voice Orb
new VoiceOrb(router);

// Boot the application using the current URL hash
router.routeFromHash();

