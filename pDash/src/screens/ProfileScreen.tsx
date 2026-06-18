import { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Bell,
  Plus,
  CheckCircle2,
  MoreVertical,
} from 'lucide-react';
import { getAppointments, getPatientProfile, getPrescriptions } from '../services/api';
import type { Appointment, PatientProfile, Prescription } from '../data/mockData';

export function ProfileScreen() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    const load = async () => {
      const [p, a, rx] = await Promise.all([
        getPatientProfile(),
        getAppointments(),
        getPrescriptions(),
      ]);
      setProfile(p);
      setAppointments(a);
      setPrescriptions(rx);
    };
    load();
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-4rem)] bg-white">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const upcoming = appointments.filter((a) => a.status === 'upcoming');
  const past = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-white pb-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
        <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center">
          <Plus size={16} className="text-primary" />
        </div>
        <p className="text-sm font-semibold text-primary">MedPulse Assistant</p>
        <button className="relative p-2">
          <Bell size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Profile Header — matching ref: centered avatar, name, pills */}
      <div className="flex flex-col items-center pt-6 pb-5 border-b border-border-light">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-bg-secondary border-2 border-border flex items-center justify-center mb-4 overflow-hidden">
          <User size={48} className="text-text-muted" />
        </div>

        <h1 className="text-xl font-bold text-text">{profile.name}</h1>

        {/* Info pills — matching ref style */}
        <div className="flex items-center gap-2 mt-2.5">
          <span className="text-[11px] font-semibold text-white bg-primary px-3 py-1 rounded-full">
            ID: {profile.id}
          </span>
          <span className="text-[11px] font-semibold text-primary bg-primary-bg px-3 py-1 rounded-full">
            Age: {profile.age}
          </span>
          <span className="text-[11px] font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
            Active Patient
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-text-secondary text-center mt-3 px-8 leading-relaxed">
          Primary Care Physician: Dr. Sarah Smith. Last checkup was 3 months ago. Overall health status is stable.
        </p>
      </div>

      {/* Contact Information — matching ref */}
      <div className="px-5 py-5 border-b border-border-light">
        <h2 className="text-sm font-bold text-primary mb-3">Contact Information</h2>
        <div className="space-y-3.5">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-text-muted" />
            <span className="text-sm text-text">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={16} className="text-text-muted" />
            <span className="text-sm text-text">{profile.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin size={16} className="text-text-muted" />
            <span className="text-sm text-text">123 Healthway Drive, Metropolis, NY 10001</span>
          </div>
        </div>
      </div>

      {/* Current Prescriptions — matching ref: checkmark style */}
      <div className="px-5 py-5 border-b border-border-light">
        <h2 className="text-sm font-bold text-primary mb-3">Current Prescriptions</h2>
        <div className="space-y-2.5">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="flex items-center justify-between bg-bg-secondary rounded-2xl px-4 py-3.5"
            >
              <div>
                <p className="text-sm font-semibold text-text">{rx.medication}</p>
                <p className="text-xs text-text-secondary">{rx.dosage} • {rx.frequency}</p>
              </div>
              <CheckCircle2 size={24} className="text-primary flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments — matching ref: calendar date card style */}
      <div className="px-5 py-5 border-b border-border-light">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-primary">Upcoming Appointments</h2>
          <button className="text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-full hover:bg-primary-dark transition-colors">
            Book New
          </button>
        </div>

        {upcoming.length > 0 ? (
          <div className="space-y-2.5">
            {upcoming.map((apt) => {
              const date = new Date(apt.date);
              const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 bg-bg-secondary rounded-2xl p-4 border-l-4 border-primary"
                >
                  {/* Date block */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary">
                      {monthNames[date.getMonth()]}
                    </span>
                    <span className="text-2xl font-bold text-text leading-tight">
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text">{apt.type}</p>
                    <p className="text-xs text-text-secondary">
                      {apt.doctorName} • {apt.time}
                    </p>
                  </div>

                  <button className="p-1">
                    <MoreVertical size={16} className="text-text-muted" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted py-3">No upcoming appointments</p>
        )}
      </div>

      {/* Past Visits — matching ref: timeline with dot style */}
      <div className="px-5 py-5">
        <h2 className="text-sm font-bold text-primary mb-3">Past Visits</h2>
        <div className="space-y-0">
          {past.map((apt, i) => (
            <div key={apt.id} className="flex gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                  i === 0 ? 'bg-primary' : 'bg-border'
                }`} />
                {i < past.length - 1 && (
                  <div className="w-px flex-1 min-h-[60px] bg-border" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-text">{apt.type}</p>
                  <span className="text-[11px] text-text-muted">{apt.date}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                  {apt.specialty} check with {apt.doctorName}. Room {apt.room}. Status: completed.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-4" />
    </div>
  );
}
