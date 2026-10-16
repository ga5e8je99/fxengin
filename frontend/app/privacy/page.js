'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiShield,
  FiLock,
  FiEye,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiFileText,
  FiPrinter,
  FiMail,
  FiHelpCircle,
  FiInfo,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function PrivacyPolicyPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=privacy')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.warn('Failed to load privacy data:', err.message));
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const title = isAr
    ? pageData?.titleAr || 'سياسة الخصوصية وحماية البيانات'
    : pageData?.titleEn || 'Privacy Policy & Data Protection';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'التزامنا الراسخ بحماية بياناتك وخصوصيتك الرقمية وفق أعلى المعايير الدولية واللائحة العامة لحماية البيانات (GDPR)'
    : pageData?.subtitleEn || 'Our Uncompromising Commitment to Your Digital Privacy and Data Security (GDPR & CCPA Compliant)';

  const badge = isAr
    ? pageData?.badgeAr || 'الامتثال القانوني والأمان'
    : pageData?.badgeEn || 'Legal & Privacy Compliance';

  const lastUpdated = pageData?.lastUpdated || '2026-09-20';

  const highlights = pageData?.highlights || [
    {
      titleAr: 'تشفير تام للبيانات الحساسة',
      titleEn: 'End-to-End Encryption',
      descAr: 'حماية جميع بيانات تسجيل الدخول والمعاملات بتشفير SSL/TLS 256-bit وقواعد بيانات معزولة ومحمية.',
      descEn: 'Protection of all user credentials with 256-bit SSL encryption and isolated database clusters.',
    },
    {
      titleAr: 'عدم بيع أو مشاركة البيانات إطلاقاً',
      titleEn: 'Zero Data Monetization',
      descAr: 'لا نقوم بمشاركة أو بيع بياناتك الشخصية أو نشاطك التداولي لأي طرف ثالث أو شركة إعلانية.',
      descEn: 'We never sell or distribute your personal details or trading history to third-party ad networks.',
    },
    {
      titleAr: 'الامتثال لإعلانات Google AdSense',
      titleEn: 'Google AdSense Compliant',
      descAr: 'إفصاح شفاف عن ملفات تعريف الارتباط وإدارة الإعلانات بما يتوافق مع سياسات جوجل وحقوق الزائر.',
      descEn: 'Full transparent disclosures on advertising cookies in compliance with Google publisher guidelines.',
    },
  ];

  const sections = pageData?.sections || [
    {
      id: 'sec-1',
      number: '1',
      titleAr: 'المعلومات التي نقوم بجمعها',
      titleEn: 'Information We Collect',
      contentAr: 'نقوم بجمع المعلومات الضرورية فقط لتقديم خدمات التداول والتحليل والتعليم المالي بأعلى جودة. يشمل ذلك بيانات التسجيل (الاسم والبريد الإلكتروني ورقم الهاتف)، وبيانات السجل التعليمي ونتائج الاختبارات، والبيانات التقنية كعنوان الـ IP ونوع المتصفح لضمان أمان الحساب ومنع الاختراق.',
      contentEn: 'We collect strictly necessary information to deliver our trading analytics, educational materials, and platform services. This encompasses registration details, academic progression, and technical telemetry used solely for account security.',
    },
    {
      id: 'sec-2',
      number: '2',
      titleAr: 'ملفات تعريف الارتباط (Cookies) وإعلانات Google AdSense',
      titleEn: 'Cookies & Third-Party Advertising (Google AdSense)',
      contentAr: 'تستخدم منصة FXENGIN ملفات تعريف الارتباط لتحسين تجربة التصفح وحفظ تفضيلات اللغة. كما نعتمد شركاء إعلانيين معتمدين مثل Google AdSense الذين قد يستخدمون ملفات تعريف ارتباط (مثل كوكيز DoubleClick) لعرض إعلانات ملائمة لاهتمامات الزوار. يحق للمستخدم تعطيل ملفات تعريف الارتباط في أي وقت من خلال إعدادات المتصفح أو زيارة إعدادات إعلانات جوجل الرسمية.',
      contentEn: 'FXENGIN utilizes cookies to enhance UX and remember language choices. We partner with authorized advertising networks such as Google AdSense, which may utilize cookies (such as DoubleClick) to serve contextually relevant advertisements. Users can manage or disable cookies via browser settings.',
    },
    {
      id: 'sec-3',
      number: '3',
      titleAr: 'كيفية استخدام ومعالجة بياناتك',
      titleEn: 'How We Use & Process Your Data',
      contentAr: 'تُستخدم البيانات لمعالجة طلبات الاشتراك، تفعيل الوصول للكورسات وغرف التداول، إرسال التنبيهات وإشعارات التحديثات الهامة، وتطوير أداء البنية التحتية لمنع أي محاولات وصول غير مصرح بها لحسابك الشخصي.',
      contentEn: 'Collected telemetry is utilized to process subscriptions, grant course access, dispatch system notices, and reinforce platform cybersecurity against unauthorized access attempts.',
    },
    {
      id: 'sec-4',
      number: '4',
      titleAr: 'أمان التخزين وفترة الاحتفاظ بالبيانات',
      titleEn: 'Storage Security & Data Retention',
      contentAr: 'تُحفظ البيانات في مراكز بيانات سحابية متقدمة ومحمية بجدران نارية متطورة وأنظمة مراقبة على مدار الساعة. نحتفظ ببياناتك طالما كان حسابك نشطاً، ونلتزم بحذفها فوراً بناءً على طلب خطي صريح منك.',
      contentEn: 'Data resides within secure cloud centers protected by advanced firewalls and 24/7 monitoring. Information is retained for the active lifecycle of your account and removed upon user request.',
    },
    {
      id: 'sec-5',
      number: '5',
      titleAr: 'حقوق المستخدم القانونية وفق نظام GDPR',
      titleEn: 'Your Legal Rights Under GDPR',
      contentAr: 'يحق لك في أي وقت: طلب نسخة كاملة من بياناتك المخزنة، تعديل أو تصحيح أي بيان غير دقيق، طلب الحذف النهائي لحسابك (حق النسيان)، والاعتراض على أي نوع من معالجة البيانات غير الأساسية عبر مراسلة مسؤول حماية البيانات على privacy@fxengin.com.',
      contentEn: 'Under international privacy regulations, you retain the right to inspect your data, correct inaccuracies, request full profile erasure, or file an inquiry with our Data Protection Officer at privacy@fxengin.com.',
    },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', paddingBottom: '2.5rem' }} dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Hero Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '70px 20px 50px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(18, 49, 92, 0.4)',
          textAlign: 'center',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Anim>
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(4, 136, 248, 0.12)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  color: 'var(--primary)',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <FiShield size={15} />
                <span>{badge}</span>
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(30px, 5vw, 46px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                margin: '0 0 16px',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: '16.5px',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                margin: '0 auto 20px',
                maxWidth: '720px',
              }}
            >
              {subtitle}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '16px',
                fontSize: '12.5px',
                color: 'var(--text-muted)',
              }}
            >
              <span>
                {isAr ? 'آخر تحديث معتمد:' : 'Last Updated:'}{' '}
                <strong style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>{lastUpdated}</strong>
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <FiPrinter size={14} />
                <span>{isAr ? 'طباعة الوثيقة' : 'Print Document'}</span>
              </button>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Key Highlights Cards ── */}
      <section style={{ marginTop: '-28px', position: 'relative', zIndex: 10, padding: '0 20px' }}>
        <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {highlights.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 12px 30px rgba(0, 3, 13, 0.55)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(4, 136, 248, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  >
                    <FiCheckCircle size={16} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {isAr ? item.descAr : item.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Main Body with Navigation Index ── */}
      <section style={{ padding: '48px 20px 0' }}>
        <div className="container" style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '36px',
            }}
            className="privacy-layout-grid"
          >
            {/* Left/Sidebar: Table of Contents */}
            <aside
              style={{
                position: 'sticky',
                top: 'calc(var(--top-bars-height, 9.5rem) + 1.25rem)',
                height: 'fit-content',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '18px',
                padding: '24px 20px',
                boxShadow: '0 12px 30px rgba(0, 3, 13, 0.4)',
                textAlign: isAr ? 'right' : 'left',
              }}
              className="hide-mobile"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FiFileText className="text-primary" />
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'فهرس مواد السياسة' : 'Policy Index'}
                </h4>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: activeSection === sec.id ? 'var(--primary)' : 'var(--text-secondary)',
                      background: activeSection === sec.id ? 'rgba(4, 136, 248, 0.12)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: 'var(--primary)',
                      }}
                    >
                      {sec.number}
                    </span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isAr ? sec.titleAr : sec.titleEn}
                    </span>
                  </a>
                ))}
              </nav>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(18, 49, 92, 0.4)', margin: '20px 0' }} />

              {/* DPO Quick Box */}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {isAr ? 'مسؤول حماية البيانات (DPO)' : 'Data Protection Officer'}
                </div>
                <div>privacy@fxengin.com</div>
              </div>
            </aside>

            {/* Right: Policy Clauses Articles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Google AdSense Disclosure Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(4, 136, 248, 0.08) 0%, rgba(251, 135, 4, 0.05) 100%)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(4, 136, 248, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    flexShrink: 0,
                  }}
                >
                  <FiEye size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                    {isAr ? 'إشعار الامتثال لسياسات Google AdSense وملفات تعريف الارتباط' : 'Google AdSense & Cookies Regulatory Compliance'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isAr
                      ? 'يلتزم موقع FXENGIN بشفافية كاملة في عرض الإعلانات واستخدام ملفات تعريف الارتباط المعتمدة. يمكنك مراجعة أو تخصيص تفضيلات إعلاناتك في أي وقت عبر إعدادات حساب جوجل الرسمي لضمان أقصى قدر من التحكم ببياناتك.'
                      : 'FXENGIN strictly adheres to Google publisher policies. Users retain total autonomy to control third-party ad personalization and cookie consent through Google Account Ad Settings.'}
                  </p>
                </div>
              </div>

              {/* Sections List */}
              {sections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '18px',
                    padding: '30px',
                    boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
                    scrollMarginTop: 'calc(var(--top-bars-height, 9.5rem) + 1.5rem)',
                    textAlign: isAr ? 'right' : 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(4, 136, 248, 0.15)',
                        border: '1px solid rgba(4, 136, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        fontWeight: 900,
                        fontSize: '14px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {sec.number}
                    </span>
                    <h2 style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, textAlign: isAr ? 'right' : 'left' }}>
                      {isAr ? sec.titleAr : sec.titleEn}
                    </h2>
                  </div>

                  <p
                    style={{
                      fontSize: '14.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.8,
                      margin: 0,
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    {isAr ? sec.contentAr : sec.contentEn}
                  </p>
                </article>
              ))}

              {/* Contact Compliance Box */}
              <div
                style={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid rgba(18, 49, 92, 0.5)',
                  borderRadius: '18px',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginTop: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiMail className="text-accent" size={20} />
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? 'هل لديك أي استفسار قانوني حول خصوصية بياناتك؟' : 'Have Inquiries Regarding Your Data Privacy?'}
                  </h3>
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                  {isAr
                    ? 'فريق الامتثال القانوني وحماية البيانات متاح للإجابة على أي طلب رسمي وتزويدك بنسخة من بياناتك في غضون 48 ساعة عمل.'
                    : 'Our legal compliance team is ready to process any formal inquiry or provide data portability copies within 48 business hours.'}
                </p>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <a
                    href="mailto:privacy@fxengin.com"
                    className="btn-accent"
                    style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 22px' }}
                  >
                    <span>{isAr ? 'مراسلة مسؤول الحماية (DPO)' : 'Contact DPO Desk'}</span>
                  </a>
                  <Link
                    href={getAppRoute('/contact', user)}
                    className="btn-secondary"
                    style={{ textDecoration: 'none', fontSize: '13px', padding: '10px 22px' }}
                  >
                    <span>{isAr ? 'مركز الاتصال المباشر' : 'Contact Support'}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer Navigation Quick Actions ── */}
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Link
          href={getAppRoute('/', user)}
          className="btn-secondary"
          style={{ textDecoration: 'none', fontSize: '13.5px', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {isAr ? <FiArrowRight /> : <FiArrowLeft />}
          <span>{isAr ? 'العودة للصفحة الرئيسية' : 'Return to Home'}</span>
        </Link>
      </div>
    </div>
  );
}
