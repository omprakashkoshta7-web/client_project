import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, SERVICE_STATUS } from '../config/api.config';

// Create axios instance with production configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken') || localStorage.getItem('speedcopy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('speedcopy_token');
      // Redirect to login if needed
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// Service-specific API clients
export const createServiceClient = (serviceUrl: string): AxiosInstance => {
  return axios.create({
    baseURL: serviceUrl,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.DEFAULT_HEADERS,
  });
};

// Pre-configured service clients
export const serviceClients = {
  auth: createServiceClient(API_CONFIG.SERVICES.AUTH),
  product: createServiceClient(API_CONFIG.SERVICES.PRODUCT),
  admin: createServiceClient(API_CONFIG.SERVICES.ADMIN),
  finance: createServiceClient(API_CONFIG.SERVICES.FINANCE),
  design: createServiceClient(API_CONFIG.SERVICES.DESIGN),
  notification: createServiceClient(API_CONFIG.SERVICES.NOTIFICATION),
  gateway: createServiceClient(API_CONFIG.SERVICES.GATEWAY),
};

// Add auth interceptors to all service clients
Object.values(serviceClients).forEach(client => {
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('speedcopy_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
});

// Utility function to make requests with fallback
export const makeRequest = async <T>(
  primaryClient: AxiosInstance,
  fallbackClient: AxiosInstance | null,
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await primaryClient.request<T>(config);
    return response.data;
  } catch (error) {
    console.warn('Primary service failed, trying fallback...', error);
    
    if (fallbackClient) {
      try {
        const response = await fallbackClient.request<T>(config);
        return response.data;
      } catch (fallbackError) {
        console.error('Fallback service also failed:', fallbackError);
        throw fallbackError;
      }
    }
    
    throw error;
  }
};

// Health check function
export const checkServiceHealth = async (serviceName: keyof typeof serviceClients) => {
  try {
    const client = serviceClients[serviceName];
    const response = await client.get('/health', { timeout: 5000 });
    return { status: 'healthy', data: response.data };
  } catch (error) {
    return { status: 'unhealthy', error: error };
  }
};

// Batch health check
export const checkAllServicesHealth = async () => {
  const results: Record<string, any> = {};
  
  for (const [serviceName, status] of Object.entries(SERVICE_STATUS)) {
    if (status === 'WORKING') {
      results[serviceName] = await checkServiceHealth(serviceName.toLowerCase() as keyof typeof serviceClients);
    } else {
      results[serviceName] = { status: 'known_issues', note: status };
    }
  }
  
  return results;
};

// Export default client
export default apiClient;