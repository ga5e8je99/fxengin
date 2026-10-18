'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import DepositHistory from '../../components/deposits/DepositHistory';
import { fetchDepositHistory } from '../../services/depositService';
import {
  fetchAdminPlans,
  fetchAdminSubscriptionStats,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
} from '../../services/subscriptionsService';
import CreateEditPlanModal from '../../components/subscriptions/CreateEditPlanModal';
import SubscribersTable from '../../components/subscriptions/SubscribersTable';

export default function SubscriptionsPage() {
  const [activeView, setActiveView] = useState('plans'); // 'plans' | 'subscribers' | 'deposits'
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Financial & Subscription Stats
  const [stats, setStats] = useState({
    totalVolume: 0,
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    totalPlans: 0,
    activePlans: 0,
    activeSubscribers: 0,
    isLoading: true,
  });

  const loadPlansData = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const res = await fetchAdminPlans();
      if (res.success && Array.isArray(res.data)) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل مجموعات التحليلات');
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  const loadAllStats = useCallback(async () => {
    try {
      const [depRes, subStatsRes] = await Promise.allSettled([
        fetchDepositHistory(),
        fetchAdminSubscriptionStats(),
      ]);

      let volume = 0;
      let completed = 0;
      let pending = 0;
      let totalDeposits = 0;

      if (depRes.status === 'fulfilled' && depRes.value?.success && Array.isArray(depRes.value?.data)) {
        totalDeposits = depRes.value.data.length;
        depRes.value.data.forEach((d) => {
          if (d.status === 1) {
            completed++;
            volume += d.numericAmount || 0;
          } else if (d.status === 0 || d.status === 8) {
            pending++;
          }
        });
      }

      let totalPlans = 0;
      let activePlans = 0;
      let activeSubscribers = 0;

      if (subStatsRes.status === 'fulfilled' && subStatsRes.value?.success && subStatsRes.value?.data) {
        totalPlans = subStatsRes.value.data.totalPlans || 0;
        activePlans = subStatsRes.value.data.activePlans || 0;
        activeSubscribers = subStatsRes.value.data.activeSubscribers || 0;
      }

      setStats({
        totalVolume: volume,
        totalCount: totalDeposits,
        completedCount: completed,
        pendingCount: pending,
        totalPlans,
        activePlans,
        activeSubscribers,
        isLoading: false,
      });
    } catch {
      setStats((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadAllStats();
    loadPlansData();
  }, [loadAllStats, loadPlansData]);

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setModalOpen(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleDeletePlan = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف أو أرشفة المجموعة "${name}"؟`)) {
      return;
    }
    try {
      const res = await deleteAdminPlan(id);
      if (res.success) {
        toast.success(res.message || 'تم حذف المجموعة بنجاح');
        loadPlansData();
        loadAllStats();
      } else {
        toast.error(res.error || 'فشل حذف المجموعة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حذف المجموعة');
    }
  };

  const handleTogglePlanActive = async (plan) => {
    try {
      const res = await updateAdminPlan(plan.id, { isActive: !plan.isActive });
      if (res.success) {
        toast.success(plan.isActive ? 'تم إيقاف المجموعة مؤقتاً' : 'تم تفعيل المجموعة للجمهور بنجاح');
        loadPlansData();
        loadAllStats();
      } else {
        toast.error(res.error || 'فشل تغيير حالة المجموعة');
      }
    } catch {
      toast.error('حدث خطأ أثناء تغيير حالة المجموعة');
    }
  };

  const handleSavePlan = async (payload, planId) => {
    if (planId) {
      const res = await updateAdminPlan(planId, payload);
      if (res.success) {
        toast.success('تم تحديث بيانات المجموعة بنجاح');
        loadPlansData();
        loadAllStats();
      } else {
        throw new Error(res.error || 'فشل تحديث المجموعة');
      }
    } else {
      const res = await createAdminPlan(payload);
      if (res.success) {
        toast.success('تم إنشاء مجموعة التحليلات الجديدة بنجاح');
        loadPlansData();
        loadAllStats();
      } else {
        throw new Error(res.error || 'فشل إنشاء المجموعة');
      }
    }
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl text-on-surface select-text">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-border-structural/50 pb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-telemetry-micro text-text-muted mb-1">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <span>&gt;</span>
            <span className="text-text-primary">إدارة مجموعات التحليلات والاشتراكات</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-text-primary font-bold">
            جروبات التحليلات والاشتراكات والمبيعات
          </h1>
          <p className="font-body-sm text-body-sm text-text-muted mt-1 max-w-3xl leading-relaxed">
            التحكم الكامل في جروبات ومجموعات التحليلات (مجموعة الذهب، مجموعة Index، مجموعة الفوريكس)، إدارة الأسعار، الصلاحيات، ومتابعة مبيعات المشتركين وطرق الدفع.
          </p>
        </div>

        <div className="flex items-center gap-space-sm flex-wrap">
          {/* Navigation View Switcher */}
          <div className="flex items-center bg-surface-container rounded-xl p-1 border border-border-structural/60 text-xs">
            <button
              onClick={() => setActiveView('plans')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeView === 'plans'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              type="button"
            >
              جروبات التحليلات والمنصة
            </button>
            <button
              onClick={() => setActiveView('subscribers')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeView === 'subscribers'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              type="button"
            >
              المشتركين والمبيعات
            </button>
            <button
              onClick={() => setActiveView('deposits')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeView === 'deposits'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              type="button"
            >
              سجل الإيداعات
            </button>
          </div>

          {activeView === 'plans' && (
            <button
              onClick={handleCreatePlan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#FB8704] to-[#F59E0B] text-white text-xs font-bold shadow-lg hover:opacity-95 transition-opacity cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>إضافة مجموعة جديدة</span>
            </button>
          )}

          <button
            onClick={() => {
              loadAllStats();
              loadPlansData();
              toast.info('جاري إعادة مزامنة البيانات...');
            }}
            className="p-2.5 rounded-xl bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary transition-all cursor-pointer"
            type="button"
            title="تحديث البيانات"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-lg">
        {/* Metric 1: Total Plans */}
        <div className="bg-surface-container p-space-lg rounded-xl border border-border-structural/40 flex flex-col justify-between space-y-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-text-secondary">إجمالي مجموعات التحليلات</span>
            <div className="w-10 h-10 rounded-xl bg-[#FB8704]/15 flex items-center justify-center text-[#FB8704]">
              <span className="material-symbols-outlined text-[20px]">workspace_premium</span>
            </div>
          </div>
          <div>
            <div className="font-telemetry-stat text-telemetry-stat text-text-primary dir-ltr">
              {stats.isLoading ? '...' : plans.length || stats.totalPlans}
            </div>
            <div className="flex items-center gap-1 mt-1 font-telemetry-micro text-[#FB8704] dir-ltr">
              <span>●</span>
              <span className="text-text-muted font-normal">
                {plans.filter((p) => p.isActive).length} مجموعة مفعلة ومتاحة على الموقع
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Subscribers */}
        <div className="bg-surface-container p-space-lg rounded-xl border border-border-structural/40 flex flex-col justify-between space-y-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-text-secondary">المشتركين النشطين</span>
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>
          <div>
            <div className="font-telemetry-stat text-telemetry-stat text-text-primary dir-ltr">
              {stats.isLoading ? '...' : stats.activeSubscribers.toLocaleString('en-US')}
            </div>
            <div className="flex items-center gap-1 mt-1 font-telemetry-micro text-text-muted dir-ltr">
              <span>اشتراك فعلي ومصرح له بالدخول</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Total Confirmed Volume */}
        <div className="bg-surface-container p-space-lg rounded-xl border border-border-structural/40 flex flex-col justify-between space-y-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-text-secondary">إجمالي الإيداعات المؤكدة</span>
            <div className="w-10 h-10 rounded-xl bg-bullish-up/15 flex items-center justify-center text-bullish-up">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div>
            <div className="font-telemetry-stat text-telemetry-stat text-text-primary dir-ltr">
              {stats.isLoading ? (
                <span className="text-text-muted text-base">جارٍ الحساب...</span>
              ) : (
                `$${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 font-telemetry-micro text-bullish-up dir-ltr">
              <span>●</span>
              <span className="text-text-muted font-normal">عبر بوابات الدفع الرقمية النشطة</span>
            </div>
          </div>
        </div>

        {/* Metric 4: System Security */}
        <div className="bg-surface-container p-space-lg rounded-xl border border-border-structural/40 flex flex-col justify-between space-y-space-md">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-text-secondary">حالة نظام الاشتراكات</span>
            <div className="w-10 h-10 rounded-xl bg-bullish-up/15 flex items-center justify-center text-bullish-up">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
          </div>
          <div>
            <div className="font-telemetry-stat text-telemetry-stat text-bullish-up dir-ltr">
              LIVE 24/5
            </div>
            <div className="flex items-center gap-1 mt-1 font-telemetry-micro text-text-muted dir-ltr">
              <span>ربط ديناميكي كامل بالداشبورد</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Conditional View */}
      {activeView === 'deposits' && <DepositHistory standalone={true} />}

      {activeView === 'subscribers' && <SubscribersTable />}

      {activeView === 'plans' && (
        <div className="space-y-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                جروبات التحليلات المعروضة في الصفحة الرئيسية والموقع
              </h2>
              <p className="text-text-muted text-xs">
                يمكنك إنشاء، تعديل، حذف مجموعات التحليلات، وتحديد مميزاتها وصلاحيات وصول المشتركين بها مباشرة.
              </p>
            </div>
          </div>

          {loadingPlans ? (
            <div className="py-16 text-center text-gray-400 bg-surface-container rounded-2xl border border-border-structural/40">
              <div className="inline-flex items-center gap-2">
                <span className="animate-spin material-symbols-outlined text-[22px]">
                  progress_activity
                </span>
                <span>جارٍ تحميل مجموعات التحليلات والاشتراكات...</span>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="py-16 text-center text-gray-400 bg-surface-container rounded-2xl border border-border-structural/40">
              <span className="material-symbols-outlined text-[48px] text-gray-500 mb-2 block">
                package_2
              </span>
              <p className="text-base font-bold text-white mb-2">لا توجد مجموعات تحليلات مدخلة حالياً</p>
              <button
                onClick={handleCreatePlan}
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold"
              >
                + إنشاء أول مجموعة الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const color = plan.highlightColor || '#FB8704';
                return (
                  <div
                    key={plan.id}
                    className="bg-surface-container rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      borderColor: plan.isActive ? `${color}50` : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    {/* Top colored accent bar */}
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: color }}
                    />

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      {/* Header info */}
                      <div>
                        {(() => {
                          const [nameAr, nameEn] = (plan.name || '').includes(':::')
                            ? plan.name.split(':::').map((s) => s.trim())
                            : [plan.name, ''];
                          const [badgeAr, badgeEn] = (plan.badge || '').includes(':::')
                            ? plan.badge.split(':::').map((s) => s.trim())
                            : [plan.badge, ''];
                          const [descAr, descEn] = (plan.description || '').includes(':::')
                            ? plan.description.split(':::').map((s) => s.trim())
                            : [plan.description, ''];

                          return (
                            <>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <span
                                  className="text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                                  style={{
                                    backgroundColor: `${color}20`,
                                    color: color,
                                    border: `1px solid ${color}40`,
                                  }}
                                >
                                  <span>{badgeAr || plan.badge || plan.slug}</span>
                                  {badgeEn && (
                                    <span className="text-[10px] opacity-80 border-r border-current pr-1.5 mr-0.5 dir-ltr">
                                      {badgeEn}
                                    </span>
                                  )}
                                </span>

                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      plan.isActive ? 'bg-emerald-400' : 'bg-gray-500'
                                    }`}
                                    title={plan.isActive ? 'نشطة' : 'معطلة'}
                                  />
                                  <span className="text-[11px] text-gray-400">
                                    {plan.isActive ? 'معروضة بالموقع' : 'معطلة'}
                                  </span>
                                </div>
                              </div>

                              <h3 className="font-headline-sm text-lg font-bold text-text-primary mb-1">
                                <div>{nameAr || plan.name}</div>
                                {nameEn && (
                                  <div className="text-xs font-medium text-gray-400 dir-ltr text-right mt-0.5">
                                    {nameEn}
                                  </div>
                                )}
                              </h3>

                              {descAr && (
                                <p className="text-xs text-text-muted leading-relaxed line-clamp-2 mb-1">
                                  {descAr}
                                </p>
                              )}
                              {descEn && (
                                <p className="text-[11px] text-gray-400/90 leading-relaxed line-clamp-1 italic dir-ltr text-right">
                                  {descEn}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Price display */}
                      <div className="bg-[#030B1E]/60 p-3.5 rounded-xl border border-border-structural/30 flex items-baseline justify-between">
                        <div>
                          <span className="text-2xl font-mono font-extrabold text-white">
                            ${plan.price}
                          </span>
                          <span className="text-xs text-gray-400 font-bold mr-1">
                            USDT /{' '}
                            {plan.billingPeriod === 'YEARLY'
                              ? 'سنوياً'
                              : plan.billingPeriod === 'LIFETIME'
                              ? 'مدى الحياة'
                              : 'شهرياً'}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-mono bg-[#12315C]/40 px-2 py-0.5 rounded border border-[#12315C]">
                          slug: {plan.slug}
                        </span>
                      </div>

                      {/* Features list */}
                      <div className="space-y-2 text-xs text-text-secondary border-t border-border-structural/30 pt-3">
                        <div className="font-semibold text-gray-300 mb-1 flex items-center justify-between">
                          <span>المميزات المضمنة:</span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {plan.features?.length || 0} ميزة
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {Array.isArray(plan.features) && plan.features.length > 0 ? (
                            plan.features.map((feat, idx) => {
                              const [fAr, fEn] = typeof feat === 'string' && feat.includes(':::')
                                ? feat.split(':::').map((s) => s.trim())
                                : [feat, ''];
                              return (
                                <div key={idx} className="flex items-start gap-2">
                                  <span
                                    className="material-symbols-outlined text-[16px] shrink-0 mt-0.5"
                                    style={{ color }}
                                  >
                                    check_circle
                                  </span>
                                  <div className="leading-tight">
                                    <span className="text-gray-300">{fAr}</span>
                                    {fEn && (
                                      <span className="block text-[10px] text-gray-400 dir-ltr text-right">
                                        {fEn}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-gray-500 italic text-[11px]">
                              لم يتم إدخال نقاط مميزات
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Subscribers Count */}
                      <div className="flex items-center justify-between text-xs text-gray-400 bg-[#030B1E]/30 px-3 py-2 rounded-lg border border-border-structural/20">
                        <span>المشتركين الحاليين:</span>
                        <span className="font-mono font-bold text-white">
                          {plan.activeSubscribersCount || plan._count?.subscriptions || 0}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border-structural/30">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-[#12315C]/50 hover:bg-[#12315C] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>تعديل</span>
                        </button>

                        <button
                          onClick={() => handleTogglePlanActive(plan)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                            plan.isActive
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={plan.isActive ? 'تعطيل العرض بالموقع' : 'تفعيل العرض بالموقع'}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {plan.isActive ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleDeletePlan(plan.id, plan.name)}
                          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                          title="حذف المجموعة"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Plan Create/Edit Modal */}
      <CreateEditPlanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={selectedPlan}
        onSave={handleSavePlan}
      />
    </div>
  );
}
