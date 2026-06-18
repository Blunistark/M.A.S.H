import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (data) => {
    localStorage.setItem('isAuthenticated', 'true');
    if (data && data.profile) {
      localStorage.setItem('userProfile', JSON.stringify(data.profile));
      setUserProfile(data.profile);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userProfile');
    setUserProfile(null);
    setIsAuthenticated(false);
  };

  return (
    <div className="app-container">
      {!isAuthenticated ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard userProfile={userProfile} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
