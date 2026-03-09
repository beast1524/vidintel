import React, { useState } from 'react';
import Hero from '../../components/Hero/Hero';
import InputPanel from '../../components/InputPanel/InputPanel';
import StatusPanel from '../../components/StatusPanel/StatusPanel';
import ResultsTabs from '../../components/ResultsTabs/ResultsTabs';
import { processUrl, uploadFile } from '../../api';
import { useJobPoller } from '../../hooks/useJobPoller';
import './Home.css';

export default function Home() {
  const [jobId,      setJobId]      = useState(null);
  const [videoId,    setVideoId]    = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr,  setSubmitErr]  = useState('');

  const { status, progress, step, results, error } = useJobPoller(jobId, videoId);

  // Save to history when results arrive
  React.useEffect(() => {
    if (results) {
      const history = JSON.parse(localStorage.getItem('vidintel_history') || '[]');
      const already = history.find(h => h.video_id === results.video_id);
      if (!already) {
        history.unshift({
          video_id:   results.video_id,
          title:      results.title || 'Untitled',
          duration:   results.duration || 0,
          summary:    results.summary?.slice(0, 120) + '...' || '',
          videoUrl:   results.videoUrl || '',
          processed_at: new Date().toISOString(),
        });
        localStorage.setItem('vidintel_history', JSON.stringify(history.slice(0, 50)));
      }
    }
  }, [results]);

  const handleSubmit = async ({ mode, url, file, model }) => {
    setSubmitting(true);
    setSubmitErr('');
    try {
      let res;
      if (mode === 'url') {
        res = await processUrl(url, model);
      } else {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('model', model);
        res = await uploadFile(fd);
      }
      setJobId(res.data.job_id);
      setVideoId(res.data.video_id);
    } catch (e) {
      setSubmitErr(
        e?.response?.data?.detail ||
        'Could not reach the backend. Make sure FastAPI is running on port 8000.'
      );
    }
    setSubmitting(false);
  };

  return (
    <div className="home-page">
      <Hero />
      <main className="home-main">
        <section className="home-section fade-up-1">
          <SectionLabel index="01" label="Input" />
          <InputPanel onSubmit={handleSubmit} loading={submitting} />
          {submitErr && <p className="home-err mono">{submitErr}</p>}
        </section>

        {jobId && (
          <section className="home-section fade-up-2">
            <SectionLabel index="02" label="Pipeline Status" />
            <StatusPanel status={status} progress={progress} step={step} error={error} />
          </section>
        )}

        {results && (
          <section className="home-section fade-up">
            <SectionLabel index="03" label="Results" />
            <ResultsTabs results={results} videoId={videoId} />
          </section>
        )}
      </main>
    </div>
  );
}

function SectionLabel({ index, label }) {
  return (
    <div className="section-label">
      <span className="section-idx mono">{index}</span>
      <span className="section-name">{label}</span>
      <div className="section-line" />
    </div>
  );
}