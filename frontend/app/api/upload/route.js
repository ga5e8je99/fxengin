import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') || 'general')
      .toString()
      .replace(/[^a-zA-Z0-9_-]/g, '');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { ok: false, error: 'لم يتم استلام أي ملف للرفع' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    const baseDataDir = fs.existsSync('/app/data') ? '/app/data' : path.join(process.cwd(), 'data');
    const targetDir = path.join(baseDataDir, 'uploads', folder);
    await fs.promises.mkdir(targetDir, { recursive: true });

    const rawExt = path.extname(file.name || '').toLowerCase();
    const rawBase = path.basename(file.name || 'upload', rawExt);
    const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);

    // Check if the uploaded file is an image (convert to webp)
    const mimeType = (file.type || '').toLowerCase();
    const isImage =
      (mimeType.startsWith('image/') && !mimeType.includes('svg') && !mimeType.includes('x-icon')) ||
      ['.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.jfif', '.webp'].includes(rawExt);

    let finalBuffer = originalBuffer;
    let finalExt = rawExt || '.bin';

    if (isImage) {
      try {
        finalBuffer = await sharp(originalBuffer)
          .webp({ quality: 85, effort: 4 })
          .toBuffer();
        finalExt = '.webp';
      } catch (conversionErr) {
        console.warn('Sharp WebP conversion fallback:', conversionErr);
        finalBuffer = originalBuffer;
        finalExt = rawExt || '.png';
      }
    }

    const filename = `${Date.now()}_${cleanBase}${finalExt}`;
    const targetPath = path.join(targetDir, filename);

    await fs.promises.writeFile(targetPath, finalBuffer);

    const fileUrl = `https://fxengen.com/uploads/${folder}/${filename}`;

    return NextResponse.json({
      ok: true,
      success: true,
      fileUrl,
      fileName: filename,
      convertedToWebp: finalExt === '.webp',
    });
  } catch (err) {
    console.error('File Upload Error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'حدث خطأ في السيرفر أثناء حفظ الملف' },
      { status: 500 }
    );
  }
}
