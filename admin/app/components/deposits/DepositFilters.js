'use client';

import React from 'react';
import {
  IoSearchOutline,
  IoRefreshOutline,
  IoCloseOutline,
  IoFilterOutline,
  IoSwapVerticalOutline,
  IoTimeOutline,
} from 'react-icons/io5';

export default function DepositFilters({
  searchTerm = '',
  onSearchChange,
  selectedCoin = 'ALL',
  onCoinChange,
  availableCoins = [],
  selectedNetwork = 'ALL',
  onNetworkChange,
  availableNetworks = [],
  selectedStatus = 'ALL',
  onStatusChange,
  sortBy = 'date',
  onSortByChange,
  sortOrder = 'desc',
  onToggleSortOrder,
  onRefresh,
  isRefreshing = false,
  lastUpdatedText = 'الآن',
  autoRefresh = false,
  onToggleAutoRefresh,
  onResetFilters,
  isRtl = true,
}) {
  const hasActiveFilters =
    searchTerm !== '' ||
    selectedCoin !== 'ALL' ||
    selectedNetwork !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    sortBy !== 'date' ||
    sortOrder !== 'desc';

  return (
    <div className="surface-card p-4 sm:p-5 border border-[#12315C] space-y-4">
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 right-3.5 rtl:right-3.5 ltr:left-3.5 flex items-center pointer-events-none text-[#687287]">
            <IoSearchOutline className="text-lg" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isRtl
                ? 'بحث بالمعاملة (TxId)، المحفظة، العملة أو المعرف...'
                : 'Search by TxId, Address, Coin or ID...'
            }
            className="input-field w-full rtl:pr-10 rtl:pl-10 ltr:pl-10 ltr:pr-10 text-xs sm:text-sm bg-[#01071E] border-[#12315C] focus:border-[#0488F8] text-[#F5F7FA] rounded-xl py-2.5 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 rtl:left-3 ltr:right-3 flex items-center text-[#A7AFBF] hover:text-[#F5F7FA] transition-colors"
              title={isRtl ? 'مسح البحث' : 'Clear search'}
            >
              <IoCloseOutline className="text-lg" />
            </button>
          )}
        </div>

        {/* Action Controls: Refresh & Auto-Refresh Toggle */}
        <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end">
          {/* Last updated indicator & Refresh button */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#A7AFBF] font-tabular flex items-center gap-1">
              <IoTimeOutline className="text-xs text-[#0488F8]" />
              <span>{isRtl ? 'آخر تحديث:' : 'Updated:'}</span>
              <strong className="text-[#F5F7FA] font-medium">{lastUpdatedText}</strong>
            </span>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-secondary px-3 py-2 text-xs flex items-center gap-1.5 rounded-xl border border-[#12315C] hover:border-[#0488F8] text-[#F5F7FA] bg-[#06142F] disabled:opacity-60 transition-all shadow-sm"
              title={isRtl ? 'تحديث فوري للبيانات' : 'Refresh Data'}
            >
              <IoRefreshOutline
                className={`text-base text-[#0488F8] ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="font-medium">{isRtl ? 'تحديث' : 'Refresh'}</span>
            </button>
          </div>

          {/* Auto Refresh Toggle (every 60s) */}
          <button
            onClick={onToggleAutoRefresh}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? 'bg-[#16C784]/15 border-[#16C784]/40 text-[#16C784]'
                : 'bg-[#01071E] border-[#12315C] text-[#687287] hover:text-[#A7AFBF]'
            }`}
            title={
              isRtl
                ? 'تفعيل أو إيقاف التحديث التلقائي كل 60 ثانية'
                : 'Toggle auto-refresh every 60 seconds'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-[#16C784] animate-pulse' : 'bg-[#687287]'
              }`}
            />
            <span>{isRtl ? 'تحديث تلقائي (60ث)' : 'Auto-refresh (60s)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Selectors Row */}
      <div className="pt-3 border-t border-[#12315C]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[#687287] font-semibold flex items-center gap-1">
            <IoFilterOutline className="text-sm text-[#FB8704]" />
            <span>{isRtl ? 'الفلاتر:' : 'Filters:'}</span>
          </span>

          {/* Network Filter */}
          <div className="flex items-center gap-1 bg-[#01071E] border border-[#12315C] rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-[#A7AFBF]">{isRtl ? 'الشبكة:' : 'Net:'}</span>
            <select
              value={selectedNetwork}
              onChange={(e) => onNetworkChange(e.target.value)}
              className="bg-transparent text-[#F5F7FA] font-semibold text-xs border-none outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#0A1B3D] text-[#F5F7FA]">
                {isRtl ? 'جميع الشبكات' : 'All Networks'}
              </option>
              {availableNetworks.map((net) => (
                <option key={net} value={net} className="bg-[#0A1B3D] text-[#F5F7FA]">
                  {net}
                </option>
              ))}
            </select>
          </div>

          {/* Coin Filter */}
          <div className="flex items-center gap-1 bg-[#01071E] border border-[#12315C] rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-[#A7AFBF]">{isRtl ? 'العملة:' : 'Coin:'}</span>
            <select
              value={selectedCoin}
              onChange={(e) => onCoinChange(e.target.value)}
              className="bg-transparent text-[#F5F7FA] font-semibold text-xs border-none outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#0A1B3D] text-[#F5F7FA]">
                {isRtl ? 'جميع العملات' : 'All Coins'}
              </option>
              {availableCoins.map((coin) => (
                <option key={coin} value={coin} className="bg-[#0A1B3D] text-[#F5F7FA]">
                  {coin}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#01071E] border border-[#12315C] rounded-xl px-2.5 py-1.5">
            <span className="text-[11px] text-[#A7AFBF]">{isRtl ? 'الحالة:' : 'Status:'}</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-[#F5F7FA] font-semibold text-xs border-none outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-[#0A1B3D] text-[#F5F7FA]">
                {isRtl ? 'كافة الحالات' : 'All Statuses'}
              </option>
              <option value="COMPLETED" className="bg-[#0A1B3D] text-[#16C784]">
                {isRtl ? 'مكتمل (Success)' : 'Completed'}
              </option>
              <option value="PENDING" className="bg-[#0A1B3D] text-[#FBBF24]">
                {isRtl ? 'قيد الانتظار (Pending)' : 'Pending'}
              </option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-xs text-[#FB8704] hover:text-[#FA5A04] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FB8704]/10 border border-[#FB8704]/30 transition-colors"
            >
              <IoCloseOutline className="text-sm" />
              <span>{isRtl ? 'إعادة ضبط' : 'Reset'}</span>
            </button>
          )}
        </div>

        {/* Sorting Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[#687287] font-semibold flex items-center gap-1">
            <IoSwapVerticalOutline className="text-sm text-[#0488F8]" />
            <span>{isRtl ? 'الترتيب:' : 'Sort:'}</span>
          </span>

          <div className="flex items-center gap-1 bg-[#01071E] border border-[#12315C] rounded-xl px-2 py-1">
            <button
              onClick={() => onSortByChange(sortBy === 'date' ? 'amount' : 'date')}
              className="text-[#F5F7FA] hover:text-[#0488F8] font-semibold text-xs px-1.5 py-0.5 rounded transition-colors"
            >
              {sortBy === 'date'
                ? (isRtl ? 'التاريخ' : 'Date')
                : (isRtl ? 'المبلغ' : 'Amount')}
            </button>

            <button
              onClick={onToggleSortOrder}
              className="p-1 text-[#0488F8] hover:bg-[#12315C]/60 rounded transition-colors"
              title={
                sortOrder === 'desc'
                  ? (isRtl ? 'تنازلي (من الأحدث / الأكبر)' : 'Descending')
                  : (isRtl ? 'تصاعدي (من الأقدم / الأصغر)' : 'Ascending')
              }
            >
              <span className="font-mono text-xs font-bold">
                {sortOrder === 'desc' ? '↓ تنازلي' : '↑ تصاعدي'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
