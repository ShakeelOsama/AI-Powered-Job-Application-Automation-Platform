// Use relative URL in production (same origin), localhost in development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

console.log("api url: ",API_BASE_URL)
// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('token');

// Common fetch wrapper with auth
const fetchWithAuth = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Only add Content-Type for JSON requests (not FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }
  
  return data;
};

// Auth API
export const authAPI = {
  register: async (email, password, fullName) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  },
  
  login: async (email, password) => {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: async () => {
    const user = await fetchWithAuth('/auth/me');
    return user.data;
    localStorage.setItem('user', JSON.stringify(user.data));
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Resume API
export const resumeAPI = {
  getAll: async () => {
    return fetchWithAuth('/resumes');
  },
  
  getOne: async (id) => {
    return fetchWithAuth(`/resumes/${id}`);
  },
  
  upload: async (file, name) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    
    return fetchWithAuth('/resumes', {
      method: 'POST',
      body: formData,
    });
  },
  
  delete: async (id) => {
    return fetchWithAuth(`/resumes/${id}`, {
      method: 'DELETE',
    });
  },
};

// Cover Letter API
export const coverLetterAPI = {
  generate: async (resumeId, jobDescription) => {
    return fetchWithAuth('/jobs/generate-cover-letter', {
      method: 'POST',
      body: JSON.stringify({
        resume_id: resumeId,
        job_description: jobDescription,
      }),
    });
  },
};

// Email API
export const emailAPI = {
  send: async (toEmail, subject, body, resumeId) => {
    return fetchWithAuth('/email/send', {
      method: 'POST',
      body: JSON.stringify({
        to_email: toEmail,
        subject,
        body,
        resume_id: resumeId,
      }),
    });
  },
};

// Google OAuth API
export const googleAuthAPI = {
  getAuthUrl: async () => {
    return fetchWithAuth('/auth/google');
  },
};

// Job Automation API
export const jobAutomationAPI = {
  // Start job automation process
  start: async (jobDescription, recruiterEmail = null) => {
    return fetchWithAuth('/job-automation/start', {
      method: 'POST',
      body: JSON.stringify({
        job_description: jobDescription,
        recruiter_email: recruiterEmail,
      }),
    });
  },
  
  // Get status of a specific job application
  getStatus: async (jobId) => {
    return fetchWithAuth(`/job-automation/status/${jobId}`);
  },
  
  // Get all job applications
  getApplications: async (skip = 0, limit = 20, status = null) => {
    let url = `/job-automation/applications?skip=${skip}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return fetchWithAuth(url);
  },
  
  // Get details of a specific job application
  getApplicationDetails: async (jobId) => {
    return fetchWithAuth(`/job-automation/application/${jobId}`);
  },
  
  // Delete a job application
  deleteApplication: async (jobId) => {
    return fetchWithAuth(`/job-automation/application/${jobId}`, {
      method: 'DELETE',
    });
  },
  
  // Retry a failed job application
  retry: async (jobId) => {
    return fetchWithAuth(`/job-automation/retry/${jobId}`, {
      method: 'POST',
    });
  },
};

export default {
  auth: authAPI,
  resume: resumeAPI,
  coverLetter: coverLetterAPI,
  email: emailAPI,
  googleAuth: googleAuthAPI,
  jobAutomation: jobAutomationAPI,
  get: async (endpoint) => fetchWithAuth(endpoint, { method: 'GET' }),
  post: async (endpoint, body) => fetchWithAuth(endpoint, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: async (endpoint, body) => fetchWithAuth(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: async (endpoint) => fetchWithAuth(endpoint, { method: 'DELETE' }),
};
