const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'انضم إلى مجتمع متداولي FXENGIN — قنوات VIP والتوجيه المباشر',
  description:
    'انضم إلى أكبر مجتمع عربي للمتداولين المحترفين في FXENGIN. احصل على تحليلات حصرية، متابعة حية للصفقات، وتوجيه مستمر من كبار خبراء التداول وإدارة المخاطر.',
  keywords: [
    'مجتمع متداولي الفوركس',
    'قناة تداول VIP',
    'مجتمع تداول عربي',
    'توصيات فوركس تليجرام',
    'جروب تداول خاص',
    'انضم إلى FXENGIN',
  ],
  alternates: {
    canonical: `${siteUrl}/join-us`,
  },
  openGraph: {
    title: 'انضم إلى مجتمع متداولي FXENGIN | قنوات VIP',
    description: 'شارك نخبة المتداولين جلسات التداول وتبادل التحليلات اليومية.',
    url: `${siteUrl}/join-us`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'انضم إلى مجتمع FXENGIN',
    description: 'تواصل وتعلم وتداول مع مجتمع من نخبة المستثمرين والمتداولين.',
  },
};

export default function JoinUsLayout({ children }) {
  return children;
}
