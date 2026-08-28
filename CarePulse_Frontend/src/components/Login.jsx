import { useState } from 'react';
import { Activity, ArrowLeft, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Login = ({ onLogin }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'medical-history'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Store user data between steps
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingProfile, setPendingProfile] = useState(null);
  const [pendingSession, setPendingSession] = useState(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setMedicalHistory('');
    setError('');
    setInfo('');
    setPendingUser(null);
    setPendingProfile(null);
    setPendingSession(null);
  };

  const switchMode = (m) => {
    resetForm();
    setMode(m);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message); return; }

      const user = data.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      onLogin({ profile: profile || { id: user.id, email: user.email, full_name: user.user_metadata?.full_name, role: 'patient' } });
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });
      if (signUpError) { setError(signUpError.message); return; }

      const user = data.user;
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName,
          role: 'patient'
        });

        // Store user data and move to medical history step
        setPendingUser(user);
        setPendingSession(data.session);

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setPendingProfile(profile || { id: user.id, email, full_name: fullName, role: 'patient' });

        // Move to medical history step
        setMode('medical-history');
        setError('');
        setInfo('');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitMedicalHistory = async () => {
    if (!medicalHistory.trim()) {
      // Skip - just login
      handleSkipMedicalHistory();
      return;
    }

    setIsSummarizing(true);
    setError('');

    try {
      // Send medical history to backend for AI summarization
      const response = await fetch(`${API_URL}/api/patient-records/from-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: pendingUser.id,
          raw_medical_history: medicalHistory.trim()
        })
      });

      if (!response.ok) {
        console.warn('Failed to submit medical history, continuing anyway');
      } else {
        console.log('Medical history submitted and summarized successfully');
      }
    } catch (err) {
      console.warn('Medical history submission failed, continuing anyway:', err);
    } finally {
      setIsSummarizing(false);
    }

    // Complete login regardless of summarization result
    if (pendingSession) {
      onLogin({ profile: pendingProfile });
    } else {
      setInfo('Account created! Please check your email to confirm your account, then sign in.');
      switchMode('login');
    }
  };

  const handleSkipMedicalHistory = () => {
    if (pendingSession) {
      onLogin({ profile: pendingProfile });
    } else {
      setInfo('Account created! Please check your email to confirm your account, then sign in.');
      switchMode('login');
    }
  };

  // ─── Medical History Step (Step 2 of Registration) ───
  if (mode === 'medical-history') {
    return (
      <div className="login-container">
        <div className="login-content" style={{ maxWidth: '520px' }}>
          <div className="login-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--accent-teal), #6366f1)',
                padding: '14px',
                borderRadius: '50%',
                boxShadow: '0 4px 20px rgba(74, 210, 193, 0.3)',
              }}>
                <Sparkles size={32} color="#fff" />
              </div>
            </div>
            <h1 style={{ fontSize: '1.5rem' }}>Medical History</h1>
            <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.92rem', lineHeight: '1.5' }}>
              Help your doctor understand your health better. Describe any conditions, allergies, 
              surgeries, medications, or anything your doctor should know.
            </p>
          </div>

          {error && (
            <div style={{
              color: '#ef4444',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              padding: '10px 14px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label
              htmlFor="medicalHistory"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-secondary, #94a3b8)'
              }}
            >
              Describe your medical history in your own words
            </label>
            <textarea
              id="medicalHistory"
              className="login-input"
              placeholder="Example: I have Type 2 Diabetes diagnosed in 2019. I take Metformin 500mg twice daily. I'm allergic to Penicillin. My father had heart disease. I had my appendix removed in 2015..."
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={7}
              style={{
                resize: 'vertical',
                minHeight: '140px',
                maxHeight: '300px',
                lineHeight: '1.6',
                fontFamily: 'inherit',
                fontSize: '0.92rem',
              }}
            />
            <p style={{
              marginTop: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}>
              <Sparkles size={12} />
              Our AI will organize your information for your doctor
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-primary login-btn"
              onClick={handleSubmitMedicalHistory}
              disabled={isSummarizing || !medicalHistory.trim()}
              style={{
                opacity: (!medicalHistory.trim() && !isSummarizing) ? 0.6 : 1,
              }}
            >
              {isSummarizing ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span className="loading-spinner" style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(0,0,0,0.2)',
                    borderTop: '2px solid #000',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block',
                  }} />
                  AI is summarizing your history…
                </span>
              ) : (
                <>Submit & Continue</>
              )}
            </button>

            <button
              onClick={handleSkipMedicalHistory}
              disabled={isSummarizing}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '12px',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              Skip for now
            </button>
          </div>

          <button
            onClick={() => setMode('register')}
            disabled={isSummarizing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              margin: '20px auto 0',
              padding: '4px 8px',
            }}
          >
            <ArrowLeft size={14} />
            Back to registration
          </button>

          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ─── Login / Register Form (Step 1) ───
  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'var(--accent-teal)', padding: '12px', borderRadius: '50%' }}>
              <Activity size={36} color="#000" />
            </div>
          </div>
          <h1>CarePulse</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.95rem' }}>
            {mode === 'login' ? 'Sign in to your health assistant' : 'Create your patient account'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '28px',
          gap: '4px',
        }}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                background: mode === m ? 'var(--accent-teal)' : 'transparent',
                color: mode === m ? '#000' : 'var(--text-muted)',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            color: '#ef4444',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}
        {info && (
          <div style={{
            color: 'var(--accent-teal)',
            background: 'rgba(74,210,193,0.08)',
            border: '1px solid rgba(74,210,193,0.25)',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.9rem',
          }}>
            {info}
          </div>
        )}

        <form className="login-form" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="login-input"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="login-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="login-input"
              placeholder={mode === 'register' ? 'Create a password (min. 6 chars)' : 'Enter your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="login-input"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
            {isLoading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
          >
            {mode === 'login' ? 'Register' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
