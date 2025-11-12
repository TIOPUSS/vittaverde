#!/bin/bash
# Quick Deploy Script - VittaVerde VM
# Usage: ./scripts/quick-deploy.sh

set -e

echo "🚀 VittaVerde - Quick Deploy Script"
echo "===================================="
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
  echo "❌ Error: .env.production not found!"
  echo "📝 Create it from template: cp .env.example .env.production"
  exit 1
fi

echo "✅ Environment file found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false
echo "✅ Dependencies installed"
echo ""

# Run database migrations
echo "🗄️  Running database migrations..."
npm run db:push
echo "✅ Database synced"
echo ""

# Build the application
echo "🔨 Building application..."
npm run build
echo "✅ Build completed"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo "⚠️  PM2 not found. Installing globally..."
  npm install -g pm2
  echo "✅ PM2 installed"
fi
echo ""

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 delete vittaverde 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo "✅ Application started"
echo ""

# Show status
echo "📊 Application Status:"
pm2 status
echo ""

# Test email (optional)
read -p "📧 Do you want to test email configuration? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Testing email..."
  node scripts/test-email.js
fi

echo ""
echo "✅ Deploy completed successfully!"
echo ""
echo "🔗 Access your application at: http://localhost:5000"
echo "📊 Monitor with: pm2 logs"
echo "🔄 Restart with: pm2 restart vittaverde"
echo ""
