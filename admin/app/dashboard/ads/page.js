'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  IoAddCircleOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoOpenOutline,
  IoGridOutline,
  IoListOutline,
  IoSparklesOutline,
  IoMegaphoneOutline,
  IoEyeOutline,
  IoNavigateOutline,
  IoTrendingUpOutline,
  IoLayersOutline,
  IoPhonePortraitOutline,
} from 'react-icons/io5';
import {
  fetchAdminAds,
  fetchAdsStats,
  createAdminAd,
  updateAdminAd,
  toggleAdminAdStatus,
  deleteAdminAd,
  seedDefaultAds,
} from '../../services/adsService';
import CreateEditAdModal from '../../components/ads/CreateEditAdModal';
import BrokerPopupControlModal from '../../components/brokers/BrokerPopupControlModal';
import { getBrokerPopupConfig, getBrokersList } from '../../services/brokerService';

const PLACEMENT_TABS = [
  { id: 'ALL', label: 'كافة المساحات', icon: IoLayersOutline },
  { id: 'SKYSCRAPER_RIGHT', label: 'الشريط الأيمن', icon: IoMegaphoneOutline },
  { id: 'SKYSCRAPER_LEFT', label: 'الشريط الأيسر', icon: IoMegaphoneOutline },
  { id: 'HORIZONTAL_BANNER', label: 'البنرات الأفقية', icon: IoGridOutline },
  { id: 'MOBILE_TOP_BAR', label: 'شريط الجوال', icon: IoPhonePortraitOutline },
  { id: 'POPUP_MODAL', label: 'النوافذ المنبثقة', icon: IoSparklesOutline },
];

