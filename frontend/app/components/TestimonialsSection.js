'use client';

import { useState, useEffect } from 'react';
import {
  FiStar,
  FiCheckCircle,
  FiTrendingUp,
  FiChevronLeft,
  FiChevronRight,
  FiPlay,
  FiPause,
} from 'react-icons/fi';
import { FaQuoteRight } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const INITIAL_REVIEWS = [
  {
    id: 1,
    nameAr: 'م. فيصل القحطاني',
    nameEn: 'Eng. Faisal Al-Qahtani',
    locationAr: 'الرياض، السعودية',
    locationEn: 'Riyadh, Saudi Arabia',
    roleAr: 'متداول VIP معتمد',
    roleEn: 'Verified VIP Trader',
    avatar: 'FQ',
    category: 'webinars',
    rating: 5,
    dateAr: 'منذ يومين',
    dateEn: '2 days ago',
    courseAr: 'ورشة السيولة البنكية المباشرة (SMC)',
    courseEn: 'Institutional Liquidity Live Workshop (SMC)',
    metricAr: '+34% نمو المحفظة في شهرين',
    metricEn: '+34% Portfolio Growth in 2 Months',
    metricPositive: true,
    textAr:
      'حضور ورشة السيولة البنكية مع د. كريم غير طريقة نظرتي للشارت تماماً. كنت دائماً أقع في فخاخ صناع السوق وكسر القمم الكاذب، والآن أصبحت أدخل مع السيولة المؤسسية بنسب عائد تتجاوز 1:3. المنصة الأكثر احترافية بلا منازع.',
    textEn:
      'Attending the institutional liquidity workshop with Dr. Karim completely changed how I read the charts. I used to fall into liquidity traps, but now I execute alongside smart money with 1:3+ risk-to-reward ratios. Truly top tier.',
  },
  {
    id: 2,
    nameAr: 'سارة المنصوري',
    nameEn: 'Sara Al-Mansoori',
    locationAr: 'دبي، الإمارات',
    locationEn: 'Dubai, UAE',
    roleAr: 'خريجة الأكاديمية الاحترافية',
    roleEn: 'Academy Graduate',
    avatar: 'SM',
    category: 'funding',
    rating: 5,
    dateAr: 'منذ أسبوع',
    dateEn: '1 week ago',
    courseAr: 'دورة نماذج الهارمونيك واختبارات التمويل',
    courseEn: 'Advanced Harmonics & Prop Firm Evaluation',
    metricAr: 'اجتياز حساب تمويل 100K $ (FTMO)',
    metricEn: 'Passed $100K Funded Account (FTMO)',
    metricPositive: true,
    textAr:
      'بفضل الله ثم أكاديمية FXENGIN نجحت في اجتياز تحدي شركة التمويل والحصول على حساب ممول بقيمة 100,000$. أسلوب الشرح العملي والتطبيقات المباشرة في مجتمع المتداولين منحني الانضباط النفسي وإدارة المخاطر الصارمة.',
    textEn:
      'Thanks to FXENGIN Academy, I passed my prop firm challenge and got a $100K funded trading account. Practical training and risk management rules gave me total discipline.',
  },
  {
    id: 3,
    nameAr: 'أحمد خليل',
    nameEn: 'Ahmed Khalil',
    locationAr: 'القاهرة، مصر',
    locationEn: 'Cairo, Egypt',
    roleAr: 'مشترك التحليلات اليومية',
    roleEn: 'Daily Analytics Subscriber',
    avatar: 'AK',
    category: 'analytics',
    rating: 5,
    dateAr: 'منذ 3 أيام',
    dateEn: '3 days ago',
    courseAr: 'باقة التحليلات الفنية اللحظية والذهب',
    courseEn: 'Daily Technical Setups & Gold Analysis',
    metricAr: 'دقة إشارات 88% على الذهب XAU/USD',
    metricEn: '88% Precision on Gold (XAU/USD)',
    metricPositive: true,
    textAr:
      'التحليلات اليومية لموجات الذهب واليورو دولار قمة في الدقة والواقعية. لا يكتفون بإعطاء مستويات الدخول، بل يشرحون الأسباب المنطقية وسيناريوهات البدائل. وفرت علي الكثير من الوقت والتردد وضاعفت أرباحي الشهرية.',
    textEn:
      'The daily Gold and EUR/USD wave analyses are pinpoint accurate. They explain the logical rationale behind every entry with alternative scenarios, saving me valuable hours of guesswork.',
  },
  {
    id: 4,
    nameAr: 'خالد المطيري',
    nameEn: 'Khaled Al-Mutairi',
    locationAr: 'الكويت',
    locationEn: 'Kuwait',
    roleAr: 'متداول متقدم',
    roleEn: 'Advanced Trader',
    avatar: 'KM',
    category: 'courses',
    rating: 5,
    dateAr: 'منذ 5 أيام',
    dateEn: '5 days ago',
    courseAr: 'مسار العرض والطلب المتقدم وإدارة رأس المال',
    courseEn: 'Supply & Demand Mastery & Risk Control',
    metricAr: 'تقليص التراجع (Drawdown) لأقل من 4%',
    metricEn: 'Drawdown Reduced Below 4%',
    metricPositive: true,
    textAr:
      'تداولت في أسواق الفوركس لأكثر من 4 سنوات وخسرت الكثير بسبب التشتت. الكورسات وورش العمل رتبت أفكاري وعلمتني متى لا أدخل السوق أصلاً. مؤشرات السيولة المرفقة بالورش أداة لا غنى عنها على الشارت.',
    textEn:
      'I traded forex for over 4 years with scattered results. FXENGIN courses structured my edge and taught me when NOT to enter the market. The proprietary indicators are essential tools on my charts.',
  },
  {
    id: 5,
    nameAr: 'طارق بوعزيز',
    nameEn: 'Tariq Bouaziz',
    locationAr: 'الدار البيضاء، المغرب',
    locationEn: 'Casablanca, Morocco',
    roleAr: 'عضو مجتمع FXENGIN',
    roleEn: 'FXENGIN Community Member',
    avatar: 'TB',
    category: 'courses',
    rating: 5,
    dateAr: 'منذ أسبوعين',
    dateEn: '2 weeks ago',
    courseAr: 'مسار المتداول الشامل (من الصفر للاحتراف)',
    courseEn: 'Complete Trader Roadmap (Zero to Pro)',
    metricAr: 'أول سحب أرباح حقيقي 4,850$',
    metricEn: 'First Clean Withdrawal $4,850',
    metricPositive: true,
    textAr:
      'بدأت من الصفر تماماً وكنت أخشى تعقيدات التحليل الفني. التدرج المنهجي في الدروس والاختبارات التفاعلية جعلت الفهم سهلاً وبسيطاً. اليوم حققت أول عملية سحب أرباح حقيقية بفضل المتابعة المستمرة من الفريق.',
    textEn:
      'Started from zero and was intimidated by chart technicals. The progressive roadmap and interactive quizzes made everything intuitive. Today I completed my first $4,850 withdrawal.',
  },
  {
    id: 6,
    nameAr: 'د. عمر الزعبي',
    nameEn: 'Dr. Omar Al-Zoubi',
    locationAr: 'عَمّان، الأردن',
    locationEn: 'Amman, Jordan',
    roleAr: 'مستثمر ومحلل مالي',
    roleEn: 'Investor & Financial Analyst',
    avatar: 'OZ',
    category: 'webinars',
    rating: 5,
    dateAr: 'منذ أسبوع',
    dateEn: '1 week ago',
    courseAr: 'المحاضرة المباشرة وإدارة المحافظ الاستثمارية',
    courseEn: 'Live Masterclass & Portfolio Management',
    metricAr: 'عائد سنوي تراكمي +58%',
    metricEn: '+58% Cumulative Annual Yield',
    metricPositive: true,
    textAr:
      'ما يميز FXENGIN عن باقي المنصات هو التركيز الصارم على حماية رأس المال وسيكولوجية المتداول. المحاضرات المباشرة ومناقشة الفرص لحظة بلحظة تعطي ثقة لا تقدر بثمن لكل متداول ومستثمر طموح.',
    textEn:
      'What sets FXENGIN apart is the relentless focus on capital preservation and trader psychology. Real-time live sessions discussing opportunities provide invaluable confidence.',
  },
  {
    id: 7,
    nameAr: 'م. سامي الهاشمي',
    nameEn: 'Eng. Sami Al-Hashimi',
    locationAr: 'مسقط، عُمان',
    locationEn: 'Muscat, Oman',
    roleAr: 'متداول ممول معتمد',
    roleEn: 'Funded Trader',
    avatar: 'SH',
    category: 'funding',
    rating: 5,
    dateAr: 'منذ 4 أيام',
    dateEn: '4 days ago',
    courseAr: 'برنامج تأهيل واجتياز اختبارات شركات التمويل',
    courseEn: 'Prop Firm Evaluation Preparation Program',
    metricAr: 'اجتياز حساب 200,000$ في مرحلتين',
    metricEn: 'Passed $200,000 Funded Account in 2 Phases',
    metricPositive: true,
    textAr:
      'القواعد الصارمة التي تعلمتها هنا بخصوص إدارة حجم العقد والحد اليومي للخسارة كانت الفارق الحقيقي بين الفشل والنجاح في شركات التمويل. المنصة قدمت لي الدعم الفني والنفسي طوال فترة الاختبار.',
    textEn:
      'The strict risk management and daily loss limit rules taught here were the game changer between failing and passing prop firm challenges. Full support throughout the challenge.',
  },
  {
    id: 8,
    nameAr: 'رنا عبد العزيز',
    nameEn: 'Rana Abdulaziz',
    locationAr: 'الرياض، السعودية',
    locationEn: 'Riyadh, Saudi Arabia',
    roleAr: 'مشتركة التحليلات اليومية',
    roleEn: 'Daily Analytics Member',
    avatar: 'RA',
    category: 'analytics',
    rating: 5,
    dateAr: 'منذ 6 أيام',
    dateEn: '6 days ago',
    courseAr: 'تحليلات صفقات السوينغ والمؤشرات الأمريكية',
    courseEn: 'Swing Setups & US Indices Analysis',
    metricAr: 'معدل ربح 85% على عقود ناسداك (US100)',
    metricEn: '85% Win Rate on US100 Nasdaq',
    metricPositive: true,
    textAr:
      'تحديثات ما قبل افتتاح بورصة نيويورك توفر علي ساعات طويلة من القراءة والتحليل. الدخول مع السيولة المؤسسية ونقاط الانعكاس دقيقة جداً. شكر وتقدير لفريق المحللين المحترفين في FXENGIN.',
    textEn:
      'Pre-market NY open updates save me countless hours. Entry levels with institutional flow are extremely precise. Huge thanks to the professional analyst team at FXENGIN.',
  },
];

