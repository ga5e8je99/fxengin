const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'غرفة التداول المباشرة والبث التحليلي الحي | FXENGIN مهندس الفوركس',
  description:
    'انضم إلى جلسات البث الحي وغرفة التداول التفاعلية مع مهندس الفوركس وخبراء FXENGIN. تحليل مباشر للفرص السعرية، متابعة افتتاح البورصات العالمية، واقتناص صفقات الفوركس والذهب لحظة بلحظة.',
  keywords: [
    'بث مباشر فوركس',
    'بث مباشر مهندس الفوركس',
    'غرفة التداول المباشر',
    'ويبينار تداول العملات',
    'تحليل مباشر للأسواق',
    'جلسة لندن ونيويورك لايف',
    'تداول الذهب مباشر',
    'لايف تداول مهندس الفوريكس',
    'FXENGIN live trading',
  ],
  alternates: {
    canonical: `${siteUrl}/live`,
  },
  openGraph: {
    title: 'غرفة التداول والبث المباشر لأسواق المال | FXENGIN مهندس الفوركس',
    description:
      'جلسات تداول حية وتفاعلية مع مهندس الفوركس وكبار المحللين الماليين لتحديد أهم فرص السوق.',
    url: `${siteUrl}/live`,
    images: [{ url: '/assets/Images/Logo/hero2.webp', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'غرفة التداول والبث المباشر | FXENGIN مهندس الفوركس',
    description: 'تداول جنباً إلى جنب مع مهندس الفوركس وخبراء السوق في بث حي ومباشر.',
  },
};

export default function LiveLayout({ children }) {
  return children;
}
