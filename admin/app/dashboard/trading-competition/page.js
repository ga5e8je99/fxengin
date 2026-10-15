'use client';

import React, { useState, useEffect } from 'react';
import {
  fetchAdminTradingLeaderboard,
  fetchAdminTradingAccounts,
  fetchAdminTradingPlans,
  createAdminTradingPlan,
  updateAdminTradingPlan,
  deleteAdminTradingPlan,
  resetAdminTradingAccount,
  updateAdminTradingAccountStatus,
  createAdminManualParticipant,
  updateAdminTradingAccount,
  deleteAdminTradingAccount,
} from '../../services/tradingCompetitionService';
import { toast } from 'react-toastify';
import {
  FaTrophy,
  FaMedal,
  FaChartLine,
  FaUsers,
  FaCog,
  FaPlus,
  FaRedo,
  FaBan,
  FaCheckCircle,
  FaServer,
  FaDollarSign,
  FaBolt,
  FaSearch,
  FaFilter,
  FaExchangeAlt,
  FaTelegramPlane,
  FaInstagram,
  FaFacebook,
  FaLink,
  FaCopy,
  FaCheckDouble,
  FaExternalLinkAlt,
  FaUserCheck,
  FaUserPlus,
  FaHourglassHalf,
  FaShieldAlt,
  FaCheck,
  FaTimes,
  FaEye,
  FaEdit,
  FaTrash,
  FaBuilding,
  FaIdCard,
} from 'react-icons/fa';

