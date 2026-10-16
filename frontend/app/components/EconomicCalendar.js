'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FiCalendar,
  FiClock,
  FiFilter,
  FiSearch,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiRefreshCw,
  FiInfo,
  FiCheck,
  FiGlobe,
  FiZap,
} from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import Anim from './Anim';

const ECONOMIC_EVENTS = [
  {
    id: 1,
    time: '15:30',
    date: 'today',
    currency: 'USD',
    flag: '',
    countryAr: 'الولايات المتحدة',
    countryEn: 'United States',
    eventAr: 'تقرير التوظيف بالقطاع غير الزراعي (NFP)',
    eventEn: 'Non-Farm Payrolls (NFP)',
    impact: 'high',
    actual: '275K',
    forecast: '200K',
    previous: '229K',
    sentiment: 'bullish',
    descAr: 'يقيس التغير في عدد الموظفين خلال الشهر السابق باستثناء القطاع الزراعي. قراءة أعلى من المتوقع تعد إيجابية للدولار الأمريكي.',
    descEn: 'Measures the change in the number of employed people during the previous month, excluding the farming industry. Higher than expected is bullish for USD.',
    affectedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD'],
  },
  {
    id: 2,
    time: '15:30',
    date: 'today',
    currency: 'USD',
    flag: '',
    countryAr: 'الولايات المتحدة',
    countryEn: 'United States',
    eventAr: 'معدل البطالة الأمريكي',
    eventEn: 'Unemployment Rate',
    impact: 'high',
    actual: '3.9%',
    forecast: '3.7%',
    previous: '3.7%',
    sentiment: 'bearish',
    descAr: 'النسبة المئوية للقوى العاملة الكلية العاطلة عن العمل وتبحث بنشاط عن عمل. قراءة أقل من المتوقع تعد إيجابية للعملة.',
    descEn: 'Percentage of the total workforce that is unemployed and actively seeking employment. Lower than expected is bullish for USD.',
    affectedPairs: ['USD/CAD', 'USD/CHF', 'US30', 'NASDAQ'],
  },
  {
    id: 3,
    time: '16:00',
    date: 'today',
    currency: 'USD',
    flag: '',
    countryAr: 'الولايات المتحدة',
    countryEn: 'United States',
    eventAr: 'مؤشر أسعار المستهلكين الأساسي (CPI) شهرياً',
    eventEn: 'Core CPI (MoM)',
    impact: 'high',
    actual: '0.4%',
    forecast: '0.3%',
    previous: '0.4%',
    sentiment: 'bullish',
    descAr: 'يقيس التغير في أسعار السلع والخدمات باستثناء الغذاء والطاقة. مؤشر تضخم رئيسي يراقبه الفيدرالي لتحديد أسعار الفائدة.',
    descEn: 'Measures changes in the price of goods and services excluding food and energy. A key gauge for Federal Reserve rate policy.',
    affectedPairs: ['XAU/USD', 'EUR/USD', 'USD/JPY'],
  },
  {
    id: 4,
    time: '12:00',
    date: 'today',
    currency: 'EUR',
    flag: '',
    countryAr: 'منطقة اليورو',
    countryEn: 'Eurozone',
    eventAr: 'قرار الفائدة الصادر عن البنك المركزي الأوروبي (ECB)',
    eventEn: 'ECB Main Refinancing Rate',
    impact: 'high',
    actual: '4.50%',
    forecast: '4.50%',
    previous: '4.50%',
    sentiment: 'neutral',
    descAr: 'سعر الفائدة على عمليات إعادة التمويل الرئيسية للبنك المركزي الأوروبي. تثبيت الفائدة تماشى مع التوقعات.',
    descEn: 'The interest rate on the main refinancing operations providing bulk liquidity to the banking system.',
    affectedPairs: ['EUR/USD', 'EUR/GBP', 'EUR/JPY'],
  },
  {
    id: 5,
    time: '12:30',
    date: 'today',
    currency: 'EUR',
    flag: '',
    countryAr: 'منطقة اليورو',
    countryEn: 'Eurozone',
    eventAr: 'المؤتمر الصحفي للبنك المركزي الأوروبي',
    eventEn: 'ECB Monetary Policy Statement & Press Conference',
    impact: 'high',
    actual: '--',
    forecast: '--',
    previous: '--',
    sentiment: 'neutral',
    descAr: 'تصريحات رئيسة البنك كريستين لاغارد حول مسار التضخم وتوقعات خفض أسعار الفائدة خلال العام الحالي.',
    descEn: 'President Christine Lagarde comments regarding the inflation outlook and interest rate trajectory.',
    affectedPairs: ['EUR/USD', 'EUR/CHF', 'DAX40'],
  },
  {
    id: 6,
    time: '09:00',
    date: 'today',
    currency: 'GBP',
    flag: '',
    countryAr: 'المملكة المتحدة',
    countryEn: 'United Kingdom',
    eventAr: 'مبيعات التجزئة البريطانية (شهرياً)',
    eventEn: 'Retail Sales (MoM)',
    impact: 'medium',
    actual: '3.4%',
    forecast: '1.5%',
    previous: '-3.2%',
    sentiment: 'bullish',
    descAr: 'يقيس التغير في القيمة الإجمالية للمبيعات المعدلة حسب التضخم على مستوى البيع بالتجزئة. نمو قوي فاق التوقعات.',
    descEn: 'Measures the change in the total value of inflation-adjusted sales at the retail level. Stronger than expected.',
    affectedPairs: ['GBP/USD', 'EUR/GBP', 'GBP/JPY'],
  },
  {
    id: 7,
    time: '17:30',
    date: 'today',
    currency: 'USD',
    flag: '',
    countryAr: 'الولايات المتحدة',
    countryEn: 'United States',
    eventAr: 'مخزون النفط الأمريكي الخام (EIA)',
    eventEn: 'EIA Crude Oil Inventories',
    impact: 'medium',
    actual: '1.367M',
    forecast: '2.116M',
    previous: '4.234M',
    sentiment: 'bullish',
    descAr: 'يقيس التغير الأسبوعي في عدد براميل النفط التجاري لدى الشركات الأمريكية. سحب أكبر من التوقع يدعم أسعار النفط.',
    descEn: 'Weekly change in the number of commercial barrels of crude oil held by US firms. Bullish for crude oil prices.',
    affectedPairs: ['USOIL', 'BRENT', 'USD/CAD'],
  },
  {
    id: 8,
    time: '01:30',
    date: 'today',
    currency: 'JPY',
    flag: '',
    countryAr: 'اليابان',
    countryEn: 'Japan',
    eventAr: 'مؤشر أسعار المستهلكين في طوكيو (سنوياً)',
    eventEn: 'Tokyo Core CPI (YoY)',
    impact: 'medium',
    actual: '2.5%',
    forecast: '2.5%',
    previous: '1.6%',
    sentiment: 'bullish',
    descAr: 'مؤشر تضخم مبكر لليابان يعزز تكهنات تخلي بنك اليابان عن أسعار الفائدة السلبية قريباً.',
    descEn: 'Leading inflation indicator for Japan fueling bets on Bank of Japan normalization policy.',
    affectedPairs: ['USD/JPY', 'EUR/JPY', 'GBPJPY'],
  },
  {
    id: 9,
    time: '15:30',
    date: 'tomorrow',
    currency: 'CAD',
    flag: '',
    countryAr: 'كندا',
    countryEn: 'Canada',
    eventAr: 'صافي التغير في التوظيف ومعدل البطالة',
    eventEn: 'Employment Change & Unemployment Rate',
    impact: 'high',
    actual: '--',
    forecast: '21.1K',
    previous: '37.3K',
    sentiment: 'neutral',
    descAr: 'تقرير سوق العمل الكندي الرئيسي الصادر عن هيئة الإحصاء الكندية.',
    descEn: 'Primary Canadian labor market report provided by Statistics Canada.',
    affectedPairs: ['USD/CAD', 'CAD/JPY', 'EUR/CAD'],
  },
  {
    id: 10,
    time: '03:30',
    date: 'tomorrow',
    currency: 'AUD',
    flag: '',
    countryAr: 'أستراليا',
    countryEn: 'Australia',
    eventAr: 'مبيعات التجزئة ومعدل التضخم الربع سنوي',
    eventEn: 'Retail Sales & CPI QoQ',
    impact: 'high',
    actual: '--',
    forecast: '0.6%',
    previous: '0.8%',
    sentiment: 'neutral',
    descAr: 'يقيس وتيرة نمو التضخم والإنفاق الاستهلاكي في الاقتصاد الأسترالي.',
    descEn: 'Measures consumer inflation and spending growth in Australia.',
    affectedPairs: ['AUD/USD', 'AUD/NZD', 'AUD/JPY'],
  },
  {
    id: 11,
    time: '19:00',
    date: 'tomorrow',
    currency: 'USD',
    flag: '',
    countryAr: 'الولايات المتحدة',
    countryEn: 'United States',
    eventAr: 'الموازنة العامة الفيدرالية',
    eventEn: 'Federal Budget Balance',
    impact: 'low',
    actual: '--',
    forecast: '-245.0B',
    previous: '-22.0B',
    sentiment: 'neutral',
    descAr: 'الفرق بين الإيرادات والمصروفات للحكومة الفيدرالية.',
    descEn: 'Difference between federal government receipts and outlays.',
    affectedPairs: ['USD/JPY', 'US30'],
  },
  {
    id: 12,
    time: '10:30',
    date: 'yesterday',
    currency: 'GBP',
    flag: '',
    countryAr: 'المملكة المتحدة',
    countryEn: 'United Kingdom',
    eventAr: 'مؤشر مديري المشتريات الإنشائي (PMI)',
    eventEn: 'Construction PMI',
    impact: 'medium',
    actual: '49.7',
    forecast: '49.0',
    previous: '48.8',
    sentiment: 'bullish',
    descAr: 'يقيس مستوى نشاط مديري المشتريات في قطاع البناء والتشييد.',
    descEn: 'Measures level of activity in the UK construction industry.',
    affectedPairs: ['GBP/USD', 'EUR/GBP'],
  },
];

