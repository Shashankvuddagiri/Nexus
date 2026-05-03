import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Layout, FileText, MessageSquare, LogOut, Code2, Sparkles, ChevronRight, Shield, Video } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, onLogout }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">NX</div>
        <span className="brand-name">Nexus</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group">
          <span className="group-title">Main Menu</span>
          <NavLink to="/" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Layout size={20} />
            <span>DSA Tracker</span>
            <ChevronRight size={14} className="chevron" />
          </NavLink>
          <NavLink to="/notes" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} />
            <span>Notes Vault</span>
            <ChevronRight size={14} className="chevron" />
          </NavLink>
          <NavLink to="/youtube" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <Video size={20} />
            <span>YouTube Vault</span>
            <ChevronRight size={14} className="chevron" />
          </NavLink>
          <NavLink to="/experiences" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
            <MessageSquare size={20} />
            <span>Experiences</span>
            <ChevronRight size={14} className="chevron" />
          </NavLink>
          {(user.name.toLowerCase() === 'admin' || user.username?.toLowerCase() === 'admin') && (
            <NavLink to="/admin" className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Shield size={20} />
              <span>Admin Panel</span>
              <ChevronRight size={14} className="chevron" />
            </NavLink>
          )}
        </div>

        <div className="nav-group">
          <span className="group-title">Personal</span>
          <div className="sidebar-item disabled">
            <Sparkles size={20} />
            <span>AI Assistant</span>
            <span className="badge-soon">Soon</span>
          </div>
        </div>
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">Developer</span>
            </div>
          </div>
          <button className="logout-button" onClick={onLogout}>
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
