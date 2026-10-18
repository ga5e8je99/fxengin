import Hero from './components/Hero';
import LiveWebinarSection from './components/LiveWebinarSection';
import MyCoursesSection from './components/MyCoursesSection';
import BrokersSection from './components/BrokersSection';
import JoinUsSection from './components/JoinUsSection';
import PlatformSection from './components/PlatformSection';
import CoursesSection from './components/CoursesSection';
import MarketOverview from './components/MarketOverview';
import CTABanner from './components/CTABanner';
import AnalysesSection from './components/AnalysesSection';
import BlogSection from './components/BlogSection';
import TestimonialsSection from './components/TestimonialsSection';
import ForexEngineerSeoSection from './components/ForexEngineerSeoSection';
import EnrollCTA from './components/EnrollCTA';
import Newsletter from './components/Newsletter';
import AdBanner from './components/AdBanner';
import SectionSeparator from './components/SectionSeparator';

export const metadata = {
  title: 'FXENGIN | مهندس الفوركس — المنصة الرائدة لتعليم واحتراف التداول والفوركس',
  description:
    'ارتق بتجربتك في عالم التداول والاستثمار مع FXENGIN بإشراف مهندس الفوركس. دورات تدريبية معتمدة، تحليلات فنية يومية حية للعملات والذهب، استراتيجيات السيولة SMC، وأفضل وسطاء التداول الموثوقين عالمياً.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FXENGIN | مهندس الفوركس — بوابتك الأولى لاحتراف التداول وأسواق المال',
    description:
      'تعلم أسرار أسواق المال وتداول الفوركس باحترافية مع مهندس الفوركس ونخبة الخبراء. دورات تدريبية متكاملة، بث مباشر يومي، وتحليلات فنية حصرية.',
    url: 'https://fxengen.com',
  },
};

export default function Home() {
  return (
    <div className="min-w-0 w-full overflow-hidden">
      <Hero />

      {/* ── 1. Hero (bg-dark) -> Live Webinar (surface) (Soft Wave Transition with Orange Glow) ── */}
      <SectionSeparator
        variant="soft-wave"
        bgColor="bg-dark"
        fillColor="surface"
        accentColor="orange"
        height={42}
      />

      {/* ── Dedicated Standalone Live Webinar & Masterclass Section ── */}
      <LiveWebinarSection />

      {/* ── 2. Live Webinar (surface) -> Platform / MyCourses (bg-primary) (Soft Wave Transition) ── */}
      <SectionSeparator
        variant="soft-wave"
        bgColor="surface"
        fillColor="bg-primary"
        accentColor="cyan"
        height={38}
      />

      <MyCoursesSection />

      {/* ── Official Brokers & Prop Partners Section (فتح حساب تداول - للمسجلين) ── */}
      <BrokersSection onlyLoggedIn={true} />

      {/* ── Affiliate & Referral Section (انضم إلينا واربح 10% عمولة - للمسجلين) ── */}
      <JoinUsSection onlyLoggedIn={true} />

      <PlatformSection />

      {/* 2. Platform (bg-primary: #01071E) -> Courses / Market Overview (Ascending Laser Trend Wave) */}
      <SectionSeparator
        variant="trend-wave"
        bgColor="bg-primary"
        fillColor="bg-primary"
        accentColor="blue"
        height={44}
      />

      <CoursesSection />

      <MarketOverview />

      {/* 4. Market Overview (bg-primary: #01071E) -> CTA Banner (surface: #06142F) (Market Liquidity Crest) */}
      <SectionSeparator
        variant="market-crest"
        bgColor="bg-primary"
        fillColor="surface"
        accentColor="blue"
        height={42}
      />

      <CTABanner />

      {/* 5. CTA Banner (surface: #06142F) -> Analyses (bg-primary: #01071E) (Smooth Parabolic Horizon Arc) */}
      <SectionSeparator
        variant="smooth-arc"
        bgColor="surface"
        fillColor="bg-primary"
        accentColor="cyan"
        height={38}
      />

      <AnalysesSection />

      {/* 6. Analyses -> Blog (surface: #06142F) (Momentum Trend Wave) */}
      <SectionSeparator
        variant="trend-wave"
        flip
        bgColor="bg-primary"
        fillColor="surface"
        accentColor="orange"
        height={40}
      />

      <BlogSection />

      {/* 7. Blog (surface: #06142F) -> Testimonials (bg-primary: #01071E) (Smooth Arc Transition) */}
      <SectionSeparator
        variant="smooth-arc"
        bgColor="surface"
        fillColor="bg-primary"
        accentColor="cyan"
        height={38}
      />

      {/* ── Client Testimonials & Success Stories Section ── */}
      <TestimonialsSection />

      {/* ── Forex Engineer Authority & In-Depth FAQ Section ── */}
      <ForexEngineerSeoSection />

      {/* 8. Testimonials -> Enroll CTA (surface: #06142F) (Trend Wave Transition) */}
      <SectionSeparator
        variant="trend-wave"
        bgColor="bg-primary"
        fillColor="surface"
        accentColor="gold"
        height={42}
      />

      <EnrollCTA />

      {/* 8. Enroll CTA (bg-primary: #01071E) -> Newsletter (surface: #06142F) (Soft Harmonic Wave) */}
      <SectionSeparator
        variant="soft-wave"
        bgColor="bg-primary"
        fillColor="surface"
        accentColor="gold"
        height={38}
      />

      <Newsletter />
    </div>
  );
}
