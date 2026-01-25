import api from './api';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const userInfoAPI = {
  get: async () => {
    return api.get('/user-info');
  },

  createOrUpdate: async (data) => {
    return api.post('/user-info', data);
  },

  extractFromResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/user-info/extract-from-resume', formData);
  },

  generateResume: async (jobDescription) => {
    const response = await fetch(`${API_URL}/user-info/generate-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ job_description: jobDescription })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate resume');
    }

    return response.json();
  },

  viewResume: async (resumeId) => {
    const response = await fetch(`${API_URL}/user-info/resume/${resumeId}/view`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to load resume');
    }

    return response.json();
  },

  downloadResume: async (resumeId, filename) => {
    const response = await fetch(`${API_URL}/user-info/resume/${resumeId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to download resume');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'resume.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  generateResumeForView: async (jobDescription) => {
    const response = await fetch(`${API_URL}/user-info/generate-resume?view=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ job_description: jobDescription })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate resume');
    }

    return response.json();
  }
};
