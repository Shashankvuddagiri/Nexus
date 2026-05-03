import React, { useState, useEffect } from 'react';
import { appwriteApi } from '../appwrite';
import { 
  Users, Target, BookOpen, MessageSquare, 
  Search, Shield, BarChart3, ArrowRight,
  Loader2, Activity
} from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = ({ user }) => {
  const [profiles, setProfiles] = useState([]);
  const [allProgress, setAllProgress] = useState([]);
  const [notes, setNotes] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [youtubeLinks, setYoutubeLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [pfs, prog, nts, exps, yts] = await Promise.all([
        appwriteApi.getProfiles(),
        appwriteApi.getAllProgress(),
        appwriteApi.getNotes(),
        appwriteApi.getExperiences(),
        appwriteApi.getYouTubeLinks()
      ]);
      console.log("Fetched Profiles:", pfs);
      setProfiles(pfs);
      setAllProgress(prog);
      setNotes(nts);
      setExperiences(exps);
      setYoutubeLinks(yts);
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRepairProfile = async () => {
    try {
        await appwriteApi.ensureProfile(user);
        fetchAdminData();
    } catch (err) {
        alert("Repair failed: " + err.message);
    }
  };

  const getUserSolvedCount = (userId) => {
    return allProgress.filter(p => p.userId === userId && p.status === 'solved').length;
  };

  const getUserNotesCount = (userId) => {
    return notes.filter(n => n.authorId === userId).length;
  };

  const getUserExperiencesCount = (userId) => {
    return experiences.filter(e => e.authorId === userId).length;
  };

  const getUserVideosCount = (userId) => {
    return youtubeLinks.filter(v => v.authorId === userId).length;
  };

  const filteredProfiles = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (user.name.toLowerCase() !== 'admin' && user.username?.toLowerCase() !== 'admin') {
    return (
      <div className="admin-restricted">
        <Shield size={64} className="text-danger mb-md" />
        <h1>Restricted Access</h1>
        <p>You do not have administrative privileges to view this section.</p>
      </div>
    );
  }

  return (
    <div className="admin-container animate-fade-in">
      <header className="admin-header mb-xl">
        <div className="flex-between">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="text-secondary">Platform oversight and user analytics</p>
          </div>
          <button className="btn btn-primary" onClick={fetchAdminData}>
            <Activity size={18} /> Refresh Data
          </button>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="admin-stats-grid mb-xl">
        <div className="bento-card admin-stat">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <span className="label">Total Users</span>
            <span className="value">{profiles.length}</span>
          </div>
        </div>
        <div className="bento-card admin-stat">
          <div className="stat-icon green"><Target size={24} /></div>
          <div className="stat-info">
            <span className="label">Solved Problems</span>
            <span className="value">{allProgress.filter(p => p.status === 'solved').length}</span>
          </div>
        </div>
        <div className="bento-card admin-stat">
          <div className="stat-icon purple"><BookOpen size={24} /></div>
          <div className="stat-info">
            <span className="label">Shared Notes</span>
            <span className="value">{notes.length}</span>
          </div>
        </div>
        <div className="bento-card admin-stat">
          <div className="stat-icon orange"><MessageSquare size={24} /></div>
          <div className="stat-info">
            <span className="label">Experiences</span>
            <span className="value">{experiences.length}</span>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="bento-card user-management">
        <div className="flex-between mb-lg">
          <h2 className="section-title">User Engagement</h2>
          <div className="search-pill glass-panel">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Filter by name or username..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="admin-error glass-panel mb-lg p-md">
            <span className="text-danger">⚠️ Error fetching data: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-xl text-center">
            <Loader2 className="animate-spin mb-md mx-auto" size={32} />
            <p>Compiling user data...</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Username</th>
                  <th>Solved</th>
                  <th>Notes</th>
                  <th>Exp</th>
                  <th>Videos</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length > 0 ? (
                  filteredProfiles.map(profile => (
                    <tr key={profile.$id}>
                      <td>
                        <div className="user-info">
                          <div className="avatar">{profile.name ? profile.name[0].toUpperCase() : '?'}</div>
                          <span className="name">{profile.name || 'Unknown User'}</span>
                        </div>
                      </td>
                      <td><code className="username">@{profile.username || 'unknown'}</code></td>
                      <td>
                        <div className="solved-stat">
                          <BarChart3 size={14} className="text-success" />
                          <span>{getUserSolvedCount(profile.userId)}</span>
                        </div>
                      </td>
                      <td>
                        <span className="count-badge purple">{getUserNotesCount(profile.userId)}</span>
                      </td>
                      <td>
                        <span className="count-badge orange">{getUserExperiencesCount(profile.userId)}</span>
                      </td>
                      <td>
                        <span className="count-badge blue">{getUserVideosCount(profile.userId)}</span>
                      </td>
                      <td>
                        <span className={`role-badge ${profile.role}`}>
                          {profile.role || 'user'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center p-xl">
                      <p className="text-muted mb-md">No matching user profiles found in the system.</p>
                      <button className="btn btn-secondary" onClick={handleRepairProfile}>
                        Fix My Admin Profile
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
