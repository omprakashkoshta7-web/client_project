# SpeedCopy Production Deployment URLs

## Google Cloud Run Services

### 1. Gateway Service
**URL**: https://gateway-202671058278.asia-south1.run.app
**Purpose**: Main API Gateway - Routes all requests to appropriate microservices
**Data Available**:
- Health check endpoints
- Request routing and load balancing
- Authentication middleware
- Rate limiting
- API documentation aggregation

### 2. Auth Service
**URL**: https://auth-202671058278.asia-south1.run.app/api-docs/
**Purpose**: Authentication and User Management
**Data Available**:
- User registration and login
- JWT token generation and validation
- Phone number verification (OTP)
- Password reset functionality
- User profile management
- Session management
- Role-based access control

### 3. Product Service
**URL**: https://product-202671058278.asia-south1.run.app
**Purpose**: Product Catalog Management
**Data Available**:
- Product listings (shopping, gifting, printing)
- Product details and specifications
- Product categories and subcategories
- Product variants (size, color, material)
- Product images and thumbnails
- Pricing information
- Stock availability
- Product search and filtering

### 4. Admin Service
**URL**: https://admin-202671058278.asia-south1.run.app
**Purpose**: Admin Panel Backend
**Data Available**:
- Order management and tracking
- Customer management
- Vendor and store management
- Staff management with permissions
- Financial reports and analytics
- Delivery tracking
- Support ticket management
- System configuration

### 5. Finance Service
**URL**: https://finance-202671058278.asia-south1.run.app
**Purpose**: Financial Operations
**Data Available**:
- Payment processing
- Transaction history
- Wallet management
- Refund processing
- Financial reports
- Revenue analytics
- Commission calculations
- Billing and invoicing

### 6. Design Service
**URL**: https://design-202671058278.asia-south1.run.app
**Purpose**: Design and Customization
**Data Available**:
- Design templates
- Canvas configurations
- Design assets and frames
- Custom design storage
- Design rendering
- Print-ready file generation
- Design history and versions

### 7. Notification Service
**URL**: https://notification-202671058278.asia-south1.run.app
**Purpose**: Communication and Notifications
**Data Available**:
- SMS notifications
- Email notifications
- Push notifications
- Notification templates
- Delivery status updates
- Marketing communications
- System alerts

## Service Integration Flow

```
Client Apps → Gateway Service → Individual Microservices
```

## API Documentation Access

- **Auth Service**: https://auth-202671058278.asia-south1.run.app/api-docs/
- **Other Services**: Access through Gateway or individual service URLs + `/api-docs/`

## Environment Configuration

All services are deployed in:
- **Region**: asia-south1 (Mumbai)
- **Platform**: Google Cloud Run
- **Project ID**: 202671058278

## Usage Notes

1. **Gateway Service** should be the primary entry point for client applications
2. **Individual Services** can be accessed directly for specific operations
3. **API Documentation** is available at `/api-docs/` endpoint for each service
4. **Authentication** is required for most endpoints (use Auth Service tokens)
5. **CORS** is configured for cross-origin requests from client applications