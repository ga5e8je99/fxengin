const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'دورات وكورسات تداول الفوركس واحتراف التحليل المالي | FXENGIN مهندس الفوركس',
  description:
    'استكشف أقوى دورات وكورسات تعليم التداول وتداول الفوركس المعتمدة بإشراف مهندس الفوركس. استراتيجيات السيولة المؤسسية Smart Money Concepts SMC، إدارة المخاطر، وسيكولوجية المتداول من الصفر حتى الاحتراف الكامل.',
  keywords: [
    'كورسات مهندس الفوركس',
    'دورة تداول فوركس',
    'تعليم التداول',
    'تعليم الفوركس للمبتدئين',
    'دورات فوركس معتمدة',
    'دورة التحليل الفني',
    'استراتيجيات SMC',
    'كورس تداول الذهب',
    'دورات تداول العملات',
    'دبلوم التحليل المالي',
    'مهندس الفوريكس تداول',
    'FXENGIN courses',
  ],
  alternates: {
    canonical: `${siteUrl}/courses`,
  },
  openGraph: {
    title: 'دورات تداول الفوركس واحتراف التحليل المالي | FXENGIN مهندس الفوركس',
    description:
      'استكشف أقوى دورات وكورسات تعليم التداول والفوركس المعتمدة مع مهندس الفوركس وأكاديمية FXENGIN الرائدة.',
    url: `${siteUrl}/courses`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دورات تداول الفوركس والتحليل المالي | مهندس الفوركس FXENGIN',
    description: 'تعلم تداول العملات والذهب بأحدث الاستراتيجيات المؤسسية مع مهندس الفوركس وأكاديمية FXENGIN.',
  },
};

export default function CoursesLayout({ children }) {
  return children;
}
