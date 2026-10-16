'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { fetchLocales } from '../services/systemService';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState('ar');
  const [supportedLocales, setSupportedLocales] = useState([
    { code: 'AR', name: 'العربية', dir: 'rtl', isDefault: true },
    { code: 'EN', name: 'English', dir: 'ltr', isDefault: false },
  ]);
  const [localesLoading, setLocalesLoading] = useState(true);

  // Sync supported locales from GET /system/locales on mount
  useEffect(() => {
    let isMounted = true;
    const syncLocales = async () => {
      try {
        const res = await fetchLocales();
        if (res.success && Array.isArray(res.supportedLocales) && res.supportedLocales.length > 0 && isMounted) {
          setSupportedLocales(res.supportedLocales);
        }
      } catch (e) {
        console.warn('Locales initialization notice:', e);
      } finally {
        if (isMounted) setLocalesLoading(false);
      }
    };

    syncLocales();

    // Check saved preference or browser default
    const saved = localStorage.getItem('fx_locale');
    if (saved) {
      const normalized = saved.toLowerCase();
      if (normalized === 'ar' || normalized === 'en') {
        setLocaleState(normalized);
        document.documentElement.lang = normalized;
        document.documentElement.dir = normalized === 'ar' ? 'rtl' : 'ltr';
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const setLocale = (newLocale) => {
    const normalized = (newLocale || 'ar').toLowerCase();
    const targetLocale = supportedLocales.find((l) => l.code.toLowerCase() === normalized) || {
      code: normalized.toUpperCase(),
      dir: normalized === 'ar' ? 'rtl' : 'ltr',
    };

    setLocaleState(normalized);
    try {
      localStorage.setItem('fx_locale', normalized);
    } catch (e) {
      console.warn('Storage save failed:', e);
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = normalized;
      document.documentElement.dir = targetLocale.dir || (normalized === 'ar' ? 'rtl' : 'ltr');
    }
  };

  const toggleLocale = () => {
    // If supportedLocales has items, cycle through them
    if (supportedLocales.length > 1) {
      const currentIdx = supportedLocales.findIndex((l) => l.code.toLowerCase() === locale.toLowerCase());
      const nextIdx = (currentIdx + 1) % supportedLocales.length;
      const nextLocaleCode = supportedLocales[nextIdx]?.code?.toLowerCase() || (locale === 'ar' ? 'en' : 'ar');
      setLocale(nextLocaleCode);
    } else {
      const next = locale === 'ar' ? 'en' : 'ar';
      setLocale(next);
    }
  };

  const t = translations[locale] || translations.ar;
  const isAr = locale === 'ar';
  const isEn = locale === 'en';
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider
      value={{
        locale,
        dir,
        isAr,
        isEn,
        setLocale,
        toggleLocale,
        t,
        supportedLocales,
        localesLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      locale: 'ar',
      dir: 'rtl',
      isAr: true,
      isEn: false,
      toggleLocale: () => {},
      setLocale: () => {},
      t: translations.ar,
      supportedLocales: [
        { code: 'AR', name: 'العربية', dir: 'rtl', isDefault: true },
        { code: 'EN', name: 'English', dir: 'ltr', isDefault: false },
      ],
      localesLoading: false,
    };
  }
  return ctx;
}
