import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { MessageSquare, Compass, User as UserIcon } from 'lucide-react';

const Layout = () => {
  const navItems = [
    { id: 'home', path: '/home', icon: <MessageSquare size={20} />, label: 'Home' },
    { id: 'explore', path: '/explore', icon: <Compass size={20} />, label: 'Explore' },
    { id: 'profile', path: '/profile', icon: <UserIcon size={20} />, label: 'Profile' }
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
            <NavLink 
              key={item.id}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <Outlet />

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <NavLink 
            key={item.id}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
