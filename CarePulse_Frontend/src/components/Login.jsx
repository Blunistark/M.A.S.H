import React, { useState } from 'react';
import { Activity } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password && (!isSignUp || fullName)) {
      setIsLoading(true);
      setError('');
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
        const bodyData = isSignUp ? { email, password, full_name: fullName } : { email, password };
        
        const response = await fetch(`${apiUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('carepulse_profile', JSON.stringify(data.profile));
          onLogin(data);
        } else {
          const errData = await response.json();
          setError(errData.message || 'Login failed');
        }
      } catch (err) {
        setError('Could not connect to server');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ background: 'var(--accent-teal)', padding: '12px', borderRadius: '50%' }}>
            <Activity size={40} color="#000" />
          </div>
        </div>
        <h1>CarePulse</h1>
        <p style={{ color: 'var(--text-muted)' }}>{isSignUp ? 'Create your health assistant account' : 'Sign in to your health assistant'}</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center', backgroundColor: '#fee2e2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
        
        {isSignUp && (
          <div className="input-group">
            <label htmlFor="fullName">Full Name</label>
            <input 
              type="text" 
              id="fullName"
              className="login-input" 
              placeholder="Enter your full name" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={isSignUp}
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
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary login-btn" disabled={isLoading}>
          {isLoading ? (isSignUp ? 'Signing up...' : 'Signing in...') : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button 
            type="button" 
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-teal)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
