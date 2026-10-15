import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    const buffer = Buffer.from(bytes);

    // Save into shared data directory (/app/data in container, ./shared-data on host)
    const baseDataDir = fs.existsSync('/app/data') ? '/app/data' : path.join(process.cwd(), 'data');
    const targetDir = path.join(baseDataDir, 'uploads', folder);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Generate safe clean unique filename
    const ext = path.extname(file.name || '').toLowerCase() || '.png';
    const rawBase = path.basename(file.name || 'upload', ext);
    const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 35);
    const filename = `${Date.now()}_${cleanBase}${ext}`;
    const targetPath = path.join(targetDir, filename);

    await fs.promises.writeFile(targetPath, buffer);

    // Public URL served directly or rewritten
    const fileUrl = `https://fxengen.com/uploads/${folder}/${filename}`;

    return NextResponse.json({
      ok: true,
      success: true,
      fileUrl,
      fileName: filename,
    });
  } catch (err) {
    console.error('File Upload Error:', err);
    return NextResponse.json(
      { ok: false, error: err.message || 'حدث خطأ في السيرفر أثناء حفظ الملف' },
      { status: 500 }
    );
  }
}