export default function TradingCompetitionAdminPage() {
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard', 'plans', 'accounts', 'qualifications'
  const [loading, setLoading] = useState(true);

  // Data states
  const [leaderboard, setLeaderboard] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [plans, setPlans] = useState([]);

  // Qualifications & Sub-links states
  const [qualifications, setQualifications] = useState([]);
  const [qualificationStats, setQualificationStats] = useState({
    totalParticipants: 0,
    qualifiedCount: 0,
    inProgressCount: 0,
    totalClicks: 0,
  });
  const [recentClicks, setRecentClicks] = useState([]);
  const [qualSearchQuery, setQualSearchQuery] = useState('');
  const [qualStatusFilter, setQualStatusFilter] = useState('ALL');
  const [selectedSublinkParticipant, setSelectedSublinkParticipant] = useState(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState('ALL');

  // Modal State for Plan Create/Edit
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    titleAr: '',
    titleEn: '',
    initialBalance: 25000,
    leverage: 200,
    brokerServer: 'FXENGIN Prime ECN',
    maxDailyDrawdown: 5.0,
    maxTotalDrawdown: 12.0,
    pointsPerPip: 1.5,
    badgeName: 'PRO TRADER',
    descriptionAr: '',
    descriptionEn: '',
    targetProductType: 'COMMUNITY_GROUP',
  });

  // Manual Participant Modal state (مشترك عبر الشركة)
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [savingManual, setSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    accountNumber: '',
    planId: '',
    brokerServer: 'FXENGIN Prime ECN (اشتراك عبر الشركة)',
    initialBalance: 25000,
    balance: 25000,
    equity: 25000,
    leverage: 100,
    points: 1200,
    totalPips: 85,
    totalTrades: 10,
    winTrades: 8,
    lossTrades: 2,
    status: 'ACTIVE',
    isCompanyDirect: true,
    isQualified: true,
    note: 'مشترك عبر الشركة مباشرة',
  });

  // Action Loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lbRes, accRes, plansRes, qualRes] = await Promise.all([
        fetchAdminTradingLeaderboard(100),
        fetchAdminTradingAccounts({ search: searchQuery, planId: selectedPlanFilter }),
        fetchAdminTradingPlans(),
        fetch('/api/competition/qualifications', { cache: 'no-store' }).then((r) => r.json()).catch(() => ({})),
      ]);

      if (lbRes.success) setLeaderboard(lbRes.leaderboard || []);
      if (accRes.success) setAccounts(accRes.accounts || []);
      if (plansRes.success) setPlans(plansRes.plans || []);
      if (qualRes?.success) {
        setQualifications(qualRes.participants || []);
        setQualificationStats(qualRes.stats || {
          totalParticipants: 0,
          qualifiedCount: 0,
          inProgressCount: 0,
          totalClicks: 0,
        });
        setRecentClicks(qualRes.recentClicks || []);
      }
    } catch (err) {
      console.error('Failed to load trading competition data:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات مسابقة التداول');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQualification = async (participant) => {
    if (!confirm(`هل تريد اعتماد وتأهيل المتسابق "${participant.name || participant.userId}" يدوياً؟ سيتمكن فوراً من دخول صفحة المسابقة والتداول.`)) {
      return;
    }
    setActionLoadingId(`qual-approve-${participant.userId}`);
    try {
      const res = await fetch('/api/competition/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', userId: participant.userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success(data.message || 'تم اعتماد وتأهيل المتسابق بنجاح');
        loadData();
      } else {
        toast.error(data.message || 'فشلت العملية');
      }
    } catch {
      toast.error('حدث خطأ أثناء اعتماد المتسابق');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetQualification = async (participant) => {
    if (!confirm(`تحذير: هل أنت متأكد من تصفير وإعادة ضبط عدادات ومهام المتسابق "${participant.name || participant.userId}"؟`)) {
      return;
    }
    setActionLoadingId(`qual-reset-${participant.userId}`);
    try {
      const res = await fetch('/api/competition/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset', userId: participant.userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success(data.message || 'تمت إعادة ضبط عدادات المتسابق');
        loadData();
      } else {
        toast.error(data.message || 'فشلت العملية');
      }
    } catch {
      toast.error('حدث خطأ أثناء إعادة الضبط');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateTier = async (userId, balance, category) => {
    try {
      const res = await fetch('/api/competition/qualifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_tier', userId, balance, category }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success(data.message || 'تم تحديث فئة ورصيد المتسابق');
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('فشل تحديث الفئة');
    }
  };

  const handleCopyLink = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedLinkKey(key);
    toast.info('تم نسخ الرابط الفرعي!');
    setTimeout(() => setCopiedLinkKey(null), 2500);
  };

  useEffect(() => {
    loadData();
  }, [selectedPlanFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenManualModal = (acc = null) => {
    if (acc) {
      setEditingAccount(acc);
      const initBal = acc.initialBalance || 25000;
      const bal = acc.balance !== undefined ? acc.balance : initBal;
      setManualForm({
        fullName: acc.accountName || acc.userName || '',
        email: acc.userEmail || '',
        phone: acc.phone || '',
        accountNumber: acc.accountNumber || '',
        planId: acc.planId || '',
        brokerServer: acc.brokerServer || 'FXENGIN Prime ECN (اشتراك عبر الشركة)',
        initialBalance: initBal,
        balance: bal,
        equity: acc.equity !== undefined ? acc.equity : bal,
        leverage: acc.leverage || 100,
        points: acc.points || 0,
        totalPips: acc.totalPips || 0,
        totalTrades: acc.totalTrades || 0,
        winTrades: acc.winTrades || 0,
        lossTrades:
          acc.lossTrades !== undefined
            ? acc.lossTrades
            : Math.max(0, (acc.totalTrades || 0) - (acc.winTrades || 0)),
        status: acc.status || 'ACTIVE',
        isCompanyDirect: true,
        isQualified: true,
        note: 'مشترك عبر الشركة مباشرة',
      });
    } else {
      setEditingAccount(null);
      const randomAcc = String(500000 + Math.floor(Math.random() * 499999));
      const defaultPlan = plans[0] || null;
      const initBal = defaultPlan ? defaultPlan.initialBalance : 25000;
      setManualForm({
        fullName: '',
        email: '',
        phone: '',
        accountNumber: randomAcc,
        planId: defaultPlan ? defaultPlan.id : '',
        brokerServer: defaultPlan?.brokerServer || 'FXENGIN Prime ECN (اشتراك عبر الشركة)',
        initialBalance: initBal,
        balance: initBal,
        equity: initBal,
        leverage: defaultPlan?.leverage || 100,
        points: 0,
        totalPips: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        status: 'ACTIVE',
        isCompanyDirect: true,
        isQualified: true,
        note: 'مشترك عبر الشركة مباشرة',
      });
    }
    setManualModalOpen(true);
  };

  const handleGenerateAccountNumber = () => {
    const randomAcc = String(500000 + Math.floor(Math.random() * 499999));
    setManualForm((prev) => ({ ...prev, accountNumber: randomAcc }));
    toast.info(`تم توليد رقم الحساب: #${randomAcc}`);
  };

  const handlePlanSelectForManual = (planId) => {
    const selected = plans.find((p) => p.id === planId);
    if (selected) {
      setManualForm((prev) => ({
        ...prev,
        planId,
        initialBalance: selected.initialBalance,
        balance: prev.balance === prev.initialBalance ? selected.initialBalance : prev.balance,
        equity: prev.equity === prev.initialBalance ? selected.initialBalance : prev.equity,
        leverage: selected.leverage || prev.leverage,
        brokerServer: selected.brokerServer || prev.brokerServer,
      }));
    } else {
      setManualForm((prev) => ({ ...prev, planId }));
    }
  };

  const handleSaveManualParticipant = async (e) => {
    e.preventDefault();
    if (!manualForm.fullName?.trim() || !manualForm.email?.trim()) {
      toast.warning('يرجى كتابة اسم المتسابق وبريده الإلكتروني');
      return;
    }

    setSavingManual(true);
    try {
      if (editingAccount) {
        // 1. Update account in backend
        const res = await updateAdminTradingAccount(editingAccount.id, manualForm);
        if (res.success) {
          // 2. Sync to qualifications file
          await fetch('/api/competition/qualifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_manual_participant',
              userId: editingAccount.userId || editingAccount.id,
              userName: manualForm.fullName,
              userEmail: manualForm.email,
              userPhone: manualForm.phone,
              assignedBalance: manualForm.initialBalance,
              planCategory: plans.find((p) => p.id === manualForm.planId)?.titleAr || 'PRO',
              accountNumber: manualForm.accountNumber,
              broker: manualForm.brokerServer,
            }),
          }).catch(() => {});

          toast.success('تم تحديث بيانات المتسابق ونتائجه بنجاح');
          setManualModalOpen(false);
          loadData();
        } else {
          toast.error(res.message || 'فشل تحديث الحساب');
        }
      } else {
        // 1. Create in backend
        const res = await createAdminManualParticipant(manualForm);
        if (res.success) {
          const createdAcc = res.account;
          // 2. Sync to qualifications file
          await fetch('/api/competition/qualifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_manual_participant',
              userId: res.userId || createdAcc.id,
              userName: manualForm.fullName,
              userEmail: manualForm.email,
              userPhone: manualForm.phone,
              assignedBalance: manualForm.initialBalance,
              planCategory: plans.find((p) => p.id === manualForm.planId)?.titleAr || 'PRO',
              accountNumber: manualForm.accountNumber,
              broker: manualForm.brokerServer,
            }),
          }).catch(() => {});

          toast.success(res.message || 'تمت إضافة المتسابق المشترك وتأهيله للوحة المتصدرين بنجاح!');
          setManualModalOpen(false);
          loadData();
        } else {
          toast.error(res.message || 'فشلت إضافة المتسابق');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ بيانات المتسابق');
    } finally {
      setSavingManual(false);
    }
  };

  const handleDeleteAccount = async (account) => {
    if (
      !confirm(
        `تحذير نهائي: هل أنت متأكد من حذف حساب المتسابق "${
          account.accountName || account.accountNumber
        }" نهائياً من المسابقة ولوحة المتصدرين؟`,
      )
    ) {
      return;
    }
    setActionLoadingId(`delete-${account.id}`);
    try {
      const res = await deleteAdminTradingAccount(account.id);
      if (res.success) {
        // Also remove from qualifications
        await fetch('/api/competition/qualifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_participant',
            userId: account.userId || account.id,
            email: account.userEmail,
          }),
        }).catch(() => {});

        toast.success(res.message || 'تم حذف الحساب بنجاح');
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('فشل حذف الحساب');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResetAccount = async (account) => {
    if (!confirm(`هل أنت متأكد من رغبتك في إعادة ضبط حساب #${account.accountNumber} لرصيده الابتدائي؟ سيتم إغلاق الصفقات وإرجاع النقاط للصفر.`)) {
      return;
    }
    setActionLoadingId(account.id);
    try {
      const res = await resetAdminTradingAccount(account.id);
      if (res.success) {
        toast.success(res.message || 'تمت إعادة ضبط الحساب بنجاح');
        loadData();
      } else {
        toast.error(res.message || 'فشلت العملية');
      }
    } catch (err) {
      toast.error('خطأ أثناء إعادة الضبط');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (account) => {
    const newStatus = account.status === 'ACTIVE' ? 'DISQUALIFIED' : 'ACTIVE';
    const actionName = newStatus === 'DISQUALIFIED' ? 'استبعاد' : 'تفعيل';
    if (!confirm(`هل تريد ${actionName} حساب المتداول #${account.accountNumber} من المسابقة؟`)) return;

    setActionLoadingId(account.id);
    try {
      const res = await updateAdminTradingAccountStatus(account.id, newStatus);
      if (res.success) {
        toast.success(res.message || `تم ${actionName} الحساب بنجاح`);
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('فشل تحديث الحالة');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenPlanModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        titleAr: plan.titleAr,
        titleEn: plan.titleEn,
        initialBalance: plan.initialBalance,
        leverage: plan.leverage,
        brokerServer: plan.brokerServer,
        maxDailyDrawdown: plan.maxDailyDrawdown,
        maxTotalDrawdown: plan.maxTotalDrawdown,
        pointsPerPip: plan.pointsPerPip,
        badgeName: plan.badgeName || 'PRO TRADER',
        descriptionAr: plan.descriptionAr || '',
        descriptionEn: plan.descriptionEn || '',
        targetProductType: plan.targetProductType || 'COMMUNITY_GROUP',
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        titleAr: '',
        titleEn: '',
        initialBalance: 25000,
        leverage: 200,
        brokerServer: 'FXENGIN Prime ECN',
        maxDailyDrawdown: 5.0,
        maxTotalDrawdown: 12.0,
        pointsPerPip: 1.5,
        badgeName: 'PRO TRADER',
        descriptionAr: '',
        descriptionEn: '',
        targetProductType: 'COMMUNITY_GROUP',
      });
    }
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.titleAr || !planForm.initialBalance) {
      toast.warning('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    try {
      if (editingPlan) {
        const res = await updateAdminTradingPlan(editingPlan.id, planForm);
        if (res.success) {
          toast.success('تم تحديث الباقة بنجاح');
          setPlanModalOpen(false);
          loadData();
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await createAdminTradingPlan(planForm);
        if (res.success) {
          toast.success('تمت إضافة الباقة بنجاح');
          setPlanModalOpen(false);
          loadData();
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ الباقة');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    try {
      const res = await deleteAdminTradingPlan(planId);
      if (res.success) {
        toast.success('تم حذف الباقة');
        loadData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('فشل حذف الباقة');
    }
  };

  // Top 3 Podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="min-h-screen bg-[#01071E] text-slate-100 p-4 md:p-8 font-sans" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 border-b border-[#12315C] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-[#0458EC] to-[#0488F8] text-white shadow-lg shadow-blue-500/20">
              <FaTrophy className="text-2xl" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                مسابقة التداول ومحاكي MT5
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                إدارة المسابقة، حسابات الـ Demo التجريبية للباقات، ولوحة شرف المتصدرين
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenManualModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0458EC] to-[#0488F8] text-white font-bold shadow-lg shadow-blue-500/25 hover:brightness-110 transition active:scale-95 text-sm"
          >
            <FaUserPlus /> إضافة متسابق يدوي (مشترك عبر الشركة)
          </button>
          <button
            onClick={() => handleOpenPlanModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FA5A04] to-[#FB8704] text-white font-bold shadow-lg shadow-orange-500/20 hover:brightness-110 transition active:scale-95 text-sm"
          >
            <FaPlus /> إضافة باقة حساب تجريبي
          </button>
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-[#06142F] border border-[#12315C] text-slate-300 hover:text-white hover:border-[#0488F8] transition"
            title="تحديث البيانات"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#06142F]/80 backdrop-blur border border-[#12315C] rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0488F8]/10 rounded-full blur-2xl group-hover:bg-[#0488F8]/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">إجمالي المتسابقين</span>
            <FaUsers className="text-[#0488F8]" />
          </div>
          <div className="text-3xl font-black text-white">{accounts.length}</div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <FaCheckCircle /> حسابات مسجلة ومفعلة
          </div>
        </div>

        <div className="bg-[#06142F]/80 backdrop-blur border border-[#12315C] rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FB8704]/10 rounded-full blur-2xl group-hover:bg-[#FB8704]/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">المتصدر الحالي</span>
            <FaTrophy className="text-[#FB8704]" />
          </div>
          <div className="text-2xl font-black text-amber-300 truncate">
            {top1 ? top1.traderName : 'في الانتظار'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {top1 ? `${top1.points.toLocaleString()} نقطة (${top1.totalPips} Pip)` : 'لا يوجد صفقات بعد'}
          </div>
        </div>

        <div className="bg-[#06142F]/80 backdrop-blur border border-[#12315C] rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">باقات المسابقة النشطة</span>
            <FaServer className="text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">{plans.length}</div>
          <div className="text-xs text-slate-400 mt-2">مواصفات ورصيد تجريبي مختلف</div>
        </div>

        <div className="bg-[#06142F]/80 backdrop-blur border border-[#12315C] rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">إجمالي النقاط المحققة</span>
            <FaBolt className="text-purple-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {leaderboard.reduce((acc, curr) => acc + (curr.points || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-purple-300 mt-2">نقاط أداء تداول تراكمية</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#12315C] mb-6">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition ${
            activeTab === 'leaderboard'
              ? 'border-[#0488F8] text-[#0488F8] bg-[#0488F8]/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FaTrophy /> لوحة المتصدرين والترتيب (Leaderboard)
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition ${
            activeTab === 'plans'
              ? 'border-[#FB8704] text-[#FB8704] bg-[#FB8704]/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FaCog /> باقات الحسابات التجريبية وشروط البروكر ({plans.length})
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 transition ${
            activeTab === 'accounts'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FaUsers /> الحسابات التجريبية الحية والمراقبة ({accounts.length})
        </button>

        <button
          onClick={() => setActiveTab('qualifications')}
          className={`flex items-center gap-2 px-6 py-3.5 font-bold text-sm border-b-2 whitespace-nowrap transition ${
            activeTab === 'qualifications'
              ? 'border-[#0488F8] text-[#0488F8] bg-[#0488F8]/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FaCheckDouble /> شروط التأهل والروابط الفرعية ({qualificationStats.totalParticipants})
        </button>
      </div>

      {/* TAB 1: LEADERBOARD */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-8">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Silver 2nd */}
              <div className="bg-gradient-to-b from-[#0A1B3D] to-[#06142F] border border-slate-400/30 rounded-3xl p-6 text-center relative shadow-xl order-2 md:order-1 transform hover:-translate-y-1 transition duration-300">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 flex items-center justify-center text-slate-900 text-3xl font-black shadow-lg shadow-slate-400/20">
                  2
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">المركز الثاني</div>
                <h3 className="text-xl font-black text-white">{top2?.traderName}</h3>
                <div className="inline-block px-3 py-1 bg-slate-400/10 text-slate-300 text-xs rounded-full font-semibold my-2">
                  {top2?.planTitle}
                </div>
                <div className="mt-3 p-3 bg-[#01071E]/60 rounded-xl border border-[#12315C]">
                  <div className="text-2xl font-black text-white">{top2?.points.toLocaleString()} <span className="text-xs text-slate-400">نقطة</span></div>
                  <div className="text-xs text-emerald-400 font-bold mt-1">
                    {top2?.profit >= 0 ? `+${top2?.profit.toLocaleString()}$` : `${top2?.profit.toLocaleString()}$`} ({top2?.roiPercent}%)
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-3 flex justify-between px-2">
                  <span>نسبة الفوز: {top2?.winRate}%</span>
                  <span>البيب: {top2?.totalPips} Pip</span>
                </div>
              </div>

              {/* Gold 1st */}
              <div className="bg-gradient-to-b from-[#1c1809] to-[#06142F] border-2 border-amber-400/60 rounded-3xl p-7 text-center relative shadow-2xl order-1 md:order-2 transform md:-translate-y-4 hover:-translate-y-5 transition duration-300">
                <div className="absolute -top-4 right-1/2 transform translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-black text-xs rounded-full shadow-lg">
                  بطل المسابقة الحالي
                </div>
                <div className="w-20 h-20 mx-auto mt-2 mb-3 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-300 flex items-center justify-center text-slate-950 text-4xl font-black shadow-xl shadow-amber-500/30">
                  1
                </div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">المركز الأول</div>
                <h3 className="text-2xl font-black text-white">{top1?.traderName}</h3>
                <div className="inline-block px-3 py-1 bg-amber-400/10 text-amber-300 text-xs rounded-full font-bold my-2">
                  {top1?.planTitle}
                </div>
                <div className="mt-3 p-4 bg-[#01071E]/80 rounded-2xl border border-amber-400/30">
                  <div className="text-3xl font-black text-amber-300">{top1?.points.toLocaleString()} <span className="text-xs text-amber-400/70">نقطة</span></div>
                  <div className="text-sm text-emerald-400 font-bold mt-1">
                    {top1?.profit >= 0 ? `+${top1?.profit.toLocaleString()}$` : `${top1?.profit.toLocaleString()}$`} ({top1?.roiPercent}%)
                  </div>
                </div>
                <div className="text-xs text-slate-300 mt-4 flex justify-between px-2">
                  <span>نسبة الفوز: <b className="text-emerald-400">{top1?.winRate}%</b></span>
                  <span>إجمالي البيب: <b className="text-amber-300">{top1?.totalPips} Pip</b></span>
                </div>
              </div>

              {/* Bronze 3rd */}
              <div className="bg-gradient-to-b from-[#0A1B3D] to-[#06142F] border border-amber-700/40 rounded-3xl p-6 text-center relative shadow-xl order-3 md:order-3 transform hover:-translate-y-1 transition duration-300">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-amber-700/20">
                  3
                </div>
                <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">المركز الثالث</div>
                <h3 className="text-xl font-black text-white">{top3?.traderName}</h3>
                <div className="inline-block px-3 py-1 bg-amber-700/10 text-amber-500 text-xs rounded-full font-semibold my-2">
                  {top3?.planTitle}
                </div>
                <div className="mt-3 p-3 bg-[#01071E]/60 rounded-xl border border-[#12315C]">
                  <div className="text-2xl font-black text-white">{top3?.points.toLocaleString()} <span className="text-xs text-slate-400">نقطة</span></div>
                  <div className="text-xs text-emerald-400 font-bold mt-1">
                    {top3?.profit >= 0 ? `+${top3?.profit.toLocaleString()}$` : `${top3?.profit.toLocaleString()}$`} ({top3?.roiPercent}%)
                  </div>
                </div>
                <div className="text-xs text-slate-400 mt-3 flex justify-between px-2">
                  <span>نسبة الفوز: {top3?.winRate}%</span>
                  <span>البيب: {top3?.totalPips} Pip</span>
                </div>
              </div>
            </div>
          )}

          {/* Full Table */}
          <div className="bg-[#06142F] border border-[#12315C] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#12315C] flex flex-col md:flex-row items-center justify-between gap-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <FaTrophy className="text-[#0488F8]" /> قائمة المتصدرين الكاملة لمسابقة FXENGIN
              </h2>
              <div className="text-xs text-slate-400">
                يتم احتساب الترتيب تلقائياً بناءً على مجموع النقاط، نسبة الربح المحقق، ونقاط البيب
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-[#0A1B3D] text-slate-300 font-bold border-b border-[#12315C]">
                    <th className="py-4 px-4 text-center">الترتيب</th>
                    <th className="py-4 px-4">المتداول</th>
                    <th className="py-4 px-4">رقم الحساب</th>
                    <th className="py-4 px-4">الباقة التجريبية</th>
                    <th className="py-4 px-4 text-center">النقاط</th>
                    <th className="py-4 px-4 text-center">البيب الإجمالي</th>
                    <th className="py-4 px-4 text-center">صافي الأرباح</th>
                    <th className="py-4 px-4 text-center">العائد ROI %</th>
                    <th className="py-4 px-4 text-center">نسبة الفوز</th>
                    <th className="py-4 px-4 text-center">الصفقات</th>
                    <th className="py-4 px-4 text-center">الحالة</th>
                    <th className="py-4 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12315C]">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="py-12 text-center text-slate-500">
                        لا يوجد متسابقون حالياً. بمجرد تفعيل كود التفعيل والدخول سيبدأ تسجيل الترتيب فوراً.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((trader) => (
                      <tr
                        key={trader.accountId}
                        className={`hover:bg-[#0A1B3D]/50 transition ${
                          trader.rank === 1
                            ? 'bg-amber-400/5'
                            : trader.rank === 2
                            ? 'bg-slate-400/5'
                            : trader.rank === 3
                            ? 'bg-amber-700/5'
                            : ''
                        }`}
                      >
                        <td className="py-4 px-4 text-center font-black">
                          {trader.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black shadow-md">
                              1
                            </span>
                          ) : trader.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black shadow-md">
                              2
                            </span>
                          ) : trader.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-black shadow-md">
                              3
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">#{trader.rank}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#0488F8]/20 text-[#0488F8] flex items-center justify-center font-black text-xs border border-[#0488F8]/30">
                            {trader.traderName.slice(0, 2).toUpperCase()}
                          </div>
                          <span>{trader.traderName}</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-400">
                          {trader.accountNumber}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#12315C] text-slate-200">
                            {trader.planTitle}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-black text-amber-400 text-base">
                          {trader.points.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-blue-400">
                          {trader.totalPips >= 0 ? `+${trader.totalPips}` : trader.totalPips}
                        </td>
                        <td
                          className={`py-4 px-4 text-center font-mono font-bold ${
                            trader.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {trader.profit >= 0
                            ? `+${trader.profit.toLocaleString()}$`
                            : `${trader.profit.toLocaleString()}$`}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-slate-200">
                          {trader.roiPercent}%
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-emerald-400">
                          {trader.winRate}%
                        </td>
                        <td className="py-4 px-4 text-center text-slate-400 font-mono">
                          {trader.totalTrades}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {trader.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> مؤهل
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                              مستبعد
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => {
                              const acc = accounts.find(
                                (a) =>
                                  a.accountNumber === trader.accountNumber ||
                                  a.id === trader.accountId,
                              );
                              handleOpenManualModal(
                                acc || {
                                  id: trader.accountId,
                                  accountNumber: trader.accountNumber,
                                  accountName: trader.traderName,
                                  userEmail: '',
                                  initialBalance: Math.round(trader.balance - trader.profit),
                                  balance: trader.balance,
                                  equity: trader.balance,
                                  points: trader.points,
                                  totalPips: trader.totalPips,
                                  totalTrades: trader.totalTrades,
                                  winTrades: Math.round(
                                    (trader.totalTrades * (trader.winRate || 0)) / 100,
                                  ),
                                  status: trader.status,
                                },
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#0488F8]/10 hover:bg-[#0488F8] text-[#0488F8] hover:text-white text-xs font-bold transition flex items-center gap-1.5 mx-auto"
                            title="تعديل نتائج ورصيد المتسابق"
                          >
                            <FaEdit className="text-xs" /> تعديل
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLANS & PACKAGES MANAGEMENT */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#06142F] p-5 rounded-2xl border border-[#12315C]">
            <div>
              <h2 className="text-lg font-black text-white">إدارة باقات الحسابات التجريبية وشروط التداول</h2>
              <p className="text-xs text-slate-400 mt-1">
                حدد لكل باقة (كورسات، توصيات، كبار المتداولين) الرصيد التجريبي المتاح على البروكر، الرافعة المالية، ونقاط المسابقة.
              </p>
            </div>
            <button
              onClick={() => handleOpenPlanModal()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0458EC] to-[#0488F8] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:brightness-110 transition text-sm whitespace-nowrap"
            >
              <FaPlus /> إنشاء باقة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-[#06142F] border border-[#12315C] hover:border-[#0488F8] rounded-2xl p-6 transition duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-[#12315C] text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                      {plan.badgeName || 'TRADER'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {plan.accountsCount || 0} حساب نشط
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2">{plan.titleAr}</h3>
                  <div className="text-xs text-slate-400 mb-4">{plan.descriptionAr || plan.titleEn}</div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#01071E] rounded-xl border border-[#12315C] mb-4">
                    <div>
                      <div className="text-xs text-slate-400">الرصيد التجريبي:</div>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        ${plan.initialBalance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">الرافعة المالية:</div>
                      <div className="text-lg font-black text-[#FB8704] font-mono">
                        1:{plan.leverage}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">سيرفر الوسيط:</div>
                      <div className="text-xs font-bold text-slate-200 truncate mt-1">
                        {plan.brokerServer}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">مضاعف النقاط:</div>
                      <div className="text-sm font-black text-purple-400 mt-1">
                        {plan.pointsPerPip}x نقطة
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <div className="flex justify-between">
                      <span>أقصى تراجع يومي (Max Daily DD):</span>
                      <span className="font-bold text-amber-400">{plan.maxDailyDrawdown}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>أقصى تراجع إجمالي (Max Total DD):</span>
                      <span className="font-bold text-red-400">{plan.maxTotalDrawdown}%</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[#12315C]">
                  <button
                    onClick={() => handleOpenPlanModal(plan)}
                    className="flex-1 py-2 rounded-xl bg-[#12315C] hover:bg-[#0488F8] text-white text-xs font-bold transition text-center"
                  >
                    تعديل الباقة
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold transition"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE TRADING ACCOUNTS & RADAR */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-[#06142F] p-4 rounded-2xl border border-[#12315C] flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <FaSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="ابحث برقم الحساب التجريبي، اسم المتداول، أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0488F8]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0488F8] text-white rounded-xl text-sm font-bold hover:brightness-110 transition"
              >
                بحث
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
                <FaFilter /> تصفية بالباقة:
              </span>
              <select
                value={selectedPlanFilter}
                onChange={(e) => setSelectedPlanFilter(e.target.value)}
                className="bg-[#01071E] border border-[#12315C] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#0488F8]"
              >
                <option value="ALL">كافة الباقات</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titleAr} (${p.initialBalance.toLocaleString()})
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleOpenManualModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0458EC] to-[#0488F8] text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:brightness-110 transition whitespace-nowrap"
              >
                <FaUserPlus /> + إضافة متسابق يدوي
              </button>
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-[#06142F] border border-[#12315C] rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-[#0A1B3D] text-slate-300 font-bold border-b border-[#12315C]">
                    <th className="py-4 px-4">رقم الحساب</th>
                    <th className="py-4 px-4">المتداول</th>
                    <th className="py-4 px-4">الباقة التجريبية</th>
                    <th className="py-4 px-4 text-center">الرصيد الابتدائي</th>
                    <th className="py-4 px-4 text-center">الرصيد الحالي</th>
                    <th className="py-4 px-4 text-center">السيولة (Equity)</th>
                    <th className="py-4 px-4 text-center">النقاط</th>
                    <th className="py-4 px-4 text-center">الصفقات المفتوحة</th>
                    <th className="py-4 px-4 text-center">الحالة</th>
                    <th className="py-4 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12315C]">
                  {accounts.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-slate-500">
                        لا توجد حسابات مطابقة لمعايير البحث.
                      </td>
                    </tr>
                  ) : (
                    accounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-[#0A1B3D]/50 transition">
                        <td className="py-4 px-4 font-mono font-bold text-amber-400">
                          #{acc.accountNumber}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{acc.accountName}</div>
                          <div className="text-xs text-slate-400">{acc.userEmail || 'مستخدم تجريبي'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#12315C] text-slate-200">
                            {acc.planTitle}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-slate-400">
                          ${acc.initialBalance.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-bold text-white">
                          ${acc.balance.toLocaleString()}
                        </td>
                        <td
                          className={`py-4 px-4 text-center font-mono font-bold ${
                            acc.equity >= acc.initialBalance ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          ${acc.equity.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center font-black text-amber-400">
                          {acc.points.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {acc.openPositionsCount > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0488F8]/20 text-[#0488F8] border border-[#0488F8]/30">
                              {acc.openPositionsCount} صفقات حية
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">لا يوجد</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {acc.status === 'ACTIVE' ? (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              نشط
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                              مستبعد
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenManualModal(acc)}
                              className="p-2 rounded-lg bg-[#0488F8]/10 hover:bg-[#0488F8] text-[#0488F8] hover:text-white transition"
                              title="تعديل بيانات ورصيد ونتائج المتسابق"
                            >
                              <FaEdit className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleResetAccount(acc)}
                              disabled={actionLoadingId === acc.id}
                              className="p-2 rounded-lg bg-[#12315C] hover:bg-[#0488F8] text-slate-200 hover:text-white transition"
                              title="إعادة ضبط الرصيد للابتدائي"
                            >
                              <FaRedo
                                className={`text-xs ${actionLoadingId === acc.id ? 'animate-spin' : ''}`}
                              />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(acc)}
                              disabled={actionLoadingId === acc.id}
                              className={`p-2 rounded-lg transition ${
                                acc.status === 'ACTIVE'
                                  ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white'
                              }`}
                              title={
                                acc.status === 'ACTIVE'
                                  ? 'استبعاد المتداول'
                                  : 'إعادة تفعيل المتداول'
                              }
                            >
                              {acc.status === 'ACTIVE' ? (
                                <FaBan className="text-xs" />
                              ) : (
                                <FaCheckCircle className="text-xs" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteAccount(acc)}
                              disabled={actionLoadingId === `delete-${acc.id}`}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition"
                              title="حذف المتسابق نهائياً"
                            >
                              <FaTrash
                                className={`text-xs ${
                                  actionLoadingId === `delete-${acc.id}` ? 'animate-spin' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUALIFICATIONS & SUB-LINKS */}
      {activeTab === 'qualifications' && (
        <div className="space-y-6">
          {/* Rules Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0458EC]/20 via-[#06142F] to-[#FB8704]/20 border border-[#12315C] relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                  <FaShieldAlt /> الشروط الإلزامية لتأهل المتسابقين ودخول صفحة التداول
                </div>
                <h3 className="text-xl font-black text-white">
                  نظام الروابط الفرعية المخصصة (Sub-Links Tracking) وتوزيع أرصدة الباقات
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 text-xs text-slate-300">
                  <div className="bg-[#01071E]/70 p-3 rounded-xl border border-blue-500/20">
                    <span className="font-bold text-blue-400">1. تليجرام الفوتر:</span>
                    <div>مشاركة الرابط الفرعي مع 10 مستخدمين لتسجيل الدخول</div>
                  </div>
                  <div className="bg-[#01071E]/70 p-3 rounded-xl border border-pink-500/20">
                    <span className="font-bold text-pink-400">2. إنستجرام وفيسبوك:</span>
                    <div>مشاركة الرابط الفرعي مع 10 مستخدمين لكل منصة</div>
                  </div>
                  <div className="bg-[#01071E]/70 p-3 rounded-xl border border-emerald-500/20">
                    <span className="font-bold text-emerald-400">3. مجتمع ربح 10%:</span>
                    <div>الانضمام للمجتمع ومشاركة الرابط الفرعي للبرنامج</div>
                  </div>
                  <div className="bg-[#01071E]/70 p-3 rounded-xl border border-amber-500/20">
                    <span className="font-bold text-amber-400">4. الأرصدة المعتمدة:</span>
                    <div>ذهب $50K | كورسات $25K | أندكس $10K | فوركس $5K</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini KPI Cards for Qualifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#06142F] border border-[#12315C] rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>المشاركون المسجلون</span>
                <FaUsers className="text-[#0488F8]" />
              </div>
              <div className="text-2xl font-black text-white">{qualificationStats.totalParticipants}</div>
              <div className="text-[11px] text-slate-400 mt-1">ممن حاولوا دخول صفحة المسابقة</div>
            </div>

            <div className="bg-[#06142F] border border-[#12315C] rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>المتأهلون للمسابقة</span>
                <FaCheckCircle className="text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">{qualificationStats.qualifiedCount}</div>
              <div className="text-[11px] text-emerald-300/80 mt-1">استوفوا الشروط أو اعتمدوا يدوياً</div>
            </div>

            <div className="bg-[#06142F] border border-[#12315C] rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>قيد استيفاء الشروط</span>
                <FaHourglassHalf className="text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400">{qualificationStats.inProgressCount}</div>
              <div className="text-[11px] text-amber-300/80 mt-1">بانتظار إكمال النقرات والإحالات</div>
            </div>

            <div className="bg-[#06142F] border border-[#12315C] rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>إجمالي نقرات الروابط الفرعية</span>
                <FaLink className="text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400">{qualificationStats.totalClicks}</div>
              <div className="text-[11px] text-purple-300/80 mt-1">زيارات حقيقية مسجلة عبر Sub-Links</div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#06142F] border border-[#12315C] p-4 rounded-2xl">
            <div className="relative flex-1">
              <FaSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder="بحث بالاسم أو البريد الإلكتروني أو معرف المستخدم..."
                value={qualSearchQuery}
                onChange={(e) => setQualSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0488F8]"
              />
            </div>

            <div className="flex items-center gap-2">
              <FaFilter className="text-slate-400 text-sm" />
              <select
                value={qualStatusFilter}
                onChange={(e) => setQualStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-[#0488F8]"
              >
                <option value="ALL">جميع المتسابقين</option>
                <option value="QUALIFIED">المؤهلون فقط</option>
                <option value="IN_PROGRESS">قيد الإنجاز</option>
                <option value="GOLD">جروب الذهب ($50,000)</option>
                <option value="COURSES">الكورسات ($25,000)</option>
                <option value="INDICES">جروب الاندكس ($10,000)</option>
                <option value="FOREX">جروب الفوركس ($5,000)</option>
              </select>
              <button
                onClick={loadData}
                className="p-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-slate-300 hover:text-white"
                title="تحديث البيانات"
              >
                <FaRedo className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Qualifications Table */}
          <div className="bg-[#06142F] border border-[#12315C] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-[#12315C] bg-[#01071E]/50 text-slate-400 font-bold text-xs">
                    <th className="py-4 px-4">المتسابق</th>
                    <th className="py-4 px-4">فئة الحساب ورصيد المسابقة</th>
                    <th className="py-4 px-4">تليجرام (10 مستخدمين)</th>
                    <th className="py-4 px-4">إنستجرام (10 مستخدمين)</th>
                    <th className="py-4 px-4">فيسبوك (10 مستخدمين)</th>
                    <th className="py-4 px-4">مجتمع ربح 10%</th>
                    <th className="py-4 px-4">حالة التأهل</th>
                    <th className="py-4 px-4 text-center">إجراءات الإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12315C]/60 text-slate-200">
                  {qualifications
                    .filter((p) => {
                      const q = qualSearchQuery.trim().toLowerCase();
                      const matchQuery =
                        !q ||
                        (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.email && p.email.toLowerCase().includes(q)) ||
                        (p.userId && p.userId.toLowerCase().includes(q));

                      if (!matchQuery) return false;

                      if (qualStatusFilter === 'QUALIFIED') return p.isQualified || p.manualApproval;
                      if (qualStatusFilter === 'IN_PROGRESS') return !p.isQualified && !p.manualApproval;
                      if (qualStatusFilter === 'GOLD') return p.assignedBalance === 50000 || p.planCategory === 'جروب الذهب';
                      if (qualStatusFilter === 'COURSES') return p.assignedBalance === 25000 || p.planCategory === 'الكورسات';
                      if (qualStatusFilter === 'INDICES') return p.assignedBalance === 10000 || p.planCategory === 'جروب الاندكس';
                      if (qualStatusFilter === 'FOREX') return p.assignedBalance === 5000 || p.planCategory === 'جروب الفوركس';

                      return true;
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500 font-medium">
                        لا يوجد متسابقون مسجلون يطابقون خيارات البحث الحالية
                      </td>
                    </tr>
                  ) : (
                    qualifications
                      .filter((p) => {
                        const q = qualSearchQuery.trim().toLowerCase();
                        const matchQuery =
                          !q ||
                          (p.name && p.name.toLowerCase().includes(q)) ||
                          (p.email && p.email.toLowerCase().includes(q)) ||
                          (p.userId && p.userId.toLowerCase().includes(q));

                        if (!matchQuery) return false;

                        if (qualStatusFilter === 'QUALIFIED') return p.isQualified || p.manualApproval;
                        if (qualStatusFilter === 'IN_PROGRESS') return !p.isQualified && !p.manualApproval;
                        if (qualStatusFilter === 'GOLD') return p.assignedBalance === 50000 || p.planCategory === 'جروب الذهب';
                        if (qualStatusFilter === 'COURSES') return p.assignedBalance === 25000 || p.planCategory === 'الكورسات';
                        if (qualStatusFilter === 'INDICES') return p.assignedBalance === 10000 || p.planCategory === 'جروب الاندكس';
                        if (qualStatusFilter === 'FOREX') return p.assignedBalance === 5000 || p.planCategory === 'جروب الفوركس';

                        return true;
                      })
                      .map((p) => {
                        const tgCount = p.tasks?.telegram?.current || 0;
                        const igCount = p.tasks?.instagram?.current || 0;
                        const fbCount = p.tasks?.facebook?.current || 0;
                        const isQual = p.isQualified || p.manualApproval;

                        return (
                          <tr key={p.userId} className="hover:bg-[#0488F8]/5 transition">
                            <td className="py-4 px-4">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{p.name || p.userName || 'مستخدم مسجل'}</span>
                                {p.isCompanyDirect && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                    مشترك عبر الشركة
                                  </span>
                                )}
                                {p.manualApproval && !p.isCompanyDirect && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-normal">
                                    اعتماد يدوي
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono mt-0.5">
                                {p.email || p.userEmail || p.userId}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <select
                                  value={p.assignedBalance || 25000}
                                  onChange={(e) => {
                                    const val = Number(e.target.value);
                                    let cat = 'الكورسات';
                                    if (val === 50000) cat = 'جروب الذهب';
                                    else if (val === 10000) cat = 'جروب الاندكس';
                                    else if (val === 5000) cat = 'جروب الفوركس';
                                    handleUpdateTier(p.userId, val, cat);
                                  }}
                                  className="bg-[#01071E] border border-[#12315C] text-xs font-bold rounded-lg px-2.5 py-1.5 text-amber-300 focus:outline-none focus:border-[#0488F8]"
                                >
                                  <option value={50000}>جروب الذهب ($50,000)</option>
                                  <option value={25000}>الكورسات ($25,000)</option>
                                  <option value={10000}>جروب الاندكس ($10,000)</option>
                                  <option value={5000}>جروب الفوركس ($5,000)</option>
                                </select>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-1">
                                {p.planCategory || 'الكورسات'}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${tgCount >= 10 ? 'text-emerald-400' : 'text-blue-400'}`}>
                                  {tgCount}/10
                                </span>
                                {tgCount >= 10 && <FaCheck className="text-emerald-400 text-xs" />}
                              </div>
                              <div className="w-24 h-1.5 bg-[#01071E] rounded-full overflow-hidden mt-1 border border-slate-700/50">
                                <div
                                  className={`h-full ${tgCount >= 10 ? 'bg-emerald-400' : 'bg-blue-500'}`}
                                  style={{ width: `${Math.min(100, (tgCount / 10) * 100)}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${igCount >= 10 ? 'text-emerald-400' : 'text-pink-400'}`}>
                                  {igCount}/10
                                </span>
                                {igCount >= 10 && <FaCheck className="text-emerald-400 text-xs" />}
                              </div>
                              <div className="w-24 h-1.5 bg-[#01071E] rounded-full overflow-hidden mt-1 border border-slate-700/50">
                                <div
                                  className={`h-full ${igCount >= 10 ? 'bg-emerald-400' : 'bg-pink-500'}`}
                                  style={{ width: `${Math.min(100, (igCount / 10) * 100)}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-xs ${fbCount >= 10 ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                  {fbCount}/10
                                </span>
                                {fbCount >= 10 && <FaCheck className="text-emerald-400 text-xs" />}
                              </div>
                              <div className="w-24 h-1.5 bg-[#01071E] rounded-full overflow-hidden mt-1 border border-slate-700/50">
                                <div
                                  className={`h-full ${fbCount >= 10 ? 'bg-emerald-400' : 'bg-indigo-500'}`}
                                  style={{ width: `${Math.min(100, (fbCount / 10) * 100)}%` }}
                                />
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1 text-[11px]">
                                <span className={`flex items-center gap-1 ${p.tasks?.community?.joined ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                  {p.tasks?.community?.joined ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />} انضمام
                                </span>
                                <span className={`flex items-center gap-1 ${p.tasks?.community?.shared ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                                  {p.tasks?.community?.shared ? <FaCheck className="text-[10px]" /> : <FaTimes className="text-[10px]" />} مشاركة
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              {isQual ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                  <FaCheckCircle className="text-xs" /> مؤهل للدخول
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
                                  <FaHourglassHalf className="text-xs" /> قيد الاستيفاء
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedSublinkParticipant(p)}
                                  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition"
                                  title="عرض الروابط الفرعية والنقرات"
                                >
                                  <FaEye className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleApproveQualification(p)}
                                  disabled={actionLoadingId === `qual-approve-${p.userId}`}
                                  className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition"
                                  title="تأهيل يدوي فوري للمتسابق"
                                >
                                  <FaUserCheck className="text-xs" />
                                </button>
                                <button
                                  onClick={() => handleResetQualification(p)}
                                  disabled={actionLoadingId === `qual-reset-${p.userId}`}
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition"
                                  title="تصفير عدادات المهام"
                                >
                                  <FaRedo
                                    className={`text-xs ${
                                      actionLoadingId === `qual-reset-${p.userId}`
                                        ? 'animate-spin'
                                        : ''
                                    }`}
                                  />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (
                                      !confirm(
                                        `تحذير: هل أنت متأكد من حذف المتسابق "${
                                          p.name || p.userName || p.userId
                                        }" من شروط التأهل؟`,
                                      )
                                    )
                                      return;
                                    try {
                                      await fetch('/api/competition/qualifications', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          action: 'delete_participant',
                                          userId: p.userId,
                                          email: p.email || p.userEmail,
                                        }),
                                      });
                                      toast.success('تم حذف المتسابق بنجاح');
                                      loadData();
                                    } catch {
                                      toast.error('فشل حذف المتسابق');
                                    }
                                  }}
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition"
                                  title="حذف المتسابق من التأهل"
                                >
                                  <FaTrash className="text-xs" />
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

          {/* Recent Sublink Traffic Activity */}
          <div className="bg-[#06142F] border border-[#12315C] rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <FaBolt className="text-amber-400" /> آخر الزيارات المسجلة عبر الروابط الفرعية (Live Sublink Clicks)
            </h4>
            {recentClicks.length === 0 ? (
              <div className="text-xs text-slate-500 py-3 text-center">
                لا توجد نقرات مسجلة حتى الآن على الروابط الفرعية
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="text-slate-400 border-b border-[#12315C]">
                    <tr>
                      <th className="py-2 px-3">المنصة / الرابط</th>
                      <th className="py-2 px-3">المتسابق صاحب الرابط</th>
                      <th className="py-2 px-3">عنوان IP</th>
                      <th className="py-2 px-3">التوقيت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12315C]/40 text-slate-300">
                    {recentClicks.slice(0, 20).map((c, idx) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="py-2 px-3 font-bold">
                          {c.channel === 'telegram' && <span className="text-blue-400">Telegram (الفوتر)</span>}
                          {c.channel === 'instagram' && <span className="text-pink-400">Instagram</span>}
                          {c.channel === 'facebook' && <span className="text-indigo-400">Facebook</span>}
                          {c.channel === 'community' && <span className="text-emerald-400">Community 10%</span>}
                        </td>
                        <td className="py-2 px-3 font-mono">{c.userId}</td>
                        <td className="py-2 px-3 font-mono text-slate-400">{c.ip || '—'}</td>
                        <td className="py-2 px-3 text-slate-400">{new Date(c.timestamp).toLocaleString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBLINK DETAILS MODAL */}
      {selectedSublinkParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#06142F] border border-[#12315C] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-[#12315C] pb-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FaLink className="text-[#0488F8]" />
                  الروابط الفرعية للمتسابق: {selectedSublinkParticipant.name || selectedSublinkParticipant.userId}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  الرصيد المخصص: <b className="text-amber-300">${(selectedSublinkParticipant.assignedBalance || 25000).toLocaleString()}</b> | الفئة: {selectedSublinkParticipant.planCategory || 'الكورسات'}
                </p>
              </div>
              <button
                onClick={() => setSelectedSublinkParticipant(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Telegram Sublink */}
              <div className="p-4 rounded-2xl bg-[#01071E] border border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <FaTelegramPlane /> رابط تليجرام الفوتر الفرعي
                  </span>
                  <span className="text-xs font-bold text-white bg-blue-500/20 px-2 py-0.5 rounded">
                    {selectedSublinkParticipant.tasks?.telegram?.current || 0} / 10 نقرات
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://fxengen.com/c/tg/${selectedSublinkParticipant.userId}`}
                    className="w-full bg-[#06142F] border border-[#12315C] rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => handleCopyLink(`https://fxengen.com/c/tg/${selectedSublinkParticipant.userId}`, 'tg')}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {copiedLinkKey === 'tg' ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>

              {/* Instagram Sublink */}
              <div className="p-4 rounded-2xl bg-[#01071E] border border-pink-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-pink-400">
                    <FaInstagram /> رابط إنستجرام الفرعي
                  </span>
                  <span className="text-xs font-bold text-white bg-pink-500/20 px-2 py-0.5 rounded">
                    {selectedSublinkParticipant.tasks?.instagram?.current || 0} / 10 نقرات
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://fxengen.com/c/ig/${selectedSublinkParticipant.userId}`}
                    className="w-full bg-[#06142F] border border-[#12315C] rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => handleCopyLink(`https://fxengen.com/c/ig/${selectedSublinkParticipant.userId}`, 'ig')}
                    className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {copiedLinkKey === 'ig' ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>

              {/* Facebook Sublink */}
              <div className="p-4 rounded-2xl bg-[#01071E] border border-indigo-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-indigo-400">
                    <FaFacebook /> رابط فيسبوك الفرعي
                  </span>
                  <span className="text-xs font-bold text-white bg-indigo-500/20 px-2 py-0.5 rounded">
                    {selectedSublinkParticipant.tasks?.facebook?.current || 0} / 10 نقرات
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://fxengen.com/c/fb/${selectedSublinkParticipant.userId}`}
                    className="w-full bg-[#06142F] border border-[#12315C] rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => handleCopyLink(`https://fxengen.com/c/fb/${selectedSublinkParticipant.userId}`, 'fb')}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {copiedLinkKey === 'fb' ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>

              {/* Community 10% Sublink */}
              <div className="p-4 rounded-2xl bg-[#01071E] border border-emerald-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <FaUsers /> رابط مجتمع ربح 10% الفرعي
                  </span>
                  <span className="text-xs font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded">
                    {selectedSublinkParticipant.tasks?.community?.clicks || 0} نقرات
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://fxengen.com/c/community/${selectedSublinkParticipant.userId}`}
                    className="w-full bg-[#06142F] border border-[#12315C] rounded-xl px-3 py-2 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={() => handleCopyLink(`https://fxengen.com/c/community/${selectedSublinkParticipant.userId}`, 'community')}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {copiedLinkKey === 'community' ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#12315C] mt-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleApproveQualification(selectedSublinkParticipant);
                    setSelectedSublinkParticipant(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FaUserCheck /> اعتماد وتأهيل يدوي
                </button>
                <button
                  onClick={() => {
                    handleResetQualification(selectedSublinkParticipant);
                    setSelectedSublinkParticipant(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <FaRedo /> تصفير العدادات
                </button>
              </div>

              <button
                onClick={() => setSelectedSublinkParticipant(null)}
                className="px-4 py-2 rounded-xl border border-[#12315C] text-slate-300 hover:text-white text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PLAN CREATE / EDIT MODAL */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#06142F] border border-[#12315C] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between border-b border-[#12315C] pb-4 mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <FaCog className="text-[#0488F8]" />
                {editingPlan ? 'تعديل باقة الحساب التجريبي' : 'إضافة باقة حساب تجريبي ومسابقة جديدة'}
              </h3>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الباقة بالعربية *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.titleAr}
                    onChange={(e) => setPlanForm({ ...planForm, titleAr: e.target.value })}
                    placeholder="مثال: باقة جروب الذهب VIP"
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الباقة بالإنجليزية *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.titleEn}
                    onChange={(e) => setPlanForm({ ...planForm, titleEn: e.target.value })}
                    placeholder="e.g. Gold VIP Demo Challenge"
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الرصيد التجريبي ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={planForm.initialBalance}
                    onChange={(e) => setPlanForm({ ...planForm, initialBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الرافعة المالية (1:X) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="1000"
                    value={planForm.leverage}
                    onChange={(e) => setPlanForm({ ...planForm, leverage: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    مضاعف النقاط (لكل نقطة ربح)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={planForm.pointsPerPip}
                    onChange={(e) => setPlanForm({ ...planForm, pointsPerPip: parseFloat(e.target.value) || 1.0 })}
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-purple-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم سيرفر الوسيط / البروكر
                  </label>
                  <input
                    type="text"
                    value={planForm.brokerServer}
                    onChange={(e) => setPlanForm({ ...planForm, brokerServer: e.target.value })}
                    placeholder="FXENGIN Prime ECN"
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    اسم الشارة (Badge)
                  </label>
                  <input
                    type="text"
                    value={planForm.badgeName}
                    onChange={(e) => setPlanForm({ ...planForm, badgeName: e.target.value })}
                    placeholder="مثال: GOLD WHALE أو ELITE"
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    أقصى تراجع يومي مسموح به (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={planForm.maxDailyDrawdown}
                    onChange={(e) => setPlanForm({ ...planForm, maxDailyDrawdown: parseFloat(e.target.value) || 5.0 })}
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    أقصى تراجع كلي مسموح به (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={planForm.maxTotalDrawdown}
                    onChange={(e) => setPlanForm({ ...planForm, maxTotalDrawdown: parseFloat(e.target.value) || 10.0 })}
                    className="w-full px-4 py-2.5 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-red-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  وصف شروط الباقة ومميزاتها
                </label>
                <textarea
                  rows="2"
                  value={planForm.descriptionAr}
                  onChange={(e) => setPlanForm({ ...planForm, descriptionAr: e.target.value })}
                  placeholder="وصف مختصر يظهر للمتداولين عن هذه الباقة التجريبية..."
                  className="w-full px-4 py-2 bg-[#01071E] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#12315C]">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#12315C] text-slate-300 hover:text-white text-sm font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0458EC] to-[#0488F8] text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:brightness-110 transition"
                >
                  {editingPlan ? 'حفظ التعديلات' : 'إضافة الباقة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL PARTICIPANT MODAL (مشترك عبر الشركة) */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="bg-[#06142F] border-2 border-[#12315C] rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-8 relative">
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#0488F8]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#12315C] pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-2 rounded-xl bg-gradient-to-tr from-[#0458EC] to-[#0488F8] text-white">
                    <FaUserCheck className="text-lg" />
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {editingAccount
                      ? 'تعديل بيانات ورصيد ونتائج المتسابق'
                      : 'إضافة متسابق يدوي لمسابقة التداول (مشترك عبر الشركة)'}
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  تسجيل المتسابق المشترك مباشرة عبر الشركة أو الوسيط، وتحديد رصيد حسابه، صفقاته، ونقاطه للتصدر في المسابقة مع التأهيل التلقائي الفوري.
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <FaBuilding /> مشترك مباشر عبر الشركة / الوسيط
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                    <FaCheckCircle /> تأهيل مباشر بدون شروط الروابط
                  </span>
                </div>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 rounded-lg hover:bg-[#12315C]/50 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManualParticipant} className="space-y-6">
              {/* SECTION 1: Personal & Broker Info */}
              <div className="bg-[#01071E]/60 p-4 rounded-2xl border border-[#12315C]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FaIdCard className="text-[#0488F8]" /> 1. معلومات المتداول والوسيط
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      الاسم الكامل للمتداول *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualForm.fullName}
                      onChange={(e) => setManualForm({ ...manualForm, fullName: e.target.value })}
                      placeholder="مثال: أحمد عبد الله"
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      البريد الإلكتروني *
                    </label>
                    <input
                      type="email"
                      required
                      value={manualForm.email}
                      onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                      placeholder="trader@company.com"
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      رقم الهاتف / الواتساب (اختياري)
                    </label>
                    <input
                      type="text"
                      value={manualForm.phone}
                      onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                      placeholder="+966 50 123 4567"
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      اسم الوسيط / جهة الاشتراك
                    </label>
                    <input
                      type="text"
                      value={manualForm.brokerServer}
                      onChange={(e) => setManualForm({ ...manualForm, brokerServer: e.target.value })}
                      placeholder="FXENGIN Prime ECN (اشتراك عبر الشركة)"
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Competition Account & Capital */}
              <div className="bg-[#01071E]/60 p-4 rounded-2xl border border-[#12315C]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FaServer className="text-amber-400" /> 2. بيانات باقة المسابقة ورأس المال
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      باقة المسابقة
                    </label>
                    <select
                      value={manualForm.planId}
                      onChange={(e) => handlePlanSelectForManual(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white focus:outline-none focus:border-[#0488F8]"
                    >
                      <option value="">باقة مخصصة (Custom Plan)</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.titleAr} (${p.initialBalance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      رقم الحساب التجريبي *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={manualForm.accountNumber}
                        onChange={(e) => setManualForm({ ...manualForm, accountNumber: e.target.value })}
                        placeholder="500123"
                        className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAccountNumber}
                        className="px-3 py-2.5 bg-[#12315C] hover:bg-[#0488F8] text-white rounded-xl text-xs font-bold whitespace-nowrap transition"
                        title="توليد رقم حساب عشوائي جديد"
                      >
                        توليد
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      الرصيد الابتدائي ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      step="500"
                      value={manualForm.initialBalance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setManualForm({
                          ...manualForm,
                          initialBalance: val,
                          balance: manualForm.balance === manualForm.initialBalance ? val : manualForm.balance,
                          equity: manualForm.equity === manualForm.initialBalance ? val : manualForm.equity,
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      الرصيد الحالي ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="100"
                      value={manualForm.balance}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setManualForm({
                          ...manualForm,
                          balance: val,
                          equity: manualForm.equity === manualForm.balance ? val : manualForm.equity,
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      السيولة الحالية (Equity $)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={manualForm.equity}
                      onChange={(e) => setManualForm({ ...manualForm, equity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-emerald-300 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      الرافعة المالية (1:X)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="1000"
                      value={manualForm.leverage}
                      onChange={(e) => setManualForm({ ...manualForm, leverage: parseInt(e.target.value, 10) || 100 })}
                      className="w-full px-4 py-2.5 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-amber-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Leaderboard Performance & Results */}
              <div className="bg-[#01071E]/60 p-4 rounded-2xl border border-[#12315C]">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FaTrophy className="text-[#FB8704]" /> 3. نتائج المسابقة ونقاط الترتيب (Leaderboard)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1">
                      النقاط في الترتيب *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={manualForm.points}
                      onChange={(e) => setManualForm({ ...manualForm, points: parseFloat(e.target.value) || 0 })}
                      placeholder="1850"
                      className="w-full px-3 py-2 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-amber-300 font-mono font-black focus:outline-none focus:border-[#FB8704]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-blue-300 mb-1">
                      نقاط البيب (Pips)
                    </label>
                    <input
                      type="number"
                      value={manualForm.totalPips}
                      onChange={(e) => setManualForm({ ...manualForm, totalPips: parseFloat(e.target.value) || 0 })}
                      placeholder="120"
                      className="w-full px-3 py-2 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-blue-400 font-mono font-bold focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      إجمالي الصفقات
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualForm.totalTrades}
                      onChange={(e) => {
                        const t = parseInt(e.target.value, 10) || 0;
                        setManualForm({
                          ...manualForm,
                          totalTrades: t,
                          winTrades: Math.min(manualForm.winTrades, t),
                          lossTrades: Math.max(0, t - manualForm.winTrades),
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#0488F8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-400 mb-1">
                      الصفقات الرابحة
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualForm.winTrades}
                      onChange={(e) => {
                        const w = parseInt(e.target.value, 10) || 0;
                        setManualForm({
                          ...manualForm,
                          winTrades: w,
                          lossTrades: Math.max(0, manualForm.totalTrades - w),
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-red-400 mb-1">
                      الصفقات الخاسرة
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={manualForm.lossTrades}
                      onChange={(e) => setManualForm({ ...manualForm, lossTrades: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-[#06142F] border border-[#12315C] rounded-xl text-sm text-red-400 font-mono font-bold focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Live Stats Preview Widget */}
                <div className="mt-4 p-3.5 bg-[#06142F] rounded-xl border border-[#12315C]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">صافي الأرباح: </span>
                    <span className={`font-mono font-bold ${manualForm.balance >= manualForm.initialBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                      {manualForm.balance >= manualForm.initialBalance ? '+' : ''}
                      {(manualForm.balance - manualForm.initialBalance).toLocaleString()}$
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">نسبة العائد (ROI): </span>
                    <span className="font-mono font-bold text-white">
                      {manualForm.initialBalance > 0
                        ? (((manualForm.balance - manualForm.initialBalance) / manualForm.initialBalance) * 100).toFixed(2)
                        : '0.00'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">نسبة الفوز (Win Rate): </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {manualForm.totalTrades > 0
                        ? ((manualForm.winTrades / manualForm.totalTrades) * 100).toFixed(1)
                        : '0.0'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">الترتيب التقديري: </span>
                    <span className="font-mono font-bold text-amber-300">
                      بناءً على {manualForm.points.toLocaleString()} نقطة
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Status & Direct Qualification */}
              <div className="bg-[#01071E]/60 p-4 rounded-2xl border border-emerald-500/20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isCompanyDirectCheck"
                      checked={manualForm.isCompanyDirect}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          isCompanyDirect: e.target.checked,
                          isQualified: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded accent-[#0488F8] cursor-pointer"
                    />
                    <label htmlFor="isCompanyDirectCheck" className="text-xs font-bold text-white cursor-pointer">
                      تأهيل فوري واعتماد مهام الروابط (مشترك عبر الشركة مباشرة)
                      <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                        سيتم اعتماد كافة شروط التأهل (100%) وتخطي الروابط الفرعية ليتمكن فوراً من دخول المنصة والمنافسة في لوحة الشرف.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">حالة الحساب:</span>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                      className="bg-[#06142F] border border-[#12315C] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="ACTIVE">نشط ومؤهل (ACTIVE)</option>
                      <option value="DISQUALIFIED">مستبعد (DISQUALIFIED)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#12315C]">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#12315C] text-slate-300 hover:text-white text-sm font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingManual}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0458EC] to-[#0488F8] text-white text-sm font-bold shadow-lg shadow-blue-500/25 hover:brightness-110 transition flex items-center gap-2 active:scale-95"
                >
                  {savingManual && <FaRedo className="animate-spin text-xs" />}
                  {editingAccount ? 'حفظ تعديلات المتسابق' : 'إضافة وتأهيل المتسابق فوراً'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
