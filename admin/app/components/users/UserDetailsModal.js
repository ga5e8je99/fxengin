'use client';

import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import {
  getUserById,
  getUserSessions,
  revokeUserSessions,
  getRoleConfig,
  getExperienceConfig,
  formatUserDate,
} from '../../services/usersService';
import { toast } from 'react-toastify';
import {
  HiOutlineShieldCheck,
  HiOutlineDeviceMobile,
  HiOutlineKey,
  HiOutlineRefresh,
  HiOutlineLogout,
  HiOutlineClipboardCopy,
} from 'react-icons/hi';

export default function UserDetailsModal({
  isOpen,
  onClose,
  userId,
}) {
  const [userDetails, setUserDetails] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  const fetchData = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const [userRes, sessionsRes] = await Promise.all([
        getUserById(userId),
        getUserSessions(userId),
      ]);

      if (userRes.ok && userRes.data) {
        setUserDetails(userRes.data);
      }
      if (sessionsRes.ok && Array.isArray(sessionsRes.data)) {
        setSessions(sessionsRes.data);
      } else if (userRes.ok && Array.isArray(userRes.data?.sessions)) {
        setSessions(userRes.data.sessions);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء جلب بيانات المستخدم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
    } else {
      setUserDetails(null);
      setSessions([]);
    }
  }, [isOpen, userId]);

  const handleRevokeAllSessions = async () => {
    if (!confirm('هل أنت متأكد من تسجيل خروج المستخدم من كافة الأجهزة فوراً؟')) {
      return;
    }
    setIsRevoking(true);
    try {
      const res = await revokeUserSessions(userId);
      if (res.ok) {
        toast.success('تم إبطال جميع الجلسات النشطة للمستخدم بنجاح');
        fetchData();
      } else {
        toast.error(res.data?.message || 'فشل في إبطال الجلسات');
      }
    } catch {
      toast.error('خطأ غير متوقع أثناء إبطال الجلسات');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyText = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`تم نسخ ${label} إلى الحافظة`);
    }
  };

  if (!isOpen) return null;

  const user = userDetails?.user || userDetails;
  const roleCfg = user ? getRoleConfig(user.role) : null;
  const expCfg = user ? getExperienceConfig(user.experienceLevel) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="الملف التفصيلي للمستخدم والأدلة الأمنية"
      subtitle={`فحص نشاط الحساب والجلسات النشطة للمستخدم: ${user?.fullName || user?.email || userId}`}
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#A7AFBF]">جاري فحص السجلات الأمنية...</span>
        </div>
      ) : !user ? (
        <div className="py-8 text-center text-[#A7AFBF]">
          تعذر العثور على بيانات المستخدم المطلوبة.
        </div>
      ) : (
        <div className="space-y-5 text-xs sm:text-sm">
          {/* Top Profile Summary Card */}
          <div className="p-4 rounded-2xl bg-[#06142F] border border-[#12315C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#12315C] border border-[#0488F8]/40 flex items-center justify-center text-lg font-bold text-[#0488F8] shrink-0">
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="text-base font-bold text-[#F5F7FA]">
                  {user.fullName || 'مستخدم بدون اسم'}
                </h4>
                <div className="flex items-center gap-1.5 text-xs text-[#A7AFBF] mt-0.5 dir-ltr">
                  <span className="font-mono text-[#0488F8]">{user.id}</span>
                  <button
                    onClick={() => copyText(user.id, 'معرف الحساب')}
                    className="hover:text-white"
                    title="نسخ المعرف"
                  >
                    <HiOutlineClipboardCopy />
                  </button>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {roleCfg && (
                <span
                  style={{
                    backgroundColor: roleCfg.bgColor,
                    color: roleCfg.color,
                    borderColor: roleCfg.borderColor,
                  }}
                  className="px-2.5 py-1 rounded-full text-xs font-bold border"
                >
                  {roleCfg.labelAr}
                </span>
              )}
              {user.isActive ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30">
                  حساب نشط
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
                  حساب معلق
                </span>
              )}
            </div>
          </div>

          {/* User Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/60">
              <span className="text-[11px] text-[#A7AFBF] block">البريد الإلكتروني</span>
              <span className="font-mono text-[#F5F7FA] font-medium dir-ltr text-right block mt-0.5">
                {user.maskedEmail || user.email || '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/60">
              <span className="text-[11px] text-[#A7AFBF] block">رقم الهاتف</span>
              <span className="font-mono text-[#F5F7FA] font-medium dir-ltr text-right block mt-0.5">
                {user.maskedPhoneNumber || user.phoneNumber || '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/60">
              <span className="text-[11px] text-[#A7AFBF] block">مستوى الخبرة</span>
              <span className="text-[#F5F7FA] font-medium block mt-0.5">
                {expCfg?.labelAr || user.experienceLevel || '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/60">
              <span className="text-[11px] text-[#A7AFBF] block">إجمالي الجلسات التاريخية</span>
              <span className="text-[#F5F7FA] font-medium block mt-0.5 font-tabular">
                {userDetails?.totalSessionsLifetime ?? user.activeSessionsCount ?? 0} جلسة مسجلة
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/60">
              <span className="text-[11px] text-[#A7AFBF] block">تاريخ التسجيل بالمنصة</span>
              <span className="text-[#A7AFBF] font-mono text-[11px] block mt-0.5 dir-ltr text-right">
                {formatUserDate(user.createdAt)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/60">
              <span className="text-[11px] text-[#A7AFBF] block">آخر تحديث للملف</span>
              <span className="text-[#A7AFBF] font-mono text-[11px] block mt-0.5 dir-ltr text-right">
                {formatUserDate(user.updatedAt)}
              </span>
            </div>
          </div>

          {/* Sessions Forensics Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineDeviceMobile className="text-base text-[#0488F8]" />
                <h5 className="font-bold text-[#F5F7FA]">
                  الجلسات ورموز التجديد النشطة ({sessions.length})
                </h5>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchData}
                  className="p-1 rounded-lg bg-[#06142F] border border-[#12315C] text-[#A7AFBF] hover:text-white"
                  title="تحديث قائمة الجلسات"
                >
                  <HiOutlineRefresh className="text-sm" />
                </button>

                {sessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRevokeAllSessions}
                    disabled={isRevoking}
                    className="px-2.5 py-1 rounded-lg bg-[#FB8704]/15 border border-[#FB8704]/30 text-[#FB8704] hover:bg-[#FB8704]/25 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <HiOutlineLogout />
                    <span>{isRevoking ? 'جاري الإلغاء...' : 'تسجيل خروج إجباري'}</span>
                  </button>
                )}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#06142F]/40 border border-[#12315C]/40 text-center text-xs text-[#A7AFBF]">
                لا توجد جلسات نشطة حالياً لهذا الحساب.
              </div>
            ) : (
              <div className="rounded-xl border border-[#12315C] overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#06142F] text-[#A7AFBF] border-b border-[#12315C]">
                    <tr>
                      <th className="py-2.5 px-3">معرّف الجلسة</th>
                      <th className="py-2.5 px-3">تاريخ الإنشاء</th>
                      <th className="py-2.5 px-3">تاريخ الانتهاء</th>
                      <th className="py-2.5 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12315C]/30 bg-[#0A1B3D]/60 font-mono">
                    {sessions.map((sess) => (
                      <tr key={sess.id} className="hover:bg-[#06142F]">
                        <td className="py-2.5 px-3 text-[#F5F7FA] dir-ltr text-right">
                          {sess.id ? `${sess.id.slice(0, 14)}...` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#A7AFBF] dir-ltr text-right text-[11px]">
                          {formatUserDate(sess.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 text-[#A7AFBF] dir-ltr text-right text-[11px]">
                          {formatUserDate(sess.expiresAt)}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          {sess.isRevoked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F6465D]/15 text-[#F6465D]">
                              ملغاة (Revoked)
                            </span>
                          ) : sess.isExpired ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#A7AFBF]/15 text-[#A7AFBF]">
                              منتهية (Expired)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16C784]/15 text-[#16C784]">
                              فعالة (Active)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#12315C] flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white hover:bg-[#1A4278] transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
