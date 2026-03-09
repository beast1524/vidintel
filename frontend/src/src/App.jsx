import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import History from './pages/History/History';

function PlaceholderPage({ title, body }) {
  return (
    <div style={{
      maxWidth: 680,
      margin: '80px auto',
      padding: '0 24px',
      textAlign: 'center',
      fontFamily: 'var(--font-ui)',
    }}>
      <h1 style={{
        fontSize: 28,
        fontWeight: 800,
        color: 'var(--tx)',
        marginBottom: 12,
        letterSpacing: '-0.5px',
      }}>
        {title}
      </h1>
      <p style={{ color: 'var(--tx-2)', lineHeight: 1.7 }}>{body}</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route
          path="/docs"
          element={
            <PlaceholderPage
              title="API Documentation"
              body="The FastAPI backend auto-generates Swagger docs at http://localhost:8000/docs — open that in your browser once the backend is running."
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}