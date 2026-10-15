'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import CloudUploadWidget from '../storage/CloudUploadWidget';
import { STREAM_TYPES } from '../../services/liveService';
import { COURSE_ACCESS_TIERS } from '../../services/coursesService';
import { HiOutlineKey } from 'react-icons/hi';

export default function CreateEditLiveModal({
  isOpen,
  onClose,
  session = null,
  onSubmit,
  isSubmitting = false,
}) {
  const isEditing = Boolean(session);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    coverImage: '',
    streamType: 'HLS',
    streamUrl: '',
    streamKey: '',
    scheduledStartTime: new Date().toISOString().slice(0, 16),
    scheduledEndTime: '',
    minTier: 'FREE',
    isFree: true,
    isPaidCourse: false,
    price: 0,
    currency: 'USD',
    instructorName: 'ك. كريم زهران (كبير المحللين)',
    maxParticipants: 500,
  });

  useEffect(() => {
    if (session) {
      const isPaid = !session.isFree || Number(session.price) > 0;
      setFormData({
        title: session.title || '',
        slug: session.slug || '',
        description: session.description || '',
        coverImage: session.coverImage || '',
        streamType: session.streamType || 'HLS',
        streamUrl: session.streamUrl || '',
        streamKey: session.streamKey || '',
        scheduledStartTime: session.scheduledStartTime
          ? new Date(session.scheduledStartTime).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        scheduledEndTime: session.scheduledEndTime
          ? new Date(session.scheduledEndTime).toISOString().slice(0, 16)
          : '',
        minTier: session.minTier || 'FREE',
        isFree: session.isFree ?? !isPaid,
        isPaidCourse: isPaid,
        price: session.price ? Number(session.price) : 0,
        currency: session.currency || 'USD',
        instructorName: session.instructorName || 'ك. كريم زهران (كبير المحللين)',
        maxParticipants: session.maxParticipants || 500,
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        description: '',
        coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
        streamType: 'HLS',
        streamUrl: '',
        streamKey: `live_key_${Math.random().toString(36).substring(2, 12)}`,
        scheduledStartTime: new Date().toISOString().slice(0, 16),
        scheduledEndTime: '',
        minTier: 'FREE',
        isFree: true,
        isPaidCourse: false,
        price: 0,
        currency: 'USD',
        instructorName: 'ك. كريم زهران (كبير المحللين)',
        maxParticipants: 500,
      });
    }
  }, [session, isOpen]);

  const handleGenerateKey = () => {
    const newKey = `live_key_${Math.random().toString(36).substring(2, 10)}_${Date.now().toString(36)}`;
    setFormData((prev) => ({ ...prev, streamKey: newKey }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    const isPaid = Boolean(formData.isPaidCourse);
    const priceNum = isPaid ? Math.max(0, Number(formData.price) || 0) : 0;
    const participantsNum = Math.max(10, Number(formData.maxParticipants) || 500);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      minTier: formData.minTier || 'FREE',
      isFree: !isPaid,
      price: priceNum,
      currency: formData.currency || 'USD',
      instructorName: formData.instructorName?.trim() || 'ك. كريم زهران (كبير المحللين)',
      maxParticipants: participantsNum,
      streamType: formData.streamType || 'HLS',
      scheduledStartTime: new Date(formData.scheduledStartTime || Date.now()).toISOString(),
      ...(formData.scheduledEndTime ? { scheduledEndTime: new Date(formData.scheduledEndTime).toISOString() } : {}),
      ...(formData.coverImage?.trim() ? { coverImage: formData.coverImage.trim() } : {}),
      ...(formData.streamUrl?.trim() ? { streamUrl: formData.streamUrl.trim() } : {}),
      ...(formData.streamKey?.trim() ? { streamKey: formData.streamKey.trim() } : {}),
      ...(formData.slug?.trim() ? { slug: formData.slug.trim() } : {}),
    };

    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'تعديل بيانات جلسة البث المباشر' : 'جدولة جلسة بث مباشر جديدة'}
      subtitle={
        isEditing
          ? `تحديث توقيت ومفاتيح البث: ${session.title}`
          : 'إعداد استوديو البث، روابط RTMP/HLS، والتحكم في الحضور'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Title & Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              عنوان جلسة البث <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: تحليل مباشر لافتتاح السوق الأمريكي وحركة الذهب"
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
              placeholder="us-market-open-live"
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] font-mono dir-ltr text-right"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[#A7AFBF] mb-1 font-medium">
            شرح ومحاور البث والصفقات المستهدفة <span className="text-[#F6465D]">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="موجز عن الفرص والتحليلات التي سيتم مناقشتها مع الحضور..."
            className="w-full p-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] resize-none"
          />
        </div>

        {/* Cover Image with Cloud Upload */}
        <CloudUploadWidget
          value={formData.coverImage}
          onChange={(url) => setFormData({ ...formData, coverImage: url })}
          folder="live-covers"
          label="صورة غلاف جلسة البث (Cover Image)"
          accept="image/*"
        />

        {/* Stream Type & Stream URL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              نوع مصدر البث
            </label>
            <select
              value={formData.streamType}
              onChange={(e) => setFormData({ ...formData, streamType: e.target.value })}
              className="w-full h-10 px-2.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] cursor-pointer"
            >
              {Object.keys(STREAM_TYPES).map((k) => (
                <option key={k} value={k}>
                  {STREAM_TYPES[k].labelAr}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              رابط البث (HLS .m3u8 أو YouTube URL)
            </label>
            <input
              type="url"
              value={formData.streamUrl}
              onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
              placeholder="https://...m3u8 أو https://www.youtube.com/watch?v=..."
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-mono text-xs outline-none focus:border-[#0488F8] dir-ltr text-right"
            />
          </div>
        </div>

        {/* OBS Stream Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[#A7AFBF] font-medium">
              مفتاح البث لبرنامج OBS (Stream Key)
            </label>
            <button
              type="button"
              onClick={handleGenerateKey}
              className="text-xs text-[#0488F8] hover:underline flex items-center gap-1"
            >
              <HiOutlineKey />
              <span>توليد مفتاح بث جديد</span>
            </button>
          </div>
          <input
            type="text"
            value={formData.streamKey}
            onChange={(e) => setFormData({ ...formData, streamKey: e.target.value })}
            placeholder="live_key_..."
            className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-mono text-xs outline-none focus:border-[#0488F8] dir-ltr text-right"
          />
        </div>

        {/* Timing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              موعد بدء البث المجدول <span className="text-[#F6465D]">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={formData.scheduledStartTime}
              onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
            />
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              موعد الانتهاء التقديري (اختياري)
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledEndTime}
              onChange={(e) => setFormData({ ...formData, scheduledEndTime: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
            />
          </div>
        </div>

        {/* Instructor, Tier, Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              اسم المحاضر / المحلل
            </label>
            <input
              type="text"
              value={formData.instructorName}
              onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
            />
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              الحد الأدنى للباقة
            </label>
            <select
              value={formData.minTier}
              onChange={(e) => setFormData({ ...formData, minTier: e.target.value })}
              className="w-full h-10 px-2.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] cursor-pointer"
            >
              {Object.keys(COURSE_ACCESS_TIERS).map((k) => (
                <option key={k} value={k}>
                  {COURSE_ACCESS_TIERS[k].labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1 font-medium">
              أقصى عدد حضور
            </label>
            <input
              type="number"
              min={10}
              value={formData.maxParticipants}
              onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-tabular outline-none focus:border-[#0488F8]"
            />
          </div>
        </div>

        {/* Course Pricing & Access Type */}
        <div className="p-3.5 rounded-2xl bg-[#06142F]/90 border border-[#12315C] space-y-3">
          <div>
            <span className="font-bold text-[#F5F7FA] text-xs sm:text-sm block">
              تسعير الكورس المباشر وتصريح الدخول
            </span>
            <span className="text-[11px] text-[#A7AFBF]">
              حدد ما إذا كان هذا البث مجانياً للجميع أو كورس تدريبي مباشر مدفوع يتطلب كود دخول.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isPaidCourse: false, isFree: true }))}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !formData.isPaidCourse
                  ? 'bg-[#16C784]/20 border-[#16C784] text-[#16C784]'
                  : 'bg-[#0A1B3D] border-[#12315C] text-[#A7AFBF] hover:text-white'
              }`}
            >
              <span>متاح مجاناً للجميع</span>
            </button>

            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, isPaidCourse: true, isFree: false }))}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                formData.isPaidCourse
                  ? 'bg-[#FB8704]/20 border-[#FB8704] text-[#FB8704]'
                  : 'bg-[#0A1B3D] border-[#12315C] text-[#A7AFBF] hover:text-white'
              }`}
            >
              <span>كورس مباشر مدفوع (كود / تذكرة)</span>
            </button>
          </div>

          {formData.isPaidCourse && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#12315C]/60 animate-in fade-in duration-200">
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  سعر الكورس المباشر <span className="text-[#F6465D]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required={formData.isPaidCourse}
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="99.00"
                    className="w-full h-10 px-3 rounded-xl bg-[#03091E] border border-[#12315C] text-[#F5F7FA] font-tabular font-bold outline-none focus:border-[#FB8704]"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-[#A7AFBF] font-bold">
                    {formData.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  العملة المقبولة
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-[#03091E] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#FB8704] cursor-pointer"
                >
                  <option value="USD">USD ($ - دولار أمريكي)</option>
                  <option value="USDT">USDT (Tether)</option>
                  <option value="EUR">EUR (€ - يورو)</option>
                  <option value="SAR">SAR (ر.س - ريال سعودي)</option>
                  <option value="AED">AED (د.إ - درهم إماراتي)</option>
                  <option value="EGP">EGP (ج.م - جنيه مصري)</option>
                </select>
              </div>

              <div className="sm:col-span-2 text-[11px] text-[#FB8704] bg-[#FB8704]/10 p-2.5 rounded-xl border border-[#FB8704]/20 flex items-center gap-2">
                <span>يتم حجب البث تلقائياً عن غير المشتركين، ويتم إصدار كود دخول فريد لكل طالب بعد الدفع أونلاين، أو يمكنك توليد كود يدوياً من زر &quot;أكواد الدخول&quot;.</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#12315C] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white"
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
              <span>{isEditing ? 'حفظ التعديلات' : 'جدولة البث المباشر'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
