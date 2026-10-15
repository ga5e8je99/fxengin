'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  IoSearchOutline,
  IoRefreshOutline,
  IoPencilOutline,
  IoOpenOutline,
  IoDocumentTextOutline,
  IoShieldCheckmarkOutline,
  IoBusinessOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoSaveOutline,
  IoCloseCircleOutline,
  IoGlobeOutline,
  IoHelpCircleOutline,
  IoEyeOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoLayersOutline,
  IoAlertCircleOutline,
  IoSparklesOutline,
  IoCodeSlashOutline,
} from 'react-icons/io5';
import {
  getPagesList,
  getPageBySlug,
  updatePage,
  PAGE_CATEGORIES,
} from '../../services/pageService';

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';

export default function PagesManagementPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [modalTab, setModalTab] = useState('basic'); // 'basic' | 'content' | 'raw'
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({});
  const [rawJsonError, setRawJsonError] = useState(null);

  const loadPages = async () => {
    setLoading(true);
    try {
      const data = await getPagesList();
      setPages(data);
    } catch (err) {
      console.error('Error loading pages:', err);
      toast.error('حدث خطأ أثناء تحميل الصفحات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesCategory =
        categoryFilter === 'ALL' || page.category === categoryFilter;
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        (page.titleAr && page.titleAr.toLowerCase().includes(search)) ||
        (page.titleEn && page.titleEn.toLowerCase().includes(search)) ||
        (page.slug && page.slug.toLowerCase().includes(search)) ||
        (page.subtitleAr && page.subtitleAr.toLowerCase().includes(search));
      return matchesCategory && matchesSearch;
    });
  }, [pages, categoryFilter, searchTerm]);

  const handleOpenEdit = (page) => {
    setSelectedPage(page);
    setFormData(JSON.parse(JSON.stringify(page)));
    setModalTab('basic');
    setRawJsonError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPage(null);
    setFormData({});
    setRawJsonError(null);
  };

  const handleSavePage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPage || !formData.slug) return;

    if (rawJsonError) {
      toast.error('يرجى تصحيح أخطاء صيغة JSON قبل الحفظ');
      return;
    }

    setSaving(true);
    try {
      const res = await updatePage(formData.slug, formData);
      if (res.success) {
        toast.success(`تم حفظ وتحديث صفحة (${formData.titleAr || formData.slug}) بنجاح!`);
        setPages((prev) =>
          prev.map((p) => (p.slug === formData.slug ? { ...p, ...formData } : p))
        );
        handleCloseModal();
      } else {
        toast.error(res.error || 'فشل حفظ التعديلات');
      }
    } catch (err) {
      console.error('Error saving page:', err);
      toast.error('حدث خطأ أثناء حفظ الصفحة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface-container-low p-6 rounded-2xl border border-border-structural shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              CMS Engine Studio
            </span>
            <span className="text-xs text-on-surface-variant font-mono">
              v2.6.4 Dynamic Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            إدارة الصفحات والمحتوى التعريفي والقانوني
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            تحكم شامل في نصوص وبنود صفحات الشركة والدعم القانوني، مع مزامنة فورية ثنائية اللغة للموقع الرئيسي دون الحاجة لإعادة التشغيل.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadPages}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold border border-border-structural transition-all duration-200"
          >
            <IoRefreshOutline className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث البيانات</span>
          </button>
          <a
            href={MAIN_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25 hover:brightness-110 transition-all duration-200"
          >
            <IoGlobeOutline className="text-lg" />
            <span>معاينة الموقع الرئيسي</span>
          </a>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-structural">
          <div className="text-xs text-on-surface-variant mb-1">إجمالي الصفحات المدارة</div>
          <div className="text-2xl font-black text-on-surface font-mono">{pages.length}</div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-structural">
          <div className="text-xs text-on-surface-variant mb-1">أقسام الشركة (Company)</div>
          <div className="text-2xl font-black text-primary font-mono">
            {pages.filter((p) => p.category === 'company').length}
          </div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-structural">
          <div className="text-xs text-on-surface-variant mb-1">الدعم القانوني والامتثال</div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {pages.filter((p) => p.category === 'legal').length}
          </div>
        </div>
        <div className="bg-surface-container-low p-4 rounded-xl border border-border-structural">
          <div className="text-xs text-on-surface-variant mb-1">حالة البث والمزامنة</div>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-2">
            <IoCheckmarkCircleOutline className="text-base" />
            <span>متصل ومزامن (Live Sync)</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filters Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-border-structural">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <IoSearchOutline className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg" />
          <input
            type="text"
            placeholder="بحث بالعنوان، الرابط، أو الوصف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-surface-container rounded-xl border border-border-structural">
          {PAGE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 whitespace-nowrap ${
                categoryFilter === cat.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {cat.labelAr}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pages Cards Grid ───────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-low rounded-2xl border border-border-structural">
          <IoRefreshOutline className="text-4xl text-primary animate-spin mb-3" />
          <p className="text-sm text-on-surface-variant">جاري تحميل بيانات الصفحات من المنظومة...</p>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low rounded-2xl border border-border-structural">
          <IoDocumentTextOutline className="text-5xl text-on-surface-variant/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-on-surface">لا توجد صفحات مطابقة للبحث</h3>
          <p className="text-xs text-on-surface-variant mt-1">يرجى تعديل معايير البحث أو التصفية.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPages.map((page) => {
            const isCompany = page.category === 'company';
            return (
              <div
                key={page.slug}
                className="bg-surface-container-low rounded-2xl border border-border-structural p-5 flex flex-col justify-between hover:border-primary/40 transition-all duration-200 group shadow-sm hover:shadow-lg"
              >
                <div>
                  {/* Card Top: Category Badge & Slug */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        isCompany
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isCompany ? (
                        <IoBusinessOutline className="text-xs" />
                      ) : (
                        <IoShieldCheckmarkOutline className="text-xs" />
                      )}
                      <span>{isCompany ? 'الشركة' : 'الدعم القانوني'}</span>
                    </span>

                    <span className="text-xs font-mono font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md border border-border-structural">
                      /{page.slug}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {page.titleAr}
                  </h3>
                  <div className="text-xs text-on-surface-variant/70 font-mono mt-0.5">
                    {page.titleEn}
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2 mt-2 leading-relaxed">
                    {page.subtitleAr || 'لا يوجد وصف فرعي محدد حالياً.'}
                  </p>

                  {/* Badges / Metrics Preview */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                    {page.badgeAr && (
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                        {page.badgeAr}
                      </span>
                    )}
                    {Array.isArray(page.sections) && (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono">
                        {page.sections.length} بنود قانونية
                      </span>
                    )}
                    {Array.isArray(page.faqs) && (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono">
                        {page.faqs.length} أسئلة شائعة
                      </span>
                    )}
                    {Array.isArray(page.updates) && (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono">
                        {page.updates.length} إصدارات
                      </span>
                    )}
                    {Array.isArray(page.pressReleases) && (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono">
                        {page.pressReleases.length} بيانات صحفية
                      </span>
                    )}
                    {Array.isArray(page.tiers) && (
                      <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-[11px] font-mono">
                        {page.tiers.length} مستويات شراكة
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Metadata & Actions */}
                <div className="mt-5 pt-4 border-t border-border-structural/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                    <IoTimeOutline className="text-sm" />
                    <span>تحديث: {page.lastUpdated || '2026-09-20'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`${MAIN_SITE_URL}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="معاينة الصفحة على الموقع المباشر"
                      className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-border-structural transition-colors"
                    >
                      <IoOpenOutline className="text-base" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(page)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/15 hover:bg-primary text-primary hover:text-white text-xs font-bold border border-primary/30 transition-all duration-150"
                    >
                      <IoPencilOutline className="text-sm" />
                      <span>تعديل المحتوى</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Comprehensive Edit Page Modal ───────────────────────── */}
      {isModalOpen && selectedPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-container-low border border-border-structural rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border-structural bg-surface-container shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <IoPencilOutline className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-on-surface">
                    تعديل محتوى صفحة: {selectedPage.titleAr}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-on-surface-variant font-mono">
                      المسار الحي: /{selectedPage.slug}
                    </span>
                    <span className="text-xs text-primary font-bold">
                      ● {selectedPage.category === 'company' ? 'أقسام الشركة' : 'الدعم القانوني والامتثال'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <IoCloseCircleOutline className="text-2xl" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border-structural bg-surface-container-low shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('basic')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'basic'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <IoDocumentTextOutline />
                <span>العناوين والهوية العامة</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('content')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'content'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <IoLayersOutline />
                <span>محرر المحتوى التفاعلي</span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('raw')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  modalTab === 'raw'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <IoCodeSlashOutline />
                <span>محرر البنية الخام (JSON)</span>
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: BASIC INFO */}
              {modalTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        عنوان الصفحة الرئيسي (بالعربية) *
                      </label>
                      <input
                        type="text"
                        value={formData.titleAr || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, titleAr: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        عنوان الصفحة الرئيسي (بالإنجليزية) *
                      </label>
                      <input
                        type="text"
                        value={formData.titleEn || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, titleEn: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        شارة الترويسة العليا (Badge Ar)
                      </label>
                      <input
                        type="text"
                        value={formData.badgeAr || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, badgeAr: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        شارة الترويسة العليا (Badge En)
                      </label>
                      <input
                        type="text"
                        value={formData.badgeEn || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, badgeEn: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      الوصف والترويسة الفرعية (بالعربية)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.subtitleAr || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitleAr: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1">
                      الوصف والترويسة الفرعية (بالإنجليزية)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.subtitleEn || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, subtitleEn: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        تاريخ آخر تحديث معتمد
                      </label>
                      <input
                        type="date"
                        value={formData.lastUpdated || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, lastUpdated: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant mb-1">
                        حالة نشر الصفحة للعامة
                      </label>
                      <div className="flex items-center gap-3 mt-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isPublished !== false}
                            onChange={(e) =>
                              setFormData({ ...formData, isPublished: e.target.checked })
                            }
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                          />
                          <span className="text-xs font-bold text-on-surface">
                            صفحة مفعلة ومنشورة (Live on Website)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC CONTENT EDITOR TAILORED PER PAGE */}
              {modalTab === 'content' && (
                <div className="space-y-6">
                  {/* 1. LEGAL PAGES: Privacy, Terms, Disclaimer */}
                  {(formData.slug === 'privacy' ||
                    formData.slug === 'terms' ||
                    formData.slug === 'disclaimer') && (
                    <div className="space-y-6">
                      {/* Disclaimer Specific: High Risk Warning Box */}
                      {formData.slug === 'disclaimer' && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                            <IoAlertCircleOutline className="text-base" />
                            <span>نص تحذير الرافعة المالية البارز (High Risk Warning)</span>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-red-300 mb-1">
                              التحذير بالعربية:
                            </label>
                            <textarea
                              rows={3}
                              value={formData.highRiskWarningAr || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  highRiskWarningAr: e.target.value,
                                })
                              }
                              className="w-full p-2.5 bg-surface-container border border-red-500/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-red-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-red-300 mb-1">
                              التحذير بالإنجليزية:
                            </label>
                            <textarea
                              rows={2}
                              value={formData.highRiskWarningEn || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  highRiskWarningEn: e.target.value,
                                })
                              }
                              className="w-full p-2.5 bg-surface-container border border-red-500/30 rounded-lg text-xs text-on-surface focus:outline-none focus:border-red-400 font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {/* Legal Sections Manager */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                            <IoLayersOutline className="text-primary text-base" />
                            <span>المواد والبنود القانونية ({formData.sections?.length || 0})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const currentSecs = formData.sections || [];
                              const nextNum = (currentSecs.length + 1).toString();
                              const newSec = {
                                id: `sec-${Date.now()}`,
                                number: nextNum,
                                titleAr: 'بند جديد',
                                titleEn: 'New Clause',
                                contentAr: 'نص البند القانوني بالعربية...',
                                contentEn: 'Clause content in English...',
                              };
                              setFormData({
                                ...formData,
                                sections: [...currentSecs, newSec],
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all"
                          >
                            <IoAddCircleOutline />
                            <span>إضافة مادة / بند جديد</span>
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {(formData.sections || []).map((sec, sIdx) => (
                            <div
                              key={sec.id || sIdx}
                              className="p-4 bg-surface-container rounded-xl border border-border-structural space-y-2 relative group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="w-6 h-6 rounded bg-primary/20 text-primary font-mono text-xs flex items-center justify-center font-bold">
                                  {sec.number || sIdx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextSecs = (formData.sections || []).filter(
                                      (_, i) => i !== sIdx
                                    );
                                    setFormData({ ...formData, sections: nextSecs });
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1 text-base transition-colors"
                                  title="حذف هذا البند"
                                >
                                  <IoTrashOutline />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                    عنوان المادة (بالعربية)
                                  </label>
                                  <input
                                    type="text"
                                    value={sec.titleAr || ''}
                                    onChange={(e) => {
                                      const next = [...formData.sections];
                                      next[sIdx].titleAr = e.target.value;
                                      setFormData({ ...formData, sections: next });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                    عنوان المادة (بالإنجليزية)
                                  </label>
                                  <input
                                    type="text"
                                    value={sec.titleEn || ''}
                                    onChange={(e) => {
                                      const next = [...formData.sections];
                                      next[sIdx].titleEn = e.target.value;
                                      setFormData({ ...formData, sections: next });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  نص المادة القانونية (بالعربية)
                                </label>
                                <textarea
                                  rows={2}
                                  value={sec.contentAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.sections];
                                    next[sIdx].contentAr = e.target.value;
                                    setFormData({ ...formData, sections: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface leading-relaxed"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  نص المادة القانونية (بالإنجليزية)
                                </label>
                                <textarea
                                  rows={2}
                                  value={sec.contentEn || ''}
                                  onChange={(e) => {
                                    const next = [...formData.sections];
                                    next[sIdx].contentEn = e.target.value;
                                    setFormData({ ...formData, sections: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface font-mono leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. HELP CENTER: Categories & FAQs */}
                  {formData.slug === 'help' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            بريد الدعم المباشر
                          </label>
                          <input
                            type="email"
                            value={formData.supportEmail || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, supportEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            رابط تليجرام الدعم الفني
                          </label>
                          <input
                            type="text"
                            value={formData.supportTelegram || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, supportTelegram: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface font-mono"
                          />
                        </div>
                      </div>

                      {/* FAQs Manager */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                            <IoHelpCircleOutline className="text-primary text-base" />
                            <span>الأسئلة الشائعة والأجوبة ({formData.faqs?.length || 0})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const currentFaqs = formData.faqs || [];
                              const newFaq = {
                                id: `faq-${Date.now()}`,
                                category: 'account',
                                qAr: 'سؤال جديد؟',
                                qEn: 'New Question?',
                                aAr: 'الإجابة التفصيلية بالعربية...',
                                aEn: 'Detailed answer in English...',
                              };
                              setFormData({ ...formData, faqs: [...currentFaqs, newFaq] });
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all"
                          >
                            <IoAddCircleOutline />
                            <span>إضافة سؤال شائع جديد</span>
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                          {(formData.faqs || []).map((faq, fIdx) => (
                            <div
                              key={faq.id || fIdx}
                              className="p-4 bg-surface-container rounded-xl border border-border-structural space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <select
                                  value={faq.category || 'account'}
                                  onChange={(e) => {
                                    const next = [...formData.faqs];
                                    next[fIdx].category = e.target.value;
                                    setFormData({ ...formData, faqs: next });
                                  }}
                                  className="px-2.5 py-1 bg-surface-container-low border border-border-structural rounded-md text-xs text-primary font-bold"
                                >
                                  <option value="account">الحساب والأمان (account)</option>
                                  <option value="courses">الكورسات والشهادات (courses)</option>
                                  <option value="vip">باقة VIP والتحليلات (vip)</option>
                                  <option value="billing">الاشتراكات والدفع (billing)</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextFaqs = formData.faqs.filter((_, i) => i !== fIdx);
                                    setFormData({ ...formData, faqs: nextFaqs });
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1 text-base transition-colors"
                                >
                                  <IoTrashOutline />
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  نص السؤال (بالعربية)
                                </label>
                                <input
                                  type="text"
                                  value={faq.qAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.faqs];
                                    next[fIdx].qAr = e.target.value;
                                    setFormData({ ...formData, faqs: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  نص الإجابة (بالعربية)
                                </label>
                                <textarea
                                  rows={2}
                                  value={faq.aAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.faqs];
                                    next[fIdx].aAr = e.target.value;
                                    setFormData({ ...formData, faqs: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. PLATFORM NEWS: Updates & Changelogs */}
                  {formData.slug === 'news' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                          <IoSparklesOutline className="text-primary text-base" />
                          <span>سجل التحديثات والإصدارات ({formData.updates?.length || 0})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            const currentUpdates = formData.updates || [];
                            const newUpdate = {
                              version: `v2.${currentUpdates.length + 7}.0`,
                              date: new Date().toISOString().split('T')[0],
                              tagAr: 'تحديث ميزات جديدة',
                              tagEn: 'Feature Update',
                              titleAr: 'عنوان التحديث الجديد',
                              titleEn: 'New Update Title',
                              detailsAr: 'تفاصيل التحديث والميزات المضافة...',
                              detailsEn: 'Update details and release notes...',
                            };
                            setFormData({ ...formData, updates: [newUpdate, ...currentUpdates] });
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all"
                        >
                          <IoAddCircleOutline />
                          <span>إضافة تحديث نظام جديد</span>
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {(formData.updates || []).map((up, uIdx) => (
                          <div
                            key={uIdx}
                            className="p-4 bg-surface-container rounded-xl border border-border-structural space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={up.version || ''}
                                  placeholder="v2.x.x"
                                  onChange={(e) => {
                                    const next = [...formData.updates];
                                    next[uIdx].version = e.target.value;
                                    setFormData({ ...formData, updates: next });
                                  }}
                                  className="w-24 px-2 py-1 bg-surface-container-low border border-border-structural rounded-md text-xs text-primary font-mono font-bold"
                                />
                                <input
                                  type="date"
                                  value={up.date || ''}
                                  onChange={(e) => {
                                    const next = [...formData.updates];
                                    next[uIdx].date = e.target.value;
                                    setFormData({ ...formData, updates: next });
                                  }}
                                  className="px-2 py-1 bg-surface-container-low border border-border-structural rounded-md text-xs text-on-surface font-mono"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextUpdates = formData.updates.filter((_, i) => i !== uIdx);
                                  setFormData({ ...formData, updates: nextUpdates });
                                }}
                                className="text-red-400 hover:text-red-300 p-1 text-base transition-colors"
                              >
                                <IoTrashOutline />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  عنوان التحديث (بالعربية)
                                </label>
                                <input
                                  type="text"
                                  value={up.titleAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.updates];
                                    next[uIdx].titleAr = e.target.value;
                                    setFormData({ ...formData, updates: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  تصنيف الوسم (Tag Ar)
                                </label>
                                <input
                                  type="text"
                                  value={up.tagAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.updates];
                                    next[uIdx].tagAr = e.target.value;
                                    setFormData({ ...formData, updates: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                تفاصيل وملاحظات الإصدار (بالعربية)
                              </label>
                              <textarea
                                rows={2}
                                value={up.detailsAr || ''}
                                onChange={(e) => {
                                  const next = [...formData.updates];
                                  next[uIdx].detailsAr = e.target.value;
                                  setFormData({ ...formData, updates: next });
                                }}
                                className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface leading-relaxed"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. MEDIA CENTER: Press Releases & Brand Assets */}
                  {formData.slug === 'media' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            بريد المكتب الإعلامي
                          </label>
                          <input
                            type="email"
                            value={formData.pressEmail || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, pressEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            هاتف العلاقات العامة
                          </label>
                          <input
                            type="text"
                            value={formData.pressPhone || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, pressPhone: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                          />
                        </div>
                      </div>

                      {/* Press Releases Manager */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                            <IoDocumentTextOutline className="text-primary text-base" />
                            <span>البيانات الصحفية الرسمية ({formData.pressReleases?.length || 0})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              const currentPR = formData.pressReleases || [];
                              const newPR = {
                                id: `pr-${Date.now()}`,
                                date: new Date().toISOString().split('T')[0],
                                titleAr: 'بيان صحفي جديد',
                                titleEn: 'New Press Release',
                                summaryAr: 'ملخص البيان الصحفي بالعربية...',
                                summaryEn: 'Press release summary in English...',
                                readTime: '3 دقائق قراءة',
                              };
                              setFormData({
                                ...formData,
                                pressReleases: [newPR, ...currentPR],
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/15 hover:bg-primary text-primary hover:text-white text-xs font-bold transition-all"
                          >
                            <IoAddCircleOutline />
                            <span>إضافة بيان صحفي</span>
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                          {(formData.pressReleases || []).map((pr, pIdx) => (
                            <div
                              key={pr.id || pIdx}
                              className="p-4 bg-surface-container rounded-xl border border-border-structural space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="date"
                                  value={pr.date || ''}
                                  onChange={(e) => {
                                    const next = [...formData.pressReleases];
                                    next[pIdx].date = e.target.value;
                                    setFormData({ ...formData, pressReleases: next });
                                  }}
                                  className="px-2 py-1 bg-surface-container-low border border-border-structural rounded-md text-xs text-on-surface font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextPR = formData.pressReleases.filter(
                                      (_, i) => i !== pIdx
                                    );
                                    setFormData({ ...formData, pressReleases: nextPR });
                                  }}
                                  className="text-red-400 hover:text-red-300 p-1 text-base transition-colors"
                                >
                                  <IoTrashOutline />
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  عنوان البيان (بالعربية)
                                </label>
                                <input
                                  type="text"
                                  value={pr.titleAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.pressReleases];
                                    next[pIdx].titleAr = e.target.value;
                                    setFormData({ ...formData, pressReleases: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  ملخص البيان (بالعربية)
                                </label>
                                <textarea
                                  rows={2}
                                  value={pr.summaryAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.pressReleases];
                                    next[pIdx].summaryAr = e.target.value;
                                    setFormData({ ...formData, pressReleases: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. CONTACT US: Channels, Phones, Address */}
                  {formData.slug === 'contact' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            بريد الدعم الفني العام
                          </label>
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, email: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            بريد الشراكات (IB)
                          </label>
                          <input
                            type="email"
                            value={formData.partnersEmail || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, partnersEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            بريد المركز الإعلامي
                          </label>
                          <input
                            type="email"
                            value={formData.pressEmail || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, pressEmail: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            رقم الهاتف المباشر
                          </label>
                          <input
                            type="text"
                            value={formData.phone || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, phone: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface direction-ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            رقم الواتساب
                          </label>
                          <input
                            type="text"
                            value={formData.whatsapp || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, whatsapp: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface direction-ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1">
                            رابط تليجرام الرسمي
                          </label>
                          <input
                            type="text"
                            value={formData.telegram || ''}
                            onChange={(e) =>
                              setFormData({ ...formData, telegram: e.target.value })
                            }
                            className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">
                          أوقات العمل الرسمية (بالعربية)
                        </label>
                        <input
                          type="text"
                          value={formData.workingHoursAr || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, workingHoursAr: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">
                          العنوان الإقليمي للمقر (بالعربية)
                        </label>
                        <input
                          type="text"
                          value={formData.addressAr || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, addressAr: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-surface-container border border-border-structural rounded-xl text-xs text-on-surface"
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. PARTNERS: Commission & Tiers */}
                  {formData.slug === 'partners' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">
                          إبراز نسبة العمولات (Commission Highlight Ar)
                        </label>
                        <input
                          type="text"
                          value={formData.commissionHighlightAr || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              commissionHighlightAr: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface"
                        />
                      </div>

                      {/* Tiers List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                          <IoBusinessOutline className="text-primary text-base" />
                          <span>مستويات الشركاء والعمولات ({formData.tiers?.length || 0})</span>
                        </h4>

                        <div className="space-y-3">
                          {(formData.tiers || []).map((tier, tIdx) => (
                            <div
                              key={tIdx}
                              className="p-4 bg-surface-container rounded-xl border border-border-structural space-y-2"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                    اسم المستوى (عربي)
                                  </label>
                                  <input
                                    type="text"
                                    value={tier.nameAr || ''}
                                    onChange={(e) => {
                                      const next = [...formData.tiers];
                                      next[tIdx].nameAr = e.target.value;
                                      setFormData({ ...formData, tiers: next });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                    نسبة العمولة أو الريبيت
                                  </label>
                                  <input
                                    type="text"
                                    value={tier.rebateAr || ''}
                                    onChange={(e) => {
                                      const next = [...formData.tiers];
                                      next[tIdx].rebateAr = e.target.value;
                                      setFormData({ ...formData, tiers: next });
                                    }}
                                    className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-primary font-bold"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-on-surface-variant mb-0.5">
                                  الوصف والفئة المستهدفة
                                </label>
                                <textarea
                                  rows={2}
                                  value={tier.descAr || ''}
                                  onChange={(e) => {
                                    const next = [...formData.tiers];
                                    next[tIdx].descAr = e.target.value;
                                    setFormData({ ...formData, tiers: next });
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-surface-container-low border border-border-structural rounded-lg text-xs text-on-surface leading-relaxed"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. ABOUT US: Stats, Mission, Vision, Values */}
                  {formData.slug === 'about' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">
                          رسالة المنصة المؤسسية (Mission Ar)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.missionAr || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, missionAr: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1">
                          رؤية المنصة المستقبلية (Vision Ar)
                        </label>
                        <textarea
                          rows={3}
                          value={formData.visionAr || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, visionAr: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 bg-surface-container border border-border-structural rounded-xl text-sm text-on-surface leading-relaxed"
                        />
                      </div>

                      {/* Stats Manager */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-black text-on-surface flex items-center gap-1.5">
                          <IoSparklesOutline className="text-amber-400 text-base" />
                          <span>إحصائيات وأرقام المنصة ({formData.stats?.length || 0})</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(formData.stats || []).map((st, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-3 bg-surface-container rounded-xl border border-border-structural space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-on-surface-variant font-bold">
                                  مؤشر {sIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={st.value || ''}
                                  onChange={(e) => {
                                    const next = [...formData.stats];
                                    next[sIdx].value = e.target.value;
                                    setFormData({ ...formData, stats: next });
                                  }}
                                  className="w-24 px-2 py-0.5 bg-surface-container-low border border-border-structural rounded text-xs text-amber-400 font-mono font-black text-center"
                                />
                              </div>
                              <input
                                type="text"
                                value={st.labelAr || ''}
                                onChange={(e) => {
                                  const next = [...formData.stats];
                                  next[sIdx].labelAr = e.target.value;
                                  setFormData({ ...formData, stats: next });
                                }}
                                className="w-full px-2 py-1 bg-surface-container-low border border-border-structural rounded text-xs text-on-surface"
                                placeholder="الوصف بالعربية..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: RAW JSON CODE */}
              {modalTab === 'raw' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-on-surface-variant">
                      كود محتوى الصفحة بصيغة JSON المباشرة:
                    </label>
                    {rawJsonError ? (
                      <span className="text-xs text-red-400 font-bold">
                        خطأ في البنية: {rawJsonError}
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold">
                        ✓ بنية JSON سليمة وقابلة للحفظ
                      </span>
                    )}
                  </div>

                  <textarea
                    rows={15}
                    value={JSON.stringify(formData, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData(parsed);
                        setRawJsonError(null);
                      } catch (err) {
                        setRawJsonError(err.message);
                      }
                    }}
                    className="w-full p-4 bg-canvas-deep border border-border-structural rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-primary leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-border-structural bg-surface-container flex items-center justify-between shrink-0">
              <div className="text-xs text-on-surface-variant">
                المزامنة تتم مباشرة مع ملف البيانات <code className="text-primary font-mono font-bold">pages.json</code>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-sm font-semibold border border-border-structural transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSavePage}
                  disabled={saving || !!rawJsonError}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <IoSaveOutline className="text-base" />
                  <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات الآن'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
