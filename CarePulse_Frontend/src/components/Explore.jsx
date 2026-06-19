import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Stethoscope, ChevronRight, Clock, MapPin, Loader } from 'lucide-react';

const Explore = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const storedProfile = localStorage.getItem('carepulse_profile');
        let patientId = null;
        let patientName = null;
        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setProfile(parsed);
          patientId = parsed.id;
          patientName = parsed.full_name?.toLowerCase().trim();
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        
        // Fetch all appointments
        const apptRes = await fetch(`${apiUrl}/api/appointments`);
        const allAppts = await apptRes.json();
        
        // Fetch all profiles for doctor details
        const profRes = await fetch(`${apiUrl}/api/profiles`);
        const allProfiles = await profRes.json();
        
        // Fetch doctor details for specialties
        const docDetailsRes = await fetch(`${apiUrl}/api/doctor_details`);
        const allDocDetails = await docDetailsRes.json();

        // Find all profiles that match the current user's name (to handle duplicate accounts in testing)
        // We use the first word to fuzzy match, identical to the backend's ilike logic
        const searchName = patientName ? patientName.split(' ')[0] : '';
        const matchedProfiles = allProfiles.filter(p => 
          p.role === 'patient' && searchName && p.full_name?.toLowerCase().includes(searchName)
        );
        const validPatientIds = matchedProfiles.map(p => p.id);
        if (validPatientIds.length === 0 && patientId) validPatientIds.push(patientId);

        // Filter for scheduled, rescheduled, and completed appointments for this patient
        const myAppts = allAppts.filter(a => 
          ['scheduled', 'completed', 'rescheduled'].includes(a.status) && 
          validPatientIds.includes(a.patient_id)
        );

        // Map doctor details
        const mappedAppts = myAppts.map(appt => {
          const doctor = allProfiles.find(p => p.id === appt.doctor_id) || {};
          const docDetail = allDocDetails.find(d => d.doctor_id === appt.doctor_id) || {};
          
          // Format date and time from scheduled_time (ISO string)
          const dateObj = new Date(appt.scheduled_time);
          const date = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          return {
            id: appt.id,
            doctorName: doctor.full_name || 'Unknown Doctor',
            specialty: docDetail.specialty || 'General Practice',
            date,
            time,
            location: 'CarePulse Clinic', // Fallback location
          };
        });

        // Sort by closest date
        mappedAppts.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setAppointments(mappedAppts);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);
  return (
    <main className="main-content flex flex-col p-6 w-full max-w-3xl mx-auto pb-24" style={{ overflowY: 'auto' }}>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Upcoming Appointments</h1>
        <p className="text-slate-400">Manage your scheduled visits, {profile ? profile.full_name : 'Patient'}.</p>
      </header>

      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-teal-400" size={32} />
          </div>
        ) : appointments.length > 0 ? (
          appointments.map(appt => (
            <Link 
              key={appt.id} 
              to={`/appointment/${appt.id}`}
              state={{ appt }}
              className="group relative block w-full bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:bg-slate-800/80 active:scale-[0.98] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-500 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                    <Stethoscope size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{appt.doctorName}</h3>
                    <p className="text-teal-400 font-medium mb-4">{appt.specialty}</p>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Calendar size={16} className="text-slate-400" />
                        <span>{appt.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300 text-sm">
                        <Clock size={16} className="text-slate-400" />
                        <span>{appt.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-slate-500 group-hover:text-teal-400 transition-colors mt-2">
                  <ChevronRight size={24} />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 bg-slate-800/30 rounded-3xl border border-white/5">
            <Calendar size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="text-xl text-white font-medium mb-2">No upcoming appointments</h3>
            <p className="text-slate-400">Head over to the home tab to schedule one.</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default Explore;
