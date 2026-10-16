'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from './Anim';
import { FiTrendingUp, FiBarChart2, FiShield, FiCpu, FiArrowLeft } from 'react-icons/fi';
import {
  IoBarChartOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoStatsChartOutline,
  IoAnalyticsOutline,
  IoShieldCheckmarkOutline,
  IoLockClosedOutline,
  IoWarningOutline,
  IoHardwareChipOutline,
  IoFlashOutline,
  IoSpeedometerOutline,
  IoSparklesOutline,
  IoPulseOutline,
  IoCashOutline,
  IoWalletOutline,
  IoDiamondOutline,
  IoGlobeOutline,
  IoEyeOutline,
  IoBulbOutline,
  IoFlameOutline,
  IoCompassOutline,
  IoRocketOutline,
  IoDiscOutline,
  IoLayersOutline,
  IoFlagOutline,
  IoMedalOutline,
  IoBookOutline,
} from 'react-icons/io5';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';

const BLOG_SECTION_ICON_MAP = {
  'bar-chart': IoBarChartOutline,
  'trending-up': IoTrendingUpOutline,
  'trending-down': IoTrendingDownOutline,
  'stats-chart': IoStatsChartOutline,
  'analytics': IoAnalyticsOutline,
  'shield-check': IoShieldCheckmarkOutline,
  'lock-closed': IoLockClosedOutline,
  'warning': IoWarningOutline,
  'hardware-chip': IoHardwareChipOutline,
  'flash': IoFlashOutline,
  'speedometer': IoSpeedometerOutline,
  'sparkles': IoSparklesOutline,
  'pulse': IoPulseOutline,
  'cash': IoCashOutline,
  'wallet': IoWalletOutline,
  'diamond': IoDiamondOutline,
  'globe': IoGlobeOutline,
  'eye': IoEyeOutline,
  'bulb': IoBulbOutline,
  'flame': IoFlameOutline,
  'compass': IoCompassOutline,
  'rocket': IoRocketOutline,
  'target': IoDiscOutline,
  'layers': IoLayersOutline,
  'flag': IoFlagOutline,
  'medal': IoMedalOutline,
  'book': IoBookOutline,
};

/* Visual icon thumbnail for blog cards */
function BlogThumb({ idx, categoryKey, iconKey, accentColor }) {
  const categoryCombos = {
    strategies: { bg: 'linear-gradient(135deg, #0A1B3D, #06142F)', color: '#0488F8', Icon: FiTrendingUp },
    technical: { bg: 'linear-gradient(135deg, #06142F, #00030D)', color: '#16C784', Icon: FiBarChart2 },
    risk: { bg: 'linear-gradient(135deg, #1A1005, #0A1B3D)', color: '#FB8704', Icon: FiShield },
    algo: { bg: 'linear-gradient(135deg, #06142F, #082A5B)', color: '#38A2FF', Icon: FiCpu },
  };

  const defaultCombos = [
    { bg: 'linear-gradient(135deg, #0A1B3D, #06142F)', color: '#0488F8', Icon: FiTrendingUp },
    { bg: 'linear-gradient(135deg, #06142F, #00030D)', color: '#16C784', Icon: FiBarChart2 },
    { bg: 'linear-gradient(135deg, #1A1005, #0A1B3D)', color: '#FB8704', Icon: FiShield },
    { bg: 'linear-gradient(135deg, #06142F, #082A5B)', color: '#38A2FF', Icon: FiCpu },
  ];

  const matched = (categoryKey && categoryCombos[categoryKey]) || defaultCombos[idx % defaultCombos.length];
  const { bg, color, Icon } = matched;

  const FinalIcon = (iconKey && BLOG_SECTION_ICON_MAP[iconKey]) || Icon;
  const finalColor = accentColor || color;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: accentColor ? `linear-gradient(135deg, ${accentColor}1A 0%, #06142F 70%, #00030D 100%)` : bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', bottom: '-20px', right: '-20px',
        width: '100px', height: '100px', borderRadius: '50%',
        border: `2px solid ${finalColor}30`,
      }} />
      <div style={{
        position: 'absolute', top: '-15px', left: '-15px',
        width: '70px', height: '70px', borderRadius: '50%',
        border: `1px solid ${finalColor}20`,
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        color: finalColor,
        filter: `drop-shadow(0 0 16px ${finalColor}60)`,
        transition: 'transform 0.3s ease',
      }}>
        <FinalIcon size={42} />
      </div>
    </div>
  );
}

