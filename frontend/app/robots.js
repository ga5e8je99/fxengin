/**
 * @file robots.js
 * @description Search engine crawling directives (robots.txt) for Next.js App Router.
 * Directs Googlebot, Bingbot, YandexBot, and major search engine crawlers.
 */

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/profile',
          '/profile/*',
          '/checkout',
          '/checkout/*',
          '/activate',
          '/activate/*',
          '/login',
          '/register',
          '/forgot-password',
          '/courses/*/learn',
          '/*?*affiliate=*',
          '/*?*ref=*',
          '/*?*source=*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/profile',
          '/profile/*',
          '/checkout',
          '/checkout/*',
          '/activate',
          '/activate/*',
          '/courses/*/learn',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/api/',
          '/profile',
          '/checkout',
          '/activate',
          '/courses/*/learn',
        ],
      },
      {
        userAgent: 'YandexBot',
        allow: '/',
        disallow: [
          '/api/',
          '/profile',
          '/checkout',
          '/activate',
          '/courses/*/learn',
        ],
      },
      {
        userAgent: 'Applebot',
        allow: '/',
      },
      {
        userAgent: 'DuckDuckBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
