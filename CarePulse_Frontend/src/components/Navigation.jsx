import React, { useEffect } from 'react';
import { Pill, Bed, Info, ArrowRight, Activity, User, Volume2, VolumeX, MapPin, Sparkles } from 'lucide-react';
import './Navigation.css';

const destinations = {
  'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd': {
    name: 'Dr. Smith (Cardiology)',
    room: 'Doctor Consultation Room 1',
    cells: ['reception', 'corridor', 'doc-room-1'],
    directions: 'Exit the reception and waiting area, walk straight into the central corridor, and take the first right into Doctor Consultation Room 1.'
  },
  'f85362c8-5935-4b2e-bff1-e2779d9d78ae': {
    name: 'Dr. Kirran Kumar (General Medicine)',
    room: 'Doctor Consultation Room 2',
    cells: ['reception', 'corridor', 'doc-room-2'],
    directions: 'Exit the reception and waiting area, walk straight into the central corridor, pass Doctor Consultation Room 1 on your right, and take the second right into Doctor Consultation Room 2.'
  },
  '13a4db1b-c1dd-43b2-b1c1-71aa36b5574f': {
    name: 'Dr. Mithun Nair (ENT)',
    room: 'Doctor Consultation Room 2',
    cells: ['reception', 'corridor', 'doc-room-2'],
    directions: 'Exit the reception and waiting area, walk straight into the central corridor, pass Doctor Consultation Room 1 on your right, and take the second right into Doctor Consultation Room 2.'
  },
  'pharmacy': {
    name: 'Pharmacy',
    room: 'Pharmacy Area',
    cells: ['reception', 'pharmacy-bottom'],
    directions: 'The Pharmacy is located immediately to your right as you enter the main clinic lobby.'
  },
  'reception': {
    name: 'Reception & Waiting',
    room: 'Reception Counter',
    cells: ['reception'],
    directions: 'You are currently at the reception and waiting desk.'
  }
};

const mapCells = [
  // Row 1
  { id: 'pharmacy-top', label: 'Pharmacy', type: 'pharmacy', gridArea: '1 / 2 / 2 / 3', icon: 'Pills' },
  { id: 'patient-1', label: 'Patient Room 1', type: 'patient-room', gridArea: '1 / 3 / 2 / 4', icon: 'Bed' },
  { id: 'patient-2', label: 'Patient Room 2', type: 'patient-room', gridArea: '1 / 4 / 2 / 5', icon: 'Bed' },
  { id: 'patient-3', label: 'Patient Room 3', type: 'patient-room', gridArea: '1 / 5 / 2 / 6', icon: 'Bed' },
  { id: 'patient-4', label: 'Patient Room 4', type: 'patient-room', gridArea: '1 / 6 / 2 / 7', icon: 'Bed' },
  
  // Stretches across middle and bottom rows on the far left
  { id: 'reception', label: 'Reception & Waiting', type: 'reception', gridArea: '2 / 1 / 4 / 2', icon: 'Info' },
  
  // Row 2 Corridor
  { id: 'corridor', label: 'Corridor', type: 'corridor', gridArea: '2 / 2 / 3 / 7', icon: 'ArrowRight' },
  
  // Row 3
  { id: 'pharmacy-bottom', label: 'Pharmacy', type: 'pharmacy', gridArea: '3 / 2 / 4 / 3', icon: 'Pills' },
  { id: 'doc-room-1', label: 'Consultation 1 (Dr. Smith)', type: 'doctor-room', gridArea: '3 / 3 / 4 / 4', icon: 'Activity' },
  { id: 'doc-room-2', label: 'Consultation 2 (Dr. Kirran / Dr. Mithun)', type: 'doctor-room', gridArea: '3 / 4 / 4 / 5', icon: 'Activity' },
  { id: 'staff-area', label: 'Staff Area', type: 'staff', gridArea: '3 / 5 / 4 / 6', icon: 'User' },
  { id: 'patient-5', label: 'Patient Room 5', type: 'patient-room', gridArea: '3 / 6 / 4 / 7', icon: 'Bed' }
];

