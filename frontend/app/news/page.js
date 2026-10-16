'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiZap,
  FiClock,
  FiTag,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiShield,
  FiSliders,
  FiCpu,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

export default function PlatformNewsPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=news')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.error('Failed to load news data:', err));
  }, []);

  const title = isAr
    ? pageData?.titleAr || 'أخبار المنصة وتحديثات النظام'
    : pageData?.titleEn || 'Platform News & System Changelog';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'تابع أحدث الميزات المضافة، ترقيات السيرفرات، وجداول إشعارات الصيانة الدورية'
    : pageData?.subtitleEn || 'Track Latest Feature Releases, Engine Upgrades, and System Changelogs';

  const updates = pageData?.updates || [
    {
      version: 'v2.6.4',
      date: '2026-09-20',
      tagAr: 'تحديث أمني ونظامي',
      tagEn: 'Security & Core Update',
      titleAr: 'تعزيز أمان الحسابات وترقية واجهة المستخدم وتجربة التداول',
      titleEn: 'Enhanced Account Security Protocols & Luxury FinTech Navbar Redesign',
      detailsAr: 'تم تأمين بوابات الاشتراك والكورسات بالكامل، وترقية زر الملف الشخصي بكبسولة تداول ذكية، وإطلاق مركز إدارة الصفحات (CMS).',
      detailsEn: 'Implemented robust backend security gates, elevated navbar profile capsule, and integrated new dynamic CMS.',
    },
    {
      version: 'v2.5.0',
      date: '2026-08-20',
      tagAr: 'إطلاق ميزة جديدة',
      tagEn: 'New Feature Release',
      titleAr: 'إطلاق استوديو البث المباشر التفاعلي وتكامل بث الأسواق الحي',
      titleEn: 'Launch of Interactive Live Studio with Multi-Stream Capabilities',
      detailsAr: 'إتاحة الحضور التفاعلي للندوات الأسبوعية مع إمكانية مشاركة الشاشات والدردشة الحية مع كبار المحللين الفنيين.',
      detailsEn: 'Weekly interactive trading webinars with live chat and dedicated Q&A breakout rooms for VIP members.',
    },
    {
      version: 'v2.3.1',
      date: '2026-07-10',
      tagAr: 'تحسين أداء',
      tagEn: 'Performance Tuning',
      titleAr: 'تسريع أداء التحليلات وتقليل زمن استجابة الأسعار بنسبة 65%',
      titleEn: '65% Speed Optimization for Real-Time Market Feeds and Charts',
      detailsAr: 'ترقية خوادم التخزين المؤقت وتحسين معمارية الاستعلامات لضمان وصول التنبيهات اللحظية بدون أي تأخير.',
      detailsEn: 'Upgraded cache layers and query optimizations ensuring instant zero-delay market setups.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: '5rem' }}>
      {/* ── Hero Section ────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          padding: '6rem 1.5rem 4.5rem',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ maxWidth: '52rem', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <Anim effect="fade-up">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                background: 'rgba(4, 136, 248, 0.12)',
                border: '1px solid rgba(4, 136, 248, 0.3)',
                color: 'var(--primary)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '1.25rem',
              }}
            >
              <FiCpu size={14} />
              <span>{isAr ? pageData?.badgeAr || 'سجل التحديثات' : pageData?.badgeEn || 'Changelog & Updates'}</span>
            </span>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </h1>

            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                maxWidth: '44rem',
                margin: '0 auto 2rem',
              }}
            >
              {subtitle}
            </p>
          </Anim>
        </div>
      </section>

      {/* ── Updates Timeline ────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '52rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {updates.map((up, idx) => (
              <Anim key={idx} effect="fade-up" delay={idx * 100}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                    border: '1px solid rgba(18, 49, 92, 0.6)',
                    borderRadius: '1.5rem',
                    padding: '2.25rem 2rem',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span
                        style={{
                          background: 'var(--primary-gradient)',
                          color: '#FFFFFF',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          fontFamily: "'Montserrat', sans-serif",
                        }}
                      >
                        {up.version}
                      </span>

                      <span
                        style={{
                          background: 'rgba(0, 230, 118, 0.15)',
                          color: '#00E676',
                          border: '1px solid rgba(0, 230, 118, 0.3)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                        }}
                      >
                        {isAr ? up.tagAr : up.tagEn}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      <FiClock size={14} />
                      <span>{up.date}</span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                    {isAr ? up.titleAr : up.titleEn}
                  </h3>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
                    {isAr ? up.detailsAr : up.detailsEn}
                  </p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
