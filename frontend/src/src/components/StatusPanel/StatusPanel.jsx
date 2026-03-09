import React from 'react';
import {
  Download, Cpu, Scissors, BrainCircuit, Database,
  CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import './StatusPanel.css';

const STEPS = [
  { key: 'downloading',  label: 'Downloading audio',           icon: Download      },
  { key: 'transcribing', label: 'Transcribing with Whisper',   icon: Cpu           },
  { key: 'chunking',     label: 'Semantic chunking',           icon: Scissors      },
  { key: 'processing',   label: 'LLM processing (Mistral)',    icon: BrainCircuit  },
  { key: 'indexing',     label: 'Indexing into FAISS',         icon: Database      },
];

function StepRow({ step, status }) {
  const isDone    = status === 'done';
  const isActive  = status === 'active';
  const isWaiting = status === 'waiting';
  const Icon = step.icon;

  return (
    <div className={`step-row ${isDone ? 'done' : ''} ${isActive ? 'active' : ''} ${isWaiting ? 'waiting' : ''}`}>
      <div className="step-icon-wrap">
        {isDone
          ? <CheckCircle2 size={14}/>
          : isActive
            ? <Loader2 size={14} className="step-spin"/>
            : <Icon size={14}/>
        }
      </div>
      <span className="step-label">{step.label}</span>
      {isActive && <span className="step-badge mono">running</span>}
      {isDone    && <span className="step-badge done mono">done</span>}
    </div>
  );
}

export default function StatusPanel({ status, progress, step, error }) {
  const activeIdx = STEPS.findIndex(s => s.key === step);

  if (status === 'error') {
    return (
      <div className="sp-card sp-error fade-up">
        <AlertTriangle size={22} className="sp-icon-error"/>
        <div>
          <p className="sp-title">Pipeline error</p>
          <p className="sp-msg">{error}</p>
        </div>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="sp-card sp-complete fade-up">
        <CheckCircle2 size={22} className="sp-icon-complete"/>
        <div>
          <p className="sp-title">Done! Scroll down to explore your results.</p>
          <p className="sp-msg">Summary · Notes · Timestamps · Actions · Q&amp;A — all ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-card sp-processing fade-up">
      {/* Header */}
      <div className="sp-header">
        <div className="sp-header-left">
          <Loader2 size={18} className="sp-main-spin"/>
          <div>
            <p className="sp-title">Processing your video</p>
            <p className="sp-msg">Sit tight — this may take a few minutes for long videos.</p>
          </div>
        </div>
        <span className="sp-pct mono">{progress}<span className="sp-pct-sym">%</span></span>
      </div>

      {/* Progress bar */}
      <div className="sp-track">
        <div className="sp-fill" style={{ width: `${progress}%` }}/>
        <div className="sp-fill-glow" style={{ left: `${progress}%` }}/>
      </div>

      {/* Steps */}
      <div className="sp-steps">
        {STEPS.map((s, i) => {
          const stepStatus = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'waiting';
          return <StepRow key={s.key} step={s} status={stepStatus}/>;
        })}
      </div>
    </div>
  );
}
