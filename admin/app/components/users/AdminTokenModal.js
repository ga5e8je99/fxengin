'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  adminLogin,
} from '../../services/usersService';
import { toast } from 'react-toastify';
import { HiOutlineKey, HiOutlineShieldCheck, HiOutlineLockClosed } from 'react-icons/hi';

export default function AdminTokenModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('token'); // 'token' | 'login'
  const [tokenInput, setTokenInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const currentToken = getAdminToken();
      setTokenInput(currentToken || '');
    }
  }, [isOpen]);

  const handleSaveToken = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      clearAdminToken();
      toast.info('تم إفراغ رمز التخويل Admin Token');
      onClose();
      return;
    }
    setAdminToken(tokenInput.trim());
    toast.success('تم حفظ رمز الوصول JWT بنجاح');
    onClose();
    if (onSuccess) onSuccess();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      const res = await adminLogin({ email, password });
      if (res.ok && res.data?.accessToken) {
        toast.success('تم تسجيل دخول المسؤول بنجاح');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.data?.message || 'فشل تسجيل دخول المسؤول');
      }
    } catch {
      toast.error('حدث خطأ غير متوقع أثناء تسجيل الدخول');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة مفتاح تخويل المسؤول (Admin Authorization)"
      subtitle="تكوين رمز JWT Access Token أو تسجيل الدخول بصلاحيات المسؤول"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Tabs */}
        <div className="flex rounded-xl bg-[#06142F] p-1 border border-[#12315C]">
          <button
            type="button"
            onClick={() => setActiveTab('token')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'token'
                ? 'bg-[#0488F8] text-white shadow'
                : 'text-[#A7AFBF] hover:text-white'
            }`}
          >
            إدخال رمز JWT مباشرة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-[#0488F8] text-white shadow'
                : 'text-[#A7AFBF] hover:text-white'
            }`}
          >
            تسجيل دخول إداري
          </button>
        </div>

        {activeTab === 'token' ? (
          <form onSubmit={handleSaveToken} className="space-y-3">
            <div>
              <label className="block text-[#A7AFBF] mb-1 font-medium">
                Bearer Token (JWT)
              </label>
              <textarea
                rows={4}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ألصق رمز الوصول هنا (Bearer eyJhbGci...)"
                className="w-full p-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-mono text-xs outline-none focus:border-[#0488F8] resize-none dir-ltr"
              />
            </div>

            <p className="text-[11px] text-[#687287]">
              يتم حفظ الرمز محلياً في متصفحك في <code className="text-[#0488F8]">localStorage</code> ويستخدم لتوثيق جميع طلبات واجهة المستخدم.
            </p>

            <div className="pt-3 border-t border-[#12315C] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  clearAdminToken();
                  setTokenInput('');
                  toast.info('تم مسح الرمز');
                }}
                className="text-[#F6465D] hover:underline text-xs"
              >
                مسح التوكن الحالي
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0488F8] text-white font-bold hover:bg-[#0370CE] shadow"
                >
                  حفظ التوكن
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-[#A7AFBF] mb-1 font-medium">
                بريد المسؤول الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fxengen.com"
                className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8] dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-[#A7AFBF] mb-1 font-medium">
                كلمة المرور الرئيسية للمسؤول
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
              />
            </div>

            <div className="pt-3 border-t border-[#12315C] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-[#0488F8] text-white font-bold hover:bg-[#0370CE] shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري التحقق...' : 'تسجيل الدخول واستخراج التوكن'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