function BlogCard({ post, idx, delay }) {
  return (
    <Anim delay={delay} className="card blog-card" as="article" style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-elevated)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <Link href={getAppRoute(`/blog/${post.id || (idx + 1)}`)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ height: '160px', overflow: 'hidden', position: 'relative', background: '#00030D' }}>
          {(post.chartImage || post.coverImage) ? (
            <img
              src={post.chartImage || post.coverImage}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
              }}
              className="blog-card-img"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <BlogThumb idx={idx} categoryKey={post.categoryKey} iconKey={post.iconKey} accentColor={post.accentColor} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, var(--surface-elevated) 0%, transparent 60%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 2 }}>
            <span className="badge badge-blue">
              {post.category}
            </span>
            {post.symbol && (
              <span className="badge" style={{ background: 'rgba(0,0,0,0.7)', color: '#FFF', border: '1px solid var(--border)', fontFamily: 'monospace' }}>
                {post.symbol}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flexGrow: 1 }}>
          <h3 className="blog-title" style={{
            fontSize: '16px',
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.45,
            color: 'var(--text-primary)',
            transition: 'color 0.15s ease',
          }}>
            {post.title}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {post.excerpt}
          </p>

          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{post.author}</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>{post.readTime}</span>
                <span>·</span>
                <span>{post.date}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Anim>
  );
}

export default function BlogSection() {
  const { t, isAr } = useLanguage();
  const { user } = useAuth();
  const [liveArticles, setLiveArticles] = useState([]);

  useEffect(() => {
    async function loadLive() {
      try {
        const res = await fetch('/api/articles?status=PUBLISHED&limit=4', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            setLiveArticles(json.data.slice(0, 4));
          }
        }
      } catch (err) {}
    }
    loadLive();
  }, []);

  const defaultPosts = [
    {
      id: 1,
      category: t.blog.post1Category,
      title: t.blog.post1Title,
      excerpt: t.blog.post1Excerpt,
      date: isAr ? '28 أغسطس 2026' : 'Aug 28, 2026',
      author: isAr ? 'م. سليمان داود' : 'Eng. Sleman Daowed',
      readTime: `7 ${t.analyses.readTime}`,
    },
    {
      id: 2,
      category: t.blog.post2Category,
      title: t.blog.post2Title,
      excerpt: t.blog.post2Excerpt,
      date: isAr ? '27 أغسطس 2026' : 'Aug 27, 2026',
      author: isAr ? 'م. سليمان داود' : 'Eng. Sleman Daowed',
      readTime: `10 ${t.analyses.readTime}`,
    },
    {
      id: 3,
      category: t.blog.post3Category,
      title: t.blog.post3Title,
      excerpt: t.blog.post3Excerpt,
      date: isAr ? '26 أغسطس 2026' : 'Aug 26, 2026',
      author: isAr ? 'م. سليمان داود' : 'Eng. Sleman Daowed',
      readTime: `6 ${t.analyses.readTime}`,
    },
    {
      id: 4,
      category: t.blog.post4Category,
      title: t.blog.post4Title,
      excerpt: t.blog.post4Excerpt,
      date: isAr ? '25 أغسطس 2026' : 'Aug 25, 2026',
      author: isAr ? 'م. سليمان داود' : 'Eng. Sleman Daowed',
      readTime: `8 ${t.analyses.readTime}`,
    },
  ];

  const posts = liveArticles.length > 0
    ? liveArticles.map((p) => ({
        id: p.id,
        category: isAr ? (p.category || 'التحليل الفني') : (p.categoryEn || 'Technical Analysis'),
        title: isAr ? p.titleAr : p.titleEn,
        excerpt: isAr ? p.excerptAr : p.excerptEn,
        date: isAr ? p.dateAr : p.dateEn,
        author: isAr ? p.authorAr : p.authorEn,
        readTime: isAr ? p.readTimeAr : p.readTimeEn,
        chartImage: p.chartImage || p.coverImage,
        symbol: p.symbol,
      }))
    : defaultPosts;

  return (
    <section
      className="section section-surface"
      id="blog"
      style={{
        background: 'var(--surface)',
        position: 'relative',
        boxShadow: '0 24px 60px rgba(0, 3, 13, 0.45), 0 -24px 60px rgba(0, 3, 13, 0.45)',
      }}
    >
      <div className="container">
        <Anim className="section-header">
          <h2 className="section-title">{t.blog.title}</h2>
          <Link href={getAppRoute('/blog', user)} className="btn-ghost" style={{ textDecoration: 'none' }}>
            {t.blog.viewAll}
            <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
          </Link>
        </Anim>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }} className="blog-grid">
          {posts.map((post, i) => (
            <BlogCard key={post.title} post={post} idx={i} delay={i * 60} />
          ))}
        </div>
      </div>

      <style>{`
        .blog-card:hover .blog-title {
          color: var(--primary) !important;
        }
        @media (max-width: 1100px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
