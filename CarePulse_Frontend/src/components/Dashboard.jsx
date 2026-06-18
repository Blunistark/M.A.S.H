import React, { useState, useRef, useEffect } from 'react';
import { Bell, Paperclip, Mic, Send, MessageSquare, Compass, User as UserIcon } from 'lucide-react';
import VoiceOrb from './VoiceOrb';

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const Dashboard = () => {
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const userMessage = message.trim();
    setMessage('');
    await sendDirectMessage(userMessage);
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
      // Remove trailing slash if present
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      // If apiUrl already ends with /api, don't add it again
      const endpoint = apiUrl.endsWith('/api') ? '/patient-chat' : '/api/patient-chat';

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSubmit, history }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        console.error('Failed to send message');
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't process your request right now." }]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't reach the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const renderMessageWithSlots = (text, role) => {
    if (role === 'user') return text;
    
    // Look for either [SLOTS: ...] or [DATES: ...]
    const match = text.match(/\[(SLOTS|DATES):\s*(.*?)\s*\]/);
    if (!match) return <TypewriterText text={text} />;

    const type = match[1];
    const cleanText = text.replace(/\[(SLOTS|DATES):\s*(.*?)\s*\]/, '');
    const items = match[2].split(',').map(s => s.trim());

    return (
      <>
        <div><TypewriterText text={cleanText} /></div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {items.map(item => (
            <button 
              key={item}
              onClick={() => sendDirectMessage(item)}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid var(--accent-teal)',
                color: 'var(--accent-teal)',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'var(--accent-teal)';
                e.target.style.color = '#000';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = 'var(--accent-teal)';
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </>
    );
  };

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
          <div className="desktop-spacer"></div>
          <button className="notification-btn">
            <Bell size={20} />
          </button>
        </header>

        {messages.length === 0 ? (
          <>
            {/* Greeting Section */}
            <section className="greeting-section">
              <h1 className="greeting-title">Hi, how can I help you<br/>today?</h1>
              <p className="greeting-subtitle">
                Your personal health assistant is ready to help with appointments or prescriptions.
              </p>
            </section>

            {/* Center Orb */}
            <div className="orb-container">
              <div className="orb-glow"></div>
              <div className="orb-glow"></div>
              <VoiceOrb onCommand={sendDirectMessage} className="orb" />
            </div>

            <div className="actions-section">
              <button className="action-btn" onClick={() => sendDirectMessage("I'd like to book an appointment")}>Book Appointment</button>
              <button className="action-btn" onClick={() => sendDirectMessage("Help me find a doctor")}>Find My Doctor</button>
            </div>
          </>
        ) : (
          <div className="voice-assistant-view" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="assistant-response-container" style={{ 
              marginTop: '4rem', 
              fontSize: '1.5rem', 
              color: '#fff', 
              textAlign: 'center',
              maxWidth: '800px',
              fontWeight: '500',
              lineHeight: '1.4'
            }}>
              {messages.filter(m => m.role === 'assistant').length > 0 ? 
                renderMessageWithSlots(messages.filter(m => m.role === 'assistant').pop().text, 'assistant') 
                : ''}
              
              {isLoading && (
                <div style={{ opacity: 0.7, fontStyle: 'italic', marginTop: '1rem' }}>
                  Thinking...
                </div>
              )}
            </div>

            {/* Bottom Centered Orb Container */}
            <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <VoiceOrb onCommand={sendDirectMessage} className="orb" />
            </div>
          </div>
        )}

        {/* Input Section Removed for purely Voice-Driven UI */}
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
