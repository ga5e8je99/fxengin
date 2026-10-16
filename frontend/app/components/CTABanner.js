'use client';
import Anim from './Anim';
import { FiTrendingUp, FiZap, FiClock, FiUsers, FiArrowLeft } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function CTABanner() {
  const { t, isAr } = useLanguage();

  return (
    <section className="section-surface" style={{ padding: '0', overflow: 'hidden', background: 'var(--surface)' }}>
      <Anim>
        <div style={{
          background: 'linear-gradient(135deg, #0A1B3D 0%, #06142F 50%, #01071E 100%)',
          boxShadow: '0 28px 70px rgba(0, 3, 13, 0.5), 0 -28px 70px rgba(0, 3, 13, 0.5)',
          position: 'relative',
          overflow: 'hidden',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Subtle Ambient Brand Glow */}
          <div aria-hidden style={{
            position: 'absolute',
            top: '50%',
            right: '15%',
            transform: 'translateY(-50%)',
            width: '440px',
            height: '320px',
            background: 'radial-gradient(ellipse, rgba(251, 135, 4, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div className="container cta-banner-grid" style={{
            padding: '72px 24px',
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '48px',
            alignItems: 'center',
          }}>

            {/* Left: Text Information */}
            <div>
              <div style={{ marginBottom: '16px' }}>
                <span className="badge badge-orange">{t.ctaBanner.badge}</span>
              </div>
              <h2 style={{
                fontSize: 'clamp(28px, 3.8vw, 42px)',
                fontWeight: 800,
                lineHeight: 1.2,
                margin: '0 0 16px 0',
                color: 'var(--text-primary)',
              }}>
                {t.ctaBanner.titlePart1}<br />
                <span className="text-gradient-brand">{t.ctaBanner.titleCapital}</span>
                <br />
                <span style={{ fontSize: '65%', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {t.ctaBanner.titleSub}
                </span>
              </h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.75, margin: '0 0 28px 0', maxWidth: '460px' }}>
                {t.ctaBanner.desc}
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <a href="/register" className="btn-primary" style={{ fontSize: '15px', textDecoration: 'none' }}>
                  {t.ctaBanner.openDemo}
                  <FiArrowLeft size={16} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
                </a>
                <a href="#courses" className="btn-secondary" style={{ fontSize: '15px', textDecoration: 'none' }}>
                  {t.ctaBanner.learnMore}
                </a>
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: t.ctaBanner.stat1Label, value: t.ctaBanner.stat1Val, icon: <FiTrendingUp size={20} color="var(--accent)" /> },
                { label: t.ctaBanner.stat2Label, value: t.ctaBanner.stat2Val, icon: <FiZap size={20} color="var(--primary)" /> },
                { label: t.ctaBanner.stat3Label, value: t.ctaBanner.stat3Val, icon: <FiClock size={20} color="var(--accent)" /> },
                { label: t.ctaBanner.stat4Label, value: t.ctaBanner.stat4Val, icon: <FiUsers size={20} color="var(--success)" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  transition: 'border-color 0.2s',
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '3px' }}>{label}</div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Anim>

      <style>{`
        @media (max-width: 768px) {
          .cta-banner-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </section>
  );
}
