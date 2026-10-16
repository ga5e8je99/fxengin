'use client';
import { useState, useMemo, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, notFound } from 'next/navigation';
import Anim from '../../components/Anim';
import PageHeroBackground from '../../components/PageHeroBackground';
import {
  FiBookOpen,
  FiClock,
  FiStar,
  FiUsers,
  FiCheckCircle,
  FiPlayCircle,
  FiLock,
  FiAward,
  FiShield,
  FiArrowLeft,
  FiArrowRight,
  FiShare2,
  FiChevronDown,
  FiChevronUp,
  FiHelpCircle,
  FiVideo,
  FiDownload,
  FiCheck,
  FiCreditCard,
} from 'react-icons/fi';
import { FaTelegramPlane } from 'react-icons/fa';
import { fetchCourseBySlug, enrollCourse } from '../../services/coursesService';
import { showToast } from '../../utils/toast';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { usePageLoading } from '../../context/LoadingContext';
import { getAppRoute } from '../../utils/routes';
import { getCoursePricing, isUserEnrolledInCourse } from '../../utils/coursePricing';

export default function CourseDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const courseId = unwrappedParams?.courseId || unwrappedParams?.id;
  const { isAr } = useLanguage();
  const { user, enrollUserCourse } = useAuth();

  const [backendCourse, setBackendCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep global brand PageLoader visible until course detail data completes
  usePageLoading(isLoading, 'course_detail');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!courseId) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetchCourseBySlug(courseId);
        if (isMounted && res.success && res.data) {
          setBackendCourse(res.data);
          if (res.data.isEnrolled) {
            setIsEnrolled(true);
          }
        }
      } catch (err) {
        console.warn('Error fetching course by slug:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const course = useMemo(() => {
    if (!backendCourse) return null;

    const pricing = getCoursePricing(backendCourse, 'usdt');
    const userEnrolled = isUserEnrolledInCourse(user, backendCourse) || Boolean(backendCourse.isEnrolled) || isEnrolled;
    const hours = backendCourse.totalDurationMinutes ? Math.max(1, Math.round(backendCourse.totalDurationMinutes / 60)) : 12;
    const modules = backendCourse.sections?.map((s) => ({
      moduleTitleAr: s.title,
      moduleTitleEn: s.title,
      lessons: s.lessons?.map((l) => ({
        id: l.id,
        titleAr: l.title,
        titleEn: l.title,
        duration: l.durationSeconds ? `${Math.floor(l.durationSeconds / 60)}:${String(l.durationSeconds % 60).padStart(2, '0')}` : '15:00',
        freePreview: Boolean(l.isFreePreview),
      })) || [],
    })) || [];

    return {
      id: backendCourse.id,
      slug: backendCourse.slug || backendCourse.id,
      titleAr: backendCourse.title,
      titleEn: backendCourse.title,
      subtitleAr: backendCourse.subtitle || '',
      subtitleEn: backendCourse.subtitle || '',
      descAr: backendCourse.description || '',
      descEn: backendCourse.description || '',
      categoryAr: backendCourse.category || 'تداول',
      categoryEn: backendCourse.category || 'Trading',
      levelAr: isAr ? 'متوسط' : 'Intermediate',
      levelEn: 'Intermediate',
      badge: 'PRO',
      badgeColor: 'var(--primary)',
      isFree: pricing.isFree,
      hasDiscount: pricing.hasDiscount,
      priceVal: pricing.currentPrice,
      originalPriceVal: pricing.originalPrice,
      priceStr: pricing.currentPriceStr,
      priceStrEn: pricing.currentPriceStrEn,
      originalPrice: pricing.originalPriceStr,
      discountPercent: pricing.discountPercent,
      rating: backendCourse.adminRating || 4.95,
      reviews: backendCourse.adminReviewCount || 180,
      studentsCount: backendCourse.enrolledStudentsCount ? `${backendCourse.enrolledStudentsCount}+` : '0',
      lastUpdated: '2026',
      hours,
      lessons: backendCourse.lessonsCount || (modules.reduce((acc, m) => acc + m.lessons.length, 0)) || 1,
      img: backendCourse.thumbnailUrl || '/assets/Images/test/course1.webp',
      previewVideo: backendCourse.promoVideoUrl || '',
      modules,
      isEnrolled: userEnrolled,
      instructorAr: 'أكاديمية FXENGIN',
      instructorEn: 'FXENGIN Academy',
      instructorRoleAr: 'كبير المستشارين الماليين',
      instructorRoleEn: 'Senior Market Strategist',
      instructorBioAr: 'فريق خبراء ومحللي أسواق المال والسيولة المؤسسية في منصة FXENGIN.',
      instructorBioEn: 'Institutional trading and macro analysis specialists at FXENGIN.',
      whatYouWillLearnAr: [
        'فهم آلية عمل أسواق المال العالمية وقراءة السيولة المؤسسية',
        'تحليل الرسوم البيانية واستخراج مناطق الدخول والخروج بدقة',
        'إدارة المخاطر وحساب حجم العقود بطريقة منضبطة وآمنة',
      ],
      whatYouWillLearnEn: [
        'Understand global market mechanics and institutional liquidity flow',
        'Analyze charts and pinpoint high-probability entry and exit zones',
        'Master risk parameters and precision lot sizing discipline',
      ],
    };
  }, [backendCourse, isEnrolled, user, isAr]);

  const handleEnroll = async () => {
    if (!user) {
      showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً للتسجيل في الكورس' : 'Please sign in first to enroll');
      const targetPath = `/courses/${course.slug || course.id}?autoEnroll=true`;
      router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
      return;
    }

    if (isEnrolled || course.isEnrolled) {
      router.push(getAppRoute(`/courses/${course.slug || course.id}/learn`, user));
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await enrollCourse(course.slug || course.id);
      if (res.success) {
        setIsEnrolled(true);
        enrollUserCourse?.(course);
        showToast.success(isAr ? 'تم التسجيل في الكورس بنجاح! جاري الانتقال لقاعة التعلم...' : 'Enrolled successfully! Redirecting to classroom...');
        setTimeout(() => {
          router.push(getAppRoute(`/courses/${course.slug || course.id}/learn`, user));
        }, 1200);
      } else {
        showToast.error(res.message || (isAr ? 'فشل التسجيل في الكورس' : 'Failed to enroll'));
      }
    } catch (err) {
      showToast.error(isAr ? 'حدث خطأ أثناء التسجيل' : 'Enrollment error occurred');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Auto-enroll if user returned from login with autoEnroll=true
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoEnroll') === 'true' && user && !isEnrolled && !isEnrolling && course?.isFree) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      handleEnroll();
    }
  }, [user, isEnrolled, isEnrolling, course?.isFree]);

  const [openModule, setOpenModule] = useState(0);
  const [copied, setCopied] = useState(false);

  const toggleModule = (idx) => {
    setOpenModule(openModule === idx ? null : idx);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };
  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--primary)', fontSize: '15px', fontWeight: 600 }}>
          {isAr ? 'جاري تحميل تفاصيل الدورة...' : 'Loading course details...'}
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <FiBookOpen size={28} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {isAr ? 'الدورة التدريبية غير موجودة' : 'Course Not Found'}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, maxWidth: '400px' }}>
          {isAr ? 'لم نتمكن من العثور على الدورة المطلوبة أو قد تكون غير منشورة حالياً.' : 'The requested course could not be found or is not currently published.'}
        </p>
        <Link href={getAppRoute('/courses', user)} className="btn-primary" style={{ marginTop: '8px', textDecoration: 'none' }}>
          <span>{isAr ? 'تصفح جميع الدورات' : 'Browse All Courses'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* ── 1. Hero Header Section ── */}
      <section
        style={{
          position: 'relative',
          padding: '48px 0 56px',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        }}
      >
        <PageHeroBackground />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <Anim>
            {/* Breadcrumb Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              <Link href={getAppRoute('/', user)} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {isAr ? 'الرئيسية' : 'Home'}
              </Link>
              <span>/</span>
              <Link href={getAppRoute('/courses', user)} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {isAr ? 'الكورسات التدريبية' : 'Courses'}
              </Link>
              <span>/</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {isAr ? course.categoryAr : course.categoryEn}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 0.9fr',
                gap: '40px',
                alignItems: 'start',
              }}
              className="course-hero-grid"
            >
              {/* Left Column: Course Main Details */}
              <div>
                {/* Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      color: course.badgeColor || 'var(--accent)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${course.badgeColor || 'var(--accent)'}`,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    ★ {course.badge}
                  </span>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      background: 'rgba(4, 136, 248, 0.12)',
                      padding: '3px 10px',
                      borderRadius: '6px',
                    }}
                  >
                    {isAr ? course.levelAr : course.levelEn}
                  </span>

                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {isAr ? `آخر تحديث: ${course.lastUpdated}` : `Updated: ${course.lastUpdated}`}
                  </span>
                </div>

                {/* Course Title */}
                <h1
                  style={{
                    fontSize: 'clamp(26px, 3.5vw, 38px)',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                    margin: '0 0 14px 0',
                  }}
                >
                  {isAr ? course.titleAr : course.titleEn}
                </h1>

                {/* Subtitle */}
                <p
                  style={{
                    fontSize: '16px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.75,
                    margin: '0 0 24px 0',
                  }}
                >
                  {isAr ? course.subtitleAr : course.subtitleEn}
                </p>

                {/* Meta Highlights Row (Rating, Students, Duration) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px',
                    flexWrap: 'wrap',
                    padding: '16px 20px',
                    background: 'rgba(6, 20, 47, 0.7)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#FBBF24', fontWeight: 800 }}>★ {course.rating}</span>
                    <span style={{ color: 'var(--text-muted)' }}>({course.reviews} {isAr ? 'تقييم' : 'reviews'})</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <FiUsers size={16} color="var(--primary)" />
                    <span>{course.studentsCount} {isAr ? 'متداول مسجل' : 'enrolled traders'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <FiClock size={16} color="var(--accent)" />
                    <span>{course.hours} {isAr ? 'ساعة تدريبية' : 'hours'} ({course.lessons} {isAr ? 'درس' : 'lessons'})</span>
                  </div>
                </div>

                {/* Instructor Quick Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '24px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--primary-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontSize: '16px',
                      fontWeight: 800,
                      boxShadow: '0 4px 14px rgba(4, 136, 248, 0.4)',
                    }}
                  >
                    {isAr ? 'مش' : 'TS'}
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isAr ? course.instructorAr : course.instructorEn}
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {isAr ? course.instructorRoleAr : course.instructorRoleEn}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Sticky Pricing & Action Card Preview */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 20px 50px rgba(0, 3, 13, 0.8)',
                  position: 'sticky',
                  top: 'calc(var(--top-bars-height, 9.5rem) + 1.25rem)',
                  zIndex: 20,
                }}
              >
                {/* Video Preview Box with Play Overlay */}
                <div
                  style={{
                    position: 'relative',
                    height: '190px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    background: '#010514',
                    border: '1px solid var(--border)',
                  }}
                >
                  <img
                    src={course.img}
                    alt={course.titleAr}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {(isEnrolled || course.isEnrolled) && (
                    <Link
                      href={user ? getAppRoute(`/courses/${course.slug || course.id}/learn`, user) : `/login?redirect=${encodeURIComponent(`/courses/${course.slug || course.id}/learn`)}`}
                      aria-label="Continue Course"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        color: '#FFF',
                        background: 'rgba(0, 3, 13, 0.4)',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          background: 'rgba(22, 199, 132, 0.95)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF',
                          boxShadow: '0 0 24px rgba(22, 199, 132, 0.7)',
                          transform: 'scale(1)',
                          transition: 'transform 0.2s ease',
                        }}
                      >
                        <FiPlayCircle size={32} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.8)' }}>
                        {isAr ? 'متابعة الدورة' : 'Continue Course'}
                      </span>
                    </Link>
                  )}
                </div>

                {/* Enrolled Status Pill */}
                {course.isEnrolled && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(22, 199, 132, 0.15)',
                      border: '1px solid rgba(22, 199, 132, 0.35)',
                      color: 'var(--success)',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      marginBottom: '12px',
                    }}
                  >
                    <FiCheckCircle size={14} />
                    <span>{isAr ? 'أنت مشترك ومفعّل بالفعل في هذا الكورس' : 'You have active lifetime access'}</span>
                  </div>
                )}

                {/* Price Display */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {isAr ? course.priceStr : course.priceStrEn}
                  </div>
                  {course.originalPrice && (
                    <div style={{ fontSize: '18px', color: 'var(--text-muted)', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                      {course.originalPrice}
                    </div>
                  )}
                  {course.hasDiscount && (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#F6465D', background: 'rgba(246, 70, 93, 0.15)', padding: '3px 8px', borderRadius: '4px' }}>
                      {isAr ? `وفر ${course.discountPercent}%` : `${course.discountPercent}% OFF`}
                    </span>
                  )}
                  {course.isFree && (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--success)', background: 'rgba(22, 199, 132, 0.15)', padding: '3px 8px', borderRadius: '4px' }}>
                      100% FREE
                    </span>
                  )}
                </div>

                {/* CTA Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
                  {isEnrolled || course.isEnrolled ? (
                    <Link
                      href={user ? getAppRoute(`/courses/${course.slug || course.id}/learn`, user) : `/login?redirect=${encodeURIComponent(`/courses/${course.slug || course.id}/learn`)}`}
                      className="btn-primary"
                      style={{
                        height: '48px',
                        fontSize: '15px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #16C784, #0488F8)',
                        boxShadow: '0 4px 20px rgba(22, 199, 132, 0.4)',
                      }}
                    >
                      <FiPlayCircle size={18} />
                      <span>{isAr ? 'دخول قاعة التعلم التفاعلية ←' : 'Enter Interactive Classroom →'}</span>
                    </Link>
                  ) : course.isFree ? (
                    <button
                      type="button"
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="btn-primary"
                      style={{
                        height: '48px',
                        fontSize: '15px',
                        fontWeight: 800,
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: isEnrolling ? 'not-allowed' : 'pointer',
                        opacity: isEnrolling ? 0.7 : 1,
                      }}
                    >
                      <FiPlayCircle size={18} />
                      <span>
                        {isEnrolling
                          ? (isAr ? 'جاري التسجيل في الكورس...' : 'Enrolling in course...')
                          : (isAr ? 'التسجيل في الكورس مجاناً' : 'Enroll in Course for Free')}
                      </span>
                    </button>
                  ) : (
                    <Link
                      href={user ? getAppRoute(`/checkout?type=course&id=${course.id}`, user) : `/login?redirect=${encodeURIComponent(`/checkout?type=course&id=${course.id}`)}`}
                      className="btn-primary"
                      style={{
                        height: '48px',
                        fontSize: '15px',
                        fontWeight: 800,
                        textDecoration: 'none',
                        justifyContent: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, var(--accent), #F6465D)',
                        boxShadow: '0 4px 20px rgba(251, 135, 4, 0.4)',
                      }}
                    >
                      <FiCreditCard size={18} />
                      <span>
                        {isAr ? `شراء الكورس والدفع (${course.priceStr}) ←` : `Enroll & Checkout (${course.priceStrEn}) →`}
                      </span>
                    </Link>
                  )}

                  <a
                    href={`https://t.me/FXENGINEducation?text=${encodeURIComponent(
                      isAr
                        ? `مرحباً فريق دعم أكاديمية FXENGIN،\nأود الاستفسار والتسجيل في دورة: ${course.titleAr || course.titleEn}`
                        : `Hello FXENGIN Academy Support,\nI would like to enroll in the course: ${course.titleEn || course.titleAr}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                    style={{
                      height: '44px',
                      fontSize: '13px',
                      fontWeight: 800,
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      background: 'rgba(34, 158, 217, 0.12)',
                      border: '1px solid rgba(34, 158, 217, 0.35)',
                      color: '#38bdf8',
                    }}
                    title={isAr ? 'تواصل مباشرة مع دعم الكورسات عبر تيليجرام' : 'Direct course support on Telegram'}
                  >
                    <FaTelegramPlane size={16} />
                    <span>{isAr ? 'دعم الكورسات والتسجيل الفوري' : 'Course Support & Direct Enrollment'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="btn-secondary"
                    style={{
                      height: '40px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <FiShare2 size={14} />
                    <span>{copied ? (isAr ? 'تم نسخ الرابط!' : 'Link Copied!') : isAr ? 'مشاركة رابط الكورس' : 'Share Course'}</span>
                  </button>
                </div>

                {/* Features & Guarantees Checklist */}
                <div style={{ borderTop: '1px solid rgba(18, 49, 92, 0.6)', paddingTop: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  {[
                    { textAr: `${course.hours} ساعة تدريبية بجودة 4K فائقة الوضوح`, textEn: `${course.hours} hours of ultra HD recorded lessons` },
                    { textAr: 'وصول مدى الحياة للمواد والتحديثات المستقبلية', textEn: 'Lifetime access to all future updates' },
                    { textAr: 'شهادة إتمام معتمدة قابلة للتحقق والمشاركة', textEn: 'Verified certificate of completion' },
                    { textAr: 'دخول مباشر لمجتمع تداول VIP مع المدرب', textEn: 'Direct access to private trader community' },
                  ].map((perk, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                      <FiCheck size={16} color="var(--success)" style={{ flexShrink: 0 }} />
                      <span>{isAr ? perk.textAr : perk.textEn}</span>
                    </div>
                  ))}

                  {/* Direct Support Desk Card */}
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(4, 136, 248, 0.08) 0%, rgba(34, 158, 217, 0.04) 100%)',
                      border: '1px solid rgba(4, 136, 248, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      fontSize: '12.5px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaTelegramPlane size={17} color="#229ED9" />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {isAr ? 'دعم الكورسات الفوري عبر تيليجرام:' : 'Direct Telegram Courses Support:'}
                      </span>
                    </div>
                    <a
                      href="https://t.me/FXENGINEducation"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#38bdf8',
                        fontWeight: 800,
                        textDecoration: 'none',
                        direction: 'ltr',
                      }}
                    >
                      @FXENGINEducation
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Anim>
        </div>
      </section>

      {/* ── 2. Course Main Details & Syllabus ── */}
      <div className="container" style={{ marginTop: '56px' }}>
        <div style={{ maxWidth: '820px' }}>
          {/* What you'll learn Box */}
          <Anim>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                marginBottom: '40px',
                boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>
                {isAr ? 'ماذا ستتعلم في هذا المسار التدريبي؟' : 'What You Will Master in This Track'}
              </h3>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {(isAr ? course.whatYouWillLearnAr : course.whatYouWillLearnEn)?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: 'rgba(22, 199, 132, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--success)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <FiCheck size={13} />
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Anim>

          {/* Curriculum Syllabus Accordion */}
          <Anim delay={50}>
            <div style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {isAr ? 'المنهج وخطة الدروس التدريبية' : 'Course Curriculum & Syllabus'}
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    {course.modules?.length} {isAr ? 'وحدات تعليمية' : 'modules'} · {course.lessons} {isAr ? 'درس فيديو' : 'lessons'} · {course.hours} {isAr ? 'ساعة إجمالية' : 'total hours'}
                  </span>
                </div>
              </div>

              {/* Modules list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {course.modules?.map((mod, modIdx) => {
                  const isOpen = openModule === modIdx;
                  return (
                    <div
                      key={modIdx}
                      style={{
                        background: 'var(--surface)',
                        border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s ease',
                      }}
                    >
                      {/* Module Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleModule(modIdx)}
                        style={{
                          width: '100%',
                          padding: '18px 24px',
                          background: 'rgba(1, 7, 30, 0.7)',
                          border: 'none',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          textAlign: isAr ? 'right' : 'left',
                          fontSize: '15px',
                          fontWeight: 700,
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>
                            {isOpen ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                          </span>
                          <span>{isAr ? mod.moduleTitleAr : mod.moduleTitleEn}</span>
                        </div>

                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {mod.lessons.length} {isAr ? 'دروس' : 'lessons'}
                        </span>
                      </button>

                      {/* Lessons inside Module */}
                      {isOpen && (
                        <div style={{ padding: '8px 16px' }}>
                          {mod.lessons.map((lesson) => {
                            const isUserEnrolled = isEnrolled || course.isEnrolled;
                            const ContentWrapper = isUserEnrolled ? Link : 'div';
                            const wrapperProps = isUserEnrolled
                              ? {
                                  href: user
                                    ? getAppRoute(`/courses/${course.slug || course.id}/learn`, user)
                                    : `/login?redirect=${encodeURIComponent(`/courses/${course.slug || course.id}/learn`)}`,
                                }
                              : {};

                            return (
                              <ContentWrapper
                                key={lesson.id}
                                {...wrapperProps}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '12px 14px',
                                  textDecoration: 'none',
                                  borderRadius: '8px',
                                  transition: 'background 0.15s ease',
                                  cursor: isUserEnrolled ? 'pointer' : 'default',
                                }}
                                onMouseEnter={(e) => {
                                  if (isUserEnrolled) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                  if (isUserEnrolled) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {isUserEnrolled ? (
                                    <FiPlayCircle size={17} color="var(--primary)" />
                                  ) : (
                                    <FiLock size={15} color="var(--text-muted)" />
                                  )}
                                  <span
                                    style={{
                                      fontSize: '14px',
                                      color: isUserEnrolled ? 'var(--text-secondary)' : 'var(--text-muted)',
                                      fontWeight: 500,
                                    }}
                                  >
                                    {isAr ? lesson.titleAr : lesson.titleEn}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    {lesson.duration}
                                  </span>
                                </div>
                              </ContentWrapper>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Anim>

          {/* Instructor Detailed Card */}
          <Anim delay={100}>
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 10px 30px rgba(0, 3, 13, 0.4)',
              }}
            >
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 20px 0' }}>
                {isAr ? 'عن مدرب ومعد الكورس' : 'About Your Instructor'}
              </h3>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'var(--primary-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: 900,
                    color: '#FFF',
                    boxShadow: '0 8px 24px rgba(4, 136, 248, 0.4)',
                  }}
                >
                  {isAr ? 'مش' : 'TS'}
                </div>

                <div style={{ flex: 1, minWidth: '260px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {isAr ? course.instructorAr : course.instructorEn}
                  </h4>
                  <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginBottom: '12px' }}>
                    {isAr ? course.instructorRoleAr : course.instructorRoleEn}
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                    {isAr ? course.instructorBioAr : course.instructorBioEn}
                  </p>
                </div>
              </div>
            </div>
          </Anim>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .course-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
