#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config();

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Check if command exists
function commandExists(command) {
    try {
        execSync(`which ${command}`, { stdio: 'ignore' });
        return true;
    } catch (error) {
        return false;
    }
}

// Run command with error handling
function runCommand(command, description) {
    try {
        logInfo(`Running: ${command}`);
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        logSuccess(description);
        return output;
    } catch (error) {
        logError(`Failed: ${description}`);
        logError(`Error: ${error.message}`);
        throw error;
    }
}

// Check prerequisites
function checkPrerequisites() {
    logStep(1, 'Checking prerequisites...');
    
    const requirements = [
        { command: 'node', name: 'Node.js', version: '--version' },
        { command: 'npm', name: 'npm', version: '--version' },
        { command: 'git', name: 'Git', version: '--version' }
    ];
    
    let allGood = true;
    
    requirements.forEach(req => {
        if (commandExists(req.command)) {
            try {
                const version = execSync(`${req.command} ${req.version}`, { encoding: 'utf8' }).trim();
                logSuccess(`${req.name}: ${version}`);
            } catch (error) {
                logSuccess(`${req.name}: installed`);
            }
        } else {
            logError(`${req.name} is not installed`);
            allGood = false;
        }
    });
    
    if (!allGood) {
        throw new Error('Missing required dependencies');
    }
    
    // Check for Vercel CLI
    if (!commandExists('vercel')) {
        logWarning('Vercel CLI not found. Installing...');
        try {
            runCommand('npm install -g vercel', 'Vercel CLI installation');
        } catch (error) {
            logWarning('Could not install Vercel CLI globally. You can install it manually with: npm install -g vercel');
        }
    } else {
        logSuccess('Vercel CLI: installed');
    }
}

// Install dependencies
function installDependencies() {
    logStep(2, 'Installing project dependencies...');
    
    if (!fs.existsSync('package.json')) {
        throw new Error('package.json not found');
    }
    
    runCommand('npm install', 'Dependencies installation');
    
    // Check if Supabase is installed
    try {
        require('@supabase/supabase-js');
        logSuccess('Supabase client library is available');
    } catch (error) {
        logError('Supabase client library not found');
        throw new Error('Please run npm install to install all dependencies');
    }
}

