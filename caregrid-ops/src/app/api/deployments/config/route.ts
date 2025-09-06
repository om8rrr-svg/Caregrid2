import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface ConfigIssue {
  id: string;
  type: 'vercel.json' | 'package.json' | 'env' | 'domain';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  suggestion?: string;
}

// Helper function to validate vercel.json
async function validateVercelConfig(projectPath: string): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  
  try {
    const vercelConfigPath = path.join(projectPath, 'vercel.json');
    const configContent = await fs.readFile(vercelConfigPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    // Check for deprecated properties
    if (config.errorDocument) {
      issues.push({
        id: 'vercel-error-document',
        type: 'vercel.json',
        severity: 'warning',
        message: 'Deprecated errorDocument property found',
        file: 'vercel.json',
        suggestion: 'Remove errorDocument and use error.html in public folder',
      });
    }
    
    // Check for invalid header patterns
    if (config.headers) {
      for (const header of config.headers) {
        if (header.source && header.source.includes('*')) {
          // Check for potentially problematic regex patterns
          if (header.source.includes('**') || header.source.includes('***')) {
            issues.push({
              id: 'vercel-invalid-header-pattern',
              type: 'vercel.json',
              severity: 'error',
              message: `Invalid header pattern: ${header.source}`,
              file: 'vercel.json',
              suggestion: 'Use proper glob patterns like /* or /api/* instead of multiple asterisks',
            });
          }
        }
      }
    }
    
    // Check for missing build output directory
    if (!config.outputDirectory && !config.distDir) {
      issues.push({
        id: 'vercel-missing-output',
        type: 'vercel.json',
        severity: 'info',
        message: 'No output directory specified',
        file: 'vercel.json',
        suggestion: 'Consider specifying outputDirectory for better build performance',
      });
    }
    
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      issues.push({
        id: 'vercel-config-error',
        type: 'vercel.json',
        severity: 'error',
        message: 'Invalid vercel.json syntax',
        file: 'vercel.json',
        suggestion: 'Check JSON syntax and fix parsing errors',
      });
    }
  }
  
  return issues;
}

// Helper function to validate package.json
async function validatePackageJson(projectPath: string): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageContent);
    
    // Check for missing build script
    if (!packageJson.scripts?.build) {
      issues.push({
        id: 'package-missing-build',
        type: 'package.json',
        severity: 'warning',
        message: 'Missing build script',
        file: 'package.json',
        suggestion: 'Add a build script for deployment optimization',
      });
    }
    
    // Check for missing start script
    if (!packageJson.scripts?.start) {
      issues.push({
        id: 'package-missing-start',
        type: 'package.json',
        severity: 'info',
        message: 'Missing start script',
        file: 'package.json',
        suggestion: 'Add a start script for production deployment',
      });
    }
    
    // Check for outdated Node.js version
    if (packageJson.engines?.node) {
      const nodeVersion = packageJson.engines.node;
      if (nodeVersion.includes('14') || nodeVersion.includes('16')) {
        issues.push({
          id: 'package-outdated-node',
          type: 'package.json',
          severity: 'warning',
          message: `Outdated Node.js version specified: ${nodeVersion}`,
          file: 'package.json',
          suggestion: 'Update to Node.js 18 or 20 for better performance and security',
        });
      }
    }
    
    // Check for duplicate dependencies
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    const duplicates = deps.filter(dep => devDeps.includes(dep));
    
    if (duplicates.length > 0) {
      issues.push({
        id: 'package-duplicate-deps',
        type: 'package.json',
        severity: 'warning',
        message: `Duplicate dependencies found: ${duplicates.join(', ')}`,
        file: 'package.json',
        suggestion: 'Remove duplicates from either dependencies or devDependencies',
      });
    }
    
  } catch (error) {
    if ((error as any).code !== 'ENOENT') {
      issues.push({
        id: 'package-json-error',
        type: 'package.json',
        severity: 'error',
        message: 'Invalid package.json syntax',
        file: 'package.json',
        suggestion: 'Check JSON syntax and fix parsing errors',
      });
    }
  }
  
  return issues;
}

