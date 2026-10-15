import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  // Ignored if not supported in runtime
}

// Server-side in-memory translation cache
const translationCache = new Map();

// Multi-email pool for MyMemory API (each valid email provides 50,000 characters/day free = 300,000+ chars/day)
const MYMEMORY_EMAILS = [
  'admin@fxengin.com',
  'editor@fxengin.com',
  'analyst@fxengin.com',
  'support@fxengin.com',
  'team@fxengin.com',
  'dev@fxengin.com',
];

let currentEmailIndex = 0;

function getEmail() {
  const email = MYMEMORY_EMAILS[currentEmailIndex % MYMEMORY_EMAILS.length];
  currentEmailIndex++;
  return email;
}

// Polish trading terminology when translating to Arabic
function polishArabicTradingTerms(text = '') {
  if (!text) return '';
  let res = text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Replace literal translation of LONG/SHORT into financial market terms
  res = res.replace(/(^|[\s(—–-])طويلة(?=[\s)—–-]|$)/g, '$1صفقة شراء (Long)');
  res = res.replace(/(^|[\s(—–-])قصيرة(?=[\s)—–-]|$)/g, '$1صفقة بيع (Short)');
  res = res.replace(/(^|[\s(—–-])لمدة\s*12\s*ساعة(?=[\s)—–-]|$)/g, '$1إطار 12 ساعة');
  res = res.replace(/(^|[\s(—–-])لمدة\s*4\s*ساعات(?=[\s)—–-]|$)/g, '$1إطار 4 ساعات');
  res = res.replace(/(^|[\s(—–-])لمدة\s*ساعة(?=[\s)—–-]|$)/g, '$1إطار 1 ساعة');
  res = res.replace(/(^|[\s(—–-])لمدة\s*15\s*دقيقة(?=[\s)—–-]|$)/g, '$1إطار 15 دقيقة');
  res = res.replace(/(^|[\s(—–-])كسر\s*وإعادة\s*اختبار(?=[\s)—–-]|$)/g, '$1كسر وإعادة اختبار (Break & Retest)');

  return res.trim();
}

export async function translateChunk(chunk, from = 'ar', to = 'en') {
  if (!chunk || !chunk.trim()) return '';
  const trimmed = chunk.trim();
  const cacheKey = `${from}:${to}:${trimmed}`;

  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  // Attempt translation with rotating email pool to ensure quota stability
  const maxAttempts = Math.min(3, MYMEMORY_EMAILS.length);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const email = getEmail();
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 450))}&langpair=${from}|${to}&de=${encodeURIComponent(email)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const translated = data.responseData?.translatedText;
        if (translated && !translated.startsWith('MYMEMORY WARNING') && data.responseStatus === 200) {
          let cleaned = translated
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');

          if (to === 'ar') {
            cleaned = polishArabicTradingTerms(cleaned);
          }

          translationCache.set(cacheKey, cleaned);
          return cleaned;
        }
      }
    } catch (err) {
      console.warn(`[Translator] Attempt ${attempt + 1} (${email}) warning:`, err.message);
    }
  }

  // Graceful fallback to trimmed text
  return trimmed;
}

export async function translateFullText(text, from = 'ar', to = 'en') {
  if (!text || !text.trim()) return '';

  const paragraphs = text
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) return '';

  // Translate paragraphs in parallel
  const translated = await Promise.all(
    paragraphs.map(async (para) => {
      if (para.length > 450) {
        const sentences = para.match(/[^.،!؟?]+[.،!؟?]+|[^.،!؟?]+/g) || [para];
        const transSentences = await Promise.all(
          sentences.map((s) => translateChunk(s, from, to))
        );
        return transSentences.join(' ');
      }
      return translateChunk(para, from, to);
    })
  );

  return translated.join('\n\n');
}

export function isArabicText(text) {
  if (!text) return false;
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F]/;
  return arabicPattern.test(text);
}
