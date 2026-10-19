const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'برنامج الشركاء والمسوقين (Affiliates & IBs) — أرباح وعمولات مستمرة',
  description:
    'انضم إلى برنامج التسويق بالعمولة والشركاء في FXENGIN. اكسب عمولات سخية ومستدامة عبر إحالة المتداولين إلى أفضل أكاديمية تعليم مالي وبوتات التداول.',
  keywords: [
    'FXENGIN',
    'FXengin',
    'fxengin',
    'FX engin',
    'fx engin',
    'FX Enfin',
    'مهندس الفوركس',
    'مهندس الفوريكس',
    'مهندس الفركس',
    'برنامج الشركاء فوركس',
    'أفلييت فوركس',
    'عمولات وسطاء التداول IB',
    'التسويق بالعمولة FXENGIN',
    'ربح المال من التسويق بالعمولة',
  ],
  alternates: {
    canonical: `${siteUrl}/partners`,
  },
  openGraph: {
    title: 'برنامج الشركاء والمسوقين | FXENGIN Affiliates',
    description: 'شاركنا النجاح واحصل على أعلى نسب عمولة مع لوحة إحصائيات متطورة.',
    url: `${siteUrl}/partners`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'برنامج شركاء FXENGIN',
    description: 'انضم كشريك رسمي وابدأ في تحقيق عوائد استثنائية.',
  },
};

export default function PartnersLayout({ children }) {
  return children;
}
