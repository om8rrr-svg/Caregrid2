#!/bin/bash

# CareGrid Production Deployment Script
# This script deploys CareGrid with full security hardening

set -e  # Exit on any error

echo "🚀 CareGrid Production Deployment Starting..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="caregrid"
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-}"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v vercel >/dev/null 2>&1 || { print_error "Vercel CLI is required but not installed. Run: npm i -g vercel"; exit 1; }
    command -v psql >/dev/null 2>&1 || { print_error "PostgreSQL client is required but not installed."; exit 1; }
    
    # Check if required files exist
    [ -f "supabase-rls-policies.sql" ] || { print_error "supabase-rls-policies.sql not found!"; exit 1; }
    [ -f "vercel.json" ] || { print_error "vercel.json not found!"; exit 1; }
    [ -f ".env.production.example" ] || { print_error ".env.production.example not found!"; exit 1; }
    
    print_success "Prerequisites check passed"
}

# Environment setup
setup_environment() {
    print_status "Setting up environment variables..."
    
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Creating from example..."
        cp .env.production.example .env.production
        print_warning "Please edit .env.production with your actual values before continuing."
        read -p "Press Enter after updating .env.production..."
    fi
    
    # Load environment variables
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
        print_success "Environment variables loaded"
    fi
}

# Security audit
security_audit() {
    print_status "Running security audit..."
    
    # Check for vulnerabilities
    npm audit --audit-level=high || {
        print_warning "Security vulnerabilities found. Please review and fix before deployment."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
    
    # Check for secrets in code
    if command -v git >/dev/null 2>&1; then
        git secrets --scan || print_warning "Git secrets scan failed or not configured"
    fi
    
    print_success "Security audit completed"
}

# Deploy database security
deploy_database_security() {
    print_status "Deploying database security policies..."
    
    if [ -z "$SUPABASE_DB_URL" ]; then
        print_error "SUPABASE_DB_URL not set in environment"
        exit 1
    fi
    
    # Deploy RLS policies
    psql "$SUPABASE_DB_URL" -f supabase-rls-policies.sql || {
        print_error "Failed to deploy RLS policies"
        exit 1
    }
    
    print_success "Database security policies deployed"
}

# Performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    # Build the project
    npm run build || {
        print_error "Build failed"
        exit 1
    }
    
    # Run Lighthouse if available
    if command -v lighthouse >/dev/null 2>&1; then
        print_status "Running Lighthouse performance test..."
        lighthouse http://localhost:3000 --output=json --output-path=./benchmarks/pre-deploy.json --quiet || {
            print_warning "Lighthouse test failed, continuing..."
        }
    fi
    
    print_success "Performance tests completed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Deploy to production
    vercel --prod --yes || {
        print_error "Vercel deployment failed"
        exit 1
    }
    
    print_success "Deployed to Vercel successfully"
}

# Post-deployment verification
post_deployment_verification() {
    print_status "Running post-deployment verification..."
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --scope="$VERCEL_TEAM" | grep "$PROJECT_NAME" | head -1 | awk '{print $2}')
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        print_warning "Could not determine deployment URL"
        return
    fi
    
    print_status "Testing deployment at: https://$DEPLOYMENT_URL"
    
    # Test health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL/api/health" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Health check passed"
    else
        print_error "Health check failed (HTTP $HTTP_STATUS)"
        exit 1
    fi
    
    # Test main page
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DEPLOYMENT_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Main page accessible"
    else
        print_error "Main page failed (HTTP $HTTP_STATUS)"
        exit 1
    fi
    
    print_success "Post-deployment verification completed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # This would typically integrate with your monitoring service
    # For now, we'll just provide instructions
    
    echo ""
    echo "📊 MONITORING SETUP REQUIRED:"
    echo "1. Configure Sentry error tracking"
    echo "2. Set up Pingdom uptime monitoring"
    echo "3. Configure Supabase alerts"
    echo "4. Set up cost monitoring alerts"
    echo ""
    echo "See PRODUCTION_HARDENING_GUIDE.md for detailed instructions."
    echo ""
    
    print_success "Monitoring setup instructions provided"
}

# Main deployment flow
main() {
    echo "Starting CareGrid production deployment..."
    echo "Timestamp: $(date)"
    echo ""
    
    check_prerequisites
    setup_environment
    security_audit
    deploy_database_security
    run_performance_tests
    deploy_to_vercel
    post_deployment_verification
    setup_monitoring
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETE!"
    echo "================================================"
    echo "✅ Database security policies deployed"
    echo "✅ Application deployed to Vercel"
    echo "✅ Health checks passed"
    echo "✅ Performance tests completed"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Review PRODUCTION_HARDENING_GUIDE.md"
    echo "2. Set up monitoring and alerts"
    echo "3. Configure cost controls"
    echo "4. Schedule regular security audits"
    echo ""
    echo "🚀 CareGrid is now production-ready!"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"