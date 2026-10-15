import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

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

export async function GET(req, ctx = {}) {
  try {
    const unwrappedParams = ctx?.params ? await ctx.params : {};
    const segments = unwrappedParams?.path || [];

    if (!Array.isArray(segments) || segments.length === 0) {
      return new Response('Not Found', { status: 404 });
    }

    // Sanitize each path segment to prevent directory traversal
    const safeSegments = segments.map((seg) =>
      String(seg).replace(/[^a-zA-Z0-9._-]/g, '')
    );
    const relativePath = safeSegments.join('/');

    const baseUploadsDir = fs.existsSync('/app/data/uploads')
      ? '/app/data/uploads'
      : path.join(process.cwd(), 'data', 'uploads');
    const fullFilePath = path.join(baseUploadsDir, relativePath);

    // Prevent directory traversal escape
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
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}
