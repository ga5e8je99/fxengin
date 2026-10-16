'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiMail,
  FiPhone,
  FiSend,
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiShield,
  FiHeadphones,
  FiArrowRight,
  FiArrowLeft,
  FiCopy,
} from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function ContactPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    topic: 'support',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=contact')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.error('Failed to load contact data:', err));
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          topic: 'support',
          subject: '',
          message: '',
        });
      } else {
        alert(data.message || (isAr ? 'حدث خطأ أثناء إرسال الرسالة' : 'Failed to send message'));
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      alert(isAr ? 'تعذر الاتصال بالخادم' : 'Connection to server failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const title = isAr
    ? pageData?.titleAr || 'تواصل معنا'
    : pageData?.titleEn || 'Contact Us';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'فريق الدعم الفني والاستشارات المؤسسية متاح لمساعدتك والإجابة على استفساراتك على مدار الساعة'
    : pageData?.subtitleEn || 'Our Dedicated Technical Support and Institutional Advisory Team are Available 24/7';

  const badge = isAr
    ? pageData?.badgeAr || 'مركز الاتصال المباشر'
    : pageData?.badgeEn || 'Direct Support Desk';

  const email = pageData?.email || 'fxengin519@gmail.com';
  const phone = pageData?.phone || '+971 4 380 0000';
  const whatsapp = pageData?.whatsapp || '';
  const telegram = pageData?.telegram || 'https://t.me/FXenginsignals';
  const workingHours = isAr
    ? pageData?.workingHoursAr || 'فريق الدعم المباشر: الإثنين - الجمعة (24 ساعة) | تليجرام VIP: على مدار الساعة 24/7'
    : pageData?.workingHoursEn || 'Direct Support: Mon - Fri (24h) | VIP Telegram Desk: 24/7 Continuous';
  const address = isAr
    ? pageData?.addressAr || ''
    : pageData?.addressEn || '';

  const departments = pageData?.departments || [
    {
      id: 'support',
      nameAr: 'الدعم الفني واستفسارات الحسابات',
      nameEn: 'Technical Support & Accounts',
      email: pageData?.email || 'fxengin519@gmail.com',
      descAr: 'لحل أي مشكلة تقنية، تفعيل الاشتراكات، ومساعدتك في منصة التعليم.',
      descEn: 'For account setup, subscription activation, and portal troubleshooting.',
      responseTimeAr: 'متوسط الرد: 15 دقيقة',
      responseTimeEn: 'Avg response: 15 mins',
    },
    {
      id: 'partners',
      nameAr: 'الشراكات والوسطاء المعرفين (IB)',
      nameEn: 'Partnerships & Introducing Brokers (IB)',
      email: pageData?.partnersEmail || 'fxengin519@gmail.com',
      descAr: 'للشراكات الاستراتيجية، برامج الريبيت، وباقات التوزيع المؤسسي.',
      descEn: 'For affiliate alliances, IB rebate scaling, and B2B solutions.',
      responseTimeAr: 'متوسط الرد: ساعتان',
      responseTimeEn: 'Avg response: 2 hours',
    },
    {
      id: 'press',
      nameAr: 'العلاقات العامة والمركز الإعلامي',
      nameEn: 'Media Relations & Press Office',
      email: pageData?.pressEmail || 'fxengin519@gmail.com',
      descAr: 'للمقابلات الصحفية، الرعايات، والتغطيات الإخبارية.',
      descEn: 'For journalistic inquiries, sponsorships, and official briefings.',
      responseTimeAr: 'متوسط الرد: 24 ساعة',
      responseTimeEn: 'Avg response: 24 hours',
    },
  ];

  const faqs = pageData?.faqs || [
    {
      qAr: 'كم من الوقت يستغرق الرد على رسالتي أو استفساري؟',
      qEn: 'How long does it take to receive a response?',
      aAr: 'يقوم فريق الدعم الفني بالرد على جميع الاستفسارات في غضون 15 إلى 30 دقيقة خلال أوقات العمل، وفورياً على مدار الساعة عبر تليجرام VIP.',
      aEn: 'Our support team responds within 15–30 minutes during standard market hours, and instantly 24/7 on VIP Telegram.',
    },
    {
      qAr: 'كيف يمكنني تفعيل اشتراكي فور الدفع بالعملات الرقمية (USDT)؟',
      qEn: 'How is my account activated after USDT checkout?',
      aAr: 'تتم المزامنة آلياً عبر خوادم التحقق من البلوكشين فور وصول تأكيدات الشبكة، ويتم فتح الكورسات وغرفة التحليلات فوراً في حسابك.',
      aEn: 'System verifies the blockchain transaction automatically upon confirmation and grants immediate access.',
    },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '80px' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Hero Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '64px 20px 48px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ maxWidth: '820px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <Anim>
            <div style={{ marginBottom: '14px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 16px',
                  borderRadius: '9999px',
                  background: 'rgba(4, 136, 248, 0.12)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <FiHeadphones size={15} />
                <span>{badge}</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(28px, 4.5vw, 44px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                margin: '0 0 16px 0',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: '16px',
                color: 'var(--text-secondary)',
                lineHeight: 1.75,
                margin: '0 auto',
                maxWidth: '680px',
              }}
            >
              {subtitle}
            </p>
          </Anim>
        </div>
      </section>

      {/* ── Quick Channels Row ── */}
      <section style={{ marginTop: '-28px', position: 'relative', zIndex: 10, padding: '0 16px' }}>
        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Email Card */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 12px 30px rgba(0, 3, 13, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all 0.25s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(4, 136, 248, 0.15)',
                  border: '1px solid rgba(4, 136, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  flexShrink: 0,
                }}
              >
                <FiMail size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  {isAr ? 'البريد الإلكتروني المباشر' : 'Direct Email Support'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <a
                    href={`mailto:${email}`}
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                    }}
                  >
                    {email}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(email, 'email')}
                    title="Copy Email"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedKey === 'email' ? 'var(--success)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                    }}
                  >
                    <FiCopy size={13} />
                  </button>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>
                  ● {isAr ? 'متوسط الرد: 15 دقيقة' : 'Avg response: 15 mins'}
                </div>
              </div>
            </div>

            {/* Telegram Desk */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 12px 30px rgba(0, 3, 13, 0.5)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                transition: 'all 0.25s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(0, 136, 204, 0.15)',
                  border: '1px solid rgba(0, 136, 204, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0088CC',
                  flexShrink: 0,
                }}
              >
                <FaTelegramPlane size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  {isAr ? 'محادثة تليجرام الفورية' : 'Instant Telegram Desk'}
                </div>
                <a
                  href={telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    display: 'block',
                  }}
                >
                  @FXenginsignals <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>({isAr ? 'توصيات وإشارات' : 'Signals'})</span>
                </a>
                <a
                  href="https://t.me/FXENGINEducation"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#38bdf8',
                    textDecoration: 'none',
                    display: 'block',
                    marginTop: '4px',
                  }}
                >
                  @FXENGINEducation <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>({isAr ? 'دورات وتدريب' : 'Courses'})</span>
                </a>
                <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '4px' }}>
                  ● {isAr ? 'متاح 24/7 للمتداولين والطلاب' : 'Available 24/7 Live'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Form & Departments Grid ── */}
      <section style={{ padding: '48px 16px 0' }}>
        <div className="container" style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
            }}
          >
            {/* Form Column */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '36px 30px',
                boxShadow: '0 20px 45px rgba(0, 3, 13, 0.6)',
              }}
            >
              <div style={{ marginBottom: '24px' }}>
                <h2
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 8px',
                  }}
                >
                  {isAr ? 'أرسل رسالة مباشرة إلى المتخصصين' : 'Send an Inquiry to Our Specialists'}
                </h2>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  {isAr
                    ? 'سيتم توجيه رسالتك للقسم المعني وتلقي الرد الموثق مع إشعار على بريدك الإلكتروني.'
                    : 'Your message will be routed directly to the appropriate department with an email confirmation.'}
                </p>
              </div>

              {submitted ? (
                <div
                  style={{
                    padding: '32px 20px',
                    textAlign: 'center',
                    background: 'rgba(37, 211, 102, 0.1)',
                    border: '1px solid rgba(37, 211, 102, 0.3)',
                    borderRadius: '16px',
                  }}
                >
                  <FiCheckCircle size={44} style={{ color: '#25D366', margin: '0 auto 14px' }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    {isAr ? 'تم استلام رسالتك بنجاح!' : 'Message Received Successfully!'}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.6 }}>
                    {isAr
                      ? 'شكراً لتواصلك معنا. يقوم فريق الدعم بمراجعة استفسارك والرد عليك في أقرب وقت.'
                      : 'Thank you for reaching out. Our team is reviewing your inquiry and will follow up promptly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary"
                    style={{ fontSize: '13px', padding: '8px 20px' }}
                  >
                    {isAr ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {isAr ? 'الاسم الكامل' : 'Full Name'} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? 'مثال: أحمد المنصوري' : 'e.g. John Doe'}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          background: 'rgba(1, 7, 30, 0.75)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {isAr ? 'البريد الإلكتروني' : 'Email Address'} *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={isAr ? 'yourname@domain.com' : 'yourname@domain.com'}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          background: 'rgba(1, 7, 30, 0.75)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          outline: 'none',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {isAr ? 'القسم المختص' : 'Target Department'}
                      </label>
                      <select
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          background: '#041026',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          outline: 'none',
                        }}
                      >
                        <option value="support">{isAr ? 'الدعم الفني والاستفسارات العامة' : 'Technical Support'}</option>
                        <option value="courses">{isAr ? 'الكورسات والأكاديمية التدريبية' : 'Academy & Courses'}</option>
                        <option value="partners">{isAr ? 'برنامج الشركاء والوسطاء (IB)' : 'Partnerships & IB'}</option>
                        <option value="vip">{isAr ? 'باقة VIP والتحليلات المؤسسية' : 'VIP Pass & Market Room'}</option>
                        <option value="press">{isAr ? 'المركز الإعلامي والعلاقات العامة' : 'Media & Press Office'}</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        {isAr ? 'رقم الهاتف' : 'Phone Number'}
                      </label>
                      <input
                        type="text"
                        placeholder={isAr ? '+971 50 ...' : '+971 50 ...'}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '11px 14px',
                          background: 'rgba(1, 7, 30, 0.75)',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          color: 'var(--text-primary)',
                          fontSize: '13.5px',
                          outline: 'none',
                          direction: 'ltr',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {isAr ? 'موضوع الرسالة' : 'Subject'}
                    </label>
                    <input
                      type="text"
                      placeholder={isAr ? 'موجز استفسارك...' : 'Brief summary of your question...'}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '11px 14px',
                        background: 'rgba(1, 7, 30, 0.75)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        fontSize: '13.5px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {isAr ? 'تفاصيل الرسالة أو الاستفسار' : 'Inquiry Details'} *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={isAr ? 'اكتب كافة التفاصيل ليتسنى لفريقنا مساعدتك بدقة...' : 'Provide complete details for accurate assistance...'}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        background: 'rgba(1, 7, 30, 0.75)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        fontSize: '13.5px',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-accent"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <FiSend size={16} />
                    <span>{loading ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال الرسالة الآن' : 'Send Message Now')}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Department Directory & SLA Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <FiClock className="text-primary" />
                  <span>{isAr ? 'أوقات العمل الرسمية والاستجابة' : 'Official Working Hours & SLA'}</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
                  {workingHours}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--success)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                  <span>{isAr ? 'أنظمة الاستجابة الفورية نشطة حالياً' : 'Automated Routing Active'}</span>
                </div>
              </div>

              {/* Department Directory */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  padding: '28px 24px',
                }}
              >
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    margin: '0 0 18px',
                  }}
                >
                  {isAr ? 'دليل الأقسام المباشرة' : 'Direct Departments Directory'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(1, 7, 30, 0.6)',
                        border: '1px solid rgba(18, 49, 92, 0.35)',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {isAr ? dept.nameAr : dept.nameEn}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                          {isAr ? dept.responseTimeAr : dept.responseTimeEn}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', lineHeight: 1.4 }}>
                        {isAr ? dept.descAr : dept.descEn}
                      </p>
                      <a
                        href={`mailto:${dept.email}`}
                        style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                      >
                        {dept.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section style={{ padding: '64px 16px 0' }}>
        <div className="container" style={{ maxWidth: '880px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: 'var(--accent)',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '10px',
              }}
            >
              <FiHelpCircle size={14} />
              <span>{isAr ? 'الأسئلة الأكثر تكراراً' : 'Frequently Asked Questions'}</span>
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? 'إجابات سريعة على أهم الاستفسارات' : 'Quick Answers to Common Inquiries'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    <span>{isAr ? faq.qAr : faq.qEn}</span>
                    {isOpen ? <FiChevronUp size={18} className="text-primary" /> : <FiChevronDown size={18} className="text-muted" />}
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 20px 18px',
                        fontSize: '13.5px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.7,
                        borderTop: '1px solid rgba(18, 49, 92, 0.25)',
                        paddingTop: '14px',
                      }}
                    >
                      {isAr ? faq.aAr : faq.aEn}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
