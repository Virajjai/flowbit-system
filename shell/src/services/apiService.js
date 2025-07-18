import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.Authorization;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.client.post('/auth/login', credentials);
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getCurrentUser() {
    return this.client.get('/auth/me');
  }

  // User endpoints
  async getScreens() {
    return this.client.get('/users/me/screens');
  }

  // Tickets endpoints
  async getTickets(params = {}) {
    return this.client.get('/tickets', { params });
  }

  async getTicket(id) {
    return this.client.get(`/tickets/${id}`);
  }

  async createTicket(ticketData) {
    return this.client.post('/tickets', ticketData);
  }

  async updateTicket(id, updates) {
    return this.client.put(`/tickets/${id}`, updates);
  }

  async deleteTicket(id) {
    return this.client.delete(`/tickets/${id}`);
  }

  // Admin endpoints
  async getAdminStats() {
    return this.client.get('/admin/stats');
  }

  async getAdminUsers() {
    return this.client.get('/admin/users');
  }

  async createUser(userData) {
    return this.client.post('/admin/users', userData);
  }

  async updateUser(id, updates) {
    return this.client.put(`/admin/users/${id}`, updates);
  }

  async deleteUser(id) {
    return this.client.delete(`/admin/users/${id}`);
  }

  async getAuditLogs(params = {}) {
    return this.client.get('/admin/audit-logs', { params });
  }

  // Generic HTTP methods
  async get(endpoint, config = {}) {
    return this.client.get(endpoint, config);
  }

  async post(endpoint, data = {}, config = {}) {
    return this.client.post(endpoint, data, config);
  }

  async put(endpoint, data = {}, config = {}) {
    return this.client.put(endpoint, data, config);
  }

  async delete(endpoint, config = {}) {
    return this.client.delete(endpoint, config);
  }
}

export const apiService = new ApiService();
