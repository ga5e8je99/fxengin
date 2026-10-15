import { NextResponse } from 'next/server';
import { translateFullText } from '../../lib/translator';

export async function POST(req) {
  try {
    const body = await req.json();

    // Single text translation
    if (typeof body.text === 'string') {
      const { text, from = 'ar', to = 'en' } = body;
      const result = await translateFullText(text, from, to);
      return NextResponse.json({
        success: true,
        translation: result,
        original: text,
      });
    }

    // Batch translation: { texts: { title: '...', excerpt: '...', ... } }
    if (body.texts && typeof body.texts === 'object') {
      const { texts, from = 'ar', to = 'en' } = body;
      const results = {};

      const keys = Object.keys(texts);
      for (const key of keys) {
        const val = texts[key];
        if (typeof val === 'string') {
          results[key] = await translateFullText(val, from, to);
        } else if (Array.isArray(val)) {
          results[key] = await Promise.all(
            val.map((item) => (typeof item === 'string' ? translateFullText(item, from, to) : item))
          );
        } else {
          results[key] = val;
        }
      }

      return NextResponse.json({
        success: true,
        translations: results,
      });
    }

    return NextResponse.json(
      { success: false, error: 'نص غير صالح للترجمة (Invalid text payload)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Translate API Route Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'فشلت الترجمة' },
      { status: 500 }
    );
  }
}
