'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'react-toastify';
import {
  IoCloseOutline,
  IoSparklesOutline,
  IoSaveOutline,
  IoEyeOutline,
  IoTimeOutline,
  IoRepeatOutline,
  IoFlameOutline,
  IoStar,
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoOpenOutline,
  IoColorPaletteOutline,
  IoPlayOutline,
  IoLayersOutline,
  IoAddOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoChevronUpOutline,
  IoChevronDownOutline,
  IoCheckmarkCircleOutline,
  IoCheckmarkOutline,
} from 'react-icons/io5';
import { updateBrokerPopupConfig } from '../../services/brokerService';

const INTERVAL_OPTIONS = [
  { value: 30, label: 'كل 30 ثانية (سريع للتجارب)' },
  { value: 45, label: 'كل 45 ثانية' },
  { value: 60, label: 'كل 60 ثانية (دقيقة واحدة - الموصى به)' },
  { value: 90, label: 'كل 90 ثانية (دقيقة ونصف)' },
  { value: 120, label: 'كل دقيقتين (120 ثانية)' },
  { value: 180, label: 'كل 3 دقائق' },
  { value: 300, label: 'كل 5 دقائق' },
];

const INITIAL_DELAY_OPTIONS = [
  { value: 5, label: 'بعد 5 ثوانٍ (سريع جداً)' },
  { value: 10, label: 'بعد 10 ثوانٍ' },
  { value: 15, label: 'بعد 15 ثانية (الموصى به - يمنح الزائر فرصة لتصفح الهيدر)' },
  { value: 30, label: 'بعد 30 ثانية' },
  { value: 60, label: 'بعد دقيقة واحدة (60 ثانية)' },
];

const SIDE_DURATION_OPTIONS = [
  { value: 5, label: '5 ثوانٍ (سريع)' },
  { value: 8, label: '8 ثوانٍ' },
  { value: 10, label: '10 ثوانٍ' },
  { value: 12, label: '12 ثانية (الموصى به - كافٍ للقراءة والتفاعل)' },
  { value: 15, label: '15 ثانية' },
  { value: 20, label: '20 ثانية' },
  { value: 30, label: '30 ثانية' },
  { value: 0, label: 'دائم (حتى يغلقه الزائر يدوياً)' },
];

const SIDE_INTERVAL_OPTIONS = [
  { value: 15, label: 'كل 15 ثانية (فوري للتجربة والاختبار)' },
  { value: 30, label: 'كل 30 ثانية (سريع)' },
  { value: 45, label: 'كل 45 ثانية (الافتراضي المتوازن)' },
  { value: 60, label: 'كل 60 ثانية (دقيقة واحدة)' },
  { value: 90, label: 'كل 90 ثانية (دقيقة ونصف)' },
  { value: 120, label: 'كل دقيقتين (120 ثانية)' },
  { value: 180, label: 'كل 3 دقائق' },
  { value: 300, label: 'كل 5 دقائق' },
  { value: 600, label: 'كل 10 دقائق' },
];

const SIDE_DELAY_OPTIONS = [
  { value: 2, label: 'بعد ثانيتين (فوري عند الدخول)' },
  { value: 5, label: 'بعد 5 ثوانٍ' },
  { value: 10, label: 'بعد 10 ثوانٍ (الموصى به)' },
  { value: 15, label: 'بعد 15 ثانية' },
  { value: 20, label: 'بعد 20 ثانية' },
  { value: 30, label: 'بعد 30 ثانية' },
];

const PRESET_ACCENT_COLORS = [
  { name: 'أخضر مالي (HFM)', color: '#10B981' },
  { name: 'أخضر زمردي (XM)', color: '#10B981' },
  { name: 'أخضر نيون (YWO)', color: '#00D06C' },
  { name: 'أزرق سماوي (MultiBank)', color: '#0EA5E9' },
  { name: 'ذهبي / برتقالي (PropXP)', color: '#F59E0B' },
  { name: 'بنفسجي ملكي', color: '#8B5CF6' },
];