const DATE_TABS = [
  { key: 'upcoming', labelAr: 'المرتقب / الأسبوع القادم', labelEn: 'Upcoming Week' },
  { key: 'all', labelAr: 'جميع الأحداث والبيانات', labelEn: 'All Releases' },
  { key: 'today', labelAr: 'اليوم وعطلة الأسبوع', labelEn: 'Today & Weekend' },
  { key: 'yesterday', labelAr: 'أمس والسابقة', labelEn: 'Yesterday & Past' },
];

const IMPACT_FILTERS = [
  { key: 'all', labelAr: 'كل التأثيرات', labelEn: 'All Impacts' },
  { key: 'high', labelAr: 'تأثير مرتفع', labelEn: 'High Impact', color: 'var(--error)' },
  { key: 'medium', labelAr: 'تأثير متوسط', labelEn: 'Medium Impact', color: 'var(--warning)' },
  { key: 'low', labelAr: 'تأثير منخفض', labelEn: 'Low Impact', color: 'var(--text-muted)' },
];

const CURRENCIES = [
  { code: 'ALL', label: 'الكل / All' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
  { code: 'JPY', label: 'JPY' },
  { code: 'CAD', label: 'CAD' },
  { code: 'AUD', label: 'AUD' },
];

export default function EconomicCalendar() {
  const { isAr } = useLanguage();

  const [eventsList, setEventsList] = useState(ECONOMIC_EVENTS);
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [impactFilter, setImpactFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [countdown, setCountdown] = useState(null);

  // Sync with live economic calendar releases
  const fetchCalendarData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/calendar?t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setEventsList(json.data);
          const now = new Date();
          const timeFormatted = now.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
          setLastUpdated(timeFormatted);
        }
      }
    } catch (err) {
      console.warn('Calendar sync notice:', err);
    } finally {
      if (manual) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [isAr]);

  useEffect(() => {
    fetchCalendarData(false);
    // Auto-poll calendar every 45s for latest figures
    const pollInterval = setInterval(() => {
      fetchCalendarData(false);
    }, 45000);
    return () => clearInterval(pollInterval);
  }, [fetchCalendarData]);

  // Live second-by-second countdown to the next major high-impact release
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const futureEvents = eventsList
        .filter((ev) => {
          if (!ev.rawDate) return false;
          const timeParts = (ev.time || '12:00').split(':');
          const h = parseInt(timeParts[0] || '12', 10);
          const m = parseInt(timeParts[1] || '0', 10);
          const eventDate = new Date(`${ev.rawDate}T00:00:00Z`);
          const targetTs = eventDate.getTime() + (h - 3) * 3600000 + m * 60000;
          return targetTs > now;
        })
        .sort((a, b) => {
          const aHigh = a.impact === 'high' ? 1 : 0;
          const bHigh = b.impact === 'high' ? 1 : 0;
          const aDate = new Date(`${a.rawDate}T${a.time || '12:00'}:00Z`).getTime();
          const bDate = new Date(`${b.rawDate}T${b.time || '12:00'}:00Z`).getTime();
          if (aHigh !== bHigh) return bHigh - aHigh;
          return aDate - bDate;
        });

      if (futureEvents.length > 0) {
        const nextEvt = futureEvents[0];
        const timeParts = (nextEvt.time || '12:00').split(':');
        const h = parseInt(timeParts[0] || '12', 10);
        const m = parseInt(timeParts[1] || '0', 10);
        const eventDate = new Date(`${nextEvt.rawDate}T00:00:00Z`);
        const targetTs = eventDate.getTime() + (h - 3) * 3600000 + m * 60000;
        const diff = Math.max(0, targetTs - now);

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setCountdown({
          event: nextEvt,
          days,
          hours,
          minutes,
          seconds,
        });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [eventsList]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return eventsList.filter((item) => {
      // 1. Date Filter
      if (dateFilter !== 'all') {
        if (dateFilter === 'upcoming') {
          if (item.date !== 'upcoming' && item.date !== 'tomorrow') return false;
        } else if (item.date !== dateFilter) {
          return false;
        }
      }

      // 2. Impact Filter
      if (impactFilter !== 'all' && item.impact !== impactFilter) {
        return false;
      }

      // 3. Currency Filter
      if (currencyFilter !== 'ALL' && item.currency !== currencyFilter) {
        return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = ((item.eventAr || '') + ' ' + (item.eventEn || '')).toLowerCase().includes(q);
        const matchCountry = ((item.countryAr || '') + ' ' + (item.countryEn || '')).toLowerCase().includes(q);
        const matchCurrency = (item.currency || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCountry && !matchCurrency) return false;
      }

      return true;
    });
  }, [eventsList, dateFilter, impactFilter, currencyFilter, searchQuery]);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatDateBadge = (rawDate) => {
    if (!rawDate) return '';
    try {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const daysAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return isAr ? `${daysAr[d.getDay()]} ${d.getDate()} ${monthsAr[d.getMonth()]}` : rawDate;
      }
    } catch {
      return rawDate;
    }
    return rawDate;
  };

  const cleanValue = (str) => {
    if (!str || str === '--') return '--';
    let s = String(str).replace(/^Est\.\s*/i, '').trim();
    if (s.toLowerCase().includes('manufacturing')) {
      const m = s.match(/([+-]?\d+(?:\.\d+)?%?)/);
      if (m) return m[1];
    }
    s = s.replace(/\bannual\b/i, '')
         .replace(/\bYoY\b/i, '')
         .replace(/\bMoM\b/i, '')
         .replace(/^[,\s]+|[,\s]+$/g, '')
         .trim();
    if (s.length > 16) {
      s = s.slice(0, 14) + '..';
    }
    return s || '--';
  };

  const getImpactBadge = (impact) => {
    switch (impact) {
      case 'high':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(246, 70, 93, 0.15)',
              color: 'var(--error)',
              border: '1px solid rgba(246, 70, 93, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--error)' }} />
            {isAr ? 'مرتفع' : 'High'}
          </span>
        );
      case 'medium':
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 800,
              background: 'rgba(251, 191, 36, 0.15)',
              color: 'var(--warning)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning)' }} />
            {isAr ? 'متوسط' : 'Med'}
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            {isAr ? 'منخفض' : 'Low'}
          </span>
        );
    }
  };

  return (
    <section
      id="economic-calendar-section"
      style={{
        padding: '30px 0 60px',
        position: 'relative',
      }}
    >
      <div className="container">
        <Anim>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  className="badge badge-blue"
                  style={{
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                  }}
                >
                  <FiCalendar size={13} />
                  {isAr ? 'الأجندة الاقتصادية اللحظية' : 'Real-Time Economic Pulse'}
                </span>
              </div>
              <h2
                style={{
                  fontSize: 'clamp(22px, 3vw, 32px)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span>{isAr ? 'التقويم الاقتصادي ' : 'Live Economic '}</span>
                <span className="text-gradient-brand">{isAr ? 'وأهم الأخبار والبيانات' : 'Calendar & Data'}</span>
              </h2>
            </div>

            {/* Live Indicator Pulse & Refresh Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fetchCalendarData(true)}
                disabled={isRefreshing}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  background: isRefreshing ? 'rgba(4, 136, 248, 0.25)' : 'rgba(4, 136, 248, 0.12)',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: isRefreshing ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(4, 136, 248, 0.2)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(4, 136, 248, 0.25)')}
                onMouseLeave={(e) => {
                  if (!isRefreshing) e.currentTarget.style.background = 'rgba(4, 136, 248, 0.12)';
                }}
              >
                <FiRefreshCw
                  size={14}
                  style={{
                    animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    color: 'var(--primary)',
                  }}
                />
                <span>
                  {isRefreshing
                    ? isAr
                      ? 'جاري التحديث...'
                      : 'Updating...'
                    : isAr
                    ? 'تحديث لحظي'
                    : 'Live Refresh'}
                </span>
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(6, 20, 47, 0.85)',
                  border: '1px solid rgba(4, 136, 248, 0.3)',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    boxShadow: '0 0 10px var(--success)',
                    display: 'inline-block',
                  }}
                />
                <span>
                  {isAr
                    ? `مباشر GMT+3 ${lastUpdated ? `• آخر فحص: ${lastUpdated}` : ''}`
                    : `Live GMT+3 ${lastUpdated ? `• Synced: ${lastUpdated}` : ''}`}
                </span>
              </div>
            </div>
          </div>

          {/* Live Countdown Banner to Next Major Release */}
          {countdown && countdown.event && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(4, 136, 248, 0.14) 0%, rgba(1, 7, 30, 0.85) 50%, rgba(251, 135, 4, 0.14) 100%)',
                border: '1px solid rgba(4, 136, 248, 0.35)',
                borderRadius: '16px',
                padding: '14px 20px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                boxShadow: '0 8px 30px rgba(0, 3, 13, 0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(251, 135, 4, 0.15)',
                    border: '1px solid rgba(251, 135, 4, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                  }}
                >
                  <FiZap size={20} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '2px' }}>
                    {isAr ? 'الحدث الاقتصادي الأبرز المرتقب' : 'Next High-Impact Economic Event'}
                  </div>
                  <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{isAr ? countdown.event.eventAr : countdown.event.eventEn}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '6px' }}>
                      {countdown.event.rawDate} • {countdown.event.time} GMT+3
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown Ticker Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace' }}>
                {countdown.days > 0 && (
                  <div style={{ textAlign: 'center', background: 'rgba(1, 7, 30, 0.9)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 12px', minWidth: '48px' }}>
                    <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>{String(countdown.days).padStart(2, '0')}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{isAr ? 'يوم' : 'DAYS'}</div>
                  </div>
                )}
                <div style={{ textAlign: 'center', background: 'rgba(1, 7, 30, 0.9)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 12px', minWidth: '48px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>{String(countdown.hours).padStart(2, '0')}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{isAr ? 'ساعة' : 'HRS'}</div>
                </div>
                <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '18px' }}>:</span>
                <div style={{ textAlign: 'center', background: 'rgba(1, 7, 30, 0.9)', border: '1px solid var(--border)', borderRadius: '10px', padding: '6px 12px', minWidth: '48px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>{String(countdown.minutes).padStart(2, '0')}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{isAr ? 'دقيقة' : 'MIN'}</div>
                </div>
                <span style={{ fontWeight: 900, color: 'var(--accent)', fontSize: '18px' }}>:</span>
                <div style={{ textAlign: 'center', background: 'rgba(251, 135, 4, 0.15)', border: '1px solid rgba(251, 135, 4, 0.45)', borderRadius: '10px', padding: '6px 12px', minWidth: '48px' }}>
                  <div style={{ fontSize: '17px', fontWeight: 900, color: 'var(--accent)', lineHeight: 1.1 }}>{String(countdown.seconds).padStart(2, '0')}</div>
                  <div style={{ fontSize: '9px', color: 'var(--accent)', marginTop: '2px' }}>{isAr ? 'ثانية' : 'SEC'}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Control Ribbon: Date Tabs + Impact + Currency + Search ── */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 10px 30px rgba(0, 3, 13, 0.45)',
            }}
          >
            {/* Top Row: Date Tabs & Currency Selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              {/* Date Tabs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(1, 7, 30, 0.7)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid rgba(18, 49, 92, 0.5)',
                }}
              >
                {DATE_TABS.map((tab) => {
                  const isActive = dateFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setDateFilter(tab.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                        background: isActive ? 'var(--primary)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? '0 0 12px rgba(4, 136, 248, 0.4)' : 'none',
                      }}
                    >
                      {isAr ? tab.labelAr : tab.labelEn}
                    </button>
                  );
                })}
              </div>

              {/* Currency Badges Quick Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginInlineEnd: '4px' }}>
                  {isAr ? 'العملة:' : 'Currency:'}
                </span>
                {CURRENCIES.map((curr) => {
                  const isSelected = currencyFilter === curr.code;
                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => setCurrencyFilter(curr.code)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                        background: isSelected ? 'rgba(251, 135, 4, 0.14)' : 'rgba(1, 7, 30, 0.5)',
                        border: isSelected ? '1px solid rgba(251, 135, 4, 0.4)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {curr.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row: Impact Filter Buttons + Live Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              {/* Impact Level Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginInlineEnd: '4px' }}>
                  {isAr ? 'التأثير:' : 'Impact:'}
                </span>
                {IMPACT_FILTERS.map((imp) => {
                  const isSelected = impactFilter === imp.key;
                  return (
                    <button
                      key={imp.key}
                      type="button"
                      onClick={() => setImpactFilter(imp.key)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                        background: isSelected ? (imp.color || 'var(--primary)') : 'rgba(1, 7, 30, 0.5)',
                        border: isSelected ? `1px solid ${imp.color || 'var(--primary)'}` : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isAr ? imp.labelAr : imp.labelEn}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', width: '260px', maxWidth: '100%', minWidth: 0 }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isAr ? 'بحث بالحدث أو الدولة...' : 'Search event, country...'}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: isAr ? '0 12px 0 34px' : '0 34px 0 12px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
                <FiSearch
                  size={14}
                  color="var(--text-muted)"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    [isAr ? 'left' : 'right']: '10px',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Economic Calendar Data Table ── */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 12px 36px rgba(0, 3, 13, 0.5)',
            }}
          >
            {/* Scrollable Container with Custom Scrollbar */}
            <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch', minWidth: 0, maxWidth: '100%' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: isAr ? 'right' : 'left',
                  fontSize: '13px',
                  minWidth: '780px',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'rgba(1, 7, 30, 0.95)',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    <th style={{ padding: '14px 18px', width: '90px' }}>{isAr ? 'الوقت' : 'Time'}</th>
                    <th style={{ padding: '14px 18px', width: '100px' }}>{isAr ? 'العملة' : 'Cur'}</th>
                    <th style={{ padding: '14px 18px', width: '100px' }}>{isAr ? 'التأثير' : 'Impact'}</th>
                    <th style={{ padding: '14px 18px' }}>{isAr ? 'الحدث الاقتصادي' : 'Economic Event'}</th>
                    <th style={{ padding: '14px 18px', width: '100px', textAlign: 'center' }}>{isAr ? 'الفعلي' : 'Actual'}</th>
                    <th style={{ padding: '14px 18px', width: '100px', textAlign: 'center' }}>{isAr ? 'التقديري' : 'Forecast'}</th>
                    <th style={{ padding: '14px 18px', width: '100px', textAlign: 'center' }}>{isAr ? 'السابق' : 'Previous'}</th>
                    <th style={{ padding: '14px 18px', width: '60px', textAlign: 'center' }}></th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((evt) => {
                      const isExpanded = expandedRow === evt.id;
                      const isBullish = evt.sentiment === 'bullish';
                      const isBearish = evt.sentiment === 'bearish';

                      return (
                        <tr
                          key={evt.id}
                          style={{
                            borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
                            background: isExpanded ? 'rgba(4, 136, 248, 0.06)' : 'transparent',
                            transition: 'background 0.15s ease',
                            cursor: 'pointer',
                          }}
                          onClick={() => toggleRow(evt.id)}
                          onMouseEnter={(e) => {
                            if (!isExpanded) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isExpanded) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {/* Time */}
                          <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiClock size={13} color="var(--primary)" />
                              <span>{evt.time}</span>
                            </div>
                            {evt.rawDate && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
                                {formatDateBadge(evt.rawDate)}
                              </div>
                            )}
                          </td>

                          {/* Currency & Flag */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              <span>{evt.currency}</span>
                            </div>
                          </td>

                          {/* Impact */}
                          <td style={{ padding: '14px 18px' }}>{getImpactBadge(evt.impact)}</td>

                          {/* Event Title */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13.5px', marginBottom: '2px' }}>
                              {isAr ? evt.eventAr : evt.eventEn}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                              {isAr ? evt.countryAr : evt.countryEn}
                            </div>
                          </td>

                          {/* Actual */}
                          <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 800 }}>
                            {evt.actual !== '--' ? (
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: isBullish
                                    ? 'rgba(22, 199, 132, 0.15)'
                                    : isBearish
                                    ? 'rgba(246, 70, 93, 0.15)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                  color: isBullish
                                    ? 'var(--success)'
                                    : isBearish
                                    ? 'var(--error)'
                                    : 'var(--text-primary)',
                                  border: isBullish
                                    ? '1px solid rgba(22, 199, 132, 0.35)'
                                    : isBearish
                                    ? '1px solid rgba(246, 70, 93, 0.35)'
                                    : '1px solid var(--border)',
                                }}
                              >
                                {evt.actual}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: 'var(--text-muted)',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <FiClock size={11} />
                                <span>{isAr ? 'مرتقب' : 'Pending'}</span>
                              </span>
                            )}
                          </td>

                          {/* Forecast */}
                          <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                            {cleanValue(evt.forecast)}
                          </td>

                          {/* Previous */}
                          <td style={{ padding: '14px 18px', textAlign: 'center', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {cleanValue(evt.previous)}
                          </td>

                          {/* Expand Trigger Icon */}
                          <td style={{ padding: '14px 18px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {isExpanded ? <FiChevronUp size={16} color="var(--primary)" /> : <FiChevronDown size={16} />}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FiAlertCircle size={24} style={{ margin: '0 auto 8px', display: 'block', color: 'var(--primary)' }} />
                        {isAr ? 'لا توجد بيانات أو أخبار مطابقة للتصفية الحالية' : 'No economic events matching current filters'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Expandable Details Drawer inside Table */}
            {expandedRow && (
              <div
                style={{
                  background: 'rgba(1, 7, 30, 0.95)',
                  borderTop: '1px solid rgba(4, 136, 248, 0.3)',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {(() => {
                  const event = eventsList.find((e) => e.id === expandedRow) || ECONOMIC_EVENTS.find((e) => e.id === expandedRow);
                  if (!event) return null;

                  return (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
                        <FiInfo size={15} />
                        <span>{isAr ? 'شرح وتأثير هذا المؤشر على التداول:' : 'Event Insight & Market Impact:'}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 12px 0' }}>
                        {isAr ? event.descAr : event.descEn}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {isAr ? 'أهم الأزواج المتأثرة:' : 'Affected Pairs:'}
                        </span>
                        {(event.affectedPairs || ['EUR/USD', 'USD/JPY', 'XAU/USD']).map((pair) => (
                          <span
                            key={pair}
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              background: 'rgba(4, 136, 248, 0.12)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(4, 136, 248, 0.3)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {pair}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </Anim>
      </div>
    </section>
  );
}
