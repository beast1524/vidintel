import axios from 'axios';

// Base client — proxied to FastAPI at localhost:8000
const api = axios.create({ baseURL: '/api' });

/**
 * POST /api/process
 * Body: { url: string, model: string }
 * Returns: { job_id, video_id }
 */
export const processUrl = (url, model) =>
  api.post('/process', { url, model });

/**
 * POST /api/upload
 * Body: FormData (file + model)
 * Returns: { job_id, video_id }
 */
export const uploadFile = (formData) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * GET /api/status/:jobId
 * Returns: { status: 'processing'|'complete'|'error', progress: 0-100, step: string, message?: string }
 */
export const getStatus = (jobId) =>
  api.get(`/status/${jobId}`);

/**
 * GET /api/results/:videoId
 * Returns full results object
 */
export const getResults = (videoId) =>
  api.get(`/results/${videoId}`);

/**
 * POST /api/query
 * Body: { video_id, question }
 * Returns: { answer, citations: [{ chunk_id, timestamp, text }] }
 */
export const queryRag = (videoId, question) =>
  api.post('/query', { video_id: videoId, question });

export default api;
