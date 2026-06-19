import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Explore from './components/Explore';
import AppointmentDetails from './components/AppointmentDetails';
import Navigation from './components/Navigation';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-container">
        {!isAuthenticated ? (
          <Routes>
            <Route path="*" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/home" replace />} />
              <Route path="home" element={<Dashboard />} />
              <Route path="explore" element={<Explore />} />
              <Route path="appointment/:id" element={<AppointmentDetails />} />
              <Route path="navigation" element={<Navigation />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Route>
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
