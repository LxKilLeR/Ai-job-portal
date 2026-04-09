import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://ai-job-portal-backend-1.onrender.com').replace(/\/$/, '');
const API_URL = `${API_BASE}/api/chat`;

export const sendMessageToAssistant = async (conversationHistory) => {
  try {
    // Get token from localStorage (ai_jobs_user object)
    let token = null;
    try {
      const userStr = localStorage.getItem('ai_jobs_user');
      token = userStr ? JSON.parse(userStr).token : null;
    } catch (error) {
      token = localStorage.getItem('token');
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.post(API_URL, {
      messages: conversationHistory
    }, { headers });

    if (response.data && response.data.success) {
      return { content: response.data.content };
    } else {
      throw new Error(response.data?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('Chat Service Error:', error);

    // Handle authentication errors
    if (error.response?.status === 401) {
      return {
        content: [
          { type: 'text', text: "Please login to access the AI assistant." }
        ]
      };
    }

    return {
      content: [
        { type: 'text', text: "Sorry, I couldn't connect to the AI assistant. Please make sure you're logged in and the backend is running." }
      ]
    };
  }
};
