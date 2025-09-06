import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

interface ErrorReport {
  id: string;
  timestamp: string;
  type: 'javascript' | 'api' | 'console' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// In-memory storage for demo (replace with database in production)
let errorReports: ErrorReport[] = [];

// Helper function to determine error severity
function determineErrorSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  const message = error.message?.toLowerCase() || '';
  const stack = error.stack?.toLowerCase() || '';
  
  // Critical errors
  if (message.includes('network error') || 
      message.includes('failed to fetch') ||
      message.includes('500') ||
      stack.includes('uncaught')) {
    return 'critical';
  }
  
  // High severity errors
  if (message.includes('typeerror') ||
      message.includes('referenceerror') ||
      message.includes('syntaxerror') ||
      message.includes('404')) {
    return 'high';
  }
  
  // Medium severity errors
  if (message.includes('warning') ||
      message.includes('deprecated')) {
    return 'medium';
  }
  
  return 'low';
}

// Helper function to categorize error type
function categorizeErrorType(error: any): 'javascript' | 'api' | 'console' | 'network' {
  const message = error.message?.toLowerCase() || '';
  const source = error.source?.toLowerCase() || '';
  
  if (source === 'console' || error.type === 'console') {
    return 'console';
  }
  
  if (message.includes('fetch') || 
      message.includes('xhr') ||
      message.includes('network') ||
      message.includes('api')) {
    return error.message?.includes('api') ? 'api' : 'network';
  }
  
  return 'javascript';
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    // Basic authentication check (replace with proper auth)
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { errors, metadata } = body;
    
    if (!errors || !Array.isArray(errors)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const processedErrors: ErrorReport[] = errors.map((error: any) => {
      const errorReport: ErrorReport = {
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type: categorizeErrorType(error),
        severity: determineErrorSeverity(error),
        message: error.message || 'Unknown error',
        stack: error.stack,
        url: error.url || metadata?.url || 'unknown',
        userAgent: error.userAgent || metadata?.userAgent || 'unknown',
        userId: metadata?.userId,
        sessionId: metadata?.sessionId,
        metadata: {
          ...metadata,
          lineNumber: error.lineNumber,
          columnNumber: error.columnNumber,
          filename: error.filename,
          timestamp: error.timestamp
        }
      };
      
      return errorReport;
    });
    
    // Store errors (replace with database storage)
    errorReports.push(...processedErrors);
    
    // Keep only last 1000 errors to prevent memory issues
    if (errorReports.length > 1000) {
      errorReports = errorReports.slice(-1000);
    }
    
    return NextResponse.json({
      success: true,
      processed: processedErrors.length,
      errors: processedErrors.map(e => ({ id: e.id, severity: e.severity }))
    });
    
  } catch (error) {
    console.error('Error processing error reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');
    
    // Basic authentication check
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');
    const since = searchParams.get('since');
    
    let filteredErrors = [...errorReports];
    
    // Apply filters
    if (severity) {
      filteredErrors = filteredErrors.filter(e => e.severity === severity);
    }
    
    if (type) {
      filteredErrors = filteredErrors.filter(e => e.type === type);
    }
    
    if (since) {
      const sinceDate = new Date(since);
      filteredErrors = filteredErrors.filter(e => new Date(e.timestamp) >= sinceDate);
    }
    
    // Sort by timestamp (newest first)
    filteredErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply limit
    const paginatedErrors = filteredErrors.slice(0, limit);
    
    // Calculate statistics
    const stats = {
      total: errorReports.length,
      filtered: filteredErrors.length,
      bySeverity: {
        critical: errorReports.filter(e => e.severity === 'critical').length,
        high: errorReports.filter(e => e.severity === 'high').length,
        medium: errorReports.filter(e => e.severity === 'medium').length,
        low: errorReports.filter(e => e.severity === 'low').length
      },
      byType: {
        javascript: errorReports.filter(e => e.type === 'javascript').length,
        api: errorReports.filter(e => e.type === 'api').length,
        console: errorReports.filter(e => e.type === 'console').length,
        network: errorReports.filter(e => e.type === 'network').length
      },
      lastHour: errorReports.filter(e => {
        const errorTime = new Date(e.timestamp);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return errorTime >= oneHourAgo;
      }).length
    };
    
    return NextResponse.json({
      errors: paginatedErrors,
      stats,
      pagination: {
        limit,
        total: filteredErrors.length,
        hasMore: filteredErrors.length > limit
      }
    });
    
  } catch (error) {
    console.error('Error fetching error reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}