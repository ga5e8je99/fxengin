const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'أسعار العملات والذهب والأسواق المالية مباشر لحظة بلحظة',
  description:
    'متابعة حية وفورية لأسعار العملات الأجنبية Forex، سعر أونصة الذهب XAU/USD، الفضة، والعملات المشفرة، مع مخططات بيانية متقدمة وإشارات المؤشرات الفنية.',
  keywords: [
    'أسعار العملات مباشر',
    'سعر الذهب اليوم',
    'شارت الذهب مباشر',
    'أسعار الفوركس لحظة بلحظة',
    'تحركات العملات العالمية',
    'سعر اليورو دولار',
    'مؤشر الدولار الأمريكي',
    'تداول المعادن الثمينة',
  ],
  alternates: {
    canonical: `${siteUrl}/markets`,
  },
  openGraph: {
    title: 'أسعار العملات والذهب والأسواق المالية مباشر | FXENGIN',
    description:
      'متابعة حية وفورية لأسعار العملات الأجنبية والذهب والفضة والعملات المشفرة، مع مخططات بيانية متقدمة.',
    url: `${siteUrl}/markets`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أسعار العملات والذهب مباشر | FXENGIN',
    description: 'شاشات أسعار فوركس حية بدون تأخير من كبرى البنوك العالمية.',
  },
};

export default function MarketsLayout({ children }) {
  return children;
}
