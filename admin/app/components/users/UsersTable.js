'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  HiOutlineDotsVertical,
  HiOutlineEye,
  HiOutlinePencilAlt,
  HiOutlineShieldCheck,
  HiOutlineKey,
  HiOutlineTrash,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineLogout,
  HiOutlineClipboardCopy,
} from 'react-icons/hi';
import {
  getRoleConfig,
  getExperienceConfig,
  formatUserDate,
} from '../../services/usersService';
import { toast } from 'react-toastify';

export default function UsersTable({
  users = [],
  pagination = {},
  selectedIds = [],
  onSelectUser,
  onSelectAll,
  onPageChange,
  onLimitChange,
  isLoading = false,
  onInspectUser,
  onEditUser,
  onChangeRole,
  onChangeStatus,
  onResetPassword,
  onRevokeSessions,
  onDeleteUser,
  onBulkDelete,
}) {
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  const currentPage = pagination.page || 1;
  const limit = pagination.limit || 20;
  const totalItems = pagination.totalItems || 0;
  const totalPages = pagination.totalPages || 1;

  const isAllSelected =
    users.length > 0 && users.every((u) => selectedIds.includes(u.id));

  const copyToClipboard = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`تم نسخ ${label} إلى الحافظة`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-24 z-30 bg-[#0458EC] text-white p-3 sm:px-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs font-tabular">
              {selectedIds.length}
            </span>
            <span className="text-xs sm:text-sm font-bold">
              مستخدم تم تحديدهم للعمليات الجماعية
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkDelete(selectedIds)}
              className="px-3.5 py-1.5 rounded-xl bg-[#F6465D] hover:bg-[#D9384E] text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              type="button"
            >
              <HiOutlineTrash className="text-base" />
              <span>حذف جماعي آمن (Bulk Delete)</span>
            </button>
            <button
              onClick={() => onSelectAll(false)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs transition-all cursor-pointer"
              type="button"
            >
              إلغاء التحديد
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="surface-card overflow-hidden shadow-xl border border-[#12315C]">
        <div className="overflow-x-auto min-h-[360px]">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#06142F] text-[#A7AFBF] text-xs font-medium uppercase tracking-wider border-b border-[#12315C]/60 select-none">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0A1B3D] border-[#12315C] text-[#0488F8] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">المستخدم / الهوية المؤسسية</th>
                <th className="py-3.5 px-4">بيانات الاتصال</th>
                <th className="py-3.5 px-4">الرتبة والصلاحيات</th>
                <th className="py-3.5 px-4">مستوى الخبرة</th>
                <th className="py-3.5 px-4 text-center">الجلسات النشطة</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">تاريخ التسجيل</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#12315C]/30 text-xs sm:text-sm">
              {isLoading ? (
                // Table Skeleton
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="w-4 h-4 bg-[#12315C]/60 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#12315C]/60 shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 w-32 bg-[#12315C]/60 rounded" />
                          <div className="h-3 w-20 bg-[#12315C]/40 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="h-3 w-28 bg-[#12315C]/60 rounded" />
                        <div className="h-3 w-24 bg-[#12315C]/40 rounded" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-20 bg-[#12315C]/60 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-6 w-16 bg-[#12315C]/40 rounded-full" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-5 w-8 bg-[#12315C]/60 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-16 bg-[#12315C]/60 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-3 w-24 bg-[#12315C]/40 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-8 h-8 bg-[#12315C]/60 rounded-lg mx-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={9} className="py-16 text-center text-[#A7AFBF]">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#12315C]/40 flex items-center justify-center text-[#A7AFBF]">
                        <span className="material-symbols-outlined text-3xl">person_off</span>
                      </div>
                      <p className="text-sm font-semibold text-[#F5F7FA]">
                        لم يتم العثور على أي مستخدمين مطابقين
                      </p>
                      <p className="text-xs text-[#687287]">
                        يرجى تغيير شروط البحث أو مسح الفلاتر المطبقة
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const roleCfg = getRoleConfig(user.role);
                  const expCfg = getExperienceConfig(user.experienceLevel);
                  const isSelected = selectedIds.includes(user.id);
                  const isMenuOpen = openActionMenuId === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-[#06142F]/60 transition-colors ${
                        isSelected ? 'bg-[#0488F8]/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectUser(user.id, e.target.checked)}
                          className="w-4 h-4 rounded bg-[#0A1B3D] border-[#12315C] text-[#0488F8] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* User Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#12315C] bg-[#12315C]/60 flex items-center justify-center text-sm font-bold text-[#0488F8]">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-[#F5F7FA] truncate">
                              {user.fullName || 'مستخدم بدون اسم'}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-[#A7AFBF] dir-ltr">
                              <span className="font-mono text-[#0488F8]">
                                {user.id ? `${user.id.slice(0, 10)}...` : '—'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(user.id, 'معرّف الحساب')}
                                className="p-0.5 hover:text-white transition-colors"
                                title="نسخ المعرف CUID"
                                type="button"
                              >
                                <HiOutlineClipboardCopy className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-xs font-mono">
                          <span className="text-[#F5F7FA] dir-ltr text-left">
                            {user.maskedEmail || user.email || '—'}
                          </span>
                          <span className="text-[#687287] dir-ltr text-left">
                            {user.maskedPhoneNumber || user.phoneNumber || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          style={{
                            backgroundColor: roleCfg.bgColor,
                            color: roleCfg.color,
                            borderColor: roleCfg.borderColor,
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {roleCfg.icon}
                          </span>
                          <span>{roleCfg.labelAr}</span>
                        </span>
                      </td>

                      {/* Experience Level */}
                      <td className="py-3.5 px-4">
                        <span
                          style={{
                            backgroundColor: expCfg.bgColor,
                            color: expCfg.color,
                          }}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                        >
                          {expCfg.labelAr}
                        </span>
                      </td>

                      {/* Active Sessions Count */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => onInspectUser(user.id)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full text-xs font-tabular bg-[#12315C]/60 text-[#A7AFBF] hover:text-[#0488F8] hover:bg-[#12315C] transition-all cursor-pointer"
                          title="عرض جلسات الأمان للمستخدم"
                          type="button"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16C784]" />
                          <span>{user.activeSessionsCount ?? 0}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16C784] animate-pulse" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F6465D]" />
                            <span>معلق / موقوف</span>
                          </span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-xs text-[#A7AFBF] dir-ltr text-right">
                        {formatUserDate(user.createdAt)}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 px-4 text-center relative">
                        <div className="inline-block text-right">
                          <button
                            onClick={() =>
                              setOpenActionMenuId(isMenuOpen ? null : user.id)
                            }
                            className="w-8 h-8 rounded-lg bg-[#0A1B3D] border border-[#12315C] flex items-center justify-center text-[#A7AFBF] hover:text-white hover:border-[#0488F8] transition-all cursor-pointer"
                            type="button"
                            title="خيارات الإدارة"
                          >
                            <HiOutlineDotsVertical className="text-base" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenActionMenuId(null)}
                              />
                              <div className="absolute left-0 mt-2 w-56 bg-[#0A1B3D] border border-[#12315C] rounded-xl shadow-2xl p-1.5 z-50 text-xs text-right animate-in fade-in zoom-in-95">
                                {/* Inspect / Forensics */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onInspectUser(user.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#12315C] transition-colors text-right"
                                >
                                  <HiOutlineEye className="text-base text-[#0488F8]" />
                                  <span>الملف والجلسات الأمنية</span>
                                </button>

                                {/* Edit details */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onEditUser(user);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#12315C] transition-colors text-right"
                                >
                                  <HiOutlinePencilAlt className="text-base text-[#FB8704]" />
                                  <span>تعديل البيانات الشخصية</span>
                                </button>

                                {/* Change Role */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onChangeRole(user);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#12315C] transition-colors text-right"
                                >
                                  <HiOutlineShieldCheck className="text-base text-[#A855F7]" />
                                  <span>ترقية / تعديل الصلاحية</span>
                                </button>

                                {/* Toggle Status */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onChangeStatus(user);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#12315C] transition-colors text-right"
                                >
                                  {user.isActive ? (
                                    <>
                                      <HiOutlineBan className="text-base text-[#F6465D]" />
                                      <span>تجميد / إيقاف الحساب</span>
                                    </>
                                  ) : (
                                    <>
                                      <HiOutlineCheckCircle className="text-base text-[#16C784]" />
                                      <span>إعادة تنشيط الحساب</span>
                                    </>
                                  )}
                                </button>

                                {/* Reset Password */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onResetPassword(user);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#12315C] transition-colors text-right"
                                >
                                  <HiOutlineKey className="text-base text-[#FBBF24]" />
                                  <span>إعادة ضبط كلمة المرور</span>
                                </button>

                                {/* Revoke Sessions */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onRevokeSessions(user);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F5F7FA] hover:bg-[#12315C] transition-colors text-right"
                                >
                                  <HiOutlineLogout className="text-base text-[#FB8704]" />
                                  <span>إلغاء كافة الجلسات النشطة</span>
                                </button>

                                <div className="h-px bg-[#12315C]/60 my-1" />

                                {/* Delete User */}
                                <button
                                  onClick={() => {
                                    setOpenActionMenuId(null);
                                    onDeleteUser(user);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[#F6465D] hover:bg-[#F6465D]/15 transition-colors text-right font-bold"
                                >
                                  <HiOutlineTrash className="text-base" />
                                  <span>حذف الحساب نهائياً</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-[#06142F] border-t border-[#12315C]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#A7AFBF]">
          {/* Total & Page Size */}
          <div className="flex items-center gap-3">
            <span>
              عرض {totalItems > 0 ? (currentPage - 1) * limit + 1 : 0} -{' '}
              {Math.min(currentPage * limit, totalItems)} من أصل{' '}
              <strong className="text-[#F5F7FA] font-tabular">
                {totalItems.toLocaleString('en-US')}
              </strong>{' '}
              مستخدم
            </span>

            <div className="flex items-center gap-1.5">
              <span>لكل صفحة:</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="h-8 px-2 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1 dir-ltr">
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-2 py-1 rounded bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="الصفحة الأولى"
            >
              &laquo;
            </button>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              className="px-2.5 py-1 rounded bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="الصفحة السابقة"
            >
              &lsaquo;
            </button>

            {/* Page number pill */}
            <span className="px-3 py-1 rounded bg-[#0488F8] text-white font-bold font-tabular">
              {currentPage} / {totalPages || 1}
            </span>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              className="px-2.5 py-1 rounded bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="الصفحة التالية"
            >
              &rsaquo;
            </button>
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages || isLoading}
              className="px-2 py-1 rounded bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="الصفحة الأخيرة"
            >
              &raquo;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
