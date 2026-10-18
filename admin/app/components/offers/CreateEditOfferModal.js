'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  IoCloseOutline,
  IoSparklesOutline,
  IoCloudUploadOutline,
  IoImageOutline,
  IoTrashOutline,
  IoCheckmarkCircle,
  IoLinkOutline,
  IoPricetagOutline,
  IoEyeOutline,
} from 'react-icons/io5';
import { uploadFileDirectToStorage } from '../../services/storageService';
import { translateText } from '../../services/translationService';

const POPULAR_BROKERS = ['XM Global', 'YWO Markets', 'DooPrime', 'Exness', 'PropXP Funding'];

export default function CreateEditOfferModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode = 'create',
}) {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    id: '',
    image: '',
    partnerName: 'XM Global',
    titleAr: '',
    titleEn: '',
    subtitleAr: '',
    subtitleEn: '',
    ctaLink: '',
    code: '',
    badgeAr: 'عرض حصري 🔥',
    badgeEn: 'Exclusive Offer 🔥',
    badgeColor: '#FB8704',
    ctaTextAr: 'فتح حساب وتفعيل العرض',
    ctaTextEn: 'Claim Broker Offer',
    category: 'bonus',
    categoryLabelAr: 'عروض وسطاء التداول',
    categoryLabelEn: 'Broker Offers',
    isExternal: true,
    isFeatured: false,
    isActive: true,
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(true);
  const [translatingFields, setTranslatingFields] = useState({});
  const [translatingAll, setTranslatingAll] = useState(false);
  const offerDebounceTimers = useRef({});

  const handleArabicChange = (arField, enField, val) => {
    setFormData((prev) => ({ ...prev, [arField]: val }));
    if (!autoTranslateEnabled || !val || !val.trim()) return;

    if (offerDebounceTimers.current[enField]) {
      clearTimeout(offerDebounceTimers.current[enField]);
    }

    offerDebounceTimers.current[enField] = setTimeout(async () => {
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

  const handleManualTranslate = async (arText, enField) => {
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

  const handleTranslateAllOfferFields = async () => {
    setTranslatingAll(true);
    const toastId = toast.loading('جاري ترجمة بيانات العرض للإنجليزية...');
    try {
      const promises = [];
      const updates = {};

      if (formData.titleAr?.trim()) {
        promises.push(
          translateText(formData.titleAr).then((res) => {
            if (res) updates.titleEn = res;
          })
        );
      }
      if (formData.subtitleAr?.trim()) {
        promises.push(
          translateText(formData.subtitleAr).then((res) => {
            if (res) updates.subtitleEn = res;
          })
        );
      }
      if (formData.badgeAr?.trim()) {
        promises.push(
          translateText(formData.badgeAr).then((res) => {
            if (res) updates.badgeEn = res;
          })
        );
      }

      await Promise.all(promises);
      setFormData((prev) => ({ ...prev, ...updates }));

      toast.update(toastId, {
        render: 'تمت ترجمة بيانات العرض للإنجليزية بنجاح! ✨',
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
    if (initialData && mode === 'edit') {
      setFormData({
        id: initialData.id || '',
        image: initialData.image || initialData.logo || '',
        partnerName: initialData.partnerName || 'XM Global',
        titleAr: initialData.titleAr || '',
        titleEn: initialData.titleEn || '',
        subtitleAr: initialData.subtitleAr || '',
        subtitleEn: initialData.subtitleEn || '',
        ctaLink: initialData.ctaLink || '',
        code: initialData.code || '',
        badgeAr: initialData.badgeAr || 'عرض حصري 🔥',
        badgeEn: initialData.badgeEn || 'Exclusive Offer 🔥',
        badgeColor: initialData.badgeColor || '#FB8704',
        ctaTextAr: initialData.ctaTextAr || 'فتح حساب وتفعيل العرض',
        ctaTextEn: initialData.ctaTextEn || 'Claim Broker Offer',
        category: initialData.category || 'bonus',
        categoryLabelAr: initialData.categoryLabelAr || 'عروض وسطاء التداول',
        categoryLabelEn: initialData.categoryLabelEn || 'Broker Offers',
        isExternal: initialData.isExternal !== false,
        isFeatured: Boolean(initialData.isFeatured),
        isActive: initialData.isActive !== false,
      });
    } else {
      setFormData({
        id: '',
        image: '',
        partnerName: 'XM Global',
        titleAr: '',
        titleEn: '',
        subtitleAr: '',
        subtitleEn: '',
        ctaLink: '',
        code: '',
        badgeAr: 'عرض حصري 🔥',
        badgeEn: 'Exclusive Offer 🔥',
        badgeColor: '#FB8704',
        ctaTextAr: 'فتح حساب وتفعيل العرض',
        ctaTextEn: 'Claim Broker Offer',
        category: 'bonus',
        categoryLabelAr: 'عروض وسطاء التداول',
        categoryLabelEn: 'Broker Offers',
        isExternal: true,
        isFeatured: false,
        isActive: true,
      });
    }
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP)');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFileDirectToStorage(file, { folder: 'offers' });
      if (res.ok && res.fileUrl) {
        setFormData((prev) => ({
          ...prev,
          image: res.fileUrl,
        }));
        toast.success('تم رفع صورة العرض بنجاح');
      } else {
        toast.error(res.error || 'فشل رفع الصورة');
      }
    } catch {
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titleAr.trim()) {
      toast.error('يرجى إدخال عنوان العرض');
      return;
    }

    if (!formData.subtitleAr.trim()) {
      toast.error('يرجى إدخال كابشن / وصف العرض');
      return;
    }

    if (!formData.ctaLink.trim()) {
      toast.error('يرجى إدخال رابط العرض لدى البروكر');
      return;
    }

    setSubmitting(true);
    try {
      const cleanCode = formData.code ? formData.code.toUpperCase().trim() : '';
      const payload = {
        ...formData,
        code: cleanCode,
        titleEn: formData.titleEn.trim() || formData.titleAr.trim(),
        subtitleEn: formData.subtitleEn.trim() || formData.subtitleAr.trim(),
        logo: formData.image, // backwards compatibility
        isExternal: true,
      };

      await onSubmit(payload);
    } catch {
      toast.error('حدث خطأ أثناء حفظ العرض');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-surface-container rounded-2xl border border-border-structural/80 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-structural/60 flex items-center justify-between shrink-0 bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FB8704]/25 to-[#0488F8]/25 border border-[#FB8704]/40 flex items-center justify-center text-[#FB8704]">
              <IoSparklesOutline size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                {mode === 'edit' ? 'تعديل عرض البروكر' : 'إضافة عرض بروكر جديد'}
              </h2>
              <p className="text-[11px] text-text-muted">
                أدخل صورة العرض، العنوان، الكابشن، رابط البروكر، والكود الترويجي إن وجد.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* AI Auto-Translation Toolbar */}
        <div className="px-6 py-2.5 bg-[#050E21] border-b border-border-structural flex flex-wrap items-center justify-between gap-3 text-xs">
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
              {autoTranslateEnabled ? 'مفعلة' : 'معطلة'}
            </button>
          </div>

          <button
            type="button"
            disabled={translatingAll}
            onClick={handleTranslateAllOfferFields}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-primary text-white text-xs font-bold shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="ترجمة العنوان والكابشن والشارة إلى الإنجليزية دفعة واحدة"
          >
            <IoSparklesOutline className={translatingAll ? 'animate-spin' : ''} />
            <span>{translatingAll ? 'جاري ترجمة كافة الحقول...' : '✨ ترجمة بيانات العرض للإنجليزية'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. صورة العرض / البنر */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
              <IoImageOutline className="text-[#FB8704]" size={15} />
              <span>صورة العرض / بنر البروكر (Image / Banner)</span>
            </label>

            <div className="space-y-3">
              {/* Image Preview or Upload placeholder */}
              {formData.image ? (
                <div className="relative rounded-xl overflow-hidden border border-border-structural bg-surface-container-lowest max-h-48 flex items-center justify-center group">
                  <img
                    src={formData.image}
                    alt="معاينة صورة العرض"
                    className="w-full h-44 object-cover object-center"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <IoCloudUploadOutline size={14} />
                      <span>تغيير الصورة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, image: '' }))}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <IoTrashOutline size={14} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border-2 border-dashed border-border-structural hover:border-[#FB8704] bg-surface-container-lowest text-center cursor-pointer transition-colors"
                >
                  <IoCloudUploadOutline className="mx-auto text-text-muted mb-2" size={32} />
                  <p className="text-xs font-bold text-text-primary mb-0.5">
                    {uploading ? 'جاري رفع الصورة...' : 'اضغط لاختيار صورة من جهازك'}
                  </p>
                  <p className="text-[11px] text-text-muted">يدعم صور البنرات وشعارات الوسطاء (PNG, JPG, WEBP)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Or Direct Image URL */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="أو الصق رابط الصورة مباشرة هنا (https://...)"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none dir-ltr"
                />
                {formData.image && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 shrink-0 font-bold">
                    <IoCheckmarkCircle size={14} />
                    <span>تم تحديد الصورة</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. اسم البروكر + الشارة الترويجية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                اسم البروكر / الشريك (Broker Name)
              </label>
              <input
                type="text"
                name="partnerName"
                value={formData.partnerName}
                onChange={handleChange}
                placeholder="مثال: XM Global أو YWO Markets"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
              />
              {/* Quick broker tags */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POPULAR_BROKERS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, partnerName: b }))}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      formData.partnerName === b
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface-container-lowest border-border-structural/60 text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-text-primary">
                  شارة العرض (Badge - عربي / إنجليزي)
                </label>
                <div className="flex items-center gap-1.5">
                  {translatingFields.badgeEn && (
                    <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة...</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleManualTranslate(formData.badgeAr, 'badgeEn')}
                    className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    ترجمة
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="badgeAr"
                  value={formData.badgeAr}
                  onChange={(e) => handleArabicChange('badgeAr', 'badgeEn', e.target.value)}
                  placeholder="مثال: بونص 100% 🔥"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
                />
                <input
                  type="text"
                  name="badgeEn"
                  value={formData.badgeEn}
                  onChange={handleChange}
                  placeholder="Badge (EN)"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none dir-ltr"
                />
              </div>
            </div>
          </div>

          {/* 3. عنوان العرض (Title) - عربي وإنجليزي */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary">
                عنوان العرض الرئيسي (عربي) *
              </label>
              <div className="flex items-center gap-1.5">
                {translatingFields.titleEn && (
                  <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة للإنجليزية...</span>
                )}
                <button
                  type="button"
                  onClick={() => handleManualTranslate(formData.titleAr, 'titleEn')}
                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                >
                  ترجمة للإنجليزية
                </button>
              </div>
            </div>
            <input
              type="text"
              name="titleAr"
              value={formData.titleAr}
              onChange={(e) => handleArabicChange('titleAr', 'titleEn', e.target.value)}
              placeholder="مثال: بونص ترحيبي مضاعف 100% حتى 500$ مجاناً"
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural text-xs sm:text-sm font-bold text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
              required
            />

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                العنوان بالإنجليزية (English Title - يُترجم تلقائياً):
              </label>
              <input
                type="text"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleChange}
                placeholder="Offer title in English"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none dir-ltr"
              />
            </div>
          </div>

          {/* 4. كابشن / وصف العرض (Caption / Description) - عربي وإنجليزي */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary">
                كابشن / تفاصيل العرض (عربي) *
              </label>
              <div className="flex items-center gap-1.5">
                {translatingFields.subtitleEn && (
                  <span className="text-[10px] text-accent animate-pulse font-bold">جاري الترجمة للإنجليزية...</span>
                )}
                <button
                  type="button"
                  onClick={() => handleManualTranslate(formData.subtitleAr, 'subtitleEn')}
                  className="text-[10px] text-primary hover:underline font-bold cursor-pointer"
                >
                  ترجمة للإنجليزية
                </button>
              </div>
            </div>
            <textarea
              name="subtitleAr"
              rows={2}
              value={formData.subtitleAr}
              onChange={(e) => handleArabicChange('subtitleAr', 'subtitleEn', e.target.value)}
              placeholder="اكتب هنا كابشن توضيحي لمميزات وتفاصيل العرض والشروط للمتداول..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none leading-relaxed resize-none"
              required
            />

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                الكابشن بالإنجليزية (English Caption - يُترجم تلقائياً):
              </label>
              <textarea
                name="subtitleEn"
                rows={2}
                value={formData.subtitleEn}
                onChange={handleChange}
                placeholder="Offer details and terms caption in English..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none leading-relaxed resize-none dir-ltr"
              />
            </div>
          </div>

          {/* 5. لينك العرض + الكود الترويجي */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                <IoLinkOutline className="text-primary" size={15} />
                <span>رابط العرض لدى البروكر (Broker Link) *</span>
              </label>
              <input
                type="url"
                name="ctaLink"
                value={formData.ctaLink}
                onChange={handleChange}
                placeholder="https://portal.broker.com/register?ref=..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none dir-ltr"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                <IoPricetagOutline className="text-[#00F0FF]" size={15} />
                <span>الكود الترويجي (Promo Code - اختياري)</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="مثال: KTW63 (اتركه فارغاً إن لم يوجد)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural text-xs font-mono font-bold text-[#00F0FF] placeholder:text-text-muted/60 focus:border-primary focus:outline-none dir-ltr uppercase"
              />
            </div>
          </div>

          {/* نص الزر والخيارات الإضافية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                نص زر التفعيل (CTA Button Text)
              </label>
              <input
                type="text"
                name="ctaTextAr"
                value={formData.ctaTextAr}
                onChange={handleChange}
                placeholder="فتح حساب وتفعيل العرض"
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4 self-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-secondary select-none">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="rounded border-border-structural text-[#FB8704] focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>عرض مميز 🔥</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-text-secondary select-none">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded border-border-structural text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span>تفعيل ونشر فوراً</span>
              </label>
            </div>
          </div>

          {/* ── Live Card Preview ── */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-border-structural/60">
            <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted mb-3">
              <IoEyeOutline size={15} />
              <span>معاينة فورية لشكل البطاقة في الموقع:</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#06142F] border border-[#12315C] max-w-sm mx-auto shadow-xl">
              {formData.image && (
                <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#01071E]">
                  <img
                    src={formData.image}
                    alt="معاينة"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FB8704]/20 border border-[#FB8704]/40 text-[#FB8704]">
                  {formData.badgeAr || 'عرض حصري'}
                </span>
                <span className="text-[11px] font-mono text-[#687287] font-bold">
                  {formData.partnerName || 'Broker'}
                </span>
              </div>

              <h4 className="text-sm font-black text-white mb-1.5 leading-snug">
                {formData.titleAr || 'عنوان العرض الترويجي'}
              </h4>

              <p className="text-xs text-[#A7AFBF] mb-3 line-clamp-3 leading-relaxed">
                {formData.subtitleAr || 'هنا يظهر كابشن وتفاصيل العرض الخاصة بالبروكر والشروط...'}
              </p>

              {formData.code && (
                <div className="mb-3 p-2 rounded-lg bg-[#01071E] border border-dashed border-[#FB8704]/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#687287] font-bold">الكود الترويجي:</span>
                  <span className="font-mono font-black text-[#00F0FF]">{formData.code}</span>
                </div>
              )}

              <div className="w-full py-2 rounded-lg bg-gradient-to-r from-[#FB8704] to-[#FA5A04] text-white text-xs font-bold text-center">
                {formData.ctaTextAr || 'فتح حساب وتفعيل العرض'}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-border-structural/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:from-[#FA5A04] hover:to-[#FB8704] shadow-md shadow-[#FB8704]/20 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <IoCheckmarkCircle size={16} />
              <span>{submitting ? 'جاري الحفظ...' : mode === 'edit' ? 'حفظ التعديلات' : 'إضافة العرض الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
