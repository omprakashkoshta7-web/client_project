import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api.config';

/**
 * Production API Service - Direct connection to working services
 * Uses the confirmed working Product Service as primary endpoint
 */

// Create production API client using the working Product Service
const productionApiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.SERVICES.PRODUCT, // Use working product service
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

// Request interceptor for authentication and logging
productionApiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken') || localStorage.getItem('speedcopy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request if debug is enabled
    if (API_CONFIG.DEBUG_API) {
      console.log(`🌐 Production API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Production API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
productionApiClient.interceptors.response.use(
  (response) => {
    if (API_CONFIG.DEBUG_API) {
      console.log(`✅ Production API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    console.error(`❌ Production API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
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

// Service-specific clients for different endpoints
export const createProductionServiceClient = (serviceUrl: string): AxiosInstance => {
  const client = axios.create({
    baseURL: serviceUrl,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.DEFAULT_HEADERS,
  });

  // Add auth interceptor
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

  return client;
};

// Pre-configured production service clients
export const productionServiceClients = {
  product: productionApiClient, // Primary working service
  auth: createProductionServiceClient(API_CONFIG.SERVICES.AUTH),
  admin: createProductionServiceClient(API_CONFIG.SERVICES.ADMIN),
  finance: createProductionServiceClient(API_CONFIG.SERVICES.FINANCE),
  design: createProductionServiceClient(API_CONFIG.SERVICES.DESIGN),
  notification: createProductionServiceClient(API_CONFIG.SERVICES.NOTIFICATION),
  gateway: createProductionServiceClient(API_CONFIG.SERVICES.GATEWAY),
};

// Health check for production services
export const checkProductionServiceHealth = async (serviceName: keyof typeof productionServiceClients) => {
  try {
    const client = productionServiceClients[serviceName];
    const response = await client.get('/health', { timeout: 5000 });
    return { 
      service: serviceName,
      status: 'healthy', 
      data: response.data,
      url: client.defaults.baseURL
    };
  } catch (error: any) {
    return { 
      service: serviceName,
      status: 'unhealthy', 
      error: error.message,
      url: productionServiceClients[serviceName].defaults.baseURL
    };
  }
};

// Test product service endpoint (confirmed working)
export const testProductService = async () => {
  try {
    console.log('🧪 Testing Product Service...');
    const response = await productionApiClient.get('/api/products');
    console.log('✅ Product Service Test Success:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Product service is working correctly'
    };
  } catch (error: any) {
    console.error('❌ Product Service Test Failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Product service test failed'
    };
  }
};

// Batch test all production services
export const testAllProductionServices = async () => {
  console.log('🧪 Testing all production services...');
  const results: Record<string, any> = {};
  
  for (const [serviceName] of Object.entries(productionServiceClients)) {
    console.log(`Testing ${serviceName} service...`);
    results[serviceName] = await checkProductionServiceHealth(serviceName as keyof typeof productionServiceClients);
  }
  
  // Special test for product service with actual data
  results.product_data_test = await testProductService();
  
  return results;
};

// Export the main production client
export default productionApiClient;