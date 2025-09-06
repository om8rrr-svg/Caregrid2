import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  type: 'LAMBDAS';
  creator: {
    uid: string;
    email: string;
    username: string;
  };
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  source: 'git' | 'cli' | 'import';
  target: 'production' | 'staging';
  aliasAssigned?: boolean;
  aliasError?: any;
  isRollbackCandidate?: boolean;
  meta: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
    githubCommitRef?: string;
    githubRepo?: string;
  };
}

interface RenderService {
  id: string;
  name: string;
  type: 'web_service' | 'background_worker' | 'private_service' | 'static_site';
  repo: string;
  autoDeploy: 'yes' | 'no';
  branch: string;
  buildCommand: string;
  publishPath: string;
  pullRequestPreviewsEnabled: 'yes' | 'no';
  serviceDetails: {
    url?: string;
    buildCommand: string;
    publishPath: string;
    pullRequestPreviewsEnabled: 'yes' | 'no';
  };
  createdAt: string;
  updatedAt: string;
  suspended: 'suspended' | 'not_suspended';
  suspenders: string[];
  ownerId: string;
  slug: string;
}

interface RenderDeploy {
  id: string;
  commit: {
    id: string;
    message: string;
    createdAt: string;
  };
  status: 'created' | 'build_in_progress' | 'update_in_progress' | 'live' | 'deactivated' | 'build_failed' | 'update_failed' | 'canceled';
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to map Vercel states to our standard states
function mapVercelState(state: string): 'success' | 'failed' | 'building' | 'queued' {
  switch (state) {
    case 'READY':
      return 'success';
    case 'ERROR':
    case 'CANCELED':
      return 'failed';
    case 'BUILDING':
    case 'INITIALIZING':
      return 'building';
    case 'QUEUED':
      return 'queued';
    default:
      return 'queued';
  }
}

// Helper function to map Render states to our standard states
function mapRenderState(status: string): 'success' | 'failed' | 'building' | 'queued' {
  switch (status) {
    case 'live':
      return 'success';
    case 'build_failed':
    case 'update_failed':
    case 'canceled':
    case 'deactivated':
      return 'failed';
    case 'build_in_progress':
    case 'update_in_progress':
      return 'building';
    case 'created':
      return 'queued';
    default:
      return 'queued';
  }
}

// Helper function to calculate duration
function calculateDuration(startTime: number, endTime?: number): string {
  const end = endTime || Date.now();
  const duration = Math.floor((end - startTime) / 1000);
  
  if (duration < 60) {
    return `${duration}s`;
  } else if (duration < 3600) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  } else {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) {
    return 'Just now';
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const deployments = [];
    
    // Fetch Vercel deployments
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;
    
    if (vercelToken) {
      try {
        const vercelUrl = vercelTeamId 
          ? `https://api.vercel.com/v6/deployments?teamId=${vercelTeamId}&limit=10`
          : 'https://api.vercel.com/v6/deployments?limit=10';
          
        const vercelResponse = await fetch(vercelUrl, {
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (vercelResponse.ok) {
          const vercelData = await vercelResponse.json();
          const vercelDeployments = vercelData.deployments || [];
          
          for (const deployment of vercelDeployments) {
            const duration = deployment.ready 
              ? calculateDuration(deployment.createdAt, deployment.ready)
              : deployment.buildingAt 
              ? calculateDuration(deployment.buildingAt)
              : undefined;
              
            deployments.push({
              id: deployment.uid,
              platform: 'vercel',
              project: deployment.name,
              status: mapVercelState(deployment.state),
              branch: deployment.meta?.githubCommitRef?.replace('refs/heads/', '') || 'main',
              commit: deployment.meta?.githubCommitSha?.substring(0, 7) || 'unknown',
              author: deployment.creator?.username || deployment.creator?.email || 'unknown',
              timestamp: formatTimestamp(deployment.createdAt),
              duration,
              url: deployment.aliasAssigned ? `https://${deployment.url}` : undefined,
              environment: deployment.target === 'production' ? 'production' : 'preview',
              logs: deployment.state === 'ERROR' ? 'Build failed - check Vercel dashboard for details' : undefined,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching Vercel deployments:', error);
      }
    }
    
    // Fetch Render deployments
    const renderToken = process.env.RENDER_TOKEN;
    
    if (renderToken) {
      try {
        // First get services
        const servicesResponse = await fetch('https://api.render.com/v1/services', {
          headers: {
            'Authorization': `Bearer ${renderToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          const services = servicesData || [];
          
          // Get deployments for each service
          for (const service of services.slice(0, 3)) { // Limit to 3 services
            try {
              const deploysResponse = await fetch(`https://api.render.com/v1/services/${service.id}/deploys?limit=5`, {
                headers: {
                  'Authorization': `Bearer ${renderToken}`,
                  'Content-Type': 'application/json',
                },
              });
              
              if (deploysResponse.ok) {
                const deploysData = await deploysResponse.json();
                const deploys = deploysData || [];
                
                for (const deploy of deploys) {
                  const createdAt = new Date(deploy.createdAt).getTime();
                  const finishedAt = deploy.finishedAt ? new Date(deploy.finishedAt).getTime() : undefined;
                  
                  const duration = finishedAt 
                    ? calculateDuration(createdAt, finishedAt)
                    : deploy.status === 'build_in_progress' || deploy.status === 'update_in_progress'
                    ? calculateDuration(createdAt)
                    : undefined;
                    
                  deployments.push({
                    id: deploy.id,
                    platform: 'render',
                    project: service.name,
                    status: mapRenderState(deploy.status),
                    branch: service.branch || 'main',
                    commit: deploy.commit?.id?.substring(0, 7) || 'unknown',
                    author: 'render-user',
                    timestamp: formatTimestamp(createdAt),
                    duration,
                    url: service.serviceDetails?.url,
                    environment: 'production',
                    logs: deploy.status.includes('failed') ? 'Build failed - check Render dashboard for details' : undefined,
                  });
                }
              }
            } catch (error) {
              console.error(`Error fetching deploys for service ${service.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching Render services:', error);
      }
    }
    
    // Sort deployments by timestamp (most recent first)
    deployments.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime() || 0;
      const bTime = new Date(b.timestamp).getTime() || 0;
      return bTime - aTime;
    });
    
    return NextResponse.json({
      deployments: deployments.slice(0, 20), // Limit to 20 most recent
      lastUpdated: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error in deployment API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deployment status' },
      { status: 500 }
    );
  }
}