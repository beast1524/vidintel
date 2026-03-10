import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL
    ? `${process.env.REACT_APP_API_URL}/api`
    : '/api'
});

export const processUrl = (url, model) =>
  api.post('/process', { url, model });

export const uploadFile = (formData) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getStatus = (jobId) =>
  api.get(`/status/${jobId}`);

export const getResults = (videoId) =>
  api.get(`/results/${videoId}`);

export const queryRag = (videoId, question) =>
  api.post('/query', { video_id: videoId, question });

export default api;
