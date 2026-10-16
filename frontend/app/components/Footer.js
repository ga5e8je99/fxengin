'use client';
import Link from 'next/link';
import {
  FaFacebook,
  FaInstagram,
  FaXTwitter,
  FaTelegram,
  FaWhatsapp,
  FaYoutube,
  FaTiktok,
  FaThreads,
  FaRobot,
} from 'react-icons/fa6';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61592983707520',
    icon: <FaFacebook size={16} />,
    color: '#1877F2',
    bgHover: 'rgba(24, 119, 242, 0.16)',
    borderHover: '#1877F2',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/fx_engin/',
    icon: <FaInstagram size={16} />,
    color: '#E4405F',
    bgHover: 'rgba(228, 64, 95, 0.16)',
    borderHover: '#E4405F',
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/FX_Engin_',
    icon: <FaXTwitter size={15} />,
    color: '#FFFFFF',
    bgHover: 'rgba(255, 255, 255, 0.14)',
    borderHover: '#FFFFFF',
  },
  {
    label: 'Telegram Channel',
    href: 'https://t.me/FXENGIN1NEWS',
    icon: <FaTelegram size={16} />,
    color: '#24A1DE',
    bgHover: 'rgba(36, 161, 222, 0.16)',
    borderHover: '#24A1DE',
  },
  {
    label: 'WhatsApp Channel',
    href: 'https://www.whatsapp.com/channel/0029Vb6xuCYJf05Y7htlES42',
    icon: <FaWhatsapp size={16} />,
    color: '#25D366',
    bgHover: 'rgba(37, 211, 102, 0.16)',
    borderHover: '#25D366',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCmdlSP5dwGdS2aDJ1TowsNg',
    icon: <FaYoutube size={16} />,
    color: '#FF0000',
    bgHover: 'rgba(255, 0, 0, 0.16)',
    borderHover: '#FF0000',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@fx_engin?lang=en',
    icon: <FaTiktok size={15} />,
    color: '#FE2C55',
    bgHover: 'rgba(254, 44, 85, 0.16)',
    borderHover: '#FE2C55',
  },
  {
    label: 'Threads',
    href: 'https://www.threads.com/@fx_engin',
    icon: <FaThreads size={15} />,
    color: '#F55047',
    bgHover: 'rgba(245, 80, 71, 0.16)',
    borderHover: '#F55047',
  },
  {
    label: 'Telegram Bot (@FXEnginerBot)',
    href: 'https://t.me/FXEnginerBot',
    icon: <FaRobot size={15} />,
    color: '#00F2FE',
    bgHover: 'rgba(0, 242, 254, 0.16)',
    borderHover: '#00F2FE',
  },
];

export default function Footer() {
  const { t, isAr } = useLanguage();
  const { user } = useAuth();
  const year = new Date().getFullYear();

  const footerGroups = [
    { title: t.footer.academyTitle, links: t.footer.academyLinks },
    { title: t.footer.companyTitle, links: t.footer.companyLinks },
    { title: t.footer.legalTitle, links: t.footer.legalLinks },
  ];

  const getFooterLinkHref = (label) => {
    switch (label) {
      case 'الكورسات التدريبية':
      case 'Training Courses':
      case 'قاموس المصطلحات':
      case 'Trading Glossary':
        return getAppRoute('/courses', user);
      case 'التحليلات الحية':
      case 'Live Analysis':
        return getAppRoute('/analyses', user);
      case 'المدونة التعليمية':
      case 'Educational Blog':
        return getAppRoute('/blog', user);
      case 'المركز الإعلامي':
      case 'Media Center':
        return getAppRoute('/media', user);
      case 'أخبار المنصة':
      case 'Platform News':
        return getAppRoute('/news', user);
      case 'عن FXENGIN':
      case 'About FXENGIN':
        return getAppRoute('/about', user);
      case 'تواصل معنا':
      case 'Contact Us':
        return getAppRoute('/contact', user);
      case 'مركز المساعدة':
      case 'Help Center':
        return getAppRoute('/help', user);
      case 'جلسات التداول المباشرة':
      case 'Live Trading Sessions':
        return getAppRoute('/live', user);
      case 'برنامج الشركاء':
      case 'Partner Program':
        return getAppRoute('/partners', user);
      case 'انضم إلينا':
      case 'انضم الينا':
      case 'انضم إلينا (10% عمولة)':
      case 'Join Us':
      case 'Join Us (10% Commission)':
      case 'Affiliate Program':
        return getAppRoute('/join-us', user);
      case 'سياسة الخصوصية':
      case 'Privacy Policy':
        return getAppRoute('/privacy', user);
      case 'الشروط والأحكام':
      case 'Terms & Conditions':
      case 'شروط الاستخدام':
      case 'Terms of Service':
        return getAppRoute('/terms', user);
      case 'إخلاء المسؤولية عن المخاطر':
      case 'Risk Disclaimer':
      case 'إخلاء المسؤولية':
        return getAppRoute('/disclaimer', user);
      default:
        return '#';
    }
  };

  return (
    <footer
      id="footer"
      style={{
        background: 'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(4, 136, 248, 0.08) 0%, transparent 65%), var(--bg-dark)',
        position: 'relative',
        zIndex: 60,
        boxShadow: '0 -24px 60px rgba(0, 3, 13, 0.95), 0 -1px 0 rgba(18, 49, 92, 0.35)',
      }}
    >
      <div className="container-wide" style={{ padding: '64px clamp(1rem, 2.5vw, 2.5rem) 44px', width: '100%', maxWidth: 'var(--container-wide-max, 108rem)', marginInline: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(3, 1fr)', gap: '40px' }} className="footer-grid">

          {/* Brand & Mission Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <Link
              href={getAppRoute('/', user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isAr ? 'flex-end' : 'flex-start',
                gap: '10px',
                textDecoration: 'none',
                direction: 'ltr',
              }}
            >
              <img
                src="/assets/Images/Logo/logo.webp"
                alt="FXENGIN Logo"
                style={{ width: '36px', height: '36px', objectFit: 'contain' }}
              />
              <span style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 900,
                fontSize: '20px',
                letterSpacing: '1px',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                FXENGIN
              </span>
            </Link>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0, maxWidth: '280px' }}>
              {t.footer.desc}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
                {t.footer.socialTitle || (isAr ? 'تابعنا على المنصات الرسمية' : 'Follow Our Official Channels')}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '280px' }}>
                {SOCIALS.map(({ label, href, icon, color, bgHover, borderHover }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    style={{
                      width: '36px',
                      height: '36px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '9px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = color;
                      e.currentTarget.style.borderColor = borderHover;
                      e.currentTarget.style.background = bgHover;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 6px 16px ${bgHover}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--surface)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.25)';
                    }}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Nav Links Columns */}
          {footerGroups.map(({ title, links }) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {links.map(link => (
                  <Link key={link} href={getFooterLinkHref(link)} style={{
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                    {link}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Legal / Risk Disclaimer Bar */}
      <div style={{ borderTop: '1px solid var(--border)', background: '#000208' }}>
        <div className="container-wide" style={{
          padding: '24px clamp(1rem, 2.5vw, 2.5rem)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          width: '100%',
          maxWidth: 'var(--container-wide-max, 108rem)',
          marginInline: 'auto',
        }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            © {year} FXENGIN. {t.footer.rights}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
            {t.footer.riskWarning}
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) { .footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; } }
        @media (max-width: 540px)  { .footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
