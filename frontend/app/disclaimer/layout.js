const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  title: 'إخلاء المسؤولية والتحذير من مخاطر التداول',
  description:
    'بيان إخلاء المسؤولية والتحذير من المخاطر المالية لتداول عقود الفروقات والعملات الأجنبية في منصة FXENGIN.',
  alternates: {
    canonical: `${siteUrl}/disclaimer`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DisclaimerLayout({ children }) {
  return children;
}
