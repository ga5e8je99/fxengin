/**
 * @file translationService.js
 * Universal Translation Service for Admin Dashboard
 * Translates Arabic text to English automatically with client caching
 * and support for single fields or batch payload translation.
 */

const clientTranslationCache = new Map();

/**
 * Translate a single string from Arabic to English (or specified language pair)
 * @param {string} text - Arabic text to translate
 * @param {string} from - Source language code (default 'ar')
 * @param {string} to - Target language code (default 'en')
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, from = 'ar', to = 'en') {
  if (!text || !text.trim()) return '';

  const trimmed = text.trim();
  const cacheKey = `${from}:${to}:${trimmed}`;

  if (clientTranslationCache.has(cacheKey)) {
    return clientTranslationCache.get(cacheKey);
  }

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ text: trimmed, from, to }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.translation) {
        clientTranslationCache.set(cacheKey, json.translation);
        return json.translation;
      }
    }
  } catch (err) {
    console.warn('[TranslationService] Warning translating text:', err.message);
  }

  return '';
}

/**
 * Batch translate multiple text fields simultaneously
 * @param {Object} textsMap - Key-value map of texts e.g. { title: '...', excerpt: '...' }
 * @param {string} from - Source language (default 'ar')
 * @param {string} to - Target language (default 'en')
 * @returns {Promise<Object>} Map of translated texts
 */
export async function translateBatch(textsMap, from = 'ar', to = 'en') {
  if (!textsMap || typeof textsMap !== 'object') return {};

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ texts: textsMap, from, to }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.translations) {
        return json.translations;
      }
    }
  } catch (err) {
    console.warn('[TranslationService] Warning batch translating:', err.message);
  }

  return {};
}
