#!/usr/bin/env node
/**
 * Complete Cloud Deployment Script for CareGrid
 * Handles migration of images, APIs, and configuration to cloud infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  projectRoot: path.join(__dirname, '..'),
  imageDir: path.join(__dirname, '..', 'images'),
  outputDir: path.join(__dirname, '..', 'cloud-deployment'),
  vercelProject: 'caregrid',
  cdnProvider: 'vercel', // or 'cloudinary'
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    progress: '🔄'
  }[type] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function execCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`, 'progress');
    const result = execSync(command, { 
      cwd: config.projectRoot,
      stdio: 'pipe',
      encoding: 'utf8',
      ...options 
    });
    return result.trim();
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(`Error: ${error.message}`, 'error');
    throw error;
  }
}

// Step 1: Prepare cloud deployment directory
function prepareDeployment() {
  log('Preparing cloud deployment directory...', 'progress');
  
  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  
  // Create subdirectories
  const dirs = ['images', 'api', 'config', 'logs'];
  dirs.forEach(dir => {
    const dirPath = path.join(config.outputDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  
  log('Deployment directory prepared', 'success');
}

// Step 2: Optimize and prepare images for CDN
function prepareImages() {
  log('Preparing images for CDN upload...', 'progress');
  
  const imageFiles = fs.readdirSync(config.imageDir);
  const optimizedImages = [];
  
  imageFiles.forEach(file => {
    const sourcePath = path.join(config.imageDir, file);
    const targetPath = path.join(config.outputDir, 'images', file);
    
    // Copy image to deployment directory
    fs.copyFileSync(sourcePath, targetPath);
    
    optimizedImages.push({
      original: file,
      path: targetPath,
      size: fs.statSync(targetPath).size
    });
  });
  
  // Create image manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    totalImages: optimizedImages.length,
    totalSize: optimizedImages.reduce((sum, img) => sum + img.size, 0),
    images: optimizedImages
  };
  
  fs.writeFileSync(
    path.join(config.outputDir, 'images', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  log(`Prepared ${optimizedImages.length} images for CDN`, 'success');
  return manifest;
}

// Step 3: Generate cloud configuration
function generateCloudConfig() {
  log('Generating cloud configuration...', 'progress');
  
  const cloudConfig = {
    deployment: {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: 'production'
    },
    services: {
      database: {
        provider: 'supabase',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      cdn: {
        provider: config.cdnProvider,
        baseUrl: config.cdnProvider === 'vercel' 
          ? `https://${config.vercelProject}.vercel.app/images`
          : 'https://res.cloudinary.com/caregrid/image/upload',
        optimizationEnabled: true
      },
      api: {
        provider: 'vercel-functions',
        baseUrl: `https://${config.vercelProject}.vercel.app/api`,
        endpoints: [
          '/clinics',
          '/health',
          '/auth',
          '/contact'
        ]
      }
    },
    features: {
      imageOptimization: true,
      serverlessAPIs: true,
      edgeCaching: true,
      globalCDN: true
    }
  };
  
  fs.writeFileSync(
    path.join(config.outputDir, 'config', 'cloud-config.json'),
    JSON.stringify(cloudConfig, null, 2)
  );
  
  log('Cloud configuration generated', 'success');
  return cloudConfig;
}

// Step 4: Update environment variables
function updateEnvironmentConfig() {
  log('Updating environment configuration...', 'progress');
  
  const envTemplate = `# CareGrid Cloud Environment Configuration
# Generated on ${new Date().toISOString()}

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
NEXT_PUBLIC_API_BASE=https://${config.vercelProject}.vercel.app/api

# CDN Configuration
NEXT_PUBLIC_CDN_BASE=https://${config.vercelProject}.vercel.app/images

# Feature Flags
NEXT_PUBLIC_ENABLE_CLOUD_IMAGES=true
NEXT_PUBLIC_ENABLE_IMAGE_OPTIMIZATION=true

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id

# Security
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
`;
  
  fs.writeFileSync(
    path.join(config.outputDir, 'config', '.env.production'),
    envTemplate
  );
  
  log('Environment configuration template created', 'success');
}

// Step 5: Create deployment checklist
function createDeploymentChecklist() {
  log('Creating deployment checklist...', 'progress');
  
  const checklist = `# CareGrid Cloud Deployment Checklist

Generated on: ${new Date().toISOString()}

## Pre-deployment Setup

- [ ] Supabase project created and configured
- [ ] Environment variables set in Vercel dashboard
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate configured

## Database Migration

- [x] Clinic data migrated to Supabase (106 clinics)
- [ ] Database indexes optimized
- [ ] Backup strategy implemented

## Image Migration

- [ ] Images uploaded to CDN
- [ ] Image optimization configured
- [ ] Fallback images set up
- [ ] Image references updated in code

## API Migration

- [ ] Serverless functions deployed
- [ ] API endpoints tested
- [ ] Rate limiting configured
- [ ] Error handling verified

## Frontend Updates

- [ ] Cloud configuration integrated
- [ ] Image references updated
- [ ] API calls updated to use cloud endpoints
- [ ] Performance optimizations applied

## Testing

- [ ] Local development environment tested
- [ ] Staging deployment tested
- [ ] Production deployment tested
- [ ] Performance benchmarks verified
- [ ] Mobile responsiveness tested

## Monitoring

- [ ] Health checks configured
- [ ] Error tracking set up
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured

## Post-deployment

- [ ] DNS updated (if applicable)
- [ ] Old infrastructure decommissioned
- [ ] Documentation updated
- [ ] Team notified of changes

## Rollback Plan

- [ ] Rollback procedure documented
- [ ] Previous version tagged
- [ ] Database backup verified
- [ ] Emergency contacts updated
`;
  
  fs.writeFileSync(
    path.join(config.outputDir, 'DEPLOYMENT_CHECKLIST.md'),
    checklist
  );
  
  log('Deployment checklist created', 'success');
}

// Step 6: Validate deployment readiness
function validateDeployment() {
  log('Validating deployment readiness...', 'progress');
  
  const checks = {
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_SERVICE_KEY,
    imagesExist: fs.existsSync(config.imageDir),
    apiFilesExist: fs.existsSync(path.join(config.projectRoot, 'api')),
    vercelConfigExists: fs.existsSync(path.join(config.projectRoot, 'vercel.json'))
  };
  
  const validationResults = {
    timestamp: new Date().toISOString(),
    checks,
    passed: Object.values(checks).every(Boolean),
    warnings: [],
    errors: []
  };
  
  // Add warnings and errors
  if (!checks.supabaseUrl) {
    validationResults.errors.push('NEXT_PUBLIC_SUPABASE_URL environment variable not set');
  }
  
  if (!checks.supabaseKey) {
    validationResults.errors.push('SUPABASE_SERVICE_KEY environment variable not set');
  }
  
  if (!checks.imagesExist) {
    validationResults.warnings.push('Images directory not found');
  }
  
  fs.writeFileSync(
    path.join(config.outputDir, 'logs', 'validation.json'),
    JSON.stringify(validationResults, null, 2)
  );
  
  if (validationResults.passed) {
    log('Deployment validation passed', 'success');
  } else {
    log(`Deployment validation failed: ${validationResults.errors.length} errors, ${validationResults.warnings.length} warnings`, 'warning');
  }
  
  return validationResults;
}

// Main deployment function
async function deployToCloud() {
  try {
    log('🚀 Starting CareGrid cloud deployment...', 'info');
    
    // Execute deployment steps
    prepareDeployment();
    const imageManifest = prepareImages();
    const cloudConfig = generateCloudConfig();
    updateEnvironmentConfig();
    createDeploymentChecklist();
    const validation = validateDeployment();
    
    // Generate deployment summary
    const summary = {
      timestamp: new Date().toISOString(),
      status: validation.passed ? 'ready' : 'needs-attention',
      imageCount: imageManifest.totalImages,
      totalImageSize: Math.round(imageManifest.totalSize / 1024 / 1024 * 100) / 100, // MB
      cloudConfig,
      validation,
      nextSteps: [
        'Review and update environment variables in .env.production',
        'Upload images to CDN',
        'Deploy to Vercel using: vercel --prod',
        'Test all functionality in production',
        'Update DNS if using custom domain'
      ]
    };
    
    fs.writeFileSync(
      path.join(config.outputDir, 'deployment-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    log('🎉 Cloud deployment preparation completed!', 'success');
    log(`📁 Deployment files created in: ${config.outputDir}`, 'info');
    log(`📊 Images prepared: ${imageManifest.totalImages} (${summary.totalImageSize}MB)`, 'info');
    
    if (!validation.passed) {
      log('⚠️  Please address validation issues before deploying', 'warning');
      validation.errors.forEach(error => log(`   - ${error}`, 'error'));
      validation.warnings.forEach(warning => log(`   - ${warning}`, 'warning'));
    }
    
    return summary;
    
  } catch (error) {
    log(`Deployment preparation failed: ${error.message}`, 'error');
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  deployToCloud()
    .then(summary => {
      console.log('\n📋 Deployment Summary:');
      console.log(`   Status: ${summary.status}`);
      console.log(`   Images: ${summary.imageCount}`);
      console.log(`   Size: ${summary.totalImageSize}MB`);
      console.log('\n📝 Next Steps:');
      summary.nextSteps.forEach((step, i) => {
        console.log(`   ${i + 1}. ${step}`);
      });
    })
    .catch(error => {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    });
}

module.exports = { deployToCloud, config };