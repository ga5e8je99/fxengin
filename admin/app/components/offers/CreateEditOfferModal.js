'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  IoCloseOutline,
  IoSparklesOutline,
  IoCheckmarkCircle,
  IoAddCircleOutline,
  IoTrashOutline,
} from 'react-icons/io5';

const CATEGORIES = [
  { id: 'bonus', labelAr: 'بونص تداول وإيداع', labelEn: 'Deposit Bonus' },
  { id: 'signals', labelAr: 'باقات التحليلات وإشارات VIP', labelEn: 'VIP Analytics & Signals' },
  { id: 'prop-firm', labelAr: 'شركات التمويل وتقييم الحسابات', labelEn: 'Prop Trading Firms' },
  { id: 'spread', labelAr: 'سبريد خام ECN وحسابات إسلامية', labelEn: 'ECN Raw Spreads' },
  { id: 'academy', labelAr: 'كورسات وأكاديمية FXENGIN', labelEn: 'Academy Courses' },
];

const COLOR_PRESETS = [
  { name: 'ذهبي / برتقالي', color: '#FB8704' },
  { name: 'أخضر زمردي', color: '#10B981' },
  { name: 'أزرق سماوي', color: '#00A3FF' },
  { name: 'أرجواني VIP', color: '#8B5CF6' },
  { name: 'أزرق المنصة', color: '#0488F8' },
  { name: 'أحمر عاجل', color: '#EF4444' },
];

