import React, { useState, useEffect, useMemo } from 'react';
import { appwriteApi } from '../appwrite';
import { 
  Upload, Search, FileText, FileImage, File, X, 
  Download, Eye, LayoutGrid, List, Link as LinkIcon, 
  Plus, User, Folder, MoreVertical, Globe, Trash2, Loader2, Video
} from 'lucide-react';
import './NotesVault.css';

const CATEGORIES = ['DSA', 'Java', 'Python', 'CS Concepts', 'System Design', 'AI Resources', 'YouTube'];

const NotesVault = ({ user }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({ title: '', category: CATEGORIES[0], file: null, url: '' });

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const data = await appwriteApi.getNotes();
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!formData.file || !formData.title) return alert("Please provide title and file");
    setSyncing(true);
    try {
      await appwriteApi.uploadNote(formData.file, formData.title, formData.category, user);
      setShowUpload(false);
      setFormData({ title: '', category: CATEGORIES[0], file: null, url: '' });
      fetchNotes();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddLink = async () => {
    if (!formData.url || !formData.title) return alert("Please provide title and URL");
    setSyncing(true);
    try {
      await appwriteApi.addNoteLink(formData.title, formData.category, formData.url, user);
      setShowLinkModal(false);
      setFormData({ title: '', category: CATEGORIES[0], file: null, url: '' });
      fetchNotes();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSyncing(true);
    try {
      await appwriteApi.deleteNote(deleteConfirm.$id, deleteConfirm.fileId);
      setDeleteConfirm(null);
      fetchNotes();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchCat = activeCategory === 'All' || n.category === activeCategory;
      const matchSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [notes, activeCategory, searchQuery]);

  const openLink = (note) => {
    let url = note.url;
    if (!url && note.fileId) {
      const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
      const project = import.meta.env.VITE_APPWRITE_PROJECT_ID;
      const bucket = import.meta.env.VITE_APPWRITE_BUCKET_ID;
      url = `${endpoint}/storage/buckets/${bucket}/files/${note.fileId}/view?project=${project}`;
    }
    if (!url) return alert("Link not found");
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="notes-container animate-fade-in">
      <header className="notes-header mb-xl">
        <div className="flex-between mb-lg">
          <div>
            <h1>Notes Vault</h1>
            <p className="text-secondary">Your collaborative knowledge repository</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary mr-md" onClick={() => setShowLinkModal(true)}>
              <LinkIcon size={18} /> Add Tool Link
            </button>
            <div className="search-pill glass-panel">
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search notes..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pill-bar">
          <button 
            className={`pill ${activeCategory === 'All' ? 'active' : ''}`}
            onClick={() => setActiveCategory('All')}
          >All Documents</button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >{cat}</button>
          ))}
        </div>
      </header>

      <div className="notes-grid-bento">
        {loading ? (
          <div className="loading-card bento-card">
            <Loader2 className="animate-spin mb-md" size={32} />
            <p>Scanning the vault...</p>
          </div>
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const isYT = note.url?.includes('youtube.com') || note.url?.includes('youtu.be');
            return (
              <div key={note.$id} className="bento-card note-card-bento animate-lift">
                <div className="note-card-header">
                  <div className="note-type-icon">
                    {note.type === 'link' ? (
                      isYT ? <Video size={20} className="text-danger" /> : <Globe size={20} />
                    ) : <FileText size={20} />}
                  </div>
                  {note.authorId === user.$id && (
                    <button className="btn-icon-sm delete-btn" onClick={() => setDeleteConfirm(note)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="note-card-body">
                  <h3 className="note-title">{note.title}</h3>
                  <div className="note-meta-tags">
                    <span className="meta-tag">{note.category}</span>
                    <span className="meta-tag">
                      <User size={12} /> {note.authorName?.split(' ')[0] || 'User'}
                    </span>
                  </div>
                </div>
                <div className="note-card-footer">
                  {note.type === 'link' ? (
                    <button onClick={() => openLink(note)} className="btn-action w-full">
                      {isYT ? <Video size={16} /> : <LinkIcon size={16} />} 
                      {isYT ? 'Watch Video' : 'Open Tool'}
                    </button>
                  ) : (
                    <div className="flex-between w-full">
                      <button className="btn-action" onClick={() => openLink(note)}>
                        <Eye size={16} /> View
                      </button>
                      <a href={note.url || '#'} onClick={(e) => !note.url && e.preventDefault()} download className="btn-icon-sm">
                        <Download size={16} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-vault bento-card">
            <Folder size={48} className="text-muted mb-md" />
            <p>No notes found in this category.</p>
          </div>
        )}
      </div>

      <div className="fab-group">
        <button className="fab secondary" onClick={() => setShowLinkModal(true)}>
          <LinkIcon size={24} />
        </button>
        <button className="fab" onClick={() => setShowUpload(true)}>
          <Plus size={24} />
        </button>
      </div>

      {showUpload && (
        <div className="modal-overlay">
          <div className="modal-content bento-card">
            <div className="flex-between mb-md">
              <h3>Upload to Vault</h3>
              <button className="btn-icon" onClick={() => setShowUpload(false)}><X size={20} /></button>
            </div>
            <div className="input-group">
              <label className="input-label">Title</label>
              <input type="text" className="input-field" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">File</label>
              <input type="file" className="input-field" onChange={e => setFormData({...formData, file: e.target.files[0]})} />
            </div>
            <button className="btn btn-primary w-full mt-md" onClick={handleUpload} disabled={syncing}>
              {syncing ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : 'Secure Upload'}
            </button>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div className="modal-overlay">
          <div className="modal-content bento-card">
            <div className="flex-between mb-md">
              <h3>Add Link</h3>
              <button className="btn-icon" onClick={() => setShowLinkModal(false)}><X size={20} /></button>
            </div>
            <div className="input-group">
              <label className="input-label">Title</label>
              <input type="text" className="input-field" placeholder="e.g. ChatGPT or YT Video" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">URL</label>
              <input type="url" className="input-field" placeholder="https://..." value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} />
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button className="btn btn-primary w-full mt-md" onClick={handleAddLink} disabled={syncing}>
              {syncing ? <><Loader2 className="animate-spin" size={18} /> Saving...</> : 'Save Link'}
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content bento-card delete-modal">
            <Trash2 size={48} className="text-danger mb-md" />
            <h3>Delete "{deleteConfirm.title}"?</h3>
            <p className="text-secondary mb-lg">This action is permanent and cannot be undone.</p>
            <div className="flex-between w-full">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={syncing}>
                {syncing ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesVault;
