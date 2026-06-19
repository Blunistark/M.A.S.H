import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation as NavIcon } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pathProgress, setPathProgress] = useState(0);

  // Trigger the path animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPathProgress(100);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="main-content flex flex-col p-6 w-full max-w-3xl mx-auto pb-24" style={{ overflowY: 'auto' }}>
      <header className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800/50 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hospital Navigation</h1>
          <p className="text-slate-400 text-sm">Route to Doctor's Cabin</p>
        </div>
      </header>

      <section className="flex-1 bg-slate-800/30 rounded-3xl border border-white/10 p-4 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Simple Floor Plan Map Container */}
        <div className="relative w-full max-w-lg aspect-[4/3] bg-[#eef1f5] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700">
          
          {/* Map Layout Elements */}
          <div className="absolute top-0 left-0 w-full h-full text-slate-800 font-semibold text-xs p-2">
            
            {/* Entrance Area */}
            <div className="absolute bottom-4 left-4 w-24 h-16 border-2 border-slate-300 bg-white rounded flex items-center justify-center">
              Reception
            </div>
            <div className="absolute bottom-0 left-10 text-teal-600 font-bold flex flex-col items-center">
              ↓ Entrance
            </div>

            {/* Corridor */}
            <div className="absolute bottom-24 left-4 right-4 h-16 bg-slate-200 border-y-2 border-slate-300 flex items-center justify-center text-slate-400 tracking-widest">
              MAIN CORRIDOR
            </div>

            {/* Pharmacy */}
            <div className="absolute bottom-4 right-4 w-32 h-16 border-2 border-slate-300 bg-white rounded flex items-center justify-center">
              Pharmacy
            </div>

            {/* Rooms Row */}
            <div className="absolute top-4 left-4 w-20 h-24 border-2 border-slate-300 bg-white rounded flex items-center justify-center text-center">
              Patient Room 1
            </div>
            <div className="absolute top-4 left-28 w-20 h-24 border-2 border-slate-300 bg-white rounded flex items-center justify-center text-center">
              Patient Room 2
            </div>
            
            {/* Target Cabin */}
            <div className="absolute top-4 right-4 w-32 h-24 border-2 border-teal-500 bg-teal-50 rounded flex items-center justify-center text-center text-teal-800 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              Doctor's Cabin
            </div>

          </div>

          {/* SVG Overlay for Drawing the Path */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox="0 0 400 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0d9488" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Path from Entrance to Cabin */}
            {/* Entrance is approx at x: 60, y: 280 */}
            {/* It goes up to corridor x:60, y:180 */}
            {/* Moves right across corridor x:330, y:180 */}
            {/* Moves up to doctor's cabin x:330, y:80 */}
            <path
              d="M 60 280 L 60 180 L 330 180 L 330 90"
              fill="none"
              stroke="url(#pathGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1000"
              strokeDashoffset={1000 - (1000 * pathProgress) / 100}
              className="transition-all duration-[3000ms] ease-in-out"
            />
            
            {/* Origin Point */}
            <circle cx="60" cy="280" r="8" fill="#14b8a6" className="animate-pulse" />
            
            {/* Destination Point */}
            {pathProgress === 100 && (
              <g className="animate-bounce" style={{ animationDuration: '2s' }}>
                <path d="M330,85 C330,85 330,85 330,85 C320,85 320,70 330,70 C340,70 340,85 330,85 Z" fill="#ef4444" transform="translate(-330, -85) scale(1.5) translate(330, 85)" />
                <circle cx="330" cy="77" r="3" fill="white" />
                <path d="M330 85 L330 95" stroke="#ef4444" strokeWidth="2" />
              </g>
            )}
          </svg>

        </div>

        {/* Status Indicator */}
        <div className="mt-8 flex items-center gap-3 bg-slate-900/50 py-3 px-6 rounded-full border border-teal-500/20">
          <NavIcon size={20} className="text-teal-400" />
          <span className="text-white font-medium">Follow the teal line to your destination</span>
        </div>

      </section>
    </main>
  );
};

export default Navigation;
