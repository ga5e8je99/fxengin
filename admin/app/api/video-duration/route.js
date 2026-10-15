import { NextResponse } from 'next/server';

/**
 * Extract YouTube Video ID from any YouTube URL format:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID?si=...
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
function extractYouTubeId(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();

    // youtu.be/<id>
    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
      if (id && id.length >= 10) return id.slice(0, 11);
    }

    // youtube.com
    if (host.includes('youtube.com')) {
      if (parsed.searchParams.has('v')) {
        const id = parsed.searchParams.get('v');
        if (id) return id.slice(0, 11);
      }
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'v', 'shorts', 'live'].includes(parts[0]) && parts[1]) {
        return parts[1].split('?')[0].slice(0, 11);
      }
    }
  } catch {
    // Fallback to regex
  }

  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Parse ISO 8601 duration (e.g. PT27M26S, PT1H2M30S, PT45S) into seconds
 */
function parseIsoDuration(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') return null;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

/**
 * Fetch duration of a YouTube video by fetching watch page metadata with crawler user agents
 * (Googlebot and Social crawlers bypass YouTube's LOGIN_REQUIRED bot challenge)
 */
async function fetchYouTubeDuration(videoId) {
  const userAgents = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  ];

  for (const ua of userAgents) {
    try {
      const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        },
        cache: 'no-store',
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Pattern 1: itemprop="duration" content="PT27M26S"
      const metaMatch = html.match(/itemprop=["']duration["']\s+content=["']([^"']+)["']/i);
      if (metaMatch && metaMatch[1]) {
        const parsed = parseIsoDuration(metaMatch[1]);
        if (parsed && parsed > 0) return parsed;
      }

      // Pattern 2: lengthSeconds
      const lengthMatch = html.match(/["']lengthSeconds["']\s*:\s*["']?(\d+)["']?/);
      if (lengthMatch && lengthMatch[1]) {
        const sec = parseInt(lengthMatch[1], 10);
        if (!isNaN(sec) && sec > 0) return sec;
      }

      // Pattern 3: approxDurationMs
      const approxMatch = html.match(/["']approxDurationMs["']\s*:\s*["']?(\d+)["']?/);
      if (approxMatch && approxMatch[1]) {
        const ms = parseInt(approxMatch[1], 10);
        if (!isNaN(ms) && ms > 0) return Math.round(ms / 1000);
      }

      // Pattern 4: meta tag with property="og:video:duration" or itemprop="duration"
      const ogMatch = html.match(/<meta\s+[^>]*property=["']og:video:duration["'][^>]*content=["'](\d+)["']/i);
      if (ogMatch && ogMatch[1]) {
        const sec = parseInt(ogMatch[1], 10);
        if (!isNaN(sec) && sec > 0) return sec;
      }
    } catch (err) {
      console.warn(`YouTube fetch attempt with UA ${ua.slice(0, 20)} failed:`, err?.message);
    }
  }

  return null;
}

/**
 * Fetch duration of a Vimeo video via open oEmbed API
 */
async function fetchVimeoDuration(rawUrl) {
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(rawUrl)}`;
    const response = await fetch(oembedUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (typeof data.duration === 'number' && data.duration > 0) {
        return Math.round(data.duration);
      }
    }
  } catch (err) {
    console.warn('Vimeo oEmbed fetch error:', err?.message);
  }

  return null;
}

/**
 * Fetch duration of a Dailymotion video via public metadata API
 */
async function fetchDailymotionDuration(rawUrl) {
  try {
    const match = rawUrl.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      const videoId = match[1];
      const res = await fetch(`https://api.dailymotion.com/video/${videoId}?fields=duration`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.duration === 'number' && data.duration > 0) {
          return Math.round(data.duration);
        }
      }
    }
  } catch (err) {
    console.warn('Dailymotion fetch error:', err?.message);
  }
  return null;
}

/**
 * Format duration into human readable Arabic string and MM:SS format
 */
function formatDurationDetails(durationSeconds) {
  const total = Math.max(0, Math.round(durationSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const formatted = hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`;

  let humanReadable = '';
  if (hours > 0) {
    humanReadable = `${hours} ساعة و ${minutes} دقيقة`;
    if (seconds > 0) humanReadable += ` و ${seconds} ثانية`;
  } else if (minutes > 0) {
    humanReadable = `${minutes} دقيقة`;
    if (seconds > 0) humanReadable += ` و ${seconds} ثانية`;
  } else {
    humanReadable = `${seconds} ثانية`;
  }

  return { formatted, humanReadable };
}

async function handleGetDuration(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return NextResponse.json(
      { success: false, error: 'رابط الفيديو مطلوب' },
      { status: 400 }
    );
  }

  const url = rawUrl.trim();

  // 1. YouTube check
  const ytVideoId = extractYouTubeId(url);
  if (ytVideoId) {
    try {
      const durationSeconds = await fetchYouTubeDuration(ytVideoId);
      if (durationSeconds && durationSeconds > 0) {
        const { formatted, humanReadable } = formatDurationDetails(durationSeconds);
        return NextResponse.json({
          success: true,
          platform: 'youtube',
          videoId: ytVideoId,
          durationSeconds,
          formatted,
          humanReadable,
        });
      }
    } catch (err) {
      console.warn('YouTube duration extraction error:', err.message);
    }
  }

  // 2. Vimeo check
  if (url.includes('vimeo.com')) {
    try {
      const durationSeconds = await fetchVimeoDuration(url);
      if (durationSeconds && durationSeconds > 0) {
        const { formatted, humanReadable } = formatDurationDetails(durationSeconds);
        return NextResponse.json({
          success: true,
          platform: 'vimeo',
          durationSeconds,
          formatted,
          humanReadable,
        });
      }
    } catch (err) {
      console.warn('Vimeo duration extraction error:', err.message);
    }
  }

  // 3. Dailymotion check
  if (url.includes('dailymotion.com') || url.includes('dai.ly')) {
    try {
      const durationSeconds = await fetchDailymotionDuration(url);
      if (durationSeconds && durationSeconds > 0) {
        const { formatted, humanReadable } = formatDurationDetails(durationSeconds);
        return NextResponse.json({
          success: true,
          platform: 'dailymotion',
          durationSeconds,
          formatted,
          humanReadable,
        });
      }
    } catch (err) {
      console.warn('Dailymotion duration extraction error:', err.message);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: 'لم نتمكن من تحديد مدة الفيديو تلقائياً من هذا الرابط. يمكنك كتابة المدة يدوياً.',
      url,
    },
    { status: 404 }
  );
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    return await handleGetDuration(url);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const url = body.url;
    return await handleGetDuration(url);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
