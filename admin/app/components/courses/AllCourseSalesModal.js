'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Modal';
import { getAllCourseEnrollments, revokeCourseEnrollment } from '../../services/coursesService';
import { toast } from 'react-toastify';
import {
  HiOutlineShoppingBag,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineTrash,
} from 'react-icons/hi';

export default function AllCourseSalesModal({ isOpen, onClose }) {
  const [sales, setSales] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSales = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllCourseEnrollments({
        search: searchTerm.trim() || undefined,
        page: 1,
        limit: 100,
      });
      if (res.ok && res.data) {
        setSales(res.data.enrollments || (Array.isArray(res.data) ? res.data : []));
      } else {
        setSales([]);
      }
    } catch {
      toast.error('تعذر جلب سجل مبيعات الكورسات');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isOpen) {
      fetchSales();
    }
  }, [isOpen, fetchSales]);

  const handleRevoke = async (courseId, userId, userName) => {
    if (!confirm(`هل أنت متأكد من سحب الاشتراك من ${userName}؟`)) return;
    try {
      const res = await revokeCourseEnrollment(courseId, userId);
      if (res.ok) {
        toast.success('تم سحب الاشتراك بنجاح');
        fetchSales();
      } else {
        toast.error(res.data?.message || 'فشل سحب الاشتراك');
      }
    } catch {
      toast.error('حدث خطأ أثناء سحب الاشتراك');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="سجل مبيعات واشتراكات الكورسات الشامل"
      subtitle="استعراض كافة عمليات شراء واشتراك الطلاب في جميع الكورسات مع تفاصيل الدفع والكوبونات"
      maxWidth="max-w-6xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Search & Refresh */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7AFBF]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، البريد، اسم الكورس، كود الخصم، أو رقم العملية..."
              className="w-full h-9 pr-9 pl-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8]"
            />
          </div>

          <button
            type="button"
            onClick={fetchSales}
            className="p-2 rounded-xl bg-[#06142F] border border-[#12315C] text-[#A7AFBF] hover:text-white"
            title="تحديث القائمة"
          >
            <HiOutlineRefresh />
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#A7AFBF]">جاري تحميل سجل المبيعات...</span>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#06142F] border border-[#12315C] text-center text-xs text-[#A7AFBF] space-y-2">
            <HiOutlineShoppingBag className="text-3xl mx-auto opacity-50 text-[#0488F8]" />
            <p>لا توجد عمليات شراء أو اشتراكات مسجلة حتى الآن.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#12315C] overflow-x-auto">
            <table className="w-full text-right text-xs whitespace-nowrap">
              <thead className="bg-[#06142F] text-[#A7AFBF] border-b border-[#12315C]">
                <tr>
                  <th className="py-2.5 px-3">المشتري</th>
                  <th className="py-2.5 px-3">الكورس المشترى</th>
                  <th className="py-2.5 px-3">المبلغ المدفوع</th>
                  <th className="py-2.5 px-3">طريقة الدفع</th>
                  <th className="py-2.5 px-3">كود الخصم</th>
                  <th className="py-2.5 px-3">تاريخ الشراء</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12315C]/40 bg-[#0A1B3D]/50">
                {sales.map((sale) => {
                  const paid = sale.paidAmount !== undefined && sale.paidAmount !== null ? Number(sale.paidAmount) : Number(sale.coursePrice || 0);
                  const isFree = paid === 0;

                  return (
                    <tr key={sale.id} className="hover:bg-[#06142F]/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#F5F7FA]">
                            {sale.userName}
                          </span>
                          <span className="text-[11px] text-[#A7AFBF] font-mono dir-ltr text-right">
                            {sale.userEmail}
                          </span>
                          {sale.userPhone && (
                            <span className="text-[10px] text-[#0488F8] font-mono dir-ltr text-right">
                              {sale.userPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-[#F5F7FA] max-w-[200px] truncate block" title={sale.courseTitle}>
                          {sale.courseTitle}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold text-xs ${isFree ? 'text-[#10B981]' : 'text-[#FB8704]'}`}>
                          {isFree ? 'مجاني' : `${paid} ${sale.currency || 'USDT'}`}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#12315C] text-[#F5F7FA] text-[11px] font-mono">
                          {sale.paymentMethod || (isFree ? 'مجاني' : 'USDT_TRC20')}
                        </span>
                        {sale.txId && (
                          <div className="text-[10px] text-[#A7AFBF] font-mono truncate max-w-[110px]" title={sale.txId}>
                            Tx: {sale.txId.slice(0, 8)}...
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {sale.couponCode ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] font-bold text-[11px] font-mono">
                            {sale.couponCode}
                            {sale.discountAmount > 0 && ` (-${sale.discountAmount})`}
                          </span>
                        ) : (
                          <span className="text-[#A7AFBF] text-[11px]">بدون خصم</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-[#A7AFBF] dir-ltr text-right text-[11px]">
                        {sale.enrolledAt ? new Date(sale.enrolledAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRevoke(sale.courseId, sale.userId, sale.userName)}
                          className="px-2 py-1 rounded-lg bg-[#F6465D]/15 hover:bg-[#F6465D]/25 text-[#F6465D] font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors"
                          title="سحب صلاحية الكورس"
                        >
                          <HiOutlineTrash />
                          <span>سحب</span>
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
