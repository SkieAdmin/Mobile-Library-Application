import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.102:8060/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('user');
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await this.client.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(userData) {
    try {
      const response = await this.client.post('/auth/register', userData);
      const { token, user } = response.data;
      
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout() {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser() {
    try {
      const response = await this.client.get('/auth/me');
      return response.data.user;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBooks(params = {}) {
    try {
      const response = await this.client.get('/books', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBook(id) {
    try {
      const response = await this.client.get(`/books/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async borrowBook(bookId) {
    try {
      const response = await this.client.post('/borrows', { bookId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async renewBook(borrowId) {
    try {
      const response = await this.client.put(`/borrows/${borrowId}/renew`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async reserveBook(bookId) {
    try {
      const response = await this.client.post('/reservations', { bookId });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelReservation(reservationId) {
    try {
      const response = await this.client.delete(`/reservations/${reservationId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserBorrows(params = {}) {
    try {
      const response = await this.client.get('/borrows', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserReservations(params = {}) {
    try {
      const response = await this.client.get('/reservations', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCategories() {
    try {
      const response = await this.client.get('/books/categories/list');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAnalyticsDashboard() {
    try {
      const response = await this.client.get('/analytics/dashboard');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(userId, userData) {
    try {
      const response = await this.client.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(userId, passwordData) {
    try {
      const response = await this.client.put(`/users/${userId}/password`, passwordData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    console.log('API Error:', error);
    if (error.response) {
      return {
        message: error.response.data?.error || 'An error occurred',
        status: error.response.status,
        errors: error.response.data?.errors || []
      };
    } else if (error.request) {
      console.log('Network request failed:', error.request);
      return {
        message: `Network error. Cannot connect to server at ${BASE_URL}. Please ensure the backend is running and your device is on the same network.`,
        status: 0
      };
    } else {
      return {
        message: error.message || 'An unexpected error occurred',
        status: 0
      };
    }
  }
}

export default new ApiService();