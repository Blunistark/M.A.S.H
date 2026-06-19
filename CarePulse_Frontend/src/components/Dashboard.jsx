import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Compass, Search, User as UserIcon, LogOut, Phone, Mail, Calendar, Activity, Info } from 'lucide-react';
import VoiceOrb from './VoiceOrb';
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
    }, 22);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const ThinkingDots = () => (
  <div className="thinking-dots">
    <span /><span /><span />
  </div>
);

const Dashboard = ({ userProfile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    setMessages(prev => [...prev, { role: 'user', text: textToSubmit }]);
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
          message: textToSubmit, 
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
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process your request right now." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't reach the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAssistantContent = (text) => {
    const match = text.match(/\[(SLOTS|DATES):\s*(.*?)\s*\]/);
    if (!match) return <TypewriterText text={text} />;

    const cleanText = text.replace(/\[(SLOTS|DATES):\s*(.*?)\s*\]/, '');
    const items = match[2].split(',').map(s => s.trim());

    return (
      <>
        <div><TypewriterText text={cleanText} /></div>
        <div className="slot-chips">
          {items.map(item => (
            <button
              key={item}
              className="slot-chip"
              onClick={() => sendDirectMessage(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </>
    );
  };

  const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');

  const handleNavigateHome = (text) => {
    setActiveTab('home');
    sendDirectMessage(text);
  };

  const navItems = [
    { id: 'home', icon: <MessageSquare size={20} />, label: 'Home' },
    { id: 'explore', icon: <Search size={20} />, label: 'Explore' },
    { id: 'navigation', icon: <Compass size={20} />, label: 'Navigation' }
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
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left mobile-only">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                <UserIcon size={20} color="var(--accent-teal)" />
              </div>
            </div>
            <span className="brand-name">CarePulse</span>
          </div>
          <div className="desktop-spacer" />
          <button className="notification-btn">
            <Bell size={20} />
          </button>
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
          /* ── IDLE: Greeting + Centre Orb ── */
          <div className="idle-view">
            <section className="greeting-section">
              <h1 className="greeting-title">Hi, how can I help you<br />today?</h1>
              <p className="greeting-subtitle">
                Your personal health assistant is ready to help with appointments or directions.
              </p>
            </section>
 
            <div className="orb-container">
              <div className="orb-glow" />
              <div className="orb-glow" />
              <VoiceOrb onCommand={sendDirectMessage} className="orb" />
            </div>
 
            <div className="actions-section">
              <button className="action-btn" onClick={() => sendDirectMessage("I'd like to book an appointment")}>Book Appointment</button>
              <button className="action-btn" onClick={() => sendDirectMessage("Where is Dr. Smith's room?")}>Navigate to Dr. Smith</button>
            </div>
          </div>
        ) : (
          /* ── ACTIVE: Response above, Orb at bottom ── */
          <div className="active-view">
            <div className="response-area">
              {isLoading ? (
                <ThinkingDots />
              ) : lastAssistantMsg ? (
                <div className="response-text">
                  {renderAssistantContent(lastAssistantMsg.text)}
                </div>
              ) : null}
            </div>
 
            <div className="active-orb-wrap">
              <VoiceOrb onCommand={sendDirectMessage} className="active-orb" />
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
