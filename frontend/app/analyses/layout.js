const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'التحليلات الفنية اليومية وإشارات الفوركس والذهب',
  description:
    'تحليلات فنية يومية دقيقة لأهم أزواج العملات والذهب والنفط والمؤشرات العالمية، تحديد مناطق السيولة المؤسسية ونقاط الدخول والخروج بنسب عائد إلى مخاطرة عالية.',
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
    'التحليل الفني اليومي',
    'إشارات فوركس',
    'توصيات تداول العملات',
    'تحليل الذهب اليوم',
    'تحليل اليورو مقابل الدولار',
    'مناطق العرض والطلب',
    'استراتيجيات السيولة SMC',
    'فرص التداول اليومية',
  ],
  alternates: {
    canonical: `${siteUrl}/analyses`,
  },
  openGraph: {
    title: 'التحليلات الفنية اليومية وإشارات الفوركس | FXENGIN',
    description:
      'تحليلات فنية يومية دقيقة لأهم أزواج العملات والذهب، تحديد مناطق السيولة ونقاط الدخول والخروج.',
    url: `${siteUrl}/analyses`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'التحليلات الفنية اليومية وإشارات الفوركس | FXENGIN',
    description: 'تحليلات أسواق المال اليومية من خبراء معتمدين لتحديد أقوى فرص التداول.',
  },
};

export default function AnalysesLayout({ children }) {
  return children;
}
