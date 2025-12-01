// services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('capmis_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('capmis_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Get current user profile
  getProfile: async () => {
    const token = localStorage.getItem('capmis_token');
    if (!token) {
      throw new Error('No token found');
    }
    try {
      const response = await api.get('/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get profile' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      localStorage.removeItem('capmis_token');
      return response.data;
    } catch (error) {
      localStorage.removeItem('capmis_token');
      throw error.response?.data || { message: 'Logout failed' };
    }
  },
  // Update profile (name, email)
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/auth/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Update profile image
  updateProfileImage: async (imagePath) => {
    try {
      const response = await api.put('/auth/profile-image', { profileImage: imagePath });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile image' };
    }
  },

  // Get all users (admin only)
  getUsers: async () => {
    try {
      const response = await api.get('/auth');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get users' };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  },

  // Reset password
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password reset failed' };
    }
  }
};

// Card Generation API calls
export const cardAPI = {
  //upload single student photo
  uploadStudentPhoto: async (formData) => {
    try {
      const response = await api.post('/card/upload-student-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Photo upload failed' };
    }
  },
  //Get student photo for preview
  getStudentPhoto: async (studentId) => {
    try {
      const response = await api.get(`/card/student-photo/${studentId}`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get student photo' };
    }
  },
  //Getting template Dimension
    getTemplateDimensions: async (templateId) => {
    try {
      const response = await api.get(`/card/template-dimensions/${templateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get template dimensions' };
    }
  },
  //Getting card History
  getCardHistory: async (params = {}) => {
    try {
      const response = await api.get('/card/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get card history' };
    }
  },
  // Getting student card history
  getStudentCardHistory: async (studentId) => {
    try {
      const response = await api.get(`/card/history/student/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get student history' };
    }
  },
  //getting students with most generated cards
  getTopGenerators: async (limit = 10) => {
    try {
      const response = await api.get('/card/history/top-generators', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get top generators' };
    }
  },
  //Get Recent Generations
  getRecentGenerations: async (limit = 10) => {
    try {
      const response = await api.get('/card/history/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get recent generations' };
    }
  },

  // Download generated cards
  downloadCards: async (batchId) => {
    try {
      const response = await api.get(`/cards/download/${batchId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Download failed' };
    }
  },
  // Single-click CSV processing
  processCSVAndGenerate: async (formData) => {
    try {
      const response = await api.post('/card/process-csv-generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob', // ✅ IMPORTANT: Expect binary data
        timeout: 300000
      });
      return response.data; // This will be the ZIP file blob
    } catch (error) {
      throw error.response?.data || { message: 'CSV processing failed' };
    }
  },

  // Single student card generation
  // In your cardAPI object in api.js
  generateSingleCardWithTemplate: async (formData) => {
    try {
      console.log('📡 Sending single card generation request...');
      const response = await api.post('/card/generate-single-card', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob' // ✅ IMPORTANT: Expect binary data
      });
      return response.data; // This will be the ZIP file blob
    } catch (error) {
      console.error('❌ API call failed:', error);
      throw error.response?.data || { message: 'Card generation failed' };
    }
  },

  // Get all students for dropdown
  getStudents: async () => {
    try {
      const response = await api.get('/card/students');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch students' };
    }
  }
};

// Student Management API calls
export const studentAPI = {
  // Get all students
  getStudents: async (page = 1, limit = 50) => {
    try {
      const response = await api.get(`/students?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch students' };
    }
  },

  // Add single student
  addStudent: async (studentData) => {
    try {
      const response = await api.post('/students', studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add student' };
    }
  },

  // Update student
  updateStudent: async (studentId, studentData) => {
    try {
      const response = await api.put(`/students/${studentId}`, studentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update student' };
    }
  },

  // Delete student
  deleteStudent: async (studentId) => {
    try {
      const response = await api.delete(`/students/${studentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete student' };
    }
  },

  // Bulk upload students via CSV
  bulkUpload: async (csvFile) => {
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);

      const response = await api.post('/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Bulk upload failed' };
    }
  },
  cleanupOrphanedFiles: async () => {
    try {
      const response = await api.post('/students/cleanup-orphaned-files');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Cleanup failed' };
    }
  }
};

// Template Management API calls
export const templateAPI = {
  getTemplates: async () => {
    const response = await api.get('/templates');
    return response.data;
  },

  uploadTemplate: async (formData) => {
    const response = await api.post('/templates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  setDefaultTemplate: async (templateId) => {
    const response = await api.patch(`/templates/${templateId}/set-default`);
    return response.data;
  },

  deleteTemplate: async (templateId) => {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  },
  previewTemplate: async (templateName) => {
    const Url = `${API_BASE_URL}/templates/preview/${templateName}`;
    return Url;
  },

  cleanupOrphanedFiles: async () => {
    try {
      const response = await api.post('/templates/cleanup-orphaned-files');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Cleanup failed' };
    }
  }

};


// Utility function to check server status
export const checkServerStatus = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Server is not responding');
  }
};

// PermissionAPI
export const permissionAPI = {
  // Get all permissions
  getAll: () => api.get('/permissions'),
  
  // Create multiple permissions (bulk)
  createBulk: (permissions) => api.post('/permissions/bulk', { permissions }),
  
  // Get permissions by student ID
  getByStudent: (studentId) => api.get(`/permissions/student/${studentId}`),
  
  // Get single permission by ID
  getById: (permissionId) => api.get(`/permissions/${permissionId}`),
  
  // Update a permission
  update: (permissionId, permissionData) => api.put(`/permissions/${permissionId}`, permissionData),
  
  // Delete a permission
  delete: (permissionId) => api.delete(`/permissions/${permissionId}`),
  
  // Generate PDF for permission (if you add this route later)
  generatePDF: (permissionId) => api.post(`/permissions/${permissionId}/print`, {}, { 
    responseType: 'blob' // Important for file downloads
  }),
  
  // Get permission statistics/analytics
  getStats: () => api.get('/permissions/stats')
};

export default api;