import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { appwriteApi } from '../appwrite';
import { 
  Upload, Filter, CheckCircle, ExternalLink, X, 
  Database, Cloud, User, Target, Zap, Layers, BarChart3, Star, Search, Circle, Trash2
} from 'lucide-react';
import './DSATracker.css';

const DSATracker = ({ user }) => {
  const [problems, setProblems] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dailyProblem, setDailyProblem] = useState(null);

  const [isMappingVisible, setIsMappingVisible] = useState(false);
  const [uploadedData, setUploadedData] = useState([]);
  const [sourceName, setSourceName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ title: '', link: '', difficulty: '', topic: '' });

  const [filters, setFilters] = useState({ difficulty: 'All', topic: 'All', status: 'All', source: 'All' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [probs, progress, daily] = await Promise.all([
        appwriteApi.getProblems(),
        appwriteApi.getUserProgress(user.$id),
        appwriteApi.getDailyProblem()
      ]);
      setProblems(probs);
      setDailyProblem(daily);
      const progressMap = {};
      progress.forEach(p => progressMap[p.problemId] = p.status);
      setUserProgress(progressMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSourceName(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        setHeaders(data[0] || []);
        setUploadedData(data.slice(1));
        const newMap = { title: '', link: '', difficulty: '', topic: '' };
        (data[0] || []).forEach((h, i) => {
          const l = h.toString().toLowerCase();
          if (l.includes('title') || l.includes('problem')) newMap.title = i;
          else if (l.includes('link') || l.includes('url')) newMap.link = i;
          else if (l.includes('diff')) newMap.difficulty = i;
          else if (l.includes('topic')) newMap.topic = i;
        });
        setMapping(newMap);
        setIsMappingVisible(true);
      }
    };
    reader.readAsBinaryString(file);
  };

  const processMapping = async () => {
    setSyncing(true);
    try {
      const toAdd = uploadedData.map(row => ({
        title: mapping.title !== '' ? String(row[mapping.title] || '') : 'Untitled',
        link: mapping.link !== '' ? String(row[mapping.link] || '') : '',
        difficulty: mapping.difficulty !== '' ? String(row[mapping.difficulty] || '') : 'Medium',
        topic: mapping.topic !== '' ? String(row[mapping.topic] || '') : 'General',
        sources: [sourceName]
      })).filter(p => p.title);

      for (const p of toAdd) {
        await appwriteApi.createProblem(p, user);
      }
      setIsMappingVisible(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const toggleStatus = async (problemId) => {
    const currentStatus = userProgress[problemId] || 'unsolved';
    const newStatus = currentStatus === 'solved' ? 'unsolved' : 'solved';
    setUserProgress({ ...userProgress, [problemId]: newStatus });
    try {
      await appwriteApi.updateProgress(user.$id, problemId, newStatus);
    } catch (err) {
      setUserProgress({ ...userProgress, [problemId]: currentStatus });
    }
  };

  const handleDeleteSingle = async (id) => {
    if (!window.confirm("Delete this problem from the repository?")) return;
    try {
      await appwriteApi.deleteProblem(id);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBatch = async (source) => {
    if (!window.confirm(`Delete ALL problems from source: ${source}?`)) return;
    setSyncing(true);
    try {
      await appwriteApi.deleteProblemBatch(source);
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const filteredProblems = problems.filter(p => {
    const status = userProgress[p.$id] || 'unsolved';
    const matchDiff = filters.difficulty === 'All' || p.difficulty === filters.difficulty;
    const matchTopic = filters.topic === 'All' || p.topic === filters.topic;
    const matchStatus = filters.status === 'All' || status === filters.status;
    const matchSource = filters.source === 'All' || p.sources.includes(filters.source);
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDiff && matchTopic && matchStatus && matchSource && matchSearch;
  });

  const solvedCount = Object.values(userProgress).filter(s => s === 'solved').length;
  const sources = [...new Set(problems.flatMap(p => p.sources))];

  return (
    <div className="dashboard-container animate-fade-in">
      {dailyProblem && (
        <div className="daily-problem-card glass-panel mb-xl">
          <div className="daily-badge-container">
            <span className="daily-tag"><Zap size={14} /> Problem of the Day</span>
            <span className={`difficulty-tag ${dailyProblem.difficulty.toLowerCase()}`}>{dailyProblem.difficulty}</span>
          </div>
          <div className="daily-main">
            <div className="daily-info">
              <h3 className="daily-title">{dailyProblem.title}</h3>
              <p className="daily-topic">{dailyProblem.topic}</p>
            </div>
            <div className="daily-actions">
              <a href={dailyProblem.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Solve on LeetCode <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid Header */}
      <div className="bento-grid-top">
        <div className="bento-card stat-card">
          <div className="stat-icon purple"><Target size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Problems</span>
            <span className="stat-value">{problems.length}</span>
          </div>
        </div>
        <div className="bento-card stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Solved</span>
            <span className="stat-value">{solvedCount}</span>
          </div>
        </div>
        <div className="bento-card stat-card">
          <div className="stat-icon orange"><Zap size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Streak</span>
            <span className="stat-value">5 Days</span>
          </div>
        </div>
        <div className="bento-card progress-card">
          <div className="flex-between mb-sm">
            <span className="stat-label">Overall Progress</span>
            <span className="progress-percentage">{Math.round((solvedCount / (problems.length || 1)) * 100)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${(solvedCount / (problems.length || 1)) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="dashboard-main mt-lg">
        <div className="bento-card problems-explorer">
          <div className="explorer-header mb-lg">
            <div className="search-box">
              <Search size={18} className="text-muted" />
              <input 
                type="text" 
                placeholder="Quick search problems..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="explorer-actions">
              <select className="pill-select" value={filters.difficulty} onChange={e => setFilters({...filters, difficulty: e.target.value})}>
                <option value="All">Difficulty</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="pill-bar mb-lg">
            <button 
              className={`pill ${filters.source === 'All' ? 'active' : ''}`}
              onClick={() => setFilters({...filters, source: 'All'})}
            >All Sources</button>
            {sources.map(src => (
              <div key={src} className="pill-with-action">
                <button 
                  className={`pill ${filters.source === src ? 'active' : ''}`}
                  onClick={() => setFilters({...filters, source: src})}
                >{src}</button>
                {filters.source === src && (
                  <button className="pill-delete" onClick={() => handleDeleteBatch(src)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="problems-list">
            {loading ? (
              <div className="text-center p-xl">Scanning your problems...</div>
            ) : filteredProblems.map((p, idx) => {
              const status = userProgress[p.$id] || 'unsolved';
              return (
                <div key={p.$id} className={`problem-list-item animate-lift ${status === 'solved' ? 'solved-item' : ''}`}>
                  <div className="item-status">
                    <button className={`check-btn ${status === 'solved' ? 'checked' : ''}`} onClick={() => toggleStatus(p.$id)}>
                      <CheckCircle size={24} />
                    </button>
                  </div>
                  <div className="item-info">
                    <div className="title-row">
                      <h4 className="item-title">{p.title}</h4>
                      {status === 'solved' && <span className="solved-status-badge">Solved</span>}
                    </div>
                    <div className="item-meta">
                      <span className={`diff-tag ${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                      <span className="dot">•</span>
                      <span className="topic-tag">{p.topic}</span>
                    </div>
                  </div>
                  <div className="item-author">
                    <User size={14} />
                    <span>{p.authorName.split(' ')[0]}</span>
                  </div>
                  <div className="item-actions">
                    <button className="btn-icon star"><Star size={18} /></button>
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noreferrer" className="btn-icon link">
                        <ExternalLink size={18} />
                      </a>
                    )}
                    {p.authorId === user.$id && (
                      <button className="btn-icon delete" onClick={() => handleDeleteSingle(p.$id)}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <input type="file" id="excel-upload" hidden onChange={handleFileChange} />
      <label htmlFor="excel-upload" className="fab">
        <Upload size={24} />
      </label>

      {isMappingVisible && (
        <div className="modal-overlay">
          <div className="modal-content bento-card">
            <h3>Mapping Your Vault</h3>
            <div className="mapping-grid mt-md">
              {Object.keys(mapping).map(key => (
                <div key={key} className="input-group">
                  <label className="input-label capitalize">{key}</label>
                  <select 
                    value={mapping[key]} 
                    onChange={e => setMapping({...mapping, [key]: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="input-field"
                  >
                    <option value="">Skip</option>
                    {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex-end mt-lg">
              <button className="btn btn-primary" onClick={processMapping} disabled={syncing}>
                {syncing ? 'Processing...' : 'Start Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DSATracker;
