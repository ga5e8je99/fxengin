'use client';

import React, { useState } from 'react';
import Modal from '../Modal';
import { USER_ROLES, EXPERIENCE_LEVELS } from '../../services/usersService';
import { HiEye, HiEyeOff } from 'react-icons/hi';

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 'USER',
    experienceLevel: 'BEGINNER',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      return;
    }
    onSubmit(formData);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
    setShowPassword(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إضافة مستخدم / متداول جديد (User Provisioning)"
      subtitle="إنشاء حساب مؤسسي جديد وتعيين الصلاحيات ومستوى الخبرة"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        {/* Full Name */}
        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            الاسم الكامل الرسمي <span className="text-[#F6465D]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="مثال: طارق المنصور"
            className="w-full h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            البريد الإلكتروني <span className="text-[#F6465D]">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@fxengen.com"
            className="w-full h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] transition-all dir-ltr text-right"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            رقم الهاتف مع رمز الدولة (اختياري)
          </label>
          <input
            type="text"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="+966 50 123 4567"
            className="w-full h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] transition-all dir-ltr text-right"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[#A7AFBF] font-medium">
              كلمة المرور الأولية <span className="text-[#F6465D]">*</span> (8 أحرف على الأقل)
            </label>
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="text-xs text-[#0488F8] hover:underline"
            >
              توليد كلمة مرور قوية
            </button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••••••"
              className="w-full h-10 pr-3.5 pl-10 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A7AFBF] hover:text-white"
            >
              {showPassword ? <HiEyeOff className="text-base" /> : <HiEye className="text-base" />}
            </button>
          </div>
        </div>

        {/* Role & Experience Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#A7AFBF] mb-1.5 font-medium">
              الصلاحية / الرتبة (Role)
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              {Object.keys(USER_ROLES).map((k) => (
                <option key={k} value={k}>
                  {USER_ROLES[k].labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A7AFBF] mb-1.5 font-medium">
              مستوى الخبرة السوقية
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
        </div>

        {/* Footer Actions */}
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
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <span>حفظ وإنشاء المستخدم</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
