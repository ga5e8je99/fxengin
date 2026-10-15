'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Modal';
import {
  getCourseEnrollments,
  grantCourseEnrollment,
  revokeCourseEnrollment,
} from '../../services/coursesService';
import { toast } from 'react-toastify';
import {
  HiOutlineUserAdd,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

export default function CourseEnrollmentsModal({
  isOpen,
  onClose,
  course,
}) {
  const [enrollments, setEnrollments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [grantUserId, setGrantUserId] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    if (!course?.id) return;
    setIsLoading(true);
    try {
      const res = await getCourseEnrollments(course.id, {
        search: searchTerm.trim() || undefined,
        page: 1,
        limit: 50,
      });
      if (res.ok) {
        setEnrollments(Array.isArray(res.data) ? res.data : res.data?.items || []);
      } else {
        // graceful empty state
        setEnrollments([]);
      }
    } catch {
      toast.error('تعذر جلب قائمة الطلاب المسجلين');
    } finally {
      setIsLoading(false);
    }
  }, [course?.id, searchTerm]);

  useEffect(() => {
    if (isOpen && course?.id) {
      fetchEnrollments();
    } else {
      setEnrollments([]);
      setGrantUserId('');
    }
  }, [isOpen, course?.id, fetchEnrollments]);

  const handleGrant = async (e) => {
    e.preventDefault();
    if (!grantUserId.trim()) return;

    setIsGranting(true);
    try {
      const res = await grantCourseEnrollment(course.id, {
        userId: grantUserId.trim(),
      });
      if (res.ok) {
        toast.success('تم منح الطالب صلاحية الوصول للكورس بنجاح');
        setGrantUserId('');
        fetchEnrollments();
      } else {
        toast.error(res.data?.message || 'فشل منح الوصول للكورس');
      }
    } catch {
      toast.error('حدث خطأ أثناء منح الوصول');
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevoke = async (userId, userName) => {
    if (!confirm(`هل أنت متأكد من سحب صلاحية الكورس من الطالب ${userName || userId}؟`)) {
      return;
    }
    try {
      const res = await revokeCourseEnrollment(course.id, userId);
      if (res.ok) {
        toast.success('تم سحب الاشتراك بنجاح');
        fetchEnrollments();
      } else {
        toast.error(res.data?.message || 'فشل سحب الاشتراك');
      }
    } catch {
      toast.error('حدث خطأ أثناء سحب الاشتراك');
    }
  };

  if (!isOpen || !course) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="سجل مشتريات واشتراكات الكورس"
      subtitle={`قائمة الطلاب والمشترين المسجلين في دورة: ${course.title}`}
      maxWidth="max-w-5xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Grant Form */}
        <form onSubmit={handleGrant} className="p-3.5 rounded-2xl bg-[#06142F] border border-[#12315C] space-y-2">
          <label className="block font-bold text-[#F5F7FA] text-xs">
            + منح طالب صلاحية الوصول للكورس يدوياً
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              required
              value={grantUserId}
              onChange={(e) => setGrantUserId(e.target.value)}
              placeholder="أدخل معرّف الطالب أو البريد الإلكتروني..."
              className="flex-1 h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs font-mono outline-none focus:border-[#0488F8] dir-ltr text-right"
            />
            <button
              type="submit"
              disabled={isGranting}
              className="px-4 h-10 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs flex items-center gap-1.5 shadow disabled:opacity-50"
            >
              <HiOutlineUserAdd className="text-base" />
              <span>{isGranting ? 'جاري المنح...' : 'منح الوصول'}</span>
            </button>
          </div>
        </form>

        {/* Search & Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7AFBF]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، البريد، كود الخصم، أو رقم العملية..."
              className="w-full h-9 pr-9 pl-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8]"
            />
          </div>

          <button
            type="button"
            onClick={fetchEnrollments}
            className="p-2 rounded-xl bg-[#06142F] border border-[#12315C] text-[#A7AFBF] hover:text-white"
            title="تحديث القائمة"
          >
            <HiOutlineRefresh />
          </button>
        </div>

        {/* Students Table */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#A7AFBF]">جاري تحميل قائمة المشترين...</span>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#06142F] border border-[#12315C] text-center text-xs text-[#A7AFBF] space-y-2">
            <HiOutlineAcademicCap className="text-3xl mx-auto opacity-50 text-[#0488F8]" />
            <p>لا يوجد مشترون أو طلاب مسجلون في هذا الكورس حتى الآن.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#12315C] overflow-x-auto">
            <table className="w-full text-right text-xs whitespace-nowrap">
              <thead className="bg-[#06142F] text-[#A7AFBF] border-b border-[#12315C]">
                <tr>
                  <th className="py-2.5 px-3">المشتري / الطالب</th>
                  <th className="py-2.5 px-3">المبلغ المدفوع</th>
                  <th className="py-2.5 px-3">طريقة الدفع</th>
                  <th className="py-2.5 px-3">كود الخصم</th>
                  <th className="py-2.5 px-3">تاريخ الشراء</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12315C]/40 bg-[#0A1B3D]/50">
                {enrollments.map((enr) => {
                  const studentName = enr.userName || enr.user?.fullName || 'طالب مسجل';
                  const studentEmail = enr.userEmail || enr.user?.email || '—';
                  const studentPhone = enr.userPhone || enr.user?.phoneNumber || '';
                  const paid = enr.paidAmount !== undefined && enr.paidAmount !== null ? Number(enr.paidAmount) : Number(course.price || 0);
                  const isFree = paid === 0;

                  return (
                    <tr key={enr.id} className="hover:bg-[#06142F]/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#F5F7FA]">
                            {studentName}
                          </span>
                          <span className="text-[11px] text-[#A7AFBF] font-mono dir-ltr text-right">
                            {studentEmail}
                          </span>
                          {studentPhone && (
                            <span className="text-[10.5px] text-[#0488F8] font-mono dir-ltr text-right">
                              {studentPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold text-xs ${isFree ? 'text-[#10B981]' : 'text-[#FB8704]'}`}>
                          {isFree ? 'مجاني' : `${paid} ${enr.currency || 'USDT'}`}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#12315C] text-[#F5F7FA] text-[11px] font-mono">
                          {enr.paymentMethod || (isFree ? 'مجاني' : 'USDT_TRC20')}
                        </span>
                        {enr.txId && (
                          <div className="text-[10px] text-[#A7AFBF] font-mono truncate max-w-[120px]" title={enr.txId}>
                            Tx: {enr.txId.slice(0, 8)}...
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {enr.couponCode ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] font-bold text-[11px] font-mono">
                            {enr.couponCode}
                            {enr.discountAmount > 0 && ` (-${enr.discountAmount})`}
                          </span>
                        ) : (
                          <span className="text-[#A7AFBF] text-[11px]">بدون خصم</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[#A7AFBF] dir-ltr text-right text-[11px]">
                        {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRevoke(enr.userId || enr.user?.id, studentName)}
                          className="px-2.5 py-1 rounded-lg bg-[#F6465D]/15 hover:bg-[#F6465D]/25 text-[#F6465D] font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors"
                          title="سحب صلاحية الكورس"
                        >
                          <HiOutlineTrash />
                          <span>سحب الاشتراك</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#12315C] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}
