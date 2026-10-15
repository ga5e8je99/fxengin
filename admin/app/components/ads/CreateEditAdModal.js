'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  IoCloseOutline,
  IoSparklesOutline,
  IoEyeOutline,
  IoCloudUploadOutline,
  IoColorPaletteOutline,
  IoCalendarOutline,
  IoLinkOutline,
  IoCheckmarkCircle,
} from 'react-icons/io5';
import CloudUploadWidget from '../storage/CloudUploadWidget';
import { translateText } from '../../services/translationService';

const PLACEMENT_OPTIONS = [
  {
    id: 'SKYSCRAPER_RIGHT',
    labelAr: 'الشريط الجانبي الأيمن (Right Skyscraper)',
    desc: 'يظهر في الشريط العمودي المتحرك على يمين شاشة المتداول (168px).',
    recommended: 'مقاس مناسب: كارت طولي أو بانر عمودي',
  },
  {
    id: 'SKYSCRAPER_LEFT',
    labelAr: 'الشريط الجانبي الأيسر (Left Skyscraper)',
    desc: 'يظهر في الشريط العمودي المتحرك على يسار شاشة المتداول (168px).',
    recommended: 'مقاس مناسب: كارت طولي أو بانر عمودي',
  },
  {
    id: 'HORIZONTAL_BANNER',
    labelAr: 'البنر الأفقي العريض (Horizontal Leaderboard)',
    desc: 'يظهر بين أقسام الموقع الرئيسية وصفحات الكورسات والمقالات.',
    recommended: 'مقاس مناسب: 728×90 أو بنر متجاوب عريض 1200×180',
  },
  {
    id: 'MOBILE_TOP_BAR',
    labelAr: 'شريط الجوال الترويجي (Mobile Top Strip)',
    desc: 'شريط ترويجي مضغوط يظهر في أعلى الشاشة لمستخدمي الهواتف والأجهزة اللوحية.',
    recommended: 'مقاس مناسب: شريط مقتضب وأيقونة أو نص مع زر',
  },
  {
    id: 'POPUP_MODAL',
    labelAr: 'نافذة ترويجية منبثقة (Promotional Popup)',
    desc: 'نافذة منبثقة فاخرة تظهر للمتداول عند الدخول مع زر التحويل للعرض.',
    recommended: 'مقاس مناسب: بطاقة مربعة أو 600×400',
  },
];

const COLOR_PRESETS = [
  { name: 'ذهبي / برتقالي', color: '#FB8704' },
  { name: 'أزرق المنصة', color: '#0488F8' },
  { name: 'أرجواني تقني', color: '#9333EA' },
  { name: 'أخضر نمو', color: '#16C784' },
  { name: 'سماوي نيلي', color: '#06B6D4' },
  { name: 'أحمر عاجل', color: '#EF4444' },
];

