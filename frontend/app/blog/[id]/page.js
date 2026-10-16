'use client';
import { useState, use, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Anim from '../../components/Anim';
import PageHeroBackground from '../../components/PageHeroBackground';
import {
  FiClock,
  FiCalendar,
  FiUser,
  FiArrowRight,
  FiArrowLeft,
  FiShare2,
  FiCheck,
  FiBookmark,
  FiHeart,
  FiTag,
  FiBookOpen,
  FiTrendingUp,
  FiShield,
  FiHelpCircle,
  FiChevronDown,
  FiChevronUp,
  FiExternalLink,
  FiSend,
  FiList,
  FiPlay,
  FiVideo,
  FiLink,
  FiDownload,
  FiPaperclip,
  FiAlertCircle,
  FiBarChart2,
  FiInfo,
} from 'react-icons/fi';
import { BLOG_POSTS, getBlogPostById, getRelatedPosts } from '../blogData';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getAppRoute } from '../../utils/routes';

function getYoutubeEmbedUrl(url) {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : url;
}

function getVimeoEmbedUrl(url) {
  if (!url) return '';
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : url;
}

export default function ArticleDetailPage({ params }) {
  const unwrappedParams = use(params);
  const articleId = unwrappedParams?.articleId || unwrappedParams?.id;
  const { isAr } = useLanguage();
  const { user } = useAuth();

  const [allPosts, setAllPosts] = useState(BLOG_POSTS);
  const [livePost, setLivePost] = useState(null);

  useEffect(() => {
    async function loadLiveArticle() {
      try {
        const res = await fetch('/api/articles', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setAllPosts(json.data);
            const found = json.data.find(
              (p) => String(p.id) === String(articleId) || p.slug === String(articleId)
            );
            setLivePost(found || null);
          }
        }
      } catch (err) {
        // Silently fallback to static seed
      }
    }
    loadLiveArticle();
  }, [articleId]);

  const post = useMemo(() => {
    if (livePost) return livePost;
    return getBlogPostById(articleId) || null;
  }, [livePost, articleId]);

  const relatedPosts = useMemo(() => {
    return allPosts
      .filter((p) => String(p.id) !== String(post.id) && (p.categoryKey === post.categoryKey || !post.categoryKey))
      .slice(0, 3);
  }, [allPosts, post]);

  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(148);
  const [bookmarked, setBookmarked] = useState(false);
  const [fontSize, setFontSize] = useState(16); // px font size for article body
  const [openFaq, setOpenFaq] = useState(0);

  if (!post) {
    return (
      <div style={{ background: 'var(--bg-primary)', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <FiBookOpen size={48} color="var(--accent)" style={{ marginBottom: '16px', opacity: 0.8 }} />
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {isAr ? 'عذراً، المقال المطلوب غير موجود أو تم حذفه' : 'Article Not Found or Has Been Removed'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '480px' }}>
          {isAr ? 'ربما تم نقل هذا المقال أو حذفه بواسطة إدارة المنصة.' : 'This article might have been moved or removed by the editorial team.'}
        </p>
        <Link href={getAppRoute('/blog', user)} className="btn-primary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
          {isAr ? 'العودة إلى المدونة' : 'Back to Blog'}
        </Link>
      </div>
    );
  }

  // Previous & Next posts
  const currentIndex = allPosts.findIndex((p) => String(p.id) === String(post.id) || p.slug === post.slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleLike = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    } else {
      setLiked(false);
      setLikeCount((prev) => prev - 1);
    }
  };

  const scrollToSection = (sectionId) => {
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '90px' }}>
      {/* ── 1. Hero Header & Breadcrumbs ── */}
      <section
        style={{
          position: 'relative',
          padding: '48px 0 52px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Anim>
            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginBottom: '22px',
                flexWrap: 'wrap',
              }}
            >
              <Link href={getAppRoute('/', user)} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {isAr ? 'الرئيسية' : 'Home'}
              </Link>
              <span>/</span>
              <Link href={getAppRoute('/blog', user)} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {isAr ? 'المدونة' : 'Blog'}
              </Link>
              <span>/</span>
              <span style={{ color: post.accentColor || 'var(--primary)', fontWeight: 600 }}>
                {isAr ? post.category : post.categoryEn}
              </span>
            </nav>

            {/* Category Badge & Live Specs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: post.accentColor || 'var(--primary)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${post.accentColor || 'var(--primary)'}50`,
                  padding: '4px 12px',
                  borderRadius: '6px',
                  letterSpacing: '0.4px',
                }}
              >
                {isAr ? post.category : post.categoryEn}
              </span>

              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(1, 7, 30, 0.6)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <FiClock size={13} color="var(--accent)" />
                <span>{isAr ? post.readTimeAr : post.readTimeEn}</span>
              </span>

              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'rgba(1, 7, 30, 0.6)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                }}
              >
                <FiCalendar size={13} />
                <span>{isAr ? post.dateAr : post.dateEn}</span>
              </span>

              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginInlineStart: 'auto',
                }}
              >
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>● {post.views}</span> {isAr ? 'مشاهدة' : 'Views'}
              </span>
            </div>

            {post.status === 'DRAFT' && (
              <div
                style={{
                  background: 'rgba(251, 191, 36, 0.12)',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                  color: '#FBBF24',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <FiAlertCircle size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <span>
                  {isAr
                    ? 'وضع المعاينة: هذا المقال محفوظ كمسودة (DRAFT) قيد المراجعة والتعديل، ولم يتم نشره للزوار بعد.'
                    : 'Preview Mode: This article is currently a DRAFT under review and not publicly published.'}
                </span>
              </div>
            )}

            {/* Article Main Title */}
            <h1
              style={{
                fontSize: 'clamp(26px, 3.6vw, 42px)',
                fontWeight: 900,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                margin: '0 0 20px 0',
                maxWidth: '960px',
              }}
            >
              {isAr ? post.titleAr : post.titleEn}
            </h1>

            {/* Excerpt Lead Paragraph */}
            <p
              style={{
                fontSize: 'clamp(15px, 1.3vw, 18px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: '900px',
                margin: '0 0 28px 0',
              }}
            >
              {isAr ? post.excerptAr : post.excerptEn}
            </p>

            {/* Author Profile & Quick Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(18, 49, 92, 0.6)',
              }}
            >
              {/* Author Details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '16px',
                    boxShadow: '0 4px 14px rgba(4, 136, 248, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  {isAr ? (post.authorAr || 'م. سليمان داود').slice(0, 2) : (post.authorEn || 'Eng. Sleman Daowed').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isAr ? (post.authorAr || 'م. سليمان داود') : (post.authorEn || 'Eng. Sleman Daowed')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {isAr ? (post.authorRoleAr || 'كبير محللي الأسواق') : (post.authorRoleEn || 'Chief Market Strategist')}
                  </div>
                </div>
              </div>

              {/* Interactive Toolbar (Share, Like, Bookmark, Font Sizer) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Font Size Adjuster */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(6, 20, 47, 0.7)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '2px 6px',
                    gap: '6px',
                  }}
                  title={isAr ? 'تغيير حجم خط المقال' : 'Adjust font size'}
                >
                  <button
                    type="button"
                    onClick={() => setFontSize((f) => Math.max(14, f - 1))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '4px 6px',
                    }}
                  >
                    A-
                  </button>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {fontSize}px
                  </span>
                  <button
                    type="button"
                    onClick={() => setFontSize((f) => Math.min(22, f + 1))}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 700,
                      padding: '4px 6px',
                    }}
                  >
                    A+
                  </button>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={handleLike}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: liked ? 'rgba(246, 70, 93, 0.18)' : 'rgba(6, 20, 47, 0.7)',
                    border: `1px solid ${liked ? 'var(--error)' : 'var(--border)'}`,
                    color: liked ? 'var(--error)' : 'var(--text-secondary)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiHeart size={15} fill={liked ? 'var(--error)' : 'none'} />
                  <span>{likeCount}</span>
                </button>

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={() => setBookmarked(!bookmarked)}
                  title={isAr ? 'حفظ في المفضلة' : 'Bookmark'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: bookmarked ? 'rgba(251, 135, 4, 0.18)' : 'rgba(6, 20, 47, 0.7)',
                    border: `1px solid ${bookmarked ? 'var(--accent)' : 'var(--border)'}`,
                    color: bookmarked ? 'var(--accent)' : 'var(--text-secondary)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiBookmark size={15} fill={bookmarked ? 'var(--accent)' : 'none'} />
                </button>

                {/* Share Button with Toast Copy */}
                <button
                  type="button"
                  onClick={handleShare}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: copied ? 'rgba(22, 199, 132, 0.18)' : 'var(--primary-gradient)',
                    border: `1px solid ${copied ? 'var(--success)' : 'transparent'}`,
                    color: copied ? 'var(--success)' : '#FFF',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(4, 136, 248, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {copied ? <FiCheck size={15} /> : <FiShare2 size={15} />}
                  <span>{copied ? (isAr ? 'تم نسخ الرابط!' : 'Link Copied!') : (isAr ? 'مشاركة' : 'Share')}</span>
                </button>
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── 2. Main Article Body & Sticky Sidebar (2-Column Grid) ── */}
      <div className="container" style={{ marginTop: '48px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 0.9fr)',
            gap: '40px',
            alignItems: 'start',
          }}
          className="article-main-grid"
        >
          {/* ── Column A: Main Article Editorial Content ── */}
          <main style={{ minWidth: 0 }}>
            {/* ── 1. Article Video Breakdown Player (اختياري / Optional - يُعرض في بداية تفاصيل المقال) ── */}
            {post.videoUrl && (
              <Anim style={{ marginBottom: '36px' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid rgba(4, 136, 248, 0.4)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 16px 40px rgba(0, 3, 13, 0.6), 0 0 30px rgba(4, 136, 248, 0.1)',
                  }}
                >
                  <div
                    style={{
                      padding: '16px 22px',
                      background: 'linear-gradient(90deg, rgba(4, 136, 248, 0.15) 0%, rgba(6, 20, 47, 0.6) 100%)',
                      borderBottom: '1px solid rgba(4, 136, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          background: 'rgba(4, 136, 248, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          boxShadow: '0 0 12px rgba(4, 136, 248, 0.4)',
                        }}
                      >
                        <FiPlay size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {isAr ? 'فيديو الشرح والتحليل المرئي للمقال' : 'Featured Video Breakdown & Analysis'}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {isAr ? 'شرح تطبيقي وتحليل فني بالفيديو المباشر لهذه الاستراتيجية' : 'Live video breakdown of this market strategy and setups'}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: 'rgba(22, 199, 132, 0.18)',
                        color: '#16C784',
                        border: '1px solid rgba(22, 199, 132, 0.35)',
                        letterSpacing: '0.4px',
                      }}
                    >
                      {isAr ? '▶ فيديو التحليل (Full HD)' : '▶ Video Breakdown (Full HD)'}
                    </span>
                  </div>

                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: '#000' }}>
                    {post.videoUrl.includes('youtube.com') || post.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={getYoutubeEmbedUrl(post.videoUrl)}
                        title={isAr ? post.titleAr : post.titleEn}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : post.videoUrl.includes('vimeo.com') ? (
                      <iframe
                        src={getVimeoEmbedUrl(post.videoUrl)}
                        title={isAr ? post.titleAr : post.titleEn}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={post.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                </div>
              </Anim>
            )}

            {/* Featured Hero / Chart Image Banner */}
            {(post.coverImage || post.chartImage) && (
              <Anim style={{ marginBottom: '36px' }}>
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    boxShadow: '0 16px 40px rgba(0, 3, 13, 0.6)',
                    background: '#06142F',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', maxHeight: '480px', overflow: 'hidden', background: '#020B1C' }}>
                    <img
                      src={post.coverImage || post.chartImage}
                      alt={isAr ? post.titleAr : post.titleEn}
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: '480px',
                        objectFit: 'contain',
                        display: 'block',
                        margin: '0 auto',
                      }}
                      onError={(e) => {
                        e.currentTarget.parentElement.parentElement.style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50px',
                        background: 'linear-gradient(to top, rgba(2, 11, 28, 0.8) 0%, transparent 100%)',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                  {/* Image Footer Caption / Info */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      padding: '14px 20px',
                      background: 'rgba(6, 20, 47, 0.95)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(4, 136, 248, 0.15)',
                          border: '1px solid rgba(4, 136, 248, 0.35)',
                          color: 'var(--primary)',
                        }}
                      >
                        {post.symbol ? `${post.symbol} • Chart Intel` : (isAr ? 'شارت التحليل' : 'Market Chart')}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {isAr
                          ? 'الرسم البياني الفني المرفق مع التحليل'
                          : 'Official technical chart attached to this analysis'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <a
                        href={post.coverImage || post.chartImage}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <FiExternalLink size={13} />
                        <span>{isAr ? 'عرض بالحجم الكامل' : 'Open Full Image'}</span>
                      </a>
                      {post.tradingViewUrl && (
                        <a
                          href={post.tradingViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#2962FF',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FiTrendingUp size={13} />
                          <span>TradingView</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Anim>
            )}

            {/* Mobile-Only Editorial Notice / Advisory Card */}
            {(post.noticeAr || post.disclaimerAr) && (
              <div className="mobile-advisory-wrapper" style={{ display: 'none', marginBottom: '28px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 26, 56, 0.72) 0%, rgba(4, 18, 42, 0.9) 100%)',
                    border: '1px solid rgba(4, 136, 248, 0.28)',
                    borderInlineStart: '4px solid #0488F8',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    boxShadow: '0 8px 30px rgba(0, 3, 13, 0.45)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(4, 136, 248, 0.15)',
                      border: '1px solid rgba(4, 136, 248, 0.35)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <FiShield size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '5px',
                          background: 'rgba(4, 136, 248, 0.15)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(4, 136, 248, 0.3)',
                        }}
                      >
                        {isAr ? 'تنويه وتوجيه فني' : 'Technical Advisory'}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13.5px',
                        lineHeight: 1.7,
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      {isAr ? (post.noticeAr || post.disclaimerAr) : (post.noticeEn || post.disclaimerEn || post.noticeAr)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Takeaways Highlight Box */}
            {post.keyTakeawaysAr && post.keyTakeawaysAr.length > 0 && (
              <Anim style={{ marginBottom: '36px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.85) 0%, rgba(1, 7, 30, 0.95) 100%)',
                    border: '1px solid rgba(4, 136, 248, 0.35)',
                    borderRadius: '14px',
                    padding: '24px 28px',
                    boxShadow: '0 8px 30px rgba(0, 3, 13, 0.5), 0 0 20px rgba(4, 136, 248, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FiTrendingUp size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {isAr ? 'أهم ركائز ونقاط المقال الرئيسية (Key Takeaways)' : 'Executive Summary & Key Takeaways'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(isAr ? post.keyTakeawaysAr : post.keyTakeawaysEn).map((point, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'rgba(22, 199, 132, 0.15)',
                            border: '1px solid rgba(22, 199, 132, 0.35)',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          ✓
                        </span>
                        <span style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Anim>
            )}

            {/* Market Symbol & Strategy Intel Card (Zero images, pure vector icon styling) */}
            {post.symbol && (
              <Anim style={{ marginBottom: '40px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #0A1B3D 0%, #06142F 60%, #01071E 100%)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 12px 32px rgba(0, 3, 13, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',
                        background: 'rgba(4, 136, 248, 0.15)',
                        border: '1px solid rgba(4, 136, 248, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: post.accentColor || 'var(--primary)',
                        filter: 'drop-shadow(0 0 14px rgba(4, 136, 248, 0.45))',
                        flexShrink: 0,
                      }}
                    >
                      <FiTrendingUp size={28} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            padding: '3px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {post.symbol}
                        </span>
                        <span
                          style={{
                            background: '#2962FF',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '6px',
                          }}
                        >
                          TradingView Intel
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {isAr
                          ? 'تحليل هيكل حركة السعر وتدفق السيولة الفنية المعتمدة'
                          : 'Market structure & institutional order flow analysis'}
                      </div>
                    </div>
                  </div>

                  {post.tradingViewUrl && (
                    <a
                      href={post.tradingViewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{
                        padding: '10px 18px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                      }}
                    >
                      <span>{isAr ? 'عرض المصدر الأصلي على TradingView' : 'View on TradingView'}</span>
                      <FiExternalLink size={14} />
                    </a>
                  )}
                </div>
              </Anim>
            )}

            {/* Article Sections Loop */}
            <div
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.85,
                color: 'var(--text-primary)',
              }}
              className="article-content-body"
            >
              {post.sections && post.sections.map((section, sIdx) => (
                <Anim key={section.id || sIdx} delay={sIdx * 40} style={{ marginBottom: '40px' }}>
                  <section id={section.id || `section-${sIdx}`} style={{ scrollMarginTop: 'calc(var(--top-bars-height, 9.5rem) + 1.5rem)' }}>
                    {/* Section Heading */}
                    <h2
                      style={{
                        fontSize: 'clamp(20px, 2.2vw, 26px)',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        marginBottom: '16px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(18, 49, 92, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span>{isAr ? section.headingAr : section.headingEn}</span>
                    </h2>

                    {/* Section Body Text */}
                    <div
                      style={{
                        whiteSpace: 'pre-line',
                        color: 'var(--text-secondary)',
                        marginBottom: (section.tipAr || section.image) ? '20px' : '0',
                      }}
                    >
                      {isAr ? section.bodyAr : section.bodyEn}
                    </div>

                    {/* Section Image / Chart if present */}
                    {section.image && (
                      <div
                        style={{
                          margin: '20px 0',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                          background: '#020B1C',
                          boxShadow: '0 12px 32px rgba(0, 3, 13, 0.5)',
                        }}
                      >
                        <img
                          src={section.image}
                          alt={isAr ? (section.headingAr || 'شارت التحليل') : (section.headingEn || 'Chart Analysis')}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '480px',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto',
                          }}
                        />
                        {section.imageCaptionAr && (
                          <div
                            style={{
                              padding: '12px 18px',
                              background: 'rgba(6, 20, 47, 0.95)',
                              borderTop: '1px solid var(--border)',
                              fontSize: '12.5px',
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <FiBarChart2 size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <span>{isAr ? section.imageCaptionAr : (section.imageCaptionEn || section.imageCaptionAr)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pro Expert Tip Box */}
                    {section.tipAr && (
                      <div
                        style={{
                          marginTop: '20px',
                          background: 'rgba(251, 135, 4, 0.08)',
                          border: '1px solid rgba(251, 135, 4, 0.3)',
                          borderInlineStart: '4px solid var(--accent)',
                          borderRadius: '8px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}
                      >
                        <FiInfo size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>
                            {isAr ? 'نصيحة الخبير الذهبية:' : 'Pro Execution Tip:'}
                          </span>
                          <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            {isAr ? section.tipAr : section.tipEn}
                          </span>
                        </div>
                      </div>
                    )}
                  </section>
                </Anim>
              ))}
            </div>

            {/* ── Article Resources & Official Links (أساسي / Essential) ── */}
            {post.links && post.links.length > 0 && (
              <Anim style={{ marginTop: '36px', marginBottom: '40px' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                        }}
                      >
                        <FiLink size={16} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                          {isAr ? 'روابط ومصادر المقال الرسمية' : 'Article Resources & Official Links'}
                        </h3>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {isAr ? 'روابط التحميل، القنوات، والمراجع المعتمدة المذكورة في المقال' : 'Downloads, tools, and verified links mentioned in this analysis'}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: 'rgba(4, 136, 248, 0.12)',
                        color: 'var(--primary)',
                        border: '1px solid rgba(4, 136, 248, 0.25)',
                      }}
                    >
                      {post.links.length} {isAr ? 'روابط معتمدة' : 'Verified Links'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                    {post.links.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          background: 'rgba(6, 20, 47, 0.6)',
                          border: '1px solid rgba(18, 49, 92, 0.7)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                        }}
                        className="hover:border-[#0488F8] hover:bg-[#06142F] group"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: link.type === 'telegram' ? 'rgba(0, 136, 204, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: link.type === 'telegram' ? '#0088cc' : 'var(--primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {link.type === 'telegram' ? <FiSend size={18} /> : link.type === 'download' ? <FiDownload size={18} /> : <FiLink size={18} />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {isAr ? (link.titleAr || link.titleEn || link.url) : (link.titleEn || link.titleAr || link.url)}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} dir="ltr">
                              {link.url}
                            </span>
                          </div>
                        </div>

                        <div style={{ color: 'var(--primary)', flexShrink: 0 }}>
                          <FiExternalLink size={16} />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </Anim>
            )}

            {/* Interactive FAQs Section */}
            {post.faqs && post.faqs.length > 0 && (
              <Anim style={{ marginTop: '48px', marginBottom: '40px' }}>
                <div
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '14px',
                    padding: '28px',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <FiHelpCircle size={22} color="var(--primary)" />
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      {isAr ? 'الأسئلة الشائعة حول موضوع المقال' : 'Frequently Asked Questions'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {post.faqs.map((faq, fIdx) => {
                      const isOpen = openFaq === fIdx;
                      return (
                        <div
                          key={fIdx}
                          style={{
                            border: '1px solid rgba(18, 49, 92, 0.6)',
                            borderRadius: '10px',
                            background: isOpen ? 'rgba(6, 20, 47, 0.9)' : 'rgba(1, 7, 30, 0.5)',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaq(isOpen ? null : fIdx)}
                            style={{
                              width: '100%',
                              padding: '16px 20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '14.5px',
                              fontWeight: 700,
                              textAlign: isAr ? 'right' : 'left',
                              cursor: 'pointer',
                              gap: '12px',
                            }}
                          >
                            <span>{isAr ? faq.qAr : faq.qEn}</span>
                            {isOpen ? <FiChevronUp size={18} color="var(--primary)" /> : <FiChevronDown size={18} />}
                          </button>

                          {isOpen && (
                            <div
                              style={{
                                padding: '0 20px 16px',
                                fontSize: '13.5px',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.7,
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                paddingTop: '12px',
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
              </Anim>
            )}

            {/* Tags Cloud */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '32px 0' }}>
              <FiTag size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {isAr ? 'الكلمات المفتاحية:' : 'Tags:'}
              </span>
              {post.tags.map((tg) => (
                <span
                  key={tg}
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    background: 'rgba(6, 20, 47, 0.7)',
                    border: '1px solid var(--border)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                  }}
                >
                  #{tg}
                </span>
              ))}
            </div>

            {/* Author Profile Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.75) 0%, rgba(1, 7, 30, 0.9) 100%)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '24px',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  fontWeight: 800,
                  fontSize: '22px',
                  flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(4, 136, 248, 0.4)',
                }}
              >
                {isAr ? (post.authorAr || 'م. سليمان داود').slice(0, 2) : (post.authorEn || 'Eng. Sleman Daowed').slice(0, 2)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {isAr ? (post.authorAr || 'م. سليمان داود') : (post.authorEn || 'Eng. Sleman Daowed')}
                  </h4>
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--primary)',
                      background: 'rgba(4, 136, 248, 0.12)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {isAr ? (post.authorRoleAr || 'كبير محللي الأسواق') : (post.authorRoleEn || 'Chief Market Strategist')}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {isAr ? (post.authorBioAr || 'خبير أسواق مالية ومحلل فني معتمد لدى منصة FXENGIN.') : (post.authorBioEn || 'Certified market strategist and technical analyst at FXENGIN.')}
                </p>
              </div>
            </div>

            {/* Previous & Next Post Navigation */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                paddingTop: '24px',
                borderTop: '1px solid rgba(18, 49, 92, 0.6)',
              }}
            >
              {prevPost && (
                <Link
                  href={getAppRoute(`/blog/${prevPost.id}`, user)}
                  style={{
                    padding: '16px 20px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {isAr ? <FiArrowRight size={13} /> : <FiArrowLeft size={13} />}
                    <span>{isAr ? 'المقال السابق' : 'Previous Article'}</span>
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {isAr ? prevPost.titleAr : prevPost.titleEn}
                  </span>
                </Link>
              )}

              {nextPost && (
                <Link
                  href={getAppRoute(`/blog/${nextPost.id}`, user)}
                  style={{
                    padding: '16px 20px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginInlineStart: !prevPost ? 'auto' : 0,
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                    <span>{isAr ? 'المقال التالي' : 'Next Article'}</span>
                    {isAr ? <FiArrowLeft size={13} /> : <FiArrowRight size={13} />}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, textAlign: 'end' }}>
                    {isAr ? nextPost.titleAr : nextPost.titleEn}
                  </span>
                </Link>
              )}
            </div>
          </main>

          {/* ── Column B: Interactive Sticky Sidebar ── */}
          <aside
            style={{
              position: 'sticky',
              top: 'calc(var(--top-bars-height, 9.5rem) + 1.25rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* ── Side Advisory Card (تنبيه وإرشاد فني دايماً على جنب في الأول) ── */}
            {(post.noticeAr || post.disclaimerAr) && (
              <div
                className="desktop-side-advisory"
                style={{
                  background: 'linear-gradient(145deg, rgba(6, 26, 56, 0.88) 0%, rgba(2, 14, 34, 0.96) 100%)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  borderInlineStart: '4px solid #0488F8',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 10px 30px rgba(0, 3, 13, 0.5), 0 0 20px rgba(4, 136, 248, 0.08)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: 'rgba(4, 136, 248, 0.18)',
                      border: '1px solid rgba(4, 136, 248, 0.4)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 0 12px rgba(4, 136, 248, 0.3)',
                    }}
                  >
                    <FiShield size={18} />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: 'var(--primary)',
                        display: 'block',
                      }}
                    >
                      {isAr ? 'تنويه وتوجيه فني' : 'Technical Advisory'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {isAr ? 'إرشاد تداول مسؤول' : 'Responsible Trading Guidance'}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    lineHeight: 1.75,
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {isAr ? (post.noticeAr || post.disclaimerAr) : (post.noticeEn || post.disclaimerEn || post.noticeAr)}
                </p>
              </div>
            )}

            {/* Table of Contents Card */}
            {post.sections && post.sections.length > 0 && (
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '20px',
                  boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <FiList size={16} color="var(--primary)" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isAr ? 'فهرس محتويات المقال' : 'Table of Contents'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {post.sections.map((sec, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => scrollToSection(sec.id || `section-${idx}`)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        textAlign: isAr ? 'right' : 'left',
                        cursor: 'pointer',
                        lineHeight: 1.4,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--primary)';
                        e.currentTarget.style.background = 'rgba(4, 136, 248, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.background = 'none';
                      }}
                    >
                      {isAr ? sec.headingAr : sec.headingEn}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* VIP Signals & Live Education Banner CTA */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.95) 0%, rgba(1, 7, 30, 0.98) 100%)',
                border: '1px solid rgba(251, 135, 4, 0.4)',
                borderRadius: '14px',
                padding: '24px 20px',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(0, 3, 13, 0.6), 0 0 20px rgba(251, 135, 4, 0.08)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(251, 135, 4, 0.15)',
                  border: '1px solid rgba(251, 135, 4, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  marginBottom: '12px',
                }}
              >
                <FiTrendingUp size={24} />
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                {isAr ? 'قناة إشارات VIP المباشرة' : 'VIP Live Signals Channel'}
              </h4>

              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {isAr
                  ? 'احصل على توصيات يومية حية للذهب والعملات مع نقاط الدخول والأهداف وإدارة المخاطر.'
                  : 'Join 50,000+ traders receiving daily verified institutional Gold & FX setups.'}
              </p>

              <Link
                href="/register"
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '40px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>{isAr ? 'انضم الآن مجاناً' : 'Join VIP Free'}</span>
                <FiExternalLink size={13} />
              </Link>
            </div>

            {/* Related Posts in Sidebar */}
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 8px 24px rgba(0, 3, 13, 0.4)',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '14px' }}>
                {isAr ? 'مقالات مقترحة للقراءة' : 'Recommended Reads'}
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {relatedPosts.map((rPost) => (
                  <Link
                    key={rPost.id}
                    href={getAppRoute(`/blog/${rPost.id}`, user)}
                    style={{
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid rgba(18, 49, 92, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: rPost.accentColor || 'var(--primary)' }}>
                      {isAr ? rPost.category : rPost.categoryEn}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {isAr ? rPost.titleAr : rPost.titleEn}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {isAr ? rPost.readTimeAr : rPost.readTimeEn}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── 3. Bottom Related Articles Grid (3 Cards) ── */}
      {relatedPosts.length > 0 && (
        <section style={{ marginTop: '72px' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'مقالات ذات صلة قد تهمك' : 'Related Articles You May Like'}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {isAr ? 'وسع معرفتك في التداول وإدارة المخاطر عبر هذه الشروحات المختارة' : 'Deepen your edge with selected institutional walkthroughs'}
                </p>
              </div>

              <Link
                href={getAppRoute('/blog', user)}
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{isAr ? 'عرض كافة المقالات' : 'View All Posts'}</span>
                {isAr ? <FiArrowLeft size={14} /> : <FiArrowRight size={14} />}
              </Link>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {relatedPosts.map((rPost, rIdx) => (
                <Anim key={rPost.id} delay={rIdx * 50}>
                  <Link
                    href={getAppRoute(`/blog/${rPost.id}`, user)}
                    style={{ textDecoration: 'none', height: '100%', display: 'block' }}
                  >
                    <div
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
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: rPost.accentColor || 'var(--primary)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {isAr ? rPost.category : rPost.categoryEn}
                        </span>

                        <h4
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: '12px 0 8px 0',
                            lineHeight: 1.45,
                          }}
                        >
                          {isAr ? rPost.titleAr : rPost.titleEn}
                        </h4>

                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {isAr ? rPost.excerptAr.slice(0, 100) + '...' : rPost.excerptEn.slice(0, 100) + '...'}
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '14px',
                          marginTop: '16px',
                          borderTop: '1px solid rgba(18, 49, 92, 0.4)',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                        }}
                      >
                        <span>{isAr ? rPost.authorAr : rPost.authorEn}</span>
                        <span>{isAr ? rPost.readTimeAr : rPost.readTimeEn}</span>
                      </div>
                    </div>
                  </Link>
                </Anim>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 960px) {
          .article-main-grid {
            grid-template-columns: 1fr !important;
          }
          .mobile-advisory-wrapper {
            display: block !important;
          }
          .desktop-side-advisory {
            display: none !important;
          }
        }
        .blog-card-item:hover {
          border-color: var(--primary) !important;
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(4, 136, 248, 0.15) !important;
        }
      `}</style>
    </div>
  );
}
