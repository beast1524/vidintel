import React from 'react';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      {/* Grid background decoration */}
      <div className="hero-grid" aria-hidden="true"/>

      <div className="hero-content">
        <div className="badge badge-amber fade-up">
          <span className="badge-dot"/>
          Fully local · Zero API cost · Privacy-first
        </div>

        <h1 className="hero-headline fade-up-1">
          Extract intelligence<br/>
          <span className="hero-hl">from any video</span>
        </h1>

        <p className="hero-sub fade-up-2">
          Paste a YouTube URL or upload a video. Get back a full summary, structured
          notes, key timestamps, action items — and a chat interface to ask anything
          about the content. Powered by <span className="mono tx-amber">Whisper</span>,{' '}
          <span className="mono tx-amber">Mistral 7B</span>, and{' '}
          <span className="mono tx-amber">FAISS</span> running entirely on your machine.
        </p>

        {/* Stat row */}
        <div className="hero-stats fade-up-3">
          {[
            { val: '1000+', label: 'Video sources' },
            { val: '99 lang', label: 'Whisper support' },
            { val: '7B',     label: 'Mistral params' },
            { val: '0 $/mo', label: 'Running cost' },
          ].map(({ val, label }) => (
            <div key={label} className="hero-stat">
              <span className="stat-val mono">{val}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
