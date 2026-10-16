'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  FiChevronDown,
  FiAward,
  FiTrendingUp,
  FiShield,
  FiBookOpen,
  FiCheckCircle,
  FiArrowLeft,
  FiArrowRight,
  FiHelpCircle,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import Anim from './Anim';

export default function ForexEngineerSeoSection() {
  const { isAr } = useLanguage();
  const [openFaq, setOpenFaq] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? -1 : index);
  };

  const FAQS = [
    {
      qAr: 'من هو مهندس الفوركس وما هي رؤية منصة FXENGIN؟',
      qEn: 'Who is Forex Engineer and what is the mission of FXENGIN?',
      aAr: 'مهندس الفوركس هو خبير ومحلل مالي واستشاري تداول يمتلك خبرة تتجاوز 10 سنوات في أسواق العملات الأجنبية والذهب والسلع. تهدف منصة FXENGIN إلى تمكين المتداولين العرب من الانتقال من مرحلة التخبط العشوائي إلى الاحتراف المؤسسي، عبر تدريس استراتيجيات السيولة المتقدمة (Smart Money Concepts) وتوفير بيئة تداول شاملة تجمع بين التدريب الأكاديمي، التحليلات الحية، وغرف البث المباشر اليومية.',
      aEn: 'Forex Engineer is a senior financial analyst and algorithmic trading strategist with over a decade of market experience. FXENGIN is dedicated to empowering traders worldwide through institutional Smart Money Concepts (SMC), certified mentorship, live market rooms, and transparent execution.',
    },
    {
      qAr: 'كيف أبدأ التداول في سوق الفوركس والعملات من الصفر عبر الأكاديمية؟',
      qEn: 'How can beginners start learning forex and trading from scratch?',
      aAr: 'تبدأ رحلتك عبر مسار "التأسيس والاحتراف" المتاح على منصة FXENGIN، والذي يبدأ بتعريف المفاهيم الأساسية (أزواج العملات، الرافعة المالية، الهامش، وحساب النقاط)، ثم التدرج إلى التحليل الفني وقراءة الشموع اليابانية وسلوك السعر، مع التركيز المكثف على سيكولوجية المتداول وقواعد إدارة رأس المال وحماية المحفظة قبل الانتقال إلى التداول الحقيقي.',
      aEn: 'You start through our structured foundation curriculum covering basic currency mechanics, leverage, and price action, advancing progressively towards risk management and institutional execution strategies.',
    },
    {
      qAr: 'ما هي استراتيجيات التداول التي يتم تدريسها (Smart Money Concepts SMC)؟',
      qEn: 'What trading strategies are taught in the academy (SMC)?',
      aAr: 'نركز على استراتيجيات صانع السوق والسيولة البنكية SMC، وتشمل: تحديد هيكل السوق (Market Structure Break & Change of Character)، اقتناص كتل الأوامر المؤسسية (Order Blocks)، مناطق عدم التوازن السعري (Fair Value Gaps - FVG)، وسحب السيولة (Liquidity Sweeps)، مما يمنح المتداول صفقات بنسب عائد إلى مخاطرة عالية جداً (تصل إلى 1:4 وأكثر).',
      aEn: 'We specialize in Smart Money Concepts (SMC), focusing on institutional order blocks, fair value gaps (FVG), liquidity sweeps, and high risk-to-reward trade execution.',
    },
    {
      qAr: 'كيف أختار أفضل وسيط تداول فوركس موثوق وآمن؟',
      qEn: 'How do I choose the best regulated forex broker partner?',
      aAr: 'توفر منصة FXENGIN قسماً مخصصاً لـ "شركاء الوساطة" يضم كبرى شركات الوساطة وشركات التمويل المرخصة من الفئة الأولى عالمياً (مثل FCA و CySEC و ASIC). وتتميز هذه الشركات بتقديم سبريد خام من 0.0 نقطة، تنفيذ فائق السرعة، حسابات إسلامية خالية تماماً من فوائد التبييت، بالإضافة إلى بونص إيداع ترحيبي وعروض كاش باك حصرية لعملاء مهندس الفوركس.',
      aEn: 'Our Broker Partners portal features Tier-1 regulated brokers and prop firms offering raw 0.0 spreads, instant deposits/withdrawals, swap-free Islamic accounts, and exclusive cash back benefits.',
    },
    {
      qAr: 'هل توفر منصة FXENGIN تحليلات يومية وبثاً مباشراً لفرص السوق؟',
      qEn: 'Does FXENGIN provide daily market analysis and live trading sessions?',
      aAr: 'نعم، المنصة مزودة بقسم تحليلات فنية يومي يغطي الذهب وأزواج العملات الرئيسية (EUR/USD, GBP/USD, USD/JPY)، بالإضافة إلى استوديو البث المباشر التفاعلي الذي يعقد جلسات يومية حية تتيح للطلاب التداول جنباً إلى جنب مع المحاضر ومتابعة افتتاح جلسات لندن ونيويورك مباشرة.',
      aEn: 'Yes, we provide daily technical outlooks on Gold and major FX pairs, alongside interactive live trading rooms covering European and US market openings.',
    },
  ];

  return (
    <section
      className="section-seo-authority"
      style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, #030816 50%, var(--surface) 100%)',
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Background Ambient Glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(4, 136, 248, 0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header Block */}
        <Anim>
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '30px', background: 'rgba(251, 135, 4, 0.12)', border: '1px solid rgba(251, 135, 4, 0.3)', marginBottom: '16px' }}>
              <FiAward style={{ color: '#FB8704' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#FB8704' }}>
                {isAr ? 'دليل مهندس الفوركس الرسمي • FXENGIN Trading Hub' : 'Official Forex Engineer Authority • FXENGIN'}
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(26px, 3.2vw, 40px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                lineHeight: 1.3,
                margin: '0 0 18px',
              }}
            >
              {isAr ? (
                <>
                  منظومة <span className="text-gradient-brand">مهندس الفوركس</span> لاحتراف التداول والأسواق العالمية
                </>
              ) : (
                <>
                  The <span className="text-gradient-brand">Forex Engineer</span> Ecosystem for Professional Trading
                </>
              )}
            </h2>

            <p
              style={{
                fontSize: 'clamp(14px, 1.4vw, 16px)',
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              {isAr
                ? 'مرجعك العربي المعتمد لتعلم تداول الفوركس، الذهب، والعملات الأجنبية من البداية وحتى التداول المؤسسي. ندمج بين استراتيجيات صناع السوق SMC، التحليلات الفنية اللحظية، والشراكات الموثقة مع أقوى وسطاء العالم.'
                : 'Your trusted authority for mastering forex, commodities, and currency markets. We combine institutional Smart Money Concepts (SMC), live market telemetry, and certified broker partnerships.'}
            </p>
          </div>
        </Anim>

        {/* 3 Pillar Cards Grid */}
        <Anim delay={0.1}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
              marginBottom: '64px',
            }}
          >
            {/* Pillar 1 */}
            <div
              style={{
                background: 'rgba(10, 27, 61, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px 24px',
                backdropFilter: 'blur(16px)',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(4, 136, 248, 0.15)',
                  border: '1px solid rgba(4, 136, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0488F8',
                  fontSize: '22px',
                  marginBottom: '20px',
                }}
              >
                <FiBookOpen />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                {isAr ? 'أكاديمية التدريب الشامل' : 'Comprehensive Training Academy'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 16px' }}>
                {isAr
                  ? 'برامج تدريبية معتمدة تبدأ معك من الصفر التام لتفهم حركة الأسواق وسيكولوجية التداول، وتتدرج إلى التحليل الفني المتقدم وإدارة المخاطر الصارمة لضمان حماية رأس المال.'
                  : 'Certified trading curricula starting from market mechanics to advanced technical analysis and disciplined risk management to protect and grow capital.'}
              </p>
              <Link
                href="/courses"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#0488F8',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'استكشف مسارات التدريب' : 'Explore Courses'}</span>
                {isAr ? <FiArrowLeft /> : <FiArrowRight />}
              </Link>
            </div>

            {/* Pillar 2 */}
            <div
              style={{
                background: 'rgba(10, 27, 61, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px 24px',
                backdropFilter: 'blur(16px)',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(251, 135, 4, 0.15)',
                  border: '1px solid rgba(251, 135, 4, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FB8704',
                  fontSize: '22px',
                  marginBottom: '20px',
                }}
              >
                <FiTrendingUp />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                {isAr ? 'استراتيجيات السيولة SMC' : 'Smart Money Concepts (SMC)'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 16px' }}>
                {isAr
                  ? 'اكتشف كيف يفكر صناع السوق وتتداول المؤسسات المالية الكبرى. تعلم تحديد كتل الأوامر (Order Blocks) ومناطق العرض والطلب بدقة فائقة لاقتناص الصفقات الرابحة.'
                  : 'Master how market makers and institutional banks trade. Spot high-probability order blocks, fair value gaps, and liquidity sweeps with superior risk-to-reward ratios.'}
              </p>
              <Link
                href="/analyses"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#FB8704',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'تابع التحليلات اليومية' : 'View Daily Analyses'}</span>
                {isAr ? <FiArrowLeft /> : <FiArrowRight />}
              </Link>
            </div>

            {/* Pillar 3 */}
            <div
              style={{
                background: 'rgba(10, 27, 61, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '32px 24px',
                backdropFilter: 'blur(16px)',
                transition: 'transform 0.3s ease, border-color 0.3s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(22, 199, 132, 0.15)',
                  border: '1px solid rgba(22, 199, 132, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#16C784',
                  fontSize: '22px',
                  marginBottom: '20px',
                }}
              >
                <FiShield />
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 12px' }}>
                {isAr ? 'وسطاء التداول المعتمدون' : 'Verified Broker Partners'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 16px' }}>
                {isAr
                  ? 'اختر وسيطك الاستثماري بأمان كامل. تراخيص دولية Tier-1، سبريد خام 0.0، سحب فوري، حسابات إسلامية 100% بدون تبييت، وعروض كاش باك حصرية لعملاء المنصة.'
                  : 'Open your trading account securely with top-tier regulated brokers. Raw 0.0 spreads, instant fund withdrawals, swap-free Islamic accounts, and VIP cash back perks.'}
              </p>
              <Link
                href="/open-account"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#16C784',
                  textDecoration: 'none',
                }}
              >
                <span>{isAr ? 'فتح حساب تداول موثوق' : 'Open Broker Account'}</span>
                {isAr ? <FiArrowLeft /> : <FiArrowRight />}
              </Link>
            </div>
          </div>
        </Anim>

        {/* In-Depth FAQ Accordion (Direct Google Featured Snippet Magnet) */}
        <Anim delay={0.2}>
          <div
            style={{
              background: 'rgba(10, 27, 61, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '40px 32px',
              maxWidth: '920px',
              margin: '0 auto',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                <FiHelpCircle style={{ color: '#0488F8' }} />
                <span>{isAr ? 'الأسئلة الشائعة والمهمة للمتداولين' : 'Frequently Asked Questions'}</span>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {isAr ? 'كل ما تود معرفته عن تداول الفوركس مع FXENGIN' : 'Everything You Need to Know About Trading with FXENGIN'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid',
                      borderColor: isOpen ? 'rgba(4, 136, 248, 0.4)' : 'rgba(255, 255, 255, 0.06)',
                      background: isOpen ? 'rgba(4, 136, 248, 0.06)' : 'rgba(5, 11, 20, 0.6)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.25s ease',
                    }}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      style={{
                        width: '100%',
                        padding: '18px 20px',
                        background: 'transparent',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        cursor: 'pointer',
                        textAlign: isAr ? 'right' : 'left',
                        color: isOpen ? '#FFFFFF' : 'var(--text-primary)',
                        fontSize: '15px',
                        fontWeight: 700,
                      }}
                    >
                      <span>{isAr ? faq.qAr : faq.qEn}</span>
                      <FiChevronDown
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s ease',
                          color: isOpen ? '#0488F8' : 'var(--text-secondary)',
                          flexShrink: 0,
                          fontSize: '18px',
                        }}
                      />
                    </button>

                    {isOpen && (
                      <div
                        style={{
                          padding: '0 20px 20px 20px',
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                          lineHeight: 1.75,
                          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                          paddingTop: '14px',
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

      </div>
    </section>
  );
}
