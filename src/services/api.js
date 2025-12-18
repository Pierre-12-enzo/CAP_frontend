// services/api.js
import axios from 'axios';

// For Vite projects
const API_BASE_URL = 'http://localhost:5000/api';
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

      // Check if this is a login request
      const isLoginRequest = error.config?.url?.includes('/login');

      // Only redirect if it's NOT a login request
      if (!isLoginRequest) {
        console.log('401 error - Redirecting to login (non-login request)');
        window.location.href = '/login';
      } else {
        console.log('401 error on login - NOT redirecting (let login handle it)');
      }
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
      // Return the error response from backend
      if (error.response && error.response.data) {
        console.log('Backend error response:', error.response.data);
        return error.response.data; // This will be {success: false, error: 'Invalid credentials'}
      }

      // For network errors
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
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
    console.log('🟡 API: processCSVAndGenerate called');

    try {
      console.log('🟡 API: Making request to /card/process-csv-generate');
      console.log('🟡 API: FormData entries:');

      // Log form data contents
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      const response = await api.post('/card/process-csv-generate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        responseType: 'blob',
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Upload progress: ${percentCompleted}%`);
        }
      });

      console.log('✅ API: Request successful, received blob');
      console.log('✅ API: Response size:', response.data.size, 'bytes');
      console.log('✅ API: Response type:', response.data.type);

      return response.data;

    } catch (error) {
      console.error('❌ API: Request failed:', error);

      if (error.code === 'ECONNABORTED') {
        console.error('❌ API: Request timeout');
        throw new Error('Request timeout. Server took too long to respond.');
      }

      if (error.response) {
        console.error('❌ API: Server responded with error:', error.response.status);

        // Try to read error message
        try {
          const errorText = await error.response.data.text();
          console.error('❌ API: Error response:', errorText);

          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || `Server error: ${error.response.status}`);
          } catch {
            throw new Error(`Server error: ${error.response.status} - ${errorText.substring(0, 100)}`);
          }
        } catch (parseError) {
          throw new Error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        console.error('❌ API: No response received');
        throw new Error('No response from server. Check if backend is running.');
      } else {
        console.error('❌ API: Request setup error:', error.message);
        throw error;
      }
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
  getStudents: async (page = 1, limit = 10) => {
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
  deleteAllStudents: async () => {
    try {
      const response = await api.delete('/students/delete-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete all students' };
    }
  },

  // Get student statistics
  getStudentStats: async () => {
    try {
      const response = await api.get('/students/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get student stats' };
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

  // FIXED: previewTemplate function
  previewTemplate: async (publicId) => {
    try {
      // Generate the preview URL (no actual API call needed)
      // The backend preview route redirects to Cloudinary URL
      const previewUrl = `${API_BASE_URL}/templates/preview/${encodeURIComponent(publicId)}`;
      console.log('🖼️ Generated preview URL:', previewUrl);
      return previewUrl;
    } catch (error) {
      console.error('❌ Error generating preview URL:', error);
      throw error;
    }
  },

  // Alternative method: Direct Cloudinary URL generation
  getDirectTemplateUrl: async (templateId, side = 'front') => {
    try {
      const response = await api.get(`/templates/url/${templateId}/${side}`);
      return response.data.url;
    } catch (error) {
      console.error('❌ Error getting direct template URL:', error);
      throw error;
    }
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
  create: (permissions) => api.post('/permissions/create', permissions),

  // Get permissions by student ID
  getByStudent: (studentId) => api.get(`/permissions/student/${studentId}`),

  // Get single permission by ID
  getById: (permissionId) => api.get(`/permissions/${permissionId}`),

  // Update a permission status
  updateStatus: async (id, data = {}) => {
    const response = await api.patch(`/permissions/${id}/status`, {
      status: 'returned',
      ...data
    });
    return response.data;
  },

  // Delete a permission
  delete: (permissionId) => api.delete(`/permissions/${permissionId}`),

  // Generate PDF for permission (if you add this route later)
  generatePDF: (permissionId) => api.post(`/permissions/${permissionId}/print`, {}, {
    responseType: 'blob' // Important for file downloads
  }),

  // Get permission statistics/analytics
  getStats: () => api.get('/permissions/stats'),

  // Delete all permissions
  deleteAllPermissions: async () => {
    try {
      const response = await api.delete('/permissions/delete-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete all permissions' };
    }
  },

  // Get permission statistics
  getPermissionStats: async () => {
    try {
      const response = await api.get('/permissions/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get permission stats' };
    }
  }

};



//Analytics Api
export const analyticsAPI = {
  getDashboardSummary: async () => {
    const response = await api.get('/analytics/dashboard-summary');
    return response.data;
  },

  getMonthlyReport: async (year, month) => {
    const response = await api.get(`/analytics/monthly-report/${year}/${month}`);
    return response.data;
  },

  getTrends: async (timeRange = 'monthly') => {
    const response = await api.get(`/analytics/trends/${timeRange}`);
    return response.data;
  },

  getReturnPunctuality: async (startDate, endDate) => {
    let url = '/analytics/return-punctuality';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getClassAnalytics: async () => {
    const response = await api.get('/analytics/class');
    return response.data;
  },

  getReasonAnalytics: async () => {
    const response = await api.get('/analytics/reasons');
    return response.data;
  },

  // Weekly stats (we just added routes for these)
  getWeeklyActive: async () => {
    const response = await api.get('/analytics/weekly-active');
    return response.data;
  },

  getWeeklyReturned: async () => {
    const response = await api.get('/analytics/weekly-returned');
    return response.data;
  },

  // Student stats (we just added route)
  getStudentPermissionStats: async (studentId) => {
    const response = await api.get(`/analytics/student/${studentId}`);
    return response.data;
  }
};

// SMS API (for checking SMS status)
export const smsAPI = {
  getSMSStats: async () => {
    const response = await api.get('/analytics/sms-stats');
    return response.data;
  },

  sendTestSMS: async (phoneNumber, message) => {
    const response = await api.post('/analytics/test-sms', {
      phone: phoneNumber,
      message
    });
    return response.data;
  },

  getSMSLogs: async (limit = 50) => {
    const response = await api.get(`/analytics/sms-logs?limit=${limit}`);
    return response.data;
  }
};


// Export API for data export
export const exportAPI = {
  exportPermissions: async (format = 'excel', filters = {}) => {
    const response = await api.post('/export/permissions', {
      format,
      filters
    }, {
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  exportStudents: async (format = 'excel') => {
    const response = await api.post('/export/students', {
      format
    }, {
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  },

  exportAnalytics: async (format = 'excel', type = 'summary') => {
    const response = await api.post('/export/analytics', {
      format,
      type
    }, {
      responseType: format === 'excel' ? 'blob' : 'json'
    });
    return response.data;
  }
};

export default api;