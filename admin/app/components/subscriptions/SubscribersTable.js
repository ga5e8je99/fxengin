'use client';

import React, { useState, useEffect } from 'react';
import { fetchAdminSubscribers } from '../../services/subscriptionsService';
import { toast } from 'react-toastify';

export default function SubscribersTable() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminSubscribers();
      if (res.success && Array.isArray(res.data)) {
        setSubscribers(res.data);
      } else {
        toast.error(res.error || 'فشل جلب المشتركين');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل سجل المشتركين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const filtered = subscribers.filter((sub) => {
    const name = sub.buyerName || sub.user?.fullName || '';
    const email = sub.buyerEmail || sub.user?.email || '';
    const phone = sub.buyerPhone || sub.user?.phoneNumber || '';
    const planName = sub.plan?.name || '';
    const txId = sub.txId || '';
    const coupon = sub.couponCode || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            نشط
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            قيد التأكيد
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
            منتهي
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            ملغي
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {status}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch (method?.toLowerCase()) {
      case 'usdt_trc20':
      case 'usdt':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            USDT (TRC20)
          </span>
        );
      case 'code':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
            كود تفعيل يدوي
          </span>
        );
      case 'support':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-purple-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block"></span>
            الدعم الفني
          </span>
        );
      default:
        return <span className="text-xs text-gray-400 font-mono">{method || '—'}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0A1B3D]/60 p-4 rounded-2xl border border-[#12315C]">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <input
            type="text"
            placeholder="بحث بالاسم، الإيميل، الهاتف، الباقة، TxID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#030B1E] border border-[#12315C] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FB8704] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#030B1E] border border-[#12315C] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB8704] transition-colors cursor-pointer"
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">النشطة (Active)</option>
            <option value="PENDING">قيد المراجعة (Pending)</option>
            <option value="EXPIRED">المنتهية (Expired)</option>
            <option value="CANCELLED">الملغاة (Cancelled)</option>
          </select>

          <button
            onClick={loadSubscribers}
            className="p-2 rounded-xl bg-[#030B1E] border border-[#12315C] text-gray-300 hover:text-white transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-[#0A1B3D]/40 rounded-2xl border border-[#12315C] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-[#0A1B3D] border-b border-[#12315C] text-gray-400 font-semibold">
                <th className="py-3.5 px-4">المشتري / المشترك</th>
                <th className="py-3.5 px-4">المجموعة المختارة</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">المبلغ المسدد</th>
                <th className="py-3.5 px-4">كود الخصم</th>
                <th className="py-3.5 px-4">معرف المعاملة (TxID)</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">تاريخ الاشتراك</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12315C]/60 text-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    <div className="inline-flex items-center gap-2">
                      <span className="animate-spin material-symbols-outlined text-[20px]">
                        progress_activity
                      </span>
                      <span>جارٍ تحميل سجل المبيعات والمشتركين...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    لا توجد اشتراكات مسجلة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const buyerName = sub.buyerName || sub.user?.fullName || 'مشترك مباشر';
                  const buyerEmail = sub.buyerEmail || sub.user?.email || '—';
                  const buyerPhone = sub.buyerPhone || sub.user?.phoneNumber || '—';

                  return (
                    <tr key={sub.id} className="hover:bg-[#12315C]/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{buyerName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{buyerEmail}</div>
                        {buyerPhone !== '—' && (
                          <div className="text-[10px] text-gray-500 font-mono">{buyerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="font-bold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                          style={{
                            backgroundColor: `${sub.plan?.highlightColor || '#FB8704'}20`,
                            color: sub.plan?.highlightColor || '#FB8704',
                            border: `1px solid ${sub.plan?.highlightColor || '#FB8704'}40`,
                          }}
                        >
                          {sub.plan?.name || 'مجموعة غير محددة'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getPaymentMethodBadge(sub.paymentMethod)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ${sub.paidAmount || sub.plan?.price || 0}
                      </td>
                      <td className="py-3 px-4">
                        {sub.couponCode ? (
                          <div className="inline-flex flex-col">
                            <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {sub.couponCode}
                            </span>
                            {sub.discountAmount > 0 && (
                              <span className="text-[10px] text-gray-400">
                                -${sub.discountAmount}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {sub.txId ? (
                          <span
                            className="font-mono text-[11px] text-blue-400 max-w-[120px] truncate block"
                            title={sub.txId}
                          >
                            {sub.txId.substring(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(sub.status)}</td>
                      <td className="py-3 px-4 text-gray-400 text-[11px] font-mono">
                        {new Date(sub.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
