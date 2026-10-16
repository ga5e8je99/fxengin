const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'خدمات وحلول التداول الذكي والأنظمة الخوارزمية المتطورة',
  description:
    'باقة خدمات FXENGIN المتكاملة للمتداولين والمستثمرين: بوتات التداول الآلي، التحليل المؤسسي للسيولة، إشارات الدخول الاحترافية، وخطط الاشتراكات المميزة.',
  keywords: [
    'خدمات تداول الفوركس',
    'بوت تداول آلي',
    'أنظمة التداول الخوارزمي',
    'تحليلات السيولة المؤسسية',
    'إشارات تداول مدفوعة',
    'اشتراكات منصة FXENGIN',
  ],
  alternates: {
    canonical: `${siteUrl}/services`,
  },
  openGraph: {
    title: 'خدمات وحلول التداول الذكي | FXENGIN',
    description: 'حلول متقدمة وهندسة مالية حديثة لتعظيم أداء محافظ التداول وإدارة المخاطر.',
    url: `${siteUrl}/services`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خدمات وأنظمة التداول | FXENGIN',
    description: 'أدوات تقنية وخوارزمية ترتقي بنتائجك الاستثمارية إلى المستوى الاحترافي.',
  },
};

export default function ServicesLayout({ children }) {
  return children;
}
