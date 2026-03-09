import { useState, useEffect, useRef, useCallback } from 'react';
import { getStatus, getResults } from '../api';

/**
 * Polls /api/status/:jobId every 2.5s.
 * Auto-fetches results when status === 'complete'.
 * Cleans up on unmount.
 */
export function useJobPoller(jobId, videoId) {
  const [status,   setStatus]   = useState(null);
  const [progress, setProgress] = useState(0);
  const [step,     setStep]     = useState('');
  const [results,  setResults]  = useState(null);
  const [error,    setError]    = useState(null);
  const intervalRef = useRef(null);

  const clearPoll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    setStatus('processing');
    setProgress(0);
    setStep('downloading');
    setResults(null);
    setError(null);

    const poll = async () => {
      try {
        const { data } = await getStatus(jobId);
        setStatus(data.status);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.step)    setStep(data.step);

        if (data.status === 'complete') {
          clearPoll();
          try {
            const res = await getResults(videoId);
            setResults(res.data);
          } catch {
            setError('Processing finished but failed to load results.');
          }
        } else if (data.status === 'error') {
          clearPoll();
          setError(data.message || 'An unknown error occurred.');
        }
      } catch {
        clearPoll();
        setError('Cannot reach the server. Is the FastAPI backend running?');
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2500);
    return clearPoll;
  }, [jobId, videoId, clearPoll]);

  return { status, progress, step, results, error };
}
