import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  verifyToken: () => api.get('/auth/verify'),
  verifyCurrentPassword: (data) => api.post('/auth/verify-current-password', data),
  sendPasswordChangeOTP: (data) => api.post('/auth/send-password-change-otp', data),
  verifyOTPAndChangePassword: (data) => api.post('/auth/verify-otp-and-change-password', data),
  logout: () => api.post('/auth/logout'),
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
};

// Attendance API calls
export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getMyAttendance: (params) => api.get('/attendance/my', { params }),
  getTodayAttendance: () => api.get('/attendance/today'),
  getAttendanceSummary: (params) => api.get('/attendance/summary', { params }),
  getAllAttendance: (params) => api.get('/attendance', { params }),
  getAttendanceById: (id) => api.get(`/attendance/${id}`),
  updateAttendance: (id, data) => api.put(`/attendance/${id}`, data),
  regularizeAttendance: (id, data) => api.post(`/attendance/${id}/regularize`, data),
};

// User API calls
export const userAPI = {
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  getRoles: () => api.get('/users/roles'),
};

// Department API calls
export const departmentAPI = {
  getAllDepartments: (params) => api.get('/departments', { params }),
  getDepartmentById: (id) => api.get(`/departments/${id}`),
  createDepartment: (departmentData) => api.post('/departments', departmentData),
  updateDepartment: (id, departmentData) => api.put(`/departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`/departments/${id}`),
  getDepartmentStats: () => api.get('/departments/stats'),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
