const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'اتصل بنا — مركز الدعم وخدمة العملاء على مدار الساعة',
  description:
    'تواصل مع فريق الدعم الفني وخدمة العملاء في منصة FXENGIN. نحن هنا للإجابة على استفساراتك حول الدورات، البوتات، وتفعيل الحسابات وخطط الاشتراك.',
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
    'اتصل بنا FXENGIN',
    'دعم العملاء فوركس',
    'خدمة عملاء FXENGIN',
    'رقم الدعم الفني',
    'استفسارات الدورات والتداول',
  ],
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: 'اتصل بنا — مركز الدعم وخدمة العملاء | FXENGIN',
    description: 'فريق دعم متخصص مستعد للإجابة على استفساراتك وتوجيهك خطوة بخطوة.',
    url: `${siteUrl}/contact`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'اتصل بنا | FXENGIN',
    description: 'تواصل معنا في أي وقت، نحن هنا لدعم نجاحك في التداول.',
  },
};

export default function ContactLayout({ children }) {
  return children;
}
