const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'تقييم ومقارنة أفضل شركات تداول الفوركس الموثوقة والمرخصة عالمياً',
  description:
    'دليل شامل لتقييم أفضل شركات ووسطاء تداول الفوركس المرخصين من الهيئات الرقابية الدولية Tier-1، مقارنة السبريد، الرافعة المالية، سرعة السحب والإيداع، وموثوقية منصات MT4 و MT5.',
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
    'أفضل شركات تداول الفوركس',
    'تقييم وسطاء التداول',
    'شركات فوركس مرخصة',
    'أفضل بروكر لتداول الذهب',
    'مقارنة شركات الفوركس',
    'سبريد منخفض فوركس',
    'تقييم XM Global',
    'تراخيص شركات التداول',
  ],
  alternates: {
    canonical: `${siteUrl}/brokers`,
  },
  openGraph: {
    title: 'تقييم ومقارنة أفضل شركات تداول الفوركس الموثوقة | FXENGIN',
    description:
      'دليل شامل لتقييم ومقارنة وسطاء الفوركس العالميين المرخصين ومزايا كل منصة.',
    url: `${siteUrl}/brokers`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أفضل وسطاء الفوركس الموثوقين | FXENGIN',
    description: 'اختر وسيط التداول الأنسب لك بأمان وموثوقية عالية مع مقارنات دقيقة.',
  },
};

export default function BrokersLayout({ children }) {
  return children;
}
