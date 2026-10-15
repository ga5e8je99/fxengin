'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiSearch,
  FiRefreshCw,
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiEye,
  FiKey,
  FiFileText,
} from 'react-icons/fi';
import {
  fetchAdminOrders,
  approveAdminOrder,
  rejectAdminOrder,
} from '../../services/ordersService';

export default function PaymentsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    pendingCount: 0,
    underReviewCount: 0,
    paidCount: 0,
    failedCount: 0,
  });

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [generatedCodeData, setGeneratedCodeData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminOrders({
        status: statusFilter,
        search: searchQuery,
        limit: 50,
      });
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
        if (res.stats) {
          setStats(res.stats);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle Approve Order
  const handleApprove = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await approveAdminOrder(selectedOrder.id, { adminNotes });
      if (res.success) {
        toast.success(res.message || 'تم اعتماد السداد وتوليد كود التفعيل بنجاح!');
        setApproveModalOpen(false);
        setGeneratedCodeData(res);
        setSuccessModalOpen(true);
        loadOrders();
      } else {
        toast.error(res.message || 'فشل اعتماد الطلب');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Order
  const handleReject = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await rejectAdminOrder(selectedOrder.id, rejectionReason);
      if (res.success) {
        toast.info(res.message || 'تم رفض الطلب وإشعار العميل');
        setRejectModalOpen(false);
        setRejectionReason('');
        loadOrders();
      } else {
        toast.error(res.message || 'فشل رفض الطلب');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <FiClock size={13} />
            <span>قيد المراجعة والتحقق</span>
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FiCheckCircle size={13} />
            <span>مدفوع ومعتمد</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FiClock size={13} />
            <span>بانتظار السداد</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <FiXCircle size={13} />
            <span>مرفوض</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <FiDollarSign size={24} />
            </span>
            <span>إدارة الطلبات والمدفوعات (Payments Desk)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            مراجعة طلبات الدفع، واعتماد الإيصالات، وتوليد أكواد التفعيل الآمنة للطلاب.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition border border-slate-700/60"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Under Review */}
        <div
          onClick={() => setStatusFilter('UNDER_REVIEW')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'UNDER_REVIEW'
              ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">بانتظار الاعتماد</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <FiClock size={16} />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{stats.underReviewCount}</div>
          <div className="text-xs text-slate-400 mt-1">طلبات مرفوعة بإيصالات السداد</div>
        </div>

        {/* Paid */}
        <div
          onClick={() => setStatusFilter('PAID')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'PAID'
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">مدفوعة ومعتمدة</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FiCheckCircle size={16} />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{stats.paidCount}</div>
          <div className="text-xs text-slate-400 mt-1">تم إصدار أكواد التفعيل لها</div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-blue-500/15 border-blue-500/40 shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400">بانتظار السداد</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FiFileText size={16} />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{stats.pendingCount}</div>
          <div className="text-xs text-slate-400 mt-1">طلبات جديدة لم يرفع إيصالها</div>
        </div>

        {/* Failed */}
        <div
          onClick={() => setStatusFilter('FAILED')}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'FAILED'
              ? 'bg-rose-500/15 border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400">مرفوضة</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <FiXCircle size={16} />
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-2">{stats.failedCount}</div>
          <div className="text-xs text-slate-400 mt-1">إيصالات غير مطابقة</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'كافة الطلبات' },
            { key: 'UNDER_REVIEW', label: 'قيد المراجعة' },
            { key: 'PAID', label: 'معتمدة' },
            { key: 'PENDING', label: 'بانتظار الدفع' },
            { key: 'FAILED', label: 'مرفوضة' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.key
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث برقم الطلب، الإيميل، أو TxID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-orange-500/50"
          />
          <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">العميل</th>
                <th className="py-3.5 px-4">المنتج والنوع</th>
                <th className="py-3.5 px-4">المبلغ</th>
                <th className="py-3.5 px-4">طريقة السداد</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <FiRefreshCw className="animate-spin text-orange-500" size={18} />
                      <span>جاري تحميل بيانات الطلبات...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    لا توجد طلبات تطابق الفلتر الحالي.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition">
                    {/* Order Number */}
                    <td className="py-4 px-4 font-mono font-bold text-orange-400">
                      #{order.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-white">{order.user?.fullName || 'مشترك جديد'}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{order.user?.email || '—'}</div>
                      {order.user?.phoneNumber && (
                        <div className="text-slate-500 text-[10px]">{order.user.phoneNumber}</div>
                      )}
                    </td>

                    {/* Product */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-100">{order.productTitle}</div>
                      <div className="text-[10px] text-slate-500">
                        {order.productType === 'RECORDED_COURSE'
                          ? 'كورس مسجل'
                          : order.productType === 'LIVE_COURSE'
                          ? 'كورس مباشر'
                          : 'جروب VIP'}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-4 font-bold text-emerald-400">
                      {order.finalAmount} {order.currency}
                    </td>

                    {/* Payment Method & Proof */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-300">{order.paymentMethod}</div>
                      {order.txId && (
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]" title={order.txId}>
                          Tx: {order.txId}
                        </div>
                      )}
                      {order.paymentProofUrl && (
                        <a
                          href={order.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-0.5"
                        >
                          <FiExternalLink size={10} />
                          <span>عرض الإيصال</span>
                        </a>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">{getStatusBadge(order.status)}</td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-400 text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {order.status === 'UNDER_REVIEW' || order.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setApproveModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition flex items-center gap-1"
                              title="اعتماد وتوليد كود التفعيل"
                            >
                              <FiCheck size={12} />
                              <span>اعتماد</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setRejectModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
                              title="رفض الطلب"
                            >
                              <FiXCircle size={12} />
                              <span>رفض</span>
                            </button>
                          </>
                        ) : order.status === 'PAID' ? (
                          <div className="flex flex-col items-center">
                            {order.activationCodes?.[0] ? (
                              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                {order.activationCodes[0].displayPrefix}
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-400">تم الاعتماد</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {approveModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <span className="p-2 rounded-xl bg-emerald-500/10">
                <FiCheckCircle size={24} />
              </span>
              <h3 className="text-lg font-bold text-white">تأكيد اعتماد السداد وإصدار الكود</h3>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              أنت على وشك تأكيد استلام سداد الطلب رقم{' '}
              <strong className="text-orange-400">#{selectedOrder.orderNumber}</strong> للمشتري{' '}
              <strong className="text-white">{selectedOrder.user?.fullName}</strong> بمبلغ{' '}
              <strong className="text-emerald-400">
                {selectedOrder.finalAmount} {selectedOrder.currency}
              </strong>
              .
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div><strong>المنتج:</strong> {selectedOrder.productTitle}</div>
              <div><strong>وسيلة الدفع:</strong> {selectedOrder.paymentMethod}</div>
              {selectedOrder.txId && <div><strong>TxID:</strong> {selectedOrder.txId}</div>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ملاحظات الإدارة (اختياري):
              </label>
              <input
                type="text"
                placeholder="مثال: تم التأكد من وصول الحوالة بحساب بنك مصر"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                disabled={actionLoading}
                onClick={handleApprove}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black transition flex items-center gap-2"
              >
                {actionLoading && <FiRefreshCw className="animate-spin" size={14} />}
                <span>تأكيد السداد وتوليد الكود</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Showing Newly Issued Code */}
      {successModalOpen && generatedCodeData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-orange-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/20">
              <FiKey size={28} />
            </div>

            <h3 className="text-xl font-black text-white">تم توليد كود التفعيل بنجاح!</h3>
            <p className="text-xs text-slate-300">
              تم إرسال هذا الكود تلقائياً لبريد العميل الرسمي ({generatedCodeData.userEmail}). يمكنك أيضاً نسخه وإرساله له يدوياً إذا تواصل معك على تيليجرام أو واتساب:
            </p>

            <div className="bg-slate-950 border-2 border-dashed border-orange-500/60 rounded-xl p-4 my-2">
              <div className="text-[11px] font-bold text-slate-400 mb-1">كود التفعيل الفريد (Activation Code):</div>
              <div className="text-2xl font-black font-mono text-white tracking-widest selection:bg-orange-500">
                {generatedCodeData.activationCode}
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCodeData.activationCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                  toast.success('تم نسخ كود التفعيل للحافظة!');
                }}
                className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-black transition flex items-center gap-2 shadow-lg shadow-orange-500/20"
              >
                {copiedCode ? <FiCheck size={16} /> : <FiCopy size={16} />}
                <span>{copiedCode ? 'تم النسخ بنجاح!' : 'نسخ كود التفعيل'}</span>
              </button>

              <button
                onClick={() => setSuccessModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/10">
                <FiXCircle size={24} />
              </span>
              <h3 className="text-lg font-bold text-white">رفض طلب السداد</h3>
            </div>

            <p className="text-sm text-slate-300">
              سيتم تحويل حالة الطلب رقم <strong className="text-white">#{selectedOrder.orderNumber}</strong> إلى مرفوض وإرسال بريد رسمي للعميل بالسبب.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                سبب الرفض الموجه للعميل:
              </label>
              <textarea
                rows={3}
                placeholder="مثال: إيصال التحويل غير واضح، أو رقم المعاملة غير متطابق مع المبلغ..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition flex items-center gap-2"
              >
                {actionLoading && <FiRefreshCw className="animate-spin" size={14} />}
                <span>تأكيد الرفض</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
