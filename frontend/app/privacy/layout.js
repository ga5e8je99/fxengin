const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'سياسة الخصوصية وحماية بيانات المستخدمين',
  description:
    'سياسة الخصوصية في منصة FXENGIN. التزامنا التام بحماية بيانات المتداولين وسريتها وفقاً لأعلى معايير الأمان والتشفير العالمية.',
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyLayout({ children }) {
  return children;
}
