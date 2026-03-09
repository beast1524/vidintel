import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Clock, BookOpen } from 'lucide-react';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',        label: 'Process',  icon: <Activity size={14}/> },
  { to: '/history', label: 'History',  icon: <Clock size={14}/> },
  { to: '/docs',    label: 'API Docs', icon: <BookOpen size={14}/> },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-mark">
            <span className="logo-v">V</span>
          </span>
          <div className="nav-logo-text">
            <span className="logo-name">VidIntel</span>
            <span className="logo-tag mono">v1.0</span>
          </div>
        </Link>

        {/* Pipeline indicator */}
        <div className="nav-pipeline mono">
          <span className="pipe-step">yt-dlp</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-step">Whisper</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-step">Mistral</span>
          <span className="pipe-arrow">→</span>
          <span className="pipe-step active">FAISS</span>
        </div>

        {/* Links */}
        <nav className="nav-links">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${pathname === to ? 'active' : ''}`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
