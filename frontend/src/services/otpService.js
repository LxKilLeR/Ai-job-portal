import axios from 'axios';
import { getApiBase } from '../utils/apiHelpers';

const API_URL = getApiBase();
const REQUEST_TIMEOUT_MS = 15000;

const normalizeRole = (role) => (role === 'Recruiter' ? 'Employer' : role);

const normalizeSignupPayload = (data = {}) => ({
  ...data,
  email: (data.email || '').trim().toLowerCase(),
  name: (data.name || '').trim(),
  company: (data.company || '').trim(),
  role: normalizeRole(data.role)
});

const getApiErrorMessage = (error, fallbackMessage) => {
  if (error?.code === 'ECONNABORTED') {
    return 'Server response timeout. Please try again.';
  }

  return error?.response?.data?.message || fallbackMessage;
};

// Request OTP for signup
export const requestOTP = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/otp/request`, normalizeSignupPayload(data), {
      timeout: REQUEST_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to send OTP'));
  }
};

// Verify OTP and create account
export const verifyOTP = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/api/otp/verify`, {
      ...data,
      email: (data.email || '').trim().toLowerCase(),
      role: normalizeRole(data.role),
      company: (data.company || '').trim(),
      name: (data.name || '').trim()
    }, {
      timeout: REQUEST_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to verify OTP'));
  }
};

// Resend OTP
export const resendOTP = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/api/otp/resend`, {
      email: (email || '').trim().toLowerCase()
    }, {
      timeout: REQUEST_TIMEOUT_MS
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to resend OTP'));
  }
};
