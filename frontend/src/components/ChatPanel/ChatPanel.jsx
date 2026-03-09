import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2, Clock } from 'lucide-react';
import { queryRag } from '../../api';
import './ChatPanel.css';

const SUGGESTIONS = [
  'Summarize the main argument in one sentence',
  'What action items were mentioned?',
  'What were the key timestamps?',
  'Who is this video aimed at?',
];

export default function ChatPanel({ videoId }) {
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMsgs(m => [...m, { role: 'user', text: q, ts: Date.now() }]);
    setLoading(true);

    try {
      const { data } = await queryRag(videoId, q);
      setMsgs(m => [...m, {
        role: 'bot',
        text: data.answer,
        citations: data.citations || [],
        ts: Date.now(),
      }]);
    } catch {
      setMsgs(m => [...m, {
        role: 'bot',
        text: 'Something went wrong. Make sure the backend is running.',
        error: true,
        ts: Date.now(),
      }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const fmt = (ts) => new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="chat-wrap">
      {/* Empty state */}
      {msgs.length === 0 && (
        <div className="chat-empty">
          <Bot size={32} className="chat-empty-icon"/>
          <p className="chat-empty-title">Ask anything about this video</p>
          <p className="chat-empty-sub">
            The answers are grounded in the actual transcript — no hallucinations.
          </p>
          <div className="chat-suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} className="chat-sug" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {msgs.length > 0 && (
        <div className="chat-messages">
          {msgs.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              <div className="chat-avatar">
                {m.role === 'bot' ? <Bot size={14}/> : <User size={14}/>}
              </div>
              <div className="chat-bubble-wrap">
                <div className={`chat-bubble ${m.error ? 'error' : ''}`}>
                  <p>{m.text}</p>
                  {m.citations?.length > 0 && (
                    <div className="chat-cites">
                      <span className="cites-label">Sources:</span>
                      {m.citations.map((c, ci) => (
                        <span key={ci} className="cite-tag mono">
                          <Clock size={10}/> {c.timestamp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="chat-ts mono">{fmt(m.ts)}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-msg bot">
              <div className="chat-avatar"><Bot size={14}/></div>
              <div className="chat-typing">
                <span/><span/><span/>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      )}

      {/* Input */}
      <div className="chat-input-wrap">
        <input
          ref={inputRef}
          className="chat-input mono"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask a question about the video…"
          disabled={loading}
        />
        <button
          className={`chat-send ${(!input.trim() || loading) ? 'disabled' : ''}`}
          onClick={() => send()}
          disabled={!input.trim() || loading}
        >
          {loading ? <Loader2 size={15} className="send-spin"/> : <Send size={15}/>}
        </button>
      </div>
    </div>
  );
}
