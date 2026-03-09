import React, { useState, useRef } from 'react';
import { Link2, Upload, Play, ChevronRight, X } from 'lucide-react';
import './InputPanel.css';

const MODELS = [
  { id: 'whisper-small',  label: 'Small',  detail: '~1 min/hr · lower accuracy' },
  { id: 'whisper-medium', label: 'Medium', detail: '~8 min/hr · recommended' },
  { id: 'whisper-large',  label: 'Large',  detail: '~15 min/hr · best accuracy' },
];

export default function InputPanel({ onSubmit, loading }) {
  const [mode,  setMode]  = useState('url');
  const [url,   setUrl]   = useState('');
  const [file,  setFile]  = useState(null);
  const [model, setModel] = useState('whisper-medium');
  const fileRef = useRef(null);

  const canSubmit = !loading && (mode === 'url' ? url.trim().length > 10 : !!file);

  const handleGo = () => {
    if (!canSubmit) return;
    onSubmit({ mode, url: url.trim(), file, model });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) { setFile(dropped); setMode('file'); }
  };

  return (
    <div className="ip-wrap">
      {/* Mode toggle */}
      <div className="ip-mode-row">
        <div className="ip-toggle">
          <button
            className={mode === 'url' ? 'active' : ''}
            onClick={() => setMode('url')}
          >
            <Link2 size={13}/> YouTube / URL
          </button>
          <button
            className={mode === 'file' ? 'active' : ''}
            onClick={() => setMode('file')}
          >
            <Upload size={13}/> Upload File
          </button>
        </div>
        <span className="ip-hint mono">
          {mode === 'url'
            ? 'Supports YouTube, Vimeo, Twitter/X, and 1000+ sites via yt-dlp'
            : 'MP4 · MKV · WEBM · AVI · MOV · MP3 · WAV'}
        </span>
      </div>

      {/* URL input */}
      {mode === 'url' && (
        <div className="ip-url-row fade-in">
          <span className="ip-url-prefix mono">URL ›</span>
          <input
            className="ip-url-input mono"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGo()}
            placeholder="https://www.youtube.com/watch?v=..."
            autoFocus
          />
          {url && (
            <button className="ip-clear" onClick={() => setUrl('')}>
              <X size={14}/>
            </button>
          )}
        </div>
      )}

      {/* File drop zone */}
      {mode === 'file' && (
        <div
          className={`ip-drop fade-in ${file ? 'has-file' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileRef}
            type="file"
            accept="video/*,audio/*"
            style={{ display:'none' }}
            onChange={e => setFile(e.target.files[0])}
          />
          {file ? (
            <>
              <div className="drop-file-icon"><Play size={20}/></div>
              <p className="drop-file-name mono">{file.name}</p>
              <p className="drop-file-size">
                {(file.size / 1024 / 1024).toFixed(1)} MB &mdash; click to change
              </p>
            </>
          ) : (
            <>
              <div className="drop-upload-icon"><Upload size={22}/></div>
              <p className="drop-main">Drop your video here</p>
              <p className="drop-sub">or click to browse files</p>
            </>
          )}
        </div>
      )}

      {/* Model selector */}
      <div className="ip-model-row">
        <span className="ip-model-label">Whisper model</span>
        <div className="ip-model-pills">
          {MODELS.map(m => (
            <button
              key={m.id}
              className={`ip-pill ${model === m.id ? 'active' : ''}`}
              onClick={() => setModel(m.id)}
            >
              <span className="pill-name">{m.label}</span>
              <span className="pill-detail mono">{m.detail}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        className={`ip-submit ${!canSubmit ? 'disabled' : ''}`}
        onClick={handleGo}
        disabled={!canSubmit}
      >
        {loading ? (
          <>
            <span className="ip-spinner"/>
            <span>Starting pipeline…</span>
          </>
        ) : (
          <>
            <Play size={15} fill="currentColor"/>
            <span>Run Pipeline</span>
            <ChevronRight size={15} className="ip-chevron"/>
          </>
        )}
      </button>
    </div>
  );
}