export default function AdsManagementPage() {
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAd, setSelectedAd] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Broker Popup Modal state
  const [isBrokerPopupModalOpen, setIsBrokerPopupModalOpen] = useState(false);
  const [brokerPopupConfig, setBrokerPopupConfig] = useState(null);
  const [brokersList, setBrokersList] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adsRes, statsRes, popupRes, brokersRes] = await Promise.all([
        fetchAdminAds({
          placement: selectedPlacement,
          isActive: statusFilter === 'ACTIVE' ? true : statusFilter === 'INACTIVE' ? false : 'ALL',
          search: searchTerm,
        }),
        fetchAdsStats(),
        getBrokerPopupConfig().catch(() => null),
        getBrokersList().catch(() => []),
      ]);

      if (adsRes.success) {
        setAds(adsRes.data || []);
      } else {
        toast.error(adsRes.error || 'تعذر جلب الإعلانات');
      }

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (popupRes?.config) {
        setBrokerPopupConfig(popupRes.config);
      }
      if (Array.isArray(brokersRes) && brokersRes.length > 0) {
        setBrokersList(brokersRes);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPlacement, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    // Optimistic UI update
    setAds((prev) =>
      prev.map((ad) => (ad.id === id ? { ...ad, isActive: !currentStatus } : ad))
    );
    const res = await toggleAdminAdStatus(id);
    if (res.success) {
      toast.success(res.message);
      fetchAdsStats().then((s) => s.success && setStats(s.data));
    } else {
      toast.error(res.error || 'فشل تغيير حالة الإعلان');
      loadData();
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteAdminAd(id);
    if (res.success) {
      toast.success(res.message);
      setDeleteConfirmId(null);
      loadData();
    } else {
      toast.error(res.error || 'فشل حذف الإعلان');
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('هل تريد استعادة بنرات FXENGIN الافتراضية الأولية؟')) return;
    setLoading(true);
    const res = await seedDefaultAds();
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || 'فشل استعادة الإعلانات');
      setLoading(false);
    }
  };

  const handleModalSubmit = async (payload) => {
    if (modalMode === 'create') {
      const res = await createAdminAd(payload);
      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'فشل إنشاء الإعلان');
      }
    } else {
      const res = await updateAdminAd(selectedAd.id, payload);
      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'فشل تحديث الإعلان');
      }
    }
  };

  const getPlacementLabel = (p) => {
    const match = PLACEMENT_TABS.find((t) => t.id === p);
    return match ? match.label : p;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest p-4 sm:p-6 lg:p-8 select-none">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-structural/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#FB8704]/10 text-[#FB8704]">
              <IoMegaphoneOutline size={22} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary">
              إدارة المساحات الإعلانية والبنرات
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
            تحكم ديناميكي كامل في بنرات الأشرطة الجانبية والبنرات الأفقية وشريط الجوال مع إحصائيات النقرات والظهور.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSeedDefaults}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-text-secondary bg-surface-container border border-border-structural/60 hover:border-[#0488F8] hover:text-[#0488F8] transition-colors flex items-center gap-1.5"
            title="استعادة البنرات الافتراضية الأولية للمنصة"
          >
            <IoSparklesOutline size={15} />
            <span>استعادة البنرات الافتراضية</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl text-text-muted hover:text-text-primary bg-surface-container border border-border-structural/60 hover:border-border-structural transition-colors"
            title="تحديث البيانات"
          >
            <IoRefreshOutline size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setIsBrokerPopupModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#10B981] shadow-lg shadow-[#10B981]/25 transition-all flex items-center gap-2 cursor-pointer"
            title="تخصيص محتوى وتوقيت وأنيميشن إشعار التوست العائم ونوافذ الشركاء"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>إعدادات إشعار التوست العائم</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalMode('create');
              setSelectedAd(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:from-[#FA5A04] hover:to-[#FB8704] shadow-lg shadow-[#FB8704]/20 transition-all flex items-center gap-2"
          >
            <IoAddCircleOutline size={18} />
            <span>إضافة إعلان جديد</span>
          </button>
        </div>
      </div>

      {/* ── KPI Analytics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 my-6">
        {[
          {
            label: 'إجمالي الإعلانات',
            value: stats ? stats.totalAds : '...',
            icon: IoLayersOutline,
            color: '#0488F8',
            bg: 'rgba(4, 136, 248, 0.1)',
          },
          {
            label: 'الإعلانات النشطة',
            value: stats ? stats.activeAds : '...',
            icon: IoCheckmarkCircleOutline,
            color: '#16C784',
            bg: 'rgba(22, 199, 132, 0.1)',
          },
          {
            label: 'إجمالي النقرات',
            value: stats ? stats.totalClicks.toLocaleString() : '...',
            icon: IoNavigateOutline,
            color: '#FB8704',
            bg: 'rgba(251, 135, 4, 0.1)',
          },
          {
            label: 'إجمالي الظهور',
            value: stats ? stats.totalViews.toLocaleString() : '...',
            icon: IoEyeOutline,
            color: '#9333EA',
            bg: 'rgba(147, 51, 234, 0.1)',
          },
          {
            label: 'معدل النقر (CTR)',
            value: stats ? `${stats.ctr}%` : '...',
            icon: IoTrendingUpOutline,
            color: '#06B6D4',
            bg: 'rgba(6, 182, 212, 0.1)',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-surface-container-low border border-border-structural/70 flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-xs text-text-muted block mb-1">{card.label}</span>
                <span className="text-xl sm:text-2xl font-black text-text-primary font-mono">
                  {card.value}
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Placement Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {PLACEMENT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedPlacement === tab.id;
          const count =
            tab.id === 'ALL'
              ? stats?.totalAds || 0
              : stats?.byPlacement?.[tab.id] || 0;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedPlacement(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                isSelected
                  ? 'bg-[#0488F8] text-white border-[#0488F8] shadow-md shadow-[#0488F8]/20'
                  : 'bg-surface-container-low text-text-secondary border-border-structural/60 hover:border-border-structural hover:text-text-primary'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-container text-text-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-surface-container-low border border-border-structural/70 mb-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالعنوان، الوسم، أو الوصف..."
            className="w-full pr-9 pl-3.5 py-2 rounded-xl bg-surface-container-lowest border border-border-structural text-xs text-text-primary placeholder:text-text-muted focus:border-[#0488F8] focus:outline-none"
          />
          <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Status Filter */}
          <div className="flex items-center rounded-xl bg-surface-container-lowest p-1 border border-border-structural">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'ACTIVE', label: 'نشط' },
              { id: 'INACTIVE', label: 'معطل' },
            ].map((sf) => (
              <button
                key={sf.id}
                type="button"
                onClick={() => setStatusFilter(sf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === sf.id
                    ? 'bg-surface-container text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-surface-container-lowest p-1 border border-border-structural">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-sm transition-colors ${
                viewMode === 'grid' ? 'bg-[#0488F8] text-white' : 'text-text-muted hover:text-text-primary'
              }`}
              title="عرض البطاقات (Grid)"
            >
              <IoGridOutline size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-sm transition-colors ${
                viewMode === 'table' ? 'bg-[#0488F8] text-white' : 'text-text-muted hover:text-text-primary'
              }`}
              title="عرض الجدول (Table)"
            >
              <IoListOutline size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Highlight Banner for POPUP_MODAL ── */}
      {selectedPlacement === 'POPUP_MODAL' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#10B981]/15 via-surface-elevated to-primary/10 border border-[#10B981]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center shrink-0 shadow-inner">
              <IoSparklesOutline size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                <span>إشعار التوست العائم (Toasty Notification) والنوافذ الترويجية للشركاء</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] font-bold border border-[#10B981]/30">
                  متصل ومُفعل
                </span>
              </div>
              <div className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                تحكم كامل في المحتوى الترويجي، اسم الوسيط، نصوص العرض المميز، تكرار الظهور بالثواني (يظهر كل أد إيه)، وأنيميشن الدخول والخروج الانسيابي (Toasty In / Out).
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <button
              type="button"
              onClick={() => setIsBrokerPopupModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#10B981]/25 cursor-pointer"
            >
              <IoSparklesOutline size={14} />
              <span>تخصيص محتوى وتوقيت التوست</span>
            </button>
            <a
              href="https://fxengen.com?preview_side_popup=true"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#00D06C]/10 hover:bg-[#00D06C]/20 text-[#00D06C] text-xs font-semibold flex items-center gap-1.5 transition-all border border-[#00D06C]/30"
              title="معاينة إشعار التوست على الموقع الرئيسي فوراً"
            >
              <span>معاينة إشعار التوست</span>
              <IoOpenOutline size={13} />
            </a>
            <Link
              href="/dashboard/brokers"
              className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-border text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-all border border-surface-border"
            >
              <span>صفحة الوسطاء</span>
              <IoOpenOutline size={13} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Ads Content View ── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-text-muted">
          <IoRefreshOutline size={32} className="animate-spin text-[#FB8704] mb-2" />
          <span className="text-xs">جاري تحميل المساحات الإعلانية...</span>
        </div>
      ) : ads.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[320px] p-8 rounded-2xl bg-surface-container-low border border-dashed border-border-structural text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FB8704]/10 text-[#FB8704] flex items-center justify-center mb-3">
            <IoMegaphoneOutline size={30} />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">لا توجد مساحات إعلانية مطابقة</h3>
          <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">
            لم يتم العثور على إعلانات في هذا التبويب. يمكنك إضافة إعلان جديد أو استعادة البنرات الافتراضية بنقرة واحدة.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="px-4 py-2 rounded-xl text-xs font-bold text-text-primary bg-surface-container border border-border-structural hover:border-[#0488F8] transition-colors"
            >
              استعادة البنرات الافتراضية
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode('create');
                setSelectedAd(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04]"
            >
              إضافة إعلان جديد
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {ads.map((ad) => {
            const ctr =
              ad.viewsCount > 0
                ? ((ad.clicksCount / ad.viewsCount) * 100).toFixed(1)
                : '0.0';

            return (
              <div
                key={ad.id}
                className="group p-5 rounded-2xl bg-surface-container-low border border-border-structural/70 hover:border-[#0488F8]/60 transition-all flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-[#0488F8]/5 relative overflow-hidden"
              >
                {/* Active Indicator Bar */}
                <div
                  className="absolute top-0 inset-x-0 h-1"
                  style={{ backgroundColor: ad.isActive ? '#16C784' : '#5B6575' }}
                />

                <div>
                  {/* Top Bar: Placement badge & Toggle Switch */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-container-lowest text-[#FB8704] border border-border-structural/40">
                      {getPlacementLabel(ad.placement)}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold ${ad.isActive ? 'text-[#16C784]' : 'text-text-muted'}`}>
                        {ad.isActive ? 'نشط' : 'معطل'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ad.isActive}
                          onChange={() => handleToggleStatus(ad.id, ad.isActive)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#16C784]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Badge & Tag preview */}
                  <div className="flex items-center justify-between mb-2">
                    {ad.badge && (
                      <span
                        style={{
                          borderColor: ad.badgeColor || '#FB8704',
                          color: ad.badgeColor || '#FB8704',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        }}
                        className="text-[9px] font-extrabold px-2 py-0.5 rounded border tracking-wider font-mono uppercase"
                      >
                        {ad.badge}
                      </span>
                    )}
                    {ad.tag && (
                      <span className="text-[10px] font-bold text-[#FB8704] font-mono">
                        {ad.tag}
                      </span>
                    )}
                  </div>

                  {/* Banner Image if any */}
                  {ad.imageUrl && (
                    <div className="w-full h-24 rounded-xl overflow-hidden border border-border-structural/50 mb-3 relative bg-black/40">
                      <img
                        src={ad.imageUrl}
                        alt={ad.titleAr}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}

                  {/* Title & Description */}
                  <h4 className="font-bold text-sm text-text-primary mb-1 line-clamp-2 leading-snug">
                    {ad.titleAr}
                  </h4>
                  {ad.titleEn && (
                    <p className="text-[11px] text-text-muted font-mono mb-2 line-clamp-1" dir="ltr">
                      {ad.titleEn}
                    </p>
                  )}
                  {ad.descAr && (
                    <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed mb-3">
                      {ad.descAr}
                    </p>
                  )}

                  {/* Target URL Chip */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#0488F8] font-mono bg-surface-container-lowest px-2.5 py-1 rounded-lg border border-border-structural/40 mb-4 max-w-full overflow-hidden">
                    <span className="truncate flex-1" dir="ltr">{ad.targetUrl}</span>
                    <a
                      href={ad.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-[#0488F8] shrink-0"
                    >
                      <IoOpenOutline size={14} />
                    </a>
                  </div>
                </div>

                {/* Footer Metrics & Actions */}
                <div className="pt-3 border-t border-border-structural/60">
                  <div className="grid grid-cols-3 gap-2 text-center mb-3.5 bg-surface-container-lowest/50 p-2 rounded-xl border border-border-structural/30">
                    <div>
                      <span className="text-[10px] text-text-muted block">النقرات</span>
                      <span className="text-xs font-bold font-mono text-[#FB8704]">
                        {ad.clicksCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">الظهور</span>
                      <span className="text-xs font-bold font-mono text-text-primary">
                        {ad.viewsCount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted block">CTR</span>
                      <span className="text-xs font-bold font-mono text-[#16C784]">
                        {ctr}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAd(ad);
                        setModalMode('edit');
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-text-primary bg-surface-container hover:bg-[#0488F8] hover:text-white transition-colors flex items-center gap-1"
                    >
                      <IoPencilOutline size={14} />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(ad.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      title="حذف الإعلان"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-2xl bg-surface-container-low border border-border-structural/70 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-container/70 border-b border-border-structural text-text-muted font-bold">
                <tr>
                  <th className="p-3.5">الإعلان / العنوان</th>
                  <th className="p-3.5">المساحة</th>
                  <th className="p-3.5">الوسم</th>
                  <th className="p-3.5">الرابط المستهدف</th>
                  <th className="p-3.5 text-center">النقرات</th>
                  <th className="p-3.5 text-center">المشاهدات</th>
                  <th className="p-3.5 text-center">CTR</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-structural/50">
                {ads.map((ad) => {
                  const ctr =
                    ad.viewsCount > 0
                      ? ((ad.clicksCount / ad.viewsCount) * 100).toFixed(1)
                      : '0.0';

                  return (
                    <tr key={ad.id} className="hover:bg-surface-container-lowest/50 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-text-primary">{ad.titleAr}</div>
                        {ad.titleEn && <div className="text-[11px] text-text-muted font-mono" dir="ltr">{ad.titleEn}</div>}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-[#FB8704]">
                          {getPlacementLabel(ad.placement)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {ad.badge ? (
                          <span
                            style={{ color: ad.badgeColor, borderColor: ad.badgeColor }}
                            className="px-2 py-0.5 rounded border text-[10px] font-mono font-bold"
                          >
                            {ad.badge}
                          </span>
                        ) : (
                          <span className="text-text-muted">-</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-[#0488F8] max-w-[180px] truncate" dir="ltr">
                        {ad.targetUrl}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-[#FB8704]">
                        {ad.clicksCount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center font-mono text-text-primary">
                        {ad.viewsCount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-[#16C784]">
                        {ctr}%
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(ad.id, ad.isActive)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                            ad.isActive
                              ? 'bg-[#16C784]/15 text-[#16C784] border-[#16C784]/30'
                              : 'bg-surface-container text-text-muted border-border-structural'
                          }`}
                        >
                          {ad.isActive ? 'نشط' : 'معطل'}
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAd(ad);
                              setModalMode('edit');
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-[#0488F8] hover:bg-surface-container transition-colors"
                            title="تعديل"
                          >
                            <IoPencilOutline size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(ad.id)}
                            className="p-1.5 rounded-lg text-text-secondary hover:text-[#EF4444] hover:bg-surface-container transition-colors"
                            title="حذف"
                          >
                            <IoTrashOutline size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      <CreateEditAdModal
        isOpen={isModalOpen}
        mode={modalMode}
        adData={selectedAd}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface-container-low border border-border-structural rounded-2xl p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-2">تأكيد حذف الإعلان</h4>
            <p className="text-xs text-text-muted mb-6 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف هذه المساحة الإعلانية نهائياً؟ سيتم إلغاء عرضها في الموقع وحذف إحصائيات النقرات المرتبطة بها.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-container transition-colors"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#EF4444] hover:bg-[#DC2626] transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Broker Promotional Popup Master Configuration Modal ── */}
      <BrokerPopupControlModal
        isOpen={isBrokerPopupModalOpen}
        onClose={() => setIsBrokerPopupModalOpen(false)}
        config={brokerPopupConfig}
        brokers={brokersList}
        onConfigSaved={(updated) => setBrokerPopupConfig(updated)}
      />
    </div>
  );
}
