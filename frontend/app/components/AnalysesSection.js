'use client';
import Anim from './Anim';
import AnalysesPricingPlans from './AnalysesPricingPlans';

export default function AnalysesSection() {
  return (
    <section
      className="section section-bg-primary"
      id="analyses"
      style={{
        background: 'var(--bg-primary)',
        position: 'relative',
        padding: '72px 0 84px',
        boxShadow: '0 24px 60px rgba(0, 3, 13, 0.45), 0 -24px 60px rgba(0, 3, 13, 0.45)',
      }}
    >
      <div className="container">
        {/* The 3-Tier Monthly VIP Pricing Plans Component */}
        <Anim>
          <AnalysesPricingPlans />
        </Anim>
      </div>
    </section>
  );
}
