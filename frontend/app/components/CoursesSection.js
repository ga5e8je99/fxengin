'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Anim from './Anim';
import { FiBookOpen, FiClock, FiShoppingCart, FiArrowLeft, FiPlayCircle, FiCheckCircle } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';
import { fetchCourses } from '../services/coursesService';
import { getCoursePricing, isUserEnrolledInCourse } from '../utils/coursePricing';

function CourseCard({ course, t, isAr, user, delay }) {
  const targetHref = `/courses/${course.slug || course.id || 1}`;

  return (
    <Anim
      delay={delay}
      className="card course-card"
      as="article"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--surface-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      {/* 16:9 Thumbnail Area */}
      <div style={{
        height: '180px',
        background: 'var(--surface-elevated)',
        borderRadius: '11px 11px 0 0',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <img
          src={course.img || '/assets/Images/test/course1.webp'}
          alt={course.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform 0.3s ease-out',
          }}
          className="course-img"
        />

        {/* Soft overlay gradient for contrast */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(6,20,47,0.9) 0%, rgba(6,20,47,0.2) 60%, rgba(0,3,13,0.4) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Level & Enrolled badges */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 2,
        }}>
          <span className="badge" style={{
            background: 'rgba(1, 7, 30, 0.75)',
            backdropFilter: 'blur(6px)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '6px',
          }}>
            {course.level}
          </span>

          {course.isEnrolled && (
            <span className="badge" style={{
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
            }}>
              <FiCheckCircle size={12} />
              <span>{isAr ? 'مشترك بالفعل' : 'Enrolled'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: 1.35, color: 'var(--text-primary)' }}>
          {course.title}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
          {course.desc}
        </p>

        {/* Meta info */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FiBookOpen size={13} />
            {course.lessons} {t.courses.lessons}
          </span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <FiClock size={13} />
            {course.hours} {t.courses.hours}
          </span>
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Card Footer: Price & Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{
                fontSize: '18px',
                fontWeight: 800,
                color: course.isFree ? 'var(--success)' : 'var(--accent)',
                fontFamily: 'monospace',
              }}>
                {course.price}
              </span>
              {course.hasDiscount && (
                <span style={{
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                  fontFamily: 'monospace',
                }}>
                  {course.originalPriceStr}
                </span>
              )}
            </div>
            {course.hasDiscount && (
              <span style={{ fontSize: '10px', color: '#F6465D', fontWeight: 700 }}>
                {isAr ? `خصم ${course.discountPercent}%` : `${course.discountPercent}% OFF`}
              </span>
            )}
          </div>

          {course.isEnrolled ? (
            <Link
              href={getAppRoute(`/courses/${course.slug || course.id}/learn`, user)}
              className="btn-primary"
              style={{
                height: '38px',
                padding: '0 16px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 3px 12px rgba(16, 185, 129, 0.35)',
                fontWeight: 800,
              }}
            >
              <FiPlayCircle size={15} />
              <span>{isAr ? 'ادخل الكورس' : 'Enter Course'}</span>
            </Link>
          ) : (
            <Link
              href={getAppRoute(targetHref, user)}
              className="btn-primary"
              style={{
                height: '38px',
                padding: '0 18px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: course.isFree ? undefined : 'linear-gradient(135deg, var(--accent), #F6465D)',
              }}
            >
              <FiShoppingCart size={14} />
              <span>{course.isFree ? (isAr ? 'عرض الكورس' : 'View Course') : (isAr ? 'تفاصيل الكورس' : 'Course Details')}</span>
            </Link>
          )}
        </div>
      </div>
    </Anim>
  );
}

export default function CoursesSection() {
  const { t, isAr } = useLanguage();
  const { user } = useAuth();
  const [liveCourses, setLiveCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchCourses();
        if (isMounted && res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((c) => {
            const pricing = getCoursePricing(c, 'usdt');
            const isEnrolled = isUserEnrolledInCourse(user, c) || Boolean(c.isEnrolled);
            const hours = c.totalDurationMinutes ? Math.max(1, Math.round(c.totalDurationMinutes / 60)) : 12;
            const diff = (c.difficulty || 'Intermediate').toUpperCase();
            const levelLabel = diff.includes('BEG') ? t.courses.beginner : diff.includes('ADV') ? t.courses.advanced : t.courses.intermediate || 'متوسط';

            return {
              id: c.id,
              slug: c.slug || c.id,
              badge: c.category || 'ACADEMY',
              level: levelLabel,
              title: isAr ? c.title : (c.titleEn || c.title),
              desc: isAr ? (c.description || c.subtitle) : (c.descriptionEn || c.description || c.subtitle),
              price: pricing.isFree ? t.courses.free : pricing.currentPriceStr,
              hasDiscount: pricing.hasDiscount,
              originalPriceStr: pricing.originalPriceStr,
              discountPercent: pricing.discountPercent,
              isFree: pricing.isFree,
              isEnrolled,
              lessons: c.lessonsCount || 1,
              hours,
              img: c.thumbnailUrl || '/assets/Images/test/course1.webp',
            };
          });
          setLiveCourses(mapped);
        }
      } catch (err) {
        console.warn('CoursesSection fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [isAr, t, user]);

  if (isLoading || liveCourses.length === 0) {
    return null;
  }

  return (
    <section
      id="courses"
      className="section-surface"
      style={{
        background: 'var(--surface)',
        padding: 'clamp(2.5rem, 5vw, 5rem) 0',
        position: 'relative',
        boxShadow: '0 1.5rem 3.75rem rgba(0, 3, 13, 0.45), 0 -1.5rem 3.75rem rgba(0, 3, 13, 0.45)',
      }}
    >
      <div className="container">
        {/* Section Header */}
        <Anim>
          <div className="section-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'clamp(1.5rem, 3vw, 2.25rem)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <div>
              <div style={{ marginBottom: '0.375rem' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                  FXENGIN ACADEMY
                </span>
              </div>
              <h2 style={{ fontSize: 'clamp(1.35rem, 2.5vw + 0.5rem, 2.25rem)', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {t.courses.title}
              </h2>
            </div>
            <Link href={getAppRoute('/courses', user)} className="btn-secondary hide-mobile" style={{ fontSize: '0.875rem', textDecoration: 'none' }}>
              {t.courses.viewAll}
              <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
            </Link>
          </div>
        </Anim>

        {/* Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18.75rem), 1fr))',
          gap: 'clamp(1rem, 2vw, 1.5rem)',
        }}>
          {liveCourses.map((course, idx) => (
            <CourseCard
              key={course.slug || course.id || idx}
              course={course}
              t={t}
              isAr={isAr}
              user={user}
              delay={idx * 100}
            />
          ))}
        </div>

        {/* Mobile View-All link */}
        <div className="show-mobile" style={{ display: 'none', textAlign: 'center', marginTop: '28px' }}>
          <Link href={getAppRoute('/courses', user)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
            {t.courses.viewAll}
            <FiArrowLeft size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
          </Link>
        </div>
      </div>

      <style>{`
        .course-card:hover .course-img {
          transform: scale(1.04);
        }
      `}</style>
    </section>
  );
}
