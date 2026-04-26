// Production API Configuration for SpeedCopy
// Updated with Google Cloud Run deployment URLs

const PRODUCTION_URLS = {
  GATEWAY: import.meta.env.VITE_GATEWAY_URL || 'https://gateway-202671058278.asia-south1.run.app',
  AUTH: import.meta.env.VITE_AUTH_URL || 'https://auth-202671058278.asia-south1.run.app',
  PRODUCT: import.meta.env.VITE_PRODUCT_URL || 'https://product-202671058278.asia-south1.run.app',
  ADMIN: import.meta.env.VITE_ADMIN_URL || 'https://admin-202671058278.asia-south1.run.app',
  FINANCE: import.meta.env.VITE_FINANCE_URL || 'https://finance-202671058278.asia-south1.run.app',
  DESIGN: import.meta.env.VITE_DESIGN_URL || 'https://design-202671058278.asia-south1.run.app',
  NOTIFICATION: import.meta.env.VITE_NOTIFICATION_URL || 'https://notification-202671058278.asia-south1.run.app'
};

// Use production URLs directly since they're deployed
const BASE_URL = import.meta.env.VITE_API_BASE_URL || PRODUCTION_URLS.PRODUCT; // Product service is confirmed working

export const API_CONFIG = {
  // Primary base URL - using working product service
  BASE_URL,
  
  // Service-specific URLs
  SERVICES: {
    AUTH: PRODUCTION_URLS.AUTH,
    PRODUCT: PRODUCTION_URLS.PRODUCT,
    ADMIN: PRODUCTION_URLS.ADMIN,
    FINANCE: PRODUCTION_URLS.FINANCE,
    DESIGN: PRODUCTION_URLS.DESIGN,
    NOTIFICATION: PRODUCTION_URLS.NOTIFICATION,
    GATEWAY: PRODUCTION_URLS.GATEWAY
  },

  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      VERIFY: '/api/auth/verify',
      PROFILE: '/api/auth/me',
      GOOGLE_VERIFY: '/api/auth/google-verify'
    },

    // Product endpoints (confirmed working)
    PRODUCTS: {
      LIST: '/api/products',
      BY_ID: (id: string) => `/api/products/${id}`,
      BY_SLUG: (slug: string) => `/api/products/slug/${slug}`,
      SEARCH: '/api/products/search',
      BY_FLOW: (flow: string) => `/api/products?flowType=${flow}`,
      GIFTING_FLOW: '/api/products?flowType=gifting',
      SHOPPING_FLOW: '/api/products?flowType=shopping',
      PRINTING_FLOW: '/api/products?flowType=printing',
      
      // Nested structure for better organization
      GENERAL: {
        LIST: '/api/products',
        BY_ID: (id: string) => `/api/products/${id}`,
        BY_SLUG: (slug: string) => `/api/products/slug/${slug}`
      },
      
      CATEGORIES: {
        LIST: '/api/products/categories',
        BY_SLUG: (slug: string) => `/api/products/categories/slug/${slug}`,
        SUBCATEGORIES: (categoryId: string) => `/api/products/categories/${categoryId}/subcategories`
      },
      
      GIFTING: {
        PRODUCT_BY_ID: (id: string) => `/api/gifting/products/${id}`
      },
      
      SHOPPING: {
        PRODUCT_BY_ID: (id: string) => `/api/shopping/products/${id}`
      }
    },

    // Order endpoints
    ORDERS: {
      CREATE: '/api/orders',
      MY_ORDERS: '/api/orders/my-orders',
      ORDER_BY_ID: (id: string) => `/api/orders/${id}`,
      TRACK: (id: string) => `/api/orders/${id}/track`,
      CART: '/api/orders/cart',
      CART_ITEM: (id: string) => `/api/orders/cart/${id}`
    },

    // Design endpoints
    DESIGN: {
      TEMPLATES: '/api/design/templates',
      CANVAS: '/api/design/canvas',
      ASSETS: '/api/design/assets',
      RENDER: '/api/design/render',
      FRAMES: (productId: string) => `/api/design/frames/${productId}`
    },

    // Finance endpoints
    FINANCE: {
      PAYMENTS: '/api/finance/payments',
      WALLET: '/api/finance/wallet',
      TRANSACTIONS: '/api/finance/transactions'
    },

    // Admin endpoints
    ADMIN: {
      ORDERS: '/api/admin/orders',
      CUSTOMERS: '/api/admin/customers',
      VENDORS: '/api/admin/vendors',
      STAFF: '/api/admin/staff'
    }
  },

  // Request configuration
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000, // 30 seconds
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
  
  // Feature flags
  ENABLE_OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE === 'true',
  ENABLE_CACHING: import.meta.env.VITE_ENABLE_CACHING === 'true',
  ENABLE_FALLBACK: import.meta.env.VITE_ENABLE_FALLBACK === 'true',
  DEBUG_API: import.meta.env.VITE_DEBUG_API === 'true',
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Service health status (based on testing)
export const SERVICE_STATUS = {
  PRODUCT: 'WORKING', // ✅ Confirmed working
  AUTH: 'WORKING', // ✅ API docs accessible
  GATEWAY: 'ISSUES', // ❌ Route not found
  ADMIN: 'ISSUES', // ❌ 404 errors
  FINANCE: 'UNKNOWN', // ⚠️ Not tested
  DESIGN: 'UNKNOWN', // ⚠️ Not tested
  NOTIFICATION: 'UNKNOWN' // ⚠️ Not tested
};

export default API_CONFIG;