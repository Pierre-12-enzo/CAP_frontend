import axios from 'axios';

// ============================================
// ENVIRONMENT-BASED CONFIGURATION
// ============================================

// Determine environment
const getEnvironment = () => {
  // Method 1: Check Vite environment variable (for React/Vite projects)
  if (import.meta.env?.MODE) {
    return import.meta.env.MODE; // 'development', 'production', 'test'
  }
  
  // Method 2: Check process.env for Create React App or Node.js
  if (process.env?.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  // Method 3: Check window location for production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    return 'production';
  }
  
  // Default
  return 'production';
};

// API URLs for different environments
const API_URLS = {
  development: 'http://localhost:5000/api',
  production: 'https://cap-backend-e3x6.onrender.com/api', // Replace with your production API URL
  staging: 'https://staging-api.yourdomain.com/api', // Optional: staging environment
  test: 'http://localhost:5000/api' // For testing
};

// Get current environment
const currentEnv = getEnvironment();

// Select API URL based on environment
const API_BASE_URL = API_URLS[currentEnv] || API_URLS.production;

console.log(`🚀 API Configuration: Environment = ${currentEnv}, API Base URL = ${API_BASE_URL}`);

// ============================================
// AXIOS CONFIGURATION
// ============================================

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: currentEnv === 'production' ? 15000 : 30000, // Longer timeout for production
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
      const response = await api.get(`/card/download/${batchId}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Download failed' };
    }
  },
  // Get batch progress
  getBatchProgress: async (batchId) => {
    const response = await api.get(`/card/batch-progress/${batchId}`);
    return response.data;
  },
  // Single-click CSV processing
  processCSVAndGenerate: async (formData) => {
    const response = await api.post('/card/process-csv-generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob',
      timeout: 600000, // 10 minutes timeout
      onDownloadProgress: (progressEvent) => {
        // You can use this for download progress if needed
      }
    });

    // Try to get batch ID from headers
    const batchId = response.headers['x-batch-id'];
    if (batchId) {
      // You might want to store this somewhere accessible
      console.log('Batch ID received:', batchId);
    }

    return response.data;
  },

  // Single student card generation
  generateSingleCardSimple: async (data) => {
    try {
      console.log('📡 Sending to /card/generate-single-card-simple', data);

      const response = await api.post('/card/generate-single-card', data, {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'blob'
      });

      console.log('✅ Simple card API Response received');
      return response.data;
    } catch (error) {
      console.error('❌ Simple card generation API Error:', error);

      // Try to read error from blob
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Card generation failed');
        } catch {
          throw error;
        }
      }

      throw error;
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
      console.log('📤 API: Updating student', studentId);

      // If it's FormData, don't set Content-Type header
      const isFormData = studentData instanceof FormData;

      const config = {
        headers: isFormData ? {} : { 'Content-Type': 'application/json' }
      };

      const response = await api.put(`/students/${studentId}`, studentData, config);

      console.log('✅ API: Update response:', response.data);
      return response.data;

    } catch (error) {
      console.error('❌ API: Error updating student:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

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

  // Bulk import from CSV (USE EXISTING ENDPOINT)
  bulkImportCSV: async (csvFile, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000
      };

      // Add progress callback if provided
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        };
      }

      console.log('📤 Starting CSV import...');
      const response = await api.post('/students/bulk-import', formData, config);
      console.log('✅ CSV import API response:', response.data);

      // If we have a progress callback, signal completion
      if (onProgress && onProgress(100)) {
        // Optional: Add a small delay to show 100%
        setTimeout(() => {
          // Progress completed
        }, 500);
      }

      // Handle response format
      const data = response.data;

      if (data.success === true) {
        return data;
      }

      if (data.results && typeof data.results === 'object') {
        return {
          success: true,
          message: data.message || 'CSV import completed successfully',
          results: data.results,
          summary: data.summary || `Processed ${data.results.total || 0} students`
        };
      }

      return {
        success: true,
        message: 'Import completed',
        results: data,
        summary: 'CSV import processed'
      };

    } catch (error) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new Error(errorMessage);
    }
  },

  // Bulk import with photos with progress
  bulkImportWithPhotos: async (csvFile, photoZipFile, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      if (photoZipFile) {
        formData.append('photoZip', photoZipFile);
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000
      };

      // Add progress callback if provided
      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        };
      }

      const response = await api.post('/students/bulk-import-with-photos', formData, config);

      // Handle response format
      const data = response.data;

      if (data.success === true) {
        return data;
      }

      if (data.results && typeof data.results === 'object') {
        return {
          success: true,
          message: data.message || 'CSV + Photos import completed successfully',
          results: data.results,
          summary: data.summary || `Processed ${data.results.total || 0} students`
        };
      }

      return {
        success: true,
        message: 'Import completed',
        results: data,
        summary: 'CSV + Photos import processed'
      };

    } catch (error) {
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        error.message;
      throw new Error(errorMessage);
    }
  },

  // Get student photo URL
  getStudentPhotoUrl: (studentId, size = 'medium') => {
    return `${API_BASE_URL}/students/photo/${studentId}?size=${size}`;
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

  // Create multiple permissions (bulk) or one
  create: async (permissionData) => {
    try {
      const response = await api.post('/permissions/create', permissionData);

      // ✅ Log the response for debugging
      console.log('API Response:', {
        data: response.data,
        status: response.status
      });

      return response.data; // Make sure this returns the full response
    } catch (error) {
      console.error('Permission API Error:', error.response?.data || error.message);
      throw error;
    }
  },

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