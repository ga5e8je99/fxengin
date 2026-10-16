const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'أخبار الأسواق والتقويم الاقتصادي وتحركات العملات العاجلة',
  description:
    'تغطية إخبارية حية على مدار 24 ساعة لأهم الأحداث الاقتصادية، بيانات التضخم ومؤشرات أسعار المستهلكين، وقرارات الفائدة الصادرة عن البنوك المركزية الكبرى.',
  keywords: [
    'أخبار الفوركس',
    'التقويم الاقتصادي',
    'بيانات التضخم الأمريكية',
    'قرارات الفيدرالي الأمريكي',
    'أخبار سوق العملات والذهب',
    'تحركات النفط العاجلة',
    'بيانات الوظائف غير الزراعية NFP',
  ],
  alternates: {
    canonical: `${siteUrl}/news`,
  },
  openGraph: {
    title: 'أخبار الأسواق والتقويم الاقتصادي العاجل | FXENGIN',
    description:
      'تغطية اقتصادية لحظية لأهم مؤشرات وأخبار البنوك المركزية وتحركات العملات والمعادن.',
    url: `${siteUrl}/news`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أخبار الأسواق والتقويم الاقتصادي | FXENGIN',
    description: 'ابقَ على اطلاع دائم بآخر المستجدات الاقتصادية المؤثرة في قرارات التداول.',
  },
};

export default function NewsLayout({ children }) {
  return children;
}
