'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { toast } from 'react-toastify';

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
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'USD',
    billingPeriod: 'MONTHLY',
    badge: '',
    highlightColor: '#FB8704',
    isActive: true,
    sortOrder: 1,
    featuresText: '',
    permissions: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        slug: plan.slug || '',
        description: plan.description || '',
        price: plan.price !== undefined ? plan.price : '',
        currency: plan.currency || 'USD',
        billingPeriod: plan.billingPeriod || 'MONTHLY',
        badge: plan.badge || '',
        highlightColor: plan.highlightColor || '#FB8704',
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        sortOrder: plan.sortOrder !== undefined ? plan.sortOrder : 1,
        featuresText: Array.isArray(plan.features) ? plan.features.join('\n') : '',
        permissions: Array.isArray(plan.permissions) ? plan.permissions : [],
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        currency: 'USD',
        billingPeriod: 'MONTHLY',
        badge: '',
        highlightColor: '#FB8704',
        isActive: true,
        sortOrder: 1,
        featuresText: '',
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
    if (!formData.name.trim() || !formData.slug.trim() || formData.price === '') {
      toast.error('يرجى ملء جميع الحقول الإلزامية (اسم المجموعة، المعرف الرابطي، السعر)');
      return;
    }

    setLoading(true);
    try {
      const featuresArray = formData.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim().toLowerCase(),
        description: formData.description.trim(),
        price: Number(formData.price),
        currency: formData.currency,
        billingPeriod: formData.billingPeriod,
        badge: formData.badge.trim() || null,
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
      subtitle="إدارة أسعار وصلاحيات ومميزات المجموعة المعروضة على الموقع والداشبورد"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-right" dir="rtl">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              اسم المجموعة <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: مجموعة الذهب (Gold VIP)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
            />
          </div>

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
        </div>

        {/* Pricing & Billing Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Badge & Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              شارة التميز (Badge نصي)
            </label>
            <input
              type="text"
              placeholder="مثال: الأكثر طلباً • نشط على الـAPI الآن"
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
              لون التمييز (Highlight Color)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.highlightColor}
                onChange={(e) => setFormData({ ...formData, highlightColor: e.target.value })}
                className="w-10 h-9 p-0.5 rounded-lg bg-[#030B1E] border border-[#12315C] cursor-pointer"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_COLORS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => setFormData({ ...formData, highlightColor: p.color })}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
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

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-[#A7AFBF] mb-1">
            وصف المجموعة
          </label>
          <input
            type="text"
            placeholder="مثال: المجموعة الأكثر طلباً لتحليلات وإشارات الذهب اللحظية وشارتات MT5..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-sm"
          />
        </div>

        {/* Features (Multi-line) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#A7AFBF]">
              المميزات وصلاحيات الوصول (اكتب كل ميزة في سطر مستقل)
            </label>
            <span className="text-[11px] text-gray-400">
              سطر جديد = علامة صح خضراء منفصلة
            </span>
          </div>
          <textarea
            rows={5}
            placeholder={`بث مباشر ولحظي لصفقات الذهب من الـAPI\nشارتات MT5 حية ملتقطة لحظة بلحظة\nمصفوفة إحداثيات الصفقة: دخول، TP1، TP2، ووقف الخسارة\nنماذج السيولة البنكية SMC: Order Blocks`}
            value={formData.featuresText}
            onChange={(e) => setFormData({ ...formData, featuresText: e.target.value })}
            className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors text-xs font-sans leading-relaxed"
          />
        </div>

        {/* Permissions Checkboxes */}
        <div>
          <label className="block text-xs font-semibold text-[#A7AFBF] mb-2">
            صلاحيات المنصة الممنوحة تلقائياً للمشترك
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#030B1E]/60 p-3 rounded-xl border border-[#12315C]/60 max-h-44 overflow-y-auto">
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

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#030B1E] border border-[#12315C]">
          <span className="text-xs font-medium text-[#F5F7FA]">
            حالة المجموعة على الموقع (نشطة ومتاحة للاشتراك)
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#12315C] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
          </label>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#12315C]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-[#12315C] transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#F59E0B] hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
          >
            {loading ? 'جارٍ الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إنشاء المجموعة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
