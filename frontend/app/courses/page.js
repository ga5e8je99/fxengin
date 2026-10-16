'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { fetchCourses } from '../services/coursesService';
import {
  FiSearch,
  FiX,
  FiBookOpen,
  FiClock,
  FiStar,
  FiShoppingCart,
  FiArrowLeft,
  FiFilter,
  FiSliders,
  FiUser,
  FiAward,
  FiCheckCircle,
  FiTrendingUp,
  FiLayers,
  FiDollarSign,
  FiPlayCircle,
} from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import { LuGraduationCap } from 'react-icons/lu';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { usePageLoading } from '../context/LoadingContext';
import { getAppRoute } from '../utils/routes';
import { getCoursePricing, isUserEnrolledInCourse } from '../utils/coursePricing';
import Anim from '../components/Anim';
import PageHeroBackground from '../components/PageHeroBackground';

export default function CoursesPage() {
  const { isAr } = useLanguage();
  const { user } = useAuth();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Side Filter Sidebar State (Default: closed/collapsed)
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [backendCourses, setBackendCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  // Keep global brand PageLoader visible until courses data completes
  usePageLoading(isLoadingCourses, 'courses_page');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchCourses();
        if (isMounted && res.success && Array.isArray(res.data)) {
          setBackendCourses(res.data);
        }
      } catch (e) {
        console.warn('Error fetching courses list:', e);
      } finally {
        if (isMounted) setIsLoadingCourses(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const combinedCourses = useMemo(() => {
    if (!backendCourses || backendCourses.length === 0) return [];

    return backendCourses.map((c) => {
      const pricing = getCoursePricing(c, 'dollar');
      const isEnrolled = isUserEnrolledInCourse(user, c) || Boolean(c.isEnrolled);
      const hours = c.totalDurationMinutes ? Math.max(1, Math.round(c.totalDurationMinutes / 60)) : 12;
      const levelKey = (c.difficulty || 'intermediate').toLowerCase();

      // Flexible Category Matching
      let catKey = 'basics';
      const rawCat = (c.category || '').toLowerCase();
      if (rawCat === 'fundamental' || rawCat.includes('أساسي') || rawCat.includes('fundamental') || rawCat.includes('اقتصاد')) {
        catKey = 'fundamental';
      } else if (rawCat === 'technical' || rawCat.includes('فني') || rawCat.includes('technical')) {
        catKey = 'technical';
      } else if (rawCat === 'priceaction' || rawCat.includes('smc') || rawCat.includes('سلوك') || rawCat.includes('price')) {
        catKey = 'priceAction';
      } else if (rawCat === 'commodities' || rawCat.includes('ذهب') || rawCat.includes('سلع') || rawCat.includes('commodit')) {
        catKey = 'commodities';
      } else if (rawCat === 'risk' || rawCat.includes('مخاطر') || rawCat.includes('risk')) {
        catKey = 'risk';
      } else if (rawCat === 'algo' || rawCat.includes('آلي') || rawCat.includes('algo') || rawCat.includes('ai') || rawCat.includes('بوت')) {
        catKey = 'algo';
      } else if (rawCat === 'basics' || rawCat.includes('مبتدئ') || rawCat.includes('أساس')) {
        catKey = 'basics';
      }

      return {
        id: c.id,
        slug: c.slug || c.id,
        category: catKey,
        levelKey: levelKey.includes('adv') || levelKey.includes('متقدم') || levelKey.includes('خبير') ? 'advanced' : levelKey.includes('beg') || levelKey.includes('مبتدئ') ? 'beginner' : 'intermediate',
        isFree: pricing.isFree,
        hasDiscount: pricing.hasDiscount,
        priceVal: pricing.currentPrice,
        originalPriceVal: pricing.originalPrice,
        priceStr: pricing.currentPriceStr,
        priceStrEn: pricing.currentPriceStrEn,
        originalPriceStr: pricing.originalPriceStr,
        originalPriceStrEn: pricing.originalPriceStrEn,
        discountPercent: pricing.discountPercent,
        isEnrolled,
        titleAr: c.title,
        titleEn: c.title,
        descAr: c.description || c.subtitle,
        descEn: c.description || c.subtitle,
        lessons: c.lessonsCount || 1,
        hours,
        rating: c.adminRating || 4.95,
        reviews: c.adminReviewCount || 184,
        instructorAr: 'أكاديمية FXENGIN',
        instructorEn: 'FXENGIN Academy',
        img: c.thumbnailUrl || '/assets/Images/test/course1.webp',
        isBackend: true,
      };
    });
  }, [backendCourses, user]);

  // Category Filter Definitions
  const CATEGORIES = [
    { key: 'all', labelAr: 'جميع الدورات', labelEn: 'All Courses' },
    { key: 'basics', labelAr: 'أساسيات الفوركس', labelEn: 'Forex Basics' },
    { key: 'priceAction', labelAr: 'سلوك السعر و SMC', labelEn: 'Price Action & SMC' },
    { key: 'technical', labelAr: 'التحليل الفني', labelEn: 'Technical Analysis' },
    { key: 'fundamental', labelAr: 'التحليل الأساسي', labelEn: 'Fundamental Macro' },
    { key: 'commodities', labelAr: 'الذهب والسلع', labelEn: 'Gold & Commodities' },
    { key: 'risk', labelAr: 'إدارة المخاطر', labelEn: 'Risk Management' },
    { key: 'algo', labelAr: 'التداول الآلي و AI', labelEn: 'Algo & AI Bots' },
  ];

  // Levels List
  const LEVELS = [
    { key: 'all', labelAr: 'جميع المستويات', labelEn: 'All Levels' },
    { key: 'beginner', labelAr: 'مبتدئ (Beginner)', labelEn: 'Beginner' },
    { key: 'intermediate', labelAr: 'متوسط (Intermediate)', labelEn: 'Intermediate' },
    { key: 'advanced', labelAr: 'متقدم / خبير (Advanced)', labelEn: 'Advanced / Expert' },
  ];

  // Price Filter List
  const PRICE_OPTIONS = [
    { key: 'all', labelAr: 'الكل', labelEn: 'All' },
    { key: 'free', labelAr: 'دورات مجانية', labelEn: 'Free Courses' },
    { key: 'paid', labelAr: 'دورات مدفوعة', labelEn: 'Paid Courses' },
  ];

  // Duration Filter List
  const DURATION_OPTIONS = [
    { key: 'all', labelAr: 'أي مدة', labelEn: 'Any Duration' },
    { key: 'short', labelAr: 'أقل من 15 ساعة', labelEn: 'Under 15 Hours' },
    { key: 'medium', labelAr: '15 - 25 ساعة', labelEn: '15 - 25 Hours' },
    { key: 'long', labelAr: 'أكثر من 25 ساعة', labelEn: '25+ Hours' },
  ];

  // Sort Options
  const SORT_OPTIONS = [
    { key: 'popular', labelAr: 'الأكثر طلباً وشهرة', labelEn: 'Most Popular' },
    { key: 'highestRated', labelAr: 'الأعلى تقييماً', labelEn: 'Highest Rated' },
    { key: 'priceLow', labelAr: 'السعر: من الأقل للأعلى', labelEn: 'Price: Low to High' },
    { key: 'priceHigh', labelAr: 'السعر: من الأعلى للأقل', labelEn: 'Price: High to Low' },
    { key: 'hoursHigh', labelAr: 'المدة: الأكثر ساعات', labelEn: 'Longest Duration' },
  ];

  // Calculate Course Counts for Categories
  const categoryCounts = useMemo(() => {
    const counts = { all: combinedCourses.length };
    combinedCourses.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [combinedCourses]);

  // Filtered and Sorted Courses
  const filteredCourses = useMemo(() => {
    let result = combinedCourses.filter((c) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (c.titleAr + ' ' + c.titleEn).toLowerCase().includes(q);
        const matchDesc = (c.descAr + ' ' + c.descEn).toLowerCase().includes(q);
        const matchInstructor = (c.instructorAr + ' ' + c.instructorEn).toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchInstructor) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }

      // 3. Level Filter
      if (selectedLevel !== 'all') {
        if (selectedLevel === 'beginner' && c.levelKey !== 'beginner') return false;
        if (selectedLevel === 'intermediate' && c.levelKey !== 'intermediate') return false;
        if (selectedLevel === 'advanced' && c.levelKey !== 'advanced' && c.levelKey !== 'expert') return false;
      }

      // 4. Price Filter
      if (selectedPrice === 'free' && !c.isFree) return false;
      if (selectedPrice === 'paid' && c.isFree) return false;

      // 5. Duration Filter
      if (selectedDuration === 'short' && c.hours >= 15) return false;
      if (selectedDuration === 'medium' && (c.hours < 15 || c.hours > 25)) return false;
      if (selectedDuration === 'long' && c.hours <= 25) return false;

      return true;
    });

    // 6. Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') return b.reviews - a.reviews;
      if (sortBy === 'highestRated') return b.rating - a.rating;
      if (sortBy === 'priceLow') return a.priceVal - b.priceVal;
      if (sortBy === 'priceHigh') return b.priceVal - a.priceVal;
      if (sortBy === 'hoursHigh') return b.hours - a.hours;
      return 0;
    });

    return result;
  }, [combinedCourses, searchQuery, selectedCategory, selectedLevel, selectedPrice, selectedDuration, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedPrice('all');
    setSelectedDuration('all');
    setSortBy('popular');
  };

  const activeFiltersCount =
    (searchQuery !== '' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedLevel !== 'all' ? 1 : 0) +
    (selectedPrice !== 'all' ? 1 : 0) +
    (selectedDuration !== 'all' ? 1 : 0) +
    (sortBy !== 'popular' ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  // Reusable Filter Sidebar Content Component
  const FilterContent = () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* Filter Header with Reset */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
          <FiSliders size={17} color="var(--primary)" />
          <span>{isAr ? 'تصفية الدورات' : 'Filter Courses'}</span>
          {activeFiltersCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                background: 'var(--primary)',
                color: '#FFFFFF',
                borderRadius: '10px',
                padding: '2px 7px',
                fontWeight: 700,
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FiX size={13} />
            {isAr ? 'إلغاء الكل' : 'Reset All'}
          </button>
        )}
      </div>

      {/* 1. Category Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          <FiLayers size={14} color="var(--primary)" />
          <span>{isAr ? 'المجال والتصنيف' : 'Category'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'rgba(4, 136, 248, 0.12)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid rgba(4, 136, 248, 0.35)' : '1px solid transparent',
                  cursor: 'pointer',
                  textAlign: isAr ? 'right' : 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)',
                    color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                  }}
                >
                  {categoryCounts[cat.key] || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Level Section */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          <FiAward size={14} color="var(--accent)" />
          <span>{isAr ? 'المستوى التدريبي' : 'Skill Level'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {LEVELS.map((lvl) => {
            const isSelected = selectedLevel === lvl.key;
            return (
              <label
                key={lvl.key}
                onClick={() => setSelectedLevel(lvl.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(251, 135, 4, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--accent)' : '2px solid var(--border)',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                />
                <span>{isAr ? lvl.labelAr : lvl.labelEn}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Price Section */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          <FiDollarSign size={14} color="var(--success)" />
          <span>{isAr ? 'نوع السعر' : 'Pricing Type'}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PRICE_OPTIONS.map((p) => {
            const isSelected = selectedPrice === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPrice(p.key)}
                style={{
                  flex: '1 1 calc(50% - 6px)',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? 'var(--accent)' : 'rgba(1, 7, 30, 0.6)',
                  color: isSelected ? '#000' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {isAr ? p.labelAr : p.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Duration Section */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          <FiClock size={14} color="var(--primary)" />
          <span>{isAr ? 'مدة التدريب' : 'Duration'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {DURATION_OPTIONS.map((dur) => {
            const isSelected = selectedDuration === dur.key;
            return (
              <label
                key={dur.key}
                onClick={() => setSelectedDuration(dur.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(4, 136, 248, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--primary)' : '2px solid var(--border)',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                />
                <span>{isAr ? dur.labelAr : dur.labelEn}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Sort By Section (Inside Filter Content) */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          <FiSliders size={14} color="var(--accent)" />
          <span>{isAr ? 'ترتيب النتائج' : 'Sort By'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {SORT_OPTIONS.map((s) => {
            const isSelected = sortBy === s.key;
            return (
              <label
                key={s.key}
                onClick={() => setSortBy(s.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(251, 135, 4, 0.1)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: isSelected ? '5px solid var(--accent)' : '2px solid var(--border)',
                    background: isSelected ? '#FFFFFF' : 'transparent',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                />
                <span>{isAr ? s.labelAr : s.labelEn}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', paddingBottom: '2.5rem' }}>
      {/* ── 1. Hero Header Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '56px 0 36px',
          borderBottom: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <Anim>
            <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
              <span
                className="badge badge-vip"
                style={{
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                }}
              >
                <LuGraduationCap size={16} />
                {isAr ? 'أكاديمية ودورات FXENGIN التعليمية' : 'FXENGIN Pro Trading Academy'}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(26px, 3.6vw, 44px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.25,
                margin: '0 0 14px 0',
              }}
            >
              {isAr ? 'استكشف مسارات ودورات ' : 'Explore Professional '}
              <span className="text-gradient-brand">
                {isAr ? 'التداول الاحترافي' : 'Trading Courses'}
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(14px, 1.5vw, 15.5px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                maxWidth: '680px',
                margin: '0 auto 24px',
              }}
            >
              {isAr
                ? 'دورات تدريبية متدرجة من الصفر وحتى الاحتراف المتقدم في أسواق العملات، الذهب، والسلع يقدمها نخبة من كبار المحللين والخبراء.'
                : 'Progressive training tracks from fundamentals to pro strategies across Forex, Gold, and Commodities by verified market experts.'}
            </p>

            {/* Quick Metrics Badges */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '16px 24px',
                flexWrap: 'wrap',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiBookOpen color="var(--primary)" size={15} />
                {backendCourses.length > 0
                  ? (isAr ? `${backendCourses.length} ${backendCourses.length === 1 ? 'دورة تدريبية متاحة' : 'دورات تدريبية متاحة'}` : `${backendCourses.length} Courses Available`)
                  : (isAr ? 'ستتوفر قريباً' : 'Coming Soon')}
              </span>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiAward color="var(--accent)" size={15} />
                {isAr ? 'شهادات إتمام معتمدة' : 'Verified Certificates'}
              </span>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <FiUser color="var(--success)" size={15} />
                {isAr ? 'نخبة من كبار المحللين والمدربين' : 'Top Tier Market Analysts'}
              </span>
              <span>·</span>
              <a
                href="https://t.me/FXENGINEducation"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
                title="تواصل مع دعم الكورسات"
              >
                <FaTelegramPlane color="#229ED9" size={15} />
                <span>{isAr ? 'دعم الكورسات: @FXENGINEducation' : 'Courses Desk: @FXENGINEducation'}</span>
              </a>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── 2. Content: Either Coming Soon (if 0 courses) or Catalog Grid (if courses exist) ── */}
      {!isLoadingCourses && backendCourses.length === 0 ? (
        <div className="container" style={{ marginTop: '48px', marginBottom: '64px' }}>
          <Anim>
            <div
              className="card"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(4, 136, 248, 0.08) 0%, rgba(1, 7, 30, 0.75) 75%)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '64px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: '720px',
                margin: '0 auto',
                boxShadow: '0 20px 50px rgba(0, 3, 13, 0.5)',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(4, 136, 248, 0.15), rgba(251, 135, 4, 0.15))',
                  border: '1px solid rgba(4, 136, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  marginBottom: '20px',
                  boxShadow: '0 0 30px rgba(4, 136, 248, 0.25)',
                }}
              >
                <LuGraduationCap size={40} />
              </div>

              <div style={{ display: 'inline-flex', marginBottom: '14px' }}>
                <span className="badge badge-blue" style={{ fontSize: '12px', padding: '4px 14px', letterSpacing: '0.5px' }}>
                  {isAr ? 'ستتوفر قريباً • Coming Soon' : 'Coming Soon • ستتوفر قريباً'}
                </span>
              </div>

              <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 14px 0' }}>
                {isAr ? 'الدورات التدريبية ستتوفر قريباً' : 'Courses Will Be Available Soon'}
              </h2>

              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '560px', margin: '0 0 28px 0' }}>
                {isAr
                  ? 'يعمل فريق المحللين والخبراء في FXENGIN حالياً على إعداد وتصوير مسارات تدريبية مؤسسية بمعايير عالمية لتزويدك بأقوى استراتيجيات التداول. ترقبوا الإطلاق قريباً!'
                  : 'The FXENGIN team of master analysts is currently preparing world-class institutional trading curriculums to empower you with top-tier strategies. Stay tuned for the upcoming launch!'}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                  href={getAppRoute('/', user)}
                  className="btn-primary"
                  style={{
                    height: '44px',
                    padding: '0 24px',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <span>{isAr ? 'العودة للرئيسية' : 'Return to Home'}</span>
                </Link>
                <Link
                  href={getAppRoute('/analyses', user)}
                  className="btn-secondary"
                  style={{
                    height: '44px',
                    padding: '0 24px',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <span>{isAr ? 'استعراض التحليلات الفنية' : 'View Market Analyses'}</span>
                </Link>
                <a
                  href="https://t.me/FXENGINEducation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{
                    height: '44px',
                    padding: '0 24px',
                    fontSize: '14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    background: 'linear-gradient(135deg, #0088cc 0%, #0488F8 100%)',
                    boxShadow: '0 4px 15px rgba(0, 136, 204, 0.4)',
                  }}
                >
                  <FaTelegramPlane size={16} />
                  <span>{isAr ? 'تواصل مع دعم الكورسات (@FXENGINEducation)' : 'Contact Courses Support (@FXENGINEducation)'}</span>
                </a>
              </div>
            </div>
          </Anim>
        </div>
      ) : (
        <>
          {/* ── 2. Top Interactive Action Bar ── */}
          <div className="container" style={{ marginTop: '28px' }}>
        <Anim>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: '0 6px 24px rgba(0, 3, 13, 0.4)',
            }}
          >
            {/* Left/Start: Toggle Filter Button & Search Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 340px' }}>
              {/* Toggle Side Filter Button with Badge & Animation Indicator */}
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="btn-filter-toggle"
                style={{
                  height: '42px',
                  padding: '0 16px',
                  borderRadius: '8px',
                  background: isFilterOpen ? 'var(--primary)' : 'rgba(4, 136, 248, 0.1)',
                  color: isFilterOpen ? '#FFFFFF' : 'var(--primary)',
                  border: isFilterOpen ? '1px solid var(--primary)' : '1px solid rgba(4, 136, 248, 0.3)',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isFilterOpen ? '0 0 16px rgba(4, 136, 248, 0.35)' : 'none',
                }}
              >
                <FiSliders size={16} />
                <span>
                  {isFilterOpen
                    ? (isAr ? 'إخفاء الفلتر' : 'Hide Filters')
                    : (isAr ? 'تصفية وبحث متقدم' : 'Show Filters')}
                </span>
                {activeFiltersCount > 0 && (
                  <span
                    style={{
                      fontSize: '11px',
                      background: isFilterOpen ? '#FFFFFF' : 'var(--primary)',
                      color: isFilterOpen ? '#000000' : '#FFFFFF',
                      borderRadius: '10px',
                      padding: '2px 7px',
                      fontWeight: 800,
                    }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Search Box */}
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'ابحث باسم الدورة، المدرب، أو الموضوع...' : 'Search by title, instructor, topic...'}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: isAr ? '0 14px 0 38px' : '0 38px 0 14px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13.5px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                />
                <div
                  style={{
                    position: 'absolute',
                    [isAr ? 'left' : 'right']: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <FiSearch size={16} />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      [isAr ? 'left' : 'right']: '32px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Right/End: Results Count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {isAr ? 'عرض ' : 'Showing '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {filteredCourses.length}
                </span>{' '}
                {isAr ? 'دورة تدريبية' : 'courses'}
              </div>
            </div>
          </div>
        </Anim>
      </div>

      {/* ── 3. Main Workspace: Side Filter Panel + Course Catalog Grid ── */}
      <div className="container" style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', gap: '28px', alignItems: 'flex-start', position: 'relative' }}>

          {/* ── Desktop Animated Side Filter Panel ── */}
          <aside
            className={`courses-sidebar-desktop ${isFilterOpen ? 'sidebar-open' : 'sidebar-closed'}`}
            style={{
              display: isFilterOpen ? 'block' : 'none',
              width: isFilterOpen ? '280px' : '0px',
              minWidth: isFilterOpen ? '280px' : '0px',
              maxWidth: isFilterOpen ? '280px' : '0px',
              opacity: isFilterOpen ? 1 : 0,
              transform: isFilterOpen ? 'translateX(0) scale(1)' : isAr ? 'translateX(30px) scale(0.96)' : 'translateX(-30px) scale(0.96)',
              pointerEvents: isFilterOpen ? 'auto' : 'none',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              flexShrink: 0,
              position: 'sticky',
              top: 'calc(var(--top-bars-height, 9.5rem) + 1.25rem)',
            }}
          >
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '22px',
                boxShadow: '0 8px 32px rgba(0, 3, 13, 0.45)',
                width: '280px',
              }}
            >
              <FilterContent />
            </div>
          </aside>

          {/* ── Main Courses Catalog Grid Area ── */}
          <main style={{ flex: 1, minWidth: 0, transition: 'all 0.35s ease' }}>
            {filteredCourses.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isFilterOpen
                    ? 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))'
                    : 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                  gap: '24px',
                  transition: 'all 0.35s ease',
                }}
              >
                {filteredCourses.map((course, idx) => (
                  <Anim key={course.id} delay={idx * 40}>
                    <article
                      className="card course-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {/* Thumbnail / Header Area */}
                      <div
                        style={{
                          height: '175px',
                          background: '#06142F',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={course.img}
                          alt={isAr ? course.titleAr : course.titleEn}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            transition: 'transform 0.3s ease',
                          }}
                          className="course-img"
                        />

                        {/* Gradient Overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(6,20,47,0.95) 0%, rgba(6,20,47,0.3) 60%, rgba(0,3,13,0.5) 100%)',
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Top Level & Enrollment Badges */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            right: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 2,
                          }}
                        >
                          {/* Level Badge */}
                          <span
                            className="badge"
                            style={{
                              background: 'rgba(1, 7, 30, 0.85)',
                              backdropFilter: 'blur(6px)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                              fontSize: '11px',
                              padding: '3px 10px',
                              borderRadius: '6px',
                            }}
                          >
                            {course.levelKey === 'beginner' && (isAr ? 'مبتدئ' : 'Beginner')}
                            {course.levelKey === 'intermediate' && (isAr ? 'متوسط' : 'Intermediate')}
                            {course.levelKey === 'advanced' && (isAr ? 'متقدم' : 'Advanced')}
                            {course.levelKey === 'expert' && (isAr ? 'خبير' : 'Expert')}
                            {course.levelKey === 'all' && (isAr ? 'كل المستويات' : 'All Levels')}
                          </span>

                          {/* Enrolled Badge */}
                          {course.isEnrolled && (
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(16, 185, 129, 0.25)',
                                backdropFilter: 'blur(6px)',
                                color: '#10B981',
                                border: '1px solid rgba(16, 185, 129, 0.5)',
                                fontSize: '11px',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                              }}
                            >
                              <FiCheckCircle size={12} />
                              <span>{isAr ? 'مشترك بالفعل' : 'Enrolled'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Body Content */}
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                        {/* Title */}
                        <h3
                          style={{
                            fontSize: '16.5px',
                            fontWeight: 700,
                            margin: 0,
                            lineHeight: 1.35,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {isAr ? course.titleAr : course.titleEn}
                        </h3>

                        {/* Description */}
                        <p
                          style={{
                            fontSize: '13px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {isAr ? course.descAr : course.descEn}
                        </p>

                        {/* Instructor & Rating */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            paddingTop: '6px',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            <FiUser size={13} color="var(--primary)" />
                            {isAr ? course.instructorAr : course.instructorEn}
                          </span>

                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#FBBF24', fontWeight: 700 }}>
                            <FiStar size={13} fill="#FBBF24" />
                            {course.rating}
                            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({course.reviews})</span>
                          </span>
                        </div>

                        {/* Meta: Lessons & Hours */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '16px',
                            fontSize: '12.5px',
                            color: 'var(--text-muted)',
                            marginTop: 'auto',
                            paddingTop: '8px',
                            borderTop: '1px solid var(--border)',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FiBookOpen size={13} />
                            {course.lessons} {isAr ? 'درس تعليمي' : 'lessons'}
                          </span>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <FiClock size={13} />
                            {course.hours} {isAr ? 'ساعة تدريبية' : 'hours'}
                          </span>
                        </div>

                        {/* Card Footer: Price & Enroll Action */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingTop: '8px',
                          }}
                        >
                          {/* Price Display with Discount Support */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '18px',
                                  fontWeight: 800,
                                  color: course.isFree ? 'var(--success)' : 'var(--accent)',
                                  fontFamily: 'monospace',
                                }}
                              >
                                {isAr ? course.priceStr : course.priceStrEn}
                              </span>
                              {course.hasDiscount && (
                                <span
                                  style={{
                                    fontSize: '12.5px',
                                    color: 'var(--text-muted)',
                                    textDecoration: 'line-through',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {isAr ? course.originalPriceStr : course.originalPriceStrEn}
                                </span>
                              )}
                            </div>
                            {course.hasDiscount && (
                              <span style={{ fontSize: '10px', color: '#F6465D', fontWeight: 700 }}>
                                {isAr ? `خصم ${course.discountPercent}%` : `${course.discountPercent}% OFF`}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Link
                              href={getAppRoute(`/courses/${course.slug || course.id}`, user)}
                              className="btn-secondary"
                              style={{
                                height: '34px',
                                padding: '0 10px',
                                fontSize: '11.5px',
                                textDecoration: 'none',
                                fontWeight: 700,
                              }}
                            >
                              <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                            </Link>

                            {course.isEnrolled ? (
                              <Link
                                href={getAppRoute(`/courses/${course.slug || course.id}/learn`, user)}
                                className="btn-primary"
                                style={{
                                  height: '34px',
                                  padding: '0 12px',
                                  fontSize: '11.5px',
                                  textDecoration: 'none',
                                  fontWeight: 800,
                                  gap: '5px',
                                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                  boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
                                }}
                              >
                                <FiPlayCircle size={13} />
                                <span>{isAr ? 'ادخل الكورس' : 'Enter Course'}</span>
                              </Link>
                            ) : (
                              <Link
                                href={
                                  course.isFree
                                    ? (user ? getAppRoute(`/courses/${course.slug || course.id}`, user) : `/login?redirect=${encodeURIComponent(`/courses/${course.slug || course.id}?autoEnroll=true`)}`)
                                    : user
                                    ? getAppRoute(`/checkout?type=course&id=${course.id}`, user)
                                    : `/login?redirect=${encodeURIComponent(`/checkout?type=course&id=${course.id}`)}`
                                }
                                className="btn-primary"
                                style={{
                                  height: '34px',
                                  padding: '0 12px',
                                  fontSize: '11.5px',
                                  textDecoration: 'none',
                                  fontWeight: 800,
                                  gap: '4px',
                                  background: course.isFree ? undefined : 'linear-gradient(135deg, var(--accent), #F6465D)',
                                }}
                              >
                                <FiShoppingCart size={12} />
                                <span>{course.isFree ? (isAr ? 'ابدأ مجاناً' : 'Free') : (isAr ? 'شراء الآن' : 'Buy Now')}</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Anim>
                ))}
              </div>
            ) : (
              /* Empty Search / Filter State */
              <Anim>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 24px',
                    background: 'var(--surface)',
                    border: '1px dashed var(--border)',
                    borderRadius: '16px',
                    maxWidth: '560px',
                    margin: '40px auto',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'rgba(251, 135, 4, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: 'var(--accent)',
                    }}
                  >
                    <FiSearch size={26} />
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {isAr ? 'لم نجد أي دورات مطابقة لبحثك' : 'No courses found matching your criteria'}
                  </h3>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                    {isAr
                      ? 'جرب البحث بكلمات مختلفة أو قم بإلغاء بعض الفلاتر لعرض الدورات المتاحة.'
                      : 'Try searching with different terms or reset your filters to view all available courses.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-primary"
                    style={{ margin: '0 auto', fontSize: '13px', height: '40px', padding: '0 20px' }}
                  >
                    {isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset All Filters'}
                  </button>
                </div>
              </Anim>
            )}
          </main>
        </div>
      </div>

      {/* ── 4. Mobile & Tablet Slide-over Drawer ── */}
      <div
        className="courses-mobile-drawer-root"
        style={{
          display: 'none',
          position: 'fixed',
          top: 'var(--top-bars-height, 9.5rem)',
          bottom: 0,
          insetInline: 0,
          height: 'calc(100vh - var(--top-bars-height, 9.5rem))',
          zIndex: 150,
          pointerEvents: isFilterOpen ? 'auto' : 'none',
        }}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsFilterOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 3, 13, 0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            opacity: isFilterOpen ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Drawer panel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            height: '100%',
            [isAr ? 'right' : 'left']: 0,
            width: '85%',
            maxWidth: '340px',
            background: 'var(--surface)',
            borderInlineStart: '1px solid var(--border)',
            boxShadow: '0 0 40px rgba(0,0,0,0.8)',
            padding: '20px',
            overflowY: 'auto',
            transform: isFilterOpen
              ? 'translateX(0)'
              : isAr
                ? 'translateX(100%)'
                : 'translateX(-100%)',
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mobile Drawer Close Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          <FilterContent />
        </div>
      </div>
        </>
      )}

      {/* ── 5. Responsive Styling ── */}
      <style>{`
        @media (max-width: 991px) {
          .courses-sidebar-desktop {
            display: none !important;
          }
          .courses-mobile-drawer-root {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
