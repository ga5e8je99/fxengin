const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'عروض وباقات FXENGIN الحصرية — بونص تداول وخصومات التحليلات والتمويل',
  description:
    'اكتشف أقوى عروض وباقات التداول الحصرية من FXENGIN. بونص إيداع مضاعف 100%، خصومات اشتراكات تحليلات الذهب والعملات، أكواد خصم شركات التمويل، وتخفيضات الأكاديمية.',
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
    'عروض الفوركس',
    'بونص تداول بدون إيداع',
    'بونص إيداع 100%',
    'خصم تحليلات الذهب',
    'إشارات فوركس VIP مجاناً',
    'أكواد خصم شركات التمويل',
    'سبريد خام 0.0',
    'عروض FXENGIN',
    'باقات التداول المخفضة',
  ],
  alternates: {
    canonical: `${siteUrl}/offers`,
  },
  openGraph: {
    title: 'عروض وباقات FXENGIN الحصرية | بونص وخصومات التداول الكبرى',
    description:
      'استفد من أقوى العروض الترويجية المصممة لتعزيز أرباحك وتوسيع حجم تداولاتك من بونص الإيداع إلى باقات التحليلات والتمويل.',
    url: `${siteUrl}/offers`,
    images: [{ url: '/assets/Images/Logo/logo.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'عروض وباقات FXENGIN الحصرية',
    description: 'بونص تداول مضاعف 100% وخصومات اشتراكات التحليلات وتمويل الحسابات.',
  },
};

export default function OffersLayout({ children }) {
  return children;
}
