#!/bin/bash

# Deane Eye Clinic - AI Reception Setup Script
# This script helps set up the AI reception system using n8n + VAPI

set -e

echo "🏥 Deane Eye Clinic - AI Reception Setup"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    echo "Checking dependencies..."
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        print_warning "jq is recommended for JSON processing"
        echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    fi
    
    print_status "Dependencies check completed"
}

# Create environment file
setup_environment() {
    echo ""
    echo "Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Deane Eye Clinic - AI Reception Environment Variables

# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http

# VAPI Configuration
VAPI_API_KEY=your_vapi_api_key_here
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
VAPI_ASSISTANT_ID=your_vapi_assistant_id

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+44XXXXXXXXXX

# Google Calendar Configuration
GOOGLE_CALENDAR_ID=deane.eye.clinic@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Clinic Configuration
CLINIC_NAME=Deane Eye Clinic
CLINIC_ADDRESS=222 Deane Rd, Deane, Bolton BL3 5DP
CLINIC_PHONE=01204 524785
CLINIC_EMAIL=info@deaneeyeclinic.co.uk

# Database Configuration (Optional)
DATABASE_URL=postgresql://username:password@localhost:5432/deane_clinic

# Analytics (Optional)
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
MIXPANEL_TOKEN=your_mixpanel_token
EOF
        print_status "Created .env file with template variables"
        print_warning "Please update the .env file with your actual API keys and credentials"
    else
        print_info ".env file already exists"
    fi
}

# Setup n8n using Docker
setup_n8n_docker() {
    echo ""
    echo "Setting up n8n with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is required but not installed"
        print_info "Please install Docker from https://docker.com"
        return 1
    fi
    
    # Create n8n data directory
    mkdir -p ~/.n8n
    
    # Create docker-compose.yml for n8n
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: deane-clinic-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=deane2024
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678
      - GENERIC_TIMEZONE=Europe/London
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./n8n-workflows:/home/node/workflows
    env_file:
      - .env

  # Optional: PostgreSQL for data storage
  postgres:
    image: postgres:13
    container_name: deane-clinic-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=deane_clinic
      - POSTGRES_USER=clinic_user
      - POSTGRES_PASSWORD=clinic_pass_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
EOF
    
    print_status "Created docker-compose.yml for n8n"
    
    # Start n8n
    echo "Starting n8n..."
    docker-compose up -d n8n
    
    if [ $? -eq 0 ]; then
        print_status "n8n started successfully"
        print_info "Access n8n at: http://localhost:5678"
        print_info "Username: admin, Password: deane2024"
    else
        print_error "Failed to start n8n"
        return 1
    fi
}

# Import workflow to n8n
import_workflow() {
    echo ""
    echo "Importing workflow to n8n..."
    
    # Wait for n8n to be ready
    echo "Waiting for n8n to be ready..."
    sleep 10
    
    # Check if n8n is accessible
    if curl -s http://localhost:5678 > /dev/null; then
        print_status "n8n is accessible"
        
        # Import the workflow
        if [ -f "n8n-workflows/deane-eye-clinic-reception.json" ]; then
            print_info "Workflow file found. Please import manually through n8n interface:"
            print_info "1. Go to http://localhost:5678"
            print_info "2. Click 'Import from file'"
            print_info "3. Select: n8n-workflows/deane-eye-clinic-reception.json"
        else
            print_warning "Workflow file not found"
        fi
    else
        print_error "n8n is not accessible. Please check the Docker container."
    fi
}

# Create test script
create_test_script() {
    echo ""
    echo "Creating test script..."
    
    cat > test-ai-reception.sh << 'EOF'
#!/bin/bash

# Test script for Deane Eye Clinic AI Reception

echo "🧪 Testing AI Reception System"
echo "=============================="

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Test webhook endpoint
echo "Testing webhook endpoint..."
WEBHOOK_URL="http://localhost:5678/webhook/clinic-reception"

# Test data
TEST_DATA='{
  "From": "+447123456789",
  "caller_id": "+447123456789",
  "call_type": "incoming",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

echo "Sending test call to: $WEBHOOK_URL"
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  "$WEBHOOK_URL")

