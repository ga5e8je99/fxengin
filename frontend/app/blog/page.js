'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';
import { 
  FiSearch, 
  FiClock, 
  FiCalendar, 
  FiUser, 
  FiArrowLeft, 
  FiArrowRight, 
  FiTrendingUp, 
  FiShield, 
  FiCpu, 
  FiBarChart2, 
  FiBookOpen, 
  FiTag, 
  FiCheck,
  FiPlay 
} from 'react-icons/fi';
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

import { BLOG_POSTS, CATEGORIES } from './blogData';

const BLOG_ICON_MAP = {
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

function getPostIconComponent(post) {
  if (post?.iconKey && BLOG_ICON_MAP[post.iconKey]) {
    return BLOG_ICON_MAP[post.iconKey];
  }
  if (typeof post?.icon === 'function') {
    return post.icon;
  }
  switch (post?.categoryKey) {
    case 'technical':
      return IoBarChartOutline;
    case 'risk':
      return IoShieldCheckmarkOutline;
    case 'algo':
      return IoHardwareChipOutline;
    case 'psychology':
      return IoEyeOutline;
    default:
      return IoTrendingUpOutline;
  }
}

export default function BlogPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailSub, setEmailSub] = useState('');
  const [subSuccess, setSubSuccess] = useState(false);
  const [posts, setPosts] = useState(BLOG_POSTS);

  // Sync with live /api/articles (only published articles)
  useEffect(() => {
    async function loadLiveArticles() {
      try {
        const res = await fetch('/api/articles?status=PUBLISHED', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setPosts(json.data.filter((p) => (p.status || 'PUBLISHED') === 'PUBLISHED'));
          }
        }
      } catch (err) {
        // Silently fallback to static seed
      }
    }
    loadLiveArticles();
  }, []);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if ((post.status || 'PUBLISHED') !== 'PUBLISHED') return false;
      const matchesCategory =
        activeCategory === 'all' || post.categoryKey === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const title = (isAr ? post.titleAr : post.titleEn).toLowerCase();
      const excerpt = (isAr ? post.excerptAr : post.excerptEn).toLowerCase();
      const author = (isAr ? post.authorAr : post.authorEn).toLowerCase();
      const tags = Array.isArray(post.tags) ? post.tags.join(' ').toLowerCase() : '';

      return (
        matchesCategory &&
        (title.includes(q) || excerpt.includes(q) || author.includes(q) || tags.includes(q))
      );
    });
  }, [posts, activeCategory, searchQuery, isAr]);

  const featuredPost = posts.find((p) => p.featured) || (posts.length > 0 ? posts[0] : null);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailSub.includes('@')) return;
    setSubSuccess(true);
    setTimeout(() => {
      setEmailSub('');
      setSubSuccess(false);
    }, 4000);
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ── Page Header / Hero ── */}
      <section
        style={{
          position: 'relative',
          padding: '56px 0 44px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Anim>
            <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
              <div style={{ marginBottom: '14px' }}>
                <span
                  className="badge badge-blue"
                  style={{
                    fontSize: '12.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                  }}
                >
                  <FiBookOpen size={14} />
                  {isAr ? 'المدونة والمعرفة المالية' : 'Educational Blog & Insights'}
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  lineHeight: 1.25,
                  margin: '0 0 16px 0',
                }}
              >
                {isAr ? 'مقالات وأسرار ' : 'Trading Knowledge & '}
                <span className="text-gradient-brand">
                  {isAr ? 'احتراف التداول اليومي' : 'Market Mastery'}
                </span>
              </h1>

              <p
                style={{
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.75,
                  margin: '0 auto 32px',
                  maxWidth: '640px',
                }}
              >
                {isAr
                  ? 'مقالات حصرية وإرشادات عملية من كبار خبراء التداول لمساعدتك على صقل مهاراتك واتخاذ قرارات مدروسة.'
                  : 'Actionable articles, institutional blueprints, and psychological strategies from certified market veterans.'}
              </p>

              {/* Search Bar Input */}
              <div
                style={{
                  maxWidth: '560px',
                  margin: '0 auto',
                  position: 'relative',
                }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isAr
                      ? 'ابحث بالكلمة المفتاحية، الاستراتيجية، أو اسم الكاتب...'
                      : 'Search by keyword, strategy, topic, or author...'
                  }
                  style={{
                    width: '100%',
                    height: '52px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: isAr ? '0 52px 0 20px' : '0 20px 0 52px',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    outline: 'none',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.5)',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <FiSearch
                  size={20}
                  color="var(--primary)"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    [isAr ? 'right' : 'left']: '18px',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── Category Filter Pills Bar ── */}
      <section
        style={{
          background: 'var(--surface)',
          padding: '16px 0',
          position: 'sticky',
          top: 'var(--top-bars-height, 9.5rem)',
          zIndex: 40,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '30px',
                    fontSize: '13px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    background: isActive ? 'var(--primary-gradient)' : 'rgba(6, 20, 47, 0.7)',
                    border: `1px solid ${isActive ? 'transparent' : 'var(--border)'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(4, 136, 248, 0.35)' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  {isAr ? cat.labelAr : cat.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Articles Content Grid ── */}
      <div className="container" style={{ marginTop: '48px' }}>
        {/* Featured Hero Article (Shows if no search active and an article exists) */}
        {!searchQuery && activeCategory === 'all' && featuredPost && (
          <Anim style={{ marginBottom: '48px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0A1B3D 0%, #06142F 60%, #01071E 100%)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: 'clamp(24px, 4vw, 40px)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 16px 48px rgba(0, 3, 13, 0.6)',
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: '36px',
                alignItems: 'center',
              }}
              className="featured-article-grid"
            >
              {/* Decorative Brand Glow */}
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: '-30px',
                  [isAr ? 'left' : 'right']: '-30px',
                  width: '320px',
                  height: '320px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(4, 136, 248, 0.15) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Text info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <span
                    style={{
                      background: 'rgba(251, 135, 4, 0.15)',
                      border: '1px solid var(--accent)',
                      color: 'var(--accent)',
                      fontSize: '11.5px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px',
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    ★ {isAr ? 'مقال الأسبوع المميز' : 'FEATURED STORY'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isAr ? featuredPost.category : featuredPost.categoryEn}
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(22px, 2.5vw, 32px)',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    margin: '0 0 14px 0',
                  }}
                >
                  {isAr ? featuredPost.titleAr : featuredPost.titleEn}
                </h2>

                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                    margin: '0 0 24px 0',
                  }}
                >
                  {isAr ? featuredPost.excerptAr : featuredPost.excerptEn}
                </p>

                {/* Author & Meta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontWeight: 700,
                        fontSize: '14px',
                      }}
                    >
                      {isAr ? (featuredPost.authorAr || 'مهندس الفوركس').slice(0, 2) : (featuredPost.authorEn || 'FE').slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isAr ? featuredPost.authorAr : featuredPost.authorEn}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {isAr ? featuredPost.authorRoleAr : featuredPost.authorRoleEn}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiCalendar size={13} /> {isAr ? featuredPost.dateAr : featuredPost.dateEn}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiClock size={13} /> {isAr ? featuredPost.readTimeAr : featuredPost.readTimeEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graphic Banner Side */}
              <div
                style={{
                  background: 'rgba(1, 7, 30, 0.75)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {(featuredPost.coverImage || featuredPost.chartImage) ? (
                  <div style={{ position: 'relative', width: '100%', height: '170px', overflow: 'hidden' }}>
                    <img
                      src={featuredPost.coverImage || featuredPost.chartImage}
                      alt={isAr ? featuredPost.titleAr : featuredPost.titleEn}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(1, 7, 30, 0.95) 0%, transparent 60%)',
                    }} />
                    {featuredPost.symbol && (
                      <span style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.85)',
                        color: '#FFF',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                      }}>
                        {featuredPost.symbol}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '24px' }}>
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '20px',
                        background: 'rgba(4, 136, 248, 0.15)',
                        border: '1px solid rgba(4, 136, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                      }}
                    >
                      <FiTrendingUp size={36} />
                    </div>
                  </div>
                )}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isAr ? (featuredPost.titleAr || 'خطة تداول 2026 الاحترافية') : (featuredPost.titleEn || '2026 Pro Execution Playbook')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {isAr
                      ? (featuredPost.excerptAr || 'اكتشف نماذج إدارة الصفقات، مؤشرات الدخول، وقواعد الانضباط المالي.')
                      : (featuredPost.excerptEn || 'Discover entry models, scaling techniques, and institutional rules.')}
                  </div>
                  <Link
                    href={getAppRoute(`/blog/${featuredPost.slug || featuredPost.id}`, user)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      height: '42px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      gap: '6px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span>{isAr ? 'قراءة المقال بالكامل' : 'Read Full Article'}</span>
                    {isAr ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
                  </Link>
                </div>
              </div>
            </div>
          </Anim>
        )}

        {/* Section Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {searchQuery
              ? isAr
                ? `نتائج البحث عن: "${searchQuery}" (${filteredPosts.length})`
                : `Search Results for: "${searchQuery}" (${filteredPosts.length})`
              : isAr
              ? 'أحدث المقالات المنشورة'
              : 'Latest Published Articles'}
          </h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isAr ? `إجمالي: ${filteredPosts.length} مقال` : `Total: ${filteredPosts.length} posts`}
          </span>
        </div>

        {/* ── Articles Grid ── */}
        {filteredPosts.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {filteredPosts.map((post, idx) => {
              const IconComp = getPostIconComponent(post);
              return (
                <Anim key={post.id} delay={idx * 60}>
                  <article
                    className="card blog-card-item"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                      transition: 'all 0.25s ease',
                      boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = post.accentColor || 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 3, 13, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 3, 13, 0.4)';
                    }}
                  >
                    <div>
                        {/* Visual Thumbnail */}
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '155px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            marginBottom: '16px',
                            background: `linear-gradient(135deg, ${post.accentColor || '#0488F8'}1F 0%, #06142F 60%, #00030D 100%)`,
                            border: `1px solid ${post.accentColor || '#0488F8'}33`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {(post.coverImage || post.chartImage) ? (
                            <>
                              <img
                                src={post.coverImage || post.chartImage}
                                alt={isAr ? post.titleAr : post.titleEn}
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
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'linear-gradient(to top, rgba(6, 20, 47, 0.85) 0%, transparent 60%)',
                                  pointerEvents: 'none',
                                }}
                              />
                              {post.videoUrl && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '10px',
                                    [isAr ? 'left' : 'right']: '10px',
                                    background: 'rgba(4, 136, 248, 0.92)',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    color: '#FFF',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    boxShadow: '0 4px 12px rgba(4, 136, 248, 0.45)',
                                    zIndex: 2,
                                  }}
                                >
                                  <FiPlay size={11} fill="#FFF" />
                                  <span>{isAr ? 'فيديو' : 'Video'}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '-25px',
                                  right: '-25px',
                                  width: '110px',
                                  height: '110px',
                                  borderRadius: '50%',
                                  border: `2px solid ${post.accentColor || '#0488F8'}25`,
                                  pointerEvents: 'none',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '-20px',
                                  left: '-20px',
                                  width: '80px',
                                  height: '80px',
                                  borderRadius: '50%',
                                  border: `1px solid ${post.accentColor || '#0488F8'}15`,
                                  pointerEvents: 'none',
                                }}
                              />

                              <div
                                style={{
                                  position: 'relative',
                                  zIndex: 1,
                                  color: post.accentColor || 'var(--primary)',
                                  filter: `drop-shadow(0 0 16px ${post.accentColor || '#0488F8'}60)`,
                                }}
                              >
                                <IconComp size={44} />
                              </div>
                            </>
                          )}

                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: post.accentColor || 'var(--primary)',
                              background: 'rgba(0, 3, 13, 0.75)',
                              border: `1px solid ${post.accentColor || 'var(--border)'}50`,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backdropFilter: 'blur(8px)',
                            }}
                          >
                            {isAr ? post.category : post.categoryEn}
                          </span>
                          {post.symbol && (
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                fontFamily: 'monospace',
                                color: '#FFFFFF',
                                background: 'rgba(0, 3, 13, 0.85)',
                                border: '1px solid var(--border)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {post.symbol}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h4
                        style={{
                          fontSize: '16.5px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          lineHeight: 1.4,
                          margin: '0 0 10px 0',
                        }}
                      >
                        <Link
                          href={getAppRoute(`/blog/${post.id}`, user)}
                          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = post.accentColor || 'var(--primary)')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'inherit')}
                        >
                          {isAr ? post.titleAr : post.titleEn}
                        </Link>
                      </h4>

                      {/* Excerpt */}
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.65,
                          margin: '0 0 18px 0',
                        }}
                      >
                        {isAr ? post.excerptAr : post.excerptEn}
                      </p>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px' }}>
                        {post.tags.map((tg) => (
                          <span
                            key={tg}
                            style={{
                              fontSize: '10.5px',
                              color: 'var(--text-muted)',
                              background: 'rgba(255, 255, 255, 0.03)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontFamily: 'monospace',
                            }}
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Author & Read CTA */}
                    <div
                      style={{
                        borderTop: '1px solid rgba(18, 49, 92, 0.4)',
                        paddingTop: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'rgba(4, 136, 248, 0.2)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                          }}
                        >
                          <FiUser size={14} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {isAr ? post.authorAr : post.authorEn}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          <FiClock size={12} />
                          <span>{isAr ? post.readTimeAr : post.readTimeEn}</span>
                        </div>
                        <Link
                          href={getAppRoute(`/blog/${post.id}`, user)}
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 700,
                            color: post.accentColor || 'var(--primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{isAr ? 'اقرأ المزيد' : 'Read'}</span>
                          {isAr ? <FiArrowLeft size={12} /> : <FiArrowRight size={12} />}
                        </Link>
                      </div>
                    </div>
                  </article>
                </Anim>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
            }}
          >
            <FiBookOpen size={40} color="var(--text-muted)" style={{ marginBottom: '14px' }} />
            <h4 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              {isAr ? 'لم يتم العثور على مقالات مطابقة' : 'No matching articles found'}
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
              {isAr ? 'جرب تغيير كلمة البحث أو اختيار تصنيف آخر.' : 'Try changing your search query or selecting a different category.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="btn-secondary"
              style={{ fontSize: '13px', height: '36px' }}
            >
              {isAr ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </button>
          </div>
        )}

        {/* ── Newsletter In-Blog Subscription Box ── */}
        <Anim style={{ marginTop: '64px' }}>
          <div
            style={{
              background: 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(4, 136, 248, 0.12) 0%, transparent 70%), var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: 'clamp(28px, 4vw, 48px)',
              textAlign: 'center',
              boxShadow: '0 16px 48px rgba(0, 3, 13, 0.6)',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            <span className="badge badge-orange" style={{ marginBottom: '14px', fontSize: '12px' }}>
              ● {isAr ? 'النشرة البريدية الحصرية' : 'Exclusive Weekly Digest'}
            </span>
            <h3 style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              {isAr ? 'احصل على مقالات وتحليلات الأسبوع في بريدك' : 'Get Top Strategies & Weekly Analysis in Your Inbox'}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 24px 0' }}>
              {isAr
                ? 'انضم لأكثر من 50,000 متداول يستلمون أهم فرص السوق ودراسات الحالة مباشرة.'
                : 'Join 50,000+ traders receiving distilled trade ideas, setups, and post-market reviews.'}
            </p>

            {subSuccess ? (
              <div
                style={{
                  background: 'rgba(22, 199, 132, 0.15)',
                  border: '1px solid var(--success)',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  color: 'var(--success)',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiCheck size={18} />
                <span>{isAr ? 'تم الاشتراك بنجاح! شكراً لانضمامك.' : 'Subscribed successfully! Thank you.'}</span>
              </div>
            ) : (
              <form
                onSubmit={handleSubscribe}
                style={{
                  display: 'flex',
                  gap: '10px',
                  maxWidth: '480px',
                  margin: '0 auto',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="email"
                  required
                  value={emailSub}
                  onChange={(e) => setEmailSub(e.target.value)}
                  placeholder={isAr ? 'أدخل بريدك الإلكتروني...' : 'Enter your email address...'}
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    height: '46px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '0 16px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    height: '46px',
                    padding: '0 22px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                  }}
                >
                  {isAr ? 'اشتراك مجاني' : 'Subscribe Free'}
                </button>
              </form>
            )}
          </div>
        </Anim>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .featured-article-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
