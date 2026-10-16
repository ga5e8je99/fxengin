'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import {
  FiRadio,
  FiFileText,
  FiDownload,
  FiMail,
  FiCalendar,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiImage,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

export default function MediaPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    fetch('/api/pages?slug=media')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success && data.page) {
          setPageData(data.page);
        }
      })
      .catch((err) => console.error('Failed to load media data:', err));
  }, []);

  const title = isAr
    ? pageData?.titleAr || 'المركز الإعلامي والبيانات الصحفية'
    : pageData?.titleEn || 'Media Center & Press Releases';

  const subtitle = isAr
    ? pageData?.subtitleAr || 'الأخبار الرسمية، البيانات الصحفية، وحزمة الهوية البصرية المعتمدة لمنصة FXENGIN'
    : pageData?.subtitleEn || 'Official Press Announcements, Brand Identity Kit, and Media Resources';

  const pressReleases = pageData?.pressReleases || [
    {
      date: '2026-09-15',
      titleAr: 'منصة FXENGIN تدشن الجيل الجديد من محرك التحليلات المؤسسية بدقة تتبع فائقة',
      titleEn: 'FXENGIN Launches Next-Gen Institutional Market Engine with Real-Time Precision',
      summaryAr: 'أعلنت إدارة FXENGIN عن إطلاق البنية التحتية المحدثة التي تربط تحليلات السيولة الذكية بجلسات التداول المباشرة بدعم من تقنيات الذكاء الاصطناعي.',
      summaryEn: 'FXENGIN announced the deployment of upgraded infrastructure linking Smart Money liquidity analytics to live institutional trading streams.',
    },
    {
      date: '2026-08-01',
      titleAr: 'تجاوز حاجز 25 ألف متداول نشط في مجتمع تداول العملات والمؤشرات',
      titleEn: 'FXENGIN Surpasses 25,000 Active Community Members Milestone',
      summaryAr: 'سجلت المنصة نمواً قياسياً بنسبة 140% في عدد المشتركين في البرامج التدريبية المعتمدة وغرفة التداول الاحترافية خلال الربع الثاني.',
      summaryEn: 'The platform recorded 140% quarterly subscriber growth across its accredited academy tracks and VIP market intelligence room.',
    },
  ];

  const brandAssets = pageData?.brandAssets || [
    { nameAr: 'الشعار الرسمي بدقة عالية (PNG)', nameEn: 'Official Logo (PNG 4K)', size: '1.2 MB', url: '/assets/Images/Logo/logo.webp' },
    { nameAr: 'دليل الهوية البصرية والألوان (PDF)', nameEn: 'Brand Guidelines & Palette (PDF)', size: '4.8 MB', url: '#' },
    { nameAr: 'حزمة الأيقونات والعناصر الرسومية (SVG)', nameEn: 'UI Icons & Assets (SVG)', size: '2.4 MB', url: '#' },
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
              <FiRadio size={14} />
              <span>{isAr ? pageData?.badgeAr || 'العلاقات الإعلامية' : pageData?.badgeEn || 'Media Relations'}</span>
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
                margin: '0 auto 2.5rem',
              }}
            >
              {subtitle}
            </p>

            <a
              href="mailto:press@fxengin.com"
              className="btn-primary"
              style={{ fontSize: '0.9375rem', padding: '0.75rem 1.75rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FiMail size={16} />
              <span>{isAr ? 'تواصل مع المكتب الإعلامي (press@fxengin.com)' : 'Contact Press Office'}</span>
            </a>
          </Anim>
        </div>
      </section>

      {/* ── Press Releases ──────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div className="container" style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '3rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAr ? 'البيانات الصحفية الرسمية' : 'Official Press Releases'}
            </span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {isAr ? 'أحدث الإعلانات والتصريحات المؤسسية' : 'Latest Announcements & Releases'}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {pressReleases.map((pr, idx) => (
              <Anim key={idx} effect="fade-up" delay={idx * 80}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.8) 0%, rgba(4, 15, 36, 0.8) 100%)',
                    border: '1px solid rgba(18, 49, 92, 0.5)',
                    borderRadius: '1.25rem',
                    padding: '2rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontSize: '0.8125rem', fontWeight: 700 }}>
                    <FiCalendar size={14} />
                    <span>{pr.date}</span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {isAr ? pr.titleAr : pr.titleEn}
                  </h3>

                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                    {isAr ? pr.summaryAr : pr.summaryEn}
                  </p>
                </div>
              </Anim>
            ))}
          </div>
        </div>
      </section>

      {/* ── Brand Assets / Media Kit ─────────────────────────────── */}
      <section style={{ padding: '0 1.5rem 5rem' }}>
        <div className="container" style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAr ? 'حزمة الهوية البصرية' : 'Brand Kit Assets'}
            </span>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.5rem' }}>
              {isAr ? 'مواد العلامة التجارية والشعارات المعتمدة' : 'Official Logos & Design Guidelines'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {brandAssets.map((asset, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(6, 20, 47, 0.65)',
                  border: '1px solid rgba(18, 49, 92, 0.5)',
                  borderRadius: '1.25rem',
                  padding: '1.75rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div
                    style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      borderRadius: '0.75rem',
                      background: 'rgba(4, 136, 248, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                      flexShrink: 0,
                    }}
                  >
                    <FiImage size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isAr ? asset.nameAr : asset.nameEn}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.size}</div>
                  </div>
                </div>

                <a
                  href={asset.url}
                  download
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  <FiDownload size={14} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
