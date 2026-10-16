'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Anim from './Anim';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import FXEngineChart from './FXEngineChart';

const INSTRUMENTS = [
  { id: 'EURUSD', symbol: 'EURUSD', label: 'EUR / USD', nameAr: 'اليورو / دولار', spread: '0.2' },
  { id: 'XAUUSD', symbol: 'XAUUSD', label: 'XAU / USD', nameAr: 'الذهب / دولار', spread: '0.9' },
  { id: 'GBPUSD', symbol: 'GBPUSD', label: 'GBP / USD', nameAr: 'الباوند / دولار', spread: '0.4' },
  { id: 'BTCUSD', symbol: 'BTCUSD', label: 'BTC / USD', nameAr: 'البيتكوين', spread: '1.5' },
];

export default function PlatformSection() {
  const { t, isAr } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const [selectedInst, setSelectedInst] = useState(INSTRUMENTS[0]);

  // Hide on homepage for logged-in users
  if (isAuthenticated && user) {
    return null;
  }

  return (
    <section
      className="section-bg-primary"
      style={{
        background: 'var(--bg-primary)',
        padding: '64px 0',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 3, 13, 0.5), 0 -20px 50px rgba(0, 3, 13, 0.5)',
      }}
    >
      <div className="container">
        <Anim>
          <div
            style={{
              background: 'var(--surface-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: '1.45fr 1.15fr',
              boxShadow: '0 16px 48px rgba(0, 3, 13, 0.5)',
              minHeight: '300px',
            }}
            className="platform-grid"
          >
            {/* ── Left Side: Real-Time Dynamic Trading Chart ── */}
            <div
              style={{
                position: 'relative',
                background: '#010514',
                padding: '20px 24px 14px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderInlineEnd: '1px solid var(--border)',
                direction: 'ltr',
              }}
            >
              {/* Instrument Switcher Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {INSTRUMENTS.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setSelectedInst(inst)}
                      style={{
                        padding: '4px 12px',
                        background: selectedInst.id === inst.id ? 'var(--primary-gradient)' : 'rgba(6, 20, 47, 0.8)',
                        color: selectedInst.id === inst.id ? '#FFFFFF' : 'var(--text-secondary)',
                        border: selectedInst.id === inst.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {inst.label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                  {isAr ? 'محرك FXENGIN المؤسسي' : 'FXENGIN Pro Engine'}
                </div>
              </div>

              {/* Native Proprietary FXENGIN Live Engine Chart */}
              <div style={{ width: '100%', flex: 1, minHeight: '230px', position: 'relative' }}>
                <FXEngineChart selectedId={selectedInst.id} isAr={isAr} height={210} />
              </div>

              {/* Bottom Live Market Telemetry Stats */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid rgba(18, 49, 92, 0.4)',
                  paddingTop: '10px',
                  fontSize: '11.5px',
                  fontFamily: 'monospace',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>
                    {isAr ? 'بث أسعار حي مباشر • FXENGIN DMA' : 'Live Real-Time DMA Feed'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Spread: </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{selectedInst.spread} pips</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Latency: </span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>&lt; 28ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Side: Value Proposition Content & CTA ── */}
            <div
              style={{
                padding: '36px 36px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: isAr ? 'flex-start' : 'flex-start',
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              {/* Badge */}
              <div style={{ marginBottom: '14px' }}>
                <span
                  className="badge badge-orange"
                  style={{
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                  {t.platform.badge}
                </span>
              </div>

              {/* Title */}
              <h2
                style={{
                  fontSize: 'clamp(22px, 2.6vw, 32px)',
                  fontWeight: 800,
                  lineHeight: 1.3,
                  margin: '0 0 14px 0',
                  color: 'var(--text-primary)',
                }}
              >
                {t.platform.titlePart1}{' '}
                <span className="text-gradient-brand" style={{ display: 'inline-block' }}>
                  {t.platform.titleHighlight}
                </span>
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: '14.5px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: '0 0 24px 0',
                  maxWidth: '480px',
                }}
              >
                {t.platform.desc}
              </p>

              {/* CTA Button */}
              <Link
                href="/open-account"
                className="btn-primary"
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  height: '42px',
                  padding: '0 24px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {t.platform.openAccount}
              </Link>
            </div>
          </div>
        </Anim>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .platform-grid {
            grid-template-columns: 1fr !important;
          }
          .platform-grid > div:first-child {
            border-inline-end: none !important;
            border-bottom: 1px solid var(--border);
          }
        }
      `}</style>
    </section>
  );
}
