'use client';
import { useState } from 'react';
import Anim from './Anim';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        alert(data.message || 'فشل الاشتراك في النشرة البريدية');
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── CTA Subscribe Banner ───────────────────────────── */}
      <section style={{
        background: 'var(--bg-primary)',
        padding: '72px 0',
      }}>
        <div className="container">
          <Anim direction="fade">
            <div style={{
              background: 'linear-gradient(145deg, #0D1A30 0%, #111F38 100%)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              padding: '56px 48px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Glow orbs */}
              <div aria-hidden style={{
                position: 'absolute',
                top: '-80px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '500px',
                height: '300px',
                background: 'radial-gradient(ellipse, rgba(240,165,0,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <span className="badge badge-gold" style={{ fontSize: '11px', marginBottom: '20px', display: 'inline-flex' }}>
                  الأكاديمية
                </span>

                <h2 style={{
                  fontSize: 'clamp(24px, 4vw, 38px)',
                  fontWeight: 900,
                  lineHeight: 1.2,
                  margin: '0 0 16px 0',
                }}>
                  دعوة للاشتراك في{' '}
                  <span className="text-gold-gradient">الكورسات:</span>
                </h2>

                <p style={{
                  fontSize: '16px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.75,
                  maxWidth: '520px',
                  margin: '0 auto 32px auto',
                }}>
                  انضم إلى أكاديميتنا واحصل على وصول فوري إلى جميع الدورات التدريبية الاحترافية التي طورت من مهارات آلاف المتداولين.
                </p>

                <button className="btn-gold" style={{ fontSize: '16px', padding: '14px 40px' }}>
                  اشترك الآن
                </button>
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Email Newsletter Strip ─────────────────────────── */}
      <section style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '48px 0',
      }}>
        <div className="container">
          <Anim direction="fade">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
              flexWrap: 'wrap',
            }}>
              {/* Left text */}
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800 }}>
                  النشرة البريدية
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                  اشترك في نشرتنا البريدية واحصل على أحدث التحليلات والأخبار مباشرة.
                </p>
              </div>

              {/* Right — form */}
              {submitted ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#22C55E',
                  fontWeight: 700,
                  fontSize: '15px',
                }}>
                  <span>✓</span>
                  شكراً! تم اشتراكك بنجاح.
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="أدخل بريدك الإلكتروني"
                    required
                    style={{
                      padding: '11px 18px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      fontFamily: 'Alyama, sans-serif',
                      outline: 'none',
                      minWidth: '240px',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--gold)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  />
                  <button type="submit" className="btn-gold" style={{ fontSize: '14px' }}>
                    اشتراك
                  </button>
                </form>
              )}
            </div>
          </Anim>
        </div>
      </section>
    </>
  );
}
