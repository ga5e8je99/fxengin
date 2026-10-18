'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '../Modal';
import { toast } from 'react-toastify';
import {
  IoSparklesOutline,
  IoLanguageOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import { translateText } from '../../services/translationService';

const AVAILABLE_PERMISSIONS = [
  { key: 'GOLD_VIP_SIGNALS', label: 'إشارات الذهب VIP وMT5 الحية (Gold VIP)' },
  { key: 'FOREX_VIP_SIGNALS', label: 'إشارات أزواج العملات الأجنبية (Forex VIP)' },
  { key: 'INDICES_VIP_SIGNALS', label: 'إشارات المؤشرات العالمية (US30 / NAS100)' },
  { key: 'COMMODITIES_VIP_SIGNALS', label: 'إشارات النفط والسلع والمعادن' },
  { key: 'BOT_SIGNALS_ACCESS', label: 'إشارات وتوصيات بوت التداول الذكي MT5' },
  { key: 'INSTITUTIONAL_DESK', label: 'مكتب التحليل الفني ومناطق السيولة والـ FVG' },
  { key: 'LIVE_STREAMING_ACCESS', label: 'حضور جلسات البث المباشر للطلاب' },
  { key: 'ACADEMY_COURSES_VIP', label: 'فك قفل دورات وكورسات الأكاديمية VIP' },
  { key: 'TELEGRAM_VIP_COMMUNITY', label: 'مجتمع وقنوات التلجرام VIP الخاصة' },
  { key: 'LIVE_CHAT_PRIVILEGE', label: 'صلاحية الشات والتفاعل في البث المباشر' },
  { key: 'OFFLINE_DOWNLOADS_PDF', label: 'التحميل الآمن للمذكرات الرقمية PDF' },
];

const PRESET_COLORS = [
  { label: 'ذهبي / برتقالي', color: '#FB8704' },
  { label: 'أزرق كلاسيكي', color: '#0488F8' },
  { label: 'بنفسجي مؤشرات', color: '#A855F7' },
  { label: 'أخضر زمردي', color: '#10B981' },
  { label: 'أحمر قرمزي', color: '#EF4444' },
];

export default function CreateEditPlanModal({ isOpen, onClose, plan, onSave }) {
  const isEdit = Boolean(plan?.id);

  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    slug: '',
    descriptionAr: '',
    descriptionEn: '',
    price: '',
    currency: 'USD',
    billingPeriod: 'MONTHLY',
    badgeAr: '',
    badgeEn: '',
    highlightColor: '#FB8704',
    isActive: true,
    sortOrder: 1,
    featuresTextAr: '',
    featuresTextEn: '',
    permissions: [],
  });

  const [loading, setLoading] = useState(false);

  // Auto-Translation state
  const [translatingFields, setTranslatingFields] = useState({});
  const [translatingAll, setTranslatingAll] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const debounceTimers = useRef({});

  // Debounced auto-translate from Arabic input to English field
  const handleArabicChange = (arField, enField, val) => {
    setFormData((prev) => ({ ...prev, [arField]: val }));

    if (!autoTranslateEnabled || !val || !val.trim()) return;

    if (debounceTimers.current[enField]) {
      clearTimeout(debounceTimers.current[enField]);
    }

    debounceTimers.current[enField] = setTimeout(async () => {
      setTranslatingFields((prev) => ({ ...prev, [enField]: true }));
      try {
        const trans = await translateText(val, 'ar', 'en');
        if (trans) {
          setFormData((prev) => ({ ...prev, [enField]: trans }));
        }
      } catch (e) {
        console.warn('Auto-translate error:', e);
      } finally {
        setTranslatingFields((prev) => ({ ...prev, [enField]: false }));
      }
    }, 750);
  };

  // Manual single field translation
  const handleManualTranslate = async (sourceText, targetField) => {
    if (!sourceText || !sourceText.trim()) {
      toast.warn('يرجى كتابة النص بالعربية أولاً لترجمته');
      return;
    }

    setTranslatingFields((prev) => ({ ...prev, [targetField]: true }));
    try {
      const trans = await translateText(sourceText, 'ar', 'en');
      if (trans) {
        setFormData((prev) => ({ ...prev, [targetField]: trans }));
        toast.success('تمت الترجمة إلى الإنجليزية بنجاح! ✨');
      }
    } catch {
      toast.error('تعذر إجراء الترجمة التلقائية');
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [targetField]: false }));
    }
  };

  // Translate all features line by line
  const handleTranslateFeatures = async () => {
    if (!formData.featuresTextAr || !formData.featuresTextAr.trim()) {
      toast.warn('يرجى كتابة المميزات بالعربية أولاً لترجمتها');
      return;
    }

    setTranslatingFields((prev) => ({ ...prev, featuresTextEn: true }));
    try {
      const lines = formData.featuresTextAr.split('\n');
      const translatedLines = await Promise.all(
        lines.map(async (line) => {
          if (!line.trim()) return '';
          const res = await translateText(line, 'ar', 'en');
          return res || line;
        })
      );

      setFormData((prev) => ({ ...prev, featuresTextEn: translatedLines.join('\n') }));
      toast.success('تمت ترجمة كافة سطور المميزات إلى الإنجليزية! ✨');
    } catch {
      toast.error('فشلت ترجمة المميزات');
    } finally {
      setTranslatingFields((prev) => ({ ...prev, featuresTextEn: false }));
    }
  };

  // Translate all fields to English
  const handleTranslateAllFields = async () => {
    setTranslatingAll(true);
    const toastId = toast.loading('جاري ترجمة كافة الحقول للإنجليزية...');

    try {
      const promises = [];
      const updates = {};

      if (formData.nameAr?.trim()) {
        promises.push(
          translateText(formData.nameAr, 'ar', 'en').then((res) => {
            if (res) updates.nameEn = res;
          })
        );
      }

      if (formData.badgeAr?.trim()) {
        promises.push(
          translateText(formData.badgeAr, 'ar', 'en').then((res) => {
            if (res) updates.badgeEn = res;
          })
        );
      }

      if (formData.descriptionAr?.trim()) {
        promises.push(
          translateText(formData.descriptionAr, 'ar', 'en').then((res) => {
            if (res) updates.descriptionEn = res;
          })
        );
      }

      if (formData.featuresTextAr?.trim()) {
        const lines = formData.featuresTextAr.split('\n');
        promises.push(
          Promise.all(
            lines.map(async (line) => {
              if (!line.trim()) return '';
              const res = await translateText(line, 'ar', 'en');
              return res || line;
            })
          ).then((translatedLines) => {
            updates.featuresTextEn = translatedLines.join('\n');
          })
        );
      }

      await Promise.all(promises);
      setFormData((prev) => ({ ...prev, ...updates }));

      toast.update(toastId, {
        render: 'تمت ترجمة وتعبئة كافة الحقول باللغة الإنجليزية بنجاح! ✨',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch {
      toast.update(toastId, {
        render: 'فشلت الترجمة الشاملة',
        type: 'error',
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setTranslatingAll(false);
    }
  };

  useEffect(() => {
    if (plan) {
      // Parse bilingual name
      let nameAr = plan.name || '';
      let nameEn = '';
      if (nameAr.includes(':::')) {
        const parts = nameAr.split(':::').map((s) => s.trim());
        nameAr = parts[0] || '';
        nameEn = parts[1] || '';
      }

      // Parse bilingual badge
      let badgeAr = plan.badge || '';
      let badgeEn = '';
      if (badgeAr && badgeAr.includes(':::')) {
        const parts = badgeAr.split(':::').map((s) => s.trim());
        badgeAr = parts[0] || '';
        badgeEn = parts[1] || '';
      }

      // Parse bilingual description
      let descriptionAr = plan.description || '';
      let descriptionEn = '';
      if (descriptionAr && descriptionAr.includes(':::')) {
        const parts = descriptionAr.split(':::').map((s) => s.trim());
        descriptionAr = parts[0] || '';
        descriptionEn = parts[1] || '';
      }

      // Parse bilingual features
      const linesAr = [];
      const linesEn = [];
      if (Array.isArray(plan.features)) {
        plan.features.forEach((feat) => {
          if (typeof feat === 'string' && feat.includes(':::')) {
            const [ar, en] = feat.split(':::').map((s) => s.trim());
            linesAr.push(ar || '');
            linesEn.push(en || '');
          } else if (typeof feat === 'string') {
            linesAr.push(feat);
            linesEn.push('');
          }
        });
      }

      // Fallback English presets if editing core analysis groups
      if (!nameEn) {
        if (plan.slug === 'gold') nameEn = 'Gold Analysis Group';
        else if (plan.slug === 'forex') nameEn = 'Forex Analysis Group';
        else if (plan.slug === 'indices') nameEn = 'Index & Commodities Group';
      }
      if (!badgeEn) {
        if (plan.slug === 'gold') badgeEn = 'Most Popular • Live on API';
        else if (plan.slug === 'forex') badgeEn = 'Currency Pairs';
        else if (plan.slug === 'indices') badgeEn = 'Energy & Indices';
      }

      setFormData({
        nameAr,
        nameEn,
        slug: plan.slug || '',
        descriptionAr,
        descriptionEn,
        price: plan.price !== undefined ? plan.price : '',
        currency: plan.currency || 'USD',
        billingPeriod: plan.billingPeriod || 'MONTHLY',
        badgeAr,
        badgeEn,
        highlightColor: plan.highlightColor || '#FB8704',
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : 1,
        featuresTextAr: linesAr.join('\n'),
        featuresTextEn: linesEn.some(Boolean) ? linesEn.join('\n') : '',
        permissions: Array.isArray(plan.permissions) ? plan.permissions : [],
      });
    } else {
      setFormData({
        nameAr: '',
        nameEn: '',
        slug: '',
        descriptionAr: '',
        descriptionEn: '',
        price: '',
        currency: 'USD',
        billingPeriod: 'MONTHLY',
        badgeAr: '',
        badgeEn: '',
        highlightColor: '#FB8704',
        isActive: true,
        sortOrder: 1,
        featuresTextAr: '',
        featuresTextEn: '',
        permissions: ['INSTITUTIONAL_DESK', 'TELEGRAM_VIP_COMMUNITY'],
      });
    }
  }, [plan, isOpen]);

  const handlePermissionToggle = (key) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(key);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== key)
          : [...prev.permissions, key],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nameAr.trim() || !formData.slug.trim() || formData.price === '') {
      toast.error('يرجى ملء جميع الحقول الإلزامية (اسم المجموعة بالعربي، المعرف الرابطي، السعر)');
      return;
    }

    setLoading(true);
    try {
      const linesAr = formData.featuresTextAr
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const linesEn = formData.featuresTextEn
        .split('\n')
        .map((f) => f.trim());

      const featuresArray = linesAr.map((arLine, idx) => {
        const enLine = linesEn[idx];
        if (enLine && enLine.trim()) {
          return `${arLine} ::: ${enLine.trim()}`;
        }
        return arLine;
      });

      const nameCombined = formData.nameEn.trim()
        ? `${formData.nameAr.trim()} ::: ${formData.nameEn.trim()}`
        : formData.nameAr.trim();

      const badgeCombined = formData.badgeEn.trim()
        ? `${formData.badgeAr.trim()} ::: ${formData.badgeEn.trim()}`
        : formData.badgeAr.trim() || null;

      const descriptionCombined = formData.descriptionEn.trim()
        ? `${formData.descriptionAr.trim()} ::: ${formData.descriptionEn.trim()}`
        : formData.descriptionAr.trim();

      const payload = {
        name: nameCombined,
        slug: formData.slug.trim().toLowerCase(),
        description: descriptionCombined,
        price: Number(formData.price),
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        badge: badgeCombined,
        highlightColor: formData.highlightColor,
        isActive: Boolean(formData.isActive),
        sortOrder: Number(formData.sortOrder) || 0,
        features: featuresArray,
        permissions: formData.permissions,
      };

      await onSave(payload, isEdit ? plan.id : null);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء حفظ المجموعة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'تعديل مجموعة التحليلات' : 'إضافة مجموعة تحليلات جديدة'}
      subtitle="إدارة أسعار وصلاحيات ومميزات المجموعة المعروضة بالعربية والإنجليزية على الموقع والداشبورد"
      maxWidth="max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-right" dir="rtl">
        {/* AI Auto-Translation Toolbar */}
        <div className="p-3 bg-[#050E21] border border-[#12315C] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs mb-3 shadow-inner">
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
              <span className="text-gray-300 font-medium">الترجمة التلقائية الفورية بالذكاء الاصطناعي:</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoTranslateEnabled(!autoTranslateEnabled)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                autoTranslateEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-[#0A1B3D] text-gray-400 border border-[#12315C] hover:text-white'
              }`}
            >
              {autoTranslateEnabled ? 'مفعلة تلقائياً' : 'معطلة'}
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={translatingAll}
              onClick={handleTranslateAllFields}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#FB8704] to-[#0488F8] text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="ترجمة الاسم، الشارة، الوصف، والمميزات بالكامل إلى الإنجليزية"
            >
              <IoSparklesOutline className={translatingAll ? 'animate-spin' : ''} />
              <span>{translatingAll ? 'جاري ترجمة كافة الحقول...' : '✨ ترجمة جميع الحقول للإنجليزية تلقائياً'}</span>
            </button>
          </div>
        </div>

        {/* 1. Name: Arabic & English */}
        <div className="bg-[#030B1E]/40 p-3.5 rounded-xl border border-[#12315C]/50 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-gray-300">
            <div className="flex items-center gap-2">
              <IoLanguageOutline className="text-[#0488F8] text-base" />
              <span>اسم المجموعة (بالعربية والإنجليزية)</span>
            </div>
            <span className="text-[11px] text-gray-400 font-normal">
              سيظهر الاسم بالعربية لزوار الموقع بالعربي، وبالإنجليزية لزوار الإنجليزي
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
                اسم المجموعة (بالعربية) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="مثال: مجموعة الذهب (Gold VIP)"
                value={formData.nameAr}
                onChange={(e) => handleArabicChange('nameAr', 'nameEn', e.target.value)}
                className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
              />
            </div>

            {/* English Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#A7AFBF]">
                  Group Name (in English)
                </label>
                <div className="flex items-center gap-1.5">
                  {translatingFields.nameEn && (
                    <span className="text-[10px] text-[#FB8704] animate-pulse font-bold">جاري الترجمة...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleManualTranslate(formData.nameAr, 'nameEn')}
                    className="text-[10px] text-[#0488F8] hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <IoSparklesOutline size={11} />
                    <span>ترجمة للإنجليزية</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="e.g. Gold VIP Analysis Group"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#0488F8] transition-colors text-sm dir-ltr text-left"
              />
            </div>
          </div>
        </div>

        {/* 2. Slug, Price, Billing, Order */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              المعرف الرابطي (Slug) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: gold أو forex أو indices"
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.replace(/\s+/g, '-').toLowerCase(),
                })
              }
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm font-mono dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              السعر (USDT) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="مثال: 49"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              دورة الفوترة
            </label>
            <select
              value={formData.billingPeriod}
              onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
            >
              <option value="MONTHLY">شهرياً (Monthly)</option>
              <option value="QUARTERLY">ربع سنوي (3 شهور)</option>
              <option value="SEMI_ANNUAL">نصف سنوي (6 شهور)</option>
              <option value="YEARLY">سنوياً (Yearly)</option>
              <option value="LIFETIME">مدى الحياة (Lifetime)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              ترتيب الظهور
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
            />
          </div>
        </div>

        {/* 3. Badge: Arabic & English + Highlight Color */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              شارة التميز (عربي)
            </label>
            <input
              type="text"
              placeholder="مثال: الأكثر طلباً • لايف"
              value={formData.badgeAr}
              onChange={(e) => handleArabicChange('badgeAr', 'badgeEn', e.target.value)}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#A7AFBF]">
                Badge (English)
              </label>
              <button
                type="button"
                onClick={() => handleManualTranslate(formData.badgeAr, 'badgeEn')}
                className="text-[10px] text-[#0488F8] hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
              >
                <IoSparklesOutline size={11} />
                <span>ترجمة</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. Most Popular • Live"
              value={formData.badgeEn}
              onChange={(e) => setFormData({ ...formData, badgeEn: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#0488F8] transition-colors text-sm dir-ltr text-left"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              لون التمييز (Highlight Color)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={formData.highlightColor}
                onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                className="w-10 h-8 p-0.5 rounded-lg bg-[#030B1E] border border-[#12315C] cursor-pointer"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setFormData({ ...formData, highlightColor: p.color })}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      formData.highlightColor === p.color ? 'scale-110 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: p.color }}
                    title={p.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Description: Arabic & English */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              وصف المجموعة (بالعربية)
            </label>
            <textarea
              rows={2}
              placeholder="مثال: المجموعة الأكثر طلباً لتحليلات وإشارات الذهب اللحظية وشارتات MT5 الحية..."
              value={formData.descriptionAr}
              onChange={(e) => handleArabicChange('descriptionAr', 'descriptionEn', e.target.value)}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-xs leading-relaxed"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#A7AFBF]">
                Description (in English)
              </label>
              <div className="flex items-center gap-1.5">
                {translatingFields.descriptionEn && (
                  <span className="text-[10px] text-[#FB8704] animate-pulse font-bold">جاري الترجمة...</span>
                )}
                <button
                  type="button"
                  onClick={() => handleManualTranslate(formData.descriptionAr, 'descriptionEn')}
                  className="text-[10px] text-[#0488F8] hover:underline font-bold cursor-pointer inline-flex items-center gap-0.5"
                >
                  <IoSparklesOutline size={11} />
                  <span>ترجمة للإنجليزية</span>
                </button>
              </div>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Institutional coverage and live setups across major and cross FX currency pairs..."
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#0488F8] transition-colors text-xs leading-relaxed dir-ltr text-left"
            />
          </div>
        </div>

        {/* 5. Features: Arabic & English Textareas */}
        <div className="bg-[#030B1E]/40 p-3.5 rounded-xl border border-[#12315C]/50 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div>
              <span className="font-bold text-gray-200">المميزات وصلاحيات الوصول (سطر لكل ميزة)</span>
              <span className="text-[11px] text-gray-400 mr-2">• كل سطر = علامة صح خضراء منفصلة على الموقع</span>
            </div>
            <div className="flex items-center gap-2">
              {translatingFields.featuresTextEn && (
                <span className="text-[10px] text-[#FB8704] animate-pulse font-bold">جاري ترجمة السطور...</span>
              )}
              <button
                type="button"
                onClick={handleTranslateFeatures}
                className="px-2.5 py-1 rounded-lg bg-[#0488F8]/15 text-[#0488F8] border border-[#0488F8]/40 hover:bg-[#0488F8]/25 font-bold cursor-pointer inline-flex items-center gap-1 transition-all"
              >
                <IoSparklesOutline size={12} />
                <span>ترجمة سطور المميزات للإنجليزية ✨</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Arabic Features */}
            <div>
              <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
                المميزات بالعربية (سطر لكل ميزة)
              </label>
              <textarea
                rows={5}
                placeholder={`بث مباشر ولحظي لصفقات الذهب من الـAPI\nشارتات MT5 حية ملتقطة لحظة بلحظة\nمصفوفة إحداثيات الصفقة: دخول، TP1، TP2، ووقف الخسارة\nنماذج السيولة البنكية SMC: Order Blocks`}
                value={formData.featuresTextAr}
                onChange={(e) => setFormData({ ...formData, featuresTextAr: e.target.value })}
                className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-xs font-sans leading-relaxed"
              />
            </div>

            {/* English Features */}
            <div>
              <label className="block text-xs font-semibold text-[#A7AFBF] mb-1 dir-ltr text-left">
                Features in English (One per line)
              </label>
              <textarea
                rows={5}
                placeholder={`Live streaming Gold analyses directly from API\nReal MT5 chart thumbnail captures synchronized\nSignal coordinates matrix: Entry, TP1, TP2, and SL\nSmart Money Concepts: Order Blocks & FVG`}
                value={formData.featuresTextEn}
                onChange={(e) => setFormData({ ...formData, featuresTextEn: e.target.value })}
                className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#0488F8] transition-colors text-xs font-sans leading-relaxed dir-ltr text-left"
              />
            </div>
          </div>
        </div>

        {/* 6. Platform Permissions */}
        <div>
          <label className="block text-xs font-semibold text-[#A7AFBF] mb-2">
            صلاحيات المنصة الممنوحة تلقائياً للمشترك
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#030B1E]/60 p-3 rounded-xl border border-[#12315C]/60 max-h-40 overflow-y-auto">
            {AVAILABLE_PERMISSIONS.map((perm) => {
              const checked = formData.permissions.includes(perm.key);
              return (
                <label
                  key={perm.key}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                    checked ? 'bg-[#12315C]/50 text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handlePermissionToggle(perm.key)}
                    className="w-4 h-4 rounded border-gray-600 text-[#FB8704] focus:ring-[#FB8704] bg-[#0A1B3D]"
                  />
                  <span>{perm.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 7. Active Status Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#030B1E]/50 rounded-xl border border-[#12315C]/40">
          <div>
            <div className="font-semibold text-white text-xs">حالة تفعيل المجموعة</div>
            <div className="text-[11px] text-gray-400">
              عند التفعيل، ستظهر المجموعة للمستخدمين في صفحة الأسعار والداشبورد بالعربية والإنجليزية
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#0A1B3D] border border-[#12315C] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* 8. Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#12315C]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-gray-400 hover:text-white bg-[#0A1B3D] border border-[#12315C] transition-colors text-xs font-semibold"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#FB8704] to-[#0488F8] text-white font-bold hover:brightness-110 active:scale-95 transition-all text-xs flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {loading && <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>}
            <span>{isEdit ? 'حفظ تعديلات المجموعة' : 'إنشاء المجموعة الآن'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
