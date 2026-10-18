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
  IoSparklesOutline,
  IoGridOutline,
  IoListOutline,
  IoCopyOutline,
  IoCheckmark,
  IoGiftOutline,
  IoPricetagOutline,
  IoFlashOutline,
  IoShieldCheckmarkOutline,
  IoLayersOutline,
  IoOpenOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import {
  fetchAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  toggleAdminOfferStatus,
  deleteAdminOffer,
  fetchOffersStats,
} from '../../services/offersService';
import CreateEditOfferModal from '../../components/offers/CreateEditOfferModal';

const CATEGORY_TABS = [
  { id: 'all', label: 'كافة العروض', icon: IoLayersOutline },
  { id: 'bonus', label: 'بونص تداول وإيداع', icon: IoGiftOutline },
  { id: 'signals', label: 'باقات التحليلات VIP', icon: IoFlashOutline },
  { id: 'prop-firm', label: 'شركات التمويل', icon: IoShieldCheckmarkOutline },
  { id: 'spread', label: 'سبريد خام ECN', icon: IoPricetagOutline },
  { id: 'academy', label: 'الأكاديمية والتدريب', icon: IoSparklesOutline },
];

export default function OffersManagementPage() {
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [offersRes, statsRes] = await Promise.all([
        fetchAdminOffers({
          category: selectedCategory,
          status: statusFilter,
          search: searchTerm,
        }),
        fetchOffersStats(),
      ]);

      if (offersRes.success) {
        setOffers(offersRes.data || []);
      } else {
        toast.error(offersRes.error || 'تعذر جلب العروض');
      }

      if (statsRes) {
        setStats(statsRes);
      }
    } catch {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleCopyCode = (code, e) => {
    e?.stopPropagation();
    if (!code) return;
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`تم نسخ الكود الترويجي (${code})`);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      toast.error('تعذر نسخ الكود');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive: !currentStatus } : o))
    );
    const res = await toggleAdminOfferStatus(id);
    if (res.success) {
      toast.success(res.message);
      fetchOffersStats().then((s) => setStats(s));
    } else {
      toast.error(res.error || 'فشل تغيير حالة العرض');
      loadData();
    }
  };

  const handleDelete = async (id) => {
    const res = await deleteAdminOffer(id);
    if (res.success) {
      toast.success(res.message);
      setDeleteConfirmId(null);
      loadData();
    } else {
      toast.error(res.error || 'فشل حذف العرض');
    }
  };

  const handleModalSubmit = async (payload) => {
    if (modalMode === 'create') {
      const res = await createAdminOffer(payload);
      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'فشل إنشاء العرض');
      }
    } else {
      const res = await updateAdminOffer(selectedOffer.id, payload);
      if (res.success) {
        toast.success(res.message);
        setIsModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || 'فشل تحديث العرض');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface-container-lowest p-4 sm:p-6 lg:p-8 select-none">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-structural/60">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FB8704]/20 to-[#FA5A04]/10 text-[#FB8704] border border-[#FB8704]/30">
              <IoSparklesOutline size={24} />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                إدارة العروض الترويجية والخصومات
              </h1>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 leading-relaxed">
                تحكم كامل في بونص الإيداع، أكواد خصم باقات الـ VIP، وتخفيضات شركات التمويل المعروضة بالموقع الرئيسي.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/dashboard/ads"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-text-muted bg-surface-container border border-border-structural/60 hover:text-text-primary transition-colors flex items-center gap-1.5"
            title="المساحات الإعلانية السابقة"
          >
            <span>المساحات الإعلانية</span>
          </Link>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl text-text-muted hover:text-text-primary bg-surface-container border border-border-structural/60 hover:border-border-structural transition-colors cursor-pointer"
            title="تحديث البيانات"
          >
            <IoRefreshOutline size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <a
            href="https://fxengen.com/offers"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-primary bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all flex items-center gap-1.5"
            title="معاينة صفحة العروض الحية"
          >
            <span>معاينة العروض الحية</span>
            <IoOpenOutline size={15} />
          </a>

          <button
            type="button"
            onClick={() => {
              setModalMode('create');
              setSelectedOffer(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:from-[#FA5A04] hover:to-[#FB8704] shadow-lg shadow-[#FB8704]/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <IoAddCircleOutline size={18} />
            <span>إضافة عرض جديد</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metrics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        {[
          {
            label: 'إجمالي العروض',
            value: stats ? stats.totalOffers : '...',
            icon: IoLayersOutline,
            color: '#0488F8',
            bg: 'rgba(4, 136, 248, 0.12)',
          },
          {
            label: 'العروض النشطة السارية',
            value: stats ? stats.activeOffers : '...',
            icon: IoCheckmarkCircleOutline,
            color: '#16C784',
            bg: 'rgba(22, 199, 132, 0.12)',
          },
          {
            label: 'منتهية الصلاحية (مخفية)',
            value: stats ? (stats.expiredOffers ?? 0) : '0',
            icon: IoTimeOutline,
            color: '#F43F5E',
            bg: 'rgba(244, 63, 94, 0.12)',
          },
          {
            label: 'أكواد الخصم الترويجية',
            value: stats ? stats.totalCoupons : '...',
            icon: IoPricetagOutline,
            color: '#00F0FF',
            bg: 'rgba(0, 240, 255, 0.12)',
          },
          {
            label: 'عروض بونص الإيداع',
            value: stats ? stats.bonusCount : '...',
            icon: IoGiftOutline,
            color: '#FB8704',
            bg: 'rgba(251, 135, 4, 0.12)',
          },
          {
            label: 'باقات التحليلات VIP',
            value: stats ? stats.signalsCount : '...',
            icon: IoFlashOutline,
            color: '#9333EA',
            bg: 'rgba(147, 51, 234, 0.12)',
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-surface-container-low border border-border-structural/70 flex items-center justify-between shadow-sm"
            >
              <div>
                <span className="text-[11px] text-text-muted block mb-1 font-bold">{card.label}</span>
                <span className="text-lg sm:text-xl font-black text-text-primary font-mono">
                  {card.value}
                </span>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedCategory === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer ${
                isSelected
                  ? 'bg-primary/15 border-primary text-primary shadow-sm shadow-primary/20'
                  : 'bg-surface-container border-border-structural/60 text-text-secondary hover:text-text-primary hover:border-border-structural'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-border-structural/60 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <IoSearchOutline
            size={18}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بالعنوان، الشريك، أو الكود الترويجي..."
            className="w-full pl-4 pr-10 py-2 rounded-xl bg-surface-container-lowest border border-border-structural/70 text-xs sm:text-sm text-text-primary placeholder:text-text-muted/60 focus:border-primary focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-border-structural/70 text-xs font-bold text-text-secondary focus:border-primary focus:outline-none cursor-pointer"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">النشطة والجارية فقط</option>
            <option value="expired">منتهية الصلاحية (مخفية تلقائياً)</option>
            <option value="inactive">المعطلة يدوياً</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-surface-container-lowest border border-border-structural/70">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="عرض كشبكة بطاقات"
            >
              <IoGridOutline size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
              title="عرض كجدول بيانات"
            >
              <IoListOutline size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Offers Content ── */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-text-muted">
          <IoRefreshOutline size={32} className="animate-spin mb-3 text-primary" />
          <span className="text-xs font-bold">جاري تحميل العروض والخصومات...</span>
        </div>
      ) : offers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-surface-container-low border border-dashed border-border-structural/80 my-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container border border-border-structural/60 flex items-center justify-center text-text-muted mb-3">
            <IoSparklesOutline size={26} />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">لا توجد عروض مطابقة</h3>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            لم يتم العثور على عروض ترويجية في هذا التصنيف. يمكنك إضافة عرض جديد بنقرة واحدة.
          </p>
          <button
            type="button"
            onClick={() => {
              setModalMode('create');
              setSelectedOffer(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FB8704] to-[#FA5A04] hover:from-[#FA5A04] hover:to-[#FB8704] shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <IoAddCircleOutline size={16} />
            <span>إضافة عرض جديد</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer) => {
            const isCopied = copiedCode === offer.code;

            return (
              <div
                key={offer.id}
                className={`flex flex-col rounded-2xl bg-surface-container border transition-all duration-200 overflow-hidden relative ${
                  offer.isFeatured
                    ? 'border-[#FB8704]/60 shadow-lg shadow-[#FB8704]/10'
                    : 'border-border-structural/70 hover:border-border-structural'
                } ${offer.isActive === false ? 'opacity-65' : ''}`}
              >
                {/* Offer Image / Banner */}
                {(offer.image || offer.logo) && (
                  <div className="w-full h-36 bg-surface-container-lowest overflow-hidden border-b border-border-structural/40 relative">
                    <img
                      src={offer.image || offer.logo}
                      alt={offer.titleAr}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Top Strip */}
                <div className="p-5 pb-3 flex items-center justify-between gap-2 border-b border-border-structural/40 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{
                        color: offer.badgeColor || '#FB8704',
                        borderColor: `${offer.badgeColor || '#FB8704'}40`,
                        backgroundColor: `${offer.badgeColor || '#FB8704'}15`,
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-black border tracking-wide"
                    >
                      {offer.badgeAr || 'عرض حصري'}
                    </span>

                    {/* Expiry Badge */}
                    {offer.endDate ? (
                      (() => {
                        const isExpired = new Date(offer.endDate) <= new Date();
                        return (
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${
                              isExpired
                                ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                                : 'bg-[#FB8704]/15 border-[#FB8704]/35 text-[#FB8704]'
                            }`}
                          >
                            <span>{isExpired ? '⚠️' : '⏱️'}</span>
                            <span>{isExpired ? 'منتهي (مخفي)' : `ينتهي: ${new Date(offer.endDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}`}</span>
                          </span>
                        );
                      })()
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-500/10 border border-blue-500/25 text-blue-400">
                        مستمر ♾️
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-text-muted">
                    {offer.partnerName || 'FXENGIN'}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-text-primary line-clamp-2 mb-1.5 leading-snug">
                    {offer.titleAr}
                  </h3>
                  {offer.subtitleAr && (
                    <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                      {offer.subtitleAr}
                    </p>
                  )}

                  {/* Promo Code Box */}
                  {offer.code && (
                    <div className="mb-4 p-3 rounded-xl bg-surface-container-lowest border border-dashed border-[#FB8704]/50 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">
                          كود الخصم الترويجي:
                        </span>
                        <span className="font-mono text-base font-black text-[#00F0FF] tracking-wider dir-ltr">
                          {offer.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(offer.code, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isCopied
                            ? 'bg-[#16C784]/20 text-[#16C784] border border-[#16C784]/40'
                            : 'bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <IoCheckmark size={14} />
                            <span>تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <IoCopyOutline size={14} />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Features List */}
                  {Array.isArray(offer.featuresAr) && offer.featuresAr.length > 0 && (
                    <ul className="space-y-1.5 mb-4 text-xs text-text-secondary">
                      {offer.featuresAr.slice(0, 3).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <span className="text-[#16C784] mt-0.5 shrink-0 font-bold">✓</span>
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                      {offer.featuresAr.length > 3 && (
                        <li className="text-[11px] text-text-muted font-bold pt-0.5">
                          + {offer.featuresAr.length - 3} مميزات إضافية أخرى
                        </li>
                      )}
                    </ul>
                  )}

                  {/* Footer Actions */}
                  <div className="mt-auto pt-4 border-t border-border-structural/40 flex items-center justify-between gap-2">
                    {/* Status Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(offer.id, offer.isActive !== false)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        offer.isActive !== false
                          ? 'bg-[#16C784]/15 text-[#16C784] hover:bg-[#16C784]/25'
                          : 'bg-text-muted/15 text-text-muted hover:bg-text-muted/25'
                      }`}
                    >
                      {offer.isActive !== false ? (
                        <>
                          <IoCheckmarkCircleOutline size={15} />
                          <span>نشط ومفعل</span>
                        </>
                      ) : (
                        <>
                          <IoCloseCircleOutline size={15} />
                          <span>معطل</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setModalMode('edit');
                          setSelectedOffer(offer);
                          setIsModalOpen(true);
                        }}
                        className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                        title="تعديل بيانات العرض"
                      >
                        <IoPencilOutline size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(offer.id)}
                        className="p-2 rounded-lg text-text-muted hover:text-bearish-down hover:bg-bearish-down/10 transition-colors cursor-pointer"
                        title="حذف العرض"
                      >
                        <IoTrashOutline size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Table View ── */
        <div className="rounded-2xl bg-surface-container border border-border-structural/60 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border-structural/60 bg-surface-container-low text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="p-3.5">الشارة والتصنيف</th>
                  <th className="p-3.5">عنوان العرض</th>
                  <th className="p-3.5">الشريك / الجهة</th>
                  <th className="p-3.5">كود الخصم</th>
                  <th className="p-3.5">صلاحية العرض</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-structural/40 text-xs text-text-primary">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-surface-elevated/50 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span
                        style={{
                          color: offer.badgeColor || '#FB8704',
                          borderColor: `${offer.badgeColor || '#FB8704'}40`,
                          backgroundColor: `${offer.badgeColor || '#FB8704'}15`,
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold border"
                      >
                        {offer.badgeAr || 'عرض حصري'}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold max-w-xs">
                      <div className="flex items-center gap-2.5">
                        {(offer.image || offer.logo) && (
                          <img
                            src={offer.image || offer.logo}
                            alt=""
                            className="w-10 h-8 rounded-lg object-cover bg-surface-container-lowest shrink-0 border border-border-structural/60"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="truncate">{offer.titleAr}</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-text-muted font-mono">
                      {offer.partnerName || 'FXENGIN'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono font-bold text-[#00F0FF]">
                      {offer.code || '—'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {offer.endDate ? (
                        (() => {
                          const isExpired = new Date(offer.endDate) <= new Date();
                          return (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                                isExpired
                                  ? 'bg-rose-500/15 border-rose-500/35 text-rose-400'
                                  : 'bg-[#FB8704]/15 border-[#FB8704]/35 text-[#FB8704]'
                              }`}
                            >
                              <span>{isExpired ? '⚠️' : '⏱️'}</span>
                              <span>
                                {isExpired
                                  ? 'منتهي (مخفي)'
                                  : `ينتهي: ${new Date(offer.endDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}`}
                              </span>
                            </span>
                          );
                        })()
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          مستمر ♾️
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(offer.id, offer.isActive !== false)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          offer.isActive !== false
                            ? 'bg-[#16C784]/20 text-[#16C784]'
                            : 'bg-text-muted/20 text-text-muted'
                        }`}
                      >
                        {offer.isActive !== false ? 'مفعل' : 'معطل'}
                      </button>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setModalMode('edit');
                            setSelectedOffer(offer);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                        >
                          <IoPencilOutline size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(offer.id)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-bearish-down hover:bg-bearish-down/10 transition-colors cursor-pointer"
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

      {/* ── Create / Edit Offer Modal ── */}
      <CreateEditOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedOffer}
        mode={modalMode}
      />

      {/* ── Delete Confirmation Dialog ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-deep/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container border border-border-structural rounded-2xl p-6 shadow-2xl">
            <h4 className="text-base font-bold text-text-primary mb-2">تأكيد حذف العرض</h4>
            <p className="text-xs text-text-muted leading-relaxed mb-6">
              هل أنت متأكد من رغبتك في حذف هذا العرض الترويجي؟ لن يظهر مجدداً في صفحة العروض أو في سيكشن الصفحة الرئيسية.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-bearish-down hover:bg-bearish-down/90 transition-colors cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
