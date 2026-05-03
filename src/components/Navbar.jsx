import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Layout, FileText, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="navbar glass-panel">
      <Link to="/" className="nav-logo">
        <div className="logo-square">CV</div>
        <span className="logo-text">CodeVault</span>
      </Link>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Layout size={20} />
          <span>DSA Tracker</span>
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          <span>Notes Vault</span>
        </NavLink>
        <NavLink to="/experiences" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={20} />
          <span>Experiences</span>
        </NavLink>
      </div>

      <div className="nav-profile">
        {user ? (
          <div className="user-menu">
            <div className="user-info">
              <UserIcon size={18} />
              <span>{user.name}</span>
            </div>
            <button onClick={onLogout} className="logout-btn" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-sm">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
