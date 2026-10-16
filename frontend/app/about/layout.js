const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'من نحن — رسالة ورؤية منظومة FXENGIN للتعليم والتداول المالي',
  description:
    'تعرف على قصة تأسيس FXENGIN، فريق نخبة المحللين والمهندسين الماليين، ورسالتنا في الارتقاء بالمتداول العربي نحو الاحتراف والتداول المؤسسي وهياكل السيولة الذكية.',
  keywords: [
    'من نحن FXENGIN',
    'أكاديمية FXENGIN',
    'فريق محللي الفوركس',
    'تعليم التداول في الوطن العربي',
    'رسالة ورؤية FXENGIN',
    'تاريخ منصة FXENGIN',
  ],
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: 'من نحن — رسالة ورؤية FXENGIN | المنصة الرائدة',
    description:
      'نحن نقود ثورة التعليم المالي وهندسة التداول الخوارزمي في الشرق الأوسط وشمال أفريقيا.',
    url: `${siteUrl}/about`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'من نحن | FXENGIN',
    description: 'تمكين المتداولين العرب بأحدث أدوات وهياكل التحليل المؤسسي.',
  },
};

export default function AboutLayout({ children }) {
  return children;
}