export default function Navigation({ selectedDestination, setSelectedDestination, isSpeaking, onToggleSpeak }) {
  
  const activePath = destinations[selectedDestination]?.cells || [];
  const directionsText = destinations[selectedDestination]?.directions || 'Select a destination to display directions.';
  const roomName = destinations[selectedDestination]?.room || '';

  const getIcon = (name) => {
    switch (name) {
      case 'Pills': return <Pill size={18} />;
      case 'Bed': return <Bed size={18} />;
      case 'Info': return <Info size={18} />;
      case 'ArrowRight': return <ArrowRight size={18} />;
      case 'Activity': return <Activity size={18} />;
      case 'User': return <User size={18} />;
      default: return <Info size={18} />;
    }
  };

  const isCellInPath = (cellId) => {
    if (selectedDestination === 'pharmacy') {
      // Pharmacy highlights both pharmacy bottom and reception
      if (cellId === 'pharmacy-bottom') return true;
    }
    return activePath.includes(cellId);
  };

  const isCellDestination = (cellId) => {
    if (selectedDestination === 'reception' && cellId === 'reception') return true;
    if (selectedDestination === 'pharmacy' && (cellId === 'pharmacy-bottom' || cellId === 'pharmacy-top')) return true;
    if (selectedDestination === 'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd' && cellId === 'doc-room-1') return true;
    if ((selectedDestination === 'f85362c8-5935-4b2e-bff1-e2779d9d78ae' || selectedDestination === '13a4db1b-c1dd-43b2-b1c1-71aa36b5574f') && cellId === 'doc-room-2') return true;
    return false;
  };

  return (
    <div className="navigation-container">
      <div className="navigation-header">
        <h2 className="navigation-title">Hospital Navigation Map</h2>
        <p className="navigation-subtitle">
          Find consultation offices, pharmacy counters, and general patient rooms.
        </p>
      </div>

      <div className="navigation-selector-panel">
        <label htmlFor="destination-select" className="selector-label">
          <Sparkles size={16} color="var(--accent-teal)" style={{ marginRight: '8px' }} />
          Choose Destination
        </label>
        <select 
          id="destination-select"
          className="destination-select"
          value={selectedDestination || ''}
          onChange={(e) => setSelectedDestination(e.target.value)}
        >
          <option value="" disabled>-- Select Doctor or Room --</option>
          {Object.entries(destinations).map(([id, dest]) => (
            <option key={id} value={id}>{dest.name} ({dest.room})</option>
          ))}
        </select>
      </div>

      <div className="map-view-wrapper">
        <div className="map-grid">
          {mapCells.map((cell) => {
            const inPath = isCellInPath(cell.id);
            const isDest = isCellDestination(cell.id);
            const isStart = cell.id === 'reception';
            
            return (
              <div
                key={cell.id}
                className={`map-cell cell-type-${cell.type} ${inPath ? 'active-path' : ''} ${isDest ? 'destination-cell' : ''}`}
                style={{ gridArea: cell.gridArea }}
              >
                <div className="cell-content">
                  <span className="cell-icon">{getIcon(cell.icon)}</span>
                  <span className="cell-label">{cell.label}</span>
                </div>
                {isStart && !isDest && (
                  <div className="you-are-here-indicator">
                    <span className="pulsing-dot" />
                    <span className="indicator-text">You are here</span>
                  </div>
                )}
                {isDest && (
                  <div className="destination-marker">
                    <MapPin size={16} color="#ef4444" fill="#ef4444" className="bounce-marker" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="directions-panel">
        <div className="directions-card-header">
          <h4 className="directions-card-title">
            {selectedDestination ? destinations[selectedDestination].name : 'Directions'}
          </h4>
          {selectedDestination && (
            <button 
              className={`audio-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={onToggleSpeak}
              title={isSpeaking ? 'Mute Directions' : 'Read Directions Aloud'}
            >
              {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isSpeaking ? 'Mute' : 'Play Audio'}</span>
            </button>
          )}
        </div>
        <p className="directions-text">{directionsText}</p>
        {roomName && (
          <div className="room-badge">
            <span className="badge-dot" />
            Target: <strong>{roomName}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
