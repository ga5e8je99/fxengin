import "./globals.css";
import AppShell from "./components/AppShell";
import GoogleAdSenseProvider from "./components/GoogleAdSense";
import JsonLd from "./components/JsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fxengen.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FXENGIN | مهندس الفوركس — المنصة الأولى لتعليم واحتراف التداول والفوركس",
    template: "%s | FXENGIN — مهندس الفوركس",
  },
  description:
    "منصة FXENGIN الرسمية بإشراف مهندس الفوركس: المنظومة التعليمية الأولى لاحتراف التداول وتداول الفوركس، العملات، الذهب، والأسواق العالمية. دورات تدريبية معتمدة، تحليلات فنية يومية، استراتيجيات السيولة المؤسسية SMC، وأفضل وسطاء التداول الموثوقين.",
  keywords: [
    "FXENGIN",
    "FXengin",
    "fxengin",
    "FX engin",
    "fx engin",
    "FX Enfin",
    "fx enfin",
    "مهندس الفوركس",
    "مهندس الفوريكس",
    "مهندس الفركس",
    "مهندس فركس",
    "مهندس فوريكس",
    "المهندس فوركس",
    "مهندس التداول",
    "المهندس للتداول",
    "fx engen",
    "fx engine",
    "fx-engin",
    "اف اكس انجن",
    "أف أكس أنجن",
    "التداول",
    "تداول",
    "الفوركس",
    "الفوريكس",
    "تداول الفوركس",
    "تداول العملات",
    "تداول الذهب",
    "تعليم التداول",
    "تعليم التداول للمبتدئين",
    "تعليم الفوركس من الصفر",
    "تعلم الفوركس",
    "كورس تداول",
    "كورس فوركس",
    "دورة تداول",
    "دورات تدريبية تداول",
    "استراتيجيات التداول",
    "تحليل فني",
    "التحليل الفني للعملات",
    "توصيات فوركس",
    "إشارات تداول",
    "استراتيجيات SMC",
    "سمارت موني كونسيبت",
    "Smart Money Concepts",
    "كتل الأوامر Order Blocks",
    "مناطق العرض والطلب",
    "إدارة المخاطر في التداول",
    "أفضل وسيط فوركس",
    "شركات تداول موثوقة",
    "فتح حساب تداول",
    "شركات التمويل Prop Firms",
    "بوت التداول الآلي",
    "Forex Engineer",
    "Forex Trading",
    "Forex Academy",
    "Learn Forex",
    "Currency Trading",
    "Gold Trading Live",
    "Technical Analysis",
    "Forex Signals",
    "Best Forex Brokers",
    "Live Trading Room",
  ],
  authors: [
    { name: "مهندس الفوركس — FXENGIN", url: siteUrl },
    { name: "أكاديمية FXENGIN للتعليم المالي والتداول", url: `${siteUrl}/about` },
  ],
  creator: "FXENGIN — مهندس الفوركس",
  publisher: "FXENGIN",
  applicationName: "FXENGIN",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "finance",
  classification: "Financial Education & Forex Trading Platform",
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "ar": siteUrl,
      "en": `${siteUrl}/en`,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US", "ar_AE", "ar_EG", "ar_KW", "ar_QA"],
    url: siteUrl,
    siteName: "FXENGIN — مهندس الفوركس | المنصة الرائدة لتعليم التداول",
    title: "FXENGIN | مهندس الفوركس — المنصة الأولى لاحتراف التداول والفوركس",
    description:
      "ارتق بتجربتك في تداول الفوركس مع منصة FXENGIN بإشراف مهندس الفوركس. دورات احترافية، تحليلات يومية مباشرة، استراتيجيات سيولة مؤسسية SMC، وأفضل وسطاء التداول الموثوقين.",
    images: [
      {
        url: "/assets/Images/Logo/hero2.webp",
        width: 1200,
        height: 630,
        alt: "FXENGIN Trading Platform & Academy — مهندس الفوركس",
      },
      {
        url: "/assets/Images/Logo/logo.webp",
        width: 512,
        height: 512,
        alt: "FXENGIN Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FXENGIN | مهندس الفوركس — منصة التداول والتعليم المالي العالمية",
    description:
      "تعلم تداول الفوركس واحتراف الأسواق المالية من الصفر مع مهندس الفوركس وأكاديمية FXENGIN الرائدة.",
    site: "@fxengin",
    creator: "@fxengin",
    images: ["/assets/Images/Logo/hero2.webp"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/assets/Images/Logo/logo.webp', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '35e5d5063f5afb96',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || 'fxengin_yandex_verification',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || 'fxengin_bing_verification',
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#050B14",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <GoogleAdSenseProvider>
          <AppShell>{children}</AppShell>
        </GoogleAdSenseProvider>
      </body>
    </html>
  );
}
