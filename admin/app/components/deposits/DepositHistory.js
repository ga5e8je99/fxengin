'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAdmin } from '../../context/AdminContext';
import DepositFilters from './DepositFilters';
import DepositTable from './DepositTable';
import { fetchDepositHistory } from '../../services/depositService';
import { toast } from 'react-toastify';
import { IoWalletOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';

export default function DepositHistory({ standalone = false }) {
  const { isRtl } = useAdmin();

  // Raw fetched deposits
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoin, setSelectedCoin] = useState('ALL');
  const [selectedNetwork, setSelectedNetwork] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'amount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch data function
  const loadDeposits = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);
    setErrorMessage('');

    try {
      const res = await fetchDepositHistory();
      if (res.success) {
        setDeposits(res.data);
        setLastUpdated(new Date(res.timestamp));
        if (isManualRefresh) {
          toast.success(
            isRtl
              ? `تم تحديث البيانات بنجاح (${res.data.length} سجل)`
              : `Deposits refreshed (${res.data.length} records)`
          );
        }
      } else {
        setIsError(true);
        setErrorMessage(res.error || 'فشل الاتصال بالـ API');
        if (isManualRefresh) {
          toast.error(res.error || 'فشل التحديث');
        }
      }
    } catch (err) {
      setIsError(true);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRtl]);

  // Initial fetch on mount
  useEffect(() => {
    loadDeposits(false);
  }, [loadDeposits]);

  // Optional auto-refresh (every 60 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDeposits(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDeposits]);

  // Extract unique available coins and networks from data
  const availableCoins = useMemo(() => {
    const set = new Set(deposits.map((d) => d.coin).filter(Boolean));
    return Array.from(set);
  }, [deposits]);

  const availableNetworks = useMemo(() => {
    const set = new Set(deposits.map((d) => d.network).filter(Boolean));
    return Array.from(set);
  }, [deposits]);

  // Format last updated text
  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return isRtl ? 'جاري التحميل...' : 'Loading...';
    try {
      const hours = String(lastUpdated.getHours()).padStart(2, '0');
      const minutes = String(lastUpdated.getMinutes()).padStart(2, '0');
      const seconds = String(lastUpdated.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    } catch {
      return isRtl ? 'الآن' : 'Just now';
    }
  }, [lastUpdated, isRtl]);

  // Filtered and Sorted deposits
  const filteredAndSortedDeposits = useMemo(() => {
    let result = [...deposits];

    // 1. Search Filter
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      result = result.filter((item) => {
        return (
          item.txId?.toLowerCase().includes(query) ||
          item.address?.toLowerCase().includes(query) ||
          item.id?.toLowerCase().includes(query) ||
          item.network?.toLowerCase().includes(query) ||
          item.coin?.toLowerCase().includes(query) ||
          item.amount?.toLowerCase().includes(query)
        );
      });
    }

    // 2. Filter by Coin
    if (selectedCoin !== 'ALL') {
      result = result.filter((item) => item.coin === selectedCoin);
    }

    // 3. Filter by Network
    if (selectedNetwork !== 'ALL') {
      result = result.filter((item) => item.network === selectedNetwork);
    }

    // 4. Filter by Status
    if (selectedStatus === 'COMPLETED') {
      result = result.filter((item) => item.status === 1);
    } else if (selectedStatus === 'PENDING') {
      result = result.filter((item) => item.status !== 1);
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        const timeA = a.insertTime || a.completeTime || 0;
        const timeB = b.insertTime || b.completeTime || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      if (sortBy === 'amount') {
        const amountA = a.numericAmount || 0;
        const amountB = b.numericAmount || 0;
        return sortOrder === 'desc' ? amountB - amountA : amountA - amountB;
      }
      return 0;
    });

    return result;
  }, [deposits, searchTerm, selectedCoin, selectedNetwork, selectedStatus, sortBy, sortOrder]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCoin, selectedNetwork, selectedStatus, sortBy, sortOrder]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCoin('ALL');
    setSelectedNetwork('ALL');
    setSelectedStatus('ALL');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0458EC] to-[#FB8704] flex items-center justify-center text-xl text-white shadow-md shadow-[#0488F8]/15">
              <IoWalletOutline />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#F5F7FA] tracking-tight flex items-center gap-2">
                <span>{isRtl ? 'سجل الإيداعات' : 'Deposit History'}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30 font-tabular">
                  LIVE API
                </span>
              </h2>
              <p className="text-xs text-[#A7AFBF] mt-0.5">
                {isRtl
                  ? 'متابعة وتدقيق عمليات الإيداع بالعملات الرقمية (TRX, TON, USDT) عبر الـ Blockchain مباشرة'
                  : 'Real-time blockchain deposit audits and transaction ledger for crypto transfers'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#06142F] border border-[#12315C] text-[#A7AFBF]">
            <IoShieldCheckmarkOutline className="text-sm text-[#16C784]" />
            <span>{isRtl ? 'نظام التحقق نشط' : 'Audited Ledger'}</span>
          </span>
        </div>
      </div>

      {/* 2. Filters & Controls Bar */}
      <DepositFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCoin={selectedCoin}
        onCoinChange={setSelectedCoin}
        availableCoins={availableCoins}
        selectedNetwork={selectedNetwork}
        onNetworkChange={setSelectedNetwork}
        availableNetworks={availableNetworks}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onToggleSortOrder={() =>
          setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
        }
        onRefresh={() => loadDeposits(true)}
        isRefreshing={isRefreshing}
        lastUpdatedText={lastUpdatedText}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh((prev) => !prev)}
        onResetFilters={handleResetFilters}
        isRtl={isRtl}
      />

      {/* 3. Responsive Table */}
      <DepositTable
        deposits={filteredAndSortedDeposits}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={() => loadDeposits(false)}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredAndSortedDeposits.length}
        onPageChange={setCurrentPage}
        isRtl={isRtl}
      />
    </div>
  );
}
