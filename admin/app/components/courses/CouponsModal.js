'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../Modal';
import {
  getCoupons,
  createCoupon,
  deleteCoupon,
} from '../../services/coursesService';
import { toast } from 'react-toastify';
import {
  HiOutlineTag,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineCheck,
} from 'react-icons/hi';

export default function CouponsModal({ isOpen, onClose }) {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minPurchase: 0,
    maxDiscount: '',
    maxUses: 100,
  });

  const fetchCouponsList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCoupons();
      if (res.ok && Array.isArray(res.data)) {
        setCoupons(res.data);
      } else {
        setCoupons([]);
      }
    } catch {
      toast.error('تعذر جلب قائمة أكواد الخصم');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCouponsList();
      setShowAddForm(false);
    }
  }, [isOpen, fetchCouponsList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.warn('يرجى إدخال كود الخصم');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        minPurchase: formData.minPurchase ? Number(formData.minPurchase) : 0,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        maxUses: formData.maxUses ? Number(formData.maxUses) : 100,
        isActive: true,
      };

      const res = await createCoupon(payload);
      if (res.ok) {
        toast.success(`تم إنشاء كود الخصم ${payload.code} بنجاح!`);
        setFormData({
          code: '',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minPurchase: 0,
          maxDiscount: '',
          maxUses: 100,
        });
        setShowAddForm(false);
        fetchCouponsList();
      } else {
        toast.error(res.data?.message || 'فشل إنشاء كود الخصم');
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (couponId, code) => {
    if (!confirm(`هل أنت متأكد من حذف كود الخصم "${code}"؟`)) return;

    try {
      const res = await deleteCoupon(couponId);
      if (res.ok) {
        toast.success(`تم حذف كود الخصم ${code} بنجاح`);
        fetchCouponsList();
      } else {
        toast.error(res.data?.message || 'فشل حذف الكود');
      }
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة أكواد الخصم والكوبونات"
      subtitle="إنشاء ومتابعة أكواد التخفيض المتاحة للمشترين في المتجر وصفحة الدفع"
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Top Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
          >
            <HiOutlinePlus className="text-base" />
            <span>{showAddForm ? 'إلغاء الإضافة' : '+ إنشاء كود خصم جديد'}</span>
          </button>

          <button
            type="button"
            onClick={fetchCouponsList}
            className="p-2 rounded-xl bg-[#06142F] border border-[#12315C] text-[#A7AFBF] hover:text-white"
            title="تحديث القائمة"
          >
            <HiOutlineRefresh />
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-2xl bg-[#06142F] border border-[#0488F8]/40 space-y-3"
          >
            <h4 className="font-bold text-[#F5F7FA] text-xs flex items-center gap-1.5">
              <HiOutlineTag className="text-[#0488F8]" />
              <span>بيانات كود الخصم الجديد:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A7AFBF] text-[11px] mb-1 font-semibold">
                  كود الخصم (Promo Code) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="مثال: FX30 أو VIP50"
                  className="w-full h-9 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs font-mono uppercase outline-none focus:border-[#0488F8]"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] text-[11px] mb-1 font-semibold">
                  نوع الخصم *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8]"
                >
                  <option value="PERCENTAGE">نسبة مئوية (%)</option>
                  <option value="FIXED">مبلغ ثابت (USDT)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A7AFBF] text-[11px] mb-1 font-semibold">
                  قيمة الخصم *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  placeholder="مثال: 20 أو 50"
                  className="w-full h-9 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs font-mono outline-none focus:border-[#0488F8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A7AFBF] text-[11px] mb-1 font-semibold">
                  الحد الأدنى للشراء (USDT)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minPurchase}
                  onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                  placeholder="0 (بدون حد)"
                  className="w-full h-9 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs font-mono outline-none focus:border-[#0488F8]"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] text-[11px] mb-1 font-semibold">
                  أقصى حد للخصم (USDT)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                  placeholder="اختياري (للنسب المئوية)"
                  className="w-full h-9 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs font-mono outline-none focus:border-[#0488F8]"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] text-[11px] mb-1 font-semibold">
                  أقصى عدد استخدامات
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="100"
                  className="w-full h-9 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] text-xs font-mono outline-none focus:border-[#0488F8]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-lg bg-[#12315C] text-[#A7AFBF] hover:text-white text-xs"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-white font-bold text-xs flex items-center gap-1 shadow disabled:opacity-50"
              >
                <HiOutlineCheck />
                <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ الكود وتفعيله'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Coupons Table */}
        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#A7AFBF]">جاري تحميل أكواد الخصم...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 rounded-xl bg-[#06142F] border border-[#12315C] text-center text-xs text-[#A7AFBF] space-y-2">
            <HiOutlineTag className="text-3xl mx-auto opacity-50 text-[#0488F8]" />
            <p>لا توجد أكواد خصم منشأة حالياً. اضغط على زر الإنشاء لإضافة أول كود.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#12315C] overflow-x-auto">
            <table className="w-full text-right text-xs whitespace-nowrap">
              <thead className="bg-[#06142F] text-[#A7AFBF] border-b border-[#12315C]">
                <tr>
                  <th className="py-2.5 px-3">الكود</th>
                  <th className="py-2.5 px-3">قيمة الخصم</th>
                  <th className="py-2.5 px-3">مرات الاستخدام</th>
                  <th className="py-2.5 px-3">الحد الأدنى</th>
                  <th className="py-2.5 px-3">الحالة</th>
                  <th className="py-2.5 px-3 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12315C]/40 bg-[#0A1B3D]/50">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#06142F]/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-xs text-[#0488F8] px-2 py-0.5 rounded-md bg-[#0488F8]/10 border border-[#0488F8]/30">
                        {c.code}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-bold text-[#F5F7FA]">
                      {c.discountType === 'PERCENTAGE' ? (
                        <span className="text-[#10B981]">{c.discountValue}% خصم</span>
                      ) : (
                        <span className="text-[#FB8704]">{c.discountValue} USDT</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[#A7AFBF]">
                      <span className="text-[#F5F7FA] font-bold">{c.usedCount}</span> / {c.maxUses || '∞'}
                    </td>

                    <td className="py-2.5 px-3 text-[#A7AFBF]">
                      {c.minPurchase ? `${c.minPurchase} USDT` : 'لا يوجد'}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${c.isActive ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F6465D]/15 text-[#F6465D]'}`}>
                        {c.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id, c.code)}
                        className="px-2.5 py-1 rounded-lg bg-[#F6465D]/15 hover:bg-[#F6465D]/25 text-[#F6465D] font-bold text-[11px] flex items-center gap-1 mx-auto transition-colors"
                        title="حذف الكود"
                      >
                        <HiOutlineTrash />
                        <span>حذف</span>
                      </button>
                    </td>
                  </tr>
                ))}
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