const DEFAULT_POPUP_CARDS = [
  {
    id: 'card_hfm',
    isActive: true,
    brokerId: 'hfm',
    badgeAr: 'شريك وساطة رسمي معتمد',
    badgeEn: 'Official Verified Partner',
    titleAr: 'HFM (HF Markets)',
    titleEn: 'HFM (HF Markets)',
    subtitleAr: 'وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية',
    subtitleEn: 'Multi-Award Winning Global Broker (FCA, CySEC, DFSA)',
    rating: 4.9,
    highlightAr: 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية',
    highlightEn: 'Up to $2/lot cashback rebate + 20% Top-Up bonus and full FXENGIN Academy access',
    liveBtnTextAr: 'فتح حساب مباشر',
    liveBtnTextEn: 'Open Live Account',
    liveUrl: 'https://www.hfm.com',
    showDemo: true,
    demoBtnTextAr: 'تجريبي',
    demoBtnTextEn: 'Demo',
    demoUrl: 'https://www.hfm.com',
    accentColor: '#10B981',
    customLogo: '/assets/Images/brokers/hfm.png',
    durationSeconds: 12,
  },
  {
    id: 'card_xm',
    isActive: true,
    brokerId: 'xm',
    badgeAr: 'فئة أولى Tier-1 • الأكثر موثوقية',
    badgeEn: 'Tier-1 Regulated • Most Trusted',
    titleAr: 'XM Global',
    titleEn: 'XM Global',
    subtitleAr: 'وسيط فوركس وعقود فروقات مرخص عالمياً (FCA, ASIC)',
    subtitleEn: 'Multi-Regulated Tier-1 Global Broker',
    rating: 4.95,
    highlightAr: 'بونص إيداع 100% حتى 500$ + حسابات إسلامية بدون فوائد تبييت وتوصيات VIP مجانية',
    highlightEn: '100% Deposit Bonus up to $500 + Swap-Free Islamic Accounts and VIP Signals',
    liveBtnTextAr: 'افتح حساب حقيقي',
    liveBtnTextEn: 'Open Live Account',
    liveUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    showDemo: true,
    demoBtnTextAr: 'تجريبي',
    demoBtnTextEn: 'Demo',
    demoUrl: 'https://clicks.pipaffiliates.com/c?c=655286&l=ar&p=0',
    accentColor: '#10B981',
    customLogo: '/assets/Images/brokers/xm.png',
    durationSeconds: 12,
  },
  {
    id: 'card_ywo',
    isActive: true,
    brokerId: 'ywo',
    badgeAr: 'سبريد خام 0.0 • رافعة 1:1000',
    badgeEn: '0.0 Raw Spread • 1:1000 Leverage',
    titleAr: 'YWO Markets',
    titleEn: 'YWO Markets',
    subtitleAr: 'وسيط ECN حديث لسكالبينج الذهب والعملات والمؤشرات',
    subtitleEn: 'Ultra-Low Raw ECN Spread Broker',
    rating: 4.88,
    highlightAr: 'سبريد خام يبدأ من 0.0 نقطة مع سيولة بنكية مباشرة لسكالبينج الذهب والعملات',
    highlightEn: '0.0 Raw Spreads for Gold & FX Scalping + 1:1000 Leverage',
    liveBtnTextAr: 'ابدأ بسبريد 0.0',
    liveBtnTextEn: 'Start with 0.0 Spread',
    liveUrl: 'https://user.ywomarkets.com/register?referral=6058',
    showDemo: true,
    demoBtnTextAr: 'تجريبي',
    demoBtnTextEn: 'Demo',
    demoUrl: 'https://user.ywomarkets.com/register?referral=6058',
    accentColor: '#00D06C',
    customLogo: '/assets/Images/brokers/ywo.png',
    durationSeconds: 12,
  },
  {
    id: 'card_multibank',
    isActive: true,
    brokerId: 'multibank',
    badgeAr: '14+ ترخيصاً دولياً • أمان مصرفي',
    badgeEn: '14+ Regulations • Bank-Grade Safety',
    titleAr: 'MultiBank Group',
    titleEn: 'MultiBank Group',
    subtitleAr: 'مجموعة مالية عالمية عملاقة مع سيولة بنكية عميقة',
    subtitleEn: 'Global Financial Conglomerate',
    rating: 4.86,
    highlightAr: 'ترقية فورية لحساب VIP بدون عمولات إضافية + تحليلات مهندس الفوركس اليومية',
    highlightEn: 'Instant VIP Account status upgrade + Daily technical forecasts',
    liveBtnTextAr: 'فتح حساب VIP',
    liveBtnTextEn: 'Open VIP Account',
    liveUrl: 'https://multibankfx.com/account/live-account?ib=fxengin',
    showDemo: true,
    demoBtnTextAr: 'تجريبي',
    demoBtnTextEn: 'Demo',
    demoUrl: 'https://multibankfx.com/account/demo-account?ib=fxengin',
    accentColor: '#0EA5E9',
    customLogo: '/assets/Images/brokers/multibank.png',
    durationSeconds: 12,
  },
  {
    id: 'card_propxp',
    isActive: true,
    brokerId: 'propxp',
    badgeAr: 'تمويل حسابات حتى $200,000',
    badgeEn: 'Funded Accounts up to $200K',
    titleAr: 'PropXP Funding',
    titleEn: 'PropXP Funding',
    subtitleAr: 'شركة تقييم وتمويل متداولين مع نسبة أرباح تصل إلى 90%',
    subtitleEn: 'Premier Trader Evaluation & Funding Firm',
    rating: 4.92,
    highlightAr: 'خصم حصري 20% بكود (FXENGIN20) واسترداد كامل لرسوم التقييم 100%',
    highlightEn: 'Exclusive 20% Discount with (FXENGIN20) + 100% Fee Refund',
    liveBtnTextAr: 'احصل على تمويلك',
    liveBtnTextEn: 'Get Funded',
    liveUrl: 'https://propxp.com?aff=fxengin',
    showDemo: true,
    demoBtnTextAr: 'تجريبي',
    demoBtnTextEn: 'Demo',
    demoUrl: 'https://propxp.com?aff=fxengin',
    accentColor: '#F59E0B',
    customLogo: '/assets/Images/brokers/propxp.png',
    durationSeconds: 12,
  },
];

