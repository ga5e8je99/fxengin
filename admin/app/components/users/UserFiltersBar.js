'use client';

import React from 'react';
import {
  HiSearch,
  HiFilter,
  HiRefresh,
  HiSortAscending,
  HiSortDescending,
  HiX,
} from 'react-icons/hi';
import { USER_ROLES, EXPERIENCE_LEVELS } from '../../services/usersService';

export default function UserFiltersBar({
  filters,
  onFilterChange,
  onResetFilters,
  totalItems = 0,
  isLoading = false,
}) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.role !== 'ALL' ||
    filters.isActive !== 'ALL' ||
    filters.experienceLevel !== 'ALL' ||
    filters.sortBy !== 'createdAt' ||
    filters.sortOrder !== 'desc';

  return (
    <div className="surface-card p-4 sm:p-5 space-y-3">
      {/* Top Search & Primary Filters Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <HiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A7AFBF] text-lg pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="ابحث بالاسم الكامل، البريد الإلكتروني، أو رقم الهاتف..."
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
          {/* Role Filter */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.role || 'ALL'}
              onChange={(e) => onFilterChange('role', e.target.value)}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">جميع الرتب (Roles)</option>
              {Object.keys(USER_ROLES).map((roleKey) => (
                <option key={roleKey} value={roleKey}>
                  {USER_ROLES[roleKey].labelAr}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.isActive !== undefined ? String(filters.isActive) : 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                onFilterChange('isActive', val === 'ALL' ? 'ALL' : val === 'true');
              }}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="true">نشط فقط (Active)</option>
              <option value="false">معلق / محظور (Suspended)</option>
            </select>
          </div>

          {/* Experience Level Filter */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.experienceLevel || 'ALL'}
              onChange={(e) => onFilterChange('experienceLevel', e.target.value)}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="ALL">جميع مستويات الخبرة</option>
              {Object.keys(EXPERIENCE_LEVELS).map((lvlKey) => (
                <option key={lvlKey} value={lvlKey}>
                  {EXPERIENCE_LEVELS[lvlKey].labelAr}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex-1 sm:flex-none">
            <select
              value={filters.sortBy || 'createdAt'}
              onChange={(e) => onFilterChange('sortBy', e.target.value)}
              className="w-full sm:w-auto h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-xs sm:text-sm text-[#F5F7FA] outline-none focus:border-[#0488F8] cursor-pointer"
            >
              <option value="createdAt">الترتيب: تاريخ التسجيل</option>
              <option value="fullName">الترتيب: الاسم</option>
              <option value="email">الترتيب: البريد</option>
              <option value="role">الترتيب: الرتبة</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() =>
              onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className="h-11 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#A7AFBF] hover:text-white hover:border-[#0488F8] flex items-center justify-center transition-all cursor-pointer"
            title={filters.sortOrder === 'asc' ? 'ترتيب تصاعدي' : 'ترتيب تنازلي'}
            type="button"
          >
            {filters.sortOrder === 'asc' ? (
              <HiSortAscending className="text-lg text-[#0488F8]" />
            ) : (
              <HiSortDescending className="text-lg text-[#0488F8]" />
            )}
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="h-11 px-3 rounded-xl bg-[#F6465D]/10 border border-[#F6465D]/30 text-[#F6465D] hover:bg-[#F6465D]/20 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              title="إعادة ضبط الفلاتر"
              type="button"
            >
              <HiRefresh className="text-sm" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>
      </div>

      {/* Meta Indicators Strip */}
      <div className="flex items-center justify-between pt-2 border-t border-[#12315C]/40 text-xs text-[#A7AFBF]">
        <div className="flex items-center gap-2">
          <span>إجمالي نتائج البحث:</span>
          <span className="font-bold text-[#F5F7FA] font-tabular">
            {isLoading ? 'جاري التحميل...' : `${totalItems.toLocaleString('en-US')} مستخدم`}
          </span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 rounded-full bg-[#0488F8]/15 text-[#0488F8] text-[11px] font-bold">
              فلاتر نشطة
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16C784] animate-pulse"></span>
          <span className="text-[11px]">اتصال قاعدة البيانات: حي وآمن</span>
        </div>
      </div>
    </div>
  );
}
