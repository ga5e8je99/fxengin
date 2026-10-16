'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  IoAddCircleOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoEyeOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoOpenOutline,
  IoGridOutline,
  IoListOutline,
  IoDocumentTextOutline,
  IoPersonOutline,
  IoHelpCircleOutline,
  IoBulbOutline,
  IoSparklesOutline,
  IoTimeOutline,
  IoCalendarOutline,
  IoPricetagOutline,
  IoTrendingUpOutline,
  IoBarChartOutline,
  IoShieldCheckmarkOutline,
  IoHardwareChipOutline,
  IoChatbubblesOutline,
  IoLanguageOutline,
  IoFlashOutline,
  IoCloudUploadOutline,
  IoSendOutline,
  IoVideocamOutline,
  IoLinkOutline,
  IoPlayOutline,
  IoAddOutline,
  // ── Curated Trading & Finance Vector Icons ──
  IoTrendingDownOutline,
  IoStatsChartOutline,
  IoAnalyticsOutline,
  IoLockClosedOutline,
  IoWarningOutline,
  IoSpeedometerOutline,
  IoPulseOutline,
  IoCashOutline,
  IoWalletOutline,
  IoDiamondOutline,
  IoGlobeOutline,
  IoFlameOutline,
  IoCompassOutline,
  IoRocketOutline,
  IoDiscOutline,
  IoLayersOutline,
  IoFlagOutline,
  IoMedalOutline,
  IoBookOutline,
  IoCheckmarkOutline,
  IoImageOutline,
} from 'react-icons/io5';
import CloudUploadWidget from '../../components/storage/CloudUploadWidget';
import {
  getArticlesList,
  createArticle,
  updateArticle,
  deleteArticle,
  dispatchArticleToN8n,
  syncAllArticlesToN8n,
  ARTICLE_CATEGORIES,
} from '../../services/articleService';
import { translateText, translateBatch } from '../../services/translationService';

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';

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

export const ARTICLE_IMAGE_PRESETS = [
  {
    name: 'الذهب (XAUUSD)',
    icon: '',
    url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'بيتكوين (BTCUSD)',
    icon: '₿',
    url: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'الفوركس والعملات',
    icon: '',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'المؤشرات والأسهم',
    icon: '',
    url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'النفط والطاقة',
    icon: '',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'شاشات التداول الحية',
    icon: '',
    url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
  },
];

export const ARTICLE_ICONS_LIBRARY = [
  // ── Charts & Analysis (الرسوم البيانية والتحليل الفني) ──
  { key: 'bar-chart', nameAr: 'شارت أعمدة وسيولة', nameEn: 'Bar Chart / Liquidity', icon: IoBarChartOutline, group: 'charts' },
  { key: 'trending-up', nameAr: 'اتجاه صاعد (Bullish)', nameEn: 'Bullish Uptrend', icon: IoTrendingUpOutline, group: 'charts' },
  { key: 'trending-down', nameAr: 'اتجاه هابط (Bearish)', nameEn: 'Bearish Downtrend', icon: IoTrendingDownOutline, group: 'charts' },
  { key: 'stats-chart', nameAr: 'إحصائيات وفوليوم', nameEn: 'Volume & Stats', icon: IoStatsChartOutline, group: 'charts' },
  { key: 'analytics', nameAr: 'تحليل موجي ومتقدم', nameEn: 'Advanced Analytics', icon: IoAnalyticsOutline, group: 'charts' },

  // ── Risk & Capital Protection (إدارة المخاطر وحماية رأس المال) ──
  { key: 'shield-check', nameAr: 'إدارة المخاطر ووقف الخسارة', nameEn: 'Risk Management', icon: IoShieldCheckmarkOutline, group: 'risk' },
  { key: 'lock-closed', nameAr: 'أمان وتأمين الحساب', nameEn: 'Account Protection', icon: IoLockClosedOutline, group: 'risk' },
  { key: 'warning', nameAr: 'تنبيهات وتقلبات السوق', nameEn: 'Market Alert', icon: IoWarningOutline, group: 'risk' },

  // ── Algo, AI & Execution (الذكاء الاصطناعي والتداول الآلي) ──
  { key: 'hardware-chip', nameAr: 'خوارزميات وروبوت آلي', nameEn: 'Algo & Expert', icon: IoHardwareChipOutline, group: 'algo' },
  { key: 'flash', nameAr: 'سكالبينج وتنفيذ فوري', nameEn: 'Scalping & Speed', icon: IoFlashOutline, group: 'algo' },
  { key: 'speedometer', nameAr: 'مؤشر الزخم وسرعة الحركة', nameEn: 'Momentum', icon: IoSpeedometerOutline, group: 'algo' },
  { key: 'sparkles', nameAr: 'إشارات وفرص ذكية', nameEn: 'Smart Signals', icon: IoSparklesOutline, group: 'algo' },
  { key: 'pulse', nameAr: 'نبض السوق ونشاط الأسعار', nameEn: 'Market Pulse', icon: IoPulseOutline, group: 'algo' },

  // ── Currencies, Assets & Wealth (العملات والأصول والذهب) ──
  { key: 'cash', nameAr: 'تداول العملات (Forex)', nameEn: 'Forex Cash', icon: IoCashOutline, group: 'assets' },
  { key: 'wallet', nameAr: 'محفظة مالية وأرباح', nameEn: 'Wallet & Profit', icon: IoWalletOutline, group: 'assets' },
  { key: 'diamond', nameAr: 'الذهب والسلع الثمينة (XAU)', nameEn: 'Gold & Commodities', icon: IoDiamondOutline, group: 'assets' },
  { key: 'globe', nameAr: 'الأسواق والمؤشرات العالمية', nameEn: 'Global Indices', icon: IoGlobeOutline, group: 'assets' },

  // ── Strategy & Psychology (الاستراتيجيات وسيكولوجية التداول) ──
  { key: 'eye', nameAr: 'سيكولوجية وانضباط المتداول', nameEn: 'Trading Psychology', icon: IoEyeOutline, group: 'strategy' },
  { key: 'bulb', nameAr: 'أفكار وحيل ذكية', nameEn: 'Trading Ideas', icon: IoBulbOutline, group: 'strategy' },
  { key: 'flame', nameAr: 'صفقات ساخنة ومحركات السوق', nameEn: 'Hot Trades', icon: IoFlameOutline, group: 'strategy' },
  { key: 'compass', nameAr: 'بوصلة وخريطة السوق', nameEn: 'Market Compass', icon: IoCompassOutline, group: 'strategy' },
  { key: 'rocket', nameAr: 'انفجار سعري واختراق', nameEn: 'Breakout & Rally', icon: IoRocketOutline, group: 'strategy' },
  { key: 'target', nameAr: 'تحقيق الأهداف وجني الأرباح', nameEn: 'Profit Targets', icon: IoDiscOutline, group: 'strategy' },
  { key: 'layers', nameAr: 'دعوم ومقاومات وفيبوناتشي', nameEn: 'Support & Fib', icon: IoLayersOutline, group: 'strategy' },
  { key: 'flag', nameAr: 'نماذج فنية ومحطات سعرية', nameEn: 'Chart Patterns', icon: IoFlagOutline, group: 'strategy' },
  { key: 'medal', nameAr: 'استراتيجيات معتمدة واحترافية', nameEn: 'Pro Strategy', icon: IoMedalOutline, group: 'strategy' },
  { key: 'book', nameAr: 'دليل تعليمي وأساسيات', nameEn: 'Playbook Guide', icon: IoBookOutline, group: 'strategy' },
];

export const ICON_GROUPS = [
  { key: 'all', labelAr: 'الكل' },
  { key: 'charts', labelAr: 'شارت وتحليل' },
  { key: 'risk', labelAr: 'أمان ومخاطر' },
  { key: 'algo', labelAr: 'ذكاء وآلي' },
  { key: 'assets', labelAr: 'عملات وذهب' },
  { key: 'strategy', labelAr: 'استراتيجيات' },
];

function getCategoryIcon(catKeyOrIconKey, className = 'text-3xl') {
  if (catKeyOrIconKey) {
    const found = ARTICLE_ICONS_LIBRARY.find((i) => i.key === catKeyOrIconKey);
    if (found) {
      const IconComp = found.icon;
      return <IconComp className={className} />;
    }
  }
  switch (catKeyOrIconKey) {
    case 'technical':
      return <IoBarChartOutline className={className} />;
    case 'risk':
      return <IoShieldCheckmarkOutline className={className} />;
    case 'algo':
      return <IoHardwareChipOutline className={className} />;
    case 'psychology':
      return <IoEyeOutline className={className} />;
    default:
      return <IoTrendingUpOutline className={className} />;
  }
}

