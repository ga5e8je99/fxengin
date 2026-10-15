'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import { EXPERIENCE_LEVELS } from '../../services/usersService';

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    experienceLevel: 'BEGINNER',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        experienceLevel: user.experienceLevel || 'BEGINNER',
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    onSubmit(user.id, formData);
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تعديل بيانات المستخدم الشخصية"
      subtitle={`تحديث بيانات الحساب للمستخدم ${user.fullName || user.email}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Full Name */}
        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            الاسم الكامل <span className="text-[#F6465D]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            رقم الهاتف
          </label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            className="w-full h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] transition-all dir-ltr text-right"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            مستوى الخبرة في التداول
          </label>
          <select
            value={formData.experienceLevel}
            onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
            className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
          >
            {Object.keys(EXPERIENCE_LEVELS).map((k) => (
              <option key={k} value={k}>
                {EXPERIENCE_LEVELS[k].labelAr}
              </option>
            ))}
          </select>
        </div>

        {/* Read-only notes */}
        <div className="p-3 rounded-xl bg-[#06142F]/60 border border-[#12315C]/50 text-xs text-[#A7AFBF] space-y-1">
          <p>
            • لتعديل الرتبة أو الصلاحيات، يرجى استخدام نافذة <strong>ترقية / تعديل الصلاحية</strong>.
          </p>
          <p>
            • لتعديل حالة الحساب (تجميد/تنشيط)، يرجى استخدام إجراء <strong>تغيير الحالة</strong>.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#12315C] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white hover:bg-[#1A4278] transition-all cursor-pointer"
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
                <span>جاري التحديث...</span>
              </>
            ) : (
              <span>حفظ التعديلات</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
