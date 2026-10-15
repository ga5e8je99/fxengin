'use client';

import React from 'react';
import {
  HiSearch,
  HiRefresh,
  HiViewGrid,
  HiViewList,
  HiX,
} from 'react-icons/hi';
import { COURSE_ACCESS_TIERS, COURSE_DIFFICULTIES } from '../../services/coursesService';

export default function CourseFiltersBar({
  filters,
  onFilterChange,
  onResetFilters,
  viewMode = 'grid',
  onViewModeChange,
  totalResults = 0,
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.accessTier !== 'ALL' ||
    filters.difficulty !== 'ALL' ||
    filters.publishStatus !== 'ALL';

  return (
    <div className="surface-card p-4 sm:p-5 space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <HiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7AFBF] text-lg pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="ابحث بعنوان الكورس، الوصف، أو التصنيف..."
            className="w-full h-11 pr-10 pl-10 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] placeholder:text-[#687287] text-sm outline-none focus:border-[#0488F8] transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A7AFBF] hover:text-white"
              title="مسح البحث"
              type="button"
            >
              <HiX className="text-base" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Access Tier */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.accessTier || 'ALL'}
              onChange={(e) => onFilterChange('accessTier', e.target.value)}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">جميع الباقات (Access Tiers)</option>
              {Object.keys(COURSE_ACCESS_TIERS).map((k) => (
                <option key={k} value={k}>
                  {COURSE_ACCESS_TIERS[k].labelAr}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.difficulty || 'ALL'}
              onChange={(e) => onFilterChange('difficulty', e.target.value)}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">كافة المستويات (Difficulty)</option>
              {Object.keys(COURSE_DIFFICULTIES).map((k) => (
                <option key={k} value={k}>
                  {COURSE_DIFFICULTIES[k].labelAr}
                </option>
              ))}
            </select>
          </div>

          {/* Publish Status */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.publishStatus || 'ALL'}
              onChange={(e) => onFilterChange('publishStatus', e.target.value)}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">حالة النشر: الكل</option>
              <option value="PUBLISHED">منشور للطلاب (Published)</option>
              <option value="DRAFT">مسودة قيد الإعداد (Draft)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-[#06142F] border border-[#12315C] p-1">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#0488F8] text-white shadow'
                  : 'text-[#A7AFBF] hover:text-white'
              }`}
              title="عرض الشبكة (بطاقات)"
            >
              <HiViewGrid className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#0488F8] text-white shadow'
                  : 'text-[#A7AFBF] hover:text-white'
              }`}
              title="عرض الجدول"
            >
              <HiViewList className="text-lg" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-11 px-3 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] hover:bg-[#F6465D]/20 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              title="إعادة ضبط الفلاتر"
            >
              <HiRefresh className="text-sm" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta indicators */}
      <div className="flex items-center justify-between pt-2 border-t border-[#12315C]/40 text-xs text-[#A7AFBF]">
        <div className="flex items-center gap-2">
          <span>نتائج العرض:</span>
          <span className="font-bold text-[#F5F7FA] font-tabular">
            {totalResults} كورس تدريبي
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-[#0488F8]/15 text-[#0488F8] text-[11px] font-bold">
              فلاتر مفعلة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse" />
          <span className="text-[11px]">مزامنة فورية مع السيرفر السحابي</span>
        </div>
      </div>
    </div>
  );
}