export default function ArticlesManagementPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // n8n Webhook state
  const [syncingN8n, setSyncingN8n] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [activeModalTab, setActiveModalTab] = useState('basic'); // 'basic' | 'excerpt' | 'author' | 'takeaways' | 'sections' | 'faqs' | 'media'

  // Auto-translation state
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [translatingFields, setTranslatingFields] = useState({});
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const debounceTimers = useRef({});

  // Icon Picker State
  const [iconFilterGroup, setIconFilterGroup] = useState('all');
  const [iconSearchTerm, setIconSearchTerm] = useState('');

  const filteredIconsList = useMemo(() => {
    return ARTICLE_ICONS_LIBRARY.filter((item) => {
      const matchGroup = iconFilterGroup === 'all' || item.group === iconFilterGroup;
      const matchSearch =
        !iconSearchTerm.trim() ||
        item.nameAr.toLowerCase().includes(iconSearchTerm.trim().toLowerCase()) ||
        item.nameEn.toLowerCase().includes(iconSearchTerm.trim().toLowerCase()) ||
        item.key.toLowerCase().includes(iconSearchTerm.trim().toLowerCase());
      return matchGroup && matchSearch;
    });
  }, [iconFilterGroup, iconSearchTerm]);

  // Initial Form Template
  const defaultArticleState = {
    id: '',
    slug: '',
    categoryKey: 'strategies',
    iconKey: '',
    category: 'استراتيجيات التداول',
    categoryEn: 'Trading Strategies',
    titleAr: '',
    titleEn: '',
    excerptAr: '',
    excerptEn: '',
    authorAr: 'م. سليمان داود',
    authorEn: 'Eng. Sleman Daowed',
    authorRoleAr: 'كبير محللي الأسواق',
    authorRoleEn: 'Chief Market Strategist',
    authorBioAr: 'خبير أسواق مالية ومحلل فني معتمد لدى منصة FXENGIN بخبرة واسعة في تداول العملات والسلع وتحليل حركة الأسعار.',
    authorBioEn: 'Certified market strategist and technical analyst at FXENGIN, specializing in forex, commodities, and price action dynamics.',
    authorImg: '/assets/Images/Avatar/avatar1.webp',
    dateAr: '',
    dateEn: '',
    readTimeAr: '7 دقائق قراءة',
    readTimeEn: '7 min read',
    featured: false,
    views: '12.4K',
    accentColor: '#0488F8',
    status: 'DRAFT',
    tags: ['Forex', 'Trading', 'Analysis'],
    tagsInput: 'Forex, Trading, Analysis',
    keyTakeaways: [
      {
        ar: 'التداول بالاتجاه العام (Trend Following) يوفر احتمالية نجاح أعلى للمتداول المبتدئ.',
        en: 'Trend following provides the highest probability edge for novice traders.',
      },
    ],
    sections: [
      {
        id: 'intro',
        headingAr: '1. مقدمة وأساسيات الاستراتيجية',
        headingEn: '1. Introduction & Strategy Foundations',
        bodyAr: 'اكتب تفاصيل ومحتوى هذا القسم باللغة العربية هنا...',
        bodyEn: 'Write the details and editorial content of this section in English here...',
        tipAr: 'لا تضف مؤشراً إلى الشارت إلا إذا كان يجيبك عن سؤال محدد.',
        tipEn: 'Never add an indicator unless it answers a specific analytical question.',
      },
    ],
    faqs: [
      {
        qAr: 'كم من الوقت أحتاج لتطبيق هذه الاستراتيجية باحتراف؟',
        qEn: 'How long does it take to master this strategy?',
        aAr: 'يحتاج معظم المتداولين من 4 إلى 8 أسابيع من التدريب اليومي على حساب تجريبي.',
        aEn: 'Most traders require 4 to 8 weeks of deliberate daily practice on a demo account.',
      },
    ],
    symbol: '',
    coverImage: '',
    chartImage: '',
    tradingViewUrl: '',
    videoUrl: '',
    links: [
      {
        titleAr: 'قناة التوصيات والتحليلات الرسمية على Telegram',
        titleEn: 'Official Telegram Channel',
        url: 'https://t.me/FXENGIN',
        type: 'telegram',
      },
    ],
  };

  const [formData, setFormData] = useState(defaultArticleState);

  // ── TradingView Importer Studio State ──
  const [isTvModalOpen, setIsTvModalOpen] = useState(false);
  const [tvActiveTab, setTvActiveTab] = useState('feed'); // 'feed' | 'url'
  const [tvCategory, setTvCategory] = useState('all');
  const [tvSearch, setTvSearch] = useState('');
  const [tvFeedItems, setTvFeedItems] = useState([]);
  const [tvFeedLoading, setTvFeedLoading] = useState(false);
  const [tvProcessingId, setTvProcessingId] = useState(null);
  const [tvDirectUrl, setTvDirectUrl] = useState('');
  const [tvUrlLoading, setTvUrlLoading] = useState(false);

  // Load TradingView Feed
  const loadTradingViewFeed = async (category = 'all', symbol = '') => {
    setTvFeedLoading(true);
    try {
      let url = '/api/tradingview/feed?limit=30';
      if (category && category !== 'all') url += `&category=${encodeURIComponent(category)}`;
      if (symbol) url += `&symbol=${encodeURIComponent(symbol)}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.items)) {
        setTvFeedItems(json.items);
      } else {
        toast.error(json.error || 'تعذر جلب تحليلات TradingView');
      }
    } catch (err) {
      toast.error('خطأ في الاتصال بخلاصة TradingView');
    } finally {
      setTvFeedLoading(false);
    }
  };

  // Import directly from feed item
  const handleImportFromFeed = async (item) => {
    setTvProcessingId(item.id);
    toast.info(`جاري جلب وصياغة فكرة ${item.symbol || ''} بأسلوب مدونات FXENGIN...`);
    try {
      const res = await fetch('/api/tradingview/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      const json = await res.json();
      if (json.success && json.article) {
        const art = json.article;
        const takeaways = (art.keyTakeawaysAr || []).map((arText, i) => ({
          ar: arText,
          en: (art.keyTakeawaysEn && art.keyTakeawaysEn[i]) || '',
        }));

        setModalMode('create');
        setActiveModalTab('basic');
        setFormData({
          ...defaultArticleState,
          ...art,
          id: '',
          authorAr: 'م. سليمان داود',
          authorEn: 'Eng. Sleman Daowed',
          authorRoleAr: 'كبير محللي الأسواق',
          authorRoleEn: 'Chief Market Strategist',
          authorBioAr: 'خبير أسواق مالية ومحلل فني معتمد لدى منصة FXENGIN بخبرة واسعة في تداول العملات والسلع وتحليل حركة الأسعار.',
          authorBioEn: 'Certified market strategist and technical analyst at FXENGIN, specializing in forex, commodities, and price action dynamics.',
          status: 'DRAFT',
          coverImage: art.coverImage || art.chartImage || item.chartImage || '',
          chartImage: art.chartImage || art.coverImage || item.chartImage || '',
          tagsInput: Array.isArray(art.tags) ? art.tags.join(', ') : '',
          keyTakeaways: takeaways.length > 0 ? takeaways : defaultArticleState.keyTakeaways,
          sections: Array.isArray(art.sections) && art.sections.length > 0 ? art.sections : defaultArticleState.sections,
          faqs: Array.isArray(art.faqs) ? art.faqs : [],
        });

        setIsTvModalOpen(false);
        setIsModalOpen(true);
        toast.success('تم تحويل وتنسيق المقال بنجاح كمسودة (DRAFT)! يمكنك مراجعته وتعديله الآن ثم حفظه أو نشره.');
      } else {
        toast.error(json.error || 'فشل في استيراد المقال');
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء استيراد المقال');
    } finally {
      setTvProcessingId(null);
    }
  };

  // Import from direct URL
  const handleImportFromUrl = async (e) => {
    e.preventDefault();
    if (!tvDirectUrl || !tvDirectUrl.includes('tradingview.com')) {
      toast.warn('يرجى إدخال رابط فكرة أو تحليل صحيح من موقع TradingView');
      return;
    }

    setTvUrlLoading(true);
    toast.info('جاري فحص رابط TradingView واستخراج الشارت وصياغة المقال...');
    try {
      const res = await fetch('/api/tradingview/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tvDirectUrl.trim() }),
      });
      const json = await res.json();
      if (json.success && json.article) {
        const art = json.article;
        const takeaways = (art.keyTakeawaysAr || []).map((arText, i) => ({
          ar: arText,
          en: (art.keyTakeawaysEn && art.keyTakeawaysEn[i]) || '',
        }));

        setModalMode('create');
        setActiveModalTab('basic');
        setFormData({
          ...defaultArticleState,
          ...art,
          id: '',
          authorAr: 'م. سليمان داود',
          authorEn: 'Eng. Sleman Daowed',
          authorRoleAr: 'كبير محللي الأسواق',
          authorRoleEn: 'Chief Market Strategist',
          authorBioAr: 'خبير أسواق مالية ومحلل فني معتمد لدى منصة FXENGIN بخبرة واسعة في تداول العملات والسلع وتحليل حركة الأسعار.',
          authorBioEn: 'Certified market strategist and technical analyst at FXENGIN, specializing in forex, commodities, and price action dynamics.',
          status: 'DRAFT',
          coverImage: art.coverImage || art.chartImage || '',
          chartImage: art.chartImage || art.coverImage || '',
          tagsInput: Array.isArray(art.tags) ? art.tags.join(', ') : '',
          keyTakeaways: takeaways.length > 0 ? takeaways : defaultArticleState.keyTakeaways,
          sections: Array.isArray(art.sections) && art.sections.length > 0 ? art.sections : defaultArticleState.sections,
          faqs: Array.isArray(art.faqs) ? art.faqs : [],
        });

        setIsTvModalOpen(false);
        setIsModalOpen(true);
        setTvDirectUrl('');
        toast.success('تم استيراد وتنسيق المقال بنجاح كمسودة (DRAFT)! يمكنك مراجعته وتعديله الآن.');
      } else {
        toast.error(json.error || 'فشل في فحص واستيراد الرابط');
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء جلب الرابط');
    } finally {
      setTvUrlLoading(false);
    }
  };

  // On-demand TradingView chart extractor for modal form
  const [extractingTvImage, setExtractingTvImage] = useState(false);
  const handleExtractTvChart = async () => {
    const url = formData.tradingViewUrl;
    if (!url || !url.includes('tradingview.com')) {
      toast.warn('يرجى إدخال رابط فكرة أو شارت صحيح من موقع TradingView أولاً');
      return;
    }
    setExtractingTvImage(true);
    toast.info('جاري فحص الرابط واستخراج صورة الشارت الفني...');
    try {
      const res = await fetch('/api/tradingview/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.success && (data.article?.coverImage || data.source?.coverImage)) {
        const img = data.article?.coverImage || data.source?.coverImage;
        setFormData((prev) => ({
          ...prev,
          coverImage: img,
          chartImage: img,
          symbol: prev.symbol || data.article?.symbol || '',
        }));
        toast.success('تم استخراج صورة الشارت من TradingView بنجاح!');
      } else {
        toast.error(data.error || 'تعذر استخراج صورة الشارت من هذا الرابط');
      }
    } catch (e) {
      toast.error('خطأ أثناء جلب صورة الشارت: ' + (e.message || 'Error'));
    } finally {
      setExtractingTvImage(false);
    }
  };

  // Load Data
  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getArticlesList();
      setArticles(data);
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل المقالات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  // Filtered List
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchCat =
        categoryFilter === 'ALL' ||
        art.categoryKey === categoryFilter ||
        art.category === categoryFilter;

      const matchStatus =
        statusFilter === 'ALL' || (art.status || 'PUBLISHED') === statusFilter;

      const q = searchTerm.toLowerCase().trim();
      if (!q) return matchCat && matchStatus;

      const titleAr = (art.titleAr || '').toLowerCase();
      const titleEn = (art.titleEn || '').toLowerCase();
      const author = (art.authorAr || art.authorEn || '').toLowerCase();
      const tags = Array.isArray(art.tags) ? art.tags.join(' ').toLowerCase() : '';

      return matchCat && matchStatus && (titleAr.includes(q) || titleEn.includes(q) || author.includes(q) || tags.includes(q));
    });
  }, [articles, categoryFilter, statusFilter, searchTerm]);

  // Telemetry Calculations
  const stats = useMemo(() => {
    const total = articles.length;
    const published = articles.filter((a) => (a.status || 'PUBLISHED') === 'PUBLISHED').length;
    const featured = articles.find((a) => a.featured);
    const viewsSum = articles.reduce((acc, a) => {
      const v = String(a.views || '0').replace(/[^\d.]/g, '');
      const num = parseFloat(v) || 0;
      return acc + (String(a.views).includes('K') ? num * 1000 : num);
    }, 0);

    return {
      total,
      published,
      featuredTitle: featured ? (featured.titleAr || featured.titleEn) : 'لا يوجد حالياً',
      totalViews: viewsSum > 1000 ? `${(viewsSum / 1000).toFixed(1)}K+` : viewsSum,
    };
  }, [articles]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveModalTab('basic');
    setFormData({
      ...defaultArticleState,
      id: '',
      titleAr: '',
      titleEn: '',
      excerptAr: '',
      excerptEn: '',
      iconKey: '',
      tagsInput: 'Forex, Strategies, Risk Management',
      tags: ['Forex', 'Strategies', 'Risk Management'],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (article) => {
    setModalMode('edit');
    setActiveModalTab('basic');

    // Prepare paired keyTakeaways
    const takeaways = [];
    const arList = Array.isArray(article.keyTakeawaysAr) ? article.keyTakeawaysAr : [];
    const enList = Array.isArray(article.keyTakeawaysEn) ? article.keyTakeawaysEn : [];
    const maxLen = Math.max(arList.length, enList.length, 1);
    for (let i = 0; i < maxLen; i++) {
      takeaways.push({
        ar: arList[i] || '',
        en: enList[i] || '',
      });
    }

    setFormData({
      ...defaultArticleState,
      ...article,
      videoUrl: article.videoUrl || article.sectionsData?.videoUrl || '',
      links: Array.isArray(article.links) && article.links.length > 0
        ? article.links
        : (Array.isArray(article.sectionsData?.links) && article.sectionsData.links.length > 0
          ? article.sectionsData.links
          : defaultArticleState.links),
      iconKey: article.iconKey || (typeof article.icon === 'string' ? article.icon : '') || '',
      tagsInput: Array.isArray(article.tags) ? article.tags.join(', ') : '',
      keyTakeaways: takeaways,
      sections: Array.isArray(article.sections) && article.sections.length > 0 ? article.sections : defaultArticleState.sections,
      faqs: Array.isArray(article.faqs) ? article.faqs : [],
    });
    setIsModalOpen(true);
  };

  // Toggle Published / Draft status
  const handleToggleStatus = async (article) => {
    const newStatus = (article.status || 'PUBLISHED') === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      await updateArticle({ id: article.id, status: newStatus });
      setArticles((prev) =>
        prev.map((a) => (String(a.id) === String(article.id) ? { ...a, status: newStatus } : a))
      );
      toast.success(newStatus === 'PUBLISHED' ? 'تم نشر المقال بنجاح' : 'تم تحويل المقال إلى مسودة');
    } catch {
      toast.error('فشل في تحديث حالة المقال');
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id, title, slug) => {
    if (!confirm(`هل أنت متأكد من حذف مقال "${title}" نهائياً من الموقع؟`)) return;
    try {
      await deleteArticle(id, slug);
      setArticles((prev) => prev.filter((a) => String(a.id) !== String(id) && (!slug || a.slug !== String(slug))));
      toast.success('تم حذف المقال بنجاح نهائياً');
    } catch {
      toast.error('حدث خطأ أثناء حذف المقال');
    }
  };

  // Dispatch single article to n8n news webhook
  const handleDispatchSingleToN8n = async (article) => {
    setDispatchingId(article.id);
    const toastId = toast.loading(`جاري إرسال "${article.titleAr || article.titleEn}" إلى n8n Webhook...`);
    try {
      const res = await dispatchArticleToN8n(article.id);
      if (res.success) {
        toast.update(toastId, {
          render: `تم تسليم المقال بنجاح إلى سير عمل n8n!`,
          type: 'success',
          isLoading: false,
          autoClose: 3500,
        });
      } else {
        toast.update(toastId, {
          render: res.error || 'تعذر تسليم المقال إلى n8n',
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (err) {
      toast.update(toastId, {
        render: 'حدث خطأ أثناء الاتصال بالخادم',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setDispatchingId(null);
    }
  };

  // Sync all articles to n8n news webhook
  const handleSyncAllToN8n = async () => {
    if (!confirm(`هل تريد مزامنة وبث كافة المقالات (${articles.length} مقال) إلى سير عمل n8n News Webhook؟`)) return;
    setSyncingN8n(true);
    const toastId = toast.loading('جاري بث ومزامنة كافة المقالات مع n8n...');
    try {
      const res = await syncAllArticlesToN8n(false);
      if (res.success) {
        toast.update(toastId, {
          render: res.message || 'تمت مزامنة المقالات مع n8n بنجاح!',
          type: 'success',
          isLoading: false,
          autoClose: 4000,
        });
      } else {
        toast.update(toastId, {
          render: res.error || 'فشلت المزامنة مع n8n',
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (err) {
      toast.update(toastId, {
        render: 'خطأ في الاتصال بالويبهوك',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setSyncingN8n(false);
    }
  };

  // Category Selection Helper
  const handleCategoryChange = (catKey) => {
    const found = ARTICLE_CATEGORIES.find((c) => c.key === catKey);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        categoryKey: found.key,
        category: found.labelAr,
        categoryEn: found.labelEn,
      }));
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // AUTO-TRANSLATION ENGINE WITH EDITABLE ENGLISH CONTROLS
  // ══════════════════════════════════════════════════════════════════

  /**
   * Universal Arabic input change handler with automatic debounced translation to English
   */
  const handleArabicChange = (arField, enField, value) => {
    setFormData((prev) => ({ ...prev, [arField]: value }));

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    if (debounceTimers.current[enField]) {
      clearTimeout(debounceTimers.current[enField]);
    }

    debounceTimers.current[enField] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [enField]: true }));
      try {
        const translated = await translateText(value, 'ar', 'en');
        if (translated) {
          setFormData((prev) => ({ ...prev, [enField]: translated }));
        }
      } catch (err) {
        console.warn('Auto-translate error:', err);
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [enField]: false }));
      }
    }, 750);
  };

  /**
   * Universal English input change handler with automatic debounced translation to Arabic
   */
  const handleEnglishChange = (enField, arField, value) => {
    setFormData((prev) => ({ ...prev, [enField]: value }));

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    if (debounceTimers.current[arField]) {
      clearTimeout(debounceTimers.current[arField]);
    }

    debounceTimers.current[arField] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [arField]: true }));
      try {
        const translated = await translateText(value, 'en', 'ar');
        if (translated) {
          setFormData((prev) => ({ ...prev, [arField]: translated }));
        }
      } catch (err) {
        console.warn('Auto-translate error:', err);
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [arField]: false }));
      }
    }, 750);
  };

  /**
   * Manual on-demand single field translation (both directions supported)
   */
  const handleManualTranslate = async (sourceText, targetFieldKey, from = 'ar', to = 'en', customSetter = null) => {
    if (!sourceText || !sourceText.trim()) {
      toast.warn(from === 'ar' ? 'يرجى إدخال النص العربي أولاً لترجمته' : 'يرجى إدخال النص الإنجليزي أولاً لترجمته');
      return;
    }

    setTranslatingFields((prev) => ({ ...prev, [targetFieldKey]: true }));
    try {
      const translated = await translateText(sourceText, from, to);
      if (translated) {
        if (customSetter) {
          customSetter(translated);
        } else {
          setFormData((prev) => ({ ...prev, [targetFieldKey]: translated }));
        }
        toast.success('تمت الترجمة بنجاح!');
      }
    } catch {
      toast.error('تعذرت الترجمة حالياً، يمكنك الكتابة يدوياً');
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [targetFieldKey]: false }));
    }
  };

  /**
   * Key Takeaways Auto-Translate Handlers
   */
  const handleTakeawayArChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.keyTakeaways];
      updated[index] = { ...updated[index], ar: value };
      return { ...prev, keyTakeaways: updated };
    });

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    const timerKey = `takeaway_en_${index}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [timerKey]: true }));
      try {
        const trans = await translateText(value, 'ar', 'en');
        if (trans) {
          setFormData((prev) => {
            const updated = [...prev.keyTakeaways];
            if (updated[index]) {
              updated[index] = { ...updated[index], en: trans };
            }
            return { ...prev, keyTakeaways: updated };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [timerKey]: false }));
      }
    }, 750);
  };

  const handleTakeawayEnChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.keyTakeaways];
      updated[index] = { ...updated[index], en: value };
      return { ...prev, keyTakeaways: updated };
    });

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    const timerKey = `takeaway_ar_${index}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [timerKey]: true }));
      try {
        const trans = await translateText(value, 'en', 'ar');
        if (trans) {
          setFormData((prev) => {
            const updated = [...prev.keyTakeaways];
            if (updated[index]) {
              updated[index] = { ...updated[index], ar: trans };
            }
            return { ...prev, keyTakeaways: updated };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [timerKey]: false }));
      }
    }, 750);
  };

  /**
   * Section Auto-Translate Handlers
   */
  const handleSectionFieldChange = (sIdx, arField, enField, value) => {
    setFormData((prev) => {
      const updated = [...prev.sections];
      updated[sIdx] = { ...updated[sIdx], [arField]: value };
      return { ...prev, sections: updated };
    });

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    const timerKey = `sec_${sIdx}_${enField}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [timerKey]: true }));
      try {
        const trans = await translateText(value, 'ar', 'en');
        if (trans) {
          setFormData((prev) => {
            const updated = [...prev.sections];
            if (updated[sIdx]) {
              updated[sIdx] = { ...updated[sIdx], [enField]: trans };
            }
            return { ...prev, sections: updated };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [timerKey]: false }));
      }
    }, 750);
  };

  const handleSectionFieldEnChange = (sIdx, enField, arField, value) => {
    setFormData((prev) => {
      const updated = [...prev.sections];
      updated[sIdx] = { ...updated[sIdx], [enField]: value };
      return { ...prev, sections: updated };
    });

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    const timerKey = `sec_${sIdx}_${arField}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [timerKey]: true }));
      try {
        const trans = await translateText(value, 'en', 'ar');
        if (trans) {
          setFormData((prev) => {
            const updated = [...prev.sections];
            if (updated[sIdx]) {
              updated[sIdx] = { ...updated[sIdx], [arField]: trans };
            }
            return { ...prev, sections: updated };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [timerKey]: false }));
      }
    }, 750);
  };

  /**
   * FAQ Auto-Translate Handlers
   */
  const handleFaqFieldChange = (fIdx, arField, enField, value) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      updated[fIdx] = { ...updated[fIdx], [arField]: value };
      return { ...prev, faqs: updated };
    });

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    const timerKey = `faq_${fIdx}_${enField}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [timerKey]: true }));
      try {
        const trans = await translateText(value, 'ar', 'en');
        if (trans) {
          setFormData((prev) => {
            const updated = [...prev.faqs];
            if (updated[fIdx]) {
              updated[fIdx] = { ...updated[fIdx], [enField]: trans };
            }
            return { ...prev, faqs: updated };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [timerKey]: false }));
      }
    }, 750);
  };

  const handleFaqFieldEnChange = (fIdx, enField, arField, value) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      updated[fIdx] = { ...updated[fIdx], [enField]: value };
      return { ...prev, faqs: updated };
    });

    if (!autoTranslateEnabled || !value || !value.trim()) return;

    const timerKey = `faq_${fIdx}_${arField}`;
    if (debounceTimers.current[timerKey]) {
      clearTimeout(debounceTimers.current[timerKey]);
    }

    debounceTimers.current[timerKey] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [timerKey]: true }));
      try {
        const trans = await translateText(value, 'en', 'ar');
        if (trans) {
          setFormData((prev) => {
            const updated = [...prev.faqs];
            if (updated[fIdx]) {
              updated[fIdx] = { ...updated[fIdx], [arField]: trans };
            }
            return { ...prev, faqs: updated };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [timerKey]: false }));
      }
    }, 750);
  };

  /**
   * Translate All Fields across the entire article at once (Bi-directional: 'toAr' or 'toEn')
   */
  const handleTranslateAllFields = async (direction = 'toEn') => {
    const isToAr = direction === 'toAr';
    const from = isToAr ? 'en' : 'ar';
    const to = isToAr ? 'ar' : 'en';

    setIsTranslatingAll(direction);
    toast.info(isToAr ? 'جاري ترجمة كافة حقول المقال إلى العربية وصياغة المصطلحات المالية...' : 'جاري ترجمة كافة حقول المقال إلى الإنجليزية تلقائياً...');

    try {
      const textsMap = {};
      if (isToAr) {
        if (formData.titleEn) textsMap.title = formData.titleEn;
        if (formData.excerptEn) textsMap.excerpt = formData.excerptEn;
        if (formData.authorEn) textsMap.author = formData.authorEn;
        if (formData.authorRoleEn) textsMap.authorRole = formData.authorRoleEn;
        if (formData.authorBioEn) textsMap.authorBio = formData.authorBioEn;

        formData.keyTakeaways.forEach((t, i) => {
          if (t.en) textsMap[`takeaway_${i}`] = t.en;
        });

        formData.sections.forEach((s, i) => {
          if (s.headingEn) textsMap[`sec_heading_${i}`] = s.headingEn;
          if (s.bodyEn) textsMap[`sec_body_${i}`] = s.bodyEn;
          if (s.tipEn) textsMap[`sec_tip_${i}`] = s.tipEn;
        });

        formData.faqs.forEach((f, i) => {
          if (f.qEn) textsMap[`faq_q_${i}`] = f.qEn;
          if (f.aEn) textsMap[`faq_a_${i}`] = f.aEn;
        });
      } else {
        if (formData.titleAr) textsMap.title = formData.titleAr;
        if (formData.excerptAr) textsMap.excerpt = formData.excerptAr;
        if (formData.authorAr) textsMap.author = formData.authorAr;
        if (formData.authorRoleAr) textsMap.authorRole = formData.authorRoleAr;
        if (formData.authorBioAr) textsMap.authorBio = formData.authorBioAr;

        formData.keyTakeaways.forEach((t, i) => {
          if (t.ar) textsMap[`takeaway_${i}`] = t.ar;
        });

        formData.sections.forEach((s, i) => {
          if (s.headingAr) textsMap[`sec_heading_${i}`] = s.headingAr;
          if (s.bodyAr) textsMap[`sec_body_${i}`] = s.bodyAr;
          if (s.tipAr) textsMap[`sec_tip_${i}`] = s.tipAr;
        });

        formData.faqs.forEach((f, i) => {
          if (f.qAr) textsMap[`faq_q_${i}`] = f.qAr;
          if (f.aAr) textsMap[`faq_a_${i}`] = f.aAr;
        });
      }

      const res = await translateBatch(textsMap, from, to);

      setFormData((prev) => {
        const updated = { ...prev };
        if (isToAr) {
          if (res.title) updated.titleAr = res.title;
          if (res.excerpt) updated.excerptAr = res.excerpt;
          if (res.author) updated.authorAr = res.author;
          if (res.authorRole) updated.authorRoleAr = res.authorRole;
          if (res.authorBio) updated.authorBioAr = res.authorBio;

          updated.keyTakeaways = prev.keyTakeaways.map((t, i) => ({
            ...t,
            ar: res[`takeaway_${i}`] || t.ar,
          }));

          updated.sections = prev.sections.map((s, i) => ({
            ...s,
            headingAr: res[`sec_heading_${i}`] || s.headingAr,
            bodyAr: res[`sec_body_${i}`] || s.bodyAr,
            tipAr: res[`sec_tip_${i}`] || s.tipAr,
          }));

          updated.faqs = prev.faqs.map((f, i) => ({
            ...f,
            qAr: res[`faq_q_${i}`] || f.qAr,
            aAr: res[`faq_a_${i}`] || f.aAr,
          }));
        } else {
          if (res.title) updated.titleEn = res.title;
          if (res.excerpt) updated.excerptEn = res.excerpt;
          if (res.author) updated.authorEn = res.author;
          if (res.authorRole) updated.authorRoleEn = res.authorRole;
          if (res.authorBio) updated.authorBioEn = res.authorBio;

          updated.keyTakeaways = prev.keyTakeaways.map((t, i) => ({
            ...t,
            en: res[`takeaway_${i}`] || t.en,
          }));

          updated.sections = prev.sections.map((s, i) => ({
            ...s,
            headingEn: res[`sec_heading_${i}`] || s.headingEn,
            bodyEn: res[`sec_body_${i}`] || s.bodyEn,
            tipEn: res[`sec_tip_${i}`] || s.tipEn,
          }));

          updated.faqs = prev.faqs.map((f, i) => ({
            ...f,
            qEn: res[`faq_q_${i}`] || f.qEn,
            aEn: res[`faq_a_${i}`] || f.aEn,
          }));
        }

        return updated;
      });

      toast.success(isToAr ? 'تمت ترجمة وتنسيق كافة الحقول إلى العربية بنجاح!' : 'تمت ترجمة كافة الحقول إلى الإنجليزية بنجاح!');
    } catch (err) {
      toast.error('حدث خطأ أثناء الترجمة الجماعية');
    } finally {
      setIsTranslatingAll(null);
    }
  };

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      links: [
        ...(prev.links || []),
        {
          titleAr: '',
          titleEn: '',
          url: '',
          type: 'telegram',
        },
      ],
    }));
  };

  const handleRemoveLink = (index) => {
    setFormData((prev) => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== index),
    }));
  };

  const handleUpdateLink = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.links || [])];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, links: updated };
    });
  };

  // Submit / Save Article (Handles both Draft and Publish explicitly)
  const handleSaveArticle = async (overrideStatus = null) => {
    if (!formData.titleAr && !formData.titleEn) {
      toast.error('يرجى كتابة عنوان المقال باللغة العربية أو الإنجليزية');
      setActiveModalTab('basic');
      return;
    }

    if (!formData.coverImage && !formData.chartImage) {
      toast.error('صورة المقال أساسية، يرجى رفع صورة أو اختيار نموذج جاهز من تبويب "البيانات الأساسية"');
      setActiveModalTab('basic');
      return;
    }

    const validLinks = (formData.links || []).filter((l) => l.url && l.url.trim());
    if (validLinks.length === 0) {
      toast.error('الروابط الخارجية والمصادر أساسية للمقال، يرجى إضافة رابط واحد على الأقل في تبويب "الفيديو والروابط"');
      setActiveModalTab('media');
      return;
    }

    const cleanTags = formData.tagsInput
      ? formData.tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      : formData.tags || [];

    const keyTakeawaysAr = (formData.keyTakeaways || []).map((t) => t.ar).filter(Boolean);
    const keyTakeawaysEn = (formData.keyTakeaways || []).map((t) => t.en).filter(Boolean);

    const finalStatus = overrideStatus || formData.status || 'DRAFT';

    const payload = {
      ...formData,
      status: finalStatus,
      tags: cleanTags,
      keyTakeawaysAr,
      keyTakeawaysEn,
      links: validLinks,
      videoUrl: formData.videoUrl ? formData.videoUrl.trim() : null,
    };

    delete payload.tagsInput;
    delete payload.keyTakeaways;

    try {
      if (modalMode === 'create') {
        const res = await createArticle(payload);
        if (res.success) {
          if (finalStatus === 'PUBLISHED') {
            toast.success(
              res.n8nWebhook?.dispatched
                ? 'تم نشر المقال وبثه فورياً إلى سير عمل n8n بنجاح!'
                : 'تم نشر المقال بنجاح وإرساله للويبهوك!'
            );
          } else {
            toast.success('تم حفظ المقال كمسودة بنجاح وإرساله إلى ويبهوك n8n للمراجعة!');
          }
          setIsModalOpen(false);
          loadArticles();
        }
      } else {
        const res = await updateArticle(payload);
        if (res.success) {
          if (finalStatus === 'PUBLISHED') {
            toast.success(
              res.n8nWebhook?.dispatched
                ? 'تم تحديث المقال وبثه فورياً إلى سير عمل n8n بنجاح!'
                : 'تم تحديث المقال بنجاح وإرساله للويبهوك!'
            );
          } else {
            toast.success('تم حفظ التعديلات بنجاح وإرسال التحديث إلى n8n!');
          }
          setIsModalOpen(false);
          loadArticles();
        }
      }
    } catch (err) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ المقال');
    }
  };

  // Submit Modal Form
  const handleSubmitForm = (e) => {
    if (e) e.preventDefault();
    handleSaveArticle();
  };

  // Dynamic Section Add / Remove
  const handleAddSection = () => {
    const sNum = formData.sections.length + 1;
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `section-${Date.now()}`,
          headingAr: `${sNum}. عنوان القسم الجديد`,
          headingEn: `${sNum}. New Section Heading`,
          bodyAr: '',
          bodyEn: '',
          tipAr: '',
          tipEn: '',
        },
      ],
    }));
  };

  const handleRemoveSection = (index) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== index),
    }));
  };

  // Dynamic FAQ Add / Remove
  const handleAddFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          qAr: '',
          qEn: '',
          aAr: '',
          aEn: '',
        },
      ],
    }));
  };

  const handleRemoveFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, idx) => idx !== index),
    }));
  };

  // Dynamic Takeaway Add / Remove
  const handleAddTakeaway = () => {
    setFormData((prev) => ({
      ...prev,
      keyTakeaways: [...prev.keyTakeaways, { ar: '', en: '' }],
    }));
  };

  const handleRemoveTakeaway = (index) => {
    setFormData((prev) => ({
      ...prev,
      keyTakeaways: prev.keyTakeaways.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl text-on-surface select-text">
      {/* ── 1. Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-border-structural/50 pb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-telemetry-micro text-text-muted mb-1">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <span>&gt;</span>
            <span className="text-text-primary">إدارة المدونة والمحتوى التعليمي</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="font-headline-md text-headline-md text-text-primary font-bold">
              إدارة مقالات وأبحاث المدونة (Blog CMS Studio)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/15 text-success border border-success/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
              متصل حي بالمنصة
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted mt-1 max-w-3xl leading-relaxed">
            نشر وتعديل أبحاث واستراتيجيات الأسواق، مع ميزة الترجمة الفورية للإنجليزية وإمكانية تعديلها بحرية.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            onClick={() => {
              loadArticles();
              toast.info('جاري إعادة مزامنة المقالات...');
            }}
            className="p-2.5 rounded-xl bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            type="button"
            title="تحديث البيانات"
          >
            <IoRefreshOutline className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>

          <a
            href={`${MAIN_SITE_URL}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-elevated border border-border-structural text-text-primary text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <IoOpenOutline className="text-base text-primary" />
            <span>عرض صفحة المدونة الحية</span>
          </a>

          <button
            onClick={() => {
              setIsTvModalOpen(true);
              loadTradingViewFeed('all');
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#1E53E5] hover:from-[#1E53E5] hover:to-[#0F3EB5] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer border border-blue-400/30"
            type="button"
          >
            <IoSparklesOutline className="text-lg animate-pulse" />
            <span>استيراد من TradingView</span>
          </button>

          <button
            onClick={handleSyncAllToN8n}
            disabled={syncingN8n}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer border border-emerald-400/30 disabled:opacity-50"
            type="button"
            title="مزامنة وبث كافة المقالات إلى سير عمل n8n News Webhook"
          >
            <IoCloudUploadOutline className={`text-base ${syncingN8n ? 'animate-bounce' : ''}`} />
            <span>{syncingN8n ? 'جاري البث...' : 'مزامنة مع n8n Webhook'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-gradient-start text-on-primary font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
            type="button"
          >
            <IoAddCircleOutline className="text-lg" />
            <span>+ إنشاء ونشر مقال جديد</span>
          </button>
        </div>
      </div>

      {/* ── 2. Telemetry Metric Badges Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-xl bg-surface-container border border-border-structural/60 flex items-center gap-space-md shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shrink-0">
            <IoDocumentTextOutline className="text-2xl" />
          </div>
          <div>
            <div className="text-xs text-text-muted font-medium">إجمالي المقالات</div>
            <div className="text-xl font-bold text-text-primary mt-0.5">{stats.total} مقال</div>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container border border-border-structural/60 flex items-center gap-space-md shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/25 flex items-center justify-center text-success shrink-0">
            <IoCheckmarkCircleOutline className="text-2xl" />
          </div>
          <div>
            <div className="text-xs text-text-muted font-medium">المقالات المنشورة</div>
            <div className="text-xl font-bold text-success mt-0.5">{stats.published} نشط</div>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container border border-border-structural/60 flex items-center gap-space-md shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
            <IoTrendingUpOutline className="text-2xl" />
          </div>
          <div>
            <div className="text-xs text-text-muted font-medium">إجمالي المشاهدات المقدرة</div>
            <div className="text-xl font-bold text-text-primary mt-0.5">{stats.totalViews} قراءة</div>
          </div>
        </div>

        <div className="p-space-md rounded-xl bg-surface-container border border-border-structural/60 flex items-center gap-space-md shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/25 flex items-center justify-center text-warning shrink-0">
            <IoSparklesOutline className="text-2xl" />
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-text-muted font-medium">مقال الأسبوع المميز</div>
            <div className="text-xs font-bold text-text-primary mt-1 truncate" title={stats.featuredTitle}>
              {stats.featuredTitle}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Bar ── */}
      <div className="p-space-md rounded-2xl bg-surface-container border border-border-structural flex flex-col md:flex-row items-center justify-between gap-space-md">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <IoSearchOutline className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted text-lg pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالعنوان، الكاتب، أو الوسم..."
            className="w-full h-10 pr-10 pl-3 rounded-xl bg-surface border border-border-structural text-text-primary placeholder:text-text-muted text-xs focus:border-primary outline-none transition-all"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">جميع التصنيفات</option>
            {ARTICLE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.labelAr}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="PUBLISHED">منشور (Live)</option>
            <option value="DRAFT">مسودة (Draft)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface rounded-xl p-1 border border-border-structural shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="عرض كروت (Grid)"
            >
              <IoGridOutline className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="عرض جدول (Table)"
            >
              <IoListOutline className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Main Articles Content ── */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-text-muted">جاري تحميل قائمة المقالات من المنصة...</span>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-surface-container rounded-2xl border border-border-structural/50 p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted border border-border-structural">
            <IoDocumentTextOutline className="text-3xl" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">لم يتم العثور على أي مقالات</h3>
            <p className="text-xs text-text-muted max-w-md">
              جرب تغيير معايير البحث أو الفلترة، أو قم بإنشاء أول مقال الآن.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <IoAddCircleOutline className="text-base" />
            <span>كتابة مقال جديد</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {filteredArticles.map((art) => {
            const isPublished = (art.status || 'PUBLISHED') === 'PUBLISHED';
            const liveUrl = `${MAIN_SITE_URL}/blog/${art.id}`;

            return (
              <div
                key={art.id}
                className="bg-surface-container rounded-2xl border border-border-structural/60 p-space-lg flex flex-col justify-between shadow-md hover:border-primary/40 transition-all group relative overflow-hidden"
              >
                {/* Accent Top Border */}
                <div
                  className="absolute top-0 right-0 left-0 h-1"
                  style={{ backgroundColor: art.accentColor || '#0488F8' }}
                />

                <div className="space-y-3.5">
                  {/* Category & Badges Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{
                          backgroundColor: `${art.accentColor || '#0488F8'}15`,
                          color: art.accentColor || '#0488F8',
                          border: `1px solid ${art.accentColor || '#0488F8'}35`,
                        }}
                      >
                        {art.category || 'عام'}
                      </span>
                      {art.featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/30 flex items-center gap-1">
                          ★ مميز
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(art)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-all border ${
                        isPublished
                          ? 'bg-success/15 text-success border-success/30 hover:bg-success/25'
                          : 'bg-text-muted/15 text-text-muted border-text-muted/30 hover:bg-text-muted/25'
                      }`}
                      title="انقر لتبديل الحالة"
                    >
                      {isPublished ? 'منشور' : 'مسودة'}
                    </button>
                  </div>

                  {/* Article Thumbnail / Chart Image */}
                  <div
                    className="relative w-full h-36 rounded-xl overflow-hidden border border-border-structural/70 flex items-center justify-center transition-all group-hover:border-primary/50 bg-[#06142F]"
                  >
                    {art.coverImage || art.chartImage ? (
                      <>
                        <img
                          src={art.coverImage || art.chartImage}
                          alt={art.titleAr || art.titleEn}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#06142F]/90 via-transparent to-black/30 pointer-events-none" />
                      </>
                    ) : (
                      <>
                        <div
                          className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full border pointer-events-none"
                          style={{ borderColor: `${art.accentColor || '#0488F8'}25` }}
                        />
                        <div
                          className="absolute -top-4 -left-4 w-16 h-16 rounded-full border pointer-events-none"
                          style={{ borderColor: `${art.accentColor || '#0488F8'}15` }}
                        />
                        <div
                          className="relative z-10 transition-transform duration-300 group-hover:scale-110"
                          style={{
                            color: art.accentColor || 'var(--primary)',
                            filter: `drop-shadow(0 0 14px ${art.accentColor || '#0488F8'}60)`,
                          }}
                        >
                          {getCategoryIcon(art.iconKey || art.categoryKey, 'text-4xl')}
                        </div>
                      </>
                    )}

                    {art.symbol && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-text-primary text-[10px] font-bold font-mono border border-border-structural z-10">
                        {art.symbol}
                      </div>
                    )}
                    {art.tradingViewUrl && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#2962FF]/90 backdrop-blur-md text-white text-[10px] font-bold shadow-sm z-10">
                        TradingView
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors leading-snug line-clamp-2">
                    {art.titleAr || art.titleEn}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {art.excerptAr || art.excerptEn || 'لا يوجد ملخص تمهيدي لهذا المقال.'}
                  </p>

                  {/* Meta Specs (Date, Read Time, Views) */}
                  <div className="flex items-center gap-3 text-[11px] text-text-muted border-y border-border-structural/40 py-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <IoCalendarOutline className="text-xs text-primary" />
                      <span>{art.dateAr || art.dateEn || 'اليوم'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <IoTimeOutline className="text-xs text-accent" />
                      <span>{art.readTimeAr || art.readTimeEn || '5 دقائق'}</span>
                    </span>
                    <span className="flex items-center gap-1 mr-auto font-bold text-text-primary">
                      <span>● {art.views || '1'} مشاهدة</span>
                    </span>
                  </div>

                  {/* Structure Badges (Sections, FAQs, Author) */}
                  <div className="flex items-center justify-between text-[11px] text-text-muted">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                        {(art.authorAr || art.authorEn || 'س').slice(0, 1)}
                      </div>
                      <span className="truncate max-w-[120px] font-medium text-text-secondary">
                        {art.authorAr || art.authorEn || 'م. سليمان داود'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-surface text-[10px] text-text-muted border border-border-structural">
                        {Array.isArray(art.sections) ? art.sections.length : 1} أقسام
                      </span>
                      {Array.isArray(art.faqs) && art.faqs.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-surface text-[10px] text-text-muted border border-border-structural">
                          {art.faqs.length} أسئلة
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between pt-3.5 mt-3.5 border-t border-border-structural/50">
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>معاينة حية</span>
                    <IoOpenOutline className="text-xs" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDispatchSingleToN8n(art)}
                      disabled={dispatchingId === art.id}
                      className="p-1.5 rounded-lg bg-surface-elevated hover:bg-emerald-500/15 text-text-secondary hover:text-emerald-400 transition-all cursor-pointer"
                      title="إرسال وبث هذا المقال إلى n8n Webhook"
                    >
                      <IoSendOutline className={`text-sm ${dispatchingId === art.id ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(art)}
                      className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-container-high text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                      title="تعديل المقال"
                    >
                      <IoPencilOutline className="text-sm text-primary" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteArticle(art.id, art.titleAr || art.titleEn, art.slug)}
                      className="p-1.5 rounded-lg bg-surface-elevated hover:bg-bearish-down/10 text-text-secondary hover:text-bearish-down transition-all cursor-pointer"
                      title="حذف المقال"
                    >
                      <IoTrashOutline className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="bg-surface-container rounded-2xl border border-border-structural/60 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-high text-text-muted font-bold border-b border-border-structural">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">عنوان المقال</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">الكاتب</th>
                  <th className="py-3 px-4">التاريخ والقراءة</th>
                  <th className="py-3 px-4">المشاهدات</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-structural/40 text-text-primary">
                {filteredArticles.map((art, idx) => {
                  const isPublished = (art.status || 'PUBLISHED') === 'PUBLISHED';
                  return (
                    <tr key={art.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-4 text-text-muted">{art.id || idx + 1}</td>
                      <td className="py-3 px-4 font-bold max-w-xs">
                        <div className="flex items-center gap-2.5">
                          {/* Article Thumbnail */}
                          <div className="w-11 h-8 rounded-lg overflow-hidden bg-surface-container border border-border-structural shrink-0 relative flex items-center justify-center">
                            {art.coverImage || art.chartImage ? (
                              <img
                                src={art.coverImage || art.chartImage}
                                alt={art.titleAr || art.titleEn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-text-muted text-[10px] font-bold">بلا</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate">
                              {art.symbol && (
                                <span className="px-1.5 py-0.5 rounded bg-[#2962FF]/15 text-[#2962FF] border border-[#2962FF]/30 text-[9px] font-bold font-mono shrink-0">
                                  {art.symbol}
                                </span>
                              )}
                              <span className="truncate" title={art.titleAr || art.titleEn}>
                                {art.titleAr || art.titleEn}
                              </span>
                            </div>
                            {art.featured && (
                              <span className="text-[10px] text-accent font-bold block mt-0.5">★ مقال مميز</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold"
                          style={{
                            backgroundColor: `${art.accentColor || '#0488F8'}15`,
                            color: art.accentColor || '#0488F8',
                          }}
                        >
                          {art.category || 'عام'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-text-secondary font-medium">
                        {art.authorAr || art.authorEn || 'م. سليمان داود'}
                      </td>
                      <td className="py-3 px-4 text-text-muted">
                        <div>{art.dateAr || art.dateEn || '—'}</div>
                        <div className="text-[10px]">{art.readTimeAr || art.readTimeEn}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-text-secondary">
                        {art.views || '1'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(art)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            isPublished
                              ? 'bg-success/15 text-success border border-success/30'
                              : 'bg-text-muted/15 text-text-muted border border-text-muted/30'
                          }`}
                        >
                          {isPublished ? 'منشور' : 'مسودة'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`${MAIN_SITE_URL}/blog/${art.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface text-primary"
                            title="معاينة حية"
                          >
                            <IoOpenOutline className="text-sm" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDispatchSingleToN8n(art)}
                            disabled={dispatchingId === art.id}
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-emerald-500/15 text-emerald-400"
                            title="إرسال وبث إلى n8n Webhook"
                          >
                            <IoSendOutline className={`text-sm ${dispatchingId === art.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(art)}
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface text-primary"
                            title="تعديل"
                          >
                            <IoPencilOutline className="text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id, art.titleAr || art.titleEn, art.slug)}
                            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-bearish-down/15 text-bearish-down"
                            title="حذف"
                          >
                            <IoTrashOutline className="text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 5. Full-Featured Article Editor Modal with Live Auto-Translate ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container border border-border-structural rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border-structural flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-high shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <IoDocumentTextOutline className="text-xl" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">
                    {modalMode === 'create' ? 'إنشاء ونشر مقال جديد في المدونة' : `تعديل المقال: ${formData.titleAr || formData.titleEn}`}
                  </h2>
                  <p className="text-xs text-text-muted">
                    اكتب باللغة العربية، وسيتم توليد الترجمة الإنجليزية تلقائياً مع إمكانية التعديل عليها بحرية.
                  </p>
                </div>
              </div>

              {/* Translation Controls in Header */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Auto-Translate Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    autoTranslateEnabled
                      ? 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20'
                      : 'bg-surface text-text-muted border-border-structural hover:text-text-primary'
                  }`}
                  title="تفعيل أو إيقاف الترجمة التلقائية أثناء الكتابة"
                >
                  <IoFlashOutline className={autoTranslateEnabled ? 'text-primary animate-pulse' : ''} />
                  <span>
                    {autoTranslateEnabled ? 'الترجمة التلقائية: مفعّلة' : 'الترجمة التلقائية: متوقفة'}
                  </span>
                </button>

                {/* Translate All to Arabic (En -> Ar) */}
                <button
                  type="button"
                  onClick={() => handleTranslateAllFields('toAr')}
                  disabled={Boolean(isTranslatingAll)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="ترجمة كافة الحقول الإنجليزية إلى العربية تلقائياً وصياغة المصطلحات المالية بدقة"
                >
                  <IoSparklesOutline className={isTranslatingAll === 'toAr' ? 'animate-spin' : ''} />
                  <span>{isTranslatingAll === 'toAr' ? 'جاري الترجمة...' : 'ترجمة الكل للعربية'}</span>
                </button>

                {/* Translate All to English (Ar -> En) */}
                <button
                  type="button"
                  onClick={() => handleTranslateAllFields('toEn')}
                  disabled={Boolean(isTranslatingAll)}
                  className="px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-on-surface font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="ترجمة كافة الحقول العربية المكتوبة إلى الإنجليزية"
                >
                  <IoSparklesOutline className={isTranslatingAll === 'toEn' ? 'animate-spin' : ''} />
                  <span>{isTranslatingAll === 'toEn' ? 'جاري الترجمة...' : 'ترجمة الكل للإنجليزية'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all cursor-pointer"
                >
                  <IoCloseCircleOutline className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex items-center gap-1.5 px-6 py-2.5 bg-surface border-b border-border-structural overflow-x-auto text-xs shrink-0">
              {[
                { key: 'basic', label: '1. البيانات الأساسية', icon: IoDocumentTextOutline },
                { key: 'excerpt', label: '2. المقتطف والملخص', icon: IoSparklesOutline },
                { key: 'author', label: '3. بيانات الكاتب', icon: IoPersonOutline },
                { key: 'takeaways', label: '4. الركائز والوسوم', icon: IoTrendingUpOutline },
                { key: 'sections', label: `5. أقسام المقال (${formData.sections.length})`, icon: IoBulbOutline },
                { key: 'faqs', label: `6. الأسئلة الشائعة (${formData.faqs.length})`, icon: IoHelpCircleOutline },
                { key: 'media', label: `7. الفيديو والروابط (${(formData.links || []).length})`, icon: IoVideocamOutline },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeModalTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveModalTab(tab.key)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                    }`}
                  >
                    <Icon className="text-sm" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Tabs Content */}
            <form onSubmit={handleSubmitForm} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-text-primary">
                {/* TAB 1: BASIC INFO */}
                {activeModalTab === 'basic' && (
                  <div className="space-y-4">
                    {/* n8n Webhook Notification Banner */}
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium">
                      <IoCloudUploadOutline className="text-base shrink-0 animate-pulse" />
                      <span>يتم إرسال هذا المقال تلقائياً وبشكل فوري إلى سير عمل <strong>n8n News Webhook</strong> بمجرد النقر على حفظ أو نشر.</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Arabic Title (Primary Input) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-text-primary">
                            عنوان المقال بالعربية (الأساسي) <span className="text-bearish-down">*</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            {translatingFields.titleAr && (
                              <span className="text-[10px] text-accent animate-pulse font-bold flex items-center gap-1">
                                <span>جاري الترجمة...</span>
                              </span>
                            )}
                            {formData.titleEn && (
                              <button
                                type="button"
                                onClick={() => handleManualTranslate(formData.titleEn, 'titleAr', 'en', 'ar')}
                                className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer flex items-center gap-1"
                                title="ترجمة العنوان الإنجليزي إلى العربية فورياً"
                              >
                                ترجمة من الإنجليزية
                              </button>
                            )}
                            <span className="text-[10px] text-primary font-bold">يكتب بالعربية</span>
                          </div>
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.titleAr}
                          onChange={(e) => handleArabicChange('titleAr', 'titleEn', e.target.value)}
                          placeholder="مثال: أفضل 5 استراتيجيات لتداول الفوركس للمبتدئين في عام 2026"
                          className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        />
                      </div>

                      {/* English Title (Auto-translated + Editable) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-text-primary">
                            العنوان بالإنجليزية (قابل للتعديل)
                          </label>
                          <div className="flex items-center gap-1.5">
                            {translatingFields.titleEn && (
                              <span className="text-[10px] text-accent animate-pulse font-bold flex items-center gap-1">
                                <span>جاري الترجمة...</span>
                              </span>
                            )}
                            {formData.titleAr && (
                              <button
                                type="button"
                                onClick={() => handleManualTranslate(formData.titleAr, 'titleEn', 'ar', 'en')}
                                className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                                title="ترجمة العنوان العربي إلى الإنجليزية"
                              >
                                ترجمة من العربية
                              </button>
                            )}
                          </div>
                        </div>
                        <input
                          type="text"
                          value={formData.titleEn}
                          onChange={(e) => handleEnglishChange('titleEn', 'titleAr', e.target.value)}
                          placeholder="e.g. Top 5 Forex Trading Strategies for Beginners in 2026"
                          className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                          dir="ltr"
                        />
                      </div>
                    </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">التصنيف الرئيسي</label>
                      <select
                        value={formData.categoryKey}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary cursor-pointer"
                      >
                        {ARTICLE_CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.labelAr} ({c.labelEn})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">الرابط المخصص (Slug)</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="يترك فارغاً للتوليد التلقائي"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">لون السمة / الإضاءة (Hex Color)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.accentColor || '#0488F8'}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="w-10 h-10 rounded-xl bg-surface border border-border-structural cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="flex-1 h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">وقت القراءة (عربي)</label>
                      <input
                        type="text"
                        value={formData.readTimeAr}
                        onChange={(e) => setFormData({ ...formData, readTimeAr: e.target.value })}
                        placeholder="7 دقائق قراءة"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">وقت القراءة (English)</label>
                      <input
                        type="text"
                        value={formData.readTimeEn}
                        onChange={(e) => setFormData({ ...formData, readTimeEn: e.target.value })}
                        placeholder="7 min read"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">عدد المشاهدات الافتراضي</label>
                      <input
                        type="text"
                        value={formData.views}
                        onChange={(e) => setFormData({ ...formData, views: e.target.value })}
                        placeholder="14.2K"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">حالة المقال</label>
                      <select
                        value={formData.status || 'DRAFT'}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="DRAFT">مسودة غير معلنة (DRAFT) - لا يظهر للزوار</option>
                        <option value="PUBLISHED">منشور حي (PUBLISHED) - معروض على الموقع</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-container-high border border-border-structural flex items-center justify-between mt-2">
                    <div>
                      <div className="font-bold text-text-primary">تعيين كمقال الأسبوع المميز (Featured Story)</div>
                      <div className="text-text-muted text-[11px]">
                        سيظهر المقال في أعلى صفحة المدونة الرئيسية ببطاقة استعراضية ضخمة وبصمة بصرية بارزة.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-structural after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* TradingView & Media Specs */}
                  <div className="p-4 rounded-xl bg-surface border border-border-structural/80 space-y-3 mt-2">
                    <div className="flex items-center justify-between border-b border-border-structural/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#2962FF]/15 text-[#2962FF] border border-[#2962FF]/30 text-[10px] font-bold">
                          TradingView Integration
                        </span>
                        <span className="font-bold text-text-primary text-xs">
                          بيانات الشارت وربط منصة TradingView
                        </span>
                      </div>
                      {formData.tradingViewUrl && (
                        <a
                          href={formData.tradingViewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>عرض الفكرة الأصلية على TradingView</span>
                          <IoOpenOutline className="text-xs" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary text-[11px] block">
                          رمز العملة أو السلعة (Symbol)
                        </label>
                        <input
                          type="text"
                          value={formData.symbol || ''}
                          onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                          placeholder="مثال: XAUUSD, EURUSD, BTCUSD"
                          className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary font-mono uppercase"
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-text-secondary text-[11px] block">
                          رابط الفكرة / المصدر (TradingView Source URL)
                        </label>
                        <input
                          type="url"
                          value={formData.tradingViewUrl || ''}
                          onChange={(e) => setFormData({ ...formData, tradingViewUrl: e.target.value })}
                          placeholder="https://www.tradingview.com/chart/..."
                          className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* ── Article Cover Image & Chart Section ── */}
                    <div className="p-4 rounded-xl bg-surface-container/60 border border-border-structural/90 space-y-3 mt-1">
                      <div className="flex items-center justify-between border-b border-border-structural/50 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-primary/15 text-primary">
                            <IoImageOutline className="text-base" />
                          </span>
                          <div>
                            <span className="font-bold text-text-primary text-xs block">
                              صورة غلاف المقال / الشارت الفني (Cover Image & Chart)
                            </span>
                            <span className="text-[10px] text-text-muted">
                              اختر صورة للمقال المنويل، أو استورد الشارت تلقائياً من TradingView
                            </span>
                          </div>
                        </div>
                        {formData.coverImage && (
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <IoCheckmarkCircleOutline />
                              <span>الصورة جاهزة</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, coverImage: '', chartImage: '' })}
                              className="text-[10px] text-bearish-down hover:underline font-bold cursor-pointer"
                            >
                              إزالة ✕
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        {/* Live Image Preview (4 cols) */}
                        <div className="lg:col-span-4">
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface border border-border-structural flex items-center justify-center group shadow-md">
                            {formData.coverImage ? (
                              <>
                                <img
                                  src={formData.coverImage}
                                  alt="معاينة صورة المقال"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                  <a
                                    href={formData.coverImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1.5 rounded-lg bg-surface text-text-primary text-[10px] font-bold flex items-center gap-1 hover:bg-surface-elevated cursor-pointer shadow-lg"
                                  >
                                    <IoOpenOutline />
                                    <span>معاينة كاملة</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, coverImage: '', chartImage: '' })}
                                    className="px-2.5 py-1.5 rounded-lg bg-bearish-down text-white text-[10px] font-bold flex items-center gap-1 hover:brightness-110 cursor-pointer shadow-lg"
                                  >
                                    <IoTrashOutline />
                                    <span>حذف</span>
                                  </button>
                                </div>
                                {formData.symbol && (
                                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-white text-[9px] font-mono font-bold border border-white/20">
                                    {formData.symbol}
                                  </span>
                                )}
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-3 text-center text-text-muted">
                                <IoBarChartOutline className="text-3xl mb-1 text-primary/50 animate-pulse" />
                                <span className="text-[11px] font-bold text-text-secondary">لا توجد صورة محددة</span>
                                <span className="text-[9px] text-text-muted mt-0.5 leading-tight">
                                  ارفع ملفاً من جهازك أو اختر نموذجاً سريعاً بالأسفل
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Controls & Inputs (8 cols) */}
                        <div className="lg:col-span-8 space-y-3">
                          {/* Cloud File Upload & URL Widget */}
                          <CloudUploadWidget
                            value={formData.coverImage || ''}
                            onChange={(url) => setFormData({ ...formData, coverImage: url, chartImage: url })}
                            folder="articles"
                            label="رفع صورة المقال من الجهاز أو إدخال رابط خارجي:"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            placeholder="https://... أو اضغط زر 'رفع ملف' لاختيار صورة من جهازك"
                          />

                          {/* Quick TV Extract if URL present */}
                          {formData.tradingViewUrl && (
                            <div className="flex items-center justify-between p-2 rounded-xl bg-[#2962FF]/10 border border-[#2962FF]/25">
                              <div className="flex items-center gap-2">
                                
                                <span className="text-[11px] text-text-primary font-medium">
                                  رابط TradingView متوفر
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={handleExtractTvChart}
                                disabled={extractingTvImage}
                                className="px-3 py-1 rounded-lg bg-[#2962FF] hover:bg-[#1E4BD8] text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                              >
                                {extractingTvImage ? (
                                  <span className="animate-spin inline-block text-xs">●</span>
                                ) : (
                                  <IoFlashOutline className="text-xs" />
                                )}
                                <span>{extractingTvImage ? 'جاري الاستخراج...' : 'استخراج الشارت تلقائياً'}</span>
                              </button>
                            </div>
                          )}

                          {/* Quick Preset Selector for Manual Articles */}
                          <div className="space-y-1 pt-1">
                            <label className="text-[10px] font-bold text-text-secondary block">
                              نماذج صور وشارتات جاهزة بنقرة واحدة (Presets):
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {ARTICLE_IMAGE_PRESETS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, coverImage: preset.url, chartImage: preset.url })}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                                    formData.coverImage === preset.url
                                      ? 'bg-primary/20 text-primary border-primary shadow-sm'
                                      : 'bg-surface hover:bg-surface-elevated text-text-secondary border-border-structural'
                                  }`}
                                >
                                  <span>{preset.icon}</span>
                                  <span>{preset.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Visual Vector Theme Badge & Icon Picker */}
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-text-secondary text-[11px] block">
                          البصمة البصرية للمقال (Vector Icon & Theme Preview)
                        </label>
                        {formData.iconKey && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, iconKey: '' })}
                            className="text-[10px] text-accent hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            title="إعادة التعيين للأيقونة التلقائية حسب تصنيف المقال"
                          >
                            <span>إعادة تعيين للأيقونة التلقائية للتصنيف ↺</span>
                          </button>
                        )}
                      </div>

                      {/* Live Preview Card */}
                      <div
                        className="w-full h-28 rounded-xl border border-border-structural flex items-center justify-center relative overflow-hidden transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${formData.accentColor || '#0488F8'}15 0%, #06142F 70%, #00030D 100%)`,
                          borderColor: `${formData.accentColor || '#0488F8'}35`,
                        }}
                      >
                        <div
                          className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full border pointer-events-none"
                          style={{ borderColor: `${formData.accentColor || '#0488F8'}20` }}
                        />
                        <div
                          className="absolute -top-4 -left-4 w-16 h-16 rounded-full border pointer-events-none"
                          style={{ borderColor: `${formData.accentColor || '#0488F8'}15` }}
                        />
                        <div
                          className="transition-transform duration-300 transform scale-110"
                          style={{
                            color: formData.accentColor || '#0488F8',
                            filter: `drop-shadow(0 0 16px ${formData.accentColor || '#0488F8'}70)`,
                          }}
                        >
                          {getCategoryIcon(formData.iconKey || formData.categoryKey, 'text-5xl')}
                        </div>

                        <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded bg-black/70 text-text-muted text-[10px] font-bold border border-white/10">
                          نظام الأيقونات المتجهية (بدون صور)
                        </div>

                        <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded bg-black/80 backdrop-blur-sm text-text-secondary text-[10px] font-bold border border-white/10 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: formData.accentColor || '#0488F8' }} />
                          <span>الأيقونة الحالية:</span>
                          <span style={{ color: formData.accentColor || '#0488F8' }}>
                            {ARTICLE_ICONS_LIBRARY.find((i) => i.key === (formData.iconKey || ''))?.nameAr ||
                              (formData.categoryKey === 'technical'
                                ? 'شارت أعمدة (تلقائي)'
                                : formData.categoryKey === 'risk'
                                ? 'درع مخاطر (تلقائي)'
                                : formData.categoryKey === 'algo'
                                ? 'رقاقة ذكاء اصطناعي (تلقائي)'
                                : formData.categoryKey === 'psychology'
                                ? 'عين وبصيرة (تلقائي)'
                                : 'ترند صاعد (تلقائي)')}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Vector Icon Picker */}
                      <div className="p-3 rounded-xl bg-surface border border-border-structural/80 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-primary">
                            <IoSparklesOutline className="text-accent text-sm" />
                            <span>اختر أيقونة المقال من المكتبة:</span>
                            <span className="text-[10px] text-text-muted font-normal">
                              ({filteredIconsList.length} أيقونة متوفرة)
                            </span>
                          </div>

                          {/* Quick Icon Search */}
                          <div className="relative w-full sm:w-48">
                            <IoSearchOutline className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted text-xs pointer-events-none" />
                            <input
                              type="text"
                              value={iconSearchTerm}
                              onChange={(e) => setIconSearchTerm(e.target.value)}
                              placeholder="بحث باسم الأيقونة..."
                              className="w-full h-7 pr-7 pl-2 rounded-lg bg-surface-container border border-border-structural text-text-primary text-[10px] outline-none focus:border-primary"
                            />
                            {iconSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setIconSearchTerm('')}
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-[10px]"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                          {ICON_GROUPS.map((grp) => {
                            const isSelected = iconFilterGroup === grp.key;
                            return (
                              <button
                                key={grp.key}
                                type="button"
                                onClick={() => setIconFilterGroup(grp.key)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                                    : 'bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary border border-border-structural/50'
                                }`}
                              >
                                {grp.labelAr}
                              </button>
                            );
                          })}
                        </div>

                        {/* Icons Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1.5 rounded-lg bg-surface-container/60 border border-border-structural/50">
                          {filteredIconsList.map((item) => {
                            const IconComponent = item.icon;
                            const isCurrentSelected =
                              formData.iconKey === item.key ||
                              (!formData.iconKey && (
                                (formData.categoryKey === 'technical' && item.key === 'bar-chart') ||
                                (formData.categoryKey === 'risk' && item.key === 'shield-check') ||
                                (formData.categoryKey === 'algo' && item.key === 'hardware-chip') ||
                                (formData.categoryKey === 'psychology' && item.key === 'eye') ||
                                (!['technical', 'risk', 'algo', 'psychology'].includes(formData.categoryKey) && item.key === 'trending-up')
                              ));

                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setFormData({ ...formData, iconKey: item.key })}
                                className={`group relative p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                                  isCurrentSelected
                                    ? 'shadow-md shadow-primary/20 scale-[1.02]'
                                    : 'hover:border-primary/50 hover:bg-surface-container-high hover:scale-[1.02]'
                                }`}
                                style={{
                                  borderColor: isCurrentSelected ? (formData.accentColor || '#0488F8') : 'var(--border-structural)',
                                  backgroundColor: isCurrentSelected
                                    ? `${formData.accentColor || '#0488F8'}15`
                                    : 'var(--surface-container)',
                                }}
                                title={`${item.nameAr} (${item.nameEn})`}
                              >
                                {isCurrentSelected && (
                                  <div
                                    className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[8px]"
                                    style={{ backgroundColor: formData.accentColor || '#0488F8' }}
                                  >
                                    <IoCheckmarkOutline />
                                  </div>
                                )}
                                <div
                                  className="text-2xl transition-transform duration-200 group-hover:scale-110"
                                  style={{
                                    color: isCurrentSelected ? (formData.accentColor || '#0488F8') : 'var(--text-secondary)',
                                  }}
                                >
                                  <IconComponent />
                                </div>
                                <span
                                  className="text-[10px] font-bold line-clamp-1 leading-tight"
                                  style={{
                                    color: isCurrentSelected ? (formData.accentColor || '#0488F8') : 'var(--text-primary)',
                                  }}
                                >
                                  {item.nameAr}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: EXCERPT & SUMMARY */}
              {activeModalTab === 'excerpt' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-text-primary">
                        المقتطف التمهيدي والملخص (عربي - الأساسي) <span className="text-bearish-down">*</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {translatingFields.excerptAr && (
                          <span className="text-[10px] text-accent animate-pulse font-bold">
                            جاري الترجمة...
                          </span>
                        )}
                        {formData.excerptEn && (
                          <button
                            type="button"
                            onClick={() => handleManualTranslate(formData.excerptEn, 'excerptAr', 'en', 'ar')}
                            className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                            title="ترجمة الملخص الإنجليزي إلى العربية فورياً"
                          >
                            ترجمة من الإنجليزية
                          </button>
                        )}
                        <span className="text-[10px] text-primary font-bold">يكتب بالعربية</span>
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.excerptAr}
                      onChange={(e) => handleArabicChange('excerptAr', 'excerptEn', e.target.value)}
                      placeholder="ملخص قصير من سطرين إلى ثلاثة يوضح للمتداول ما سيتعلمه من هذا المقال..."
                      className="w-full p-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary leading-relaxed"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-text-primary">
                        المقتطف بالإنجليزية (English Excerpt - قابل للتعديل)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {translatingFields.excerptEn && (
                          <span className="text-[10px] text-accent animate-pulse font-bold">
                            جاري الترجمة...
                          </span>
                        )}
                        {formData.excerptAr && (
                          <button
                            type="button"
                            onClick={() => handleManualTranslate(formData.excerptAr, 'excerptEn', 'ar', 'en')}
                            className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                            title="ترجمة الملخص العربي إلى الإنجليزية"
                          >
                            ترجمة من العربية
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={formData.excerptEn}
                      onChange={(e) => handleEnglishChange('excerptEn', 'excerptAr', e.target.value)}
                      placeholder="A comprehensive guide explaining proven setups for sustainable trading..."
                      className="w-full p-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary leading-relaxed"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: AUTHOR PROFILE */}
              {activeModalTab === 'author' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">اسم الكاتب بالعربية</label>
                      <input
                        type="text"
                        value={formData.authorAr}
                        onChange={(e) => handleArabicChange('authorAr', 'authorEn', e.target.value)}
                        placeholder="م. سليمان داود"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-text-primary">اسم الكاتب بالإنجليزية</label>
                        {translatingFields.authorEn && (
                          <span className="text-[10px] text-accent animate-pulse">جاري الترجمة...</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.authorEn}
                        onChange={(e) => setFormData({ ...formData, authorEn: e.target.value })}
                        placeholder="Eng. Sleman Daowed"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">المسمى الوظيفي (عربي)</label>
                      <input
                        type="text"
                        value={formData.authorRoleAr}
                        onChange={(e) => handleArabicChange('authorRoleAr', 'authorRoleEn', e.target.value)}
                        placeholder="كبير محللي الأسواق المالية"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-text-primary">المسمى الوظيفي بالإنجليزية</label>
                        {translatingFields.authorRoleEn && (
                          <span className="text-[10px] text-accent animate-pulse">جاري الترجمة...</span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.authorRoleEn}
                        onChange={(e) => setFormData({ ...formData, authorRoleEn: e.target.value })}
                        placeholder="Chief Market Strategist"
                        className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-text-primary block">النبذة التعريفية للكاتب (عربي)</label>
                      <textarea
                        rows={3}
                        value={formData.authorBioAr}
                        onChange={(e) => handleArabicChange('authorBioAr', 'authorBioEn', e.target.value)}
                        placeholder="نبذة مختصرة عن خبرة الكاتب وتخصصه الأكاديمي..."
                        className="w-full p-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-text-primary">نبذة الكاتب بالإنجليزية</label>
                        {translatingFields.authorBioEn && (
                          <span className="text-[10px] text-accent animate-pulse">جاري الترجمة...</span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={formData.authorBioEn}
                        onChange={(e) => setFormData({ ...formData, authorBioEn: e.target.value })}
                        placeholder="Certified financial analyst & market strategist with 14+ years of trading..."
                        className="w-full p-3 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TAKEAWAYS & TAGS */}
              {activeModalTab === 'takeaways' && (
                <div className="space-y-5">
                  {/* Tags Input */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-text-primary block">
                      الكلمات المفتاحية والوسوم (Tags - مفصولة بفواصل)
                    </label>
                    <input
                      type="text"
                      value={formData.tagsInput}
                      onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
                      placeholder="Forex, Scalping, Gold, Risk Management, SMC"
                      className="w-full h-10 px-3.5 rounded-xl bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                    />
                    <span className="text-[11px] text-text-muted">
                      افصل بين الكلمات بفواصل عادية (e.g. Scalping, SMC, Psychology)
                    </span>
                  </div>

                  {/* Key Takeaways Dynamic List */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-text-primary">
                          الركائز والنقاط الرئيسية للمقال (Key Takeaways)
                        </h4>
                        <span className="text-[11px] text-text-muted">
                          اكتب الركيزة بالعربية وسيترجم الحقل الإنجليزي تلقائياً مع خيار التعديل.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddTakeaway}
                        className="px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <IoAddCircleOutline />
                        <span>+ إضافة ركيزة</span>
                      </button>
                    </div>

                    {formData.keyTakeaways.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface border border-border-structural/60 space-y-2.5 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text-muted text-[11px]">ركيزة #{idx + 1}</span>
                          <div className="flex items-center gap-3">
                            {t.en && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleManualTranslate(t.en, `takeaway_ar_${idx}`, 'en', 'ar', (val) => {
                                    setFormData((prev) => {
                                      const updated = [...prev.keyTakeaways];
                                      updated[idx] = { ...updated[idx], ar: val };
                                      return { ...prev, keyTakeaways: updated };
                                    });
                                  })
                                }
                                className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                                title="ترجمة من الإنجليزية إلى العربية"
                              >
                                ترجمة للعربية
                              </button>
                            )}
                            {t.ar && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleManualTranslate(t.ar, `takeaway_en_${idx}`, 'ar', 'en', (val) => {
                                    setFormData((prev) => {
                                      const updated = [...prev.keyTakeaways];
                                      updated[idx] = { ...updated[idx], en: val };
                                      return { ...prev, keyTakeaways: updated };
                                    });
                                  })
                                }
                                className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                                title="ترجمة من العربية إلى الإنجليزية"
                              >
                                ترجمة للإنجليزية
                              </button>
                            )}
                            {formData.keyTakeaways.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTakeaway(idx)}
                                className="text-bearish-down hover:underline text-[11px] cursor-pointer"
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={t.ar}
                            onChange={(e) => handleTakeawayArChange(idx, e.target.value)}
                            placeholder="الركيزة بالعربية..."
                            className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                          />
                          <input
                            type="text"
                            value={t.en}
                            onChange={(e) => handleTakeawayEnChange(idx, e.target.value)}
                            placeholder="Key Takeaway in English (قابل للتعديل)..."
                            className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: SECTIONS & PRO TIPS */}
              {activeModalTab === 'sections' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-text-primary">
                        الأقسام التحريرية التفصيلية ({formData.sections.length} قسم)
                      </h4>
                      <span className="text-[11px] text-text-muted">
                        العناوين والمحتويات والنصائح تُترجم تلقائياً إلى الحقول الإنجليزية فور كتابتها.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-gradient-start text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <IoAddCircleOutline className="text-base" />
                      <span>+ إضافة قسم جديد للمقال</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.sections.map((sec, sIdx) => (
                      <div
                        key={sec.id || sIdx}
                        className="p-4 rounded-xl bg-surface border border-border-structural/80 space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-border-structural/40 pb-2">
                          <span className="font-bold text-primary text-xs">
                            القسم رقم {sIdx + 1}
                          </span>
                          {formData.sections.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSection(sIdx)}
                              className="text-bearish-down hover:underline text-xs cursor-pointer"
                            >
                              حذف هذا القسم
                            </button>
                          )}
                        </div>

                        {/* Heading Ar & En */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-text-secondary">
                                عنوان القسم (عربي - الأساسي)
                              </label>
                              {sec.headingEn && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleManualTranslate(sec.headingEn, `sec_${sIdx}_headingAr`, 'en', 'ar', (val) => {
                                      setFormData((prev) => {
                                        const updated = [...prev.sections];
                                        updated[sIdx] = { ...updated[sIdx], headingAr: val };
                                        return { ...prev, sections: updated };
                                      });
                                    })
                                  }
                                  className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                                  title="ترجمة العنوان الإنجليزي إلى العربية"
                                >
                                  ترجمة للعربية
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={sec.headingAr}
                              onChange={(e) =>
                                handleSectionFieldChange(sIdx, 'headingAr', 'headingEn', e.target.value)
                              }
                              placeholder="مثال: 1. استراتيجية تتبع الاتجاه مع المتوسطات المتحركة"
                              className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-text-secondary">
                                Section Heading (English - قابل للتعديل)
                              </label>
                              {sec.headingAr && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleManualTranslate(sec.headingAr, `sec_${sIdx}_headingEn`, 'ar', 'en', (val) => {
                                      setFormData((prev) => {
                                        const updated = [...prev.sections];
                                        updated[sIdx] = { ...updated[sIdx], headingEn: val };
                                        return { ...prev, sections: updated };
                                      });
                                    })
                                  }
                                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                                  title="ترجمة العنوان العربي إلى الإنجليزية"
                                >
                                  ترجمة للإنجليزية
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={sec.headingEn}
                              onChange={(e) =>
                                handleSectionFieldEnChange(sIdx, 'headingEn', 'headingAr', e.target.value)
                              }
                              placeholder="e.g. 1. Trend Following with Moving Averages"
                              className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        {/* Body Ar & En */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-text-secondary">
                                محتوى القسم (عربي - الأساسي)
                              </label>
                              {sec.bodyEn && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleManualTranslate(sec.bodyEn, `sec_${sIdx}_bodyAr`, 'en', 'ar', (val) => {
                                      setFormData((prev) => {
                                        const updated = [...prev.sections];
                                        updated[sIdx] = { ...updated[sIdx], bodyAr: val };
                                        return { ...prev, sections: updated };
                                      });
                                    })
                                  }
                                  className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                                  title="ترجمة المحتوى الإنجليزي إلى العربية"
                                >
                                  ترجمة للعربية
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={5}
                              value={sec.bodyAr}
                              onChange={(e) =>
                                handleSectionFieldChange(sIdx, 'bodyAr', 'bodyEn', e.target.value)
                              }
                              placeholder="اكتب الشرح والخطوات والتفاصيل هنا..."
                              className="w-full p-2.5 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary leading-relaxed"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-text-secondary">
                                Section Body Content (English - قابل للتعديل)
                              </label>
                              {sec.bodyAr && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleManualTranslate(sec.bodyAr, `sec_${sIdx}_bodyEn`, 'ar', 'en', (val) => {
                                      setFormData((prev) => {
                                        const updated = [...prev.sections];
                                        updated[sIdx] = { ...updated[sIdx], bodyEn: val };
                                        return { ...prev, sections: updated };
                                      });
                                    })
                                  }
                                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                                  title="ترجمة المحتوى العربي إلى الإنجليزية"
                                >
                                  ترجمة المحتوى
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={5}
                              value={sec.bodyEn}
                              onChange={(e) =>
                                handleSectionFieldEnChange(sIdx, 'bodyEn', 'bodyAr', e.target.value)
                              }
                              placeholder="Explain technical setups, parameters, and rules here..."
                              className="w-full p-2.5 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary leading-relaxed"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        {/* Pro Tip Box */}
                        <div className="p-3 rounded-lg bg-accent/5 border border-accent/25 space-y-2">
                          <div className="flex items-center justify-between text-accent font-bold text-[11px]">
                            <span>نصيحة الخبير الذهبية لهذا القسم (اختياري)</span>
                            <div className="flex items-center gap-2">
                              {sec.tipEn && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleManualTranslate(sec.tipEn, `sec_${sIdx}_tipAr`, 'en', 'ar', (val) => {
                                      setFormData((prev) => {
                                        const updated = [...prev.sections];
                                        updated[sIdx] = { ...updated[sIdx], tipAr: val };
                                        return { ...prev, sections: updated };
                                      });
                                    })
                                  }
                                  className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                                  title="ترجمة النصيحة الإنجليزية إلى العربية"
                                >
                                  ترجمة للعربية
                                </button>
                              )}
                              {sec.tipAr && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleManualTranslate(sec.tipAr, `sec_${sIdx}_tipEn`, 'ar', 'en', (val) => {
                                      setFormData((prev) => {
                                        const updated = [...prev.sections];
                                        updated[sIdx] = { ...updated[sIdx], tipEn: val };
                                        return { ...prev, sections: updated };
                                      });
                                    })
                                  }
                                  className="text-[10px] text-accent hover:underline font-bold cursor-pointer"
                                  title="ترجمة النصيحة العربية إلى الإنجليزية"
                                >
                                  ترجمة النصيحة
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={sec.tipAr}
                              onChange={(e) =>
                                handleSectionFieldChange(sIdx, 'tipAr', 'tipEn', e.target.value)
                              }
                              placeholder="نصيحة عملية للمتداول بالعربية..."
                              className="w-full h-8 px-3 rounded bg-surface border border-accent/20 text-text-primary text-xs outline-none focus:border-accent"
                            />
                            <input
                              type="text"
                              value={sec.tipEn}
                              onChange={(e) =>
                                handleSectionFieldEnChange(sIdx, 'tipEn', 'tipAr', e.target.value)
                              }
                              placeholder="Actionable trading tip in English..."
                              className="w-full h-8 px-3 rounded bg-surface border border-accent/20 text-text-primary text-xs outline-none focus:border-accent"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: FAQS */}
              {activeModalTab === 'faqs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-text-primary">
                        الأسئلة الشائعة حول موضوع المقال ({formData.faqs.length})
                      </h4>
                      <span className="text-[11px] text-text-muted">
                        اكتب السؤال والإجابة بالعربية، وستُترجم تلقائياً إلى الإنجليزية مع إمكانية التنقيح.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-gradient-start text-on-primary font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <IoAddCircleOutline className="text-base" />
                      <span>+ إضافة سؤال شائع جديد</span>
                    </button>
                  </div>

                  {formData.faqs.length === 0 ? (
                    <div className="p-8 text-center bg-surface rounded-xl border border-border-structural/60 text-text-muted">
                      لا توجد أسئلة شائعة حالياً. انقر على &quot;إضافة سؤال شائع جديد&quot; للإثراء.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.faqs.map((faq, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-3.5 rounded-xl bg-surface border border-border-structural space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-primary text-[11px]">سؤال #{fIdx + 1}</span>
                            <div className="flex items-center gap-3">
                              {(faq.qEn || faq.aEn) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (faq.qEn) {
                                      handleManualTranslate(faq.qEn, `faq_${fIdx}_qAr`, 'en', 'ar', (val) => {
                                        setFormData((prev) => {
                                          const updated = [...prev.faqs];
                                          updated[fIdx] = { ...updated[fIdx], qAr: val };
                                          return { ...prev, faqs: updated };
                                        });
                                      });
                                    }
                                    if (faq.aEn) {
                                      handleManualTranslate(faq.aEn, `faq_${fIdx}_aAr`, 'en', 'ar', (val) => {
                                        setFormData((prev) => {
                                          const updated = [...prev.faqs];
                                          updated[fIdx] = { ...updated[fIdx], aAr: val };
                                          return { ...prev, faqs: updated };
                                        });
                                      });
                                    }
                                  }}
                                  className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                                  title="ترجمة السؤال والإجابة إلى العربية"
                                >
                                  ترجمة للعربية
                                </button>
                              )}
                              {(faq.qAr || faq.aAr) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (faq.qAr) {
                                      handleManualTranslate(faq.qAr, `faq_${fIdx}_qEn`, 'ar', 'en', (val) => {
                                        setFormData((prev) => {
                                          const updated = [...prev.faqs];
                                          updated[fIdx] = { ...updated[fIdx], qEn: val };
                                          return { ...prev, faqs: updated };
                                        });
                                      });
                                    }
                                    if (faq.aAr) {
                                      handleManualTranslate(faq.aAr, `faq_${fIdx}_aEn`, 'ar', 'en', (val) => {
                                        setFormData((prev) => {
                                          const updated = [...prev.faqs];
                                          updated[fIdx] = { ...updated[fIdx], aEn: val };
                                          return { ...prev, faqs: updated };
                                        });
                                      });
                                    }
                                  }}
                                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                                  title="ترجمة السؤال والإجابة إلى الإنجليزية"
                                >
                                  ترجمة للإنجليزية
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFaq(fIdx)}
                                className="text-bearish-down hover:underline text-[11px] cursor-pointer"
                              >
                                حذف السؤال
                              </button>
                            </div>
                          </div>

                          {/* Questions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={faq.qAr}
                              onChange={(e) =>
                                handleFaqFieldChange(fIdx, 'qAr', 'qEn', e.target.value)
                              }
                              placeholder="السؤال بالعربية (e.g. كم رأس المال المناسب؟)"
                              className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                            />
                            <input
                              type="text"
                              value={faq.qEn}
                              onChange={(e) =>
                                handleFaqFieldEnChange(fIdx, 'qEn', 'qAr', e.target.value)
                              }
                              placeholder="Question in English (قابل للتعديل)..."
                              className="w-full h-9 px-3 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                              dir="ltr"
                            />
                          </div>

                          {/* Answers */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <textarea
                              rows={2}
                              value={faq.aAr}
                              onChange={(e) =>
                                handleFaqFieldChange(fIdx, 'aAr', 'aEn', e.target.value)
                              }
                              placeholder="الإجابة التفصيلية بالعربية..."
                              className="w-full p-2.5 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                            />
                            <textarea
                              rows={2}
                              value={faq.aEn}
                              onChange={(e) =>
                                handleFaqFieldEnChange(fIdx, 'aEn', 'aAr', e.target.value)
                              }
                              placeholder="Detailed Answer in English (قابل للتعديل)..."
                              className="w-full p-2.5 rounded-lg bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: MEDIA (VIDEO & LINKS) */}
              {activeModalTab === 'media' && (
                <div className="space-y-6">
                  {/* ── 1. SECTION: ESSENTIAL ARTICLE LINKS (أساسي) ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-structural space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-structural/70">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                          <IoLinkOutline className="text-lg" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-primary text-sm">
                              روابط ومصادر المقال (Links & Resources)
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-primary/20 text-primary border border-primary/30">
                              أساسي / إلزامي
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            أضف الروابط والمصادر المفيدة المتعلقة بالمقال (مثل: قناة التيليجرام، رابط مؤشر SMC، أو مراجع إضافية).
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer self-start sm:self-auto"
                      >
                        <IoAddOutline className="text-base" />
                        <span>إضافة رابط جديد</span>
                      </button>
                    </div>

                    {/* Links List */}
                    <div className="space-y-3">
                      {(formData.links || []).map((linkItem, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-surface-container border border-border-structural space-y-3 relative group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-primary flex items-center gap-1">
                              <span>الرابط #{idx + 1}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(idx)}
                              className="text-text-muted hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                              title="حذف هذا الرابط"
                            >
                              <IoTrashOutline className="text-sm" />
                              <span className="text-[10px]">حذف</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                عنوان الرابط بالعربية <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={linkItem.titleAr || ''}
                                onChange={(e) => handleUpdateLink(idx, 'titleAr', e.target.value)}
                                placeholder="مثال: قناة توصيات وتحليلات الذهب اليومية"
                                className="w-full h-9 px-3 rounded-lg bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                عنوان الرابط بالإنجليزية (English Title)
                              </label>
                              <input
                                type="text"
                                value={linkItem.titleEn || ''}
                                onChange={(e) => handleUpdateLink(idx, 'titleEn', e.target.value)}
                                placeholder="e.g. Official Daily Gold Analysis Channel"
                                className="w-full h-9 px-3 rounded-lg bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                                dir="ltr"
                              />
                            </div>

                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2">
                                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                  عنوان الرابط URL <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="url"
                                    value={linkItem.url || ''}
                                    onChange={(e) => handleUpdateLink(idx, 'url', e.target.value)}
                                    placeholder="https://t.me/... أو https://..."
                                    className="w-full h-9 px-3 ps-8 rounded-lg bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary font-mono"
                                    dir="ltr"
                                  />
                                  <IoLinkOutline className="absolute top-2.5 start-2.5 text-text-muted text-sm" />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-text-secondary mb-1">
                                  نوع الرابط
                                </label>
                                <select
                                  value={linkItem.type || 'telegram'}
                                  onChange={(e) => handleUpdateLink(idx, 'type', e.target.value)}
                                  className="w-full h-9 px-2.5 rounded-lg bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary cursor-pointer"
                                >
                                  <option value="telegram">قناة / مجموعة تيليجرام</option>
                                  <option value="download">تحميل مؤشر / ملف</option>
                                  <option value="indicator">أداة وشارت TradingView</option>
                                  <option value="article">مرجع / مقال ذو صلة</option>
                                  <option value="external">رابط خارجي عام</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!formData.links || formData.links.length === 0) && (
                        <div className="text-center py-6 border border-dashed border-border-structural rounded-xl text-text-muted text-xs space-y-2">
                          <IoLinkOutline className="text-3xl mx-auto text-primary/40" />
                          <p className="font-semibold text-text-secondary">لا توجد روابط مضافة للمقال</p>
                          <p className="text-[11px]">الروابط أساسية، يرجى إضافة رابط واحد على الأقل للمقال.</p>
                          <button
                            type="button"
                            onClick={handleAddLink}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <IoAddOutline /> إضافة أول رابط الآن
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── 2. SECTION: OPTIONAL VIDEO UPLOAD & EMBED (اختياري) ── */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border-structural space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-border-structural/70">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent">
                          <IoVideocamOutline className="text-lg" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-text-primary text-sm">
                              الفيديو التوضيحي للمقال (Article Video Breakdown)
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-surface-container text-text-muted border border-border-structural">
                              اختياري (Optional)
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            يمكنك رفع فيديو من جهازك (MP4 / WebM) ليُحفظ سحابياً، أو وضع رابط خارجي (YouTube / Vimeo / Loom). إذا تُرك فارغاً سينشر المقال كالمعتاد.
                          </p>
                        </div>
                      </div>

                      {formData.videoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, videoUrl: '' })}
                          className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <IoTrashOutline className="text-sm" />
                          <span>إزالة الفيديو</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Direct Cloud Video Upload Widget */}
                      <CloudUploadWidget
                        value={formData.videoUrl || ''}
                        onChange={(url) => setFormData({ ...formData, videoUrl: url })}
                        folder="articles-videos"
                        label="رفع ملف فيديو من الجهاز (MP4 / WebM) أو إدخال رابط خارجي:"
                        accept="video/mp4,video/webm,video/ogg,video/*"
                        placeholder="https://www.youtube.com/watch?v=... أو اختر ملف فيديو من جهازك لرفعه سحابياً"
                      />

                      {/* Video Preview Card if URL exists */}
                      {formData.videoUrl && (
                        <div className="p-3 rounded-xl bg-surface-container border border-border-structural space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-text-primary flex items-center gap-1.5">
                              <IoPlayOutline className="text-accent text-base" />
                              <span>معاينة الفيديو المرفق بالمقال:</span>
                            </span>
                            <span className="text-[10px] text-text-muted font-mono truncate max-w-xs" dir="ltr">
                              {formData.videoUrl}
                            </span>
                          </div>

                          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/80 border border-white/10 flex items-center justify-center">
                            {formData.videoUrl.includes('youtube.com') || formData.videoUrl.includes('youtu.be') ? (
                              <iframe
                                src={getYoutubeEmbedUrl(formData.videoUrl)}
                                title="YouTube video preview"
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : formData.videoUrl.includes('vimeo.com') ? (
                              <iframe
                                src={getVimeoEmbedUrl(formData.videoUrl)}
                                title="Vimeo video preview"
                                className="w-full h-full"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                src={formData.videoUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Sticky Footer (Always Visible) */}
            <div className="px-6 py-3.5 bg-surface-container-high/95 backdrop-blur-md border-t border-border-structural flex items-center justify-between shrink-0 shadow-xl z-20">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-container text-text-secondary hover:text-text-primary font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء التراجع
              </button>

              <div className="flex items-center gap-3">
                {/* Save as Draft Button */}
                <button
                  type="button"
                  onClick={() => handleSaveArticle('DRAFT')}
                  className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-elevated border border-border-structural hover:border-amber-500/50 text-text-primary font-bold text-xs transition-all cursor-pointer flex items-center gap-2"
                  title="حفظ كمسودة في الداشبورد للمراجعة لاحقاً دون نشره على الموقع"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>حفظ كمسودة (Draft)</span>
                </button>

                {/* Save & Publish Button */}
                <button
                  type="button"
                  onClick={() => handleSaveArticle('PUBLISHED')}
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-gradient-start text-on-primary font-bold text-xs shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center gap-2"
                  title="نشر المقال فورياً ليكون معروضاً للزوار على الموقع"
                >
                  <IoCheckmarkCircleOutline className="text-base" />
                  <span>
                    {modalMode === 'create' ? 'نشر المقال على الموقع' : 'حفظ ونشر التعديلات'}
                  </span>
                </button>
              </div>
            </div>
          </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TRADINGVIEW IMPORTER STUDIO MODAL                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isTvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-surface-container border border-border-structural/80 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-surface-elevated via-surface-container to-surface-elevated border-b border-border-structural flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2962FF]/15 border border-[#2962FF]/30 flex items-center justify-center text-[#2962FF] shadow-sm">
                  <IoSparklesOutline className="text-xl animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-text-primary">
                      استوديو استيراد تحليلات وأفكار TradingView
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2962FF]/15 text-[#2962FF] border border-[#2962FF]/30">
                      Live Feed & URL Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    جلب تحليلات السوق المعتمدة وصياغتها تلقائياً بنفس أسلوب وهوية مدونات FXENGIN (عربي/إنجليزي، ركائز، نصائح ذهبية، وأسئلة شائعة).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTvModalOpen(false)}
                className="p-1.5 rounded-xl bg-surface hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all cursor-pointer"
                title="إغلاق"
              >
                <IoCloseCircleOutline className="text-2xl" />
              </button>
            </div>

            {/* Sub-Header Tabs */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-surface border-b border-border-structural text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTvActiveTab('feed')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    tvActiveTab === 'feed'
                      ? 'bg-[#2962FF] text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                  }`}
                >
                  <IoFlashOutline className="text-sm" />
                  <span>أحدث أفكار وتحليلات السوق (Live Feed)</span>
                  {tvFeedItems.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                      {tvFeedItems.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTvActiveTab('url')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    tvActiveTab === 'url'
                      ? 'bg-[#2962FF] text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-container'
                  }`}
                >
                  <IoOpenOutline className="text-sm" />
                  <span>استيراد برابط مباشر (Direct URL)</span>
                </button>
              </div>

              {tvActiveTab === 'feed' && (
                <button
                  type="button"
                  onClick={() => loadTradingViewFeed(tvCategory, tvSearch)}
                  disabled={tvFeedLoading}
                  className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary transition-all cursor-pointer disabled:opacity-50"
                  title="تحديث الخلاصة"
                >
                  <IoRefreshOutline className={`text-base ${tvFeedLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {/* TAB 1: LIVE FEED CONTENT */}
            {tvActiveTab === 'feed' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Categories and Search Filters */}
                <div className="px-6 py-3 bg-surface/50 border-b border-border-structural flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                    {[
                      { key: 'all', label: 'جميع الأسواق' },
                      { key: 'forex', label: 'الفوركس (Forex)' },
                      { key: 'commodities', label: 'الذهب والسلع (Gold/Oil)' },
                      { key: 'crypto', label: 'العملات الرقمية (Crypto)' },
                      { key: 'indices', label: 'المؤشرات (Indices)' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          setTvCategory(cat.key);
                          loadTradingViewFeed(cat.key, tvSearch);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          tvCategory === cat.key
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-elevated text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Search Box */}
                  <div className="relative w-full md:w-64">
                    <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm pointer-events-none" />
                    <input
                      type="text"
                      value={tvSearch}
                      onChange={(e) => setTvSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') loadTradingViewFeed(tvCategory, tvSearch);
                      }}
                      placeholder="ابحث بالرمز (e.g. XAUUSD)..."
                      className="w-full h-8 pr-9 pl-3 rounded-lg bg-surface border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Ideas Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  {tvFeedLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-3 p-12">
                      <div className="w-10 h-10 border-3 border-[#2962FF] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-text-muted">جاري الاتصال بـ TradingView وجلب أحدث أفكار السوق...</span>
                    </div>
                  ) : tvFeedItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-3 bg-surface rounded-2xl border border-border-structural">
                      <IoSparklesOutline className="text-3xl text-text-muted" />
                      <div className="text-sm font-bold text-text-primary">لم يتم العثور على أفكار في هذا التصنيف</div>
                      <p className="text-xs text-text-muted max-w-sm">
                        جرب تغيير التصنيف أو البحث عن رمز آخر أو التحديث مرة أخرى.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tvFeedItems
                        .filter((item) => {
                          if (!tvSearch.trim()) return true;
                          const q = tvSearch.toLowerCase().trim();
                          return (
                            (item.symbol || '').toLowerCase().includes(q) ||
                            (item.title || '').toLowerCase().includes(q) ||
                            (item.author || '').toLowerCase().includes(q)
                          );
                        })
                        .map((item) => {
                          const isProcessing = tvProcessingId === item.id;
                          return (
                            <div
                              key={item.id}
                              className="bg-surface rounded-xl border border-border-structural/80 hover:border-[#2962FF]/60 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all group"
                            >
                              {/* Chart Thumbnail */}
                              <div className="relative w-full h-36 bg-black/60 overflow-hidden">
                                {item.chartImage ? (
                                  <img
                                    src={item.chartImage}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                                    لا يتوفر شارت للمعاينة
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-white font-mono text-[10px] font-bold border border-white/20">
                                  {item.symbol}
                                </div>
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#2962FF]/90 backdrop-blur-md text-white text-[9px] font-bold">
                                  {item.assetClass}
                                </div>
                                <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between text-[10px] text-gray-300">
                                  <div className="flex items-center gap-1">
                                    <div className="w-4 h-4 rounded-full overflow-hidden bg-white/20">
                                      {item.authorAvatar && (
                                        <img src={item.authorAvatar} alt={item.author} className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                    <span className="truncate max-w-[120px] font-medium">{item.author}</span>
                                  </div>
                                  <span>{item.pubDate}</span>
                                </div>
                              </div>

                              {/* Card Content */}
                              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-bold text-xs text-text-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                    {item.title}
                                  </h4>
                                  <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                                    {item.description || 'فكرة تحليل فني منشورة على منصة TradingView.'}
                                  </p>
                                </div>

                                <div className="pt-2 border-t border-border-structural/50 flex items-center justify-between gap-2">
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10.5px] text-text-muted hover:text-[#2962FF] flex items-center gap-1 transition-colors"
                                  >
                                    <span>المصدر</span>
                                    <IoOpenOutline />
                                  </a>

                                  <button
                                    type="button"
                                    onClick={() => handleImportFromFeed(item)}
                                    disabled={isProcessing}
                                    className="px-3 py-1.5 rounded-lg bg-[#2962FF] hover:bg-[#1E53E5] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                    {isProcessing ? (
                                      <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>جاري الصياغة...</span>
                                      </>
                                    ) : (
                                      <>
                                        <IoSparklesOutline />
                                        <span>استيراد وتحويل لمدونة</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT URL IMPORT */}
            {tvActiveTab === 'url' && (
              <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center">
                <div className="w-full max-w-xl bg-surface p-8 rounded-2xl border border-border-structural shadow-lg space-y-6">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#2962FF]/15 text-[#2962FF] flex items-center justify-center mx-auto text-2xl border border-[#2962FF]/30">
                      <IoOpenOutline />
                    </div>
                    <h3 className="text-base font-bold text-text-primary">
                      استيراد تحليل TradingView عبر الرابط المباشر
                    </h3>
                    <p className="text-xs text-text-muted leading-relaxed">
                      الصق رابط أي فكرة أو شارت منشور على TradingView وسيقوم النظام فورياً باستخراج الشارت والنصوص وترجمتها وتنسيقها بأسلوب وهوية مدونات FXENGIN.
                    </p>
                  </div>

                  <form onSubmit={handleImportFromUrl} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-primary block">
                        رابط الفكرة من TradingView (Idea URL)
                      </label>
                      <input
                        type="url"
                        required
                        value={tvDirectUrl}
                        onChange={(e) => setTvDirectUrl(e.target.value)}
                        placeholder="https://www.tradingview.com/chart/XAUUSD/..."
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container border border-border-structural text-text-primary text-xs outline-none focus:border-primary"
                        dir="ltr"
                      />
                      <span className="text-[11px] text-text-muted block">
                        يدعم روابط الشارتات مثل: <code>tradingview.com/chart/...</code> أو <code>tradingview.com/ideas/...</code>
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={tvUrlLoading}
                      className="w-full h-11 rounded-xl bg-gradient-to-r from-[#2962FF] to-[#1E53E5] hover:from-[#1E53E5] hover:to-[#0F3EB5] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {tvUrlLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جاري فحص الرابط واستخراج الشارت والمحتوى...</span>
                        </>
                      ) : (
                        <>
                          <IoSparklesOutline className="text-base" />
                          <span>جلب وتنسيق المقال الآن</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