export default function BrokerPopupControlModal({
  isOpen,
  onClose,
  config,
  brokers = [],
  onConfigSaved,
}) {
  const [activeTab, setActiveTab] = useState('sideToast'); // 'sideToast' | 'centerModal'

  const [formData, setFormData] = useState({
    // Center Modal
    isEnabled: true,
    showOnce: true,
    modalBgTheme: 'broker_logo',
    intervalSeconds: 60,
    initialDelaySeconds: 15,
    mode: 'rotate', // 'rotate' | 'specific'
    selectedBrokerId: 'xm',
    headlineAr: 'فرصة تداول حصرية عبر شركاء FXEngin المعتمدين',
    headlineEn: 'Exclusive Trading Opportunity via FXEngin Verified Partners',
    subheadlineAr: 'احصل على بونص إيداع 100% وحسابات إسلامية خالية من الفوائد مع وصول فوري لتوصيات وتحليلات مهندس الفوركس',
    subheadlineEn: 'Claim 100% deposit bonus and swap-free Islamic accounts with instant access to VIP signals',
    badgeAr: 'شريك وساطة رسمي معتمد • فئة أولى Tier-1',
    badgeEn: 'Official Verified Partner • Tier-1 Regulated',
    ctaTextAr: 'افتح حساب حقيقي الآن',
    ctaTextEn: 'Open Live Account Now',
    demoBtnTextAr: 'حساب تجريبي مجاني',
    demoBtnTextEn: 'Free Demo Account',
    allowDismissMinutes: 1,

    // Side Toast Notification Timing
    sidePopupEnabled: true,
    sidePopupIntervalSeconds: 45,
    sidePopupDurationSeconds: 12,
    sidePopupInitialDelaySeconds: 10,
    sidePopupPosition: 'bottom-left',
    sidePopupShowOnce: false,

    // Side Toast Notification Mode & Cards
    sidePopupMode: 'cards', // 'cards' | 'broker' | 'custom'
    sidePopupBrokerId: 'hfm',
    sidePopupBadgeAr: 'شريك وساطة رسمي معتمد',
    sidePopupBadgeEn: 'Official Verified Partner',
    sidePopupCustomTitleAr: 'HFM (HF Markets)',
    sidePopupCustomTitleEn: 'HFM (HF Markets)',
    sidePopupCustomSubtitleAr: 'وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية',
    sidePopupCustomSubtitleEn: 'Multi-Award Winning Global Broker (FCA, CySEC, DFSA)',
    sidePopupRating: 4.9,
    sidePopupHighlightAr: 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية',
    sidePopupHighlightEn: 'Up to $2/lot cashback rebate + 20% Top-Up bonus and full FXENGIN Academy access',
    sidePopupLiveBtnTextAr: 'فتح حساب مباشر',
    sidePopupLiveBtnTextEn: 'Open Live Account',
    sidePopupLiveUrl: '',
    sidePopupShowDemo: true,
    sidePopupDemoBtnTextAr: 'تجريبي',
    sidePopupDemoBtnTextEn: 'Demo',
    sidePopupDemoUrl: '',
    sidePopupAccentColor: '#10B981',
    sidePopupCustomLogo: '',

    popupCards: DEFAULT_POPUP_CARDS,
  });

  const [saving, setSaving] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardData, setEditingCardData] = useState(null);
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [previewAnimationKey, setPreviewAnimationKey] = useState(0);
  const [isTestExiting, setIsTestExiting] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData((prev) => {
        const mergedCards =
          Array.isArray(config.popupCards) && config.popupCards.length > 0
            ? config.popupCards
            : prev.popupCards || DEFAULT_POPUP_CARDS;
        return {
          ...prev,
          ...config,
          popupCards: mergedCards,
        };
      });
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await updateBrokerPopupConfig(formData);
      if (res.success) {
        toast.success('تم حفظ إعدادات بطاقات النوافذ المنبثقة والفاصل الزمني بنجاح!');
        if (typeof onConfigSaved === 'function') {
          onConfigSaved(res.config || formData);
        }
        onClose();
      } else {
        toast.error(res.error || 'تعذر حفظ الإعدادات');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  // Cards List Handlers
  const handleToggleCardActive = (cardId, e) => {
    e?.stopPropagation();
    setFormData((prev) => {
      const cards = (prev.popupCards || []).map((c) => {
        if (c.id === cardId) {
          const nextActive = !c.isActive;
          toast.info(nextActive ? `تم تفعيل بطاقة ${c.titleAr}` : `تم إيقاف بطاقة ${c.titleAr}`);
          return { ...c, isActive: nextActive };
        }
        return c;
      });
      return { ...prev, popupCards: cards };
    });
  };

  const handleDeleteCard = (cardId, e) => {
    e?.stopPropagation();
    if ((formData.popupCards || []).length <= 1) {
      toast.warning('يجب الإبقاء على بطاقة واحدة على الأقل');
      return;
    }
    const cardToDelete = formData.popupCards.find((c) => c.id === cardId);
    setFormData((prev) => ({
      ...prev,
      popupCards: (prev.popupCards || []).filter((c) => c.id !== cardId),
    }));
    if (editingCardId === cardId) {
      setEditingCardId(null);
      setEditingCardData(null);
    }
    toast.success(`تم حذف بطاقة ${cardToDelete?.titleAr || 'الوسيط'}`);
  };

  const handleMoveCard = (index, direction, e) => {
    e?.stopPropagation();
    const cards = [...(formData.popupCards || [])];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= cards.length) return;
    const temp = cards[index];
    cards[index] = cards[targetIndex];
    cards[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, popupCards: cards }));
  };

  const handleStartCreateCard = () => {
    const existingIds = (formData.popupCards || []).map((c) => c.brokerId);
    const candidateBroker =
      brokers.find((b) => !existingIds.includes(b.id || b.brokerSlug)) ||
      brokers[0] || {
        id: 'hfm',
        name: 'HFM (HF Markets)',
        accentColor: '#10B981',
        logo: '/assets/Images/brokers/hfm.png',
        rating: 4.9,
      };

    const newCard = {
      id: `card_${Date.now()}`,
      isActive: true,
      brokerId: candidateBroker.id || candidateBroker.brokerSlug || 'hfm',
      badgeAr: 'شريك وساطة رسمي معتمد',
      badgeEn: 'Official Verified Partner',
      titleAr: candidateBroker.name || 'وسيط شريك',
      titleEn: candidateBroker.name || 'Partner Broker',
      subtitleAr:
        candidateBroker.categoryLabelAr ||
        candidateBroker.descriptionAr?.slice(0, 50) ||
        'وسيط عالمي مرخص شريك لـ FXEngin',
      subtitleEn:
        candidateBroker.categoryLabelEn ||
        candidateBroker.descriptionEn?.slice(0, 50) ||
        'Official Verified Global Broker',
      rating: candidateBroker.rating || 4.9,
      highlightAr:
        candidateBroker.fxenginPerksAr ||
        candidateBroker.perksAr ||
        'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20%',
      highlightEn:
        candidateBroker.fxenginPerksEn ||
        candidateBroker.perksEn ||
        'Up to $2/lot cashback rebate + 20% Top-Up bonus',
      liveBtnTextAr: 'فتح حساب مباشر',
      liveBtnTextEn: 'Open Live Account',
      liveUrl: candidateBroker.liveUrl || '',
      showDemo: true,
      demoBtnTextAr: 'تجريبي',
      demoBtnTextEn: 'Demo',
      demoUrl: candidateBroker.demoUrl || '',
      accentColor: candidateBroker.accentColor || '#10B981',
      customLogo: candidateBroker.logo || '',
      durationSeconds: formData.sidePopupDurationSeconds || 12,
    };

    setEditingCardId(newCard.id);
    setEditingCardData(newCard);
  };

  const handleStartEditCard = (card) => {
    setEditingCardId(card.id);
    setEditingCardData({ ...card });
  };

  const handleCancelEditCard = () => {
    setEditingCardId(null);
    setEditingCardData(null);
  };

  const handleSaveCard = () => {
    if (!editingCardData) return;
    const cards = formData.popupCards ? [...formData.popupCards] : [];
    const index = cards.findIndex((c) => c.id === editingCardData.id);

    if (index >= 0) {
      cards[index] = editingCardData;
      toast.success(`تم تحديث بطاقة ${editingCardData.titleAr || 'الوسيط'} بنجاح!`);
    } else {
      cards.push(editingCardData);
      toast.success(`تمت إضافة بطاقة ${editingCardData.titleAr || 'الوسيط'} للقائمة بنجاح!`);
    }

    setFormData((prev) => ({ ...prev, popupCards: cards }));
    setEditingCardId(null);
    setEditingCardData(null);
  };

  const handleLoadBrokerIntoEditing = (targetBrokerId) => {
    const selected = brokers.find((b) => b.id === targetBrokerId || b.brokerSlug === targetBrokerId);
    if (!selected) {
      toast.info('الوسيط غير موجود');
      return;
    }

    setEditingCardData((prev) => ({
      ...prev,
      brokerId: targetBrokerId,
      titleAr: selected.name || '',
      titleEn: selected.name || '',
      subtitleAr: selected.categoryLabelAr || selected.descriptionAr?.slice(0, 50) || '',
      subtitleEn: selected.categoryLabelEn || selected.descriptionEn?.slice(0, 50) || '',
      rating: selected.rating || 4.9,
      highlightAr:
        selected.fxenginPerksAr || selected.perksAr || 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20%',
      highlightEn:
        selected.fxenginPerksEn || selected.perksEn || 'Up to $2/lot cashback rebate + 20% Top-Up bonus',
      liveUrl: selected.liveUrl || '',
      demoUrl: selected.demoUrl || '',
      accentColor: selected.accentColor || '#10B981',
      customLogo: selected.logo || '',
    }));

    toast.success(`تم استيراد نصوص وبيانات ${selected.name} إلى حقول البطاقة بنجاح!`);
  };

  // Preview resolution
  const cardsList =
    formData.popupCards && formData.popupCards.length > 0 ? formData.popupCards : DEFAULT_POPUP_CARDS;
  const currentCard = cardsList[previewCardIndex % cardsList.length] || cardsList[0];
  const previewColor = currentCard.accentColor || '#10B981';

  // Trigger test animation and step to next card
  const handleTriggerTestAnimation = () => {
    setIsTestExiting(true);
    setTimeout(() => {
      setIsTestExiting(false);
      setPreviewAnimationKey((k) => k + 1);
      setPreviewCardIndex((prev) => (prev + 1) % cardsList.length);
    }, 420);
  };

  const activeCardsCount = (formData.popupCards || []).filter((c) => c.isActive !== false).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-3xl bg-[#070e1b] border border-white/10 shadow-2xl text-slate-100 p-5 sm:p-8 custom-scrollbar">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] shadow-lg shadow-[#10B981]/15">
              <IoSparklesOutline size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                إدارة النوافذ الترويجية وإشعار التوست العائم
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                تحكم كامل في إضافة أكثر من Popup لأكثر من وسيط، وضبط المسافة والفاصل الزمني بين كل ظهور
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/30 flex items-center justify-center text-slate-400 transition-all cursor-pointer"
          >
            <IoCloseOutline size={24} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('sideToast')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sideToast'
                ? 'bg-[#10B981] text-white shadow-lg shadow-[#10B981]/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>إشعار التوست العائم بالركن (Side Toast Notification)</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-black">
              {activeCardsCount} بطاقة مفعلة
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('centerModal')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'centerModal'
                ? 'bg-[#0488F8] text-white shadow-lg shadow-[#0488F8]/25'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <IoLayersOutline size={18} />
            <span>النافذة المنبثقة المركزية (Center Modal Popup)</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: SIDE TOAST NOTIFICATION (Requested)                     */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'sideToast' && (
            <div className="space-y-6">
              {/* Activation Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#10B981]/10 via-white/5 to-transparent border border-[#10B981]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      formData.sidePopupEnabled !== false
                        ? 'bg-[#10B981] shadow-[0_0_10px_#10B981] animate-pulse'
                        : 'bg-slate-600'
                    }`}
                  />
                  <div>
                    <div className="text-sm sm:text-base font-bold text-white">
                      تفعيل ظهور إشعار التوست العائم في زاوية الموقع
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      يظهر كإشعار منبثق أنيق (Toast) في ركن الشاشة بحركة انسيابية دون حجب تصفح الموقع
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.sidePopupEnabled !== false}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sidePopupEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                </label>
              </div>

              {/* Timing & Frequency Settings ("المسافة الوقتية بين كل Popup وآخر") */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <IoTimeOutline size={18} className="text-[#10B981]" />
                    <span>توقيت والمسافة الوقتية بين كل Popup (Timing & Frequency)</span>
                  </h3>
                  <span className="text-xs text-[#10B981] font-semibold">تحكم كامل بالثواني المباشرة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Interval Selector with Custom Seconds Input */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <IoRepeatOutline size={15} className="text-[#10B981]" />
                        <span>الفاصل الزمني (المسافة بين كل ظهور)</span>
                      </label>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#10B981]/20 text-[#10B981] font-bold">
                        {formData.sidePopupIntervalSeconds ?? 45} ثانية
                      </span>
                    </div>

                    <select
                      value={formData.sidePopupIntervalSeconds ?? 45}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sidePopupIntervalSeconds: Number(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0a1424] border border-white/10 text-white text-xs font-semibold focus:border-[#10B981] focus:outline-none"
                    >
                      {SIDE_INTERVAL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400">أو حدد بالثواني:</span>
                      <input
                        type="number"
                        min="5"
                        max="3600"
                        step="5"
                        value={formData.sidePopupIntervalSeconds ?? 45}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            sidePopupIntervalSeconds: Math.max(5, Number(e.target.value) || 5),
                          }))
                        }
                        className="w-20 px-2 py-1 rounded-lg bg-[#070e1b] border border-white/15 text-[#10B981] text-xs font-mono font-bold text-center focus:border-[#10B981] focus:outline-none"
                      />
                      <span className="text-[11px] text-[#10B981] font-bold">ثانية</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      الفترة الهادئة بين اختفاء الـ Popup الحالي وظهور الـ Popup التالي
                    </p>
                  </div>

                  {/* Duration Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <IoTimeOutline size={15} className="text-[#FB8704]" />
                      مدة البقاء قبل الاختفاء
                    </label>
                    <select
                      value={formData.sidePopupDurationSeconds ?? 12}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sidePopupDurationSeconds: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0a1424] border border-white/10 text-white text-xs font-semibold focus:border-[#FB8704] focus:outline-none"
                    >
                      {SIDE_DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      كم ثانية يبقى الكارت ظاهراً قبل الاختفاء
                    </p>
                  </div>

                  {/* Initial Delay Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <IoPlayOutline size={15} className="text-[#0488F8]" />
                      أول ظهور عند دخول الموقع
                    </label>
                    <select
                      value={formData.sidePopupInitialDelaySeconds ?? 10}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sidePopupInitialDelaySeconds: Number(e.target.value) }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0a1424] border border-white/10 text-white text-xs font-semibold focus:border-[#0488F8] focus:outline-none"
                    >
                      {SIDE_DELAY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400">
                      الانتظار لأول مرة بعد تحميل الصفحة
                    </p>
                  </div>

                  {/* Position Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <IoSparklesOutline size={15} className="text-[#A855F7]" />
                      موقع الإشعار على الشاشة
                    </label>
                    <select
                      value={formData.sidePopupPosition || 'bottom-left'}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sidePopupPosition: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#0a1424] border border-white/10 text-white text-xs font-semibold focus:border-[#A855F7] focus:outline-none"
                    >
                      <option value="bottom-left">أسفل اليسار (Bottom Left)</option>
                      <option value="bottom-right">أسفل اليمين (Bottom Right)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      ركن الشاشة الذي ينزلق منه التوست
                    </p>
                  </div>
                </div>

                {/* Show Once vs Repeating Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-white">هل يظهر مرة واحدة فقط لكل زائر؟</span>{' '}
                    عند التفعيل، سيظهر Popup واحد لمرة واحدة بالجلسة ويتوقف. وعند إلغاء التفعيل يتكرر التدوير بين بطاقات الوسطاء دورياً حسب الفاصل الزمني المختار أعلاه.
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={Boolean(formData.sidePopupShowOnce)}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sidePopupShowOnce: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                  </label>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* MULTI-POPUP CARDS MANAGER (المطلوب: أكثر من Popup لأكثر من وسيط) */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <IoFlameOutline size={18} className="text-[#10B981]" />
                      <span>بطاقات النوافذ المنبثقة للوسطاء (Popups Cards List)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      أضف وحرر بطاقات Popup متعددة لكل وسيط، مع تخصيص نصوصه وروابطه والتبديل التلقائي بينهم
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] font-bold border border-[#10B981]/30">
                      {activeCardsCount} مفعل من إجمالي {(formData.popupCards || []).length}
                    </span>

                    <button
                      type="button"
                      onClick={handleStartCreateCard}
                      className="px-3.5 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#10B981]/20 cursor-pointer"
                    >
                      <IoAddOutline size={17} />
                      <span>إضافة بطاقة Popup جديدة</span>
                    </button>
                  </div>
                </div>

                {/* Inline Card Editor Drawer / Modal */}
                {editingCardId && editingCardData && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#091528] border-2 border-[#10B981] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-ping" />
                        <h4 className="text-sm font-bold text-white">
                          {editingCardData.titleAr ? `تعديل بطاقة: ${editingCardData.titleAr}` : 'إضافة بطاقة Popup جديدة'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadBrokerIntoEditing(editingCardData.brokerId || 'hfm')}
                          className="px-3 py-1 rounded-lg bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                          title="استيراد وتعبئة حقول البطاقة من بيانات الوسيط المختار"
                        >
                          <span>استيراد بيانات هذا الوسيط للحقول</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelEditCard}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                        >
                          <IoCloseOutline size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Broker Selector */}
                    <div className="p-3 rounded-xl bg-[#070e1b] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <span>الوسيط المرتبط بهذه البطاقة:</span>
                      </label>
                      <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
                        <select
                          value={editingCardData.brokerId || 'hfm'}
                          onChange={(e) => {
                            const newId = e.target.value;
                            handleLoadBrokerIntoEditing(newId);
                          }}
                          className="w-full px-3 py-1.5 rounded-xl bg-[#091528] border border-white/15 text-white text-xs font-bold focus:border-[#10B981] focus:outline-none"
                        >
                          {brokers.map((b) => (
                            <option key={b.id || b.brokerSlug} value={b.id || b.brokerSlug}>
                              {b.name} ({b.rating || 4.9} ★)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Content Fields */}
                    <div className="space-y-3.5">
                      {/* Badge & Rating */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-xs font-bold text-slate-300">شارة البطاقة العلوية (Top Badge)</label>
                          <input
                            type="text"
                            value={editingCardData.badgeAr || ''}
                            onChange={(e) =>
                              setEditingCardData((prev) => ({ ...prev, badgeAr: e.target.value }))
                            }
                            placeholder="شريك وساطة رسمي معتمد"
                            className="w-full px-3 py-2 rounded-xl bg-[#070e1b] border border-white/10 text-white text-xs font-semibold focus:border-[#10B981] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                            <IoStar className="text-yellow-400" size={13} />
                            التقييم بالنجوم (Rating)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="1"
                            max="5"
                            value={editingCardData.rating ?? 4.9}
                            onChange={(e) =>
                              setEditingCardData((prev) => ({ ...prev, rating: Number(e.target.value) }))
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#070e1b] border border-white/10 text-white text-xs font-bold focus:border-[#10B981] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Title & Subtitle */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300">اسم الوسيط / عنوان الإشعار</label>
                          <input
                            type="text"
                            value={editingCardData.titleAr || ''}
                            onChange={(e) =>
                              setEditingCardData((prev) => ({ ...prev, titleAr: e.target.value }))
                            }
                            placeholder="HFM (HF Markets)"
                            className="w-full px-3 py-2 rounded-xl bg-[#070e1b] border border-white/10 text-white text-xs font-bold focus:border-[#10B981] focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-300">الوصف الفرعي المختصر</label>
                          <input
                            type="text"
                            value={editingCardData.subtitleAr || ''}
                            onChange={(e) =>
                              setEditingCardData((prev) => ({ ...prev, subtitleAr: e.target.value }))
                            }
                            placeholder="وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية"
                            className="w-full px-3 py-2 rounded-xl bg-[#070e1b] border border-white/10 text-white text-xs font-semibold focus:border-[#10B981] focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Highlight Perks Box */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-yellow-300 flex items-center gap-1.5">
                          <IoFlameOutline size={15} />
                          نص العرض الترويجي المميز (Highlight Offer / Perks)
                        </label>
                        <textarea
                          rows={2}
                          value={editingCardData.highlightAr || ''}
                          onChange={(e) =>
                            setEditingCardData((prev) => ({ ...prev, highlightAr: e.target.value }))
                          }
                          placeholder="استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية"
                          className="w-full px-3 py-2 rounded-xl bg-[#070e1b] border border-white/10 text-white text-xs font-semibold focus:border-[#10B981] focus:outline-none resize-none leading-relaxed"
                        />
                      </div>

                      {/* Action Buttons: Live Account & Demo Account */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3 rounded-xl bg-[#070e1b] border border-white/10">
                        {/* Live Button */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                            <span>الزر الرئيسي (فتح حساب مباشر)</span>
                          </div>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editingCardData.liveBtnTextAr || ''}
                              onChange={(e) =>
                                setEditingCardData((prev) => ({ ...prev, liveBtnTextAr: e.target.value }))
                              }
                              placeholder="فتح حساب مباشر"
                              className="w-full px-3 py-1.5 rounded-lg bg-[#091528] border border-white/10 text-white text-xs font-semibold focus:border-[#10B981] focus:outline-none"
                            />
                            <input
                              type="text"
                              dir="ltr"
                              value={editingCardData.liveUrl || ''}
                              onChange={(e) =>
                                setEditingCardData((prev) => ({ ...prev, liveUrl: e.target.value }))
                              }
                              placeholder="https://... (رابط التوجيه)"
                              className="w-full px-3 py-1.5 rounded-lg bg-[#091528] border border-white/10 text-white text-xs font-mono focus:border-[#10B981] focus:outline-none text-left"
                            />
                          </div>
                        </div>

                        {/* Demo Button */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300">الزر الثانوي (حساب تجريبي)</span>
                            <label className="flex items-center gap-1 text-[11px] text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingCardData.showDemo !== false}
                                onChange={(e) =>
                                  setEditingCardData((prev) => ({ ...prev, showDemo: e.target.checked }))
                                }
                                className="rounded accent-[#10B981]"
                              />
                              <span>إظهار الزر</span>
                            </label>
                          </div>
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={editingCardData.demoBtnTextAr || ''}
                              onChange={(e) =>
                                setEditingCardData((prev) => ({ ...prev, demoBtnTextAr: e.target.value }))
                              }
                              placeholder="تجريبي"
                              className="w-full px-3 py-1.5 rounded-lg bg-[#091528] border border-white/10 text-white text-xs font-semibold focus:border-[#10B981] focus:outline-none"
                            />
                            <input
                              type="text"
                              dir="ltr"
                              value={editingCardData.demoUrl || ''}
                              onChange={(e) =>
                                setEditingCardData((prev) => ({ ...prev, demoUrl: e.target.value }))
                              }
                              placeholder="https://... (رابط الحساب التجريبي)"
                              className="w-full px-3 py-1.5 rounded-lg bg-[#091528] border border-white/10 text-white text-xs font-mono focus:border-[#10B981] focus:outline-none text-left"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Accent Color & Logo */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-2 p-3 rounded-xl bg-[#070e1b] border border-white/10">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <IoColorPaletteOutline size={15} className="text-[#10B981]" />
                            لون السمة والإشعاع
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {PRESET_ACCENT_COLORS.map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() =>
                                  setEditingCardData((prev) => ({ ...prev, accentColor: c.color }))
                                }
                                className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                                  editingCardData.accentColor === c.color
                                    ? 'scale-125 border-white shadow-lg'
                                    : 'border-transparent hover:scale-110'
                                }`}
                                style={{ backgroundColor: c.color }}
                                title={c.name}
                              />
                            ))}
                            <input
                              type="color"
                              value={editingCardData.accentColor || '#10B981'}
                              onChange={(e) =>
                                setEditingCardData((prev) => ({ ...prev, accentColor: e.target.value }))
                              }
                              className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 p-3 rounded-xl bg-[#070e1b] border border-white/10">
                          <label className="text-xs font-bold text-slate-300">مسار أو رابط الشعار (Logo)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={editingCardData.customLogo || ''}
                            onChange={(e) =>
                              setEditingCardData((prev) => ({ ...prev, customLogo: e.target.value }))
                            }
                            placeholder="/assets/Images/brokers/hfm.png"
                            className="w-full px-3 py-2 rounded-lg bg-[#091528] border border-white/10 text-white text-xs font-mono focus:border-[#10B981] focus:outline-none text-left"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Editor Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={handleCancelEditCard}
                        className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        إلغاء التعديل
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCard}
                        className="px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#0ea571] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#10B981]/25 cursor-pointer"
                      >
                        <IoCheckmarkOutline size={16} />
                        <span>تطبيق وحفظ البطاقة</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Cards List Display */}
                <div className="space-y-2.5">
                  {(formData.popupCards || []).map((card, idx) => {
                    const isCardActive = card.isActive !== false;
                    const cardColor = card.accentColor || '#10B981';
                    const isCurrentPreview = previewCardIndex === idx;

                    return (
                      <div
                        key={card.id || idx}
                        className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrentPreview
                            ? 'bg-[#10B981]/10 border-[#10B981] shadow-md shadow-[#10B981]/10'
                            : 'bg-[#0a1424] border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Left: Reorder & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Order Buttons */}
                          <div className="flex flex-col gap-1 items-center shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={(e) => handleMoveCard(idx, -1, e)}
                              className="w-6 h-6 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center disabled:opacity-20 cursor-pointer"
                              title="تحريك لأعلى"
                            >
                              <IoChevronUpOutline size={14} />
                            </button>
                            <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                            <button
                              type="button"
                              disabled={idx === (formData.popupCards || []).length - 1}
                              onClick={(e) => handleMoveCard(idx, 1, e)}
                              className="w-6 h-6 rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center disabled:opacity-20 cursor-pointer"
                              title="تحريك لأسفل"
                            >
                              <IoChevronDownOutline size={14} />
                            </button>
                          </div>

                          {/* Logo */}
                          <div
                            className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shrink-0 p-1.5 overflow-hidden border"
                            style={{ borderColor: cardColor }}
                          >
                            <Image
                              src={card.customLogo || '/assets/Images/brokers/hfm.png'}
                              alt={card.titleAr || 'Logo'}
                              width={40}
                              height={40}
                              className="object-contain"
                              unoptimized
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white truncate">{card.titleAr}</h4>
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                                style={{ backgroundColor: `${cardColor}20`, color: cardColor }}
                              >
                                {card.badgeAr || 'شريك معتمد'}
                              </span>
                              <div className="flex items-center gap-0.5 text-yellow-400 text-xs font-bold">
                                <IoStar size={11} />
                                <span>{card.rating || 4.9}</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5 max-w-md">
                              {card.highlightAr || card.subtitleAr}
                            </p>
                          </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          {/* Active Toggle */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleCardActive(card.id, e)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCardActive
                                ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isCardActive ? 'bg-[#10B981] animate-pulse' : 'bg-slate-500'
                              }`}
                            />
                            <span>{isCardActive ? 'مُفعل' : 'مُعطل'}</span>
                          </button>

                          {/* Preview in simulator */}
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewCardIndex(idx);
                              setPreviewAnimationKey((k) => k + 1);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                              isCurrentPreview
                                ? 'bg-white/20 text-white font-bold'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300'
                            }`}
                            title="عرض في صندوق المعاينة الحية"
                          >
                            <IoEyeOutline size={14} />
                            <span>معاينة</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleStartEditCard(card)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-[#0488F8]/20 hover:text-[#0488F8] text-slate-300 transition-all cursor-pointer"
                            title="تعديل محتوى البطاقة"
                          >
                            <IoPencilOutline size={15} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCard(card.id, e)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all cursor-pointer"
                            title="حذف البطاقة"
                          >
                            <IoTrashOutline size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════ */}
              {/* INTERACTIVE LIVE PREVIEW SIMULATOR                          */}
              {/* ══════════════════════════════════════════════════════════ */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        معاينة حية وتجربة تتابع ظهور الـ Popups (Live Simulator)
                      </h3>
                      <p className="text-xs text-slate-400">
                        معاينة البطاقة الحالية واختبار حركة الانتقال بين بطاقات الوسطاء
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Stepper between cards */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewCardIndex((prev) => (prev > 0 ? prev - 1 : cardsList.length - 1))
                        }
                        className="px-1.5 py-0.5 hover:text-[#10B981] cursor-pointer"
                        title="البطاقة السابقة"
                      >
                        <IoArrowForwardOutline size={13} />
                      </button>
                      <span className="text-[11px] font-bold text-slate-300">
                        {previewCardIndex + 1} / {cardsList.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewCardIndex((prev) => (prev + 1) % cardsList.length)}
                        className="px-1.5 py-0.5 hover:text-[#10B981] cursor-pointer"
                        title="البطاقة التالية"
                      >
                        <IoArrowBackOutline size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleTriggerTestAnimation}
                      className="px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#0ea571] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#10B981]/20 cursor-pointer"
                      title="تشغيل محاكاة حركة التوست والانتقال للبطاقة التالية"
                    >
                      <IoPlayOutline size={15} />
                      <span>تجربة انتقال الـ Popup للبطاقة التالية</span>
                    </button>

                    <a
                      href="https://fxengen.com?preview_side_popup=true"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/15 cursor-pointer"
                      title="فتح الموقع العام وتجربة ظهور التوست فوراً"
                    >
                      <IoOpenOutline size={14} />
                      <span>تجربة على الموقع</span>
                    </a>
                  </div>
                </div>

                {/* Animated Toast Card Simulation */}
                <div className="py-4 flex justify-center">
                  <div
                    key={previewAnimationKey}
                    style={{
                      width: '100%',
                      maxWidth: '24rem',
                      borderRadius: '1rem',
                      background: `radial-gradient(ellipse 90% 70% at 50% -10%, ${previewColor}35 0%, transparent 80%), linear-gradient(150deg, ${previewColor}20 0%, #06121f 50%, #02070f 100%)`,
                      border: `1.5px solid ${previewColor}`,
                      boxShadow: `0 20px 48px -8px rgba(0, 0, 0, 0.9), 0 0 32px ${previewColor}40`,
                      color: '#FFFFFF',
                      direction: 'rtl',
                      overflow: 'hidden',
                      willChange: 'transform, opacity, filter',
                      opacity: isTestExiting ? 0 : 1,
                      transform: isTestExiting
                        ? 'translateY(40px) scale(0.85)'
                        : 'translateY(0) scale(1)',
                      filter: isTestExiting ? 'blur(10px)' : 'none',
                      transition: isTestExiting
                        ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease'
                        : 'none',
                      animation: isTestExiting
                        ? 'fxTestToastExit 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        : 'fxTestToastEnter 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    }}
                  >
                    <style
                      dangerouslySetInnerHTML={{
                        __html: `
                      @keyframes fxTestToastEnter {
                        0% {
                          opacity: 0;
                          transform: translateY(35px) scale(0.9);
                          filter: blur(6px);
                        }
                        60% {
                          opacity: 1;
                          transform: translateY(-4px) scale(1.02);
                          filter: blur(0);
                        }
                        100% {
                          opacity: 1;
                          transform: translateY(0) scale(1);
                          filter: blur(0);
                        }
                      }
                      @keyframes fxTestToastExit {
                        0% {
                          opacity: 1;
                          transform: translateY(0) scale(1);
                          filter: blur(0);
                        }
                        20% {
                          opacity: 1;
                          transform: translateY(-5px) scale(1.02);
                          filter: blur(0);
                        }
                        100% {
                          opacity: 0;
                          transform: translateY(40px) scale(0.85);
                          filter: blur(10px);
                        }
                      }
                    `,
                      }}
                    />

                    {/* Top Bar */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem 0.35rem 0.85rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.6875rem' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: previewColor,
                            display: 'inline-block',
                            boxShadow: `0 0 8px ${previewColor}`,
                          }}
                        />
                        <span style={{ fontWeight: 800, color: previewColor, letterSpacing: '0.02em' }}>
                          {currentCard.badgeAr || 'شريك وساطة رسمي معتمد'}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#CBD5E1',
                        }}
                      >
                        <IoCloseOutline size={18} />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '0.75rem 0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                        {/* Logo */}
                        <div
                          style={{
                            position: 'relative',
                            width: '3.1rem',
                            height: '3.1rem',
                            borderRadius: '0.65rem',
                            overflow: 'hidden',
                            background: '#000000',
                            border: `1.5px solid ${previewColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            padding: '0.25rem',
                          }}
                        >
                          <Image
                            src={currentCard.customLogo || '/assets/Images/brokers/hfm.png'}
                            alt="Logo"
                            width={48}
                            height={48}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            unoptimized
                          />
                        </div>

                        {/* Title & Subtitle */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.4rem',
                            }}
                          >
                            <h4
                              style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: '#FFFFFF',
                                margin: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {currentCard.titleAr || 'HFM (HF Markets)'}
                            </h4>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.15rem',
                                color: '#F59E0B',
                                fontSize: '0.7rem',
                              }}
                            >
                              <IoStar size={11} />
                              <span style={{ fontWeight: 700 }}>{currentCard.rating || 4.9}</span>
                            </div>
                          </div>

                          <p
                            style={{
                              fontSize: '0.725rem',
                              color: '#94A3B8',
                              margin: '0.15rem 0 0 0',
                              lineHeight: 1.35,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {currentCard.subtitleAr || 'وسيط عالمي رائد حائز على أكثر من 60 جائزة دولية'}
                          </p>
                        </div>
                      </div>

                      {/* Highlight Perks Text Box */}
                      <div
                        style={{
                          padding: '0.45rem 0.65rem',
                          borderRadius: '0.5rem',
                          background: 'rgba(0, 0, 0, 0.35)',
                          border: `1px dashed ${previewColor}60`,
                          marginBottom: '0.65rem',
                        }}
                      >
                        <p
                          style={{
                            fontSize: '0.725rem',
                            color: '#F1F5F9',
                            margin: 0,
                            lineHeight: 1.4,
                            fontWeight: 600,
                          }}
                        >
                          {currentCard.highlightAr || 'استرداد كاش باك حتى $2 لكل لوت + بونص تداول 20% ووصول كامل لجميع كورسات الأكاديمية'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            padding: '0.55rem 0.85rem',
                            borderRadius: '0.55rem',
                            background: `linear-gradient(135deg, ${previewColor} 0%, ${previewColor}dd 100%)`,
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.775rem',
                            boxShadow: `0 4px 14px ${previewColor}50`,
                          }}
                        >
                          <span>{currentCard.liveBtnTextAr || 'فتح حساب مباشر'}</span>
                          <IoArrowBackOutline size={13} />
                        </div>

                        {currentCard.showDemo !== false && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.25rem',
                              padding: '0.55rem 0.75rem',
                              borderRadius: '0.55rem',
                              background: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid rgba(255, 255, 255, 0.14)',
                              color: '#CBD5E1',
                              fontWeight: 600,
                              fontSize: '0.725rem',
                            }}
                          >
                            <span>{currentCard.demoBtnTextAr || 'تجريبي'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Simulation */}
                    <div
                      style={{
                        height: '3px',
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.08)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: '75%',
                          background: `linear-gradient(90deg, ${previewColor}, #FB8704)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: CENTER MODAL POPUP                                      */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'centerModal' && (
            <div className="space-y-6">
              {/* Main Activation Toggle */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      formData.isEnabled ? 'bg-[#0488F8] animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <div>
                    <div className="text-sm font-bold text-white">
                      تفعيل ظهور النافذة المركزية الكبيرة في الموقع العام
                    </div>
                    <div className="text-xs text-slate-400">
                      نافذة مركزية منبثقة بحجم كامل لترويج عروض الشركاء الكبرى
                    </div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0488F8]"></div>
                </label>
              </div>

              {/* Show Once & Background Theme Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-white">
                      ظهور النافذة مرة واحدة فقط للزائر
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      تظهر مرة واحدة فقط في الجلسة وتتوقف بعدها تلقائياً
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showOnce !== false}
                      onChange={(e) => setFormData((prev) => ({ ...prev, showOnce: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0488F8]"></div>
                  </label>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <IoSparklesOutline size={16} className="text-[#0488F8]" />
                    لون وخلفية النافذة المنبثقة
                  </label>
                  <select
                    value={formData.modalBgTheme || 'broker_logo'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, modalBgTheme: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-xs focus:border-[#0488F8] focus:outline-none"
                  >
                    <option value="broker_logo">تلقائي بنفس لون لوجو البروكر (الموصى به)</option>
                    <option value="dark">النمط الداكن الكلاسيكي</option>
                  </select>
                </div>
              </div>

              {/* Timing & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <IoTimeOutline size={16} className="text-[#0488F8]" />
                    تكرار الظهور الدوري (Frequency)
                  </label>
                  <select
                    value={formData.intervalSeconds}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, intervalSeconds: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none"
                  >
                    {INTERVAL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">الافتراضي: كل 60 ثانية</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <IoTimeOutline size={16} className="text-[#10B981]" />
                    الظهور الأول عند دخول الموقع
                  </label>
                  <select
                    value={formData.initialDelaySeconds ?? 15}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, initialDelaySeconds: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#10B981] focus:outline-none"
                  >
                    {INITIAL_DELAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">الافتراضي: بعد 15 ثانية</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <IoRepeatOutline size={16} className="text-[#0488F8]" />
                    نمط الترويج (Display Mode)
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mode: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none"
                  >
                    <option value="rotate">تدوير تلقائي بين جميع الشركاء</option>
                    <option value="specific">تثبيت وسيط معين محدد</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {formData.mode === 'rotate' ? 'تدوير الشركاء بالتناوب' : 'تثبيت الوسيط المختار حصرياً'}
                  </p>
                </div>
              </div>

              {/* If Mode is Specific: Pick Broker */}
              {formData.mode === 'specific' && (
                <div className="p-4 rounded-xl bg-[#0488F8]/10 border border-[#0488F8]/25 space-y-2">
                  <label className="text-xs font-bold text-[#0488F8] flex items-center gap-1.5">
                    <IoFlameOutline size={16} />
                    اختر الوسيط المراد إبرازه في النافذة المركزية
                  </label>
                  <select
                    value={formData.selectedBrokerId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, selectedBrokerId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none"
                  >
                    {brokers.map((b) => (
                      <option key={b.id || b.brokerSlug} value={b.id || b.brokerSlug}>
                        {b.name} ({b.category === 'prop' ? 'شركة تمويل' : 'وسيط فوركس'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Texts & Headlines */}
              <div className="space-y-4 pt-2 border-t border-white/10">
                <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-[#0488F8] rounded-full"></span>
                  تخصيص نصوص النافذة المركزية
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">العنوان الترويجي (عربي)</label>
                    <input
                      type="text"
                      value={formData.headlineAr}
                      onChange={(e) => setFormData((prev) => ({ ...prev, headlineAr: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5" dir="ltr">
                    <label className="text-xs font-semibold text-slate-300 text-right block">Headline (English)</label>
                    <input
                      type="text"
                      value={formData.headlineEn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, headlineEn: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">الوصف الفرعي (عربي)</label>
                    <textarea
                      rows={2}
                      value={formData.subheadlineAr}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subheadlineAr: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none resize-none"
                    />
                  </div>

                  <div className="space-y-1.5" dir="ltr">
                    <label className="text-xs font-semibold text-slate-300 text-right block">Subheadline (English)</label>
                    <textarea
                      rows={2}
                      value={formData.subheadlineEn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subheadlineEn: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none resize-none text-left"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">نص زر الإجراء المباشر (عربي)</label>
                    <input
                      type="text"
                      value={formData.ctaTextAr}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ctaTextAr: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">شارة القمة التوثيقية (عربي)</label>
                    <input
                      type="text"
                      value={formData.badgeAr}
                      onChange={(e) => setFormData((prev) => ({ ...prev, badgeAr: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a1424] border border-white/10 text-white text-sm focus:border-[#0488F8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Form Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <a
                href="https://fxengen.com?preview_side_popup=true"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/30 text-[#10B981] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="فتح الموقع العام وتجربة ظهور إشعار التوست فوراً"
              >
                <IoOpenOutline size={15} />
                <span>تجربة إشعار التوست على الموقع</span>
              </a>

              <a
                href="https://fxengen.com?preview_broker_popup=true"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="فتح الموقع العام وتجربة النافذة المركزية"
              >
                <IoOpenOutline size={15} />
                <span>تجربة النافذة المركزية</span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#10B981] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#10B981]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <IoSaveOutline size={18} />
                <span>{saving ? 'جاري الحفظ والمزامنة...' : 'حفظ الإعدادات والمزامنة'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