if [ $? -eq 0 ]; then
    echo "✓ Webhook test successful"
    echo "Response: $RESPONSE"
else
    echo "✗ Webhook test failed"
fi

# Test VAPI connection
echo ""
echo "Testing VAPI connection..."
if [ -n "$VAPI_API_KEY" ] && [ "$VAPI_API_KEY" != "your_vapi_api_key_here" ]; then
    VAPI_RESPONSE=$(curl -s -H "Authorization: Bearer $VAPI_API_KEY" \
      "https://api.vapi.ai/assistant")
    
    if echo "$VAPI_RESPONSE" | grep -q "error"; then
        echo "✗ VAPI connection failed"
        echo "Response: $VAPI_RESPONSE"
    else
        echo "✓ VAPI connection successful"
    fi
else
    echo "⚠ VAPI API key not configured"
fi

# Test Twilio connection
echo ""
echo "Testing Twilio connection..."
if [ -n "$TWILIO_ACCOUNT_SID" ] && [ "$TWILIO_ACCOUNT_SID" != "your_twilio_account_sid" ]; then
    TWILIO_RESPONSE=$(curl -s -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
      "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID.json")
    
    if echo "$TWILIO_RESPONSE" | grep -q "error"; then
        echo "✗ Twilio connection failed"
    else
        echo "✓ Twilio connection successful"
    fi
else
    echo "⚠ Twilio credentials not configured"
fi

echo ""
echo "Test completed!"
EOF
    
    chmod +x test-ai-reception.sh
    print_status "Created test script: test-ai-reception.sh"
}

# Create monitoring script
create_monitoring_script() {
    echo ""
    echo "Creating monitoring script..."
    
    cat > monitor-system.sh << 'EOF'
#!/bin/bash

# Monitoring script for Deane Eye Clinic AI Reception

echo "📊 AI Reception System Monitor"
echo "=============================="

# Check n8n status
echo "Checking n8n status..."
if docker ps | grep -q "deane-clinic-n8n"; then
    echo "✓ n8n container is running"
    
    # Check if n8n is responding
    if curl -s http://localhost:5678 > /dev/null; then
        echo "✓ n8n web interface is accessible"
    else
        echo "✗ n8n web interface is not accessible"
    fi
else
    echo "✗ n8n container is not running"
    echo "Run: docker-compose up -d n8n"
fi

# Check disk space
echo ""
echo "Checking disk space..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠ Disk usage is high: ${DISK_USAGE}%"
else
    echo "✓ Disk usage is normal: ${DISK_USAGE}%"
fi

# Check memory usage
echo ""
echo "Checking memory usage..."
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2 }')
if [ "$MEM_USAGE" -gt 80 ]; then
    echo "⚠ Memory usage is high: ${MEM_USAGE}%"
else
    echo "✓ Memory usage is normal: ${MEM_USAGE}%"
fi

# Check recent logs
echo ""
echo "Recent n8n logs:"
docker logs --tail 10 deane-clinic-n8n

echo ""
echo "Monitoring completed at $(date)"
EOF
    
    chmod +x monitor-system.sh
    print_status "Created monitoring script: monitor-system.sh"
}

# Main setup function
main() {
    echo "Starting setup process..."
    echo ""
    
    check_dependencies
    setup_environment
    
    echo ""
    read -p "Do you want to set up n8n with Docker? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_n8n_docker
        import_workflow
    fi
    
    create_test_script
    create_monitoring_script
    
    echo ""
    echo "🎉 Setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Update .env file with your API keys"
    echo "2. Import the workflow: n8n-workflows/deane-eye-clinic-reception.json"
    echo "3. Configure VAPI assistant with your phone number"
    echo "4. Set up Twilio webhook to point to your n8n instance"
    echo "5. Test the system: ./test-ai-reception.sh"
    echo ""
    echo "Useful commands:"
    echo "- Start system: docker-compose up -d"
    echo "- Stop system: docker-compose down"
    echo "- View logs: docker logs deane-clinic-n8n"
    echo "- Monitor system: ./monitor-system.sh"
    echo "- Test system: ./test-ai-reception.sh"
    echo ""
    echo "Access n8n at: http://localhost:5678"
    echo "Username: admin, Password: deane2024"
}

# Run main function
main "$@"