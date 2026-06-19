import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Paperclip, Mic, Send, MessageSquare, Compass, User as UserIcon } from 'lucide-react';

const DatePickerWidget = ({ onSelect }) => {
  const [date, setDate] = useState('');
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <input 
        type="date" 
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{
          padding: '0.5rem 1rem',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--accent-teal)',
          color: 'var(--text-main)',
          borderRadius: '12px',
          outline: 'none',
          colorScheme: 'dark'
        }}
      />
      <button 
        onClick={() => { if(date) onSelect(date); }}
        disabled={!date}
        style={{
          padding: '0.5rem 1rem',
          background: date ? 'var(--accent-teal)' : 'transparent',
          border: '1px solid var(--accent-teal)',
          color: date ? '#000' : 'var(--accent-teal)',
          borderRadius: '12px',
          cursor: date ? 'pointer' : 'not-allowed',
          fontWeight: 'bold',
          opacity: date ? 1 : 0.5,
          transition: 'all 0.2s'
        }}
      >
        Confirm
      </button>
    </div>
  );
};

const Dashboard = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const rescheduleAppt = location.state?.rescheduleAppt;
  const hasRescheduled = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (rescheduleAppt && !hasRescheduled.current) {
      hasRescheduled.current = true;
      const initMsg = `I need to reschedule my appointment with ${rescheduleAppt.doctorName} which was originally on ${rescheduleAppt.date} at ${rescheduleAppt.time}.`;
      // We set a small timeout to let the UI mount properly
      setTimeout(() => {
        sendDirectMessage(initMsg);
      }, 500);
      // clean up location state
      window.history.replaceState({}, document.title);
    }
  }, [rescheduleAppt]);

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

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const storedProfile = localStorage.getItem('carepulse_profile');
      let pName = "Patient";
      if (storedProfile) {
        try { pName = JSON.parse(storedProfile).full_name; } catch(e){}
      }

      const response = await fetch(`${apiUrl}/api/patient-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSubmit, history, patientName: pName }),
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
    if (!match) return text;

    const type = match[1];
    const cleanText = text.replace(/\[(SLOTS|DATES):\s*(.*?)\s*\]/, '');
    const items = match[2].split(',').map(s => s.trim());

    if (type === 'DATES') {
      return (
        <>
          <div>{cleanText}</div>
          <DatePickerWidget onSelect={(date) => sendDirectMessage(date)} />
        </>
      );
    }

    return (
      <>
        <div>{cleanText}</div>
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

  return (
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
              <div className="orb"></div>
            </div>

            <div className="actions-section">
              <button className="action-btn" onClick={() => sendDirectMessage("I'd like to book an appointment")}>Book Appointment</button>
              <button className="action-btn" onClick={() => sendDirectMessage("Help me find a doctor")}>Find My Doctor</button>
            </div>
          </>
        ) : (
          <div className="chat-container" style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '100px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-bubble ${msg.role}`} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', 
                background: msg.role === 'user' ? 'var(--accent-teal)' : '#1E293B', 
                color: msg.role === 'user' ? '#000' : '#fff', 
                padding: '1rem 1.5rem', 
                borderRadius: '20px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '20px',
                maxWidth: '80%',
                lineHeight: '1.5'
              }}>
                {renderMessageWithSlots(msg.text, msg.role)}
              </div>
            ))}
            {isLoading && (
              <div className="message-bubble assistant" style={{ alignSelf: 'flex-start', background: '#1E293B', color: '#fff', padding: '1rem 1.5rem', borderRadius: '20px', borderBottomLeftRadius: '4px' }}>
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Section */}
        <div className="input-section">
          <div className="input-container">
            <button className="attachment-btn">
              <Paperclip size={20} />
            </button>
            <input 
              type="text" 
              className="message-input" 
              placeholder="Message CarePulse..." 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button className="mic-btn" onClick={handleSendMessage} disabled={isLoading}>
              {message.trim() ? <Send size={22} /> : <Mic size={22} />}
            </button>
          </div>
        </div>
      </main>
  );
};

export default Dashboard;
