'use client';

import React, { useState } from 'react';
import Modal from '../Modal';
import { USER_ROLES } from '../../services/usersService';
import { HiOutlineKey, HiOutlineClipboardCopy, HiOutlineTrash, HiOutlineExclamationCircle } from 'react-icons/hi';
import { toast } from 'react-toastify';

/**
 * 1. Update Status Modal (Suspend / Reactivate with Audit Reason)
 * PATCH /admin/users/{id}/status
 */
export function UpdateStatusModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isSubmitting = false,
}) {
  const [isActive, setIsActive] = useState(user ? !user.isActive : false);
  const [reason, setReason] = useState('');

  // Update defaults when user changes
  React.useEffect(() => {
    if (user) {
      setIsActive(!user.isActive);
      setReason('');
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(user.id, { isActive, reason });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isActive ? 'إعادة تنشيط الحساب' : 'تجميد / إيقاف الحساب'}
      subtitle={`تغيير الحالة التشغيلية للمستخدم ${user.fullName || user.email}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="p-3 rounded-xl bg-[#06142F] border border-[#12315C] flex items-center justify-between">
          <span className="text-[#A7AFBF]">الحالة الجديدة المقترحة:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isActive
                ? 'bg-[#16C784]/20 text-[#16C784] border border-[#16C784]/40'
                : 'bg-[#F6465D]/20 text-[#F6465D] border border-[#F6465D]/40'
            }`}
          >
            {isActive ? 'نشط (Active)' : 'موقوف / مجمد (Suspended)'}
          </span>
        </div>

        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            السبب الإداري / التدقيق الرقابي (Reason)
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: اشتباه في نشاط بوت تداول غير مصرح به، أو اكتمال التحقق من الهوية KYC..."
            className="w-full p-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] transition-all resize-none"
          />
        </div>

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
            className={`px-5 py-2 rounded-xl text-white font-bold transition-all shadow-md cursor-pointer ${
              isActive ? 'bg-[#16C784] hover:bg-[#12A86E]' : 'bg-[#F6465D] hover:bg-[#D9384E]'
            }`}
          >
            {isSubmitting ? 'جاري الحفظ...' : isActive ? 'تأكيد التنشيط' : 'تأكيد التجميد'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * 2. Update Role Modal (Elevate / Demote User Role)
 * PATCH /admin/users/{id}/role
 */
export function UpdateRoleModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isSubmitting = false,
}) {
  const [selectedRole, setSelectedRole] = useState(user?.role || 'USER');

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.role || 'USER');
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(user.id, { role: selectedRole });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ترقية / تعديل رتبة وصلاحيات المستخدم"
      subtitle={`خاص بالمسؤول الرئيسي (Super Admin Only) - المستخدم: ${user.fullName || user.email}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div className="p-3 rounded-xl bg-[#FB8704]/10 border border-[#FB8704]/30 text-xs text-[#FB8704] flex items-start gap-2">
          <HiOutlineExclamationCircle className="text-lg shrink-0 mt-0.5" />
          <span>
            تنبيه أمني: تغيير الصلاحيات إلى ADMIN أو SUPER_ADMIN يمنح المستخدم وصولاً كاملاً إلى لوحة تحكم المنظومة وإدارة السيرفرات.
          </span>
        </div>

        <div>
          <label className="block text-[#A7AFBF] mb-1.5 font-medium">
            اختر الرتبة الجديدة
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-sm outline-none focus:border-[#0488F8] cursor-pointer"
          >
            {Object.keys(USER_ROLES).map((k) => (
              <option key={k} value={k}>
                {USER_ROLES[k].labelAr} ({USER_ROLES[k].labelEn})
              </option>
            ))}
          </select>
        </div>

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
            className="px-5 py-2 rounded-xl bg-[#A855F7] hover:bg-[#9333EA] text-white font-bold transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? 'جاري التعديل...' : 'تحديث الرتبة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * 3. Reset Password Modal
 * POST /admin/users/{id}/reset-password
 */
export function ResetPasswordModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  isSubmitting = false,
  resetResult = null,
}) {
  const [generateRandom, setGenerateRandom] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setGenerateRandom(true);
      setNewPassword('');
    }
  }, [isOpen]);

  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!generateRandom && (!newPassword || newPassword.length < 8)) {
      toast.error('كلمة المرور يجب أن تكون 8 خانات على الأقل');
      return;
    }
    onSubmit(user.id, {
      generateRandom,
      newPassword: generateRandom ? undefined : newPassword,
    });
  };

  const copyPassword = (pwd) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(pwd);
      toast.success('تم نسخ كلمة المرور إلى الحافظة');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إعادة تعيين كلمة المرور إدارياً"
      subtitle={`خاص بالمسؤول الرئيسي - المستخدم: ${user.fullName || user.email}`}
      maxWidth="max-w-md"
    >
      {resetResult ? (
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-[#16C784]/15 border border-[#16C784]/30 text-center space-y-2">
            <h4 className="text-base font-bold text-[#16C784]">
              تمت إعادة تعيين كلمة المرور بنجاح!
            </h4>
            <p className="text-xs text-[#A7AFBF]">
              تم إبطال جميع جلسات الدخول السابقة للمستخدم كإجراء احترازي.
            </p>
          </div>

          {(resetResult.temporaryPassword || resetResult.newPassword) && (
            <div className="p-3 rounded-xl bg-[#06142F] border border-[#12315C] space-y-1">
              <span className="text-[11px] text-[#A7AFBF] block">كلمة المرور الجديدة:</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-[#F5F7FA] dir-ltr">
                  {resetResult.temporaryPassword || resetResult.newPassword}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyPassword(resetResult.temporaryPassword || resetResult.newPassword)
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#0488F8]/15 text-[#0488F8] hover:bg-[#0488F8]/25 flex items-center gap-1 font-bold text-xs"
                >
                  <HiOutlineClipboardCopy />
                  <span>نسخ</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#12315C] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#12315C] text-white font-bold hover:bg-[#1A4278]"
            >
              تم وإغلاق
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-[#F5F7FA]">
              <input
                type="radio"
                checked={generateRandom}
                onChange={() => setGenerateRandom(true)}
                className="w-4 h-4 text-[#0488F8] bg-[#06142F] border-[#12315C]"
              />
              <span>توليد كلمة مرور عشوائية فائقة الأمان تلقائياً (موصى به)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-[#F5F7FA]">
              <input
                type="radio"
                checked={!generateRandom}
                onChange={() => setGenerateRandom(false)}
                className="w-4 h-4 text-[#0488F8] bg-[#06142F] border-[#12315C]"
              />
              <span>تعيين كلمة مرور محددة يدوياً</span>
            </label>
          </div>

          {!generateRandom && (
            <div>
              <label className="block text-[#A7AFBF] mb-1.5 font-medium">
                كلمة المرور الجديدة (8 خانات على الأقل)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة..."
                className="w-full h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-mono text-sm outline-none focus:border-[#0488F8]"
              />
            </div>
          )}

          <p className="text-[11px] text-[#A7AFBF]">
            سيتم تشفير كلمة المرور عبر 12 جولة bcrypt، وسيتم تسجيل خروج المستخدم من كافة التطبيقات فوراً.
          </p>

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
              className="px-5 py-2 rounded-xl bg-[#FBBF24] hover:bg-[#E0A81E] text-[#00030D] font-bold transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'جاري إعادة الضبط...' : 'تنفيذ إعادة التعيين'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/**
 * 4. Delete Single User Modal
 * DELETE /admin/users/{id}
 */
export function DeleteUserModal({
  isOpen,
  onClose,
  user,
  onConfirm,
  isSubmitting = false,
}) {
  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="حذف حساب المستخدم نهائياً"
      subtitle="إجراء دائم لا يمكن التراجع عنه"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="p-4 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-center space-y-2">
          <HiOutlineTrash className="text-3xl text-[#F6465D] mx-auto" />
          <h4 className="text-sm font-bold text-[#F6465D]">
            هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟
          </h4>
          <p className="text-xs text-[#A7AFBF]">
            المستخدم: <strong className="text-[#F5F7FA]">{user.fullName || user.email}</strong>
            <br />
            (CUID: <span className="font-mono text-[11px] dir-ltr">{user.id}</span>)
          </p>
        </div>

        <p className="text-xs text-[#687287]">
          سيتم حذف بيانات الحساب وكافة الجلسات المرتبطة بشكل آمن مع الحفاظ على سجلات المعاملات المالية المكتملة للأغراض المحاسبية.
        </p>

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
            type="button"
            onClick={() => onConfirm(user.id)}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#F6465D] hover:bg-[#D9384E] text-white font-bold transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? 'جاري الحذف...' : 'نعم، احذف نهائياً'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 5. Bulk Delete Users Modal
 * POST /admin/users/bulk-delete
 */
export function BulkDeleteModal({
  isOpen,
  onClose,
  selectedIds = [],
  onConfirm,
  isSubmitting = false,
}) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="الحذف الجماعي الآمن للحسابات (Zero Leak Safe Decommissioning)"
      subtitle={`سيتم حذف ${selectedIds.length} حسابات دفعة واحدة بشكل نهائي`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="p-4 rounded-xl bg-[#F6465D]/15 border border-[#F6465D]/35 text-center space-y-2">
          <HiOutlineTrash className="text-4xl text-[#F6465D] mx-auto animate-bounce" />
          <h4 className="text-base font-bold text-[#F6465D]">
            تأكيد حذف {selectedIds.length} حساب نهائياً
          </h4>
          <p className="text-xs text-[#A7AFBF]">
            هذه العملية محمية ضد تسريب البيانات وستقوم بإلغاء جميع رموز التجديد وإزالة السجلات من المنظومة فوراً.
          </p>
        </div>

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
            type="button"
            onClick={() => onConfirm(selectedIds)}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#F6465D] hover:bg-[#D9384E] text-white font-bold transition-all shadow-md cursor-pointer"
          >
            {isSubmitting ? 'جاري الحذف الجماعي...' : `تأكيد حذف (${selectedIds.length}) مستخدم`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
