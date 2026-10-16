'use client';
import { useState } from 'react';
import Anim from './Anim';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';

export default function Newsletter() {
  const { t, isAr } = useLanguage();
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
        alert(data.message || (isAr ? 'فشل الاشتراك في النشرة البريدية' : 'Subscription failed'));
      }
    } catch (err) {
      console.error('Newsletter error:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="section-surface"
      style={{
        background: 'var(--surface)',
        padding: '64px 0',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0, 3, 13, 0.45), 0 -24px 60px rgba(0, 3, 13, 0.45)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="container">
        <Anim>
          <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}>
            <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <FiMail size={14} />
              {t.newsletter.badge}
            </span>

            <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {t.newsletter.title}
            </h2>

            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0, maxWidth: '480px' }}>
              {t.newsletter.desc}
            </p>

            {submitted ? (
              <div style={{
                background: 'rgba(22, 199, 132, 0.15)',
                border: '1px solid var(--success)',
                borderRadius: '8px',
                padding: '16px 28px',
                color: 'var(--success)',
                fontSize: '15px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <FiCheckCircle size={18} />
                {t.newsletter.success}
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{
                display: 'flex',
                gap: '10px',
                width: '100%',
                maxWidth: '480px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.newsletter.placeholder}
                  required
                  dir={isAr ? 'rtl' : 'ltr'}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    height: '44px',
                    padding: '0 16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ height: '44px', padding: '0 24px', opacity: loading ? 0.75 : 1 }}
                >
                  {loading ? '...' : t.newsletter.submitBtn}
                </button>
              </form>
            )}

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {t.newsletter.privacy}
            </p>
          </div>
        </Anim>
      </div>
    </section>
  );
}
