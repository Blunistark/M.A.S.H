import { useState, useEffect } from 'react';
import { MapPin, ArrowUp, CornerDownLeft, CornerUpRight, Bell, Plus } from 'lucide-react';
import { getNavRoute } from '../services/api';
import type { NavRoute } from '../data/mockData';

const destinations = [
  { id: '101', label: '101' },
  { id: '102', label: '102' },
  { id: '103', label: '103' },
  { id: 'pharmacy', label: 'Pharmacy' },
];

// Direction icons based on step index
const stepIcons = [ArrowUp, CornerDownLeft, CornerUpRight];

export function NavigateScreen() {
  const [selectedDest, setSelectedDest] = useState<string>('102');
  const [route, setRoute] = useState<NavRoute | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    loadRoute(selectedDest);
  }, [selectedDest]);

  const loadRoute = async (dest: string) => {
    const result = await getNavRoute(dest);
    setRoute(result);
    setIsNavigating(false);
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] bg-white">
      {/* Header — matching ref */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
        <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center">
          <Plus size={16} className="text-primary" />
        </div>
        <p className="text-sm font-semibold text-primary">MedPulse Assistant</p>
        <button className="relative p-2">
          <Bell size={20} className="text-text-secondary" />
        </button>
      </div>

      {/* Current Location Pill */}
      <div className="px-5 pt-4 pb-3">
        <div className="inline-flex items-center gap-2 bg-bg-secondary border border-border rounded-full px-4 py-2">
          <MapPin size={14} className="text-primary" />
          <span className="text-sm text-text font-medium">Current Location: Reception</span>
        </div>
      </div>

      {/* SVG Floor Plan — clean white style matching ref */}
      <div className="mx-5 rounded-2xl bg-bg-secondary border border-border overflow-hidden">
        <svg viewBox="0 0 340 300" className="w-full" style={{ maxHeight: '280px' }}>
          {/* Background */}
          <rect width="340" height="300" fill="#F8FAFC" />

          {/* Room row at top */}
          {destinations.filter(d => d.id !== 'pharmacy').map((dest, i) => {
            const x = 40 + i * 90;
            const isSelected = selectedDest === dest.id;
            return (
              <g key={dest.id} onClick={() => setSelectedDest(dest.id)} className="cursor-pointer">
                <rect
                  x={x} y={40} width={75} height={60} rx={8}
                  fill={isSelected ? '#EFF6FF' : '#FFFFFF'}
                  stroke={isSelected ? '#2563EB' : '#E5E7EB'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                {isSelected && (
                  <g>
                    <circle cx={x + 37} cy={55} r={8} fill="none" stroke="#2563EB" strokeWidth="1.5" />
                    <circle cx={x + 37} cy={55} r={3} fill="#2563EB" />
                  </g>
                )}
                <text
                  x={x + 37} y={isSelected ? 85 : 75}
                  fill={isSelected ? '#2563EB' : '#6B7280'}
                  fontSize="14" fontWeight={isSelected ? '600' : '400'}
                  textAnchor="middle"
                >
                  {dest.label}
                </text>
              </g>
            );
          })}

          {/* Central empty area (hallway) */}
          <rect x="30" y="120" width="280" height="80" rx="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="4 3" />

          {/* Pharmacy - left */}
          <g onClick={() => setSelectedDest('pharmacy')} className="cursor-pointer">
            <text x="100" y="165" fill={selectedDest === 'pharmacy' ? '#2563EB' : '#6B7280'} fontSize="13" fontWeight="500" textAnchor="middle">
              Pharmacy
            </text>
          </g>

          {/* Lab - right */}
          <text x="240" y="165" fill="#6B7280" fontSize="13" fontWeight="500" textAnchor="middle">
            Lab
          </text>

          {/* Reception at bottom */}
          <g>
            <circle cx="170" cy="250" r={4} fill="#2563EB" opacity="0.3">
              <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx="170" cy="250" r={3} fill="#2563EB" />
            {/* People icon placeholder */}
            <text x="170" y="235" fill="#6B7280" fontSize="16" textAnchor="middle">🧑‍🤝‍🧑</text>
            <text x="170" y="275" fill="#6B7280" fontSize="12" fontWeight="500" textAnchor="middle">
              Reception
            </text>
          </g>

          {/* Animated route path */}
          {route && isNavigating && (
            <path
              d={route.pathData}
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="500"
              strokeDashoffset="500"
              className="route-path"
              opacity="0.7"
            />
          )}
        </svg>
      </div>

      {/* Directions Card — matching ref style */}
      {route && (
        <div className="px-5 mt-5 flex-1 slide-up">
          {/* Title row */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-text">Directions to {route.destination}</h2>
            <span className="text-xs font-semibold text-primary bg-primary-bg px-3 py-1.5 rounded-full">
              {route.estimatedTime} • 150m
            </span>
          </div>

          {/* Step-by-step directions — timeline style matching ref */}
          <div className="space-y-0">
            {route.steps.map((step, i) => {
              const isLast = i === route.steps.length - 1;
              const StepIcon = stepIcons[i % stepIcons.length];

              return (
                <div key={i} className="flex gap-3">
                  {/* Timeline dot/line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isLast ? 'bg-primary' : 'bg-bg-secondary border border-border'
                    }`}>
                      {isLast ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-border" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px h-full min-h-[40px] bg-border" />
                    )}
                  </div>

                  {/* Step card */}
                  <div className={`flex-1 mb-3 p-4 rounded-2xl border ${
                    isLast
                      ? 'bg-primary-bg border-primary/30'
                      : 'bg-white border-border'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isLast ? 'bg-primary' : 'bg-bg-secondary'
                      }`}>
                        <StepIcon size={18} className={isLast ? 'text-white' : 'text-text-secondary'} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isLast ? 'text-text' : 'text-text'}`}>
                          {step.instruction.split(/(Reception|Pharmacy|Room \d+)/g).map((part, j) =>
                            /(Reception|Pharmacy|Room \d+)/.test(part) ? (
                              <span key={j} className="text-primary font-semibold">{part}</span>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                        </p>
                        <p className={`text-xs mt-0.5 ${isLast ? 'text-primary font-medium' : 'text-text-muted'}`}>
                          {isLast ? `Currently here • ${step.distance} remaining` : step.distance}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start navigation button */}
          {!isNavigating && (
            <button
              onClick={() => setIsNavigating(true)}
              className="w-full mt-2 mb-4 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-2xl transition-colors text-sm"
            >
              Start Navigation
            </button>
          )}
        </div>
      )}
    </div>
  );
}
