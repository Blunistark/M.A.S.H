import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, MessageSquare, Compass, Search, User as UserIcon, LogOut, 
  Phone, Mail, Activity, Send, Sparkles, Stethoscope, MapPin, Calendar, Clock, ArrowRight 
} from 'lucide-react';
import Navigation from './Navigation';
import Explore from './Explore';

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const ThinkingDots = () => (
  <div className="thinking-dots-container">
    <div className="assistant-avatar-small">
      <Sparkles size={14} color="var(--accent-teal)" />
    </div>
    <div className="thinking-bubble">
      <span /><span /><span />
    </div>
  </div>
);

const AUTO_SUGGESTIONS = [
  { icon: <Stethoscope size={16} />, label: "Book an Appointment", text: "I'd like to book an appointment with a doctor" },
  { icon: <MapPin size={16} />, label: "Hospital Navigation", text: "Where is the location of?" },
  { icon: <Calendar size={16} />, label: "Available Doctors & Specialties", text: "Which doctors and specialties are available?" },
  { icon: <Clock size={16} />, label: "Reschedule Appointment", text: "I want to reschedule my appointment" },
];

const Dashboard = ({ userProfile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakDirections = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const paths = {
        'a6bb7c5b-ef00-4ea7-8b01-b66b8df815bd': 'Exit the reception and waiting area, walk straight into the central corridor, and take the first right into Doctor Consultation Room 1.',
        'edb25638-f9b3-40c9-98dd-1799b17a3561': 'Exit the reception and waiting area, walk straight into the central corridor, and take the first right into Doctor Consultation Room 1.',
        'f85362c8-5935-4b2e-bff1-e2779d9d78ae': 'Exit the reception and waiting area, walk straight into the central corridor, pass Doctor Consultation Room 1 on your right, and take the second right into Doctor Consultation Room 2.',
        '13a4db1b-c1dd-43b2-b1c1-71aa36b5574f': 'Exit the reception and waiting area, walk straight into the central corridor, pass Doctor Consultation Room 1 on your right, and take the second right into Doctor Consultation Room 2.',
        'pharmacy': 'The Pharmacy is located immediately to your right as you enter the main clinic lobby.',
        'reception': 'You are currently at the reception and waiting desk.'
      };
      const text = paths[selectedDestination] || '';
      if (text) {
        speakDirections(text);
      }
    }
  };

  const sendDirectMessage = async (textToSubmit) => {
    if (!textToSubmit || !textToSubmit.trim()) return;
    const cleanText = textToSubmit.trim();

    setMessages(prev => [...prev, { role: 'user', text: cleanText }]);
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        text: msg.text
      }));

      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      const endpoint = apiUrl.endsWith('/api') ? '/patient-chat' : '/api/patient-chat';

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: cleanText, 
          history,
          patientId: userProfile?.id,
          patientName: userProfile?.full_name
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
        
        // Handle navigation action returned by the agent
        if (data.action && data.action.type === 'navigate' && data.action.route === 'navigation') {
          setActiveTab('navigation');
          if (data.action.target) {
            setSelectedDestination(data.action.target);
            if (data.action.directions) {
              speakDirections(data.action.directions);
            }
          }
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const errReply = errData.message || "Sorry, I couldn't process your request right now. Please try again.";
        setMessages(prev => [...prev, { role: 'assistant', text: errReply }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't reach the server. Please check your connection." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInlineBold = (str) => {
    if (!str) return null;
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} style={{ color: 'var(--accent-teal, #2dd4bf)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderAssistantContent = (text, isLatest) => {
    let tagMatch = text.match(/\[(SLOTS|DATES|DOCTORS|LOCATIONS|OPTIONS):\s*(.*?)\s*\]/);
    let cleanText = text;
    let chipType = null;
    let chips = [];

    if (tagMatch) {
      chipType = tagMatch[1];
      cleanText = text.replace(/\[(SLOTS|DATES|DOCTORS|LOCATIONS|OPTIONS):\s*(.*?)\s*\]/, '').trim();
      chips = tagMatch[2].split(',').map(s => s.trim()).filter(Boolean);
    } else {
      const lower = text.toLowerCase();
      // Do NOT auto-detect chips if this is an appointment confirmation message
      const isBookingDone = lower.includes('successfully booked') || 
                            lower.includes('has been booked') || 
                            lower.includes('appointment has been confirmed') || 
                            lower.includes('successfully rescheduled');

      if (!isBookingDone) {
        // Auto-detect doctors list if asking the user to choose
        if ((lower.includes('which doctor') || lower.includes('select a doctor') || lower.includes('choose a doctor') || lower.includes('available doctors') || lower.includes('specialt')) &&
            (lower.includes('kirran') || lower.includes('smith') || lower.includes('doctor') || lower.includes('mithun'))) {
          chipType = 'DOCTORS';
          chips = [
            "Dr. Smith (Cardiology)",
            "Dr. Kirran Kumar (General Medicine)",
            "Dr. Mithun Nair (ENT)",
            "Dr. Quorum (Dentist)"
          ];
        } else if ((lower.includes('which location') || lower.includes('where would you like') || lower.includes('select a destination')) && 
                   (lower.includes('room') || lower.includes('pharmacy') || lower.includes('reception'))) {
          chipType = 'LOCATIONS';
          chips = [
            "Doctor Consultation Room 1",
            "Doctor Consultation Room 2",
            "Pharmacy",
            "Reception Desk"
          ];
        }
      }
    }

    const headerLabels = {
      'DOCTORS': '👨‍⚕️ Choose a Doctor to Book:',
      'LOCATIONS': '📍 Choose Destination for Directions:',
      'DATES': '📅 Select Date:',
      'SLOTS': '⏰ Available Time Slots:',
      'OPTIONS': '💡 Available Options:'
    };

    // Format markdown bullets into clean lines
    const rawLines = cleanText.split('\n').filter(l => l.trim().length > 0);
    const formattedContent = rawLines.map((line, lIdx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        return (
          <div key={lIdx} style={{ paddingLeft: '8px', margin: '4px 0' }}>
            <span style={{ color: 'var(--accent-teal, #2dd4bf)', marginRight: '6px' }}>•</span>
            {renderInlineBold(trimmed.replace(/^[*•-]\s*/, ''))}
          </div>
        );
      }
      return (
        <div key={lIdx} style={{ margin: '4px 0' }}>
          {renderInlineBold(trimmed)}
        </div>
      );
    });

    return (
      <div className="assistant-bubble-body">
        <div className="assistant-text-content">
          {isLatest && !tagMatch ? <TypewriterText text={cleanText} /> : formattedContent}
        </div>
        {chips.length > 0 && (
          <div className="slot-chips-wrapper">
            <span className="slot-chips-header">
              {headerLabels[chipType] || 'Select an Option:'}
            </span>
            <div className="slot-chips">
              {chips.map((item, idx) => (
                <button
                  key={`${item}-${idx}`}
                  className="slot-chip"
                  onClick={() => {
                    if (chipType === 'DOCTORS') {
                      sendDirectMessage(`Book an appointment with ${item}`);
                    } else if (chipType === 'LOCATIONS') {
                      sendDirectMessage(`Where is ${item}?`);
                    } else {
                      sendDirectMessage(item);
                    }
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };



  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    const msg = textInput.trim();
    setTextInput('');
    sendDirectMessage(msg);
  };

  const handleNavigateHome = (text) => {
    setActiveTab('home');
    sendDirectMessage(text);
  };

  const navItems = [
    { id: 'home', icon: <MessageSquare size={20} />, label: 'Assistant' },
    { id: 'explore', icon: <Search size={20} />, label: 'Explore Doctors' },
    { id: 'navigation', icon: <Compass size={20} />, label: 'Navigation' },
    { id: 'profile', icon: <UserIcon size={20} />, label: 'Profile' }
  ];

  return (
    <div className="dashboard-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="avatar-container">
            <div className="avatar-placeholder">
              <UserIcon size={24} color="var(--accent-teal)" />
            </div>
          </div>
          <span className="brand-name">CarePulse</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer with Log Out */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={onLogout} title="Sign Out">
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left mobile-only">
            <div className="avatar-container" onClick={() => setActiveTab('profile')} style={{ cursor: 'pointer' }}>
              <div className="avatar-placeholder">
                <UserIcon size={20} color="var(--accent-teal)" />
              </div>
            </div>
            <span className="brand-name">CarePulse</span>
          </div>
          <div className="desktop-spacer" />
          <div className="header-actions">
            <button className="header-logout-btn" onClick={onLogout} title="Sign Out">
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {activeTab === 'explore' ? (
          <Explore onNavigateHome={handleNavigateHome} />
        ) : activeTab === 'navigation' ? (
          <Navigation
            selectedDestination={selectedDestination}
            setSelectedDestination={setSelectedDestination}
            isSpeaking={isSpeaking}
            onToggleSpeak={handleToggleSpeak}
          />
        ) : activeTab === 'profile' ? (
          <div className="profile-tab-container animate-in">
            <h2 className="navigation-title">My Profile</h2>
            <p className="navigation-subtitle">Manage your account information and preferences.</p>
            
            <div className="profile-card">
              <div className="profile-avatar-large">
                {userProfile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'GP'}
              </div>
              <h3 className="profile-name">{userProfile?.full_name || 'Guest Patient'}</h3>
              <span className="profile-role-badge">{userProfile?.role || 'patient'}</span>
              
              <div className="profile-details-list">
                <div className="profile-detail-item">
                  <Mail size={16} color="var(--accent-teal)" />
                  <div className="detail-info">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-val">{userProfile?.email || 'patient@carepulse.com'}</span>
                  </div>
                </div>
                
                <div className="profile-detail-item">
                  <Phone size={16} color="var(--accent-teal)" />
                  <div className="detail-info">
                    <span className="detail-label">Phone Number</span>
                    <span className="detail-val">{userProfile?.contact_number || '(555) 019-2834'}</span>
                  </div>
                </div>

                <div className="profile-detail-item">
                  <Activity size={16} color="var(--accent-teal)" />
                  <div className="detail-info">
                    <span className="detail-label">Blood Type</span>
                    <span className="detail-val">O+</span>
                  </div>
                </div>
              </div>
              
              <button className="logout-btn" onClick={onLogout}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* ── IDLE / WELCOME VIEW ── */
          <div className="chat-welcome-container">
            <div className="welcome-hero-card animate-in">
              <div className="ai-badge-avatar">
                <Sparkles size={32} color="var(--accent-teal)" />
              </div>
              <h1 className="welcome-title">Hi {userProfile?.full_name ? userProfile.full_name.split(' ')[0] : 'there'}, how can I help you?</h1>
              <p className="welcome-subtitle">
                Your AI healthcare assistant can book appointments, register you with specialists, and provide live hospital directions.
              </p>
            </div>

            {/* Quick Auto-Suggestion Cards */}
            <div className="auto-suggest-grid animate-in">
              <span className="suggest-section-label">Suggested actions:</span>
              <div className="suggest-cards-wrapper">
                {AUTO_SUGGESTIONS.map((item, idx) => (
                  <button 
                    key={idx} 
                    className="suggest-card-btn"
                    onClick={() => sendDirectMessage(item.text)}
                  >
                    <div className="suggest-card-icon">{item.icon}</div>
                    <span className="suggest-card-label">{item.label}</span>
                    <ArrowRight size={14} className="suggest-arrow" />
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="bottom-chat-bar">
              <form onSubmit={handleTextSubmit} className="modern-chat-form">
                <input
                  type="text"
                  placeholder="Ask a question or type what you need (e.g. book an appointment)..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="modern-chat-input"
                  disabled={isLoading}
                  autoFocus
                />
                <button type="submit" className="modern-send-btn" disabled={!textInput.trim() || isLoading}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ── ACTIVE CONVERSATIONAL CHAT FEED ── */
          <div className="chat-feed-container">
            <div className="chat-messages-scroll">
              {messages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                const isLatest = isAssistant && idx === messages.length - 1;
                return (
                  <div 
                    key={idx} 
                    className={`chat-bubble-row ${isAssistant ? 'assistant-row' : 'user-row'} animate-in`}
                  >
                    {isAssistant && (
                      <div className="assistant-avatar-small">
                        <Sparkles size={16} color="var(--accent-teal)" />
                      </div>
                    )}
                    <div className={`chat-bubble ${isAssistant ? 'assistant-bubble' : 'user-bubble'}`}>
                      {isAssistant 
                        ? renderAssistantContent(msg.text, isLatest)
                        : <span>{msg.text}</span>
                      }
                    </div>
                  </div>
                );
              })}

              {isLoading && <ThinkingDots />}
              <div ref={messagesEndRef} />
            </div>

            {/* Sticky Bottom Area: Auto-Suggest Pills + Input Bar */}
            <div className="bottom-chat-bar active-chat-bar">
              {/* Horizontal Scrollable Suggestion Pills */}
              <div className="suggest-pills-row">
                {AUTO_SUGGESTIONS.slice(0, 5).map((item, idx) => (
                  <button
                    key={idx}
                    className="suggest-pill"
                    onClick={() => sendDirectMessage(item.text)}
                    disabled={isLoading}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleTextSubmit} className="modern-chat-form">
                <input
                  type="text"
                  placeholder="Type your reply..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="modern-chat-input"
                  disabled={isLoading}
                  autoFocus
                />
                <button type="submit" className="modern-send-btn" disabled={!textInput.trim() || isLoading}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Dashboard;

