import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Calendar, Clock, MapPin, Activity, AlertCircle, Navigation, User as UserIcon } from 'lucide-react';

const AppointmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const appt = location.state?.appt;

  const storedProfile = localStorage.getItem('carepulse_profile');
  let patientName = "Unknown Patient";
  if (storedProfile) {
    try {
      const parsed = JSON.parse(storedProfile);
      patientName = parsed.full_name || patientName;
    } catch (e) {}
  }

  if (!appt) {
    return (
      <main className="main-content flex flex-col p-6 w-full max-w-2xl mx-auto pb-32" style={{ overflowY: 'auto' }}>
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 self-start"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>
        <div className="text-white text-center mt-12">
          <AlertCircle size={48} className="mx-auto text-slate-500 mb-4" />
          <h2 className="text-2xl font-bold">Appointment Not Found</h2>
          <p className="text-slate-400 mt-2">Could not load the details for this appointment.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content flex flex-col p-6 w-full max-w-2xl mx-auto pb-32" style={{ overflowY: 'auto' }}>
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 self-start"
      >
        <ChevronLeft size={20} />
        <span>Back</span>
      </button>

      {/* Header Profile Section */}
      <section className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 mb-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-teal-500/30 flex-shrink-0">
          {/* Placeholder Image */}
          <div className="w-full h-full bg-gradient-to-br from-teal-500/20 to-slate-800 flex items-center justify-center">
            <span className="text-2xl text-teal-400 font-bold">{appt.doctorName.charAt(4)}</span>
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{appt.doctorName}</h1>
          <p className="text-teal-400 font-medium">{appt.specialty}</p>
        </div>
      </section>

      {/* Bento Grid Details */}
      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col gap-2">
          <Calendar size={24} className="text-teal-400" />
          <div>
            <p className="text-slate-400 text-sm">Date</p>
            <p className="text-white font-medium">{appt.date}</p>
          </div>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex flex-col gap-2">
          <Clock size={24} className="text-teal-400" />
          <div>
            <p className="text-slate-400 text-sm">Time</p>
            <p className="text-white font-medium">{appt.time}</p>
          </div>
        </div>
        <div className="col-span-2 bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center text-teal-400 flex-shrink-0">
            <MapPin size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Location</p>
            <p className="text-white font-medium">{appt.location}</p>
          </div>
        </div>
      </section>

      {/* Patient Information Section */}
      <section className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-3xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Patient Information</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <UserIcon size={20} className="text-slate-400" />
              <span className="text-slate-300">Name</span>
            </div>
            <span className="text-white font-medium">{patientName}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-slate-400" />
              <span className="text-slate-300">Last Vitals</span>
            </div>
            <span className="text-white font-medium">BP 120/80 • HR 72</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-slate-400" />
              <span className="text-slate-300">Allergies</span>
            </div>
            <span className="text-white font-medium">Penicillin</span>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-auto">
        <button 
          onClick={() => navigate('/navigation')}
          className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-4 rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
        >
          <Navigation size={20} />
          Navigate to Room
        </button>
        <button 
          onClick={() => navigate('/home', { state: { rescheduleAppt: appt } })}
          className="w-full bg-transparent border-2 border-teal-500/50 hover:border-teal-400 text-teal-400 font-bold py-4 rounded-full transition-all duration-300 hover:bg-teal-500/10 active:scale-95"
        >
          Reschedule
        </button>
      </div>
    </main>
  );
};

export default AppointmentDetails;
