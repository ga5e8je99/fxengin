import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};

async function serveUploadedFile(cleanPath) {
  try {
    const relativePath = cleanPath.replace(/^uploads\/?/, '');
    const safeSegments = relativePath.split('/').map((s) => s.replace(/[^a-zA-Z0-9._-]/g, ''));
    const safeRelativePath = safeSegments.join('/');

    const baseUploadsDir = fs.existsSync('/app/data/uploads')
      ? '/app/data/uploads'
      : path.join(process.cwd(), 'data', 'uploads');
    const fullFilePath = path.join(baseUploadsDir, safeRelativePath);

    const resolvedPath = path.resolve(fullFilePath);
    const resolvedBase = path.resolve(baseUploadsDir);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return new Response('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return new Response('File Not Found', { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

const BACKEND_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://fx-backenf.vercel.app' : 'http://localhost:5001')
).replace(/\/+$/, '');

/**
 * Universal Proxy Handler for all HTTP requests to FXENGIN Core API
 * Resolves CORS restrictions in production deployments by acting as a Same-Origin BFF Proxy.
 */
async function handleProxy(req, { params } = {}) {
  const unwrappedParams = params ? await params : {};
  const pathSegments = unwrappedParams?.path || [];
  const rawPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;
  const cleanPath = String(rawPath || '').replace(/^\/+/, '');

  if (cleanPath.startsWith('uploads/') || cleanPath === 'uploads') {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Range',
        },
      });
    }
    return serveUploadedFile(cleanPath);
  }
  
  // Extract search params from original request URL
  const { search } = new URL(req.url);
  const targetUrl = `${BACKEND_URL}/${cleanPath}${search}`;

  const requestHeaders = new Headers();

  // Forward necessary headers
  req.headers.forEach((val, key) => {
    const lowerKey = key.toLowerCase();
    // Skip host, connection, and content-length headers that could trigger backend rejection
    if (!['host', 'connection', 'content-length'].includes(lowerKey)) {
      requestHeaders.set(key, val);
    }
  });

  // Ensure JSON headers if body exists
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json, text/event-stream, */*');
  }

  let body = null;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    try {
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = JSON.stringify(await req.json());
      } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
        body = await req.formData();
      } else {
        body = await req.text();
      }
    } catch {
      body = null;
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers: requestHeaders,
      body,
      cache: 'no-store',
    });

    const isEventStream = backendResponse.headers.get('content-type')?.includes('text/event-stream');

    if (isEventStream && backendResponse.body) {
      return new Response(backendResponse.body, {
        status: backendResponse.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!['transfer-encoding', 'content-encoding'].includes(lower)) {
        responseHeaders.set(key, val);
      }
    });

    // Ensure Same-Origin / CORS safety
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');

    const responseData = await backendResponse.arrayBuffer();

    return new Response(responseData, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`Proxy error forwarding to ${targetUrl}:`, err);
    return NextResponse.json(
      {
        success: false,
        message: 'Proxy connection error communicating with backend API',
        error: err.message,
      },
      { status: 502 }
    );
  }
}

export async function GET(req, ctx) {
  return handleProxy(req, ctx);
}

export async function POST(req, ctx) {
  return handleProxy(req, ctx);
}

export async function PUT(req, ctx) {
  return handleProxy(req, ctx);
}

export async function DELETE(req, ctx) {
  return handleProxy(req, ctx);
}

export async function PATCH(req, ctx) {
  return handleProxy(req, ctx);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    },
  });
}
