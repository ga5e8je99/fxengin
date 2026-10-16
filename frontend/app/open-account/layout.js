const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'شركاء الوساطة وفتح حساب تداول فوركس موثوق | FXENGIN مهندس الفوركس',
  description:
    'دليل أفضل وسطاء الفوركس وشركات التمويل (Prop Firms) المعتمدة دولياً عبر FXENGIN بإشراف مهندس الفوركس. شروط تداول تنافسية، سبريد خام 0.0، سحب فوري، وبونص إيداع 100% وحسابات إسلامية.',
  keywords: [
    'فتح حساب تداول',
    'شركاء الوساطة',
    'أفضل وسيط فوركس',
    'شركات تداول موثوقة',
    'حساب تداول إسلامي',
    'سبريد خام',
    'شركات التمويل Prop Firms',
    'XM Global',
    'Exness',
    'مهندس الفوركس وسطاء',
    'FXENGIN brokers',
  ],
  alternates: {
    canonical: `${siteUrl}/open-account`,
  },
  openGraph: {
    title: 'شركاء الوساطة وفتح حساب تداول موثوق | FXENGIN مهندس الفوركس',
    description:
      'اختر الوسيط الأنسب لخطتك الاستثمارية مع أقوى شروط التداول وبونصات كاش باك حصرية عند فتح الحساب من خلال FXENGIN.',
    url: `${siteUrl}/open-account`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أفضل وسطاء الفوركس وشركات التداول المعتمدة | FXENGIN',
    description: 'افتح حسابك الآن مع أفضل وسطاء الفوركس العالميين واستفد من عروض FXENGIN الحصرية.',
  },
};

export default function OpenAccountLayout({ children }) {
  return children;
}
