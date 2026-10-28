'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FiBriefcase,
  FiCalendar,
  FiMapPin,
  FiDollarSign,
  FiUsers,
  FiAward,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiPlus,
  FiEye,
  FiShare2,
  FiPhone,
  FiMail,
  FiShield,
  FiZap,
  FiLayers,
  FiExternalLink,
  FiLogOut,
  FiStar,
  FiTv,
  FiCoffee,
  FiCamera,
  FiMic,
  FiGift,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiInfo,
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import {
  getCurrentBrokerSession,
  logoutBroker,
  fetchBrokerEvents,
  createBrokerEvent,
  fetchBrokerContracts,
  createBrokerContract,
} from '../../services/brokerPortalService';

export default function BrokerPortalDashboardPage() {
  const router = useRouter();
  const { isAr } = useLanguage();

  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'contracts' | 'offers' | 'profile'

  // Data states
  const [events, setEvents] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [contractsLoading, setContractsLoading] = useState(false);

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedEventView, setSelectedEventView] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Event form state
  const [eventForm, setEventForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    eventDate: '',
    startTime: '18:00',
    endTime: '22:00',
    durationHours: 4,
    country: 'الإمارات العربية المتحدة',
    city: 'دبي',
    venueName: '',
    venueType: 'HOTEL_LUXURY',
    venueAddress: '',
    expectedAttendees: 150,
    budgetUsd: 30000,
    sponsorshipType: 'FULL_BROKER_SPONSORED',
    invitationType: 'VIP_INVITATIONS_ONLY',
    isVipEvent: true,
    vipPerks: [
      'مقاعد الصف الأول مخصصة لكبار العملاء',
      'جلسة عشاء مغلقة VIP مع كبار المحللين',
      'دروع وهدايا تذكارية راقية للحضور',
    ],
    servicesRequested: {
      catering: 'OPEN_BUFFET_VIP',
      mediaCoverage: true,
      liveStreaming: true,
      avStageProduction: true,
      fxenginSpeakers: true,
      brandingRollups: true,
      giveaways: true,
    },
    speakersRequested: 'أ. جمال أحمد (مؤسس FXENGIN) + ممثلو الوسيط الشريك',
    targetAudience: 'كبار المتداولين، أصحاب محافظ التداول النشطة، والمستثمرين',
    notes: '',
  });

  // Contract form state
  const [contractForm, setContractForm] = useState({
    contractType: 'AD_CAMPAIGN',
    packageTitleAr: 'البانر الإعلاني الذهبي في الواجهة الرئيسية',
    packageTitleEn: 'Hero Showcase Banner',
    placement: 'HORIZONTAL_BANNER',
    campaignTitle: '',
    targetUrl: '',
    startDate: '',
    durationMonths: 3,
    budgetUsd: 10000,
    couponCode: '',
    notes: '',
  });

  // Verify auth session
  useEffect(() => {
    const session = getCurrentBrokerSession();
    if (!session || !session.broker) {
      router.push('/brokers/portal/login');
      return;
    }
    setBroker(session.broker);
    setLoading(false);
    loadData(session.broker.id);
  }, [router]);

  const loadData = async (brokerId) => {
    if (!brokerId) return;
    setEventsLoading(true);
    setContractsLoading(true);
    try {
      const [eventsRes, contractsRes] = await Promise.all([
        fetchBrokerEvents(brokerId),
        fetchBrokerContracts(brokerId),
      ]);
      if (eventsRes.success) setEvents(eventsRes.data || []);
      if (contractsRes.success) setContracts(contractsRes.data || []);
    } catch (e) {
      console.error('Failed to load broker data', e);
    } finally {
      setEventsLoading(false);
      setContractsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutBroker();
    router.push('/brokers/portal/login');
  };

  // Submit Event Request
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    if (!broker) return;

    setFeedbackMsg({ type: 'loading', text: isAr ? 'جاري إرسال طلب الإيفينت...' : 'Submitting event request...' });

    const payload = {
      ...eventForm,
      brokerId: broker.id,
      brokerName: broker.brokerName || broker.name,
      repContact: `${broker.repName || ''} (${broker.repPhone || broker.email || ''})`,
    };

    const res = await createBrokerEvent(payload);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: isAr
          ? 'تم إرسال طلب تنظيم الإيفينت بنجاح! سيقوم فريق المؤتمرات بـ FXENGIN بالتواصل خلال ساعات.'
          : 'Event request submitted successfully! FXENGIN Event Team will reach out shortly.',
      });
      setIsEventModalOpen(false);
      loadData(broker.id);
      setActiveTab('events');
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'تعذر إرسال الطلب' });
    }
  };

  // Submit Contract Booking Request
  const handleContractSubmit = async (e) => {
    e.preventDefault();
    if (!broker) return;

    setFeedbackMsg({ type: 'loading', text: isAr ? 'جاري إرسال طلب التعاقد...' : 'Submitting contract...' });

    const payload = {
      ...contractForm,
      brokerId: broker.id,
      brokerName: broker.brokerName || broker.name,
    };

    const res = await createBrokerContract(payload);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: isAr
          ? 'تم تقديم طلب التعاقد الإعلاني بنجاح! جاري المراجعة والاعتماد.'
          : 'Contract requested successfully! Review and activation underway.',
      });
      setIsContractModalOpen(false);
      loadData(broker.id);
      setActiveTab('contracts');
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || 'تعذر حفظ العقد' });
    }
  };

  if (loading || !broker) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#040D1E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0488F8',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <FiRefreshCw className="animate-spin" size={36} />
          <p style={{ marginTop: '1rem', color: '#94A3B8', fontSize: '0.875rem' }}>
            {isAr ? 'جاري تحميل بوابة الوسيط الشريك...' : 'Loading Institutional Partner Portal...'}
          </p>
        </div>
      </div>
    );
  }

  // Derived KPI metrics
  const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const pendingContractsCount = contracts.filter((c) => c.status === 'PENDING_REVIEW').length;
  const totalImpressions = contracts.reduce((acc, c) => acc + (c.impressionsCount || 0), 0);
  const totalClicks = contracts.reduce((acc, c) => acc + (c.clicksCount || 0), 0);
  const activeEventsCount = events.filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED').length;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#030A17',
        color: '#E2E8F0',
        paddingBottom: '6rem',
      }}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* ── Top Institutional Header Bar ──────────────────────────────── */}
      <header
        style={{
          background: 'rgba(5, 17, 39, 0.95)',
          borderBottom: '1px solid rgba(18, 49, 92, 0.7)',
          padding: '0.875rem 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Broker Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '0.75rem',
                background: '#000000',
                border: '1.5px solid #0488F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {broker.logo ? (
                <img
                  src={broker.logo}
                  alt={broker.brokerName}
                  style={{ width: '85%', height: '85%', objectFit: 'contain' }}
                />
              ) : (
                <FiBriefcase size={22} color="#0488F8" />
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 900, color: '#FFFFFF' }}>
                  {broker.brokerName}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    color: '#00E676',
                    background: 'rgba(0, 230, 118, 0.12)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(0, 230, 118, 0.3)',
                  }}
                >
                  {broker.contractTier || 'TIER-1 STRATEGIC PARTNER'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', gap: '0.75rem' }}>
                <span>{broker.repName || 'الممثل الرسمي'}</span>
                <span>•</span>
                <span style={{ color: '#0488F8' }}>{broker.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Account Manager Hotline */}
            <div
              style={{
                background: 'rgba(6, 20, 47, 0.8)',
                border: '1px solid rgba(251, 135, 4, 0.3)',
                borderRadius: '0.625rem',
                padding: '0.4rem 0.85rem',
                display: 'none',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
              }}
              className="sm:flex"
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E676' }} />
              <span style={{ color: '#94A3B8' }}>{isAr ? 'مسؤول حسابك بـ FXENGIN:' : 'Key Account Manager:'}</span>
              <span style={{ color: '#FB8704', fontWeight: 700 }}>
                {broker.accountManager || 'أ. جمال أحمد'}
              </span>
            </div>

            <button
              onClick={() => setIsEventModalOpen(true)}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #FB8704 0%, #D96F00 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(251, 135, 4, 0.35)',
              }}
            >
              <FiCalendar size={15} />
              <span>{isAr ? 'طلب تنظيم إيفينت' : 'Request Event'}</span>
            </button>

            <button
              onClick={() => setIsContractModalOpen(true)}
              style={{
                padding: '0.55rem 1.15rem',
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8125rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(4, 136, 248, 0.35)',
              }}
            >
              <FiZap size={15} />
              <span>{isAr ? 'تعاقد إعلاني' : 'Book Ad Package'}</span>
            </button>

            <button
              onClick={handleLogout}
              title={isAr ? 'تسجيل الخروج' : 'Logout'}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#EF4444',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.625rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Navigation Tabs ───────────────────────────────────────────── */}
      <div
        style={{
          background: 'rgba(6, 20, 47, 0.7)',
          borderBottom: '1px solid rgba(18, 49, 92, 0.5)',
          padding: '0 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'overview', labelAr: 'نظرة عامة والتقارير', labelEn: 'Overview & Analytics', icon: FiTrendingUp },
            { id: 'events', labelAr: 'تنظيم وطلب الإيفينتات', labelEn: 'Events & Summits', icon: FiCalendar, count: events.length },
            { id: 'contracts', labelAr: 'عقود الإعلانات والرعايات', labelEn: 'Ad Contracts', icon: FiZap, count: contracts.length },
            { id: 'packages', labelAr: 'باقات الإعلانات المتاحة', labelEn: 'Available Ad Packages', icon: FiLayers },
            { id: 'profile', labelAr: 'ملف الشراكة والتوثيق', labelEn: 'Partner Profile', icon: FiShield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #0488F8' : '3px solid transparent',
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 800 : 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={16} color={isActive ? '#0488F8' : '#64748B'} />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                {typeof tab.count === 'number' && (
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '9999px',
                      background: isActive ? 'rgba(4, 136, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: isActive ? '#0488F8' : '#94A3B8',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Container ────────────────────────────────────────────── */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Feedback Message */}
        {feedbackMsg.text && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '0.75rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background:
                feedbackMsg.type === 'success'
                  ? 'rgba(0, 230, 118, 0.15)'
                  : feedbackMsg.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(4, 136, 248, 0.15)',
              border: `1px solid ${
                feedbackMsg.type === 'success'
                  ? 'rgba(0, 230, 118, 0.3)'
                  : feedbackMsg.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(4, 136, 248, 0.3)'
              }`,
              color:
                feedbackMsg.type === 'success'
                  ? '#00E676'
                  : feedbackMsg.type === 'error'
                  ? '#EF4444'
                  : '#0488F8',
            }}
          >
            <span>{feedbackMsg.text}</span>
            <button
              onClick={() => setFeedbackMsg({ type: '', text: '' })}
              style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
            >
              <FiX size={18} />
            </button>
          </div>
        )}

        {/* ── TAB 1: OVERVIEW ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem',
              }}
            >
              {[
                {
                  labelAr: 'العقود الإعلانية النشطة',
                  labelEn: 'Active Ad Contracts',
                  value: activeContractsCount,
                  subtitleAr: `${pendingContractsCount} قيد المراجعة`,
                  subtitleEn: `${pendingContractsCount} pending review`,
                  icon: FiZap,
                  color: '#0488F8',
                },
                {
                  labelAr: 'الإيفينتات المجدولة والمطلوبة',
                  labelEn: 'Events Hosted / Requested',
                  value: events.length,
                  subtitleAr: `${activeEventsCount} إيفينت قيد الترتيب`,
                  subtitleEn: `${activeEventsCount} upcoming/planning`,
                  icon: FiCalendar,
                  color: '#FB8704',
                },
                {
                  labelAr: 'إجمالي المشاهدات وظهور الإعلانات',
                  labelEn: 'Total Ad Impressions',
                  value: totalImpressions.toLocaleString(),
                  subtitleAr: `${totalClicks.toLocaleString()} نقرة مباشرة (CTR: ${
                    totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0
                  }%)`,
                  subtitleEn: `${totalClicks.toLocaleString()} direct clicks`,
                  icon: FiEye,
                  color: '#10B981',
                },
                {
                  labelAr: 'حالة اعتماد الشراكة',
                  labelEn: 'Partnership Status',
                  value: isAr ? 'معتمد رسمي Tier-1' : 'Tier-1 Certified',
                  subtitleAr: 'موثق لدى FXENGIN',
                  subtitleEn: 'Verified Regulated Broker',
                  icon: FiShield,
                  color: '#D4AF37',
                },
              ].map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <div
                    key={i}
                    style={{
                      background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                      border: '1px solid rgba(18, 49, 92, 0.6)',
                      borderRadius: '1.25rem',
                      padding: '1.5rem',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-15%',
                        insetInlineEnd: '-15%',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: kpi.color,
                        opacity: 0.1,
                        filter: 'blur(20px)',
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8' }}>
                        {isAr ? kpi.labelAr : kpi.labelEn}
                      </span>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '0.5rem',
                          background: `${kpi.color}1A`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: kpi.color,
                        }}
                      >
                        <Icon size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                      {kpi.value}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {isAr ? kpi.subtitleAr : kpi.subtitleEn}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Banner & Actions */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(4, 136, 248, 0.15) 0%, rgba(251, 135, 4, 0.12) 100%)',
                border: '1px solid rgba(4, 136, 248, 0.3)',
                borderRadius: '1.5rem',
                padding: '2rem',
                marginBottom: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.5rem',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#FB8704',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isAr ? 'خدمات الشركاء المؤسسية الحصرية' : 'Exclusive Partner Privileges'}
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0.35rem 0 0.75rem' }}>
                  {isAr
                    ? 'هل ترغب في تنظيم مؤتمر أو ملتقى تداولي برعاية مشتركة؟'
                    : 'Planning an In-Person Trading Summit or Co-Branded Event?'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#CBD5E1', maxWidth: '42rem', lineHeight: 1.7, margin: 0 }}>
                  {isAr
                    ? 'فريق FXENGIN يوفر لك تنظيماً متكاملاً: حجز قاعات فنادق 5 نجوم، دعوات VIP لكبار المودعين، شاشات LED، تصوير سينمائي 4K، وتغطية إعلامية بحضور كبار المحللين.'
                    : 'FXENGIN provides end-to-end execution: 5-star venue booking, VIP private invites for top depositors, 4K production, and live stage keynote panels.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  style={{
                    padding: '0.85rem 1.75rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #FB8704 0%, #D96F00 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 8px 24px rgba(251, 135, 4, 0.35)',
                  }}
                >
                  <FiCalendar size={18} />
                  <span>{isAr ? 'طلب تنظيم إيفينت الآن' : 'Book Event Now'}</span>
                </button>

                <button
                  onClick={() => setIsContractModalOpen(true)}
                  style={{
                    padding: '0.85rem 1.5rem',
                    borderRadius: '0.75rem',
                    background: 'rgba(6, 20, 47, 0.9)',
                    border: '1px solid rgba(4, 136, 248, 0.5)',
                    color: '#0488F8',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <FiZap size={18} />
                  <span>{isAr ? 'حجز مساحة إعلانية' : 'Book Ad Space'}</span>
                </button>
              </div>
            </div>

            {/* Recent Events & Contracts Side-by-Side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.75rem' }}>
              {/* Upcoming Events Box */}
              <div
                style={{
                  background: 'rgba(6, 20, 47, 0.7)',
                  border: '1px solid rgba(18, 49, 92, 0.6)',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiCalendar color="#FB8704" size={20} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {isAr ? 'أحدث طلبات الإيفينتات' : 'Recent Event Requests'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('events')}
                    style={{ background: 'transparent', border: 'none', color: '#0488F8', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isAr ? 'عرض الكل' : 'View All'}
                  </button>
                </div>

                {events.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
                    <p style={{ margin: 0 }}>{isAr ? 'لا توجد طلبات إيفينتات مسجلة حتى الآن.' : 'No event requests yet.'}</p>
                    <button
                      onClick={() => setIsEventModalOpen(true)}
                      style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid #FB8704', color: '#FB8704', padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}
                    >
                      {isAr ? 'أضف أول إيفينت' : 'Create First Event'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {events.slice(0, 3).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEventView(evt)}
                        style={{
                          background: 'rgba(4, 15, 36, 0.8)',
                          border: '1px solid rgba(18, 49, 92, 0.5)',
                          borderRadius: '0.875rem',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {isAr ? evt.titleAr : evt.titleEn || evt.titleAr}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '9999px',
                              background:
                                evt.status === 'APPROVED'
                                  ? 'rgba(0, 230, 118, 0.15)'
                                  : evt.status === 'IN_PLANNING'
                                  ? 'rgba(251, 135, 4, 0.15)'
                                  : 'rgba(4, 136, 248, 0.15)',
                              color:
                                evt.status === 'APPROVED'
                                  ? '#00E676'
                                  : evt.status === 'IN_PLANNING'
                                  ? '#FB8704'
                                  : '#0488F8',
                            }}
                          >
                            {evt.status === 'APPROVED'
                              ? isAr ? 'معتمد ومجدول' : 'Approved'
                              : evt.status === 'IN_PLANNING'
                              ? isAr ? 'جاري التنسيق والحجز' : 'In Planning'
                              : isAr ? 'طلب جديد قيد الدراسة' : 'Under Review'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiCalendar size={13} color="#FB8704" />
                            {evt.eventDate}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiMapPin size={13} color="#0488F8" />
                            {evt.city}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiUsers size={13} color="#00E676" />
                            {evt.expectedAttendees} {isAr ? 'حضور' : 'Guests'}
                          </span>
                          {evt.isVipEvent && (
                            <span style={{ color: '#D4AF37', fontWeight: 700 }}>★ VIP</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Contracts Box */}
              <div
                style={{
                  background: 'rgba(6, 20, 47, 0.7)',
                  border: '1px solid rgba(18, 49, 92, 0.6)',
                  borderRadius: '1.25rem',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiZap color="#0488F8" size={20} />
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {isAr ? 'العقود الإعلانية والرعايات' : 'Active Ad Contracts'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('contracts')}
                    style={{ background: 'transparent', border: 'none', color: '#0488F8', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isAr ? 'عرض الكل' : 'View All'}
                  </button>
                </div>

                {contracts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
                    <p style={{ margin: 0 }}>{isAr ? 'لا توجد عقود إعلانية نشطة حالياً.' : 'No active ad contracts yet.'}</p>
                    <button
                      onClick={() => setIsContractModalOpen(true)}
                      style={{ marginTop: '0.75rem', background: 'transparent', border: '1px solid #0488F8', color: '#0488F8', padding: '0.4rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}
                    >
                      {isAr ? 'طلب أول باقة إعلانية' : 'Book First Ad'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {contracts.slice(0, 3).map((ctr) => (
                      <div
                        key={ctr.id}
                        style={{
                          background: 'rgba(4, 15, 36, 0.8)',
                          border: '1px solid rgba(18, 49, 92, 0.5)',
                          borderRadius: '0.875rem',
                          padding: '1rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {isAr ? ctr.packageTitleAr : ctr.packageTitleEn || ctr.packageTitleAr}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '9999px',
                              background: ctr.status === 'ACTIVE' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(251, 135, 4, 0.15)',
                              color: ctr.status === 'ACTIVE' ? '#00E676' : '#FB8704',
                            }}
                          >
                            {ctr.status === 'ACTIVE' ? (isAr ? 'نشط ومعتمد' : 'Active') : (isAr ? 'قيد المراجعة' : 'In Review')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                          {ctr.campaignTitle}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#94A3B8' }}>
                          <span>👁 {(ctr.impressionsCount || 0).toLocaleString()} {isAr ? 'ظهور' : 'views'}</span>
                          <span>🔗 {(ctr.clicksCount || 0).toLocaleString()} {isAr ? 'نقرة' : 'clicks'}</span>
                          {ctr.couponCode && (
                            <span style={{ color: '#FB8704', fontWeight: 700 }}>
                              {isAr ? 'كوبون:' : 'Code:'} {ctr.couponCode}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: EVENTS MANAGEMENT ───────────────────────────────── */}
        {activeTab === 'events' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  {isAr ? 'إدارة وطلبات الإيفينتات والمؤتمرات' : 'Events & Summits Organization'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '0.25rem 0 0' }}>
                  {isAr
                    ? 'جدولة الفعاليات، تحديد المواعيد والقاعات والميزانية، وتنسيق دعوات الـ VIP مع فريق FXENGIN'
                    : 'Schedule summits, select venues & budget, and configure VIP invitations with FXENGIN'}
                </p>
              </div>

              <button
                onClick={() => setIsEventModalOpen(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #FB8704 0%, #D96F00 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px rgba(251, 135, 4, 0.3)',
                }}
              >
                <FiPlus size={18} />
                <span>{isAr ? 'طلب تنظيم إيفينت جديد' : 'New Event Request'}</span>
              </button>
            </div>

            {/* Events List */}
            {events.length === 0 ? (
              <div
                style={{
                  background: 'rgba(6, 20, 47, 0.6)',
                  border: '1px dashed rgba(18, 49, 92, 0.8)',
                  borderRadius: '1.5rem',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(251, 135, 4, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    color: '#FB8704',
                  }}
                >
                  <FiCalendar size={32} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  {isAr ? 'لم تقدم أي طلبات لتنظيم إيفينت بعد' : 'No Event Requests Yet'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', maxWidth: '32rem', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
                  {isAr
                    ? 'يمكنك الآن حجز ملتقى تداولي باسم شركتك في دبي، الرياض، القاهرة أو أي عاصمة خليجية بدعم وتنسيق كامل من FXENGIN.'
                    : 'Host an exclusive trading seminar co-branded with FXENGIN in Dubai, Riyadh, Cairo or any regional hub.'}
                </p>
                <button
                  onClick={() => setIsEventModalOpen(true)}
                  style={{
                    padding: '0.75rem 1.75rem',
                    borderRadius: '0.75rem',
                    background: 'linear-gradient(135deg, #FB8704 0%, #D96F00 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? 'ابدأ بتحديد تفاصيل الإيفينت الآن' : 'Start Event Request'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                {events.map((evt) => {
                  return (
                    <div
                      key={evt.id}
                      style={{
                        background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.9) 0%, rgba(4, 15, 36, 0.95) 100%)',
                        border: evt.isVipEvent ? '1.5px solid rgba(251, 135, 4, 0.4)' : '1px solid rgba(18, 49, 92, 0.7)',
                        borderRadius: '1.25rem',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: evt.isVipEvent ? '0 10px 30px rgba(251, 135, 4, 0.1)' : 'none',
                      }}
                    >
                      {/* Top Badges */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#64748B',
                              letterSpacing: '0.04em',
                            }}
                          >
                            {evt.id}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '0.25rem 0.65rem',
                              borderRadius: '9999px',
                              background:
                                evt.status === 'APPROVED'
                                  ? 'rgba(0, 230, 118, 0.15)'
                                  : evt.status === 'IN_PLANNING'
                                  ? 'rgba(251, 135, 4, 0.15)'
                                  : 'rgba(4, 136, 248, 0.15)',
                              border: `1px solid ${
                                evt.status === 'APPROVED'
                                  ? 'rgba(0, 230, 118, 0.35)'
                                  : evt.status === 'IN_PLANNING'
                                  ? 'rgba(251, 135, 4, 0.35)'
                                  : 'rgba(4, 136, 248, 0.35)'
                              }`,
                              color:
                                evt.status === 'APPROVED'
                                  ? '#00E676'
                                  : evt.status === 'IN_PLANNING'
                                  ? '#FB8704'
                                  : '#0488F8',
                            }}
                          >
                            {evt.status === 'APPROVED'
                              ? isAr ? 'معتمد ومجدول رسمياً' : 'Confirmed & Approved'
                              : evt.status === 'IN_PLANNING'
                              ? isAr ? 'معتمد - جاري حجز القاعة' : 'In Planning & Booking'
                              : isAr ? 'طلب جديد قيد الدراسة' : 'Under Evaluation'}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.625rem', lineHeight: 1.3 }}>
                          {isAr ? evt.titleAr : evt.titleEn || evt.titleAr}
                        </h3>

                        <p style={{ fontSize: '0.8125rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                          {evt.descriptionAr || (isAr ? 'ملتقى تداولي استراتيجي بحضور نخبة المتداولين.' : 'Institutional trading seminar.')}
                        </p>

                        {/* Event Details Grid */}
                        <div
                          style={{
                            background: 'rgba(2, 9, 23, 0.6)',
                            border: '1px solid rgba(18, 49, 92, 0.5)',
                            borderRadius: '0.875rem',
                            padding: '1rem',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.85rem',
                            marginBottom: '1.25rem',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem' }}>{isAr ? 'الميعاد والتوقيت' : 'Date & Time'}</span>
                            <span style={{ color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                              <FiClock size={13} color="#FB8704" />
                              {evt.eventDate} ({evt.startTime})
                            </span>
                          </div>

                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem' }}>{isAr ? 'المكان والمدينة' : 'Location & City'}</span>
                            <span style={{ color: '#FFFFFF', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                              <FiMapPin size={13} color="#0488F8" />
                              {evt.city}, {evt.country}
                            </span>
                          </div>

                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem' }}>{isAr ? 'العدد المتوقع' : 'Expected Guests'}</span>
                            <span style={{ color: '#00E676', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                              <FiUsers size={13} />
                              {evt.expectedAttendees} {isAr ? 'شخص' : 'Attendees'}
                            </span>
                          </div>

                          <div>
                            <span style={{ color: '#64748B', display: 'block', fontSize: '0.6875rem' }}>{isAr ? 'الميزانية المرصودة' : 'Budget'}</span>
                            <span style={{ color: '#D4AF37', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                              <FiDollarSign size={13} />
                              ${(evt.budgetUsd || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* VIP Policy Pill */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0.625rem',
                            background: evt.isVipEvent ? 'rgba(251, 135, 4, 0.1)' : 'rgba(4, 136, 248, 0.1)',
                            border: evt.isVipEvent ? '1px solid rgba(251, 135, 4, 0.25)' : '1px solid rgba(4, 136, 248, 0.25)',
                            fontSize: '0.75rem',
                            color: evt.isVipEvent ? '#FB8704' : '#0488F8',
                            fontWeight: 700,
                            marginBottom: '1rem',
                          }}
                        >
                          <FiAward size={15} />
                          <span>
                            {evt.invitationType === 'VIP_INVITATIONS_ONLY'
                              ? isAr ? 'نوع الدعوات: دعاوي VIP حصرية فقط' : 'Private VIP Invitations Only'
                              : evt.invitationType === 'HYBRID_VIP_PUBLIC'
                              ? isAr ? 'نوع الدعوات: مقاعد VIP أمامية + تسجيل عام' : 'Hybrid VIP & General'
                              : isAr ? 'نوع الدعوات: دعوات عامة مفتوحة' : 'Open Public Registration'}
                          </span>
                        </div>

                        {/* Services Included */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                          {evt.servicesRequested?.catering && (
                            <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.35rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FiCoffee size={11} color="#FB8704" /> {isAr ? 'ضيافة وبوفيه' : 'Catering'}
                            </span>
                          )}
                          {evt.servicesRequested?.mediaCoverage && (
                            <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.35rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FiCamera size={11} color="#0488F8" /> {isAr ? 'تغطية 4K' : '4K Media'}
                            </span>
                          )}
                          {evt.servicesRequested?.fxenginSpeakers && (
                            <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.35rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FiMic size={11} color="#00E676" /> {isAr ? 'متحدثو FXENGIN' : 'Speakers'}
                            </span>
                          )}
                          {evt.servicesRequested?.giveaways && (
                            <span style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '0.35rem', color: '#CBD5E1', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FiGift size={11} color="#D4AF37" /> {isAr ? 'هدايا تذكارية' : 'Giveaways'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <button
                        onClick={() => setSelectedEventView(evt)}
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          borderRadius: '0.625rem',
                          background: 'rgba(4, 136, 248, 0.15)',
                          border: '1px solid rgba(4, 136, 248, 0.4)',
                          color: '#0488F8',
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <FiEye size={15} />
                        <span>{isAr ? 'عرض الملف التنظيمي الكامل' : 'View Full Event Dossier'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CONTRACTS MANAGEMENT ────────────────────────────── */}
        {activeTab === 'contracts' && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.75rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                  {isAr ? 'عقود الإعلانات والرعايات الترويجية' : 'Advertising & Sponsorship Contracts'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#94A3B8', margin: '0.25rem 0 0' }}>
                  {isAr
                    ? 'تتبع حملاتك الإعلانية النشطة، نسب النقر للظهور (CTR)، ومواعيد التجديد'
                    : 'Track your active ad campaigns, real-time CTR analytics, and contract renewals'}
                </p>
              </div>

              <button
                onClick={() => setIsContractModalOpen(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '0.9375rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px rgba(4, 136, 248, 0.3)',
                }}
              >
                <FiPlus size={18} />
                <span>{isAr ? 'طلب تعاقد إعلاني جديد' : 'New Ad Contract'}</span>
              </button>
            </div>

            {/* Contracts Table/Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {contracts.map((ctr) => (
                <div
                  key={ctr.id}
                  style={{
                    background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.85) 100%)',
                    border: '1px solid rgba(18, 49, 92, 0.6)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1, minWidth: '280px' }}>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '0.75rem',
                        background: 'rgba(4, 136, 248, 0.12)',
                        border: '1px solid rgba(4, 136, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#0488F8',
                        shrink: 0,
                      }}
                    >
                      <FiZap size={24} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>{ctr.id}</span>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 800,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            background: ctr.status === 'ACTIVE' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(251, 135, 4, 0.15)',
                            color: ctr.status === 'ACTIVE' ? '#00E676' : '#FB8704',
                          }}
                        >
                          {ctr.status === 'ACTIVE' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'قيد المراجعة' : 'In Review')}
                        </span>
                      </div>
                      <h4 style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#FFFFFF', margin: '0.25rem 0' }}>
                        {isAr ? ctr.packageTitleAr : ctr.packageTitleEn || ctr.packageTitleAr}
                      </h4>
                      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>
                        {ctr.campaignTitle}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>{isAr ? 'المدة والمواعيد' : 'Duration'}</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#CBD5E1' }}>
                        {ctr.startDate} {ctr.endDate ? `حتى ${ctr.endDate}` : `(${ctr.durationMonths || 3} أشهر)`}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>{isAr ? 'الظهور والنقرات' : 'Reach'}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#00E676' }}>
                        {(ctr.impressionsCount || 0).toLocaleString()} {isAr ? 'مشاهدة' : 'views'}
                      </span>
                    </div>

                    <div>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>{isAr ? 'قيمة العقد' : 'Contract Value'}</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#D4AF37' }}>
                        ${(ctr.budgetUsd || 0).toLocaleString()}
                      </span>
                    </div>

                    {ctr.targetUrl && ctr.targetUrl !== '#' && (
                      <a
                        href={ctr.targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '0.55rem 0.85rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#0488F8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          textDecoration: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        <span>{isAr ? 'رابط التتبع' : 'Target URL'}</span>
                        <FiExternalLink size={13} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: AD PACKAGES CATALOG ─────────────────────────────── */}
        {activeTab === 'packages' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0488F8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isAr ? 'المساحات الإعلانية المعتمدة' : 'Official Ad Inventories'}
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.35rem' }}>
                {isAr ? 'باقات الرعاية والإعلانات لمنظومة FXENGIN' : 'FXENGIN Institutional Ad Placements'}
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#94A3B8', maxWidth: '36rem', margin: '0.5rem auto 0' }}>
                {isAr
                  ? 'وصول مباشر لأكثر من 150,000 متداول نشط شهرياً في مصر ودول الخليج العربي'
                  : 'Direct exposure to 150,000+ active traders across the MENA region'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {[
                {
                  id: 'hero',
                  titleAr: 'البانر الذهبي في واجهة الموقع (Hero Banner)',
                  titleEn: 'Hero Showcase Banner',
                  placement: 'HORIZONTAL_BANNER',
                  priceUsd: 12000,
                  periodAr: 'لكل 3 أشهر',
                  periodEn: 'Per Quarter',
                  reachAr: '500,000+ ظهور شهرياً',
                  reachEn: '500K+ Monthly Impressions',
                  featuresAr: [
                    'أول عنصر بصري يراه كل زائر للمنصة',
                    'زر دعوة للإجراء (CTA) مخصص لرابط التسجيل الخاص بكم',
                    'أعلى معدل تحويل وتسجيل حسابات حقيقية',
                    'تقارير أسبوعية مفصلة بنسب النقر والظهور',
                  ],
                },
                {
                  id: 'skyscraper',
                  titleAr: 'الشريط الإعلاني اللزج (Sticky Skyscraper)',
                  titleEn: 'Sticky Skyscraper Lateral Banner',
                  placement: 'SKYSCRAPER_RIGHT',
                  priceUsd: 9500,
                  periodAr: 'لكل 3 أشهر',
                  periodEn: 'Per Quarter',
                  reachAr: '350,000+ ظهور شهرياً',
                  reachEn: '350K+ Monthly Impressions',
                  featuresAr: [
                    'يظل ظاهراً أثناء تمرير المقالات والتحليلات اليومية',
                    'مثالي لترويج حسابات السبريد المنخفض 0.0 وسكالبينج الذهب',
                    'معدل نقر عالي (CTR 4.8%)',
                    'تصميم مخصص باسم وهوية الوسيط',
                  ],
                },
                {
                  id: 'popup',
                  titleAr: 'النافذة المنبثقة التفاعلية (Interactive Modal)',
                  titleEn: 'Interactive Welcome Promo Modal',
                  placement: 'POPUP_MODAL',
                  priceUsd: 14000,
                  periodAr: 'لكل 3 أشهر',
                  periodEn: 'Per Quarter',
                  reachAr: 'تظهر لكافة الزوار الجدد',
                  reachEn: 'All Unique First-time Visitors',
                  featuresAr: [
                    'أقوى مساحة لترويج بونص الإيداع 100%',
                    'حظر ظهور إعلانات المنافسين طوال فترة التعاقد',
                    'كوبون ترويجي حصري باسم الوسيط',
                    'تفعيل فوري مع شروط التداول',
                  ],
                },
                {
                  id: 'vip_stream',
                  titleAr: 'رعاية غرفة التداول وقناة الـ VIP',
                  titleEn: 'VIP Trading Room Exclusive Sponsor',
                  placement: 'VIP_SPONSOR',
                  priceUsd: 20000,
                  periodAr: 'سنوي (Annual)',
                  periodEn: 'Annual Sponsorship',
                  reachAr: '+50,000 متداول نخبوي',
                  reachEn: '50,000+ VIP Qualified Traders',
                  featuresAr: [
                    'الشريك الحصري الموصى به لفتح الحسابات في قناة التوصيات',
                    'برودكاست ترويجي أسبوعي في قناة التيليجرام الرسمية',
                    'لوجو الوسيط في كافة جلسات البث الحي لتحليل السوق',
                    'دعم فني خاص وإحالة المتداولين المباشرة',
                  ],
                },
              ].map((pkg, idx) => (
                <div
                  key={pkg.id}
                  style={{
                    background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.85) 0%, rgba(4, 15, 36, 0.95) 100%)',
                    border: idx === 0 ? '1.5px solid #0488F8' : '1px solid rgba(18, 49, 92, 0.6)',
                    borderRadius: '1.5rem',
                    padding: '2rem 1.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.1875rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                      {isAr ? pkg.titleAr : pkg.titleEn}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0488F8' }}>
                        ${pkg.priceUsd.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ {isAr ? pkg.periodAr : pkg.periodEn}</span>
                    </div>

                    <div
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.5rem',
                        background: 'rgba(0, 230, 118, 0.12)',
                        border: '1px solid rgba(0, 230, 118, 0.25)',
                        color: '#00E676',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        marginBottom: '1.5rem',
                        display: 'inline-block',
                      }}
                    >
                      {isAr ? pkg.reachAr : pkg.reachEn}
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                      {pkg.featuresAr.map((feat, fi) => (
                        <li key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: '#CBD5E1' }}>
                          <FiCheck color="#0488F8" size={15} style={{ marginTop: '0.2rem', shrink: 0 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setContractForm((prev) => ({
                        ...prev,
                        packageTitleAr: pkg.titleAr,
                        packageTitleEn: pkg.titleEn,
                        placement: pkg.placement,
                        budgetUsd: pkg.priceUsd,
                      }));
                      setIsContractModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'طلب التعاقد على هذه الباقة' : 'Book This Package'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 5: PROFILE & COMPLIANCE ────────────────────────────── */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: '44rem', margin: '0 auto' }}>
            <div
              style={{
                background: 'rgba(6, 20, 47, 0.85)',
                border: '1px solid rgba(18, 49, 92, 0.7)',
                borderRadius: '1.5rem',
                padding: '2.5rem 2rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '1rem',
                    background: '#000000',
                    border: '2px solid #0488F8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {broker.logo ? (
                    <img src={broker.logo} alt="" style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                  ) : (
                    <FiBriefcase size={28} color="#0488F8" />
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
                    {broker.brokerName}
                  </h2>
                  <span style={{ fontSize: '0.8125rem', color: '#0488F8', fontWeight: 700 }}>
                    {broker.contractTier || 'Official Partner'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(2, 9, 23, 0.6)', border: '1px solid rgba(18, 49, 92, 0.6)' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    {isAr ? 'الممثل الرسمي للوسيط (Institutional Representative)' : 'Authorized Representative'}
                  </span>
                  <div style={{ color: '#FFFFFF', fontWeight: 700 }}>{broker.repName || 'غير محدد'}</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8125rem' }}>{broker.repTitle || 'Head of Partnerships'}</div>
                  <div style={{ color: '#0488F8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>{broker.repPhone || broker.email}</div>
                </div>

                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(2, 9, 23, 0.6)', border: '1px solid rgba(18, 49, 92, 0.6)' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    {isAr ? 'مسؤول الحساب التنفيذي بـ FXENGIN' : 'Dedicated FXENGIN Executive Partner'}
                  </span>
                  <div style={{ color: '#FB8704', fontWeight: 800 }}>{broker.accountManager || 'أ. جمال أحمد'}</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.8125rem', marginTop: '0.35rem' }}>
                    {isAr ? 'للتواصل العاجل وتنسيق المؤتمرات:' : 'Direct Hotline:'} partners@fxengin.com
                  </div>
                </div>

                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(2, 9, 23, 0.6)', border: '1px solid rgba(18, 49, 92, 0.6)' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    {isAr ? 'تاريخ توثيق الشراكة' : 'Partnership Agreement Date'}
                  </span>
                  <div style={{ color: '#FFFFFF', fontWeight: 700 }}>
                    {broker.registeredAt ? new Date(broker.registeredAt).toLocaleDateString() : '2026-01-10'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL 1: REQUEST NEW EVENT ────────────────────────────────── */}
      {isEventModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEventModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#06142F',
              border: '1.5px solid rgba(251, 135, 4, 0.4)',
              borderRadius: '1.5rem',
              width: '100%',
              maxWidth: '46rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(18, 49, 92, 0.6)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FB8704', textTransform: 'uppercase' }}>
                  {isAr ? 'بوابة تنظيم المؤتمرات والملتقيات' : 'Summit & Event Booking'}
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.25rem 0 0' }}>
                  {isAr ? 'طلب تنظيم إيفينت / ملتقى تداولي جديد' : 'Submit New Event Hosting Request'}
                </h3>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Event Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  {isAr ? 'عنوان وموضوع الإيفينت (بالعربية) *' : 'Event Title & Theme *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: ملتقى دبي لاحتراف تداول الذهب وإدارة السيولة 2026' : 'e.g. Dubai Gold Trading Summit 2026'}
                  value={eventForm.titleAr}
                  onChange={(e) => setEventForm({ ...eventForm, titleAr: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(2, 9, 23, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Date & Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'الميعاد والتاريخ *' : 'Event Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'وقت البدء' : 'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={eventForm.startTime}
                    onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'وقت الانتهاء' : 'End Time'}
                  </label>
                  <input
                    type="time"
                    value={eventForm.endTime}
                    onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              {/* Location & Venue */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'الدولة والمدينة *' : 'Country & City *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'مثال: دبي، الإمارات العربية المتحدة' : 'e.g. Dubai, UAE'}
                    value={eventForm.city}
                    onChange={(e) => setEventForm({ ...eventForm, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'اسم الفندق أو القاعة المقترحة' : 'Proposed Hotel or Venue'}
                  </label>
                  <input
                    type="text"
                    placeholder={isAr ? 'مثال: فندق أرماني برج خليفة أو فورسيزونز' : 'e.g. Armani Hotel Burj Khalifa'}
                    value={eventForm.venueName}
                    onChange={(e) => setEventForm({ ...eventForm, venueName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              {/* Expected Attendees & Budget */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'عدد الحضور المتوقع (العدد) *' : 'Expected Attendees Count *'}
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="5000"
                    required
                    value={eventForm.expectedAttendees}
                    onChange={(e) => setEventForm({ ...eventForm, expectedAttendees: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    {isAr ? 'المقترح: 100 - 300 متداول محترف' : 'Standard: 100 - 300 professional traders'}
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'الميزانية المرصودة والتكلفة ($ USD) *' : 'Estimated Budget ($ USD) *'}
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    required
                    value={eventForm.budgetUsd}
                    onChange={(e) => setEventForm({ ...eventForm, budgetUsd: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                    {isAr ? 'تشمل حجز القاعة، الضيافة، التجهيزات، والتصوير' : 'Includes hall, catering, AV & production'}
                  </span>
                </div>
              </div>

              {/* VIP Policy & Invitations (USER SPECIFIED) */}
              <div
                style={{
                  background: 'rgba(251, 135, 4, 0.08)',
                  border: '1px solid rgba(251, 135, 4, 0.25)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <FiAward color="#FB8704" size={18} />
                  <label style={{ fontSize: '0.875rem', fontWeight: 800, color: '#FB8704' }}>
                    {isAr ? 'طبيعة الدعوات: هل الناس دعاوي VIP؟ *' : 'Invitation Policy: VIP Guest Invitations *'}
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {[
                    {
                      id: 'VIP_INVITATIONS_ONLY',
                      labelAr: 'دعاوي VIP حصرية فقط (Private VIP Invitations Only - مخصصة لكبار العملاء والمودعين)',
                      labelEn: 'Private VIP Invitations Only (Top Depositors)',
                    },
                    {
                      id: 'HYBRID_VIP_PUBLIC',
                      labelAr: 'مختلط: مقاعد VIP أمامية مخصصة + تسجيل عام لمتداولي المنظومة',
                      labelEn: 'Hybrid: Dedicated VIP Front Rows + Open Registration',
                    },
                    {
                      id: 'OPEN_PUBLIC',
                      labelAr: 'دعوة عامة ومفتوحة لكافة أعضاء ومجتمع FXENGIN',
                      labelEn: 'Open Public Registration for Community',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.625rem',
                        fontSize: '0.8125rem',
                        color: eventForm.invitationType === opt.id ? '#FFFFFF' : '#CBD5E1',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="invitationType"
                        checked={eventForm.invitationType === opt.id}
                        onChange={() =>
                          setEventForm({
                            ...eventForm,
                            invitationType: opt.id,
                            isVipEvent: opt.id !== 'OPEN_PUBLIC',
                          })
                        }
                      />
                      <span>{isAr ? opt.labelAr : opt.labelEn}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* All Event Services & Checklist */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.625rem', color: '#CBD5E1' }}>
                  {isAr ? 'الخدمات والتجهيزات المطلوبة في الإيفينت (اختر ما يناسبكم)' : 'Required Event Services & AV Production'}
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.625rem' }}>
                  {[
                    { key: 'catering', labelAr: 'بوفيه وضيافة فاخرة (Catering)', icon: FiCoffee },
                    { key: 'mediaCoverage', labelAr: 'تصوير وتغطية فيديو 4K ودرون', icon: FiCamera },
                    { key: 'liveStreaming', labelAr: 'بث مباشر حي على قنوات FXENGIN', icon: FiTv },
                    { key: 'avStageProduction', labelAr: 'شاشات LED عملاقة ومسرح وإضاءة', icon: FiZap },
                    { key: 'fxenginSpeakers', labelAr: 'متحدثين من كبار خبراء المنظومة', icon: FiMic },
                    { key: 'brandingRollups', labelAr: 'رول أب وبادجات وهويات مشتركة', icon: FiLayers },
                    { key: 'giveaways', labelAr: 'حقائب هدايا تذكارية للمتداولين', icon: FiGift },
                  ].map((srv) => {
                    const Icon = srv.icon;
                    const isChecked = Boolean(eventForm.servicesRequested[srv.key]);
                    return (
                      <label
                        key={srv.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.6rem 0.85rem',
                          borderRadius: '0.625rem',
                          background: isChecked ? 'rgba(4, 136, 248, 0.15)' : 'rgba(2, 9, 23, 0.6)',
                          border: isChecked ? '1px solid rgba(4, 136, 248, 0.4)' : '1px solid rgba(18, 49, 92, 0.6)',
                          fontSize: '0.8125rem',
                          color: isChecked ? '#FFFFFF' : '#94A3B8',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setEventForm({
                              ...eventForm,
                              servicesRequested: {
                                ...eventForm.servicesRequested,
                                [srv.key]: e.target.checked,
                              },
                            })
                          }
                        />
                        <Icon size={14} color={isChecked ? '#0488F8' : '#64748B'} />
                        <span>{srv.labelAr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Special Notes & Target Audience */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  {isAr ? 'ملاحظات ومتطلبات خاصة للإيفينت' : 'Special Notes & Specific Requests'}
                </label>
                <textarea
                  rows="3"
                  placeholder={isAr ? 'مثال: نرجو تجهيز شاشة خاصة لبث الصفقات الحية، وتوفير بطاقات VIP مطبوعة بأسماء الضيوف...' : 'e.g. Require dedicated LED wall for live trading, custom badges...'}
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(2, 9, 23, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.875rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.625rem',
                    background: 'transparent',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '0.625rem',
                    background: 'linear-gradient(135deg, #FB8704 0%, #D96F00 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(251, 135, 4, 0.35)',
                  }}
                >
                  {isAr ? 'إرسال طلب الإيفينت للمراجعة' : 'Submit Event Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: REQUEST AD PACKAGE / CONTRACT ───────────────────── */}
      {isContractModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsContractModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#06142F',
              border: '1.5px solid rgba(4, 136, 248, 0.4)',
              borderRadius: '1.5rem',
              width: '100%',
              maxWidth: '40rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(18, 49, 92, 0.6)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0488F8', textTransform: 'uppercase' }}>
                  {isAr ? 'بوابة التعاقدات الإعلانية' : 'Ad Contracts Booking'}
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0.25rem 0 0' }}>
                  {isAr ? 'طلب تعاقد إعلاني أو رعاية ترويجية' : 'Book Ad Package / Sponsorship'}
                </h3>
              </div>
              <button
                onClick={() => setIsContractModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <FiX size={22} />
              </button>
            </div>

            <form onSubmit={handleContractSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  {isAr ? 'الباقة الإعلانية المختارة *' : 'Selected Placement Package *'}
                </label>
                <select
                  value={contractForm.placement}
                  onChange={(e) => {
                    const val = e.target.value;
                    let title = 'البانر الإعلاني الذهبي';
                    let cost = 12000;
                    if (val === 'SKYSCRAPER_RIGHT') { title = 'الشريط الإعلاني الجانبي (Skyscraper)'; cost = 9500; }
                    if (val === 'POPUP_MODAL') { title = 'النافذة المنبثقة التفاعلية (Modal)'; cost = 14000; }
                    if (val === 'VIP_SPONSOR') { title = 'رعاية غرفة التداول وإشارات VIP'; cost = 20000; }
                    setContractForm({
                      ...contractForm,
                      placement: val,
                      packageTitleAr: title,
                      budgetUsd: cost,
                    });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(2, 9, 23, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="HORIZONTAL_BANNER">البانر الذهبي في واجهة الموقع الرئيسية ($12,000 / 3 أشهر)</option>
                  <option value="SKYSCRAPER_RIGHT">الشريط الإعلاني الجانبي اللزج بمقالات الذهب ($9,500 / 3 أشهر)</option>
                  <option value="POPUP_MODAL">النافذة المنبثقة التفاعلية للزوار الجدد ($14,000 / 3 أشهر)</option>
                  <option value="VIP_SPONSOR">رعاية غرفة البث وقناة التوصيات VIP الرسمية ($20,000 / سنوي)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  {isAr ? 'عنوان الحملة الإعلانية أو العرض الترويجي *' : 'Campaign Title / Main Headline *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAr ? 'مثال: بونص ترحيبي 100% حتى $500 مع سحب فوري بدون رسوم' : 'e.g. 100% Deposit Bonus up to $500'}
                  value={contractForm.campaignTitle}
                  onChange={(e) => setContractForm({ ...contractForm, campaignTitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(2, 9, 23, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  {isAr ? 'رابط الهبوط وتتبع التسجيل (Landing Page URL) *' : 'Target / Tracking URL *'}
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://clicks.partner.com/track?ref=fxengin"
                  value={contractForm.targetUrl}
                  onChange={(e) => setContractForm({ ...contractForm, targetUrl: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(2, 9, 23, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'تاريخ بدء الحملة *' : 'Start Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                    {isAr ? 'كوبون الخصم أو كود الشريك' : 'Coupon / Promo Code'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: XM100 أو ENG"
                    value={contractForm.couponCode}
                    onChange={(e) => setContractForm({ ...contractForm, couponCode: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '0.625rem',
                      background: 'rgba(2, 9, 23, 0.7)',
                      border: '1px solid rgba(18, 49, 92, 0.8)',
                      color: '#FFFFFF',
                      outline: 'none',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.4rem', color: '#CBD5E1' }}>
                  {isAr ? 'ملاحظات إضافية' : 'Additional Notes'}
                </label>
                <textarea
                  rows="2"
                  value={contractForm.notes}
                  onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    background: 'rgba(2, 9, 23, 0.7)',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.625rem',
                    background: 'transparent',
                    border: '1px solid rgba(18, 49, 92, 0.8)',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                  }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 2rem',
                    borderRadius: '0.625rem',
                    background: 'linear-gradient(135deg, #0488F8 0%, #0056B3 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(4, 136, 248, 0.35)',
                  }}
                >
                  {isAr ? 'إرسال طلب التعاقد' : 'Submit Contract Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: VIEW FULL EVENT DOSSIER ──────────────────────────── */}
      {selectedEventView && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 8, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
            overflowY: 'auto',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEventView(null);
          }}
        >
          <div
            style={{
              background: '#06142F',
              border: '1.5px solid rgba(251, 135, 4, 0.5)',
              borderRadius: '1.5rem',
              width: '100%',
              maxWidth: '44rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              color: '#FFFFFF',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(18, 49, 92, 0.6)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FB8704' }}>
                  {selectedEventView.id} • {selectedEventView.brokerName}
                </span>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 900, margin: '0.25rem 0 0' }}>
                  {isAr ? selectedEventView.titleAr : selectedEventView.titleEn || selectedEventView.titleAr}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEventView(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <FiX size={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
              {/* Status Banner */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(251, 135, 4, 0.12)',
                  border: '1px solid rgba(251, 135, 4, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <FiInfo size={20} color="#FB8704" />
                <div>
                  <div style={{ fontWeight: 800, color: '#FB8704' }}>
                    {isAr ? 'حالة الطلب لدى إدارة FXENGIN:' : 'Status:'} {selectedEventView.status}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                    {selectedEventView.adminNotes || (isAr ? 'تم استلام الطلب وبانتظار التنسيق النهائي.' : 'Under review.')}
                  </div>
                </div>
              </div>

              {/* Grid Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', background: 'rgba(2, 9, 23, 0.6)', borderRadius: '0.75rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{isAr ? 'الميعاد' : 'Date & Time'}</span>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '0.2rem' }}>
                    {selectedEventView.eventDate} ({selectedEventView.startTime} - {selectedEventView.endTime})
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'rgba(2, 9, 23, 0.6)', borderRadius: '0.75rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{isAr ? 'المكان والقاعة' : 'Venue'}</span>
                  <div style={{ fontWeight: 700, color: '#FFFFFF', marginTop: '0.2rem' }}>
                    {selectedEventView.venueName || selectedEventView.city}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'rgba(2, 9, 23, 0.6)', borderRadius: '0.75rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{isAr ? 'العدد المتوقع' : 'Attendees'}</span>
                  <div style={{ fontWeight: 800, color: '#00E676', marginTop: '0.2rem' }}>
                    {selectedEventView.expectedAttendees} {isAr ? 'شخص' : 'Guests'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', background: 'rgba(2, 9, 23, 0.6)', borderRadius: '0.75rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem' }}>{isAr ? 'الميزانية والتكلفة' : 'Cost Budget'}</span>
                  <div style={{ fontWeight: 800, color: '#D4AF37', marginTop: '0.2rem' }}>
                    ${(selectedEventView.budgetUsd || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* VIP Perks */}
              {Array.isArray(selectedEventView.vipPerks) && selectedEventView.vipPerks.length > 0 && (
                <div>
                  <span style={{ fontWeight: 800, color: '#FB8704', display: 'block', marginBottom: '0.5rem' }}>
                    {isAr ? 'مزايا دعوات كبار الشخصيات (VIP Perks):' : 'VIP Inclusions:'}
                  </span>
                  <ul style={{ margin: 0, paddingInlineStart: '1.25rem', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {selectedEventView.vipPerks.map((p, pi) => (
                      <li key={pi}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Speakers & Audience */}
              <div>
                <span style={{ fontWeight: 800, color: '#FFFFFF', display: 'block', marginBottom: '0.25rem' }}>
                  {isAr ? 'المتحدثون والخبراء:' : 'Speakers:'}
                </span>
                <p style={{ color: '#94A3B8', margin: 0 }}>
                  {selectedEventView.speakersRequested || 'خبراء FXENGIN وممثلو الوسيط'}
                </p>
              </div>

              {selectedEventView.notes && (
                <div>
                  <span style={{ fontWeight: 800, color: '#FFFFFF', display: 'block', marginBottom: '0.25rem' }}>
                    {isAr ? 'ملاحظات خاصة:' : 'Notes:'}
                  </span>
                  <p style={{ color: '#94A3B8', margin: 0 }}>{selectedEventView.notes}</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedEventView(null)}
                style={{
                  padding: '0.65rem 1.5rem',
                  borderRadius: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
