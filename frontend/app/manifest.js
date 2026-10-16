/**
 * @file manifest.js
 * @description Web App Manifest for Next.js App Router (PWA and Mobile Indexing Signals)
 */

export default function manifest() {
  return {
    name: 'FXENGIN — منصة التداول والتعليم المالي العالمية',
    short_name: 'FXENGIN',
    description: 'أقوى منصة عربية لتعليم تداول الفوركس، العملات، الذهب، والتحليل المؤسسي SMC',
    start_url: '/',
    display: 'standalone',
    background_color: '#050B14',
    theme_color: '#050B14',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['finance', 'education', 'business'],
    lang: 'ar',
    dir: 'rtl',
  };
}