export default function TestimonialsSection() {
  const { isAr } = useLanguage();
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data;
        if (Array.isArray(list) && list.length > 0) {
          setReviews(list);
        }
      })
      .catch((err) => console.error('Failed to load testimonials:', err));
  }, []);

  // Slider State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [touchStartX, setTouchStartX] = useState(null);

  // Responsive visible items count
  useEffect(() => {
    const updateVisibleCount = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // Maximum slider index
  const maxIndex = Math.max(0, reviews.length - visibleCount);

  // Keep index within bounds if screen size changes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Slider controls
  const nextSlide = () => {
    if (maxIndex <= 0) return;
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    if (maxIndex <= 0) return;
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // Auto-play interval
  useEffect(() => {
    if (!isAutoPlayEnabled || isPaused || maxIndex <= 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4200);

    return () => clearInterval(timer);
  }, [isAutoPlayEnabled, isPaused, maxIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX - touchEndX;

    if (Math.abs(diffX) > 40) {
      if (isAr) {
        // In RTL: swipe to left moves back, swipe to right moves next
        if (diffX > 0) {
          prevSlide();
        } else {
          nextSlide();
        }
      } else {
        // In LTR: swipe to left moves next, swipe to right moves prev
        if (diffX > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
      }
    }
    setTouchStartX(null);
  };

  // Card slide translation offset
  // In RTL, positive translateX moves elements to the right, showing next items
  // In LTR, negative translateX moves elements to the left, showing next items
  const slideOffsetPercent = (currentIndex * 100) / visibleCount;
  const transformStyle = isAr ? `translateX(${slideOffsetPercent}%)` : `translateX(-${slideOffsetPercent}%)`;

  return (
    <section
      id="testimonials"
      style={{
        position: 'relative',
        padding: 'clamp(3.5rem, 6vw, 5.5rem) 0',
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, rgba(6, 20, 47, 0.75) 50%, var(--bg-primary) 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Ambient Lighting Orbs */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '10%',
          right: '8%',
          width: 'clamp(16rem, 28vw, 24rem)',
          height: 'clamp(16rem, 28vw, 24rem)',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.09) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: 'clamp(16rem, 28vw, 24rem)',
          height: 'clamp(16rem, 28vw, 24rem)',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '48rem', margin: '0 auto 2.5rem auto' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <span
              style={{
                background: 'rgba(251, 135, 4, 0.12)',
                border: '1px solid rgba(251, 135, 4, 0.3)',
                color: 'var(--accent)',
                fontSize: '0.8125rem',
                fontWeight: 700,
                padding: '0.35rem 0.875rem',
                borderRadius: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FiStar size={14} color="var(--accent)" />
              {isAr ? 'تجارب وقصص نجاح المتداولين' : 'Trader Testimonials & Success Stories'}
            </span>
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              color: 'var(--text-primary)',
              margin: '0 0 1rem 0',
              letterSpacing: '-0.02em',
            }}
          >
            {isAr ? (
              <>
                ماذا يقول <span className="text-gradient-brand">عملاؤنا ومتداولونا</span> عن FXENGIN؟
              </>
            ) : (
              <>
                What Our <span className="text-gradient-brand">Traders & Clients</span> Say About FXENGIN
              </>
            )}
          </h2>

          <p
            style={{
              fontSize: 'clamp(0.9375rem, 1.1vw, 1.0625rem)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            {isAr
              ? 'انضم إلى أكثر من 50,000 متداول ومستثمر يثقون بأكاديمية وتحليلات FXENGIN لبناء مسيرتهم المالية بثقة واحترافية.'
              : 'Join over 50,000+ traders and investors across 18 countries who rely on FXENGIN education and live market analytics.'}
          </p>
        </div>

        {/* Slider Controls Top Bar (Indicator + Arrows) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            padding: '0 0.5rem',
          }}
        >
          {/* Status Indicator (Auto-sliding active / paused badge) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                color: isPaused ? 'var(--text-muted)' : 'var(--accent)',
                background: isPaused ? 'rgba(255, 255, 255, 0.05)' : 'rgba(251, 135, 4, 0.1)',
                border: isPaused ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(251, 135, 4, 0.25)',
                padding: '0.25rem 0.65rem',
                borderRadius: '1rem',
                transition: 'all 0.25s ease',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isPaused ? 'var(--text-muted)' : 'var(--accent)',
                  boxShadow: isPaused ? 'none' : '0 0 8px var(--accent)',
                  display: 'inline-block',
                }}
              />
              <span>
                {isPaused
                  ? (isAr ? 'تم الإيقاف مؤقتاً للقراءة' : 'Paused for reading')
                  : (isAr ? 'حركة تلقائية مستمرة' : 'Auto-moving slider')}
              </span>
            </span>

            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
              title={isAutoPlayEnabled ? (isAr ? 'إيقاف الحركة التلقائية' : 'Pause auto-play') : (isAr ? 'تشغيل الحركة التلقائية' : 'Resume auto-play')}
              style={{
                background: 'rgba(6, 20, 47, 0.7)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '1.875rem',
                height: '1.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {isAutoPlayEnabled ? <FiPause size={11} /> : <FiPlay size={11} />}
            </button>
          </div>

          {/* Navigation Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={isAr ? nextSlide : prevSlide}
              aria-label={isAr ? 'التالي' : 'Previous'}
              style={{
                width: '2.35rem',
                height: '2.35rem',
                borderRadius: '0.625rem',
                background: 'rgba(6, 20, 47, 0.85)',
                border: '1px solid rgba(18, 49, 92, 0.6)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 3, 13, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'rgba(251, 135, 4, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.6)';
                e.currentTarget.style.background = 'rgba(6, 20, 47, 0.85)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <FiChevronRight size={18} />
            </button>

            <button
              type="button"
              onClick={isAr ? prevSlide : nextSlide}
              aria-label={isAr ? 'السابق' : 'Next'}
              style={{
                width: '2.35rem',
                height: '2.35rem',
                borderRadius: '0.625rem',
                background: 'rgba(6, 20, 47, 0.85)',
                border: '1px solid rgba(18, 49, 92, 0.6)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 3, 13, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.background = 'rgba(251, 135, 4, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.6)';
                e.currentTarget.style.background = 'rgba(6, 20, 47, 0.85)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <FiChevronLeft size={18} />
            </button>
          </div>
        </div>

        {/* Testimonials Auto-Moving Slider Viewport */}
        <div
          style={{
            overflow: 'hidden',
            margin: '0 -0.625rem',
            padding: '0.5rem 0.625rem 1rem 0.625rem',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            style={{
              display: 'flex',
              transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
              transform: transformStyle,
              willChange: 'transform',
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  flex: `0 0 ${100 / visibleCount}%`,
                  maxWidth: `${100 / visibleCount}%`,
                  padding: '0 0.625rem',
                  boxSizing: 'border-box',
                  display: 'flex',
                }}
              >
                <div
                  className="card"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.88) 0%, rgba(1, 7, 30, 0.94) 100%)',
                    border: '1px solid rgba(18, 49, 92, 0.45)',
                    borderRadius: '1rem',
                    padding: '1.35rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
                    boxShadow: '0 8px 24px rgba(0, 3, 13, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(251, 135, 4, 0.45)';
                    e.currentTarget.style.boxShadow =
                      '0 14px 32px rgba(0, 3, 13, 0.7), 0 0 22px rgba(251, 135, 4, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.borderColor = 'rgba(18, 49, 92, 0.45)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 3, 13, 0.5)';
                  }}
                >
                  {/* Decorative Quote Watermark */}
                  <div
                    aria-hidden
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      [isAr ? 'left' : 'right']: '1rem',
                      opacity: 0.06,
                      color: 'var(--accent)',
                      pointerEvents: 'none',
                    }}
                  >
                    <FaQuoteRight size={38} />
                  </div>

                  {/* Card Top: Author Info + Rating */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1rem',
                      }}
                    >
                      {/* Avatar + Name & Location */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '2.75rem',
                            height: '2.75rem',
                            borderRadius: '50%',
                            background:
                              'linear-gradient(135deg, rgba(4, 136, 248, 0.3), rgba(251, 135, 4, 0.3))',
                            border: '1px solid rgba(251, 135, 4, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--accent)',
                            fontWeight: 800,
                            fontSize: '0.875rem',
                            flexShrink: 0,
                          }}
                        >
                          {review.avatar}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {isAr ? review.nameAr : review.nameEn}
                            </span>
                            <FiCheckCircle
                              size={13}
                              color="var(--success)"
                              title={isAr ? 'متداول موثق' : 'Verified Trader'}
                            />
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                            {isAr ? review.locationAr : review.locationEn}
                          </div>
                        </div>
                      </div>

                      {/* Stars Rating */}
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[...Array(review.rating)].map((_, i) => (
                          <FiStar key={i} size={13} fill="#FB8704" color="#FB8704" />
                        ))}
                      </div>
                    </div>

                    {/* Achievement / Metric Pill */}
                    {review.metricAr && (
                      <div style={{ marginBottom: '0.875rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            color: 'var(--accent)',
                            background: 'rgba(251, 135, 4, 0.1)',
                            border: '1px solid rgba(251, 135, 4, 0.25)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '0.375rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontFamily: 'monospace',
                          }}
                        >
                          <FiTrendingUp size={11} color="var(--accent)" />
                          {isAr ? review.metricAr : review.metricEn}
                        </span>
                      </div>
                    )}

                    {/* Review Body Text */}
                    <p
                      style={{
                        fontSize: '0.8125rem',
                        lineHeight: 1.65,
                        color: 'var(--text-secondary)',
                        margin: '0 0 1rem 0',
                      }}
                    >
                      "{isAr ? review.textAr : review.textEn}"
                    </p>
                  </div>

                  {/* Card Footer: Course Tag + Date */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: '0.75rem',
                      fontSize: '0.6875rem',
                      color: 'var(--text-muted)',
                      gap: '0.5rem',
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '13rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      {isAr ? review.courseAr : review.courseEn}
                    </span>
                    <span style={{ flexShrink: 0 }}>{isAr ? review.dateAr : review.dateEn}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slider Pagination Dots Indicator */}
        {maxIndex > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              marginTop: '1.25rem',
            }}
          >
            {[...Array(maxIndex + 1)].map((_, idx) => {
              const isActive = currentIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{
                    border: 'none',
                    padding: 0,
                    width: isActive ? '1.85rem' : '0.55rem',
                    height: '0.45rem',
                    borderRadius: '1rem',
                    background: isActive
                      ? 'linear-gradient(90deg, var(--accent) 0%, #FFB020 100%)'
                      : 'rgba(255, 255, 255, 0.18)',
                    boxShadow: isActive ? '0 0 10px rgba(251, 135, 4, 0.6)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