// Setup environment variables
function setupEnvironment() {
    logStep(3, 'Setting up environment variables...');
    
    const envExamplePath = '.env.example';
    const envLocalPath = '.env.local';
    
    if (!fs.existsSync(envExamplePath)) {
        logWarning('.env.example not found');
        return;
    }
    
    if (!fs.existsSync(envLocalPath)) {
        logInfo('Creating .env.local from .env.example...');
        fs.copyFileSync(envExamplePath, envLocalPath);
        logSuccess('.env.local created');
        logWarning('Please update .env.local with your actual Supabase credentials');
    } else {
        logInfo('.env.local already exists');
    }
    
    // Check for required environment variables
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_KEY'
    ];
    
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const missingVars = [];
    
    requiredVars.forEach(varName => {
        if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your-`)) {
            missingVars.push(varName);
        }
    });
    
    if (missingVars.length > 0) {
        logWarning('Missing or placeholder environment variables:');
        missingVars.forEach(varName => {
            logWarning(`  - ${varName}`);
        });
        logInfo('Please update .env.local with your actual Supabase credentials before proceeding');
    } else {
        logSuccess('Environment variables configured');
    }
}

// Create necessary directories
function createDirectories() {
    logStep(4, 'Creating necessary directories...');
    
    const directories = [
        'api',
        'api/supabase',
        'api/cron',
        'scripts',
        'backups',
        'docs',
        'config'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logSuccess(`Created directory: ${dir}`);
        } else {
            logInfo(`Directory exists: ${dir}`);
        }
    });
}

// Create API endpoints
function createAPIEndpoints() {
    logStep(5, 'Creating API endpoints...');
    
    // Health check endpoint
    const healthEndpoint = `
module.exports = async (req, res) => {
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test database connection
        const { data, error } = await supabase
            .from('clinics')
            .select('count')
            .limit(1);
            
        const health = {
            status: error ? 'unhealthy' : 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: !error,
                api: true
            },
            version: process.env.npm_package_version || '1.0.0'
        };
        
        res.status(error ? 503 : 200).json(health);
        
    } catch (error) {
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                database: false,
                api: true
            }
        });
    }
};
`;
    
    // Supabase proxy endpoint
    const supabaseEndpoint = `
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY // Use service key for API endpoints
        );
        
        const { method, query, body } = req;
        const { table, ...params } = query;
        
        let result;
        
        switch (method) {
            case 'GET':
                if (params.id) {
                    result = await supabase
                        .from(table)
                        .select('*')
                        .eq('id', params.id)
                        .single();
                } else {
                    let query = supabase.from(table).select('*');
                    
                    // Apply filters
                    Object.entries(params).forEach(([key, value]) => {
                        if (key !== 'table' && value) {
                            query = query.eq(key, value);
                        }
                    });
                    
                    result = await query;
                }
                break;
                
            case 'POST':
                result = await supabase
                    .from(table)
                    .insert(body)
                    .select();
                break;
                
            case 'PUT':
                result = await supabase
                    .from(table)
                    .update(body)
                    .eq('id', params.id)
                    .select();
                break;
                
            case 'DELETE':
                result = await supabase
                    .from(table)
                    .delete()
                    .eq('id', params.id);
                break;
                
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
        
        if (result.error) {
            return res.status(400).json({ error: result.error.message });
        }
        
        res.json({ data: result.data });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
`;
    
    // Write API files
    const apiFiles = [
        { path: 'api/health.js', content: healthEndpoint },
        { path: 'api/supabase/[...params].js', content: supabaseEndpoint }
    ];
    
    apiFiles.forEach(file => {
        const dir = path.dirname(file.path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(file.path)) {
            fs.writeFileSync(file.path, file.content);
            logSuccess(`Created API endpoint: ${file.path}`);
        } else {
            logInfo(`API endpoint exists: ${file.path}`);
        }
    });
}

// Test Supabase connection
async function testSupabaseConnection() {
    logStep(6, 'Testing Supabase connection...');
    
    try {
        const { createClient } = require('@supabase/supabase-js');
        
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            logWarning('Supabase credentials not configured. Skipping connection test.');
            return;
        }
        
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase
            .from('clinics')
            .select('count')
            .limit(1);
            
        if (error) {
            if (error.message.includes('relation "clinics" does not exist')) {
                logWarning('Clinics table does not exist. Run migration script to create it.');
            } else {
                throw error;
            }
        } else {
            logSuccess('Supabase connection successful');
        }
        
    } catch (error) {
        logError(`Supabase connection failed: ${error.message}`);
        logInfo('Please check your Supabase credentials in .env.local');
    }
}

// Setup Vercel project
function setupVercel() {
    logStep(7, 'Setting up Vercel project...');
    
    if (!commandExists('vercel')) {
        logWarning('Vercel CLI not available. Skipping Vercel setup.');
        logInfo('Install Vercel CLI with: npm install -g vercel');
        return;
    }
    
    try {
        // Check if already linked
        if (fs.existsSync('.vercel')) {
            logInfo('Vercel project already linked');
        } else {
            logInfo('Run "vercel" to link your project to Vercel');
        }
        
        logInfo('Remember to set environment variables in Vercel dashboard:');
        logInfo('  - NEXT_PUBLIC_SUPABASE_URL');
        logInfo('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
        logInfo('  - SUPABASE_SERVICE_KEY');
        
    } catch (error) {
        logWarning(`Vercel setup warning: ${error.message}`);
    }
}

// Generate deployment checklist
function generateChecklist() {
    logStep(8, 'Generating deployment checklist...');
    
    const checklist = `
# CareGrid Cloud Deployment Checklist

## Prerequisites ✅
- [x] Node.js installed
- [x] npm installed
- [x] Git installed
- [x] Vercel CLI installed
- [x] Project dependencies installed

## Supabase Setup
- [ ] Create Supabase project
- [ ] Copy project URL and anon key
- [ ] Generate service role key
- [ ] Update .env.local with credentials
- [ ] Run migration script: \`npm run migrate\`
- [ ] Verify data migration

## Vercel Setup
- [ ] Link project to Vercel: \`vercel\`
- [ ] Set environment variables in Vercel dashboard
- [ ] Deploy to preview: \`vercel\`
- [ ] Test preview deployment
- [ ] Deploy to production: \`vercel --prod\`

## Testing
- [ ] Test health endpoint: /api/health
- [ ] Test clinic search functionality
- [ ] Test geolocation features
- [ ] Test performance monitoring
- [ ] Verify analytics tracking

## Post-Deployment
- [ ] Update DNS records (if custom domain)
- [ ] Set up monitoring alerts
- [ ] Configure backup schedule
- [ ] Update documentation
- [ ] Notify team of new deployment

## Commands Reference
\`\`\`bash
# Install dependencies
npm install

# Setup cloud infrastructure
npm run cloud:setup

# Migrate data to Supabase
npm run migrate

# Test migration
npm run migrate:test

# Deploy to preview
npm run cloud:preview

# Deploy to production
npm run cloud:deploy

# Health check
npm run health:check

# Performance test
npm run performance:test
\`\`\`

## Troubleshooting
- Check .env.local for correct Supabase credentials
- Verify Vercel environment variables
- Check Supabase dashboard for database status
- Review Vercel function logs for errors
- Test API endpoints individually

---
Generated on: ${new Date().toISOString()}
`;
    
    fs.writeFileSync('DEPLOYMENT_CHECKLIST.md', checklist);
    logSuccess('Deployment checklist created: DEPLOYMENT_CHECKLIST.md');
}

// Main setup function
async function main() {
    try {
        log('🚀 CareGrid Cloud Setup Starting...', 'bright');
        log('=====================================', 'bright');
        
        checkPrerequisites();
        installDependencies();
        setupEnvironment();
        createDirectories();
        createAPIEndpoints();
        await testSupabaseConnection();
        setupVercel();
        generateChecklist();
        
        log('=====================================', 'bright');
        log('🎉 Cloud setup completed successfully!', 'green');
        log('=====================================', 'bright');
        
        logInfo('Next steps:');
        logInfo('1. Update .env.local with your Supabase credentials');
        logInfo('2. Run: npm run migrate (to migrate data)');
        logInfo('3. Run: vercel (to deploy to Vercel)');
        logInfo('4. Check DEPLOYMENT_CHECKLIST.md for detailed steps');
        
    } catch (error) {
        log('=====================================', 'bright');
        logError('❌ Cloud setup failed!');
        logError(error.message);
        log('=====================================', 'bright');
        
        if (error.stack) {
            logError('Stack trace:');
            console.error(error.stack);
        }
        
        process.exit(1);
    }
}

// Run setup if called directly
if (require.main === module) {
    main();
}

module.exports = {
    main,
    checkPrerequisites,
    installDependencies,
    setupEnvironment,
    createDirectories,
    createAPIEndpoints,
    testSupabaseConnection,
    setupVercel,
    generateChecklist
};