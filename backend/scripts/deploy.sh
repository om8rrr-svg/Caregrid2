#!/bin/bash

# Render deployment script for CareGrid backend
echo "🚀 Starting CareGrid backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
node -e "const { testConnection } = require('./config/database'); testConnection().then(() => process.exit(0)).catch(() => process.exit(1));"

# Run database migrations
echo "🗄️ Running database migrations..."
node scripts/setup-database.js

# Seed database with initial data
echo "🌱 Seeding database..."
node scripts/setup-database.js --seed

echo "✅ Deployment completed successfully!"