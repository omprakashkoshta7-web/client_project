#!/bin/bash

# Gateway Deployment Script for Cloud Run
# This script deploys the gateway service with updated environment variables

set -e

echo "🚀 Starting Gateway Deployment..."
echo "=================================="

# Configuration
PROJECT_ID="ecommerceapp-1f9015"
SERVICE_NAME="gateway"
REGION="asia-south1"
SOURCE_DIR="backend/gateway"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first."
    echo "📖 Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: $SOURCE_DIR directory not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run
echo ""
echo "📦 Deploying $SERVICE_NAME to Cloud Run..."
echo "Region: $REGION"
echo "Source: $SOURCE_DIR"
echo ""

gcloud run deploy $SERVICE_NAME \
  --source $SOURCE_DIR \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars \
    "AUTH_SERVICE_URL=https://auth-202671058278.asia-south1.run.app,\
USER_SERVICE_URL=https://user-202671058278.asia-south1.run.app,\
PRODUCT_SERVICE_URL=https://product-202671058278.asia-south1.run.app,\
DESIGN_SERVICE_URL=https://design-202671058278.asia-south1.run.app,\
ORDER_SERVICE_URL=https://order-202671058278.asia-south1.run.app,\
PAYMENT_SERVICE_URL=https://payment-202671058278.asia-south1.run.app,\
NOTIFICATION_SERVICE_URL=https://notification-202671058278.asia-south1.run.app,\
ADMIN_SERVICE_URL=https://admin-202671058278.asia-south1.run.app,\
DELIVERY_SERVICE_URL=https://delivery-202671058278.asia-south1.run.app,\
VENDOR_SERVICE_URL=https://vendor-202671058278.asia-south1.run.app,\
FINANCE_SERVICE_URL=https://finance-202671058278.asia-south1.run.app,\
JWT_SECRET=speedcopy_dev_jwt_secret_change_in_production,\
NODE_ENV=production"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "🔗 Gateway URL: https://gateway-202671058278.asia-south1.run.app"
echo ""
echo "📝 Next steps:"
echo "1. Wait 2-3 minutes for the service to be ready"
echo "2. Test OTP endpoint:"
echo "   curl -X POST https://gateway-202671058278.asia-south1.run.app/api/auth/phone/send-otp \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"phone\":\"+919999999999\"}'"
echo ""
