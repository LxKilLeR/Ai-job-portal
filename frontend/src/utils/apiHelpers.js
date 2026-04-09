const DEFAULT_API_BASE = 'https://ai-job-portal-98k6.onrender.com';

export const getApiBase = () => {
  const configured = (import.meta.env.VITE_API_URL || '').trim();
  return (configured || DEFAULT_API_BASE).replace(/\/$/, '');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('ai_jobs_user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    localStorage.removeItem('ai_jobs_user');
    return null;
  }
};

export const getStoredToken = () => getStoredUser()?.token || localStorage.getItem('token') || '';

export const safeParseJson = async (response) => {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};