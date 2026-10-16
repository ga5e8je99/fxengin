import Hero from '../components/Hero';
import MyCoursesSection from '../components/MyCoursesSection';
import BrokersSection from '../components/BrokersSection';
import JoinUsSection from '../components/JoinUsSection';
import CoursesSection from '../components/CoursesSection';
import MarketOverview from '../components/MarketOverview';
import CTABanner from '../components/CTABanner';
import AnalysesSection from '../components/AnalysesSection';
import BlogSection from '../components/BlogSection';
import EnrollCTA from '../components/EnrollCTA';
import Newsletter from '../components/Newsletter';
import SectionSeparator from '../components/SectionSeparator';

export const metadata = {
  title: 'FXENGIN — منصة الفوركس والتعليم المالي العالمية',
  description: 'ارتق بتجربتك في عالم الفوركس مع FXENGIN. دورات احترافية، تحليلات يومية، وأدوات تداول متقدمة.',
};

export default function UserHomePage() {
  return (
    <div className="min-w-0 w-full overflow-hidden">
      <Hero />

      {/* 1. Hero -> Platform / MyCourses */}
      <SectionSeparator
        variant="soft-wave"
        bgColor="bg-dark"
        fillColor="bg-primary"
        accentColor="cyan"
        height={38}
      />

      <MyCoursesSection />

      {/* ── Official Brokers & Prop Partners Section (فتح حساب تداول) ── */}
      <BrokersSection />

      {/* ── Affiliate & Referral Section (انضم إلينا - 10% عمولة) ── */}
      <JoinUsSection onlyLoggedIn={false} />

      {/* 2. Brokers -> Courses */}
      <SectionSeparator
        variant="trend-wave"
        bgColor="surface"
        fillColor="surface"
        accentColor="blue"
        height={44}
      />

      <CoursesSection />

      {/* 3. Courses -> Market Overview */}
      <SectionSeparator
        variant="diagonal"
        bgColor="surface"
        fillColor="bg-primary"
        accentColor="gold"
        height={36}
      />

      <MarketOverview />

      {/* 4. Market Overview -> CTA Banner */}
      <SectionSeparator
        variant="market-crest"
        bgColor="bg-primary"
        fillColor="surface"
        accentColor="blue"
        height={42}
      />

      <CTABanner />

      {/* 5. CTA Banner -> Analyses */}
      <SectionSeparator
        variant="diagonal"
        bgColor="surface"
        fillColor="bg-primary"
        accentColor="orange"
        height={38}
      />

      <AnalysesSection />

      {/* 6. Analyses -> Blog */}
      <SectionSeparator
        variant="soft-wave"
        bgColor="bg-primary"
        fillColor="surface"
        accentColor="blue"
        height={40}
      />

      <BlogSection />

      {/* 7. Blog -> Enroll CTA */}
      <SectionSeparator
        variant="trend-wave"
        bgColor="surface"
        fillColor="bg-primary"
        accentColor="gold"
        height={42}
      />

      <EnrollCTA />

      {/* 8. Enroll CTA -> Newsletter */}
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
