import axios from 'axios';
import { calculatePropertyInvestment } from './calculationService.js';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Auth0 instance (set this from your Auth0Provider)
let auth0Client = null;

export const setAuth0Client = (client) => {
  auth0Client = client;
};

// Request interceptor - Add Auth0 token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      if (auth0Client) {
        // Get fresh token from Auth0
        const token = await auth0Client.getTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          }
        });
        
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
      
      // If token refresh fails, redirect to login
      if (error.error === 'login_required') {
        await auth0Client?.loginWithRedirect();
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to get a fresh token
        if (auth0Client) {
          const token = await auth0Client.getTokenSilently({
            authorizationParams: {
              audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            },
            cacheMode: 'off' // Force fresh token
          });

          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        await auth0Client?.loginWithRedirect();
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
      // Could show a message to user
    }

    // Handle 429 Rate Limit
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
      // Could implement retry with exponential backoff
    }

    // Handle 500+ Server Errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
      // Could implement retry logic
    }

    return Promise.reject(error);
  }
);

// API Methods
export const api = {
  // Calculate property metrics (CLIENT-SIDE)
  // Calculations now happen locally in the browser
  calculate: async (propertyData) => {
    try {
      // Perform calculation client-side
      return calculatePropertyInvestment(propertyData);
    } catch (error) {
      console.error('Calculate error:', error);
      throw error;
    }
  },

  // Save property
  saveProperty: async (propertyData) => {
    try {
      const response = await apiClient.post('/properties', propertyData);
      return response.data;
    } catch (error) {
      console.error('Save property API error:', error);
      throw error;
    }
  },

  // Get all properties
  getProperties: async () => {
    try {
      const response = await apiClient.get('/properties');
      return response.data;
    } catch (error) {
      console.error('Get properties API error:', error);
      throw error;
    }
  },

  // Delete property
  deleteProperty: async (propertyId) => {
    try {
      const response = await apiClient.delete(`/properties/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error('Delete property API error:', error);
      throw error;
    }
  },

  // Health check (optional)
  healthCheck: async () => {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }
};

export default api;
