const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'مدونة ومقالات التداول والتحليل المالي والأسواق',
  description:
    'مقالات حصرية ودراسات معمقة في تداول الفوركس، استراتيجيات حركة السعر Price Action، التحليل الفني والأساسي، وسيكولوجية المتداول المحترف.',
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
    'مقالات فوركس',
    'مدونة التداول',
    'استراتيجيات التداول',
    'التحليل الفني للعملات',
    'التحليل الأساسي',
    'سيكولوجية التداول',
    'تداول الذهب والنفط',
    'أسرار الفوركس',
  ],
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    title: 'مدونة ومقالات التداول والتحليل المالي | FXENGIN',
    description:
      'مقالات حصرية ودراسات معمقة في تداول الفوركس، استراتيجيات حركة السعر Price Action، وسيكولوجية التداول.',
    url: `${siteUrl}/blog`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مدونة ومقالات التداول والتحليل المالي | FXENGIN',
    description: 'دليلك المعرفي الشامل لاحتراف أسواق المال واستراتيجيات التداول الحديثة.',
  },
};

export default function BlogLayout({ children }) {
  return children;
}
