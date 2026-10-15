'use client';

import React, { useState } from 'react';
import {
  IoCopyOutline,
  IoCheckmarkOutline,
  IoAlertCircleOutline,
  IoLayersOutline,
  IoChevronBack,
  IoChevronForward,
  IoRefreshOutline,
  IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import {
  getDepositStatusInfo,
  formatTimestamp,
  truncateHash,
} from '../../services/depositService';
import { toast } from 'react-toastify';

export default function DepositTable({
  deposits = [],
  isLoading = false,
  isError = false,
  errorMessage = '',
  onRetry,
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  isRtl = true,
}) {
  // Track copied state for individual items: key -> boolean
  const [copiedKeys, setCopiedKeys] = useState({});

  const handleCopy = (text, key, label) => {
    if (!text || text === '—') return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedKeys((prev) => ({ ...prev, [key]: true }));
        toast.success(
          isRtl
            ? `تم نسخ ${label} إلى الحافظة بنجاح`
            : `${label} copied to clipboard!`,
          { autoClose: 2000 }
        );
        setTimeout(() => {
          setCopiedKeys((prev) => ({ ...prev, [key]: false }));
        }, 2000);
      }).catch(() => {
        // Fallback copy
        copyFallback(text, key, label);
      });
    } else {
      copyFallback(text, key, label);
    }
  };

  const copyFallback = (text, key, label) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKeys((prev) => ({ ...prev, [key]: true }));
      toast.success(
        isRtl ? `تم نسخ ${label} بنجاح` : `${label} copied!`,
        { autoClose: 2000 }
      );
      setTimeout(() => {
        setCopiedKeys((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    } catch {
      toast.error(isRtl ? 'فشل النسخ التلقائي' : 'Failed to copy');
    }
  };

  const renderNetworkBadge = (network) => {
    const net = (network || '').toUpperCase();
    if (net === 'TRX') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide"
          style={{
            backgroundColor: 'rgba(235, 0, 41, 0.14)',
            color: '#FF4D4D',
            border: '1px solid rgba(235, 0, 41, 0.3)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
          TRX
        </span>
      );
    }
    if (net === 'TON') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide"
          style={{
            backgroundColor: 'rgba(0, 152, 234, 0.14)',
            color: '#0098EA',
            border: '1px solid rgba(0, 152, 234, 0.3)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0098EA]" />
          TON
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide bg-[#12315C] text-[#F5F7FA] border border-[#12315C]"
      >
        {net || 'CRYPTO'}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    const info = getDepositStatusInfo(status, isRtl);
    const isSuccess = info.code === 1;

    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: info.bgColor,
          color: info.color,
          border: `1px solid ${info.borderColor}`,
        }}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isSuccess ? 'bg-[#16C784] animate-pulse' : 'bg-current'
          }`}
        />
        <span>{info.label}</span>
      </span>
    );
  };

  // 1. Error State
  if (isError) {
    return (
      <div className="surface-card p-10 sm:p-14 text-center border border-[#F6465D]/30 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#F6465D]/15 border border-[#F6465D]/30 flex items-center justify-center text-3xl text-[#F6465D]">
          <IoAlertCircleOutline />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#F5F7FA]">
            {isRtl ? 'حدث خطأ أثناء تحميل سجل الإيداعات' : 'Failed to Load Deposit History'}
          </h3>
          <p className="text-xs text-[#A7AFBF] mt-1 max-w-md mx-auto">
            {errorMessage || (isRtl ? 'تعذر الاتصال بمزود البيانات أو حدث انقطاع في الشبكة.' : 'Could not communicate with the API endpoint.')}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 mt-2 shadow-lg shadow-[#0488F8]/20"
          >
            <IoRefreshOutline className="text-base" />
            <span>{isRtl ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>
        )}
      </div>
    );
  }

  // Calculate Pagination
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedData = deposits.slice(startIdx, startIdx + pageSize);

  return (
    <div className="surface-card overflow-hidden border border-[#12315C] rounded-2xl">
      {/* Responsive Table Container */}
      <div className="overflow-x-auto w-full">
        <table className="admin-table w-full text-right rtl:text-right ltr:text-left">
          <thead>
            <tr className="border-b border-[#12315C] bg-[#01071E]/70 text-[#A7AFBF] text-[11px] uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">{isRtl ? 'معرف الإيداع' : 'ID'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'المبلغ' : 'Amount'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'العملة' : 'Coin'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'الشبكة' : 'Network'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'الحالة' : 'Status'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'عنوان المحفظة' : 'Address'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'معرف المعاملة (TxID)' : 'Transaction ID'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'التأكيدات' : 'Confirmations'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'وقت الإيداع' : 'Deposit Time'}</th>
              <th className="py-3.5 px-4">{isRtl ? 'وقت الاكتمال' : 'Complete Time'}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#12315C]/50 text-xs">
            {isLoading ? (
              // 2. Loading Skeleton Rows
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-4 w-20 bg-[#12315C]/60 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-24 bg-[#12315C]/80 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-12 bg-[#12315C]/50 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-14 bg-[#12315C]/60 rounded-full" /></td>
                  <td className="py-4 px-4"><div className="h-5 w-20 bg-[#12315C]/60 rounded-full" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-32 bg-[#12315C]/50 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-32 bg-[#12315C]/50 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-10 bg-[#12315C]/50 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-28 bg-[#12315C]/50 rounded" /></td>
                  <td className="py-4 px-4"><div className="h-4 w-28 bg-[#12315C]/50 rounded" /></td>
                </tr>
              ))
            ) : paginatedData.length > 0 ? (
              // Real Data Rows
              paginatedData.map((row, idx) => {
                const txKey = `tx-${row.id || idx}`;
                const addrKey = `addr-${row.id || idx}`;
                const isTxCopied = !!copiedKeys[txKey];
                const isAddrCopied = !!copiedKeys[addrKey];

                return (
                  <tr
                    key={row.txId || row.id || idx}
                    className="hover:bg-[#06142F]/80 transition-colors group"
                  >
                    {/* 1. ID */}
                    <td className="py-3.5 px-4 font-tabular font-mono text-[11px] text-[#A7AFBF]">
                      <span className="px-1.5 py-0.5 rounded bg-[#01071E] border border-[#12315C] text-[#687287]">
                        #{row.id.slice(-6) || idx + 1}
                      </span>
                    </td>

                    {/* 2. Amount: 120 USDT */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-tabular font-extrabold text-sm text-[#FB8704]">
                        {row.amount}
                      </span>
                      <span className="text-[11px] text-[#A7AFBF] font-semibold mx-1">
                        {row.coin}
                      </span>
                    </td>

                    {/* 3. Coin */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-xs text-[#F5F7FA]">
                        {row.coin}
                      </span>
                    </td>

                    {/* 4. Network */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderNetworkBadge(row.network)}
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(row.status)}
                    </td>

                    {/* 6. Address with Copy button */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-tabular font-mono text-xs text-[#A7AFBF] select-all cursor-default"
                          title={row.address}
                        >
                          {truncateHash(row.address, 6, 4)}
                        </span>
                        {row.address && (
                          <button
                            onClick={() =>
                              handleCopy(row.address, addrKey, isRtl ? 'عنوان المحفظة' : 'Wallet Address')
                            }
                            className={`p-1 rounded-md transition-all ${
                              isAddrCopied
                                ? 'bg-[#16C784]/20 text-[#16C784]'
                                : 'text-[#687287] hover:text-[#0488F8] hover:bg-[#01071E]'
                            }`}
                            title={
                              isAddrCopied
                                ? (isRtl ? 'تم النسخ!' : 'Copied!')
                                : (isRtl ? 'نسخ العنوان كاملاً' : 'Copy Address')
                            }
                          >
                            {isAddrCopied ? (
                              <IoCheckmarkOutline className="text-sm text-[#16C784]" />
                            ) : (
                              <IoCopyOutline className="text-xs" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 7. Transaction ID with Copy button */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-tabular font-mono text-xs text-[#0488F8] font-medium select-all cursor-default"
                          title={row.txId}
                        >
                          {truncateHash(row.txId, 8, 4)}
                        </span>
                        {row.txId && (
                          <button
                            onClick={() =>
                              handleCopy(row.txId, txKey, isRtl ? 'رقم المعاملة TxId' : 'Transaction ID')
                            }
                            className={`p-1 rounded-md transition-all ${
                              isTxCopied
                                ? 'bg-[#16C784]/20 text-[#16C784]'
                                : 'text-[#687287] hover:text-[#0488F8] hover:bg-[#01071E]'
                            }`}
                            title={
                              isTxCopied
                                ? (isRtl ? 'تم النسخ!' : 'Copied!')
                                : (isRtl ? 'نسخ الـ TxId كاملاً' : 'Copy TxId')
                            }
                          >
                            {isTxCopied ? (
                              <IoCheckmarkOutline className="text-sm text-[#16C784]" />
                            ) : (
                              <IoCopyOutline className="text-xs" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 8. Confirmations */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#01071E] border border-[#12315C] font-mono text-[11px] text-[#A7AFBF] font-tabular">
                        <IoShieldCheckmarkOutline className="text-[10px] text-[#16C784]" />
                        {row.confirmTimes}
                      </span>
                    </td>

                    {/* 9. Deposit Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-tabular text-[11px] text-[#A7AFBF]">
                      {formatTimestamp(row.insertTime, isRtl)}
                    </td>

                    {/* 10. Complete Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-tabular text-[11px] text-[#687287]">
                      {formatTimestamp(row.completeTime, isRtl)}
                    </td>
                  </tr>
                );
              })
            ) : (
              // 3. Empty State
              <tr>
                <td colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center justify-center text-[#687287] gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#01071E] border border-[#12315C] flex items-center justify-center text-2xl text-[#A7AFBF]">
                      <IoLayersOutline />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#F5F7FA]">
                        {isRtl ? 'لا توجد عمليات إيداع مسجلة' : 'No Deposit Records Found'}
                      </p>
                      <p className="text-xs text-[#A7AFBF] mt-0.5">
                        {isRtl
                          ? 'لم نجد أي عمليات تطابق معايير البحث أو الفلاتر المحددة حالياً.'
                          : 'Try changing your search keywords or active filters.'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="p-4 border-t border-[#12315C] bg-[#01071E]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A7AFBF]">
          <div>
            {isRtl ? (
              <>
                عرض{' '}
                <span className="font-tabular font-bold text-[#F5F7FA]">
                  {startIdx + 1}
                </span>{' '}
                إلى{' '}
                <span className="font-tabular font-bold text-[#F5F7FA]">
                  {Math.min(startIdx + pageSize, totalItems)}
                </span>{' '}
                من إجمالي{' '}
                <span className="font-tabular font-bold text-[#FB8704]">
                  {totalItems}
                </span>{' '}
                إيداع
              </>
            ) : (
              <>
                Showing{' '}
                <span className="font-tabular font-bold text-[#F5F7FA]">
                  {startIdx + 1}
                </span>{' '}
                to{' '}
                <span className="font-tabular font-bold text-[#F5F7FA]">
                  {Math.min(startIdx + pageSize, totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-tabular font-bold text-[#FB8704]">
                  {totalItems}
                </span>{' '}
                deposits
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Prev button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#12315C] text-[#F5F7FA] hover:bg-[#0A1B3D] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title={isRtl ? 'الصفحة السابقة' : 'Previous page'}
            >
              <IoChevronForward className="rtl:rotate-0 ltr:rotate-180" />
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 rounded-lg font-tabular font-semibold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#0488F8] text-white shadow-sm'
                        : 'border border-[#12315C] text-[#A7AFBF] hover:bg-[#0A1B3D]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return (
                  <span key={pageNum} className="px-1 text-[#687287]">
                    ...
                  </span>
                );
              }
              return null;
            })}

            {/* Next button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#12315C] text-[#F5F7FA] hover:bg-[#0A1B3D] disabled:opacity-40 disabled:pointer-events-none transition-colors"
              title={isRtl ? 'الصفحة التالية' : 'Next page'}
            >
              <IoChevronBack className="rtl:rotate-0 ltr:rotate-180" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
