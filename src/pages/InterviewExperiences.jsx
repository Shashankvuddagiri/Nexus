import React, { useState, useEffect } from 'react';
import { appwriteApi } from '../appwrite';
import { 
  MessageSquare, Plus, X, Building, Briefcase, 
  Calendar, User, Search, Send, Hash, Heart, 
  Share2, Bookmark, MoreHorizontal, Layers, Award, Trash2
} from 'lucide-react';
import './InterviewExperiences.css';

const InterviewExperiences = ({ user }) => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState({}); // { docId: boolean }

  const [formData, setFormData] = useState({
    company: '',
    role: '',
    content: ''
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const data = await appwriteApi.getExperiences();
      setExperiences(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await appwriteApi.createExperience(formData.company, formData.role, formData.content, user);
      setShowModal(false);
      setFormData({ company: '', role: '', content: '' });
      fetchExperiences();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLike = async (id, likes) => {
    try {
      await appwriteApi.likeExperience(id, likes);
      fetchExperiences();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this story?")) return;
    try {
      await appwriteApi.deleteExperience(id);
      fetchExperiences();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredExperiences = experiences.filter(exp => 
    exp.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="feed-container animate-fade-in">
      <header className="feed-header mb-xl">
        <div className="flex-between mb-lg">
          <div>
            <h1>Community Feed</h1>
            <p className="text-secondary">Explore real interview insights from peers</p>
          </div>
        </div>

        <div className="feed-controls glass-panel">
          <div className="search-box">
            <Search size={20} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search companies, roles or tags..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-pills">
            <button className="pill active">All</button>
            <button className="pill">MAANG</button>
            <button className="pill">Startups</button>
            <button className="pill">FinTech</button>
          </div>
        </div>
      </header>

      <div className="feed-main">
        {loading ? (
          <div className="text-center p-xl">Gathering stories...</div>
        ) : filteredExperiences.length > 0 ? (
          filteredExperiences.map((exp, idx) => (
            <article key={exp.$id} className="bento-card feed-card animate-lift">
              <div className="feed-card-header">
                <div className="author-info">
                  <div className="author-avatar">
                    {exp.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="author-details">
                    <span className="author-name">{exp.authorName}</span>
                    <span className="post-date">{new Date(exp.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="card-top-actions">
                  {exp.authorId === user.$id && (
                    <button className="btn-icon-sm text-danger" onClick={() => handleDelete(exp.$id)}>
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button className="btn-icon-sm"><MoreHorizontal size={20} /></button>
                </div>
              </div>

                <div className="feed-card-body">
                  <div className="company-badge mb-md">
                    <Building size={16} />
                    <span>{exp.company}</span>
                    <span className="divider">|</span>
                    <Briefcase size={16} />
                    <span>{exp.role}</span>
                  </div>

                  <h3 className="feed-card-title mb-md">Interview Journey at {exp.company}</h3>
                  
                  <div className={`feed-card-content formatted-content ${!expandedCards[exp.$id] ? 'truncated' : 'expanded'}`}>
                    {exp.content}
                  </div>

                  {exp.content.length > 300 && (
                    <button className="read-more-btn mt-md" onClick={() => toggleExpand(exp.$id)}>
                      {expandedCards[exp.$id] ? 'Show Less' : 'Read Full Story'}
                    </button>
                  )}

                <div className="tags-container mt-lg">
                  <span className="feed-tag">#Interview</span>
                  <span className="feed-tag">#Preparation</span>
                  <span className="feed-tag">#{exp.company.replace(/\s/g, '')}</span>
                </div>
              </div>

              <div className="feed-card-footer mt-lg">
                <div className="interaction-group">
                  <button 
                    className={`interaction-btn ${exp.likes > 0 ? 'liked' : ''}`}
                    onClick={() => handleLike(exp.$id, exp.likes)}
                  >
                    <Heart size={18} fill={exp.likes > 0 ? "currentColor" : "none"} /> 
                    <span>{exp.likes || 0}</span>
                  </button>
                  <button className="interaction-btn"><MessageSquare size={18} /> <span>0</span></button>
                  <button className="interaction-btn" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copied to clipboard!");
                  }}><Share2 size={18} /></button>
                </div>
                <button className="interaction-btn"><Bookmark size={18} /></button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-feed bento-card">
            <MessageSquare size={48} className="text-muted mb-md" />
            <p>No experiences shared yet. Be the first to share your story!</p>
          </div>
        )}
      </div>

      <button className="fab" onClick={() => setShowModal(true)}>
        <Plus size={24} />
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content bento-card">
            <div className="flex-between mb-md">
              <h3>Share Your Interview Experience</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="exp-form">
              <div className="input-row">
                <div className="input-group">
                  <label className="input-label">Company</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    placeholder="e.g. Amazon"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    placeholder="e.g. SDE-1"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Your Experience</label>
                <textarea 
                  required 
                  className="input-field textarea" 
                  rows="8" 
                  placeholder="Tell us about the rounds, questions, and your tips..."
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-md">
                <Send size={18} /> Publish Story
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewExperiences;
