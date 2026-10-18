import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

/**
 * Resolves an image buffer from an external URL, local path, or base64 data URI
 */
async function resolveImageBufferFromUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { ok: false, error: 'رابط الصورة غير صالح أو فارغ' };
  }

  const trimmed = inputUrl.trim();

  // 1. Data URI (Base64)
  if (trimmed.startsWith('data:')) {
    try {
      const parts = trimmed.split(',');
      const meta = parts[0] || '';
      const base64Data = parts[1] || '';
      const mimeMatch = meta.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1].toLowerCase() : 'image/png';
      const ext = '.' + (mime.split('/')[1] || 'png').replace('svg+xml', 'svg');
      return {
        ok: true,
        buffer: Buffer.from(base64Data, 'base64'),
        ext,
        base: 'image',
      };
    } catch (e) {
      return { ok: false, error: 'فشل فك تشفير صورة Base64: ' + e.message };
    }
  }

  // 2. HTTP or HTTPS Remote URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const res = await fetch(trimmed, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        return { ok: false, error: `فشل تحميل الصورة من الرابط الخارجي (كود الاستجابة: ${res.status})` };
      }

      const arrayBuffer = await res.arrayBuffer();
      let urlPathname = '';
      try {
        urlPathname = new URL(trimmed).pathname;
      } catch {}

      const ext = path.extname(urlPathname).toLowerCase() || '.png';
      const base = path.basename(urlPathname, ext) || 'logo';

      return {
        ok: true,
        buffer: Buffer.from(arrayBuffer),
        ext,
        base,
      };
    } catch (e) {
      return { ok: false, error: 'تعذر الاتصال برابط الصورة: ' + e.message };
    }
  }

  // 3. Local relative paths (e.g. /assets/images/brokers/ingot.svg or /uploads/...)
  const cleanPath = trimmed.replace(/^\/+/, '');
  const candidatePaths = [
    path.join('/app/data', cleanPath.replace(/^uploads\/+/, '')),
    path.join('/app/data/uploads', cleanPath.replace(/^uploads\/+/, '')),
    path.join(process.cwd(), 'data', cleanPath.replace(/^uploads\/+/, '')),
    path.join(process.cwd(), 'data/uploads', cleanPath.replace(/^uploads\/+/, '')),
    path.join(process.cwd(), 'public', cleanPath),
    path.join(process.cwd(), '..', 'frontend', 'public', cleanPath),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const buffer = await fs.promises.readFile(p);
        const ext = path.extname(p).toLowerCase() || '.png';
        const base = path.basename(p, ext) || 'logo';
        return { ok: true, buffer, ext, base };
      } catch {}
    }
  }

  // 4. Try fetching from public production website
  try {
    const publicUrl = `https://fxengen.com/${cleanPath}`;
    const res = await fetch(publicUrl);
    if (res.ok) {
      const arrayBuffer = await res.arrayBuffer();
      const ext = path.extname(cleanPath).toLowerCase() || '.png';
      const base = path.basename(cleanPath, ext) || 'logo';
      return {
        ok: true,
        buffer: Buffer.from(arrayBuffer),
        ext,
        base,
      };
    }
  } catch {}

  return { ok: false, error: `تعذر العثور على ملف الصورة محلياً أو خارجياً: ${trimmed}` };
}

export async function POST(req) {
  try {
    let originalBuffer = null;
    let rawExt = '';
    let rawBase = 'logo';
    let folder = 'general';

    const contentType = (req.headers.get('content-type') || '').toLowerCase();

    // Check if JSON request (e.g. { url: 'https://...', folder: 'brokers' })
    if (contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      folder = (body.folder || 'general').toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const inputUrl = (body.url || '').trim();

      if (!inputUrl) {
        return NextResponse.json({ ok: false, error: 'رابط الصورة مطلوب للتحويل' }, { status: 400 });
      }

      const fetchRes = await resolveImageBufferFromUrl(inputUrl);
      if (!fetchRes.ok) {
        return NextResponse.json({ ok: false, error: fetchRes.error }, { status: 400 });
      }

      originalBuffer = fetchRes.buffer;
      rawExt = fetchRes.ext;
      rawBase = fetchRes.base;
    } else {
      // Multipart form data (file or url field)
      const formData = await req.formData();
      folder = (formData.get('folder') || 'general').toString().replace(/[^a-zA-Z0-9_-]/g, '');
      const file = formData.get('file');
      const inputUrl = formData.get('url');

      if (inputUrl && typeof inputUrl === 'string' && inputUrl.trim()) {
        const fetchRes = await resolveImageBufferFromUrl(inputUrl.trim());
        if (!fetchRes.ok) {
          return NextResponse.json({ ok: false, error: fetchRes.error }, { status: 400 });
        }
        originalBuffer = fetchRes.buffer;
        rawExt = fetchRes.ext;
        rawBase = fetchRes.base;
      } else if (file && typeof file !== 'string') {
        const bytes = await file.arrayBuffer();
        originalBuffer = Buffer.from(bytes);
        rawExt = path.extname(file.name || '').toLowerCase();
        rawBase = path.basename(file.name || 'upload', rawExt);
      } else {
        return NextResponse.json(
          { ok: false, error: 'لم يتم استلام أي ملف أو رابط صورة صالح للرفع والتحويل' },
          { status: 400 }
        );
      }
    }

    if (!originalBuffer || originalBuffer.length === 0) {
      return NextResponse.json({ ok: false, error: 'ملف الصورة فارغ أو تالف' }, { status: 400 });
    }

    // Save into shared data directory (/app/data in container, ./shared-data on host)
    const baseDataDir = fs.existsSync('/app/data') ? '/app/data' : path.join(process.cwd(), 'data');
    const targetDir = path.join(baseDataDir, 'uploads', folder);
    await fs.promises.mkdir(targetDir, { recursive: true });

    const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35) || 'image';

    // Convert ANY image format (SVG, PNG, JPG, JPEG, BMP, TIFF, GIF, WEBP) to high-quality WebP
    let finalBuffer = originalBuffer;
    let finalExt = '.webp';
    let convertedToWebp = false;

    try {
      const isSvg =
        rawExt === '.svg' ||
        (originalBuffer && originalBuffer.slice(0, 200).toString('utf-8').toLowerCase().includes('<svg'));

      // If SVG, rasterize with density 300 for ultra-crisp vector rendering
      const sharpInstance = isSvg ? sharp(originalBuffer, { density: 300 }) : sharp(originalBuffer);

      finalBuffer = await sharpInstance
        .webp({ quality: 90, effort: 4 })
        .toBuffer();
      convertedToWebp = true;
      finalExt = '.webp';
    } catch (conversionErr) {
      console.warn('Sharp WebP conversion fallback error:', conversionErr);
      // Fallback: keep original buffer if Sharp failed
      finalBuffer = originalBuffer;
      finalExt = rawExt || '.webp';
    }

    const filename = `${Date.now()}_${cleanBase}${finalExt}`;
    const targetPath = path.join(targetDir, filename);

    await fs.promises.writeFile(targetPath, finalBuffer);

    // Public URL served directly via frontend /uploads rewrite
    const fileUrl = `https://fxengen.com/uploads/${folder}/${filename}`;

    return NextResponse.json({
      ok: true,
      success: true,
      fileUrl,
      fileName: filename,
      convertedToWebp,
      originalExt: rawExt,
      sizeBytes: finalBuffer.length,
    });
  } catch (err) {
    console.error('File Upload & WebP Conversion Error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'حدث خطأ في السيرفر أثناء حفظ وتحويل الصورة' },
      { status: 500 }
    );
  }
}
