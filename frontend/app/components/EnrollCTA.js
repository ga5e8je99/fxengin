'use client';
import Anim from './Anim';
import { LuGraduationCap } from 'react-icons/lu';
import { FiCheck, FiArrowLeft } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function EnrollCTA() {
  const { t, isAr } = useLanguage();

  return (
    <section
      className="section-bg-primary"
      style={{
        padding: '80px 0',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
        boxShadow: '0 24px 60px rgba(0, 3, 13, 0.45), 0 -24px 60px rgba(0, 3, 13, 0.45)',
      }}
    >
      {/* Background Ambience */}
      <div aria-hidden style={{
        position: 'absolute', top: '-60px', right: '10%',
        width: '280px', height: '280px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251, 135, 4, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', bottom: '-40px', left: '15%',
        width: '240px', height: '240px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(4, 136, 248, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <Anim>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: 'clamp(36px, 5vw, 64px)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            boxShadow: '0 16px 48px rgba(0, 3, 13, 0.6)',
          }}>
            {/* Icon Badge */}
            <div style={{
              width: '64px',
              height: '64px',
              background: 'rgba(4, 136, 248, 0.12)',
              border: '1px solid rgba(4, 136, 248, 0.3)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <LuGraduationCap size={32} color="var(--primary)" />
            </div>

            {/* Heading */}
            <h2 style={{ fontSize: 'clamp(26px, 3.8vw, 38px)', fontWeight: 800, margin: 0, lineHeight: 1.2, color: 'var(--text-primary)' }}>
              {t.enrollCTA.titlePart1}{' '}
              <span className="text-gradient-brand">{t.enrollCTA.titleHighlight}</span>
            </h2>

            {/* Subtext */}
            <p style={{
              fontSize: '15px',
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              maxWidth: '580px',
              margin: 0,
            }}>
              {t.enrollCTA.desc}
            </p>

            {/* Features Row */}
            <div style={{
              display: 'flex',
              gap: '28px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '8px 0',
            }}>
              {[
                { text: t.enrollCTA.perk1 },
                { text: t.enrollCTA.perk2 },
                { text: t.enrollCTA.perk3 },
                { text: t.enrollCTA.perk4 },
              ].map(({ text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'rgba(22, 199, 132, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <FiCheck size={13} color="var(--success)" />
                  </div>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '4px' }}>
              <a href="/register" className="btn-primary" style={{ fontSize: '15px', padding: '0 32px', textDecoration: 'none' }}>
                {t.enrollCTA.subscribeBtn}
                <FiArrowLeft size={16} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
              </a>
              <a href="#courses" className="btn-secondary" style={{ fontSize: '15px', textDecoration: 'none' }}>
                {t.enrollCTA.browseBtn}
              </a>
            </div>
          </div>
        </Anim>
      </div>
    </section>
  );
}
