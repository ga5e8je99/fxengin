'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import CloudUploadWidget from '../storage/CloudUploadWidget';
import { COURSE_DIFFICULTIES } from '../../services/coursesService';

export default function CreateEditCourseModal({
  isOpen,
  onClose,
  course = null,
  onSubmit,
  isSubmitting = false,
}) {
  const isEditing = Boolean(course);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    subtitle: '',
    description: '',
    thumbnailUrl: '',
    promoVideoUrl: '',
    price: 0,
    discountPrice: 0,
    accessTier: 'FREE',
    adminRating: 4.9,
    adminReviewCount: 50,
    releaseDate: new Date().toISOString().split('T')[0],
    difficulty: 'BEGINNER',
    category: 'Forex Basics',
    isPublished: false,
  });

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        slug: course.slug || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        thumbnailUrl: course.thumbnailUrl || '',
        promoVideoUrl: course.promoVideoUrl || '',
        price: Number(course.price) || 0,
        discountPrice: Number(course.discountPrice) || 0,
        accessTier: course.accessTier || 'FREE',
        adminRating: Number(course.adminRating) || 4.9,
        adminReviewCount: Number(course.adminReviewCount) || 50,
        releaseDate: course.releaseDate
          ? course.releaseDate.split('T')[0]
          : new Date().toISOString().split('T')[0],
        difficulty: course.difficulty || 'BEGINNER',
        category: course.category || 'Price Action & SMC',
        isPublished: Boolean(course.isPublished),
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        subtitle: '',
        description: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
        promoVideoUrl: '',
        price: 0,
        discountPrice: 0,
        accessTier: 'FREE',
        adminRating: 4.9,
        adminReviewCount: 25,
        releaseDate: new Date().toISOString().split('T')[0],
        difficulty: 'BEGINNER',
        category: 'Price Action & SMC',
        isPublished: false,
      });
    }
  }, [course, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      return;
    }

    const coursePrice = Number(formData.price) || 0;
    const payload = {
      ...formData,
      price: coursePrice,
      discountPrice: formData.discountPrice ? Number(formData.discountPrice) : undefined,
      accessTier: coursePrice > 0 ? (formData.accessTier && formData.accessTier !== 'FREE' ? formData.accessTier : 'ONE_TIME') : 'FREE',
      adminRating: formData.adminRating ? Number(formData.adminRating) : undefined,
      adminReviewCount: formData.adminReviewCount ? Number(formData.adminReviewCount) : undefined,
      releaseDate: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : undefined,
      slug: formData.slug.trim() ? formData.slug.trim() : undefined,
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'تعديل بيانات الدورة التدريبية' : 'إنشاء كورس تدريبي جديد'}
      subtitle={
        isEditing
          ? `تحديث الأسعار وتفاصيل الكورس: ${course.title}`
          : 'إدخال البيانات الكاملة للكورس وصورة الغلاف والفيديو الإعلاني'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Title & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              عنوان الكورس التدريبي <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: استراتيجيات صيد السيولة الذكية (SMC)"
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
            />
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              الاسم الرابطي (Slug) - اختياري
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="smc-order-flow-mastery"
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] font-mono dir-ltr text-right"
            />
          </div>
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-[#A7AFBF] mb-1 font-medium">
            عنوان فرعي مختصر (Subtitle)
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            placeholder="موجز يوضح ما يتعلمه المتداول في هذا الكورس"
            className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[#A7AFBF] mb-1 font-medium">
            الوصف الشامل للكورس والمحاور <span className="text-[#F6465D]">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="اكتب وصفاً مفصلاً للمحتوى التعليمي والمستهدفين..."
            className="w-full p-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] resize-none"
          />
        </div>

        {/* Media URLs: Thumbnail & Promo Video with Direct Cloud Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CloudUploadWidget
            value={formData.thumbnailUrl}
            onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
            folder="courses"
            label="صورة غلاف الكورس (Cover Image)"
            accept="image/*"
          />

          <CloudUploadWidget
            value={formData.promoVideoUrl}
            onChange={(url) => setFormData({ ...formData, promoVideoUrl: url })}
            folder="promo-videos"
            label="الفيديو الترويجي الإعلاني (Promo Teaser)"
            accept="video/*"
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              السعر بالدولار ($) <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="number"
              min={0}
              required
              value={formData.price}
              onChange={(e) => {
                const val = e.target.value;
                const num = Number(val);
                const updates = { price: val };
                if (num > 0 && formData.accessTier === 'FREE') {
                  updates.accessTier = 'ONE_TIME';
                } else if (num === 0) {
                  updates.accessTier = 'FREE';
                }
                setFormData({ ...formData, ...updates });
              }}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-tabular outline-none focus:border-[#0488F8]"
            />
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              السعر قبل الخصم (اختياري)
            </label>
            <input
              type="number"
              min={0}
              value={formData.discountPrice}
              onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-tabular outline-none focus:border-[#0488F8]"
            />
          </div>
        </div>

        {/* Difficulty, Category, Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              الفئة والمستوى <span className="text-[#F6465D]">*</span>
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full h-10 px-2.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] cursor-pointer"
            >
              {Object.keys(COURSE_DIFFICULTIES).map((k) => (
                <option key={k} value={k}>
                  {COURSE_DIFFICULTIES[k].labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              التصنيف الأكاديمي
            </label>
            <input
              type="text"
              list="category-options"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="مثال: سلوك السعر و SMC"
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
            />
            <datalist id="category-options">
              <option value="سلوك السعر و SMC" />
              <option value="التحليل الفني" />
              <option value="أساسيات الفوركس" />
              <option value="إدارة المخاطر" />
              <option value="التداول الخوارزمي و AI" />
              <option value="التحليل الأساسي" />
              <option value="الذهب والسلع" />
            </datalist>
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              تاريخ الإطلاق / النشر
            </label>
            <input
              type="date"
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
            />
          </div>
        </div>

        {/* Ratings & Publish checkbox */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              التقييم الأولي (1 إلى 5)
            </label>
            <input
              type="number"
              step="0.05"
              min={1}
              max={5}
              value={formData.adminRating}
              onChange={(e) => setFormData({ ...formData, adminRating: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-tabular outline-none focus:border-[#0488F8]"
            />
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              عدد التقييمات المعروض
            </label>
            <input
              type="number"
              min={0}
              value={formData.adminReviewCount}
              onChange={(e) => setFormData({ ...formData, adminReviewCount: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-tabular outline-none focus:border-[#0488F8]"
            />
          </div>

          <div className="pt-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="w-4 h-4 rounded bg-[#06142F] border-[#12315C] text-[#16C784] focus:ring-0 cursor-pointer"
              />
              <span className="font-bold text-[#F5F7FA]">
                نشر الكورس فوراً لجمهور المنصة
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#12315C] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>{isEditing ? 'حفظ التعديلات' : 'إنشاء الكورس'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
