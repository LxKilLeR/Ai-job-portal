import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

// Request OTP for signup
export const requestOTP = async (data) => {
  const response = await axios.post(`${API_URL}/api/otp/request`, data);
  return response.data;
};

// Verify OTP and create account
export const verifyOTP = async (data) => {
  const response = await axios.post(`${API_URL}/api/otp/verify`, data);
  return response.data;
};

// Resend OTP
export const resendOTP = async (email) => {
  const response = await axios.post(`${API_URL}/api/otp/resend`, { email });
  return response.data;
};
