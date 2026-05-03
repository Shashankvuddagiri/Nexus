import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { appwriteApi } from './appwrite';
import Sidebar from './components/Sidebar';
import DSATracker from './pages/DSATracker';
import NotesVault from './pages/NotesVault';
import YouTubeVault from './pages/YouTubeVault';
import InterviewExperiences from './pages/InterviewExperiences';
import AdminPanel from './pages/AdminPanel';
import Auth from './pages/Auth';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await appwriteApi.getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await appwriteApi.logout();
    setUser(null);
  };

  if (loading) return <div className="loading-screen">Preparing your vault...</div>;

  return (
    <Router>
      <div className={user ? "app-layout" : "auth-layout"}>
        {user && <Sidebar user={user} onLogout={handleLogout} />}
        <main className={user ? "main-dashboard" : "full-screen-auth"}>
          <Routes>
            <Route 
              path="/" 
              element={user ? <DSATracker user={user} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/notes" 
              element={user ? <NotesVault user={user} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/youtube" 
              element={user ? <YouTubeVault user={user} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/experiences" 
              element={user ? <InterviewExperiences user={user} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/admin" 
              element={user ? <AdminPanel user={user} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/auth" 
              element={!user ? <Auth onAuthSuccess={checkUser} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
