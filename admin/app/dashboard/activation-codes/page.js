'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  FiKey,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiCopy,
  FiCheck,
  FiTrash2,
  FiZap,
  FiSend,
  FiExternalLink,
} from 'react-icons/fi';
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';
import {
  fetchAdminActivationCodes,
  activateAdminActivationCode,
  revokeAdminActivationCode,
  regenerateAdminActivationCode,
  deleteAdminActivationCode,
} from '../../services/ordersService';

export default function ActivationCodesPage() {
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState({ unactivatedCount: 0, totalCodes: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedCode, setSelectedCode] = useState(null);
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [newCodeData, setNewCodeData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Audio alert and new order detection state
  const prevUnactivatedIdsRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  // تشغيل تنبيه صوتي مستمر لمدة 5 ثوانٍ بالضبط عند وصول مشترك جديد
  const playAlertSound5Seconds = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // تشغيل 5 نغمات جرس متتالية على مدار 5 ثوانٍ
      for (let i = 0; i < 5; i++) {
        const t = ctx.currentTime + i * 1.0;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // نغمة رنين جرس واضحة وراقية
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, t);
        osc1.frequency.exponentialRampToValueAtTime(1760, t + 0.18);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(587.33, t);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, t + 0.18);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.45, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + 0.9);
        osc2.stop(t + 0.9);
      }
    } catch (e) {
      console.warn('AudioContext playback error:', e);
    }
  };

  const loadCodes = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        const res = await fetchAdminActivationCodes({
          status: statusFilter,
          search: searchQuery,
          limit: 100,
        });
        if (res.success && Array.isArray(res.data)) {
          setCodes(res.data);
          if (res.stats) {
            setStats(res.stats);
          }

          // فحص إضافة أي طلب جديد غير مفعل وإطلاق التنبيه الصوتي فوراً
          const currentUnactivated = res.data.filter((c) => c.status === 'UNACTIVATED');
          const currentIds = new Set(currentUnactivated.map((c) => c.id));

          if (!isInitialLoadRef.current && prevUnactivatedIdsRef.current) {
            const newOrders = currentUnactivated.filter((c) => !prevUnactivatedIdsRef.current.has(c.id));
            if (newOrders.length > 0) {
              playAlertSound5Seconds();
              newOrders.forEach((o) => {
                toast.info(
                  `طلب تفعيل واشتراك جديد وصل للتو: ${o.user?.fullName || 'مشترك'} (#${o.order?.orderNumber || '—'})`,
                  { autoClose: 8000 }
                );
              });
            }
          }

          prevUnactivatedIdsRef.current = currentIds;
          isInitialLoadRef.current = false;
        } else {
          setCodes([]);
        }
      } catch (err) {
        console.error('Error fetching activation codes:', err);
        if (!isBackground) toast.error('حدث خطأ أثناء تحميل أكواد التفعيل');
      } finally {
        if (!isBackground) setLoading(false);
      }
    },
    [statusFilter, searchQuery]
  );

  useEffect(() => {
    loadCodes();
    // استطلاع دوري حي كل 6 ثوانٍ للتحقق التلقائي من أي طلبات جديدة
    const interval = setInterval(() => {
      loadCodes(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadCodes]);

  // تفعيل الطلب وإصدار الكود مباشرة
  const handleActivate = async (code) => {
    if (!code) return;
    setActionLoading(true);
    try {
      const res = await activateAdminActivationCode(code.id, 'تم التأكيد والاعتماد عبر الدعم الفني');
      if (res.success) {
        toast.success(res.message || 'تم اعتماد الطلب وتوليد كود التفعيل بنجاح!');
        setNewCodeData({
          code: res.activationCode || res.code || res.displayPrefix,
          orderNumber: res.orderNumber || code.order?.orderNumber,
          buyerName: code.user?.fullName,
          buyerEmail: code.user?.email,
          buyerPhone: code.user?.phoneNumber,
          buyerTelegram: code.user?.telegramHandle,
          productTitle: code.order?.productTitle,
        });
        setSuccessModalOpen(true);
        loadCodes();

        // تأكيد واحتساب عمولة الشريك التابع لهذا الطلب فورياً إن وُجد
        const orderNum = res.orderNumber || code.order?.orderNumber;
        if (orderNum) {
          let buyerName = code.user?.fullName || code.buyerName || '';
          let buyerEmail = code.user?.email || code.buyerEmail || '';
          let buyerPhone = code.user?.phoneNumber || code.buyerPhone || '';
          const notes = code.order?.customerNotes || code.customerNotes || '';
          if (notes) {
            const nameMatch = notes.match(/المشتري:\s*([^|\n-]+)/i);
            if (nameMatch && nameMatch[1]) buyerName = buyerName || nameMatch[1].trim();
            const phoneMatch = notes.match(/هاتف:\s*([^|\n-]+)/i);
            if (phoneMatch && phoneMatch[1]) buyerPhone = buyerPhone || phoneMatch[1].trim();
            const emailMatch = notes.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch && emailMatch[1]) buyerEmail = buyerEmail || emailMatch[1].trim();
          }

          fetch('/api/affiliates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'confirm_conversion_by_order',
              orderNumber: orderNum,
              buyerEmail,
              buyerId: code.userId || code.user?.id,
              buyerName,
              buyerPhone,
              orderAmount: code.order?.finalAmount || code.order?.basePrice || 199,
              productTitle: code.order?.productTitle || 'دورة تدريبية',
            }),
          }).catch(console.warn);
        }
      } else {
        toast.error(res.message || 'فشل تفعيل الطلب');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setActionLoading(false);
    }
  };

  // حذف نهائي من قاعدة البيانات
  const handleDelete = async () => {
    if (!selectedCode) return;
    setActionLoading(true);
    try {
      const res = await deleteAdminActivationCode(selectedCode.id);
      if (res.success) {
        toast.success(res.message || 'تم حذف السجل وبياناته بالكامل من قاعدة البيانات بنجاح');
        setDeleteModalOpen(false);
        setSelectedCode(null);
        loadCodes();
      } else {
        toast.error(res.message || 'فشل حذف السجل');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حذف السجل');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedCode) return;
    setActionLoading(true);
    try {
      const res = await revokeAdminActivationCode(selectedCode.id, revokeReason);
      if (res.success) {
        toast.info(res.message || 'تم إلغاء كود التفعيل');
        setRevokeModalOpen(false);
        setRevokeReason('');
        loadCodes();
      } else {
        toast.error(res.message || 'فشل إلغاء الكود');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedCode) return;
    setActionLoading(true);
    try {
      const res = await regenerateAdminActivationCode(selectedCode.id, 'إعادة إصدار كود جديد');
      if (res.success) {
        toast.success(res.message || 'تم إعادة توليد الكود بنجاح');
        setRegenerateModalOpen(false);
        setNewCodeData({
          code: res.newCode,
          orderNumber: selectedCode.order?.orderNumber,
          buyerName: selectedCode.user?.fullName,
          buyerEmail: selectedCode.user?.email,
          buyerPhone: selectedCode.user?.phoneNumber,
          buyerTelegram: selectedCode.user?.telegramHandle,
          productTitle: selectedCode.order?.productTitle,
        });
        setSuccessModalOpen(true);
        loadCodes();
      } else {
        toast.error(res.message || 'فشل إعادة توليد الكود');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNACTIVATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/35 animate-pulse">
            <FiClock size={12} />
            <span>غير مفعل (بانتظار الدفع)</span>
          </span>
        );
      case 'ACTIVATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <FiCheckCircle size={12} />
            <span>مفعل (نشط)</span>
          </span>
        );
      case 'UNUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <FiKey size={12} />
            <span>كود جاهز للاستخدام</span>
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <FiXCircle size={12} />
            <span>ملغي ومحجوب</span>
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  // Helper to build WhatsApp message URL
  const getWhatsAppUrl = (phone, name, code, product) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = `مرحباً ${name || 'عزيزي المشترك'}،\nيسعدنا إبلاغك باعتماد سداد طلبك بنجاح في FXENGIN!\n\nالمنتج: ${product || 'الخدمة'}\nكود التفعيل الخاص بك: ${code}\n\nيمكنك تفعيل الكود والبدء بالدراسة عبر الرابط التالي:\nhttps://fxengen.com/activate\n\nنتمنى لك كل التوفيق!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-lg shadow-orange-500/10">
              <FiKey size={24} />
            </span>
            <span>خزينة أكواد التفعيل (Activation Codes Vault)</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            سجل كافة طلبات الشراء وأكواد التفعيل والتحقق من سداد المشتركين وتفعيل حساباتهم.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCodes}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700/60 shadow-sm cursor-pointer"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={15} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {[
            { key: 'ALL', label: 'كافة السجلات' },
            {
              key: 'UNACTIVATED',
              label: `غير مفعلة (${codes.filter((c) => c.status === 'UNACTIVATED').length})`,
              badge: true,
            },
            { key: 'ACTIVATED', label: 'تم تفعيلها' },
            { key: 'UNUSED', label: 'أكواد جاهزة' },
            { key: 'REVOKED', label: 'ملغية' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.key
                  ? tab.key === 'UNACTIVATED'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                    : 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="بحث بالاسم، الإيميل، الهاتف، أو الطلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-orange-500/50"
          />
          <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">بادئة الكود</th>
                <th className="py-3.5 px-4">بيانات العميل</th>
                <th className="py-3.5 px-4">المنتج والمبلغ</th>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">تاريخ الطلب</th>
                <th className="py-3.5 px-4">تاريخ التفعيل</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <FiRefreshCw className="animate-spin text-orange-500" size={18} />
                      <span>جاري تحميل السجلات والطلبات...</span>
                    </div>
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    لا توجد سجلات تطابق الفلتر الحالي.
                  </td>
                </tr>
              ) : (
                codes.map((code) => {
                  const isPending = code.status === 'UNACTIVATED';
                  return (
                    <tr
                      key={code.id}
                      className={`hover:bg-slate-800/30 transition ${
                        isPending ? 'bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      {/* Code Prefix */}
                      <td className="py-4 px-4 font-mono font-black tracking-wider">
                        {isPending ? (
                          <span className="text-amber-400 font-bold text-[11px] bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/25">
                            بانتظار الدفع
                          </span>
                        ) : (
                          <span className="text-orange-400">{code.displayPrefix}</span>
                        )}
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{code.user?.fullName || 'مشترك'}</span>
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                          {code.user?.email}
                        </div>
                        {/* Phone & Telegram Chips */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          {code.user?.phoneNumber && (
                            <a
                              href={`https://wa.me/${code.user.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/25 text-[10px] font-mono transition"
                              title="محادثة واتساب مباشرة"
                            >
                              <FaWhatsapp size={11} />
                              <span>{code.user.phoneNumber}</span>
                            </a>
                          )}
                          {code.user?.telegramHandle ? (
                            <a
                              href={`https://t.me/${code.user.telegramHandle.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/25 text-[10px] font-mono transition"
                              title="محادثة تيليجرام بالمعرف"
                            >
                              <FaTelegramPlane size={10} />
                              <span>{code.user.telegramHandle}</span>
                            </a>
                          ) : code.user?.phoneNumber ? (
                            <a
                              href={`https://t.me/+${code.user.phoneNumber.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/25 text-[10px] font-mono transition"
                              title="فتح محادثة تيليجرام عبر رقم الهاتف مباشرة"
                            >
                              <FaTelegramPlane size={10} />
                              <span>تيليجرام بالرقم</span>
                            </a>
                          ) : null}
                        </div>
                      </td>

                      {/* Product & Price */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-200">
                          {code.order?.productTitle || 'منتج معتمد'}
                        </div>
                        <div className="text-[11px] font-mono text-orange-400 font-bold mt-0.5">
                          {code.order?.finalAmount ? `${code.order.finalAmount} ${code.order?.currency || 'USDT'}` : '—'}
                        </div>
                      </td>

                      {/* Order Number */}
                      <td className="py-4 px-4 font-mono text-slate-300">
                        #{code.order?.orderNumber || '—'}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">{getStatusBadge(code.status)}</td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {new Date(code.createdAt).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Activated At */}
                      <td className="py-4 px-4 text-[11px]">
                        {code.activatedAt ? (
                          <span className="text-emerald-400 font-medium">
                            {new Date(code.activatedAt).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* If Unactivated or Unused: Activate Button */}
                          {(code.status === 'UNACTIVATED' || code.status === 'UNUSED') && (
                            <button
                              disabled={actionLoading}
                              onClick={() => handleActivate(code)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-black transition flex items-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                              title="تأكيد الدفع وتفعيل الكود فوراً"
                            >
                              <FiZap size={13} />
                              <span>تفعيل الكود</span>
                            </button>
                          )}

                          {/* Regenerate if already activated */}
                          {code.status === 'ACTIVATED' && (
                            <button
                              onClick={() => {
                                setSelectedCode(code);
                                setRegenerateModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition cursor-pointer"
                              title="إعادة إصدار كود جديد"
                            >
                              كود جديد
                            </button>
                          )}

                          {/* Revoke Button */}
                          {code.status !== 'REVOKED' && code.status !== 'UNACTIVATED' && (
                            <button
                              onClick={() => {
                                setSelectedCode(code);
                                setRevokeModalOpen(true);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition cursor-pointer"
                              title="إلغاء الكود"
                            >
                              إلغاء
                            </button>
                          )}

                          {/* Delete Button (Available for all records) */}
                          <button
                            onClick={() => {
                              setSelectedCode(code);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/25 text-[11px] transition cursor-pointer"
                            title="حذف نهائي للبيانات بالكامل من قاعدة البيانات"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Permanent Modal */}
      {deleteModalOpen && selectedCode && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <FiTrash2 size={24} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">حذف البيانات نهائياً من قاعدة البيانات</h3>
                <span className="text-[11px] text-rose-400 font-mono">Permanent Database Purge</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
              <strong>تحذير أمني:</strong> أنت على وشك إزالة وحذف هذا السجل وبيانات العميل والطلب بالكامل ونهائياً من قاعدة البيانات (PostgreSQL).
              <br />
              <span className="text-slate-400 mt-1 block">
                • العميل: {selectedCode.user?.fullName} ({selectedCode.user?.email})
                <br />
                • الطلب: #{selectedCode.order?.orderNumber || '—'}
              </span>
            </div>

            <p className="text-xs text-slate-300">
              لا يمكن التراجع عن هذا الإجراء إطلاقاً بعد التأكيد.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                disabled={actionLoading}
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {actionLoading && <FiRefreshCw className="animate-spin" size={14} />}
                <span>نعم، احذف نهائياً من قاعدة البيانات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal: Code Activated and Issued */}
      {successModalOpen && newCodeData && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FiCheckCircle size={30} />
            </div>

            <h3 className="text-xl font-black text-white">تم تفعيل الطلب وتوليد الكود بنجاح!</h3>
            <p className="text-xs text-slate-300">
              أصبح حساب المشترك <strong className="text-white">{newCodeData.buyerName}</strong> مفعّلاً الآن.
            </p>

            {/* Code Box */}
            <div className="bg-slate-950 border-2 border-dashed border-emerald-500/60 rounded-xl p-4 my-2">
              <div className="text-[11px] font-bold text-slate-400 mb-1">كود التفعيل الصادر:</div>
              <div className="text-2xl font-black font-mono text-emerald-400 tracking-widest dir-ltr select-all">
                {newCodeData.code}
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-slate-400 mb-2">إرسال الكود للعميل بنقرة واحدة:</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {/* Copy Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(newCodeData.code);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                    toast.success('تم نسخ الكود للحافظة!');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  {copiedCode ? <FiCheck size={15} /> : <FiCopy size={15} />}
                  <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                </button>

                {/* WhatsApp Send */}
                {newCodeData.buyerPhone && (
                  <a
                    href={getWhatsAppUrl(
                      newCodeData.buyerPhone,
                      newCodeData.buyerName,
                      newCodeData.code,
                      newCodeData.productTitle
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <FaWhatsapp size={15} />
                    <span>إرسال عبر WhatsApp</span>
                  </a>
                )}

                {/* Telegram Send */}
                {newCodeData.buyerTelegram ? (
                  <a
                    href={`https://t.me/${newCodeData.buyerTelegram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-sky-600/20"
                  >
                    <FaTelegramPlane size={14} />
                    <span>إرسال عبر Telegram</span>
                  </a>
                ) : newCodeData.buyerPhone ? (
                  <a
                    href={`https://t.me/+${newCodeData.buyerPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-sky-600/20"
                    title="فتح محادثة تيليجرام برقم الهاتف مباشرة"
                  >
                    <FaTelegramPlane size={14} />
                    <span>إرسال عبر Telegram (بالرقم)</span>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setSuccessModalOpen(false)}
                className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revokeModalOpen && selectedCode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-2 rounded-xl bg-rose-500/10">
                <FiAlertTriangle size={24} />
              </span>
              <h3 className="text-lg font-bold text-white">إلغاء صلاحية كود التفعيل</h3>
            </div>

            <p className="text-sm text-slate-300">
              سيتم إبطال الكود <strong className="font-mono text-orange-400">{selectedCode.displayPrefix}</strong> فوراً وتعطيل وصول الطالب للمحتوى.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">سبب الإلغاء:</label>
              <input
                type="text"
                placeholder="مثال: طلب استرداد مالي، أو كود خاطئ..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setRevokeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                تراجع
              </button>
              <button
                disabled={actionLoading}
                onClick={handleRevoke}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer"
              >
                {actionLoading && <FiRefreshCw className="animate-spin" size={14} />}
                <span>تأكيد الإلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Modal */}
      {regenerateModalOpen && selectedCode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-orange-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-orange-400">
              <span className="p-2 rounded-xl bg-orange-500/10">
                <FiRefreshCw size={24} />
              </span>
              <h3 className="text-lg font-bold text-white">إعادة توليد كود جديد</h3>
            </div>

            <p className="text-sm text-slate-300">
              سيتم إبطال الكود القديم وإصدار كود جديد مشفر وإرساله مباشرة لبريد العميل ({selectedCode.user?.email}).
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={actionLoading}
                onClick={() => setRegenerateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                disabled={actionLoading}
                onClick={handleRegenerate}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-black transition flex items-center gap-2 cursor-pointer"
              >
                {actionLoading && <FiRefreshCw className="animate-spin" size={14} />}
                <span>إصدار الكود الجديد</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
