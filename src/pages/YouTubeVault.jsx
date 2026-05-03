import React, { useState, useEffect } from 'react';
import { appwriteApi } from '../appwrite';
import { 
  Video, Plus, Search, X, Trash2, 
  Play, User, Clock, Loader2, ExternalLink
} from 'lucide-react';
import './YouTubeVault.css';

const YouTubeVault = ({ user }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ title: '', url: '' });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const data = await appwriteApi.getYouTubeLinks();
      setLinks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      await appwriteApi.addYouTubeLink(formData.title, formData.url, user);
      setShowAddModal(false);
      setFormData({ title: '', url: '' });
      fetchLinks();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this video resource?")) return;
    try {
      await appwriteApi.deleteYouTubeLink(id);
      fetchLinks();
    } catch (err) {
      alert(err.message);
    }
  };

  const getThumbnail = (url) => {
    try {
      const videoId = url.split('v=')[1]?.split('&')[0] || url.split('youtu.be/')[1]?.split('?')[0];
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
    } catch (e) {
      return null;
    }
  };

  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="yt-vault-container animate-fade-in">
      <header className="flex-between mb-xl">
        <div>
          <h1>YouTube Vault</h1>
          <p className="text-secondary">Curated video resources for your preparation</p>
        </div>
        <div className="header-actions">
          <div className="search-pill glass-panel mr-md">
            <Search size={18} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search videos..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Add Video
          </button>
        </div>
      </header>

      <div className="video-grid">
        {loading ? (
          <div className="loading-state bento-card">
            <Loader2 className="animate-spin mb-md" size={32} />
            <p>Fetching your playlist...</p>
          </div>
        ) : filteredLinks.length > 0 ? (
          filteredLinks.map(link => (
            <div key={link.$id} className="video-card bento-card animate-lift">
              <div className="video-thumbnail" onClick={() => window.open(link.url, '_blank')}>
                <img src={getThumbnail(link.url) || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=1074'} alt={link.title} />
                <div className="play-overlay">
                  <Play size={48} fill="white" />
                </div>
              </div>
              <div className="video-info">
                <h3 className="video-title">{link.title}</h3>
                <div className="video-meta">
                  <div className="author">
                    <User size={12} />
                    <span>{link.authorName.split(' ')[0]}</span>
                  </div>
                  <div className="actions">
                    {link.authorId === user.$id && (
                      <button className="btn-icon delete" onClick={() => handleDelete(link.$id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                    <a href={link.url} target="_blank" rel="noreferrer" className="btn-icon">
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state bento-card">
            <Video size={48} className="text-muted mb-md" />
            <p>Your video vault is empty. Start adding resources!</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content bento-card">
            <div className="flex-between mb-lg">
              <h3>Add Video Resource</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddLink}>
              <div className="input-group">
                <label className="input-label">Video Title</label>
                <input 
                  type="text" 
                  required 
                  className="input-field"
                  placeholder="e.g. Dynamic Programming Masterclass"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">YouTube URL</label>
                <input 
                  type="url" 
                  required 
                  className="input-field"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                />
              </div>
              <button className="btn btn-primary w-full mt-lg" type="submit" disabled={syncing}>
                {syncing ? 'Saving to Vault...' : 'Add to Collection'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubeVault;
