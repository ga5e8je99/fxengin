'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineTrendingUp,
  HiOutlineCash,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineClipboardCopy,
  HiOutlineAcademicCap,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineTrash,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import { deleteUser } from '../../services/usersService';
import CloudUploadWidget from '../../components/storage/CloudUploadWidget';

export default function AffiliatesAdminPage() {
  const [data, setData] = useState({
    summary: {},
    partners: [],
    conversions: [],
    referredUsers: [],
    payouts: [],
    creatives: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('partners'); // 'partners' | 'subscriptions' | 'leads' | 'payouts' | 'creatives'
  const [subTypeFilter, setSubTypeFilter] = useState('ALL'); // 'ALL' | 'COURSE' | 'GROUP'
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingPayoutId, setUpdatingPayoutId] = useState(null);

  // Creative Modal State
  const [creativeModalOpen, setCreativeModalOpen] = useState(false);
  const [editingCreative, setEditingCreative] = useState(null);
  const [creativeForm, setCreativeForm] = useState({
    title: '',
    badge: 'بوست فيسبوك وانستغرام',
    imageUrl: '',
    caption: '',
    isActive: true,
  });
  const [isSavingCreative, setIsSavingCreative] = useState(false);
  const [creativeToDelete, setCreativeToDelete] = useState(null);
  const [isDeletingCreative, setIsDeletingCreative] = useState(false);

  // Delete modal state
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [deleteRelated, setDeleteRelated] = useState(true);
  const [deleteAccountFromDB, setDeleteAccountFromDB] = useState(false);
  const [isDeletingPartner, setIsDeletingPartner] = useState(false);

  const fetchAffiliates = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch(`/api/affiliates?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        if (json.success) {
          setData({
            summary: json.summary || {},
            partners: json.partners || [],
            conversions: json.conversions || [],
            referredUsers: json.referredUsers || [],
            payouts: json.payouts || [],
            creatives: json.creatives || [],
          });
        }
      }
    } catch (err) {
      console.error('Failed to load affiliates in admin:', err);
      if (!isSilent) toast.error('فشل في جلب بيانات برنامج الشركاء');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
    const interval = setInterval(() => fetchAffiliates(true), 10000);
    const onFocus = () => fetchAffiliates(true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchAffiliates]);

  const handleUpdatePayout = async (payoutId, status) => {
    const actionLabel = status === 'COMPLETED' ? 'الموافقة على التحويل' : 'رفض الطلب';
    if (!window.confirm(`هل أنت متأكد من ${actionLabel}؟`)) return;

    setUpdatingPayoutId(payoutId);
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_payout',
          payoutId,
          status,
          adminNotes: `تم التحديث بواسطة الإدارة بتاريخ ${new Date().toLocaleString('ar-EG')}`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success(status === 'COMPLETED' ? 'تم تأكيد تحويل الأرباح بنجاح' : 'تم رفض طلب السحب واستعادة الرصيد للشريك');
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل تحديث الطلب');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء تحديث الطلب');
    } finally {
      setUpdatingPayoutId(null);
    }
  };

  const handleConfirmDeletePartner = async () => {
    if (!partnerToDelete) return;
    setIsDeletingPartner(true);
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_partner',
          partnerId: partnerToDelete.id,
          referralCode: partnerToDelete.referralCode,
          deleteRelated,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        if (deleteAccountFromDB && partnerToDelete.userId) {
          try {
            await deleteUser(partnerToDelete.userId);
            toast.info('تم حذف حساب المستخدم نهائياً من قاعدة البيانات');
          } catch (dbErr) {
            console.warn('Failed to delete user account from backend DB:', dbErr);
          }
        }
        toast.success(json.message || 'تم حذف الشريك بنجاح');
        setPartnerToDelete(null);
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل حذف الشريك');
      }
    } catch (err) {
      console.error('Delete partner error:', err);
      toast.error('حدث خطأ أثناء محاولة الحذف');
    } finally {
      setIsDeletingPartner(false);
    }
  };

  const handleDeleteReferredUser = async (leadId, leadName) => {
    if (!window.confirm(`هل أنت متأكد من حذف العضو "${leadName || 'المحال'}" من قائمة الإحالات؟`)) {
      return;
    }
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_referred_user',
          leadId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success('تم حذف العضو المحال بنجاح');
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل حذف العضو المحال');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حذف العضو');
    }
  };

  const handleDeleteConversion = async (conversionId, orderNumber) => {
    if (!window.confirm(`هل أنت متأكد من حذف سجل الاشتراك رقم (${orderNumber})؟ سيتم خصم العمولة من رصيد الشريك.`)) {
      return;
    }
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_conversion',
          conversionId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success('تم حذف سجل الاشتراك وتحديث رصيد الشريك بنجاح');
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل حذف سجل الاشتراك');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حذف سجل الاشتراك');
    }
  };

  const handleDeletePayout = async (payoutId) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل طلب السحب هذا؟')) return;
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_payout',
          payoutId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success('تم حذف سجل طلب السحب بنجاح');
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل حذف الطلب');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حذف الطلب');
    }
  };

  const handleConfirmConversion = async (conversionId, orderNumber) => {
    if (!window.confirm(`هل أنت متأكد من اعتماد واحتساب عمولة الشريك لهذا الاشتراك رقم (${orderNumber})؟`)) {
      return;
    }
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_conversion_by_order',
          conversionId,
          orderNumber,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success(json.message || 'تم اعتماد واحتساب عمولة الشريك بنجاح!');
        fetchAffiliates();
      } else {
        toast.error(json.error || json.message || 'فشل اعتماد العمولة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء اعتماد العمولة');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ إلى الحافظة');
  };

  // ── Creative Handlers ──
  const handleOpenAddCreative = () => {
    setEditingCreative(null);
    setCreativeForm({
      title: '',
      badge: 'بوست فيسبوك وانستغرام',
      imageUrl: '',
      caption: '',
      isActive: true,
    });
    setCreativeModalOpen(true);
  };

  const handleOpenEditCreative = (crt) => {
    setEditingCreative(crt);
    setCreativeForm({
      title: crt.title || '',
      badge: crt.badge || 'بوست فيسبوك وانستغرام',
      imageUrl: crt.imageUrl || '',
      caption: crt.caption || '',
      isActive: crt.isActive !== false,
    });
    setCreativeModalOpen(true);
  };

  const handleSaveCreative = async (e) => {
    if (e) e.preventDefault();
    if (!creativeForm.title?.trim() && !creativeForm.caption?.trim() && !creativeForm.imageUrl?.trim()) {
      toast.warning('يرجى كتابة عنوان أو نص المنشور أو رفع صورة');
      return;
    }

    setIsSavingCreative(true);
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingCreative ? 'update_creative' : 'create_creative',
          id: editingCreative?.id,
          ...creativeForm,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success(editingCreative ? 'تم تحديث الإعلان الترويجي بنجاح' : 'تمت إضافة الإعلان الترويجي بنجاح');
        setCreativeModalOpen(false);
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل حفظ الإعلان');
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ الإعلان');
    } finally {
      setIsSavingCreative(false);
    }
  };

  const handleToggleCreativeActive = async (crt) => {
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_creative',
          id: crt.id,
          isActive: !crt.isActive,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success(crt.isActive ? 'تم إيقاف ظهور الإعلان في الداشبورد' : 'تم تفعيل الإعلان وإتاحته للشركاء');
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل تغيير الحالة');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث حالة الإعلان');
    }
  };

  const handleConfirmDeleteCreative = async () => {
    if (!creativeToDelete) return;
    setIsDeletingCreative(true);
    try {
      const res = await fetch(`/api/affiliates?type=creative&id=${creativeToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        toast.success('تم حذف الإعلان الترويجي بنجاح');
        setCreativeToDelete(null);
        fetchAffiliates();
      } else {
        toast.error(json.error || 'فشل حذف الإعلان');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف الإعلان');
    } finally {
      setIsDeletingCreative(false);
    }
  };

  // Filtered subscriptions
  const filteredConversions = useMemo(() => {
    return (data.conversions || []).filter((c) => {
      if (subTypeFilter === 'COURSE') {
        const isCourse =
          c.productType === 'COURSE' ||
          (!c.productType &&
            !c.productName?.toLowerCase().includes('group') &&
            !c.productName?.includes('جروب') &&
            !c.productName?.includes('توصيات') &&
            !c.productName?.includes('signals'));
        if (!isCourse) return false;
      }
      if (subTypeFilter === 'GROUP') {
        const isGroup =
          c.productType === 'GROUP' ||
          c.productName?.toLowerCase().includes('group') ||
          c.productName?.includes('جروب') ||
          c.productName?.includes('توصيات') ||
          c.productName?.includes('signals');
        if (!isGroup) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          c.buyerName?.toLowerCase().includes(q) ||
          c.partnerName?.toLowerCase().includes(q) ||
          c.productName?.toLowerCase().includes(q) ||
          String(c.orderNumber).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.conversions, subTypeFilter, searchQuery]);

  // Filtered partners
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return data.partners;
    const q = searchQuery.toLowerCase().trim();
    return (data.partners || []).filter(
      (p) =>
        p.userName?.toLowerCase().includes(q) ||
        p.userEmail?.toLowerCase().includes(q) ||
        p.referralCode?.toLowerCase().includes(q)
    );
  }, [data.partners, searchQuery]);

  // Filtered referred users
  const filteredReferredUsers = useMemo(() => {
    if (!searchQuery.trim()) return data.referredUsers;
    const q = searchQuery.toLowerCase().trim();
    return (data.referredUsers || []).filter(
      (u) =>
        u.userName?.toLowerCase().includes(q) ||
        u.userEmail?.toLowerCase().includes(q) ||
        u.referralCode?.toLowerCase().includes(q) ||
        u.partnerName?.toLowerCase().includes(q)
    );
  }, [data.referredUsers, searchQuery]);

  // Filtered creatives
  const filteredCreatives = useMemo(() => {
    if (!searchQuery.trim()) return data.creatives || [];
    const q = searchQuery.toLowerCase().trim();
    return (data.creatives || []).filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.caption?.toLowerCase().includes(q) ||
        c.badge?.toLowerCase().includes(q)
    );
  }, [data.creatives, searchQuery]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border-structural/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-black rounded-full bg-accent-primary/20 text-accent-primary border border-accent-primary/40">
              10% عمولة فورية
            </span>
            <span className="text-xs text-on-surface-variant font-mono">
              AFFILIATE & REFERRAL ENGINE V3.5
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight mt-1">
            برنامج الشركاء والإحالة (Affiliates)
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            إدارة الشركاء، متابعة المسجلين عبر الإحالة، والمشتركين في الكورسات وجروبات التوصيات VIP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchAffiliates}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-surface-container-high hover:bg-surface-container-highest transition-all"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* ── Overview Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Partners */}
        <div className="p-5 rounded-2xl bg-surface-container-low border border-border-structural/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">الشركاء والمسوقون</span>
            <div className="w-9 h-9 rounded-xl bg-accent-primary/15 text-accent-primary flex items-center justify-center">
              <HiOutlineUserGroup className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-on-surface">
            {data.summary?.totalPartners || data.partners.length}
          </div>
          <div className="text-xs text-on-surface-variant/70 mt-1">
            مسوق معتمد برابط وكود خاص
          </div>
        </div>

        {/* Card 2: Referred Users */}
        <div className="p-5 rounded-2xl bg-surface-container-low border border-border-structural/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">المسجلون عبر الإحالة</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <HiOutlineTrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-400">
            {data.summary?.totalReferredUsers || data.referredUsers.length}
          </div>
          <div className="text-xs text-on-surface-variant/70 mt-1">
            عضو مسجل عبر روابط الشركاء
          </div>
        </div>

        {/* Card 3: Orders in Courses & Groups */}
        <div className="p-5 rounded-2xl bg-surface-container-low border border-border-structural/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">اشتراكات الكورسات والجروبات</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-400">
            {data.summary?.totalConversions || data.conversions.length}
          </div>
          <div className="text-xs text-on-surface-variant/70 mt-1">
            {data.summary?.coursesCount || 0} كورسات • {data.summary?.groupsCount || 0} جروبات VIP
          </div>
        </div>

        {/* Card 4: Total Commissions */}
        <div className="p-5 rounded-2xl bg-surface-container-low border border-border-structural/80 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant">إجمالي العمولات المستحقة (10%)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <HiOutlineCash className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${data.summary?.totalEarningsAll || '0.00'}
          </div>
          <div className="text-xs text-on-surface-variant/70 mt-1">
            مبيعات إحالة بقيمة ${data.summary?.totalSalesVolume || '0.00'}
          </div>
        </div>
      </div>

      {/* ── Mechanism Banner (آلية العمل المعتمدة) ── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-surface-container to-surface-container-low border border-accent-primary/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <HiOutlineShieldCheck className="w-5 h-5 text-accent-primary" />
            <h3 className="text-sm font-black text-on-surface">آلية العمل ونظام تتبع برنامج الشركاء:</h3>
          </div>
          <p className="text-xs text-on-surface-variant/90 leading-relaxed">
            • نسبة العمولة المعتمدة: <strong>10% نقدية مباشرة</strong> من أي كورس تعليمي أو اشتراك جروب توصيات VIP.
            <br />
            • مدة حفظ الإحالة: <strong>30 يوماً</strong> عبر الكوكيز من أول نقرة على الرابط.
            <br />
            • السحب متاح للشركاء عند بلوغ <strong>100 دولار</strong> عبر إنستاباي، فودافون كاش، USDT، والتحويل البنكي.
          </p>
        </div>

        {Number(data.summary?.pendingPayoutsCount || 0) > 0 && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shrink-0">
            <span>يوجد {data.summary.pendingPayoutsCount} طلب سحب بانتظار المراجعة والتحويل</span>
            <button
              type="button"
              onClick={() => setActiveTab('payouts')}
              className="underline hover:text-white"
            >
              عرض الآن
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs Bar & Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-structural/80 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Partners */}
          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'partners'
                ? 'bg-accent-primary text-canvas-deep shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <HiOutlineUserGroup className="w-4 h-4" />
            <span>الشركاء والمسوقون ({data.partners.length})</span>
          </button>

          {/* Tab 2: Subscriptions in courses & groups */}
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'subscriptions'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <HiOutlineAcademicCap className="w-4 h-4" />
            <span>المشتركون في الكورسات والجروبات ({data.conversions.length})</span>
          </button>

          {/* Tab 3: Referred Users */}
          <button
            type="button"
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'leads'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <HiOutlineTrendingUp className="w-4 h-4" />
            <span>المسجلون عبر الإحالة ({data.referredUsers.length})</span>
          </button>

          {/* Tab 4: Payouts */}
          <button
            type="button"
            onClick={() => setActiveTab('payouts')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'payouts'
                ? 'bg-amber-500 text-canvas-deep shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <HiOutlineCash className="w-4 h-4" />
            <span>طلبات السحب ({data.payouts.length})</span>
          </button>

          {/* Tab 5: Creatives (المواد التسويقية والإعلانات) */}
          <button
            type="button"
            onClick={() => setActiveTab('creatives')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'creatives'
                ? 'bg-emerald-500 text-canvas-deep shadow-md'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <HiOutlinePhotograph className="w-4 h-4" />
            <span>المواد التسويقية والإعلانات ({data.creatives?.length || 0})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <HiOutlineSearch className="w-4 h-4 text-on-surface-variant/60 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث بالاسم، الكود، أو الطلب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl bg-surface-container-low border border-border-structural/80 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-accent-primary"
          />
        </div>
      </div>

      {/* ══════════════ TAB 1: PARTNERS ══════════════ */}
      {activeTab === 'partners' && (
        <div className="bg-surface-container-low border border-border-structural/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border-structural/60 flex items-center justify-between">
            <h3 className="text-sm font-black text-on-surface">قائمة الشركاء والمسوقين المعتمدين</h3>
            <span className="text-xs text-on-surface-variant">{filteredPartners.length} مسوق</span>
          </div>

          {filteredPartners.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-sm">
              لا يوجد شركاء مسجلين يطابقون البحث
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-surface-container/60 text-on-surface-variant border-b border-border-structural/80 font-bold">
                    <th className="py-3 px-4">الشريك</th>
                    <th className="py-3 px-4">كود الإحالة</th>
                    <th className="py-3 px-4">رابط الإحالة</th>
                    <th className="py-3 px-4">المسجلون عبر الإحالة</th>
                    <th className="py-3 px-4">الاشتراكات الناجحة</th>
                    <th className="py-3 px-4">إجمالي الأرباح (10%)</th>
                    <th className="py-3 px-4">الرصيد المتاح</th>
                    <th className="py-3 px-4">تاريخ الانضمام</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-structural/40 text-on-surface">
                  {filteredPartners.map((p) => {
                    const pLink = `https://fxengen.com/?ref=${p.referralCode}`;
                    const pConvs = (data.conversions || []).filter(
                      (c) => (c.referralCode === p.referralCode || c.partnerId === p.id) && c.status === 'CONFIRMED'
                    );
                    const pPendingConvs = (data.conversions || []).filter(
                      (c) => (c.referralCode === p.referralCode || c.partnerId === p.id) && c.status !== 'CONFIRMED'
                    );
                    const pLeads = (data.referredUsers || []).filter(
                      (u) => u.referralCode === p.referralCode || u.partnerId === p.id
                    );

                    return (
                      <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-on-surface">{p.userName}</div>
                          <div className="text-[11px] text-on-surface-variant/70">{p.userEmail || p.userPhone || '—'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-mono font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                            {p.referralCode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(pLink)}
                            title="نسخ الرابط المباشر"
                            className="text-[11px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
                            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                          >
                            <HiOutlineClipboardCopy className="w-3.5 h-3.5 shrink-0" />
                            <span dir="ltr">fxengen.com/?ref={p.referralCode}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-blue-400">{pLeads.length}</span> عضو
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-purple-400">{pConvs.length}</span> اشتراك مؤكد
                          {pPendingConvs.length > 0 && (
                            <span className="block text-[10px] text-amber-400 font-bold">
                              ({pPendingConvs.length} بانتظار التفعيل)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-400 text-sm">
                          ${Number(p.totalEarnings || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-300">
                          ${Number(p.availableBalance || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant/70">
                          {new Date(p.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setPartnerToDelete(p);
                              setDeleteRelated(true);
                              setDeleteAccountFromDB(false);
                            }}
                            title="حذف هذا المسوق / المستخدم"
                            className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all inline-flex items-center gap-1.5 font-bold text-xs shadow-sm hover:scale-[1.02]"
                          >
                            <HiOutlineTrash className="w-4 h-4 text-red-400" />
                            <span>حذف المستخدم</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 2: SUBSCRIPTIONS IN COURSES & GROUPS ══════════════ */}
      {activeTab === 'subscriptions' && (
        <div className="bg-surface-container-low border border-border-structural/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border-structural/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-on-surface">سجل المشتركين في الكورسات والجروبات عبر الإحالة</h3>
              <p className="text-xs text-on-surface-variant/70">كل عملية اشتراك ودفع مؤكدة عبر رابط شريك</p>
            </div>

            {/* Sub-type filter */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubTypeFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  subTypeFilter === 'ALL'
                    ? 'bg-purple-600 text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                الكل ({data.conversions.length})
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter('COURSE')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  subTypeFilter === 'COURSE'
                    ? 'bg-blue-600 text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                الكورسات التدريبية ({data.summary?.coursesCount || 0})
              </button>
              <button
                type="button"
                onClick={() => setSubTypeFilter('GROUP')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  subTypeFilter === 'GROUP'
                    ? 'bg-purple-600 text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                جروبات التوصيات VIP ({data.summary?.groupsCount || 0})
              </button>
            </div>
          </div>

          {filteredConversions.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-sm">
              لا توجد اشتراكات مسجلة تطابق التصفية
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-surface-container/60 text-on-surface-variant border-b border-border-structural/80 font-bold">
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المشترك</th>
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">اسم الدورة أو الجروب</th>
                    <th className="py-3 px-4">الشريك المحال إليه</th>
                    <th className="py-3 px-4">رقم الطلب</th>
                    <th className="py-3 px-4">مبلغ الدفع</th>
                    <th className="py-3 px-4">عمولة الشريك (10%)</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-structural/40 text-on-surface">
                  {filteredConversions.map((conv) => {
                    const isGroup =
                      conv.productType === 'GROUP' ||
                      conv.productName?.toLowerCase().includes('group') ||
                      conv.productName?.includes('جروب') ||
                      conv.productName?.includes('توصيات') ||
                      conv.productName?.includes('signals');

                    const rawProd = String(conv.productName || '').trim();
                    const isRawId = /^c[a-z0-9]{20,}$/i.test(rawProd);
                    const cleanDisplayName = isRawId
                      ? (isGroup ? 'جروب توصيات VIP' : 'دورة تدريبية')
                      : (rawProd || (isGroup ? 'جروب توصيات VIP' : 'دورة تدريبية'));

                    return (
                      <tr key={conv.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-3 px-4 text-on-surface-variant/70">
                          {new Date(conv.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-on-surface">
                          {conv.buyerName || 'مشترك FXENGIN'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                              isGroup
                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {isGroup ? 'جروب توصيات' : 'دورة تدريبية'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold" title={isRawId ? rawProd : undefined}>
                          {cleanDisplayName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-accent-primary">{conv.partnerName || '—'}</span>
                          <span className="text-[10px] text-on-surface-variant block font-mono">({conv.referralCode})</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-blue-400">{conv.orderNumber}</td>
                        <td className="py-3 px-4 font-bold">${Number(conv.orderAmount).toFixed(2)}</td>
                        <td className="py-3 px-4 font-black text-sm">
                          {conv.status === 'CONFIRMED' ? (
                            <span className="text-emerald-400 font-black">+${Number(conv.commissionAmount).toFixed(2)}</span>
                          ) : (
                            <span className="text-amber-400 font-bold">${Number(conv.commissionAmount).toFixed(2)} (معلقة)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {conv.status === 'CONFIRMED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              مؤكدة ومحتسبة
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              بانتظار تفعيل الكود
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {conv.status !== 'CONFIRMED' && (
                              <button
                                type="button"
                                onClick={() => handleConfirmConversion(conv.id, conv.orderNumber)}
                                title="اعتماد واحتساب عمولة الشريك يدوياً"
                                className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all inline-flex items-center gap-1 text-xs font-bold"
                              >
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                <span>اعتماد الربح</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteConversion(conv.id, conv.orderNumber)}
                              title="حذف سجل هذا الاشتراك"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center gap-1 text-xs"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 3: REFERRED USERS ══════════════ */}
      {activeTab === 'leads' && (
        <div className="bg-surface-container-low border border-border-structural/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border-structural/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-on-surface">قائمة المسجلين عبر روابط الشركاء</h3>
              <p className="text-xs text-on-surface-variant/70">قائمة الأعضاء الذين أنشأوا حساباتهم في FXENGIN عبر روابط إحالة</p>
            </div>
            <span className="text-xs text-on-surface-variant">{filteredReferredUsers.length} عضو</span>
          </div>

          {filteredReferredUsers.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-sm">
              لا يوجد أعضاء مسجلين يطابقون البحث
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-surface-container/60 text-on-surface-variant border-b border-border-structural/80 font-bold">
                    <th className="py-3 px-4">اسم العضو</th>
                    <th className="py-3 px-4">البريد الإلكتروني / الهاتف</th>
                    <th className="py-3 px-4">الشريك المحال إليه</th>
                    <th className="py-3 px-4">كود الإحالة</th>
                    <th className="py-3 px-4">تاريخ التسجيل</th>
                    <th className="py-3 px-4">الاشتراكات المكتملة</th>
                    <th className="py-3 px-4">إجمالي مبيعاته</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-structural/40 text-on-surface">
                  {filteredReferredUsers.map((lead) => (
                    <tr key={lead.id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-on-surface">{lead.userName || 'عضو جديد'}</td>
                      <td className="py-3 px-4 text-on-surface-variant/70">{lead.userEmail || lead.userPhone || '—'}</td>
                      <td className="py-3 px-4 font-bold text-accent-primary">{lead.partnerName || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold">{lead.referralCode}</td>
                      <td className="py-3 px-4 text-on-surface-variant/70">
                        {lead.registeredAt ? new Date(lead.registeredAt).toLocaleDateString('ar-EG') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            (lead.subscriptionsCount || 0) > 0
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {lead.subscriptionsCount || 0} اشتراك
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-on-surface">
                        ${Number(lead.totalSpent || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        {(lead.subscriptionsCount || 0) > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                            مشترك نشط
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400">
                            مسجل جديد
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteReferredUser(lead.id, lead.userName)}
                          title="حذف هذا العضو من سجل الإحالات"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center gap-1 text-xs"
                        >
                          <HiOutlineTrash className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 4: PAYOUT REQUESTS ══════════════ */}
      {activeTab === 'payouts' && (
        <div className="bg-surface-container-low border border-border-structural/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border-structural/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-on-surface">إدارة طلبات سحب الأرباح للشركاء</h3>
              <p className="text-xs text-on-surface-variant/70">تحويل ومراجعة أرباح المسوقين عبر إنستاباي، فودافون كاش، USDT، والبنوك</p>
            </div>
            <span className="text-xs text-on-surface-variant">{data.payouts.length} طلب</span>
          </div>

          {data.payouts.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant/60 text-sm">
              لا توجد طلبات سحب أرباح مسجلة
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-surface-container/60 text-on-surface-variant border-b border-border-structural/80 font-bold">
                    <th className="py-3 px-4">تاريخ الطلب</th>
                    <th className="py-3 px-4">الشريك</th>
                    <th className="py-3 px-4">المبلغ المطلوب</th>
                    <th className="py-3 px-4">الوسيلة</th>
                    <th className="py-3 px-4">بيانات التحويل</th>
                    <th className="py-3 px-4">ملاحظات الشريك</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-structural/40 text-on-surface">
                  {data.payouts.map((p) => {
                    const isUpdating = updatingPayoutId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                        <td className="py-3 px-4 text-on-surface-variant/70">
                          {new Date(p.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold">
                          {p.userName}
                          <span className="text-[10px] text-on-surface-variant block font-mono">({p.referralCode})</span>
                        </td>
                        <td className="py-3 px-4 font-black text-emerald-400 text-base">
                          ${Number(p.amount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-bold bg-surface-container text-on-surface border border-border-structural/60">
                            {p.method}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-on-surface select-all">
                          {p.accountDetails}
                        </td>
                        <td className="py-3 px-4 text-on-surface-variant/80">{p.notes || '—'}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              p.status === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : p.status === 'REJECTED'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {p.status === 'COMPLETED'
                              ? 'تم التحويل'
                              : p.status === 'REJECTED'
                              ? 'مرفوض'
                              : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {p.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  disabled={updatingPayoutId === p.id}
                                  onClick={() => handleUpdatePayout(p.id, 'COMPLETED')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-canvas-deep hover:bg-emerald-400 transition-all flex items-center gap-1 shadow-sm"
                                >
                                  <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                                  <span>تم التحويل</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingPayoutId === p.id}
                                  onClick={() => handleUpdatePayout(p.id, 'REJECTED')}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-1"
                                >
                                  <HiOutlineXCircle className="w-3.5 h-3.5" />
                                  <span>رفض</span>
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePayout(p.id)}
                              title="حذف سجل طلب السحب"
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all inline-flex items-center text-xs"
                            >
                              <HiOutlineTrash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TAB 5: CREATIVES & MARKETING POSTS ══════════════ */}
      {activeTab === 'creatives' && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="p-5 rounded-2xl bg-surface-container-low border border-border-structural/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  بوستات جاهزة بمقاسات السوشيال ميديا
                </span>
                <span className="text-xs text-on-surface-variant font-mono">
                  {filteredCreatives.length} إعلان متوفر
                </span>
              </div>
              <h3 className="text-lg font-black text-on-surface mt-1">
                المواد الإعلانية والتسويقية للشركاء (Creatives)
              </h3>
              <p className="text-xs text-on-surface-variant/80 mt-1 max-w-2xl leading-relaxed">
                هذه الإعلانات والبوستات تظهر لشركاء برنامج الـ 10% في صفحة الداشبورد الخاصة بهم. يمكنهم بنقرة واحدة نسخ نص المنشور (مع استبدال الرابط برابط إحالتهم الخاص تلقائياً) وتحميل الصورة المرفقة لمشاركتها مباشرة على فيسبوك، واتساب، وتيليجرام.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddCreative}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-canvas-deep font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 shrink-0"
            >
              <HiOutlinePlus className="w-4 h-4" />
              <span>إضافة إعلان ترويجي جديد</span>
            </button>
          </div>

          {/* Creatives Grid */}
          {filteredCreatives.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low border border-border-structural/80 rounded-2xl p-6">
              <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mx-auto text-on-surface-variant/50 mb-3">
                <HiOutlinePhotograph className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-on-surface mb-1">لا توجد إعلانات ترويجية حالياً</h4>
              <p className="text-xs text-on-surface-variant/70 mb-4 max-w-sm mx-auto">
                قم بإضافة أول إعلان وصورة تسويقية ليتمكن الشركاء من ترويج المنصة وجلب مشتركين جدد.
              </p>
              <button
                type="button"
                onClick={handleOpenAddCreative}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-canvas-deep font-black text-xs transition-all inline-flex items-center gap-1.5"
              >
                <HiOutlinePlus className="w-4 h-4" />
                <span>إضافة إعلان جديد الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCreatives.map((crt) => (
                <div
                  key={crt.id}
                  className="bg-surface-container-low border border-border-structural/80 hover:border-emerald-500/40 rounded-2xl overflow-hidden flex flex-col transition-all shadow-sm group"
                >
                  {/* Image Banner */}
                  <div className="relative aspect-[16/9] bg-surface-container overflow-hidden">
                    {crt.imageUrl ? (
                      <img
                        src={crt.imageUrl}
                        alt={crt.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/Images/Main/login-visual.webp';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/40 gap-2">
                        <HiOutlinePhotograph className="w-10 h-10" />
                        <span className="text-[11px] font-bold">بدون صورة مرفقة</span>
                      </div>
                    )}

                    {/* Badge Overlay */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-black/70 backdrop-blur-md text-white border border-white/20">
                        {crt.badge || 'عام'}
                      </span>
                    </div>

                    {/* Status Toggle Badge */}
                    <button
                      type="button"
                      onClick={() => handleToggleCreativeActive(crt)}
                      title={crt.isActive !== false ? 'انقر لتعطيل الإعلان' : 'انقر لتفعيل الإعلان'}
                      className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md transition-all flex items-center gap-1 border ${
                        crt.isActive !== false
                          ? 'bg-emerald-500/80 text-white border-emerald-400/50 hover:bg-emerald-600'
                          : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${crt.isActive !== false ? 'bg-white animate-pulse' : 'bg-zinc-400'}`} />
                      <span>{crt.isActive !== false ? 'مفعل في الداشبورد' : 'معطل'}</span>
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-black text-sm text-on-surface mb-2 leading-snug">
                        {crt.title || 'إعلان ترويجي'}
                      </h4>

                      {/* Caption Preview Box */}
                      <div className="p-3 rounded-xl bg-surface-container/60 border border-border-structural/60 text-xs text-on-surface-variant leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap font-sans select-text">
                        {crt.caption || 'لا يوجد نص مرفق'}
                      </div>
                    </div>

                    {/* Helper Info & Actions */}
                    <div className="pt-2 border-t border-border-structural/50 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-on-surface-variant/60 font-mono">
                        {crt.createdAt ? new Date(crt.createdAt).toLocaleDateString('ar-EG') : ''}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Copy Preview */}
                        <button
                          type="button"
                          onClick={() => copyToClipboard(crt.caption || '')}
                          title="نسخ نص المنشور"
                          className="p-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all text-xs"
                        >
                          <HiOutlineClipboardCopy className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditCreative(crt)}
                          title="تعديل بيانات الإعلان والصورة"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all text-xs font-bold flex items-center gap-1"
                        >
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setCreativeToDelete(crt)}
                          title="حذف الإعلان"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-xs"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ MODAL: DELETE PARTNER CONFIRMATION ══════════════ */}
      {partnerToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-red-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-right animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-border-structural/60">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <HiOutlineTrash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-on-surface">حذف المستخدم من برنامج الشركاء</h3>
                <p className="text-xs text-on-surface-variant/80 mt-0.5">
                  إلغاء صلاحية الشريك وتوقيف كود الإحالة الخاص به
                </p>
              </div>
            </div>

            {/* Target Partner Info Card */}
            <div className="my-5 p-4 rounded-2xl bg-surface-container-low border border-border-structural/80 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">اسم المسوق:</span>
                <span className="font-bold text-on-surface">{partnerToDelete.userName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">البريد الإلكتروني:</span>
                <span className="font-mono text-on-surface">{partnerToDelete.userEmail || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">كود الإحالة:</span>
                <span className="px-2 py-0.5 rounded font-mono font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                  {partnerToDelete.referralCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-on-surface-variant">الرصيد المستحق:</span>
                <span className="font-bold text-emerald-400">
                  ${Number(partnerToDelete.availableBalance || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Deletion Options */}
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-2.5 text-xs text-on-surface cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteRelated}
                  onChange={(e) => setDeleteRelated(e.target.checked)}
                  className="mt-0.5 rounded border-border-structural accent-red-500 cursor-pointer"
                />
                <span>
                  حذف كافة الإحالات المسجلة، النقرات، وسجلات المشتركين المرتبطة بهذا الكود أيضاً
                </span>
              </label>

              {partnerToDelete.userId && (
                <label className="flex items-start gap-2.5 text-xs text-red-300/90 cursor-pointer select-none bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  <input
                    type="checkbox"
                    checked={deleteAccountFromDB}
                    onChange={(e) => setDeleteAccountFromDB(e.target.checked)}
                    className="mt-0.5 rounded border-red-500 accent-red-500 cursor-pointer"
                  />
                  <span>
                    <strong>حذف حساب المستخدم نهائياً</strong> من قاعدة بيانات المنصة بالكامل (Super Admin)
                  </span>
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeletingPartner}
                onClick={handleConfirmDeletePartner}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingPartner ? (
                  <span>جاري الحذف...</span>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>تأكيد الحذف نهائياً</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeletingPartner}
                onClick={() => setPartnerToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: ADD / EDIT CREATIVE ══════════════ */}
      {creativeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface-container-high border border-border-structural rounded-3xl p-6 max-w-xl w-full shadow-2xl text-right animate-in fade-in zoom-in duration-200 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-structural/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <HiOutlinePhotograph className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-on-surface">
                    {editingCreative ? 'تعديل الإعلان الترويجي' : 'إضافة إعلان ترويجي جديد للشركاء'}
                  </h3>
                  <p className="text-xs text-on-surface-variant/80 mt-0.5">
                    سيظهر هذا الإعلان في صفحة الداشبورد الخاصة بالشركاء لمشاركته مع روابطهم
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreativeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface text-sm"
              >
                ✕
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSaveCreative} className="space-y-4 my-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  عنوان الإعلان (داخلي للتمييز في الداشبورد)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إعلان كورس تدفق السيولة المؤسسية Order Flow"
                  value={creativeForm.title}
                  onChange={(e) => setCreativeForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-surface-container-low border border-border-structural text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Badge / Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    المنصة / تصنيف الإعلان
                  </label>
                  <select
                    value={creativeForm.badge}
                    onChange={(e) => setCreativeForm((prev) => ({ ...prev, badge: e.target.value }))}
                    className="w-full px-4 py-2.5 text-xs rounded-xl bg-surface-container-low border border-border-structural text-on-surface focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="بوست فيسبوك وانستغرام">بوست فيسبوك وانستغرام</option>
                    <option value="تيليجرام وواتساب">تيليجرام وواتساب</option>
                    <option value="تويتر / X">تويتر / X</option>
                    <option value="ستوري / ريلز">ستوري / ريلز</option>
                    <option value="منشور عام">منشور عام</option>
                  </select>
                </div>

                {/* Status Toggle */}
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    حالة الظهور للشركاء
                  </label>
                  <label className="flex items-center gap-2.5 h-[38px] px-3 rounded-xl bg-surface-container-low border border-border-structural cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={creativeForm.isActive}
                      onChange={(e) => setCreativeForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-border-structural accent-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">
                      {creativeForm.isActive ? 'مفعل وظاهر في الداشبورد' : 'مخفي مؤقتاً (معطل)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Image Cloud Upload */}
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  صورة الإعلان الترويجي (Direct Cloud Upload أو رابط مباشر)
                </label>
                <CloudUploadWidget
                  value={creativeForm.imageUrl}
                  onChange={(url) => setCreativeForm((prev) => ({ ...prev, imageUrl: url }))}
                  folder="affiliates"
                  accept="image/*"
                  label="اختر صورة من جهازك لرفعها مباشرة"
                  placeholder="https://... أو اختر ملفاً للرفع"
                />

                {creativeForm.imageUrl && (
                  <div className="mt-2.5 p-2 rounded-xl bg-surface-container-low border border-border-structural flex items-center gap-3">
                    <img
                      src={creativeForm.imageUrl}
                      alt="معاينة"
                      className="w-16 h-12 rounded-lg object-cover bg-black/40 border border-white/10 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-emerald-400 block">تم تعيين الصورة بنجاح</span>
                      <span className="text-[10px] text-on-surface-variant font-mono truncate block">
                        {creativeForm.imageUrl}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption Textarea with {LINK} helper */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-on-surface">
                    نص المنشور الترويجي (الكابشن)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const tag = '{LINK}';
                      setCreativeForm((prev) => ({
                        ...prev,
                        caption: prev.caption ? `${prev.caption}\n${tag}` : tag,
                      }));
                    }}
                    className="text-[11px] font-bold text-accent-primary hover:underline flex items-center gap-1"
                  >
                    <span>+ إدراج رمز الرابط &#123;LINK&#125;</span>
                  </button>
                </div>

                <textarea
                  rows={5}
                  required
                  placeholder="اكتب نص المنشور هنا. سيتم تلقائياً استبدال {LINK} برابط إحالة الشريك الخاص به..."
                  value={creativeForm.caption}
                  onChange={(e) => setCreativeForm((prev) => ({ ...prev, caption: e.target.value }))}
                  className="w-full px-4 py-2.5 text-xs rounded-xl bg-surface-container-low border border-border-structural text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />

                <p className="text-[10px] text-on-surface-variant/70 mt-1 leading-relaxed">
                  ملاحظة: عند مشاركة الشريك للمنشور، سيقوم النظام باستبدال الرمز <code>&#123;LINK&#125;</code> تلقائياً برابط إحالته الشخصي مع كوده الخاص.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-border-structural/60">
                <button
                  type="submit"
                  disabled={isSavingCreative}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-canvas-deep font-black text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSavingCreative ? (
                    <span>جاري الحفظ...</span>
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="w-4 h-4" />
                      <span>{editingCreative ? 'تحديث الإعلان' : 'نشر الإعلان للشركاء'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSavingCreative}
                  onClick={() => setCreativeModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold text-xs transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL: DELETE CREATIVE CONFIRMATION ══════════════ */}
      {creativeToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-high border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl text-right animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 pb-4 border-b border-border-structural/60">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <HiOutlineTrash className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-on-surface">حذف الإعلان الترويجي</h3>
                <p className="text-xs text-on-surface-variant/80 mt-0.5">
                  هل أنت متأكد من حذف هذا الإعلان من لوحة تحكم الشركاء؟
                </p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-surface-container-low border border-border-structural/80 flex items-center gap-3">
              {creativeToDelete.imageUrl && (
                <img
                  src={creativeToDelete.imageUrl}
                  alt={creativeToDelete.title}
                  className="w-16 h-12 rounded-xl object-cover bg-black/40 shrink-0"
                />
              )}
              <div className="min-w-0">
                <h4 className="text-xs font-black text-on-surface truncate">{creativeToDelete.title}</h4>
                <span className="text-[10px] text-on-surface-variant block mt-0.5">{creativeToDelete.badge}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeletingCreative}
                onClick={handleConfirmDeleteCreative}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeletingCreative ? (
                  <span>جاري الحذف...</span>
                ) : (
                  <>
                    <HiOutlineTrash className="w-4 h-4" />
                    <span>تأكيد الحذف</span>
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={isDeletingCreative}
                onClick={() => setCreativeToDelete(null)}
                className="py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-bold text-xs transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