export default function CreateEditAdModal({
  isOpen,
  mode = 'create', // 'create' | 'edit'
  adData = null,
  onClose,
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    titleAr: '',
    titleEn: '',
    descAr: '',
    descEn: '',
    badge: 'VIP SIGNALS',
    badgeColor: '#FB8704',
    tag: 'HOT DEAL',
    imageUrl: '',
    targetUrl: '/register',
    btnTextAr: 'انضم الآن',
    btnTextEn: 'Join Now',
    placement: 'SKYSCRAPER_RIGHT',
    isActive: true,
    sortOrder: 0,
    startDate: '',
    endDate: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [translatingFields, setTranslatingFields] = useState({});
  const [previewTab, setPreviewTab] = useState('card'); // 'card' | 'raw'

  useEffect(() => {
    if (adData && mode === 'edit') {
      setFormData({
        titleAr: adData.titleAr || '',
        titleEn: adData.titleEn || '',
        descAr: adData.descAr || '',
        descEn: adData.descEn || '',
        badge: adData.badge || 'VIP SIGNALS',
        badgeColor: adData.badgeColor || '#FB8704',
        tag: adData.tag || '',
        imageUrl: adData.imageUrl || '',
        targetUrl: adData.targetUrl || '/register',
        btnTextAr: adData.btnTextAr || 'انضم الآن',
        btnTextEn: adData.btnTextEn || 'Join Now',
        placement: adData.placement || 'SKYSCRAPER_RIGHT',
        isActive: adData.isActive !== undefined ? adData.isActive : true,
        sortOrder: adData.sortOrder !== undefined ? adData.sortOrder : 0,
        startDate: adData.startDate ? new Date(adData.startDate).toISOString().slice(0, 16) : '',
        endDate: adData.endDate ? new Date(adData.endDate).toISOString().slice(0, 16) : '',
      });
    } else {
      setFormData({
        titleAr: '',
        titleEn: '',
        descAr: '',
        descEn: '',
        badge: 'VIP PRO',
        badgeColor: '#FB8704',
        tag: 'LIMITED DEAL',
        imageUrl: '',
        targetUrl: '/register',
        btnTextAr: 'انضم الآن',
        btnTextEn: 'Join Now',
        placement: 'SKYSCRAPER_RIGHT',
        isActive: true,
        sortOrder: 0,
        startDate: '',
        endDate: '',
      });
    }
  }, [adData, mode, isOpen]);

  if (!isOpen) return null;

  const handleTranslate = async (sourceText, targetField) => {
    if (!sourceText || !sourceText.trim()) {
      toast.warn('يرجى كتابة النص العربي أولاً لترجمته');
      return;
    }
    setTranslatingFields((prev) => ({ ...prev, [targetField]: true }));
    try {
      const translated = await translateText(sourceText);
      if (translated) {
        setFormData((prev) => ({ ...prev, [targetField]: translated }));
        toast.success('تمت الترجمة تلقائياً بنجاح');
      }
    } catch {
      toast.error('تعذر إجراء الترجمة التلقائية');
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [targetField]: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titleAr.trim()) {
      toast.error('عنوان الإعلان بالعربية مطلوب');
      return;
    }
    if (!formData.targetUrl.trim()) {
      toast.error('رابط الوجهة عند النقر مطلوب');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        sortOrder: Number(formData.sortOrder) || 0,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };
      await onSubmit(payload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-surface-container-low border border-border-structural/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-structural/60 bg-surface-container/50">
          <div>
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FB8704] animate-pulse"></span>
              {mode === 'create' ? 'إضافة مساحة إعلانية / بنر ترويجي جديد' : 'تعديل بيانات المساحة الإعلانية'}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              تحكم كامل في النصوص، الألوان، أزرار التحويل، ورابط الوجهة مع معاينة حية للمتداول.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Modal Body: Two Columns (Form on right, Live Preview on left in RTL) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left/Main Column: Form Inputs (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* 1. Placement Selector */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-2">
                  المساحة الإعلانية ومكان الظهور <span className="text-[#FB8704]">*</span>
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PLACEMENT_OPTIONS.map((opt) => {
                    const isSelected = formData.placement === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setFormData((prev) => ({ ...prev, placement: opt.id }))}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-[#0488F8] bg-[#0488F8]/10 text-white'
                            : 'border-border-structural/60 bg-surface-container-lowest hover:border-border-structural text-text-secondary'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-text-primary">{opt.labelAr}</span>
                            {isSelected && <IoCheckmarkCircle className="text-[#0488F8] shrink-0" size={16} />}
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">{opt.desc}</p>
                          <span className="inline-block mt-1 text-[10px] text-[#FB8704] font-semibold">
                            {opt.recommended}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Arabic & English Title with Auto-Translate */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-text-primary">
                      عنوان الإعلان (بالعربية) <span className="text-[#FB8704]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(formData.titleAr, 'titleEn')}
                      disabled={translatingFields.titleEn || !formData.titleAr}
                      className="text-[11px] text-[#0488F8] hover:text-[#0488F8]/80 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <IoSparklesOutline size={13} className={translatingFields.titleEn ? 'animate-spin' : ''} />
                      <span>{translatingFields.titleEn ? 'جاري الترجمة...' : 'ترجمة تلقائية للإنجليزية'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.titleAr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                    placeholder="مثال: إشارات حية 24/5 للذهب والعملات"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-border-structural text-sm text-text-primary focus:border-[#0488F8] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    عنوان الإعلان (بالإنجليزية - English Title)
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.titleEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                    placeholder="e.g. 24/5 Live VIP Signals for Gold & Forex"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-lowest border border-border-structural text-sm text-text-primary focus:border-[#0488F8] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 3. Arabic & English Description */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-text-primary">الوصف أو الشرح (بالعربية)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(formData.descAr, 'descEn')}
                      disabled={translatingFields.descEn || !formData.descAr}
                      className="text-[11px] text-[#0488F8] hover:text-[#0488F8]/80 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <IoSparklesOutline size={13} className={translatingFields.descEn ? 'animate-spin' : ''} />
                      <span>{translatingFields.descEn ? 'جاري الترجمة...' : 'ترجمة تلقائية'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.descAr}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descAr: e.target.value }))}
                    placeholder="مثال: توصيات يومية مدروسة بنسب ربح عالية ومتابعة لحظية مع الخبراء"
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-sm text-text-primary focus:border-[#0488F8] focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    الوصف (بالإنجليزية - English Description)
                  </label>
                  <textarea
                    rows={2}
                    dir="ltr"
                    value={formData.descEn}
                    onChange={(e) => setFormData((prev) => ({ ...prev, descEn: e.target.value }))}
                    placeholder="e.g. Daily data-driven setups with high accuracy and 24/5 live coverage"
                    className="w-full px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-sm text-text-primary focus:border-[#0488F8] focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* 4. Badge, Badge Color & Tag */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">نص الوسم (Badge)</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="VIP SIGNALS"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">لون الوسم</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.badgeColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, badgeColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-border-structural bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.badgeColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, badgeColor: e.target.value }))}
                      className="flex-1 px-2.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">نص التميز (Tag)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tag: e.target.value }))}
                    placeholder="92% WIN RATE"
                    className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary font-mono"
                  />
                </div>
              </div>

              {/* Color Presets Pill Selection */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <IoColorPaletteOutline className="text-text-muted" size={14} />
                  <span className="text-[11px] text-text-muted">ألوان العلامة المقترحة:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, badgeColor: p.color }))}
                      className="px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 border border-border-structural/60 hover:border-border-structural transition-colors bg-surface-container-lowest"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-text-secondary">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Target URL & Button Label */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">
                    رابط الوجهة عند النقر <span className="text-[#FB8704]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      dir="ltr"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, targetUrl: e.target.value }))}
                      placeholder="/courses أو https://broker.com/affiliate"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs font-mono text-text-primary"
                    />
                    <IoLinkOutline className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">نص زر الإجراء (CTA Button)</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={formData.btnTextAr}
                      onChange={(e) => setFormData((prev) => ({ ...prev, btnTextAr: e.target.value }))}
                      placeholder="انضم الآن"
                      className="px-2.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.btnTextEn}
                      onChange={(e) => setFormData((prev) => ({ ...prev, btnTextEn: e.target.value }))}
                      placeholder="Join Now"
                      className="px-2.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Image / Cloud Media Upload */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  صورة البنر الإعلاني (اختياري - للبنرات الأفقية أو المصورة)
                </label>
                <CloudUploadWidget
                  value={formData.imageUrl}
                  onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
                  folder="advertisements"
                  placeholder="أدخل رابط صورة مباشر أو ارفع صورة البنر سحابياً..."
                />
              </div>

              {/* 7. Campaign Dates & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">تاريخ بدء النشر (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">تاريخ نهاية النشر (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">ترتيب الأولوية (Sort)</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))}
                    placeholder="0"
                    className="w-full px-2.5 py-2 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-border-structural/60">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#16C784]"></div>
                </label>
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    {formData.isActive ? 'الإعلان نشط ومعروض للزوار' : 'الإعلان معطل ومحجوب مؤقتاً'}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    يمكنك إيقاف أو تفعيل الإعلان في أي لحظة دون حذفه.
                  </span>
                </div>
              </div>
            </div>

            {/* Right/Sticky Column: Live Interactive Preview (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="sticky top-0 bg-surface-container-lowest/80 border border-border-structural p-4 rounded-2xl backdrop-blur-md shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-border-structural/60 mb-4">
                  <div className="flex items-center gap-2">
                    <IoEyeOutline className="text-[#0488F8]" size={16} />
                    <span className="text-xs font-bold text-text-primary">معاينة حية للمتداول (Live Preview)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-container text-[#FB8704]">
                    {formData.placement}
                  </span>
                </div>

                {/* Preview Card styled identically to the website theme */}
                <div className="bg-[#00030a] p-4 rounded-xl border border-white/10 text-right flex flex-col gap-3">
                  {/* Top Badge & Tag */}
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        borderColor: formData.badgeColor,
                        color: formData.badgeColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      }}
                      className="text-[9px] font-extrabold px-2 py-0.5 rounded border tracking-wider font-mono uppercase"
                    >
                      {formData.badge || 'PRO BADGE'}
                    </span>
                    {formData.tag && (
                      <span className="text-[9px] font-bold text-[#FB8704] font-mono">
                        {formData.tag}
                      </span>
                    )}
                  </div>

                  {/* Banner Image if provided */}
                  {formData.imageUrl && (
                    <div className="w-full h-28 rounded-lg overflow-hidden border border-white/10 relative">
                      <img
                        src={formData.imageUrl}
                        alt="Ad preview"
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div className="font-bold text-sm text-white leading-snug">
                    {formData.titleAr || 'عنوان الإعلان الترويجي سيظهر هنا'}
                  </div>

                  {/* Description */}
                  {formData.descAr && (
                    <div className="text-xs text-white/70 leading-relaxed line-clamp-3">
                      {formData.descAr}
                    </div>
                  )}

                  {/* Button */}
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${formData.badgeColor} 0%, rgba(4, 136, 248, 0.8) 100%)`,
                    }}
                    className="w-full py-2 px-3 rounded-lg text-white font-bold text-xs text-center shadow-lg transition-transform"
                  >
                    {formData.btnTextAr || 'انضم الآن'} ←
                  </div>

                  <div className="text-[10px] text-white/40 text-center font-mono pt-1">
                    {formData.targetUrl}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-surface-container/50 border border-border-structural/40 text-[11px] text-text-muted leading-relaxed">
                  <strong>ملاحظة للمشرف:</strong> هذا التصميم يطابق هوية FXENGIN الداكنة الفاخرة، وسيتم احتساب النقرات والمشاهدات تلقائياً عند تفاعل المتداولين معه على الموقع.
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-structural/60 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-container transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:from-[#FA5A04] hover:to-[#FB8704] shadow-lg shadow-[#FB8704]/20 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>جاري الحفظ...</span>
              ) : mode === 'create' ? (
                <span>نشر وتفعيل الإعلان</span>
              ) : (
                <span>حفظ التعديلات</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
