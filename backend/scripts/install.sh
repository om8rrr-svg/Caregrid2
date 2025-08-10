#!/bin/bash

# CareGrid Backend Installation Script
# This script sets up the development environment for the CareGrid backend

set -e  # Exit on any error

echo "🏥 CareGrid Backend Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    echo "   macOS: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

echo "✅ PostgreSQL detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚙️  Setting up environment configuration..."
    cp .env.example .env
    echo "📝 Please edit .env file with your database credentials and other settings"
    echo "   Required: DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET"
else
    echo "✅ .env file already exists"
fi

# Check if database exists and is accessible
echo "🗄️  Checking database connection..."
if node -e "require('./config/database.js').query('SELECT 1').then(() => console.log('✅ Database connection successful')).catch(() => { console.log('❌ Database connection failed'); process.exit(1); })" 2>/dev/null; then
    echo "Database is accessible"
else
    echo "⚠️  Database connection failed. Please check your .env configuration."
    echo "   Make sure PostgreSQL is running and credentials are correct."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run: npm run migrate    (to set up database schema)"
echo "3. Run: npm run seed       (to add sample data)"
echo "4. Run: npm run dev        (to start development server)"
echo ""
echo "📚 See README.md for detailed documentation"
echo "🔗 API will be available at: http://localhost:3001"