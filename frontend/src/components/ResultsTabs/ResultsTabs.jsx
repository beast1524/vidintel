import React, { useState } from 'react';
import {
  AlignLeft, ListTree, Clock, CheckSquare, MessageSquare,
  Copy, Check, ExternalLink
} from 'lucide-react';
import ChatPanel from '../ChatPanel/ChatPanel';
import './ResultsTabs.css';

/* ─────────────────────────── helpers ─────────────────────── */
function CopyBtn({ text }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button className="rt-copy" onClick={copy} title="Copy to clipboard">
      {done ? <Check size={13}/> : <Copy size={13}/>}
    </button>
  );
}

/* ─────────────────────────── Tab: Summary ─────────────────── */
function SummaryTab({ data }) {
  return (
    <div className="rt-pane fade-up">
      <div className="rt-block">
        <div className="rt-block-hd">
          <span>Video Summary</span>
          <CopyBtn text={data.summary}/>
        </div>
        <p className="rt-summary-body">{data.summary}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab: Notes ──────────────────── */
function NotesTab({ data }) {
  return (
    <div className="rt-pane fade-up">
      {(data.notes || []).map((section, i) => (
        <div key={i} className="rt-block">
          <div className="rt-block-hd">
            <span className="rt-section-title">{section.title}</span>
            <CopyBtn text={section.points.join('\n')}/>
          </div>
          <ul className="rt-notes-list">
            {section.points.map((pt, j) => (
              <li key={j}>
                <span className="rt-bullet mono">›</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Tab: Timestamps ─────────────── */
function TimestampsTab({ data }) {
  return (
    <div className="rt-pane fade-up">
      <div className="rt-ts-grid">
        {(data.timestamps || []).map((t, i) => (
          <a
            key={i}
            className="rt-ts-card"
            href={data.videoUrl ? `${data.videoUrl}&t=${t.seconds}` : '#'}
            target="_blank"
            rel="noreferrer"
          >
            <span className="rt-ts-time mono">{t.label}</span>
            <p className="rt-ts-desc">{t.description}</p>
            <ExternalLink size={12} className="rt-ts-ext"/>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab: Actions ─────────────────── */
function ActionsTab({ data }) {
  const [checked, setChecked] = useState({});
  const total    = (data.actions || []).length;
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="rt-pane fade-up">
      <div className="rt-block">
        <div className="rt-block-hd">
          <span>Action Items</span>
          <span className="rt-actions-count mono">
            {doneCount}/{total} complete
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="rt-act-track">
          <div
            className="rt-act-fill"
            style={{ width: total ? `${(doneCount/total)*100}%` : '0%' }}
          />
        </div>

        <ul className="rt-actions-list">
          {(data.actions || []).map((a, i) => (
            <li
              key={i}
              className={`rt-action-item ${checked[i] ? 'checked' : ''}`}
              onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
            >
              <span className={`rt-checkbox ${checked[i] ? 'on' : ''}`}>
                {checked[i] && <Check size={11}/>}
              </span>
              <span className="rt-action-text">{a}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main export ──────────────────── */
const TABS = [
  { id: 'summary',    label: 'Summary',     icon: AlignLeft     },
  { id: 'notes',      label: 'Notes',       icon: ListTree      },
  { id: 'timestamps', label: 'Timestamps',  icon: Clock         },
  { id: 'actions',    label: 'Actions',     icon: CheckSquare   },
  { id: 'chat',       label: 'Q&A Chat',    icon: MessageSquare },
];

export default function ResultsTabs({ results, videoId }) {
  const [active, setActive] = useState('summary');

  return (
    <div className="rt-wrap fade-up">
      {/* Tab bar */}
      <div className="rt-tabbar">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`rt-tab ${active === id ? 'active' : ''}`}
            onClick={() => setActive(id)}
          >
            <Icon size={14}/>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rt-content">
        {active === 'summary'    && <SummaryTab    data={results}/>}
        {active === 'notes'      && <NotesTab      data={results}/>}
        {active === 'timestamps' && <TimestampsTab data={results}/>}
        {active === 'actions'    && <ActionsTab    data={results}/>}
        {active === 'chat'       && <ChatPanel     videoId={videoId}/>}
      </div>
    </div>
  );
}
