'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  IoCopyOutline,
  IoOpenOutline,
  IoShieldCheckmarkOutline,
  IoRibbonOutline,
  IoTrendingUpOutline,
  IoGridOutline,
  IoListOutline,
  IoSparklesOutline,
  IoTimeOutline,
  IoRepeatOutline,
  IoFlameOutline,
  IoCloudUploadOutline,
  IoFlashOutline,
  IoImageOutline,
} from 'react-icons/io5';
import {
  getBrokersList,
  createBroker,
  updateBroker,
  deleteBroker,
  resetBrokersToDefault,
  getBrokerPopupConfig,
  updateBrokerPopupConfig,
} from '../../services/brokerService';
import { translateText } from '../../services/translationService';
import {
  uploadFileDirectToStorage,
  convertImageUrlToWebp,
} from '../../services/storageService';
import BrokerPopupControlModal from '../../components/brokers/BrokerPopupControlModal';

export default function BrokersManagementPage() {
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'branding' | 'links' | 'specs' | 'features'
  const [copiedCode, setCopiedCode] = useState(null);

  // Broker Promotional Popup Modal State
  const [popupConfig, setPopupConfig] = useState(null);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [togglingPopup, setTogglingPopup] = useState(false);

  // Auto-translation state
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [translatingFields, setTranslatingFields] = useState({});
  const [translatingAll, setTranslatingAll] = useState(false);
  const brokerDebounceTimers = useRef({});

  const handleBrokerArabicChange = (arField, enField, val) => {
    setFormData((prev) => ({ ...prev, [arField]: val }));
    if (!autoTranslateEnabled || !val || !val.trim()) return;

    if (brokerDebounceTimers.current[enField]) {
      clearTimeout(brokerDebounceTimers.current[enField]);
    }

    brokerDebounceTimers.current[enField] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [enField]: true }));
      try {
        const trans = await translateText(val);
        if (trans) {
          setFormData((prev) => ({ ...prev, [enField]: trans }));
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [enField]: false }));
      }
    }, 750);
  };

  const handleBrokerManualTranslate = async (arText, enField) => {
    if (!arText || !arText.trim()) {
      toast.warn('يرجى كتابة النص العربي أولاً');
      return;
    }
    setTranslatingFields((prev) => ({ ...prev, [enField]: true }));
    try {
      const trans = await translateText(arText);
      if (trans) {
        setFormData((prev) => ({ ...prev, [enField]: trans }));
        toast.success('تمت الترجمة بنجاح!');
      }
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [enField]: false }));
    }
  };

  // Spec auto-translation handler (debounced)
  const handleSpecArabicChange = (index, val) => {
    setFormData((prev) => {
      const newSpecs = (prev.specs || []).map((s, i) => (i === index ? { ...s, valueAr: val } : s));
      return { ...prev, specs: newSpecs };
    });

    if (!autoTranslateEnabled || !val || !val.trim()) return;

    const key = `spec_${index}`;
    if (brokerDebounceTimers.current[key]) {
      clearTimeout(brokerDebounceTimers.current[key]);
    }

    brokerDebounceTimers.current[key] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [key]: true }));
      try {
        const trans = await translateText(val);
        if (trans) {
          setFormData((prev) => {
            const newSpecs = (prev.specs || []).map((s, i) => (i === index ? { ...s, valueEn: trans } : s));
            return { ...prev, specs: newSpecs };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [key]: false }));
      }
    }, 750);
  };

  // Spec manual translate
  const handleSpecManualTranslate = async (index) => {
    const spec = formData.specs?.[index];
    if (!spec?.valueAr || !spec.valueAr.trim()) {
      toast.warn('يرجى كتابة القيمة بالعربية أولاً');
      return;
    }
    const key = `spec_${index}`;
    setTranslatingFields((prev) => ({ ...prev, [key]: true }));
    try {
      const trans = await translateText(spec.valueAr);
      if (trans) {
        setFormData((prev) => {
          const newSpecs = (prev.specs || []).map((s, i) => (i === index ? { ...s, valueEn: trans } : s));
          return { ...prev, specs: newSpecs };
        });
        toast.success('تمت ترجمة الخاصية بنجاح!');
      }
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Feature auto-translation handler (debounced)
  const handleFeatureArabicChange = (index, val) => {
    setFormData((prev) => {
      const newFeaturesAr = [...(prev.featuresAr || [])];
      newFeaturesAr[index] = val;
      return { ...prev, featuresAr: newFeaturesAr };
    });

    if (!autoTranslateEnabled || !val || !val.trim()) return;

    const key = `feature_${index}`;
    if (brokerDebounceTimers.current[key]) {
      clearTimeout(brokerDebounceTimers.current[key]);
    }

    brokerDebounceTimers.current[key] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [key]: true }));
      try {
        const trans = await translateText(val);
        if (trans) {
          setFormData((prev) => {
            const newFeaturesEn = [...(prev.featuresEn || [])];
            newFeaturesEn[index] = trans;
            return { ...prev, featuresEn: newFeaturesEn };
          });
        }
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [key]: false }));
      }
    }, 750);
  };

  // Feature manual translate
  const handleFeatureManualTranslate = async (index) => {
    const val = formData.featuresAr?.[index];
    if (!val || !val.trim()) {
      toast.warn('يرجى كتابة الميزة بالعربية أولاً');
      return;
    }
    const key = `feature_${index}`;
    setTranslatingFields((prev) => ({ ...prev, [key]: true }));
    try {
      const trans = await translateText(val);
      if (trans) {
        setFormData((prev) => {
          const newFeaturesEn = [...(prev.featuresEn || [])];
          newFeaturesEn[index] = trans;
          return { ...prev, featuresEn: newFeaturesEn };
        });
        toast.success('تمت ترجمة الميزة بنجاح!');
      }
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Master Translate All Broker Fields to English
  const handleTranslateAllBrokerFields = async () => {
    setTranslatingAll(true);
    const toastId = toast.loading('جاري ترجمة كافة بيانات الوسيط إلى الإنجليزية تلقائياً...');

    try {
      const promises = [];
      const updates = {};

      if (formData.badgeAr?.trim()) {
        promises.push(
          translateText(formData.badgeAr).then((res) => {
            if (res) updates.badgeEn = res;
          })
        );
      }

      if (formData.descriptionAr?.trim()) {
        promises.push(
          translateText(formData.descriptionAr).then((res) => {
            if (res) updates.descriptionEn = res;
          })
        );
      }

      if (formData.clientsCount?.trim()) {
        promises.push(
          translateText(formData.clientsCount).then((res) => {
            if (res) updates.clientsCountEn = res;
          })
        );
      }

      if (formData.fxenginPerksAr?.trim()) {
        promises.push(
          translateText(formData.fxenginPerksAr).then((res) => {
            if (res) updates.fxenginPerksEn = res;
          })
        );
      }

      const newSpecs = formData.specs ? formData.specs.map((s) => ({ ...s })) : [];
      if (newSpecs.length > 0) {
        newSpecs.forEach((spec, idx) => {
          if (spec.valueAr?.trim()) {
            promises.push(
              translateText(spec.valueAr).then((res) => {
                if (res) newSpecs[idx].valueEn = res;
              })
            );
          }
        });
      }

      const newFeaturesEn = formData.featuresEn ? [...formData.featuresEn] : [];
      if (formData.featuresAr?.length > 0) {
        formData.featuresAr.forEach((feat, idx) => {
          if (feat?.trim()) {
            promises.push(
              translateText(feat).then((res) => {
                if (res) newFeaturesEn[idx] = res;
              })
            );
          }
        });
      }

      await Promise.all(promises);

      setFormData((prev) => ({
        ...prev,
        ...updates,
        specs: newSpecs.length > 0 ? newSpecs : prev.specs,
        featuresEn: newFeaturesEn.length > 0 ? newFeaturesEn : prev.featuresEn,
      }));

      toast.update(toastId, {
        render: 'تمت ترجمة كافة بيانات الوسيط بنجاح إلى الإنجليزية! ✨',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error translating all broker fields:', error);
      toast.update(toastId, {
        render: 'حدث خطأ أثناء الترجمة الشاملة',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setTranslatingAll(false);
    }
  };

  // Form State
  const initialFormState = {
    id: '',
    name: '',
    category: 'forex',
    categoryLabelAr: 'وسيط فوركس وعقود فروقات مرخص عالمياً',
    categoryLabelEn: 'Multi-Regulated Global Forex & CFD Broker',
    badgeAr: 'الأكثر موثوقية عالمياً • فئة أولى Tier-1',
    badgeEn: 'Most Trusted Globally • Tier-1 Regulated',
    badgeColor: '#10B981',
    logo: '/assets/Images/brokers/xm.webp',
    logoBg: '#000000',
    rating: 4.95,
    clientsCount: '100K+ متداول',
    clientsCountEn: '100K+ Active Traders',
    accentColor: '#10B981',
    glowBorder: 'rgba(16, 185, 129, 0.25)',
    descriptionAr: '',
    descriptionEn: '',
    specs: [
      { labelAr: 'الحد الأدنى للإيداع', labelEn: 'Min Deposit', valueAr: '$10 فقط', valueEn: '$10 Only' },
      { labelAr: 'أقصى رافعة مالية', labelEn: 'Max Leverage', valueAr: 'تصل إلى 1:1000', valueEn: 'Up to 1:1000' },
      { labelAr: 'السبريد', labelEn: 'Spread', valueAr: 'من 0.0 نقطة', valueEn: 'From 0.0 pips' },
      { labelAr: 'المنصات', labelEn: 'Platforms', valueAr: 'MT4, MT5', valueEn: 'MT4, MT5' },
      { labelAr: 'الحساب الإسلامي', labelEn: 'Islamic Account', valueAr: 'متوفر 100% (Swap-Free)', valueEn: '100% Swap-Free Available' },
      { labelAr: 'التراخيص الرقابية', labelEn: 'Regulations', valueAr: 'FCA, CySEC, ASIC', valueEn: 'FCA, CySEC, ASIC' },
    ],
    featuresAr: [
      'بونص ترحيبي مضاعف للإيداع مع سحب فوري',
      'سحب وإيداع فوري بدون أي رسوم عبر البطاقات والمحافظ الرقمية',
      'حسابات إسلامية خالية تماماً من الفوائد الربوية ورسوم التبييت',
      'خادم VPS مجاني لأصحاب التداول الآلي والإكسبيرتات',
    ],
    featuresEn: [
      'Welcome Deposit Bonus with instant withdrawal processing',
      'Instant zero-fee deposits & withdrawals via Cards & Crypto',
      'Fully certified swap-free Islamic accounts',
      'Free VPS hosting for algorithmic and EA traders',
    ],
    couponCode: '',
    fxenginPerksAr: 'بونص إيداع إضافي + إشارات وتوصيات VIP مجانية فور الإيداع',
    fxenginPerksEn: 'Additional Deposit Bonus + Free Lifetime VIP Signals Channel access',
    liveUrl: 'https://',
    demoUrl: 'https://',
    status: 'ACTIVE',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Logo Upload & WebP Conversion States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [convertingLogo, setConvertingLogo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverLogo, setDragOverLogo] = useState(false);
  const logoFileInputRef = useRef(null);

  // Upload logo file from user's device and auto-convert to WebP
  const handleLogoFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.match(/\.(png|jpe?g|webp|svg|gif|avif|bmp|tiff)$/i)) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WEBP, ...etc)');
      return;
    }

    setUploadingLogo(true);
    setUploadProgress(0);
    const toastId = toast.loading('جاري رفع الشعار وتحويله تلقائياً إلى صيغة WebP...');

    try {
      const res = await uploadFileDirectToStorage(file, {
        folder: 'brokers',
        onProgress: (p) => setUploadProgress(p),
      });

      if (res.ok && res.fileUrl) {
        setFormData((prev) => ({ ...prev, logo: res.fileUrl }));
        toast.update(toastId, {
          render: 'تم رفع الشعار وتحويله بنجاح إلى صيغة WebP فائقة الجودة! 🚀',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: res.error || 'فشل رفع الشعار',
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (err) {
      toast.update(toastId, {
        render: err.message || 'حدث خطأ أثناء رفع الشعار',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setUploadingLogo(false);
      setUploadProgress(0);
    }
  };

  // Convert existing or pasted URL/path to WebP
  const handleConvertLogoUrlToWebp = async (urlToConvert) => {
    const targetUrl = urlToConvert || formData.logo;
    if (!targetUrl || !targetUrl.trim()) {
      toast.warn('يرجى إدخال مسار أو رابط الشعار أولاً');
      return;
    }

    setConvertingLogo(true);
    const toastId = toast.loading('جاري جلب الصورة وتحويلها إلى صيغة WebP...');

    try {
      const res = await convertImageUrlToWebp(targetUrl.trim(), { folder: 'brokers' });

      if (res.ok && res.fileUrl) {
        setFormData((prev) => ({ ...prev, logo: res.fileUrl }));
        toast.update(toastId, {
          render: 'تم تحويل الشعار إلى صيغة WebP وحفظه بنجاح! ⚡',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.update(toastId, {
          render: res.error || 'تعذر تحويل الصورة إلى WebP',
          type: 'error',
          isLoading: false,
          autoClose: 4000,
        });
      }
    } catch (err) {
      toast.update(toastId, {
        render: err.message || 'حدث خطأ أثناء تحويل الصورة',
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setConvertingLogo(false);
    }
  };

  // Load Brokers Data & Popup Config
  const loadData = async () => {
    setLoading(true);
    try {
      const [data, pRes] = await Promise.all([
        getBrokersList(),
        getBrokerPopupConfig(),
      ]);
      setBrokers(data);
      if (pRes?.config) {
        setPopupConfig(pRes.config);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحميل بيانات الوسطاء');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Quick Toggle Popup Enabled/Disabled
  const handleTogglePopupFast = async () => {
    if (!popupConfig || togglingPopup) return;
    setTogglingPopup(true);
    const newEnabled = !popupConfig.isEnabled;
    const updated = { ...popupConfig, isEnabled: newEnabled };
    // Optimistic UI update
    setPopupConfig(updated);
    try {
      const res = await updateBrokerPopupConfig(updated);
      if (res.success) {
        toast.success(
          newEnabled
            ? `تم تفعيل النافذة الترويجية المنبثقة (كل ${popupConfig.intervalSeconds || 60} ثانية)`
            : 'تم تعطيل النافذة المنبثقة الترويجية بالموقع'
        );
      } else {
        setPopupConfig(popupConfig);
        toast.error('تعذر تحديث حالة النافذة المنبثقة');
      }
    } catch {
      setPopupConfig(popupConfig);
      toast.error('حدث خطأ أثناء الاتصال');
    } finally {
      setTogglingPopup(false);
    }
  };

  // Filtered Brokers
  const filteredBrokers = brokers.filter((broker) => {
    const matchesSearch =
      !searchTerm ||
      broker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.couponCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.badgeAr?.includes(searchTerm);

    const matchesCategory =
      categoryFilter === 'ALL' || broker.category === categoryFilter;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && broker.status !== 'INACTIVE') ||
      (statusFilter === 'INACTIVE' && broker.status === 'INACTIVE');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Action: Open Add Modal
  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData({
      ...initialFormState,
      id: `broker-${Date.now().toString().slice(-4)}`,
    });
    setModalTab('basic');
    setIsModalOpen(true);
  };

  // Action: Open Edit Modal
  const handleOpenEdit = (broker) => {
    setModalMode('edit');
    setFormData({
      ...initialFormState,
      ...broker,
      specs: Array.isArray(broker.specs) && broker.specs.length > 0 ? broker.specs : initialFormState.specs,
      featuresAr: Array.isArray(broker.featuresAr) ? broker.featuresAr : initialFormState.featuresAr,
      featuresEn: Array.isArray(broker.featuresEn) ? broker.featuresEn : initialFormState.featuresEn,
    });
    setModalTab('basic');
    setIsModalOpen(true);
  };

  // Action: Toggle Active Status
  const handleToggleStatus = async (broker) => {
    const newStatus = broker.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const updated = { ...broker, status: newStatus };
    const res = await updateBroker(updated);
    if (res.success) {
      setBrokers((prev) => prev.map((b) => (b.id === broker.id ? updated : b)));
      toast.success(
        newStatus === 'ACTIVE'
          ? `تم تفعيل الوسيط ${broker.name} بنجاح`
          : `تم تعطيل الوسيط ${broker.name} مؤقتاً`
      );
    } else {
      toast.error('تعذر تحديث حالة الوسيط');
    }
  };

  // Action: Delete Broker
  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الوسيط (${name})؟`)) {
      return;
    }
    const res = await deleteBroker(id);
    if (res.success) {
      setBrokers((prev) => prev.filter((b) => b.id !== id));
      toast.success(`تم حذف الوسيط ${name} بنجاح`);
    } else {
      toast.error('تعذر حذف الوسيط');
    }
  };

  // Action: Reset to Defaults
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'تحذير: سيتم استعادة قائمة الوسطاء الافتراضية الخمسة (XM, YWO, PropXP, MultiBank, HFM). هل تود المتابعة؟'
      )
    ) {
      return;
    }
    const res = await resetBrokersToDefault();
    if (res.success) {
      setBrokers(res.data);
      toast.success('تمت استعادة الوسطاء الافتراضيين بنجاح ومزامنتهم مع الموقع العام');
    } else {
      toast.error('فشلت عملية استعادة الوسطاء الافتراضيين');
    }
  };

  // Action: Save Form
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.warn('يرجى كتابة اسم الوسيط');
      return;
    }

    let finalData = { ...formData };

    // Auto-convert logo to WebP if user provided a non-webp URL/path
    if (finalData.logo && typeof finalData.logo === 'string') {
      const trimmedLogo = finalData.logo.trim();
      const isWebP = trimmedLogo.toLowerCase().endsWith('.webp');
      if (!isWebP && (trimmedLogo.startsWith('http') || trimmedLogo.startsWith('/') || trimmedLogo.startsWith('data:'))) {
        try {
          const convRes = await convertImageUrlToWebp(trimmedLogo, { folder: 'brokers' });
          if (convRes.ok && convRes.fileUrl) {
            finalData.logo = convRes.fileUrl;
            setFormData((prev) => ({ ...prev, logo: convRes.fileUrl }));
          }
        } catch (e) {
          console.warn('Auto convert on save error:', e);
        }
      }
    }

    if (modalMode === 'add') {
      const res = await createBroker(finalData);
      if (res.success) {
        setBrokers((prev) => [...prev, res.data]);
        toast.success(`تمت إضافة الوسيط (${finalData.name}) بنجاح!`);
        setIsModalOpen(false);
      } else {
        toast.error('حدث خطأ أثناء إضافة الوسيط');
      }
    } else {
      const res = await updateBroker(finalData);
      if (res.success) {
        setBrokers((prev) =>
          prev.map((b) => (b.id === finalData.id ? { ...b, ...finalData } : b))
        );
        toast.success(`تم حفظ تعديلات الوسيط (${finalData.name}) بنجاح!`);
        setIsModalOpen(false);
      } else {
        toast.error('حدث خطأ أثناء حفظ التعديلات');
      }
    }
  };

  // Copy Coupon Quick
  const copyCoupon = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.info(`تم نسخ الكوبون: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Stats Calculations
  const totalBrokers = brokers.length;
  const forexCount = brokers.filter((b) => b.category === 'forex').length;
  const propCount = brokers.filter((b) => b.category === 'prop').length;
  const activeCount = brokers.filter((b) => b.status !== 'INACTIVE').length;

  return (
    <div className="flex flex-col w-full space-y-space-lg text-on-surface">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <div className="text-telemetry-micro text-primary font-bold tracking-wider uppercase mb-1 flex items-center gap-2">
            <span>FXENGIN // BROKERS & AFFILIATE ENGINE V3.4 •</span>
            <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse"></span>
            <span className="text-bullish-up text-[10px]">LIVE SYNC</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-text-primary font-bold">
            إدارة الوسطاء وشركاء التداول (Brokers Management)
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            إضافة وتعديل وحذف بيانات وسطاء الفوركس وشركات التمويل المعروضة في صفحة{' '}
            <code className="text-primary bg-surface-elevated px-1.5 py-0.5 rounded text-xs">/open-account</code> والموقع العام
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          {/* Public Page Preview */}
          <a
            href="http://localhost:3000/open-account"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-elevated border border-border-structural text-text-secondary hover:text-text-primary hover:border-primary text-body-sm font-semibold transition-all"
            title="فتح صفحة فتح الحساب العامة في تبويب جديد للمعاينة"
          >
            <IoOpenOutline className="text-base text-primary" />
            <span>معاينة الصفحة العامة</span>
          </a>

          {/* Reset Defaults */}
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-elevated border border-border-structural text-text-muted hover:text-rose-400 hover:border-rose-400/40 text-body-sm font-semibold transition-all cursor-pointer"
            title="استعادة الوسطاء الافتراضيين الـ 5"
          >
            <IoRefreshOutline className="text-base" />
            <span>استعادة الافتراضيات</span>
          </button>

          {/* Add Broker Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-body-sm font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <IoAddCircleOutline className="text-lg" />
            <span>إضافة وسيط جديد</span>
          </button>
        </div>
      </div>

      {/* 1.5. Broker Promotional Popup Master Control Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container via-surface-elevated to-surface-container border-2 border-primary/30 shadow-xl p-5 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Info Side */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-2xl flex-shrink-0 shadow-lg shadow-primary/20">
              <IoSparklesOutline />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base font-bold text-text-primary">
                  النافذة الترويجية المنبثقة للشركاء (Periodic Broker Partners Promo Popup)
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    popupConfig?.isEnabled
                      ? 'bg-bullish-up/15 text-bullish-up border border-bullish-up/30'
                      : 'bg-surface-border text-text-muted border border-surface-border'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      popupConfig?.isEnabled ? 'bg-bullish-up animate-pulse' : 'bg-text-muted'
                    }`}
                  />
                  <span>
                    {popupConfig?.isEnabled
                      ? `نشطة • تظهر كل ${popupConfig?.intervalSeconds || 60} ثانية`
                      : 'متوقفة حالياً'}
                  </span>
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-base border border-surface-border text-text-secondary">
                  {popupConfig?.mode === 'rotate'
                    ? 'تدوير تلقائي بين جميع الشركاء'
                    : `وسيط مخصص: ${
                        brokers.find((b) => b.id === popupConfig?.selectedBrokerId)?.name || 'XM Global'
                      }`}
                </span>
              </div>

              <p className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                نافذة فاخرة تظهر لزوار الموقع دورياً كل دقيقة للترويج لشركاء الوساطة وعروضهم الحصرية (بونص إيداع 100%، رافعة مالية، سبريد خام، كود الشريك، وحسابات إسلامية) مع إمكانية فتح الحساب الحقيقي أو التجريبي مباشرة.
              </p>
            </div>
          </div>

          {/* Quick Actions & Toggle */}
          <div className="flex items-center gap-3 self-end lg:self-center flex-wrap">
            {/* Quick Toggle Switch */}
            <button
              onClick={handleTogglePopupFast}
              disabled={togglingPopup}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                popupConfig?.isEnabled
                  ? 'bg-bullish-up/15 hover:bg-bullish-up/25 text-bullish-up border border-bullish-up/40'
                  : 'bg-surface-elevated hover:bg-surface-border text-text-muted border border-surface-border'
              }`}
              title="تشغيل أو إيقاف سريع للنافذة المنبثقة"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  popupConfig?.isEnabled ? 'bg-bullish-up animate-pulse' : 'bg-text-muted'
                }`}
              />
              <span>{popupConfig?.isEnabled ? 'النافذة مفعلة' : 'النافذة معطلة'}</span>
            </button>

            {/* Customize Settings Button */}
            <button
              onClick={() => setIsPopupModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              <IoSparklesOutline className="text-sm" />
              <span>تخصيص الفاصل الزمني والعروض</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Telemetry Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        {/* Stat 1 */}
        <div className="bg-surface-container p-space-md rounded-xl border border-border-structural/40 flex items-center justify-between">
          <div>
            <span className="text-text-muted text-telemetry-micro uppercase font-bold">
              إجمالي الشركاء
            </span>
            <div className="text-2xl font-bold text-text-primary font-telemetry-stat mt-1">
              {totalBrokers}
            </div>
            <span className="text-telemetry-micro text-primary">وسطاء وشركات مسجلة</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl">
            <IoShieldCheckmarkOutline />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-surface-container p-space-md rounded-xl border border-border-structural/40 flex items-center justify-between">
          <div>
            <span className="text-text-muted text-telemetry-micro uppercase font-bold">
              وسطاء الفوركس والسلع
            </span>
            <div className="text-2xl font-bold text-bullish-up font-telemetry-stat mt-1">
              {forexCount}
            </div>
            <span className="text-telemetry-micro text-bullish-up">مرخصين دولياً (Tier-1)</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-bullish-up/10 border border-bullish-up/20 flex items-center justify-center text-bullish-up text-2xl">
            <IoTrendingUpOutline />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-surface-container p-space-md rounded-xl border border-border-structural/40 flex items-center justify-between">
          <div>
            <span className="text-text-muted text-telemetry-micro uppercase font-bold">
              شركات التمويل (Prop)
            </span>
            <div className="text-2xl font-bold text-accent font-telemetry-stat mt-1">
              {propCount}
            </div>
            <span className="text-telemetry-micro text-accent">تمويل المتداولين المحترفين</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl">
            <IoRibbonOutline />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-surface-container p-space-md rounded-xl border border-border-structural/40 flex items-center justify-between">
          <div>
            <span className="text-text-muted text-telemetry-micro uppercase font-bold">
              الوسطاء النشطون
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-telemetry-stat mt-1">
              {activeCount} / {totalBrokers}
            </div>
            <span className="text-telemetry-micro text-emerald-400">معروضون في الصفحة العامة</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-2xl">
            <IoCheckmarkCircleOutline />
          </div>
        </div>
      </div>

      {/* 3. Search and Filtering Bar */}
      <div className="bg-surface-container p-space-md rounded-xl border border-border-structural/40 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <IoSearchOutline className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted text-lg pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الوسيط، الكود، أو الترخيص..."
            className="w-full h-10 pr-10 pl-4 rounded-xl bg-surface-elevated border border-border-structural text-text-primary placeholder:text-text-muted outline-none focus:border-primary text-body-sm"
          />
        </div>

        {/* Filter Buttons & View Mode */}
        <div className="flex items-center gap-space-sm flex-wrap">
          {/* Category Tabs */}
          <div className="inline-flex bg-surface-elevated p-1 rounded-xl border border-border-structural">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'ALL'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              الكل ({brokers.length})
            </button>
            <button
              onClick={() => setCategoryFilter('forex')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'forex'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              فوركس ({forexCount})
            </button>
            <button
              onClick={() => setCategoryFilter('prop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === 'prop'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              تمويل ({propCount})
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-secondary text-xs outline-none cursor-pointer"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">النشطة فقط</option>
            <option value="INACTIVE">المعطلة فقط</option>
          </select>

          {/* View Toggle */}
          <div className="inline-flex bg-surface-elevated p-1 rounded-xl border border-border-structural">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="عرض البطاقات"
            >
              <IoGridOutline />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'
              }`}
              title="عرض الجدول"
            >
              <IoListOutline />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Brokers Content (Grid or Table) */}
      {loading ? (
        <div className="p-12 text-center text-text-muted bg-surface-container rounded-xl border border-border-structural/40">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
          <div>جاري تحميل بيانات الوسطاء ومزامنتها...</div>
        </div>
      ) : filteredBrokers.length === 0 ? (
        <div className="p-12 text-center text-text-muted bg-surface-container rounded-xl border border-border-structural/40">
          <IoShieldCheckmarkOutline className="text-4xl mx-auto text-text-muted mb-2" />
          <div className="text-base font-bold text-text-primary mb-1">لا توجد بيانات مطابقة</div>
          <p className="text-body-sm text-text-secondary">
            لم يتم العثور على وسطاء يطابقون شروط البحث أو الفلترة المحددة.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARDS VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {filteredBrokers.map((broker) => {
            const isActive = broker.status !== 'INACTIVE';
            return (
              <div
                key={broker.id}
                className="bg-surface-container rounded-2xl border border-border-structural/50 overflow-hidden shadow-lg hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                {/* Accent Top Bar */}
                <div
                  style={{
                    height: '4px',
                    background: broker.accentColor || '#0488F8',
                  }}
                />

                <div className="p-5 space-y-4 flex-1">
                  {/* Card Header: Logo & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ background: broker.logoBg || '#000000' }}
                        className="w-16 h-12 rounded-xl border border-border-structural flex items-center justify-center p-1.5 overflow-hidden shrink-0"
                      >
                        <img
                          src={broker.logo}
                          alt={broker.name}
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/Images/brokers/xm.webp';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-base flex items-center gap-1.5">
                          <span>{broker.name}</span>
                          <span className="text-telemetry-micro text-primary font-mono text-xs">
                            ({broker.id})
                          </span>
                        </h3>
                        <div className="text-xs text-text-muted mt-0.5">
                          {broker.category === 'prop' ? 'شركة تمويل متداولين' : 'وسيط فوركس وعقود فروقات'}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <button
                      onClick={() => handleToggleStatus(broker)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                      }`}
                      title="انقر للتبديل بين التفعيل والتعطيل"
                    >
                      {isActive ? '● نشط' : '○ معطل'}
                    </button>
                  </div>

                  {/* Trust Badge */}
                  <div className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-surface-elevated text-primary border border-border-structural">
                    {broker.badgeAr || broker.badgeEn}
                  </div>

                  {/* Specs Quick Pill */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-surface-elevated/60 p-2.5 rounded-xl border border-border-structural/30">
                    <div>
                      <span className="text-text-muted block text-[10px]">الحد الأدنى</span>
                      <span className="font-bold text-text-primary">
                        {broker.specs?.[0]?.valueAr || '$10'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px]">الرافعة</span>
                      <span className="font-bold text-text-primary">
                        {broker.specs?.[1]?.valueAr || '1:1000'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px]">السبريد</span>
                      <span className="font-bold text-bullish-up">
                        {broker.specs?.[2]?.valueAr || '0.0 pips'}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px]">التقييم</span>
                      <span className="font-bold text-accent">★ {broker.rating || 4.9}</span>
                    </div>
                  </div>

                  {/* Partner Code & Perk Box */}
                  <div className="bg-surface-elevated p-3 rounded-xl border border-primary/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-primary font-bold">كود الشريك / الكوبون:</span>
                      {broker.couponCode ? (
                        <button
                          onClick={() => copyCoupon(broker.couponCode)}
                          className="flex items-center gap-1 font-mono font-bold text-white bg-primary/20 px-2 py-0.5 rounded border border-primary/30 hover:bg-primary/30 cursor-pointer"
                        >
                          <IoCopyOutline />
                          <span>{broker.couponCode}</span>
                        </button>
                      ) : (
                        <span className="text-text-muted">مدمج بالرابط</span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {broker.fxenginPerksAr || 'مزايا حصرية لعملاء FXENGIN'}
                    </p>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-surface-elevated border-t border-border-structural/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(broker)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container border border-border-structural text-text-primary hover:border-primary text-xs font-semibold transition-all cursor-pointer"
                    >
                      <IoPencilOutline className="text-primary" />
                      <span>تعديل</span>
                    </button>
                    <button
                      onClick={() => handleDelete(broker.id, broker.name)}
                      className="p-1.5 rounded-lg bg-surface-container border border-border-structural text-text-muted hover:text-rose-400 hover:border-rose-400/40 transition-all cursor-pointer"
                      title="حذف الوسيط"
                    >
                      <IoTrashOutline />
                    </button>
                  </div>

                  {/* Links External Preview */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={broker.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <span>رابط الحساب</span>
                      <IoOpenOutline className="text-xs" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ── */
        <div className="bg-surface-container rounded-xl border border-border-structural/40 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-surface-elevated text-text-muted text-telemetry-micro font-telemetry-micro uppercase tracking-wider border-b border-border-structural/40">
                  <th className="py-space-sm px-space-md">الوسيط</th>
                  <th className="py-space-sm px-space-md">التصنيف والترخيص</th>
                  <th className="py-space-sm px-space-md">كود الشريك / الكوبون</th>
                  <th className="py-space-sm px-space-md">المواصفات الأساسية</th>
                  <th className="py-space-sm px-space-md">الروابط المباشرة</th>
                  <th className="py-space-sm px-space-md">الحالة</th>
                  <th className="py-space-sm px-space-md text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-structural/20 font-body-sm text-body-sm">
                {filteredBrokers.map((broker) => {
                  const isActive = broker.status !== 'INACTIVE';
                  return (
                    <tr key={broker.id} className="hover:bg-surface-elevated/40 transition-colors">
                      {/* Broker Name & Logo */}
                      <td className="py-space-md px-space-md">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ background: broker.logoBg || '#000000' }}
                            className="w-12 h-9 rounded-lg border border-border-structural flex items-center justify-center p-1 overflow-hidden shrink-0"
                          >
                            <img
                              src={broker.logo}
                              alt={broker.name}
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/Images/brokers/xm.webp';
                              }}
                            />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary">{broker.name}</span>
                            <span className="text-telemetry-micro text-primary font-mono dir-ltr">
                              ID: {broker.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category & Badge */}
                      <td className="py-space-md px-space-md">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-text-secondary">
                            {broker.category === 'prop' ? 'شركة تمويل Prop' : 'وسيط فوركس'}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            {broker.badgeAr || broker.badgeEn}
                          </span>
                        </div>
                      </td>

                      {/* Coupon */}
                      <td className="py-space-md px-space-md font-mono">
                        {broker.couponCode ? (
                          <button
                            onClick={() => copyCoupon(broker.couponCode)}
                            className="px-2 py-0.5 rounded bg-surface-elevated border border-border-structural text-xs text-primary font-bold hover:border-primary flex items-center gap-1 cursor-pointer"
                          >
                            <IoCopyOutline />
                            <span>{broker.couponCode}</span>
                          </button>
                        ) : (
                          <span className="text-text-muted text-xs">رابط مباشر</span>
                        )}
                      </td>

                      {/* Specs */}
                      <td className="py-space-md px-space-md">
                        <div className="text-xs text-text-secondary space-y-0.5">
                          <div>
                            إيداع: <span className="text-text-primary font-bold">{broker.specs?.[0]?.valueAr || '$10'}</span>
                          </div>
                          <div>
                            سبريد: <span className="text-bullish-up font-bold">{broker.specs?.[2]?.valueAr || '0.0 pips'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Links */}
                      <td className="py-space-md px-space-md">
                        <a
                          href={broker.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <span>فتح الحساب</span>
                          <IoOpenOutline />
                        </a>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-space-md px-space-md">
                        <button
                          onClick={() => handleToggleStatus(broker)}
                          className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isActive ? 'نشط' : 'معطل'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-space-md px-space-md text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(broker)}
                            className="p-1.5 rounded-lg bg-surface-elevated text-text-secondary hover:text-primary hover:bg-surface-elevated/80 transition-colors cursor-pointer"
                            title="تعديل بيانات الوسيط"
                          >
                            <IoPencilOutline className="text-base" />
                          </button>
                          <button
                            onClick={() => handleDelete(broker.id, broker.name)}
                            className="p-1.5 rounded-lg bg-surface-elevated text-text-muted hover:text-rose-400 hover:bg-surface-elevated/80 transition-colors cursor-pointer"
                            title="حذف الوسيط"
                          >
                            <IoTrashOutline className="text-base" />
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

      {/* ══════════════ 5. ADD / EDIT BROKER MODAL ══════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#00030D]/85 backdrop-blur-md transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Dialog */}
          <div className="relative z-10 w-full max-w-2xl bg-[#0A1B3D] border border-[#12315C] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#12315C] bg-[#07132B]">
              <div>
                <h3 className="text-lg font-bold text-[#F5F7FA]">
                  {modalMode === 'add' ? 'إضافة وسيط أو شركة تمويل جديدة' : `تعديل بيانات: ${formData.name}`}
                </h3>
                <p className="text-xs text-[#A7AFBF] mt-0.5">
                  يتم حفظ التعديلات فوراً ومزامنتها مع صفحة /open-account العامة
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A7AFBF] hover:text-white hover:bg-[#12315C] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* AI Auto-Translation Toolbar */}
            <div className="px-6 py-2.5 bg-[#050E21] border-b border-[#12315C] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                        autoTranslateEnabled ? 'bg-emerald-400 opacity-75' : 'bg-slate-500 opacity-40'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        autoTranslateEnabled ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    ></span>
                  </span>
                  <span className="text-text-secondary font-medium">الترجمة التلقائية الفورية للإنجليزية:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                    autoTranslateEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-surface-elevated text-text-muted border border-border-structural hover:text-text-primary'
                  }`}
                >
                  {autoTranslateEnabled ? 'مفعلة (تترجم عند الكتابة)' : 'معطلة (يدوي فقط)'}
                </button>
              </div>

              <button
                type="button"
                disabled={translatingAll}
                onClick={handleTranslateAllBrokerFields}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-primary text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                title="ترجمة كافة النصوص العربية (الوصف، الشارة، المزايا، المواصفات، عدد العملاء) إلى الإنجليزية دفعة واحدة"
              >
                <IoSparklesOutline className={translatingAll ? 'animate-spin' : ''} />
                <span>{translatingAll ? 'جاري ترجمة كافة الحقول...' : '✨ ترجمة جميع الحقول تلقائياً للإنجليزية'}</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#12315C] bg-[#0A1B3D] px-6 gap-2 pt-2 overflow-x-auto">
              {[
                { key: 'basic', label: 'البيانات الأساسية' },
                { key: 'branding', label: 'الشعار والمظهر' },
                { key: 'links', label: 'الروابط والكوبونات' },
                { key: 'specs', label: 'المواصفات الست' },
                { key: 'features', label: 'المزايا والنقاط' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setModalTab(tab.key)}
                  className={`px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    modalTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-[#A7AFBF] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveForm} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TAB 1: BASIC INFO */}
              {modalTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        اسم الوسيط الرسمي *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: XM Global"
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        المعرف الفريد (Slug ID) *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={modalMode === 'edit'}
                        value={formData.id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                          })
                        }
                        placeholder="xm أو propxp"
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm font-mono outline-none focus:border-primary disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        تصنيف الشريك
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none"
                      >
                        <option value="forex">وسيط فوركس وعقود فروقات (Forex / CFD)</option>
                        <option value="prop">شركة تمويل متداولين (Prop Trading Firm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        حالة التفعيل
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none"
                      >
                        <option value="ACTIVE">نشط ومعروض (ACTIVE)</option>
                        <option value="INACTIVE">معطل ومخفي (INACTIVE)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-text-secondary">
                          شارة الثقة (عربي - الأساسي)
                        </label>
                        <span className="text-[10px] text-primary font-bold">يكتب بالعربية</span>
                      </div>
                      <input
                        type="text"
                        value={formData.badgeAr}
                        onChange={(e) => handleBrokerArabicChange('badgeAr', 'badgeEn', e.target.value)}
                        placeholder="الأكثر موثوقية عالمياً • فئة أولى Tier-1"
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-text-secondary">
                          شارة الثقة (إنجليزي - قابل للتعديل)
                        </label>
                        <div className="flex items-center gap-1.5">
                          {translatingFields.badgeEn && (
                            <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleBrokerManualTranslate(formData.badgeAr, 'badgeEn')}
                            className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                          >
                            ترجمة
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.badgeEn}
                        onChange={(e) => setFormData({ ...formData, badgeEn: e.target.value })}
                        placeholder="Most Trusted Globally • Tier-1 Regulated"
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none dir-ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-secondary">
                        نبذة تعريفية بالوسيط (عربي - الأساسي)
                      </label>
                      <span className="text-[10px] text-primary font-bold">يكتب بالعربية</span>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.descriptionAr}
                      onChange={(e) => handleBrokerArabicChange('descriptionAr', 'descriptionEn', e.target.value)}
                      placeholder="وصف الوسيط، ميزاته التنافسية، وسرعة التنفيذ..."
                      className="w-full p-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-secondary">
                        نبذة تعريفية بالوسيط (إنجليزي - قابل للتعديل)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {translatingFields.descriptionEn && (
                          <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleBrokerManualTranslate(formData.descriptionAr, 'descriptionEn')}
                          className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                        >
                          ترجمة من العربية
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      placeholder="Brief description of the broker and its advantages..."
                      className="w-full p-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none focus:border-primary dir-ltr"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BRANDING & APPEARANCE */}
              {modalTab === 'branding' && (
                <div className="space-y-4">
                  {/* LOGO UPLOADER & WEBP CONVERTER CARD */}
                  <div className="p-4 rounded-2xl bg-surface-container/60 border border-border-structural space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <IoImageOutline className="text-primary text-lg" />
                        <div>
                          <span className="text-xs font-bold text-text-primary block">
                            شعار الوسيط (Broker Logo)
                          </span>
                          <span className="text-[11px] text-text-muted">
                            يدعم رفع الصور من جهازك أو إدخال رابط مباشر، مع تحويل فوري وتلقائي إلى WebP
                          </span>
                        </div>
                      </div>

                      {formData.logo ? (
                        formData.logo.toLowerCase().endsWith('.webp') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <IoCheckmarkCircleOutline className="text-sm" />
                            بصيغة WebP معتمدة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            صيغة غير WebP ({formData.logo.split('.').pop()?.slice(0, 4) || 'مخصصة'})
                          </span>
                        )
                      ) : null}
                    </div>

                    {/* Method 1: Upload from Device */}
                    <div>
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        accept="image/*,.svg,.png,.jpg,.jpeg,.webp,.gif,.bmp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoFileUpload(file);
                          e.target.value = '';
                        }}
                        className="hidden"
                      />

                      <div
                        onClick={() => logoFileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverLogo(true);
                        }}
                        onDragLeave={() => setDragOverLogo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOverLogo(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleLogoFileUpload(file);
                        }}
                        className={`group relative flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                          dragOverLogo
                            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.01]'
                            : 'border-border-structural hover:border-primary/60 bg-surface-elevated/40 hover:bg-surface-elevated'
                        }`}
                      >
                        {uploadingLogo ? (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            <span className="text-xs font-bold text-primary animate-pulse">
                              جاري رفع الصورة وتحويلها تلقائياً إلى WebP ({uploadProgress}%)...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center gap-1.5">
                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <IoCloudUploadOutline className="text-xl" />
                            </div>
                            <div className="text-xs font-bold text-text-primary">
                              اضغط هنا لرفع صورة الشعار من جهازك (أو اسحب الصورة وأفلتها هنا)
                            </div>
                            <p className="text-[11px] text-text-muted">
                              PNG, JPG, JPEG, SVG, WEBP — يتم تحويل أي امتداد تلقائياً لصيغة WebP فائقة الجودة
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Method 2: Link / URL Input & 1-Click Convert */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-text-secondary">
                          أو أدخل مسار أو رابط الشعار (Logo URL / Path):
                        </label>
                        {formData.logo && !formData.logo.toLowerCase().endsWith('.webp') && (
                          <button
                            type="button"
                            onClick={() => handleConvertLogoUrlToWebp()}
                            disabled={convertingLogo}
                            className="text-[11px] font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <IoFlashOutline />
                            {convertingLogo ? 'جاري التحويل...' : 'تحويل الرابط الحالي لـ WebP'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                          placeholder="/assets/Images/brokers/ingot.svg أو https://..."
                          className="flex-1 h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-xs font-mono outline-none focus:border-primary dir-ltr"
                        />
                        <button
                          type="button"
                          onClick={() => handleConvertLogoUrlToWebp()}
                          disabled={convertingLogo || !formData.logo}
                          className="h-10 px-4 rounded-xl bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                          title="تحويل الرابط أو المسار الحالي إلى WebP وحفظه على السيرفر"
                        >
                          <IoFlashOutline className={convertingLogo ? 'animate-spin' : ''} />
                          <span>{convertingLogo ? 'جاري التحويل...' : 'تحويل لـ WebP'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Box with Format Status */}
                    {formData.logo && (
                      <div className="p-3 bg-surface-elevated rounded-xl border border-border-structural flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            style={{ background: formData.logoBg || '#000000' }}
                            className="w-20 h-12 rounded-lg border border-border-structural flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner"
                          >
                            <img
                              src={formData.logo}
                              alt="Logo Preview"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/Images/brokers/xm.webp';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[10px] text-text-muted font-bold">معاينة الشعار الحالي:</span>
                            <span className="block text-xs font-mono text-text-primary truncate dir-ltr max-w-xs sm:max-w-md">
                              {formData.logo}
                            </span>
                          </div>
                        </div>

                        {formData.logo.toLowerCase().endsWith('.webp') ? (
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                            <IoCheckmarkCircleOutline className="text-xs" />
                            محفوظ كـ WebP
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleConvertLogoUrlToWebp()}
                            disabled={convertingLogo}
                            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer shrink-0"
                          >
                            <IoFlashOutline />
                            اضغط للتحويل لـ WebP
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        لون خلفية الشعار
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.logoBg?.startsWith('#') ? formData.logoBg : '#000000'}
                          onChange={(e) => setFormData({ ...formData, logoBg: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={formData.logoBg}
                          onChange={(e) => setFormData({ ...formData, logoBg: e.target.value })}
                          className="flex-1 h-10 px-2 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        لون التمييز (Accent Color)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.accentColor?.startsWith('#') ? formData.accentColor : '#0488F8'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              accentColor: e.target.value,
                              glowBorder: `${e.target.value}40`,
                            })
                          }
                          className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <input
                          type="text"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                          className="flex-1 h-10 px-2 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary mb-1">
                        التقييم النجمي (Rating)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        max="5"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.9 })}
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-text-secondary">
                          عدد العملاء (عربي - الأساسي)
                        </label>
                        <span className="text-[10px] text-primary font-bold">يكتب بالعربية</span>
                      </div>
                      <input
                        type="text"
                        value={formData.clientsCount}
                        onChange={(e) => handleBrokerArabicChange('clientsCount', 'clientsCountEn', e.target.value)}
                        placeholder="10M+ المتداولين"
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-text-secondary">
                          عدد العملاء (إنجليزي - قابل للتعديل)
                        </label>
                        <div className="flex items-center gap-1.5">
                          {translatingFields.clientsCountEn && (
                            <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleBrokerManualTranslate(formData.clientsCount, 'clientsCountEn')}
                            className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                          >
                            ترجمة
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.clientsCountEn}
                        onChange={(e) => setFormData({ ...formData, clientsCountEn: e.target.value })}
                        placeholder="10M+ Active Traders Worldwide"
                        className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none dir-ltr"
                      />
                  </div>
                </div>
              )}

              {/* TAB 3: LINKS & PERKS */}
              {modalTab === 'links' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      رابط الحساب الحقيقي / رابط الإحالة الرسمي (Live Account URL) *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.liveUrl}
                      onChange={(e) => setFormData({ ...formData, liveUrl: e.target.value })}
                      placeholder="https://clicks.pipaffiliates.com/..."
                      className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm font-mono outline-none focus:border-primary dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      رابط الحساب التجريبي أو التحدي (Demo / Evaluation URL)
                    </label>
                    <input
                      type="url"
                      value={formData.demoUrl}
                      onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm font-mono outline-none focus:border-primary dir-ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1">
                      كود الشريك / الكوبون الحصري (Partner Code / Coupon)
                    </label>
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                      placeholder="مثال: KTW63 أو ENG (اتركه فارغاً إن لم يتوفر)"
                      className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm font-mono outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-secondary">
                        الميزة الحصرية لأعضاء FXENGIN (عربي - الأساسي)
                      </label>
                      <span className="text-[10px] text-primary font-bold">يكتب بالعربية</span>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.fxenginPerksAr}
                      onChange={(e) => handleBrokerArabicChange('fxenginPerksAr', 'fxenginPerksEn', e.target.value)}
                      placeholder="بونص ترحيبي 100% حتى 500$ + إشارات وتوصيات VIP مجانية فور الإيداع"
                      className="w-full p-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-text-secondary">
                        الميزة الحصرية لأعضاء FXENGIN (إنجليزي - قابل للتعديل)
                      </label>
                      <div className="flex items-center gap-1.5">
                        {translatingFields.fxenginPerksEn && (
                          <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleBrokerManualTranslate(formData.fxenginPerksAr, 'fxenginPerksEn')}
                          className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                        >
                          ترجمة من العربية
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={formData.fxenginPerksEn}
                      onChange={(e) => setFormData({ ...formData, fxenginPerksEn: e.target.value })}
                      placeholder="100% Welcome Deposit Bonus + Free Lifetime VIP Signals..."
                      className="w-full p-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary text-sm outline-none focus:border-primary dir-ltr"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: 6 SPECS */}
              {modalTab === 'specs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">
                      المواصفات الست المعروضة في شبكة بطاقة الوسيط (تُترجم تلقائياً عند الكتابة بالعربية):
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.specs.map((spec, i) => (
                      <div
                        key={i}
                        className="p-3 bg-surface-elevated rounded-xl border border-border-structural space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-bold text-primary">
                            الخاصية #{i + 1}: {spec.labelAr}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {translatingFields[`spec_${i}`] && (
                              <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSpecManualTranslate(i)}
                              className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                            >
                              ترجمة
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={spec.valueAr}
                            onChange={(e) => handleSpecArabicChange(i, e.target.value)}
                            placeholder="القيمة (عربي)"
                            className="h-8 px-2 rounded-lg bg-surface-container border border-border-structural text-xs text-text-primary outline-none"
                          />
                          <input
                            type="text"
                            value={spec.valueEn}
                            onChange={(e) => {
                              const newSpecs = formData.specs.map((s, idx) =>
                                idx === i ? { ...s, valueEn: e.target.value } : s
                              );
                              setFormData({ ...formData, specs: newSpecs });
                            }}
                            placeholder="Value (EN)"
                            className="h-8 px-2 rounded-lg bg-surface-container border border-border-structural text-xs text-text-primary outline-none dir-ltr"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: FEATURES CHECKLIST */}
              {modalTab === 'features' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-muted">
                      النقاط الأربع الرئيسية المعروضة في النافذة المنبثقة للوسيط (تُترجم تلقائياً للإنجليزية):
                    </p>
                  </div>
                  {formData.featuresAr.map((feat, i) => (
                    <div
                      key={i}
                      className="p-3 bg-surface-elevated rounded-xl border border-border-structural space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-bullish-up">
                          ميزة رقم #{i + 1}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {translatingFields[`feature_${i}`] && (
                            <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleFeatureManualTranslate(i)}
                            className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                          >
                            ترجمة للإنجليزية
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-text-secondary mb-1">بالعربية:</label>
                          <input
                            type="text"
                            value={feat}
                            onChange={(e) => handleFeatureArabicChange(i, e.target.value)}
                            placeholder="نص الميزة بالعربية"
                            className="w-full h-8 px-2.5 rounded-lg bg-surface-container border border-border-structural text-xs text-text-primary outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-text-secondary mb-1">بالإنجليزية (English):</label>
                          <input
                            type="text"
                            value={formData.featuresEn?.[i] || ''}
                            onChange={(e) => {
                              const newFeaturesEn = [...(formData.featuresEn || [])];
                              newFeaturesEn[i] = e.target.value;
                              setFormData({ ...formData, featuresEn: newFeaturesEn });
                            }}
                            placeholder="Feature in English"
                            className="w-full h-8 px-2.5 rounded-lg bg-surface-container border border-border-structural text-xs text-text-primary outline-none dir-ltr"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-[#12315C] flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-lg shadow-primary/25 cursor-pointer"
                  >
                    {modalMode === 'add' ? 'إضافة الوسيط ونشره' : 'حفظ التعديلات الشاملة'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broker Promotional Popup Master Configuration Modal */}
      <BrokerPopupControlModal
        isOpen={isPopupModalOpen}
        onClose={() => setIsPopupModalOpen(false)}
        config={popupConfig}
        brokers={brokers}
        onConfigSaved={(updated) => setPopupConfig(updated)}
      />
    </div>
  );
}
