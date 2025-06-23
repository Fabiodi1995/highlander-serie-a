#!/bin/bash

# Highlander Deployment Script
# Usage: ./deploy.sh

set -e

echo "Starting Highlander deployment..."

# Backup current state
echo "Creating backup..."
cp -r . ../backup-$(date +%Y%m%d_%H%M%S) || true

# Force sync with repository to ensure latest code
echo "Synchronizing with repository..."
git fetch origin main
git reset --hard origin/main

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database migrations
echo "Updating database schema..."
npm run db:push

# Build application
echo "Building application..."
npm run build

# Restart application with PM2 (full restart, not reload)
echo "Restarting application..."
pm2 restart highlander

# Check application status
echo "Checking application status..."
pm2 status highlander

echo "Deployment completed successfully!"
echo "Application is running at: $(echo $BASE_URL)"

# Show recent logs
echo "Recent logs:"
pm2 logs highlander --lines 10