// Helper function to validate environment variables
function validateEnvironmentVariables(): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  
  // Check for missing critical environment variables
  const requiredVars = [
    { name: 'DATABASE_URL', description: 'Database connection string' },
    { name: 'NEXTAUTH_SECRET', description: 'NextAuth.js secret key' },
    { name: 'NEXTAUTH_URL', description: 'NextAuth.js callback URL' },
  ];
  
  for (const envVar of requiredVars) {
    if (!process.env[envVar.name]) {
      issues.push({
        id: `env-missing-${envVar.name.toLowerCase()}`,
        type: 'env',
        severity: 'error',
        message: `Missing required environment variable: ${envVar.name}`,
        suggestion: `Add ${envVar.name} to your deployment environment (${envVar.description})`,
      });
    }
  }
  
  // Check for potentially insecure environment variables
  const insecureVars = Object.keys(process.env).filter(key => 
    key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')
  ).filter(key => 
    process.env[key]?.length && process.env[key]!.length < 32
  );
  
  if (insecureVars.length > 0) {
    issues.push({
      id: 'env-weak-secrets',
      type: 'env',
      severity: 'warning',
      message: `Potentially weak secrets detected: ${insecureVars.join(', ')}`,
      suggestion: 'Ensure secrets are at least 32 characters long for security',
    });
  }
  
  return issues;
}

// Helper function to validate domain configuration
async function validateDomainConfig(): Promise<ConfigIssue[]> {
  const issues: ConfigIssue[] = [];
  
  // Check if custom domains are properly configured
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;
  
  if (vercelToken) {
    try {
      const domainsUrl = vercelTeamId 
        ? `https://api.vercel.com/v5/domains?teamId=${vercelTeamId}`
        : 'https://api.vercel.com/v5/domains';
        
      const response = await fetch(domainsUrl, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const domains = data.domains || [];
        
        for (const domain of domains) {
          // Check for domains without proper SSL
          if (!domain.verified) {
            issues.push({
              id: `domain-unverified-${domain.name}`,
              type: 'domain',
              severity: 'error',
              message: `Domain ${domain.name} is not verified`,
              suggestion: 'Verify domain ownership in Vercel dashboard',
            });
          }
          
          // Check for domains with configuration issues
          if (domain.configuredBy !== 'CNAME' && domain.configuredBy !== 'A') {
            issues.push({
              id: `domain-config-${domain.name}`,
              type: 'domain',
              severity: 'warning',
              message: `Domain ${domain.name} has unusual DNS configuration`,
              suggestion: 'Check DNS settings and ensure proper CNAME or A record configuration',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking domain configuration:', error);
    }
  }
  
  return issues;
}

export async function GET(request: NextRequest) {
  try {
    const issues: ConfigIssue[] = [];
    
    // Get project paths from environment or use defaults
    const frontendPath = process.env.FRONTEND_PROJECT_PATH || '/Users/om4ry/Library/Mobile Documents/com~apple~CloudDocs/caregrid 2';
    const opsPath = process.env.OPS_PROJECT_PATH || '/Users/om4ry/Library/Mobile Documents/com~apple~CloudDocs/caregrid 2/caregrid-ops';
    
    // Validate configurations for both projects
    const [frontendVercelIssues, frontendPackageIssues] = await Promise.all([
      validateVercelConfig(frontendPath),
      validatePackageJson(frontendPath),
    ]);
    
    const [opsVercelIssues, opsPackageIssues] = await Promise.all([
      validateVercelConfig(opsPath),
      validatePackageJson(opsPath),
    ]);
    
    // Validate environment variables and domain configuration
    const [envIssues, domainIssues] = await Promise.all([
      Promise.resolve(validateEnvironmentVariables()),
      validateDomainConfig(),
    ]);
    
    // Combine all issues
    issues.push(
      ...frontendVercelIssues,
      ...frontendPackageIssues,
      ...opsVercelIssues,
      ...opsPackageIssues,
      ...envIssues,
      ...domainIssues
    );
    
    // Sort by severity (errors first, then warnings, then info)
    const severityOrder = { error: 0, warning: 1, info: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    return NextResponse.json({
      issues,
      summary: {
        total: issues.length,
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
      },
      lastChecked: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in config validation API:', error);
    return NextResponse.json(
      { error: 'Failed to validate configuration' },
      { status: 500 }
    );
  }
}