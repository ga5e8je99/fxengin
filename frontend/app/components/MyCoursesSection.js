'use client';
import Link from 'next/link';
import { FiBookOpen, FiClock, FiPlayCircle, FiCheckCircle, FiArrowLeft, FiArrowRight, FiAward } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { getAppRoute } from '../utils/routes';
import Anim from './Anim';

export default function MyCoursesSection() {
  const { user, isAuthenticated } = useAuth();
  const { isAr } = useLanguage();

  if (!isAuthenticated || !user) return null;

  const courses = Array.isArray(user.enrolledCourses) ? user.enrolledCourses : [];
  if (courses.length === 0) return null;

  return (
    <section
      id="my-courses"
      className="section-surface"
      style={{
        padding: '60px 0 40px',
        background: 'var(--surface)',
        position: 'relative',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 20px 50px rgba(0, 3, 13, 0.45), 0 -20px 50px rgba(0, 3, 13, 0.45)',
      }}
    >
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
              <FiBookOpen size={16} />
              <span>{isAr ? 'مساحة التعلم الخاصة بك' : 'Your Learning Workspace'}</span>
            </div>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {isAr ? (
                <>
                  دوراتك <span className="text-gradient-brand">الحالية والمسجلة</span>
                </>
              ) : (
                <>
                  Your Enrolled <span className="text-gradient-brand">Courses & Progress</span>
                </>
              )}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              href={getAppRoute('/profile', user)}
              className="btn-secondary"
              style={{
                height: '38px',
                padding: '0 16px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <FiAward size={15} color="var(--accent)" />
              <span>{isAr ? 'عرض حسابي والشهادات' : 'View Account & Certificates'}</span>
            </Link>

            <a
              href="#courses"
              className="btn-ghost"
              style={{
                height: '38px',
                padding: '0 16px',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isAr ? 'استكشاف المزيد من الدورات' : 'Explore More Courses'}</span>
              <FiArrowLeft size={14} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
            </a>
          </div>
        </div>

        {/* Course Cards Grid or Empty State */}
        {courses.length === 0 ? (
          <Anim delay={0.1}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(4, 136, 248, 0.04) 100%)',
                borderRadius: '20px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(4, 136, 248, 0.1)',
                  border: '1px solid rgba(4, 136, 248, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <FiBookOpen size={28} />
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                  {isAr ? 'لم تشترك في أي دورة تدريبية حتى الآن' : 'You have not enrolled in any courses yet'}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
                  {isAr
                    ? 'ابدأ رحلتك الاحترافية في عالم التداول باختيار إحدى دورات الأكاديمية المصممة من قبل نخبة الخبراء والمحللين.'
                    : 'Start your trading journey by choosing one of our academy courses designed by top market experts.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
                <a
                  href="#courses"
                  className="btn-primary"
                  style={{
                    height: '42px',
                    padding: '0 24px',
                    fontSize: '13.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <FiPlayCircle size={16} />
                  <span>{isAr ? 'استكشاف دورات الأكاديمية' : 'Explore Academy Courses'}</span>
                </a>
              </div>
            </div>
          </Anim>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
            {courses.map((course, idx) => (
            <Anim key={course.id} delay={idx * 0.1} className="card" style={{ background: 'var(--surface-elevated)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Thumbnail Header */}
              <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                <img
                  src={course.img}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1, 7, 30, 0.9) 0%, rgba(1, 7, 30, 0.2) 60%, transparent 100%)' }} />
                
                <div style={{ position: 'absolute', top: '12px', right: '12px', left: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge" style={{ background: 'rgba(1, 7, 30, 0.8)', backdropFilter: 'blur(8px)', color: 'var(--text-primary)', fontSize: '11px', border: '1px solid var(--border)' }}>
                    {course.category}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', background: 'rgba(4, 136, 248, 0.85)', padding: '3px 8px', borderRadius: '6px', backdropFilter: 'blur(6px)' }}>
                    {course.progress}% {isAr ? 'مكتمل' : 'Completed'}
                  </span>
                </div>
              </div>

              {/* Course Body */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {isAr ? course.title : (course.titleEn || course.title)}
                </h3>

                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'المدرب: ' : 'Instructor: '}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{course.instructor}</span>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{isAr ? 'آخر درس وصلت إليه:' : 'Last accessed lesson:'}</span>
                  <div style={{ color: 'var(--text-primary)', marginTop: '2px', fontWeight: 500 }}>
                    {course.lastLesson}
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>{course.completedLessons} / {course.totalLessons} {isAr ? 'درساً' : 'lessons'}</span>
                    <span>{course.hours} {isAr ? 'ساعة تدريبية' : 'hours'}</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.progress}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '3px' }} />
                  </div>
                </div>

                {/* Action CTA */}
                <div style={{ paddingTop: '8px' }}>
                  <Link
                    href={getAppRoute(`/courses/${course.id}/learn`, user)}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      height: '42px',
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      fontSize: '13.5px',
                    }}
                  >
                    <FiPlayCircle size={17} />
                    <span>{isAr ? 'متابعة التعلم الآن' : 'Continue Learning Now'}</span>
                  </Link>
                </div>
              </div>
            </Anim>
          ))}
          </div>
        )}
      </div>
    </section>
  );
}
