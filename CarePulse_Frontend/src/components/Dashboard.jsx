import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Compass, User as UserIcon } from 'lucide-react';
import VoiceOrb from './VoiceOrb';

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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
        body: JSON.stringify({ message: textToSubmit, history }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
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

  const navItems = [
    { id: 'home', icon: <MessageSquare size={20} />, label: 'Home' },
    { id: 'explore', icon: <Compass size={20} />, label: 'Explore' },
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
          <Explore onNavigateHome={(msg) => {
            setActiveTab('home');
            if (msg) {
              // slight delay to allow tab switch to render
              setTimeout(() => sendDirectMessage(msg), 100);
            }
          }} />
        ) : messages.length === 0 ? (
          <>
            {/* Greeting Section */}
        {messages.length === 0 ? (
          /* ── IDLE: Greeting + Centre Orb ── */
          <div className="idle-view">
            <section className="greeting-section">
              <h1 className="greeting-title">Hi, how can I help you<br />today?</h1>
              <p className="greeting-subtitle">
                Your personal health assistant is ready to help with appointments or prescriptions.
              </p>
            </section>

            <div className="orb-container">
              <div className="orb-glow" />
              <div className="orb-glow" />
              <VoiceOrb onCommand={sendDirectMessage} className="orb" />
            </div>

            <div className="actions-section">
              <button className="action-btn" onClick={() => sendDirectMessage("I'd like to book an appointment")}>Book Appointment</button>
              <button className="action-btn" onClick={() => sendDirectMessage("Help me find a doctor")}>Find My Doctor</button>
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
