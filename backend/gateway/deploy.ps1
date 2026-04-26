# Gateway Deployment Script for Cloud Run (PowerShell)
# This script deploys the gateway service with updated environment variables

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Gateway Deployment..." -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# Configuration
$PROJECT_ID = "ecommerceapp-1f9015"
$SERVICE_NAME = "gateway"
$REGION = "asia-south1"
$SOURCE_DIR = "backend/gateway"

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>$null
    Write-Host "✅ gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ gcloud CLI not found. Please install it first." -ForegroundColor Red
    Write-Host "📖 Visit: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path $SOURCE_DIR)) {
    Write-Host "❌ Error: $SOURCE_DIR directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

# Set the project
Write-Host ""
Write-Host "📋 Setting GCP project to: $PROJECT_ID" -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

# Deploy to Cloud Run
Write-Host ""
Write-Host "📦 Deploying $SERVICE_NAME to Cloud Run..." -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "Source: $SOURCE_DIR" -ForegroundColor Cyan
Write-Host ""

$envVars = @(
    "AUTH_SERVICE_URL=https://auth-202671058278.asia-south1.run.app",
    "USER_SERVICE_URL=https://user-202671058278.asia-south1.run.app",
    "PRODUCT_SERVICE_URL=https://product-202671058278.asia-south1.run.app",
    "DESIGN_SERVICE_URL=https://design-202671058278.asia-south1.run.app",
    "ORDER_SERVICE_URL=https://order-202671058278.asia-south1.run.app",
    "PAYMENT_SERVICE_URL=https://payment-202671058278.asia-south1.run.app",
    "NOTIFICATION_SERVICE_URL=https://notification-202671058278.asia-south1.run.app",
    "ADMIN_SERVICE_URL=https://admin-202671058278.asia-south1.run.app",
    "DELIVERY_SERVICE_URL=https://delivery-202671058278.asia-south1.run.app",
    "VENDOR_SERVICE_URL=https://vendor-202671058278.asia-south1.run.app",
    "FINANCE_SERVICE_URL=https://finance-202671058278.asia-south1.run.app",
    "JWT_SECRET=speedcopy_dev_jwt_secret_change_in_production",
    "NODE_ENV=production"
) -join ","

gcloud run deploy $SERVICE_NAME `
  --source $SOURCE_DIR `
  --region $REGION `
  --platform managed `
  --allow-unauthenticated `
  --set-env-vars $envVars

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Gateway URL: https://gateway-202671058278.asia-south1.run.app" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 minutes for the service to be ready" -ForegroundColor Yellow
Write-Host "2. Test OTP endpoint:" -ForegroundColor Yellow
Write-Host "   curl -X POST https://gateway-202671058278.asia-south1.run.app/api/auth/phone/send-otp \" -ForegroundColor Gray
Write-Host "     -H 'Content-Type: application/json' \" -ForegroundColor Gray
Write-Host "     -d '{""phone"":""+919999999999""}'" -ForegroundColor Gray
Write-Host ""
