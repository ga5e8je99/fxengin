'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  IoFlashOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoCashOutline,
  IoTrendingUpOutline,
  IoTrashOutline,
  IoOpenOutline,
} from 'react-icons/io5';

export default function BrokerContractsManager() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brokers/contracts', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setContracts(data.data || []);
      } else {
        toast.error('تعذر جلب عقود الإعلانات');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const handleToggleStatus = async (contractId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await fetch('/api/brokers/contracts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contractId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم تغيير حالة العقد إلى: ${newStatus}`);
        setContracts((prev) =>
          prev.map((c) => (c.id === contractId ? { ...c, status: newStatus } : c))
        );
      }
    } catch {
      toast.error('تعذر تحديث العقد');
    }
  };

  const handleDelete = async (contractId) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقد؟')) return;
    try {
      const res = await fetch(`/api/brokers/contracts?id=${encodeURIComponent(contractId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم حذف العقد');
        setContracts((prev) => prev.filter((c) => c.id !== contractId));
      }
    } catch {
      toast.error('تعذر الحذف');
    }
  };

  const filtered = contracts.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      c.campaignTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.brokerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.packageTitleAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalContracts = contracts.length;
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const totalImpressions = contracts.reduce((acc, c) => acc + (c.impressionsCount || 0), 0);
  const totalRevenue = contracts.reduce((acc, c) => acc + (Number(c.budgetUsd) || 0), 0);

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>إجمالي العقود الإعلانية</span>
            <IoFlashOutline className="text-primary text-base" />
          </div>
          <div className="text-2xl font-black text-text-primary">{totalContracts}</div>
          <div className="text-xs text-text-secondary mt-1">{activeCount} حملة نشطة حالياً</div>
        </div>

        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>إجمالي إيرادات العقود</span>
            <IoCashOutline className="text-bullish-up text-base" />
          </div>
          <div className="text-2xl font-black text-bullish-up">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-text-secondary mt-1">مدفوعات ورعايات معتمدة</div>
        </div>

        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>إجمالي المشاهدات والظهور</span>
            <IoEyeOutline className="text-accent text-base" />
          </div>
          <div className="text-2xl font-black text-accent">{totalImpressions.toLocaleString()}</div>
          <div className="text-xs text-text-secondary mt-1">مرات ظهور لبنرات الوسطاء</div>
        </div>

        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>نسبة الاستجابة والنقر</span>
            <IoTrendingUpOutline className="text-primary text-base" />
          </div>
          <div className="text-2xl font-black text-primary">4.2%</div>
          <div className="text-xs text-text-secondary mt-1">متوسط الـ CTR العام</div>
        </div>
      </div>

      {/* 2. Filters */}
      <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="البحث باسم الوسيط أو عنوان الحملة أو الكوبون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-sm text-text-primary focus:outline-none"
          >
            <option value="ALL">كافة الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="PENDING_REVIEW">قيد المراجعة</option>
            <option value="PAUSED">متوقف مؤقتاً</option>
          </select>
        </div>

        <button
          onClick={loadContracts}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-border-structural/80 hover:bg-surface-container-high rounded-lg text-xs font-bold text-text-primary"
        >
          <IoRefreshOutline size={15} />
          <span>تحديث</span>
        </button>
      </div>

      {/* 3. Contracts List */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-2"></div>
          <div>جاري تحميل العقود الإعلانية...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-low border border-dashed border-border-structural/80 rounded-xl p-12 text-center text-text-secondary">
          <IoFlashOutline className="mx-auto text-4xl mb-3 text-text-tertiary" />
          <div className="font-bold text-base text-text-primary mb-1">لا توجد عقود مطابقة</div>
        </div>
      ) : (
        <div className="bg-surface-container-low border border-border-structural/80 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container-lowest/80 text-text-tertiary font-bold uppercase border-b border-border-structural/60">
                <tr>
                  <th className="p-3.5">الوسيط الشريك</th>
                  <th className="p-3.5">الباقة والمساحة</th>
                  <th className="p-3.5">عنوان الحملة</th>
                  <th className="p-3.5">الفترة الزمنية</th>
                  <th className="p-3.5">القيمة</th>
                  <th className="p-3.5">المشاهدات / النقرات</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-structural/40 text-text-secondary">
                {filtered.map((ctr) => (
                  <tr key={ctr.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="p-3.5 font-bold text-text-primary">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        <span>{ctr.brokerName}</span>
                      </div>
                      <span className="text-[10px] text-text-tertiary block font-normal">{ctr.id}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-text-primary block">{ctr.packageTitleAr}</span>
                      <span className="text-[10px] text-accent block">{ctr.placement}</span>
                    </td>

                    <td className="p-3.5">
                      <span className="text-text-primary block max-w-xs truncate">{ctr.campaignTitle}</span>
                      {ctr.couponCode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent font-bold">
                          كود: {ctr.couponCode}
                        </span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="block text-text-primary">{ctr.startDate}</span>
                      <span className="text-[10px] text-text-tertiary">{ctr.durationMonths || 3} أشهر</span>
                    </td>

                    <td className="p-3.5 font-bold text-bullish-up text-sm">
                      ${(Number(ctr.budgetUsd) || 0).toLocaleString()}
                    </td>

                    <td className="p-3.5">
                      <span className="font-bold text-text-primary block">{(ctr.impressionsCount || 0).toLocaleString()} ظهور</span>
                      <span className="text-[10px] text-text-secondary">{(ctr.clicksCount || 0).toLocaleString()} نقرة</span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          ctr.status === 'ACTIVE'
                            ? 'bg-bullish-up/10 text-bullish-up border-bullish-up/30'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        }`}
                      >
                        {ctr.status === 'ACTIVE' ? 'نشط' : 'قيد المراجعة'}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(ctr.id, ctr.status)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                            ctr.status === 'ACTIVE'
                              ? 'bg-surface-container hover:bg-surface-container-high text-text-secondary'
                              : 'bg-bullish-up/15 text-bullish-up hover:bg-bullish-up/25'
                          }`}
                        >
                          {ctr.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                        </button>

                        <button
                          onClick={() => handleDelete(ctr.id)}
                          className="p-1 text-text-tertiary hover:text-bearish-down rounded"
                          title="حذف"
                        >
                          <IoTrashOutline size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
