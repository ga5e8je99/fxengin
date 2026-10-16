const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'الشروط والأحكام واتفاقية الاستخدام',
  description:
    'الشروط والأحكام المنظمة لاستخدام منصة وخدمات FXENGIN، حقوق وواجبات المشتركين، وضوابط التداول والاستفادة من المحتوى التعليمي.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsLayout({ children }) {
  return children;
}
