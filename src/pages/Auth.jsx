import React, { useState } from 'react';
import { appwriteApi } from '../appwrite';
import { LogIn, UserPlus, Lock, User, ArrowRight } from 'lucide-react';
import './Auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await appwriteApi.login(formData.username, formData.password);
      } else {
        await appwriteApi.signup(formData.username, formData.password, formData.name || formData.username);
      }
      onAuthSuccess();
    } catch (err) {
      if (err.message.includes('Invalid credentials')) {
        setError('Invalid username or password. Note: Old accounts must be recreated for Nexus.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="auth-card glass-panel animate-fade-in">
        <div className="auth-logo-floating">
          <div className="logo-icon">NX</div>
        </div>
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-secondary">
            Join the Nexus ecosystem
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                required
                placeholder="Enter username"
                className="input-field"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          {!isLogin && (
            <div className="input-group">
              <label className="input-label">Full Name (Optional)</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {error && <div className="auth-error animate-shake">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button className="auth-switch-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Create one now' : 'Sign in instead'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