export default function CreateEditOfferModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode = 'create',
}) {
  const [formData, setFormData] = useState({
    id: '',
    titleAr: '',
    titleEn: '',
    subtitleAr: '',
    subtitleEn: '',
    category: 'bonus',
    badgeAr: 'عرض حصري 🔥',
    badgeEn: 'Exclusive Offer 🔥',
    badgeColor: '#10B981',
    discount: 'بونص 100%',
    discountEn: '100% BONUS',
    code: '',
    partnerName: 'XM Global',
    ctaTextAr: 'تفعيل العرض',
    ctaTextEn: 'Claim Offer',
    ctaLink: '/register',
    isExternal: false,
    isFeatured: false,
    isActive: true,
    featuresAr: [''],
    featuresEn: [''],
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        id: initialData.id || '',
        titleAr: initialData.titleAr || '',
        titleEn: initialData.titleEn || '',
        subtitleAr: initialData.subtitleAr || '',
        subtitleEn: initialData.subtitleEn || '',
        category: initialData.category || 'bonus',
        badgeAr: initialData.badgeAr || 'عرض حصري 🔥',
        badgeEn: initialData.badgeEn || 'Exclusive Offer 🔥',
        badgeColor: initialData.badgeColor || '#10B981',
        discount: initialData.discount || '',
        discountEn: initialData.discountEn || '',
        code: initialData.code || '',
        partnerName: initialData.partnerName || 'FXENGIN',
        ctaTextAr: initialData.ctaTextAr || 'تفعيل العرض',
        ctaTextEn: initialData.ctaTextEn || 'Claim Offer',
        ctaLink: initialData.ctaLink || '/register',
        isExternal: Boolean(initialData.isExternal),
        isFeatured: Boolean(initialData.isFeatured),
        isActive: initialData.isActive !== false,
        featuresAr: Array.isArray(initialData.featuresAr) && initialData.featuresAr.length > 0
          ? initialData.featuresAr
          : [''],
        featuresEn: Array.isArray(initialData.featuresEn) && initialData.featuresEn.length > 0
          ? initialData.featuresEn
          : [''],
      });
    } else {
      setFormData({
        id: '',
        titleAr: '',
        titleEn: '',
        subtitleAr: '',
        subtitleEn: '',
        category: 'bonus',
        badgeAr: 'عرض حصري 🔥',
        badgeEn: 'Exclusive Offer 🔥',
        badgeColor: '#10B981',
        discount: 'بونص 100%',
        discountEn: '100% BONUS',
        code: '',
        partnerName: 'XM Global',
        ctaTextAr: 'تفعيل العرض',
        ctaTextEn: 'Claim Offer',
        ctaLink: '/register',
        isExternal: false,
        isFeatured: false,
        isActive: true,
        featuresAr: ['ميزة حصرية أولى', 'ميزة حصرية ثانية'],
        featuresEn: ['First exclusive perk', 'Second exclusive perk'],
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

  const handleFeatureChange = (lang, index, value) => {
    const key = lang === 'ar' ? 'featuresAr' : 'featuresEn';
    setFormData((prev) => {
      const arr = [...prev[key]];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  };

  const addFeature = (lang) => {
    const key = lang === 'ar' ? 'featuresAr' : 'featuresEn';
    setFormData((prev) => ({
      ...prev,
      [key]: [...prev[key], ''],
    }));
  };

  const removeFeature = (lang, index) => {
    const key = lang === 'ar' ? 'featuresAr' : 'featuresEn';
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titleAr.trim()) {
      toast.error('يرجى إدخال عنوان العرض باللغة العربية');
      return;
    }

    setSubmitting(true);
    try {
      const selectedCat = CATEGORIES.find((c) => c.id === formData.category);
      const payload = {
        ...formData,
        code: formData.code ? formData.code.toUpperCase().trim() : '',
        categoryLabelAr: selectedCat?.labelAr || 'عروض ترويجية',
        categoryLabelEn: selectedCat?.labelEn || 'Special Offers',
        featuresAr: formData.featuresAr.filter((f) => f && f.trim()),
        featuresEn: formData.featuresEn.filter((f) => f && f.trim()),
      };

      await onSubmit(payload);
    } catch {
      toast.error('حدث خطأ أثناء حفظ العرض');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-canvas-deep/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-surface-container border border-border-structural rounded-2xl shadow-2xl overflow-hidden my-8 select-none">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-structural/60 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FB8704]/10 text-[#FB8704]">
              <IoSparklesOutline size={20} />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary">
                {mode === 'create' ? 'إضافة عرض ترويجي جديد' : 'تعديل بيانات العرض'}
              </h3>
              <p className="text-xs text-text-muted">
                سيظهر هذا العرض في سيكشن الصفحة الرئيسية وصفحة العروض الترويجية (/offers).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <IoCloseOutline size={22} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Titles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                عنوان العرض (عربي) *
              </label>
              <input
                type="text"
                name="titleAr"
                value={formData.titleAr}
                onChange={handleChange}
                placeholder="مثال: بونص ترحيبي مضاعف 100% حتى $500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                عنوان العرض (إنجليزي)
              </label>
              <input
                type="text"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleChange}
                placeholder="100% Deposit Match Bonus Up to $500"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none dir-ltr"
              />
            </div>
          </div>

          {/* Row 2: Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                وصف موجز للعرض (عربي)
              </label>
              <textarea
                name="subtitleAr"
                value={formData.subtitleAr}
                onChange={handleChange}
                rows={2}
                placeholder="احصل على ضعف رصيدك وتداول برأس مال أكبر مع دخول حصري..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                وصف موجز (إنجليزي)
              </label>
              <textarea
                name="subtitleEn"
                value={formData.subtitleEn}
                onChange={handleChange}
                rows={2}
                placeholder="Double your trading capital upon deposit with lifetime entry..."
                className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs focus:border-primary focus:outline-none dir-ltr"
              />
            </div>
          </div>

          {/* Row 3: Category & Partner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                تصنيف العرض *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary text-xs sm:text-sm focus:border-primary focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.labelAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                اسم الشريك / الجهة المقدمة
              </label>
              <input
                type="text"
                name="partnerName"
                value={formData.partnerName}
                onChange={handleChange}
                placeholder="XM Global, FXENGIN VIP..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                الكود الترويجي (Coupon Code)
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="KTW63, GOLD30..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-[#00F0FF] font-mono font-bold placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none uppercase dir-ltr"
              />
            </div>
          </div>

          {/* Row 4: Badge & Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                نص الشارة (Badge)
              </label>
              <input
                type="text"
                name="badgeAr"
                value={formData.badgeAr}
                onChange={handleChange}
                placeholder="الأكثر طلباً 🔥 • بونص 100%"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                لون الشارة
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="badgeColor"
                  value={formData.badgeColor}
                  onChange={handleChange}
                  className="w-9 h-9 rounded-xl bg-transparent border border-border-structural cursor-pointer"
                />
                <div className="flex items-center gap-1">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, badgeColor: p.color }))}
                      style={{ backgroundColor: p.color }}
                      className="w-5 h-5 rounded-full border border-canvas-deep cursor-pointer"
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                نسبة أو قيمة الخصم
              </label>
              <input
                type="text"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="بونص 100% أو خصم 30%"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Row 5: CTA Action */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                نص الزر (عربي)
              </label>
              <input
                type="text"
                name="ctaTextAr"
                value={formData.ctaTextAr}
                onChange={handleChange}
                placeholder="تفعيل العرض وفتح الحساب"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                رابط الزر (URL) *
              </label>
              <input
                type="text"
                name="ctaLink"
                value={formData.ctaLink}
                onChange={handleChange}
                placeholder="https://... أو /register أو /analyses"
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-border-structural/80 text-text-primary placeholder:text-text-muted/60 text-xs sm:text-sm focus:border-primary focus:outline-none dir-ltr"
                required
              />
            </div>

            <div className="flex flex-col justify-end gap-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                <input
                  type="checkbox"
                  name="isExternal"
                  checked={formData.isExternal}
                  onChange={handleChange}
                  className="rounded text-primary focus:ring-0"
                />
                <span>رابط خارجي (يفتح في تبويب جديد)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="rounded text-accent-hover focus:ring-0"
                />
                <span>عرض مميز وبارز (Featured)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded text-bullish-up focus:ring-0"
                />
                <span>العرض نشط ومفعل للزوار</span>
              </label>
            </div>
          </div>

          {/* Row 6: Features Checklist (Arabic) */}
          <div className="space-y-2 border-t border-border-structural/60 pt-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary">
                مميزات وبنود العرض (باللغة العربية)
              </label>
              <button
                type="button"
                onClick={() => addFeature('ar')}
                className="text-xs text-primary font-bold flex items-center gap-1 hover:underline"
              >
                <IoAddCircleOutline size={16} />
                <span>إضافة بند</span>
              </button>
            </div>
            {formData.featuresAr.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={feat}
                  onChange={(e) => handleFeatureChange('ar', idx, e.target.value)}
                  placeholder={`بند الميزة #${idx + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-border-structural text-xs text-text-primary"
                />
                {formData.featuresAr.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature('ar', idx)}
                    className="p-1.5 text-text-muted hover:text-bearish-down"
                  >
                    <IoTrashOutline size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Modal Footer */}
          <div className="border-t border-border-structural/60 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:from-[#FA5A04] hover:to-[#FB8704] shadow-lg shadow-[#FB8704]/25 transition-all flex items-center gap-2"
            >
              {submitting ? (
                <span>جاري الحفظ...</span>
              ) : (
                <>
                  <IoCheckmarkCircle size={17} />
                  <span>{mode === 'create' ? 'إضافة العرض الآن' : 'حفظ التعديلات'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
