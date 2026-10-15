'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '../Modal';
import { toast } from 'react-toastify';
import {
  HiOutlineTicket,
  HiOutlineUserAdd,
  HiOutlineSearch,
  HiOutlineClipboardCopy,
  HiOutlineRefresh,
  HiOutlineBan,
  HiOutlineCheckCircle,
  HiOutlineCurrencyDollar,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineCheck,
} from 'react-icons/hi';
import {
  listLiveAccessCodes,
  createManualAccessCode,
  toggleRevokeAccessCode,
  regenerateAccessCode,
} from '../../services/liveService';

export default function LiveAccessCodesModal({
  isOpen,
  onClose,
  sessionId,
  sessionTitle = '',
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    session: null,
    totalCount: 0,
    activeCount: 0,
    usedCount: 0,
    totalRevenue: 0,
    codes: [],
  });

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, REVOKED, USED

  // Manual generation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    paidAmount: '',
    currency: 'USD',
    notes: '',
  });

  const fetchCodes = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await listLiveAccessCodes(sessionId);
      if (res.ok && res.data) {
        setData(res.data);
        if (res.data.session) {
          setFormData((prev) => ({
            ...prev,
            paidAmount: Number(res.data.session.price) || 0,
            currency: res.data.session.currency || 'USD',
          }));
        }
      } else {
        toast.error(res.data?.message || 'تعذر تحميل أكواد الدخول');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchCodes();
      // Auto-sync polling every 6s so online USDT purchases appear immediately
      const interval = setInterval(async () => {
        try {
          const res = await listLiveAccessCodes(sessionId);
          if (res.ok && res.data) {
            setData(res.data);
          }
        } catch {}
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, sessionId, fetchCodes]);

  const handleCopyCode = (accessCode, id) => {
    navigator.clipboard?.writeText(accessCode);
    setCopiedCodeId(id);
    toast.success(`تم نسخ الكود بنجاح: ${accessCode}`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleAddManualStudent = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.warn('يرجى كتابة اسم الطالب والبريد الإلكتروني');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        paidAmount: formData.paidAmount !== '' ? Number(formData.paidAmount) : undefined,
        currency: formData.currency,
        notes: formData.notes.trim() || undefined,
      };

      const res = await createManualAccessCode(sessionId, payload);
      if (res.ok) {
        toast.success(`تم إصدار كود الدخول: ${res.data?.accessCode?.accessCode}`);
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          paidAmount: Number(data.session?.price) || 0,
          currency: data.session?.currency || 'USD',
          notes: '',
        });
        setShowAddForm(false);
        fetchCodes();
      } else {
        toast.error(res.data?.message || 'فشل توليد كود الدخول');
      }
    } catch {
      toast.error('حدث خطأ أثناء إصدار الكود');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRevoke = async (code) => {
    const actionName = code.isRevoked ? 'إعادة تفعيل' : 'إلغاء صلاحية';
    if (!confirm(`هل أنت متأكد من ${actionName} كود المشترك (${code.fullName || code.email})؟`)) {
      return;
    }

    try {
      const res = await toggleRevokeAccessCode(code.id, !code.isRevoked);
      if (res.ok) {
        toast.success(res.data?.message || `تم ${actionName} الكود بنجاح`);
        fetchCodes();
      } else {
        toast.error(res.data?.message || 'فشلت العملية');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleRegenerate = async (code) => {
    if (
      !confirm(
        `تنبيه: إعادة توليد كود جديد سيلغي الكود الحالي (${code.accessCode}) فوراً. هل تود المتابعة؟`
      )
    ) {
      return;
    }

    try {
      const res = await regenerateAccessCode(code.id);
      if (res.ok) {
        toast.success(`تم توليد كود بديل جديد: ${res.data?.accessCode?.accessCode}`);
        fetchCodes();
      } else {
        toast.error(res.data?.message || 'فشل توليد كود بديل');
      }
    } catch {
      toast.error('حدث خطأ');
    }
  };

  // Filtered Codes
  const filteredCodes = useMemo(() => {
    if (!data.codes) return [];
    return data.codes.filter((item) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.fullName?.toLowerCase().includes(q);
        const matchesEmail = item.email?.toLowerCase().includes(q);
        const matchesCode = item.accessCode?.toLowerCase().includes(q);
        const matchesPhone = item.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesCode && !matchesPhone) return false;
      }

      if (statusFilter === 'ACTIVE') {
        if (item.isRevoked) return false;
      } else if (statusFilter === 'REVOKED') {
        if (!item.isRevoked) return false;
      } else if (statusFilter === 'USED') {
        if (item.usageCount === 0) return false;
      } else if (statusFilter === 'CHECKOUT') {
        if (item.source !== 'CHECKOUT') return false;
      }

      return true;
    });
  }, [data.codes, searchTerm, statusFilter]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة المشتركين وأكواد الدخول للكورس المباشر"
      subtitle={sessionTitle || data.session?.title || 'سرد وتوليد أكواد الدخول الفريدة للطلاب'}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-5 text-xs sm:text-sm text-[#F5F7FA]">
        {/* 1. Header Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-[#06142F] border border-[#12315C] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0488F8]/15 border border-[#0488F8]/30 flex items-center justify-center text-[#0488F8] shrink-0">
              <HiOutlineUsers className="text-xl" />
            </div>
            <div>
              <span className="text-[11px] text-[#A7AFBF] block">إجمالي المشتركين</span>
              <span className="text-base font-black text-[#F5F7FA] font-tabular">
                {data.totalCount || 0}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#06142F] border border-[#12315C] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16C784]/15 border border-[#16C784]/30 flex items-center justify-center text-[#16C784] shrink-0">
              <HiOutlineCurrencyDollar className="text-xl" />
            </div>
            <div>
              <span className="text-[11px] text-[#A7AFBF] block">إجمالي الإيرادات</span>
              <span className="text-base font-black text-[#16C784] font-tabular">
                ${data.totalRevenue?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#06142F] border border-[#12315C] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FB8704]/15 border border-[#FB8704]/30 flex items-center justify-center text-[#FB8704] shrink-0">
              <HiOutlineTicket className="text-xl" />
            </div>
            <div>
              <span className="text-[11px] text-[#A7AFBF] block">أكواد نشطة صالحة</span>
              <span className="text-base font-black text-[#FB8704] font-tabular">
                {data.activeCount || 0}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#06142F] border border-[#12315C] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7] shrink-0">
              <HiOutlineClock className="text-xl" />
            </div>
            <div>
              <span className="text-[11px] text-[#A7AFBF] block">حضروا البث بالفعل</span>
              <span className="text-base font-black text-[#A855F7] font-tabular">
                {data.usedCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Action Toolbar: Add Student & Search Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute right-3 top-3 text-[#A7AFBF] text-base" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب، البريد الإلكتروني، أو كود الدخول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pr-9 pl-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">كافة الحالات (الكل)</option>
              <option value="ACTIVE">الأكواد الصالحة والنشطة</option>
              <option value="CHECKOUT">طلبات الدفع أونلاين (USDT)</option>
              <option value="USED">الطلاب الذين حضروا</option>
              <option value="REVOKED">الأكواد الملغاة</option>
            </select>

            {/* Toggle Add Form Button */}
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-10 px-3.5 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <HiOutlineUserAdd className="text-base" />
              <span>{showAddForm ? 'إخفاء النموذج' : '+ إضافة مشترك وتوليد كود'}</span>
            </button>

            <button
              type="button"
              onClick={fetchCodes}
              disabled={loading}
              className="h-10 w-10 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-[#F5F7FA] flex items-center justify-center transition-colors cursor-pointer"
              title="تحديث القائمة"
            >
              <HiOutlineRefresh className={`text-base ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Manual Addition Drawer / Box */}
        {showAddForm && (
          <form
            onSubmit={handleAddManualStudent}
            className="p-4 rounded-2xl bg-[#03091E] border border-[#0488F8]/40 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#12315C]">
              <span className="font-bold text-[#F5F7FA] flex items-center gap-1.5">
                <HiOutlineTicket className="text-[#0488F8]" />
                <span>إضافة مشترك يدوي وإصدار كود الدخول المخصص</span>
              </span>
              <span className="text-[11px] text-[#16C784] bg-[#16C784]/10 px-2 py-0.5 rounded-md border border-[#16C784]/20">
                توليد كود فوري
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  اسم الطالب <span className="text-[#F6465D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="مثال: أحمد عبد الرحمن"
                  className="w-full h-9 px-3 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8]"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  البريد الإلكتروني <span className="text-[#F6465D]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmed@example.com"
                  className="w-full h-9 px-3 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  رقم الهاتف / واتساب
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+966501234567"
                  className="w-full h-9 px-3 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8] dir-ltr text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  المبلغ المدفوع
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full h-9 px-3 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA] font-tabular text-xs outline-none focus:border-[#0488F8]"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  العملة
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full h-9 px-2 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="USDT">USDT</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                  <option value="EGP">EGP</option>
                </select>
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  ملاحظات الإدارة
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="تحويل بنكي / دفع كاش / مقعد VIP"
                  className="w-full h-9 px-3 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs outline-none focus:border-[#0488F8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#12315C]/60">
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
                className="px-4 py-1.5 rounded-lg bg-[#16C784] hover:bg-[#12A86E] text-[#00030D] font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>جاري التوليد...</span>
                ) : (
                  <>
                    <HiOutlineTicket />
                    <span>توليد كود الدخول وحفظ المشترك</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 4. Interactive Data Table */}
        <div className="rounded-2xl border border-[#12315C] bg-[#06142F] overflow-hidden">
          <div className="overflow-x-auto max-h-[380px] scrollbar-thin">
            <table className="w-full text-right border-collapse">
              <thead className="bg-[#0A1B3D] text-[#A7AFBF] text-[11px] font-bold sticky top-0 z-10 border-b border-[#12315C]">
                <tr>
                  <th className="py-3 px-4">الطالب / المشترك</th>
                  <th className="py-3 px-4">كود الدخول الفريد</th>
                  <th className="py-3 px-4">المبلغ والعملة</th>
                  <th className="py-3 px-4">المصدر</th>
                  <th className="py-3 px-4">حالة الحضور</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12315C]/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-[#A7AFBF]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
                        <span>جاري تحميل المشتركين والأكواد...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-10 text-center text-[#A7AFBF]">
                      {searchTerm
                        ? 'لا توجد نتائج مطابقة لبحثك'
                        : 'لم يتم إصدار أكواد دخول لهذه الجلسة حتى الآن. اضغط على "+ إضافة مشترك" بالأعلى لتوليد أول كود.'}
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map((code) => {
                    const isCopied = copiedCodeId === code.id;
                    return (
                      <tr
                        key={code.id}
                        className={`hover:bg-[#0A1B3D]/70 transition-colors ${
                          code.isRevoked ? 'opacity-50' : ''
                        }`}
                      >
                        {/* Student Details */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#F5F7FA]">
                            {code.fullName || 'مشترك المنصة'}
                          </div>
                          <div className="text-[11px] text-[#A7AFBF] font-mono">
                            {code.email}
                          </div>
                          {code.phone && (
                            <div className="text-[10px] text-[#687287] font-mono dir-ltr text-right">
                              {code.phone}
                            </div>
                          )}
                        </td>

                        {/* Unique Access Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-[#00030D] border border-[#0488F8]/40 text-[#0488F8] font-mono font-bold text-xs tracking-wider">
                              {code.accessCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(code.accessCode, code.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isCopied
                                  ? 'bg-[#16C784]/20 border-[#16C784] text-[#16C784]'
                                  : 'bg-[#12315C]/50 border-[#12315C] text-[#A7AFBF] hover:text-white hover:border-[#0488F8]'
                              }`}
                              title="نسخ كود الدخول"
                            >
                              {isCopied ? <HiOutlineCheck /> : <HiOutlineClipboardCopy />}
                            </button>
                          </div>
                        </td>

                        {/* Paid Amount */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#16C784] font-tabular">
                            {code.paidAmount !== null ? `$${code.paidAmount}` : '—'}
                          </span>
                          <span className="text-[10px] text-[#A7AFBF] mr-1">
                            {code.currency || 'USD'}
                          </span>
                        </td>

                        {/* Source */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              code.source === 'CHECKOUT'
                                ? 'bg-[#0488F8]/15 text-[#0488F8] border border-[#0488F8]/30'
                                : 'bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/30'
                            }`}
                          >
                            {code.source === 'CHECKOUT' ? 'طلب أونلاين' : 'يدوي من الإدارة'}
                          </span>
                        </td>

                        {/* Usage & Attendance */}
                        <td className="py-3 px-4">
                          {code.usageCount > 0 ? (
                            <div className="flex items-center gap-1 text-[#16C784] font-medium text-[11px]">
                              <HiOutlineCheckCircle />
                              <span>حضر ({code.usageCount} مرة)</span>
                            </div>
                          ) : (
                            <span className="text-[#A7AFBF] text-[11px]">لم يحضر بعد</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {code.isRevoked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30">
                              ملغي (Revoked)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30">
                              نشط وصالح
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleRegenerate(code)}
                              className="p-1.5 rounded-lg bg-[#12315C]/50 hover:bg-[#12315C] text-[#A7AFBF] hover:text-[#0488F8] transition-colors cursor-pointer"
                              title="إعادة توليد كود جديد للطالب"
                            >
                              <HiOutlineRefresh className="text-sm" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleRevoke(code)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                code.isRevoked
                                  ? 'bg-[#16C784]/15 hover:bg-[#16C784]/25 text-[#16C784]'
                                  : 'bg-[#F6465D]/15 hover:bg-[#F6465D]/25 text-[#F6465D]'
                              }`}
                              title={code.isRevoked ? 'إعادة تفعيل الكود' : 'إلغاء صلاحية الكود'}
                            >
                              {code.isRevoked ? <HiOutlineCheckCircle className="text-sm" /> : <HiOutlineBan className="text-sm" />}
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

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#12315C] flex items-center justify-between">
          <span className="text-[11px] text-[#A7AFBF]">
            إجمالي السجلات: {filteredCodes.length} مشترك
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#12315C] hover:bg-[#1A4278] text-[#F5F7FA] font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  );
}
