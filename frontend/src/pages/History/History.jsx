import React, { useState, useEffect } from 'react';
import { Clock, Trash2, ExternalLink, Play, RotateCcw } from 'lucide-react';
import { getResults } from '../../api';
import ResultsTabs from '../../components/ResultsTabs/ResultsTabs';
import './History.css';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function History() {
  const [history,  setHistory]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [results,  setResults]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('vidintel_history') || '[]');
    setHistory(h);
  }, []);

  const openVideo = async (item) => {
    setSelected(item);
    setResults(null);
    setError('');
    setLoading(true);
    try {
      const { data } = await getResults(item.video_id);
      setResults(data);
    } catch {
      setError('Could not load results. Make sure the backend is running.');
    }
    setLoading(false);
  };

  const deleteItem = (video_id, e) => {
    e.stopPropagation();
    const updated = history.filter(h => h.video_id !== video_id);
    setHistory(updated);
    localStorage.setItem('vidintel_history', JSON.stringify(updated));
    if (selected?.video_id === video_id) { setSelected(null); setResults(null); }
  };

  const clearAll = () => {
    if (window.confirm('Clear all history?')) {
      setHistory([]); setSelected(null); setResults(null);
      localStorage.removeItem('vidintel_history');
    }
  };

  if (history.length === 0) return (
    <div className="hist-empty">
      <Clock size={40} className="hist-empty-icon"/>
      <p className="hist-empty-title">No history yet</p>
      <p className="hist-empty-sub">Videos you process will appear here automatically.</p>
    </div>
  );

  return (
    <div className="hist-page">
      <div className="hist-sidebar">
        <div className="hist-sidebar-hd">
          <span className="hist-count mono">{history.length} video{history.length !== 1 ? 's' : ''}</span>
          <button className="hist-clear" onClick={clearAll}><RotateCcw size={13}/> Clear all</button>
        </div>

        <div className="hist-list">
          {history.map(item => (
            <div
              key={item.video_id}
              className={`hist-item ${selected?.video_id === item.video_id ? 'active' : ''}`}
              onClick={() => openVideo(item)}
            >
              <div className="hist-item-icon"><Play size={14}/></div>
              <div className="hist-item-info">
                <p className="hist-item-title">{item.title}</p>
                <div className="hist-item-meta">
                  <span className="mono">{formatDuration(item.duration)}</span>
                  <span>·</span>
                  <span>{formatDate(item.processed_at)}</span>
                </div>
                <p className="hist-item-preview">{item.summary}</p>
              </div>
              <button className="hist-delete" onClick={e => deleteItem(item.video_id, e)}>
                <Trash2 size={13}/>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="hist-main">
        {!selected && (
          <div className="hist-placeholder">
            <Clock size={32} className="hist-empty-icon"/>
            <p>Select a video from the list to view its results</p>
          </div>
        )}

        {selected && loading && (
          <div className="hist-placeholder">
            <div className="hist-spinner"/>
            <p>Loading results…</p>
          </div>
        )}

        {selected && error && (
          <div className="hist-placeholder error">
            <p>{error}</p>
          </div>
        )}

        {selected && results && !loading && (
          <div className="fade-up">
            <div className="hist-results-hd">
              <div>
                <h2 className="hist-results-title">{results.title}</h2>
                <div className="hist-results-meta">
                  <span className="mono">{formatDuration(results.duration)}</span>
                  {results.videoUrl && (
                    <a href={results.videoUrl} target="_blank" rel="noreferrer" className="hist-yt-link">
                      <ExternalLink size={12}/> Open in YouTube
                    </a>
                  )}
                </div>
              </div>
            </div>
            <ResultsTabs results={results} videoId={selected.video_id}/>
          </div>
        )}
      </div>
    </div>
  );
}