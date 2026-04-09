import axios from 'axios';
import { getApiBase, getStoredToken } from '../utils/apiHelpers';

const API_URL = getApiBase();

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Overview / Dashboard stats
export const getRecruiterOverview = async () => {
  const response = await axios.get(`${API_URL}/api/recruiter/overview`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Jobs management
export const getRecruiterJobs = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await axios.get(`${API_URL}/api/recruiter/jobs${queryParams ? `?${queryParams}` : ''}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const createJob = async (jobData) => {
  const response = await axios.post(`${API_URL}/api/recruiter/jobs`, jobData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getJob = async (jobId) => {
  const response = await axios.get(`${API_URL}/api/recruiter/jobs/${jobId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const updateJob = async (jobId, jobData) => {
  const response = await axios.put(`${API_URL}/api/recruiter/jobs/${jobId}`, jobData, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const deleteJob = async (jobId) => {
  const response = await axios.delete(`${API_URL}/api/recruiter/jobs/${jobId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const toggleJobStatus = async (jobId) => {
  const response = await axios.patch(`${API_URL}/api/recruiter/jobs/${jobId}/toggle`, {}, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Applications management
export const getApplications = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await axios.get(`${API_URL}/api/recruiter/applications${queryParams ? `?${queryParams}` : ''}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const getApplication = async (applicationId) => {
  const response = await axios.get(`${API_URL}/api/recruiter/applications/${applicationId}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await axios.put(`${API_URL}/api/recruiter/applications/${applicationId}/status`, { status }, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Analytics
export const getAnalytics = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await axios.get(`${API_URL}/api/recruiter/analytics${queryParams ? `?${queryParams}` : ''}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};

// Notifications
export const getNotifications = async (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  const response = await axios.get(`${API_URL}/api/recruiter/notifications${queryParams ? `?${queryParams}` : ''}`, {
    headers: getAuthHeaders()
  });
  return response.data;
};
