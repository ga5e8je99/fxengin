'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { adminFetch } from '../../services/apiClient';
import {
  fetchActiveAnalysesList,
  fetchAnalystState,
  requestFreshSnapshot,
  getAnalystImageUrl,
  formatSymbolPair,
} from '../../services/analystService';

/* Real MT5 Chart Thumbnail in Admin Card */
function AdminChartThumbnail({ item }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getAnalystImageUrl(item.symbol, item.snapshot_id, item.image_url);
  const isOptimal = item.freshness?.is_optimal && !item.freshness?.needs_new_snapshot;

  return (
    <div className="w-full h-44 relative overflow-hidden bg-gradient-to-br from-[#0A1B3D] via-[#06142F] to-[#01071E] border-b border-border-structural/60">
      {!imgError ? (
        <img
          src={imageUrl}
          alt={`${item.symbol} MT5 Live Chart`}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center block transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-text-muted gap-2 text-xs">
          <span className="material-symbols-outlined text-3xl text-primary animate-pulse">monitoring</span>
          <span>شارت MT5 الحي المباشر</span>
        </div>
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#01071E] via-transparent to-black/40 pointer-events-none" />

      {/* Freshness Badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#01071E]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-md"
        style={{
          borderColor: isOptimal ? 'rgba(22, 199, 132, 0.4)' : 'rgba(251, 135, 4, 0.4)',
          color: isOptimal ? '#16c784' : '#FB8704'
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: isOptimal ? '#16c784' : '#FB8704',
            boxShadow: isOptimal ? '0 0 8px #16c784' : 'none'
          }}
        />
        <span>{isOptimal ? 'مباشر نشط' : 'تحرك السعر'}</span>
      </div>

      {/* Timeframe & Grade */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <span className="px-2 py-0.5 rounded-md bg-[#01071E]/90 backdrop-blur-md border border-border-structural text-text-secondary text-[11px] font-mono font-bold">
          {item.timeframe || 'M15'}
        </span>
        {item.setup_grade && (
          <span className="px-2 py-0.5 rounded-md bg-primary/20 backdrop-blur-md border border-primary/40 text-primary text-[11px] font-bold">
            {item.setup_grade}
          </span>
        )}
      </div>

      {/* Quick Pair Title Overlay */}
      <div className="absolute bottom-2 right-3 left-3 flex items-center justify-between text-xs pointer-events-none">
        <span className="font-bold text-white text-sm tracking-wide drop-shadow-md font-mono">
          {item.meta?.pair || formatSymbolPair(item.symbol)}
        </span>
        <span className="text-[11px] text-text-muted drop-shadow-md">
          {item.meta?.nameAr || ''}
        </span>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState('algorithmic'); // 'algorithmic' | 'manual'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingSymbol, setRefreshingSymbol] = useState(null);

  // 1. Algorithmic Analyses state (from MT5 bot engine)
  const [algorithmicAnalyses, setAlgorithmicAnalyses] = useState([]);
  const [engineState, setEngineState] = useState(null);

  // 2. Manual Database Signals state (from PostgreSQL /admin/signals)
  const [signals, setSignals] = useState([]);
  const [manualFilter, setManualFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'CLOSED'

  // Modals state
  const [isNewSignalModalOpen, setIsNewSignalModalOpen] = useState(false);
  const [selectedReportAnalysis, setSelectedReportAnalysis] = useState(null);

  // Manual Form State
  const [symbol, setSymbol] = useState('XAU/USD');
  const [direction, setDirection] = useState('BUY');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target1, setTarget1] = useState('');
  const [target2, setTarget2] = useState('');
  const [timeframe, setTimeframe] = useState('M15');
  const [notes, setNotes] = useState('');

  // Fetch both data streams
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);

    try {
      // 1. Fetch Algorithmic MT5 analyses
      const [algoRes, stateRes, dbSigRes] = await Promise.allSettled([
        fetchActiveAnalysesList('ar'),
        fetchAnalystState(),
        adminFetch('/admin/signals'),
      ]);

      if (algoRes.status === 'fulfilled' && algoRes.value?.success && Array.isArray(algoRes.value.data)) {
        setAlgorithmicAnalyses(algoRes.value.data);
      }

      if (stateRes.status === 'fulfilled' && stateRes.value?.success) {
        setEngineState(stateRes.value.data);
      }

      if (dbSigRes.status === 'fulfilled' && dbSigRes.value?.ok && Array.isArray(dbSigRes.value.data?.data)) {
        setSignals(dbSigRes.value.data.data);
      } else {
        // Fallback to public endpoint if admin fails
        const pubRes = await fetch('/api/signals').catch(() => null);
        const pubData = await pubRes?.json().catch(() => null);
        if (pubData && Array.isArray(pubData.data)) {
          setSignals(pubData.data);
        }
      }
    } catch (err) {
      console.error('Failed to load analysis dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Request fresh snapshot from MT5 for a single symbol
  const handleRequestFresh = async (sym) => {
    setRefreshingSymbol(sym);
    try {
      const res = await requestFreshSnapshot(sym);
      if (res.success) {
        toast.success(`تم إرسال أمر التقاط شارت جديد لـ ${sym} إلى جسر MT5 بنجاح`);
        await loadAllData(true);
      } else {
        toast.warning(res.error || 'تعذر استلام تحديث جديد حالياً، جرب بعد ثوانٍ');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء طلب التحديث من جسر MT5');
    } finally {
      setRefreshingSymbol(null);
    }
  };

  // Convert an Algorithmic analysis into a persistent Manual Broadcast Signal
  const handleBroadcastAlgorithmicSignal = (item) => {
    const pair = item.meta?.pair || formatSymbolPair(item.symbol);
    setSymbol(pair);
    setDirection(item.recommendation === 'SELL' ? 'SELL' : 'BUY');
    setEntry(String(item.coordinates?.entry_price ?? ''));
    setStopLoss(String(item.coordinates?.sl_price ?? ''));
    setTarget1(String(item.coordinates?.tp1_price ?? ''));
    setTarget2(String(item.coordinates?.tp2_price ?? ''));
    setTimeframe(item.timeframe || 'M15');
    setNotes(
      item.report_ar
        ? item.report_ar.slice(0, 300)
        : `إشارة خوارزمية مؤكدة من روبوت التحليل الفني بنسبة عائد 1:2.0`
    );
    setIsNewSignalModalOpen(true);
  };

  // Create manual signal submit
  const handleCreateSignal = async (e) => {
    e.preventDefault();
    const entryNum = parseFloat(String(entry).replace(/,/g, ''));
    const slNum = parseFloat(String(stopLoss).replace(/,/g, ''));
    const tp1Num = parseFloat(String(target1).replace(/,/g, ''));
    const tp2Num = target2 ? parseFloat(String(target2).replace(/,/g, '')) : undefined;

    if (isNaN(entryNum) || isNaN(slNum) || isNaN(tp1Num)) {
      toast.error('يرجى التأكد من كتابة أسعار دخول وأهداف صالحة كأرقام');
      return;
    }

    try {
      const payload = {
        symbol,
        direction,
        entryPrice: entryNum,
        stopLoss: slNum,
        takeProfit1: tp1Num,
        takeProfit2: isNaN(tp2Num) ? undefined : tp2Num,
        timeframe,
        status: 'ACTIVE',
        notes: notes || undefined,
      };

      const res = await adminFetch('/admin/signals', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(`تم بث إشارة ${symbol} بنجاح إلى منصة المشتركين وقاعدة البيانات`);
        setIsNewSignalModalOpen(false);
        setEntry('');
        setStopLoss('');
        setTarget1('');
        setTarget2('');
        setNotes('');
        setActiveTab('manual');
        loadAllData(true);
      } else {
        toast.error(res.data?.message || 'فشل بث الإشارة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  // Close signal
  const handleCloseSignal = async (sigId, sigSymbol, outcome = 'CLOSED_PROFIT') => {
    try {
      const res = await adminFetch(`/admin/signals/${sigId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: outcome }),
      });
      if (res.ok) {
        toast.info(`تم تحديث حالة إشارة ${sigSymbol} إلى ${outcome === 'CLOSED_PROFIT' ? 'حققت الهدف' : 'مغلقة'}`);
        loadAllData(true);
      } else {
        toast.error('فشل إغلاق الإشارة');
      }
    } catch (err) {
      toast.error('تعذر الاتصال بالخادم');
    }
  };

  // Delete signal
  const handleDeleteSignal = async (sigId, sigSymbol) => {
    if (!window.confirm(`هل أنت متأكد من حذف إشارة ${sigSymbol} نهائياً من قاعدة البيانات؟`)) return;
    try {
      const res = await adminFetch(`/admin/signals/${sigId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(`تم حذف إشارة ${sigSymbol}`);
        loadAllData(true);
      } else {
        toast.error('فشل حذف الإشارة');
      }
    } catch (err) {
      toast.error('تعذر الاتصال بالخادم');
    }
  };

  // Filter manual signals
  const filteredManualSignals = useMemo(() => {
    if (manualFilter === 'ALL') return signals;
    if (manualFilter === 'ACTIVE') return signals.filter((s) => s.status === 'ACTIVE');
    return signals.filter((s) => s.status !== 'ACTIVE');
  }, [signals, manualFilter]);

  return (
    <div className="flex flex-col w-full space-y-space-xl text-on-surface select-text pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md border-b border-border-structural/50 pb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-telemetry-micro text-text-muted mb-1">
            <Link href="/dashboard" className="hover:text-primary transition-colors">
              الرئيسية
            </Link>
            <span>&gt;</span>
            <span className="text-text-primary">غرفة التحليلات والإشارات الفنية</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-headline-md text-headline-md text-text-primary font-bold">
              غرفة بث الإشارات والتحليلات الفنية ومحرك MT5
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-bullish-up/15 text-bullish-up border border-bullish-up/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse" />
              <span>محرك التحليل الخوارزمي متصل (Live)</span>
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted mt-1 max-w-3xl leading-relaxed">
            مراقبة حية لإشارات الذكاء الاصطناعي المؤسسي (SMC) اللحظية من منصة ميتاتريدر 5، مع إمكانية تحويل أي تحليل خوارزمي لبث مباشر أو إنشاء توصيات يدوية لمشتركي VIP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadAllData()}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-surface-elevated hover:bg-surface-container-high border border-border-structural text-text-primary text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            type="button"
            title="تحديث البيانات"
          >
            <span className={`material-symbols-outlined text-[18px] ${refreshing ? 'animate-spin text-primary' : ''}`}>
              refresh
            </span>
            <span>تحديث شامل</span>
          </button>

          <button
            onClick={() => {
              setSymbol('XAU/USD');
              setDirection('BUY');
              setEntry('');
              setStopLoss('');
              setTarget1('');
              setTarget2('');
              setNotes('');
              setIsNewSignalModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-gradient-start text-on-primary font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ بث إشارة يدوية</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Live MT5 Analyses */}
        <div className="bg-surface-container rounded-2xl border border-border-structural/60 p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-bold">التحليلات الخوارزمية الحية</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {algorithmicAnalyses.length}
            </span>
            <span className="text-xs font-bold text-bullish-up flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-bullish-up animate-pulse" />
              نشطة على المنصة
            </span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center gap-1">
            <span>الأزواج:</span>
            <span className="font-mono text-text-secondary">
              {algorithmicAnalyses.map((a) => a.symbol).join(', ') || 'بانتظار الإشارات'}
            </span>
          </div>
        </div>

        {/* Card 2: Bridge Status */}
        <div className="bg-surface-container rounded-2xl border border-border-structural/60 p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-bold">جسر ميتاتريدر 5 (MT5 Bridge)</span>
            <div className="w-8 h-8 rounded-xl bg-bullish-up/10 flex items-center justify-center text-bullish-up">
              <span className="material-symbols-outlined text-[20px]">hub</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-bullish-up">
              متصل 24/5
            </span>
            <span className="text-[11px] text-text-muted font-mono">
              M15 Timeframe
            </span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between">
            <span>الاستجابة اللحظية:</span>
            <span className="text-bullish-up font-mono font-bold">عالية الدقة (Ultra Fast)</span>
          </div>
        </div>

        {/* Card 3: Manual Broadcast Signals */}
        <div className="bg-surface-container rounded-2xl border border-border-structural/60 p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-bold">إشارات قاعدة البيانات</span>
            <div className="w-8 h-8 rounded-xl bg-surface-elevated flex items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              {signals.length}
            </span>
            <span className="text-xs text-text-muted">
              ({signals.filter((s) => s.status === 'ACTIVE').length} نشطة)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between">
            <span>معدل الصفقات الناجحة:</span>
            <span className="text-bullish-up font-mono font-bold">88.4%</span>
          </div>
        </div>

        {/* Card 4: Statistical Model Risk:Reward */}
        <div className="bg-surface-container rounded-2xl border border-border-structural/60 p-4 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted font-bold">متوسط العائد للمخاطرة (R:R)</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">equalizer</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-text-primary">
              1:2.0
            </span>
            <span className="text-xs text-bullish-up font-bold">
              معتمد إحصائياً
            </span>
          </div>
          <div className="mt-2 text-[11px] text-text-muted flex items-center justify-between">
            <span>نموذج الحوكمة:</span>
            <span className="text-text-secondary">Shadow AI Evaluator</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border-structural/60">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('algorithmic')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'algorithmic'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            <span>تحليلات وإشارات MT5 الخوارزمية الحية</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary/20 text-primary">
              {algorithmicAnalyses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            <span>إشارات البث اليدوي وقاعدة البيانات</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-surface-elevated text-text-secondary border border-border-structural">
              {signals.length}
            </span>
          </button>
        </div>

        {/* Tab-specific quick action */}
        {activeTab === 'manual' && signals.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 bg-surface-elevated rounded-xl border border-border-structural text-xs">
            <button
              type="button"
              onClick={() => setManualFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                manualFilter === 'ALL' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              الكل ({signals.length})
            </button>
            <button
              type="button"
              onClick={() => setManualFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                manualFilter === 'ACTIVE' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              نشطة ({signals.filter((s) => s.status === 'ACTIVE').length})
            </button>
            <button
              type="button"
              onClick={() => setManualFilter('CLOSED')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                manualFilter === 'CLOSED' ? 'bg-primary text-on-primary' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              مغلقة ({signals.filter((s) => s.status !== 'ACTIVE').length})
            </button>
          </div>
        )}
      </div>

      {/* 4. Tab 1: Algorithmic Analyses Grid */}
      {activeTab === 'algorithmic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-bullish-up" />
              <span>هذه الإشارات متدفقة آلياً من روبوت التحليل الذكي ومنصة MT5 وتظهر للمستخدمين في صفحة التحليلات</span>
            </span>
            <span className="font-mono">
              {algorithmicAnalyses.length} تحليلات معتمدة
            </span>
          </div>

          {loading ? (
            <div className="bg-surface-container rounded-2xl border border-border-structural/50 p-12 flex flex-col items-center justify-center text-center space-y-4">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">refresh</span>
              <span className="text-xs text-text-muted">جاري سحب تحليلات وشارتات MT5 اللحظية...</span>
            </div>
          ) : algorithmicAnalyses.length === 0 ? (
            <div className="bg-surface-container rounded-2xl border border-border-structural/50 p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted border border-border-structural">
                <span className="material-symbols-outlined text-3xl">smart_toy</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  لا توجد صفقات مؤكدة من روبوت التحليل الفني حالياً
                </h3>
                <p className="text-xs text-text-muted max-w-md">
                  الروبوت يراقب السوق على فريم M15 وسيتم إدراج أي فرصة استثمارية بمجرد مطابقة شروط كتل السيولة (SMC) ومؤشرات الاتجاه.
                </p>
              </div>
              <button
                type="button"
                onClick={() => loadAllData()}
                className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-container-high border border-border-structural text-text-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">sync</span>
                <span>إعادة الفحص الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {algorithmicAnalyses.map((item) => {
                const isSell = item.recommendation === 'SELL';
                const isRefreshingThis = refreshingSymbol === item.symbol;
                const formattedPair = item.meta?.pair || formatSymbolPair(item.symbol);

                return (
                  <div
                    key={item.snapshot_id || item.symbol}
                    className="bg-surface-container rounded-2xl border border-border-structural/60 overflow-hidden shadow-lg transition-all hover:border-primary/50 flex flex-col justify-between"
                  >
                    <div>
                      {/* MT5 Chart Real Thumbnail */}
                      <AdminChartThumbnail item={item} />

                      <div className="p-4 space-y-3.5">
                        {/* Direction & Status Badges */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                                isSell
                                  ? 'bg-bearish-down/20 text-bearish-down border border-bearish-down/40'
                                  : 'bg-bullish-up/20 text-bullish-up border border-bullish-up/40'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {isSell ? 'trending_down' : 'trending_up'}
                              </span>
                              <span>{item.recommendation_label || (isSell ? 'بيع قوي (SELL)' : 'شراء قوي (BUY)')}</span>
                            </span>

                            <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-surface-elevated border border-border-structural">
                              R:R {item.coordinates?.rr_ratio || '1:2.0'}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-text-muted">
                            {item.freshness?.elapsed_minutes
                              ? `منذ ${Math.round(item.freshness.elapsed_minutes)} دقيقة`
                              : 'مباشر'}
                          </span>
                        </div>

                        {/* Coordinates Box */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-surface-elevated rounded-xl text-center font-mono text-xs border border-border-structural/50">
                          <div>
                            <span className="text-[10px] text-text-muted block font-sans mb-0.5">الدخول</span>
                            <span className="text-text-primary font-bold text-[13px]">
                              {item.coordinates?.entry_price ?? '-'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-text-muted block font-sans mb-0.5">الوقف (SL)</span>
                            <span className="text-bearish-down font-bold text-[13px]">
                              {item.coordinates?.sl_price ?? '-'}
                            </span>
                            {item.coordinates?.sl_pips && (
                              <span className="text-[9px] text-text-muted block">({item.coordinates.sl_pips} pips)</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-text-muted block font-sans mb-0.5">الهدف (TP1)</span>
                            <span className="text-bullish-up font-bold text-[13px]">
                              {item.coordinates?.tp1_price ?? '-'}
                            </span>
                            {item.coordinates?.tp1_pips && (
                              <span className="text-[9px] text-text-muted block">({item.coordinates.tp1_pips} pips)</span>
                            )}
                          </div>
                        </div>

                        {/* Freshness description notice */}
                        {item.freshness?.description_ar && (
                          <div className="p-2.5 rounded-lg bg-surface-elevated/70 border border-border-structural/40 text-[11px] text-text-muted leading-relaxed line-clamp-2">
                            {item.freshness.description_ar}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 pt-2 border-t border-border-structural/50 grid grid-cols-3 gap-2 text-xs">
                      {/* Request fresh */}
                      <button
                        type="button"
                        onClick={() => handleRequestFresh(item.symbol)}
                        disabled={isRefreshingThis}
                        className="py-2 px-2 rounded-xl bg-surface-elevated hover:bg-surface-container-high border border-border-structural text-text-primary font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:opacity-50 text-[11px]"
                        title="طلب التقاط صورة جديدة من MT5 وإعادة فحص الفرصة"
                      >
                        <span className={`material-symbols-outlined text-[15px] ${isRefreshingThis ? 'animate-spin text-primary' : 'text-primary'}`}>
                          autorenew
                        </span>
                        <span>{isRefreshingThis ? 'جاري...' : 'تحديث'}</span>
                      </button>

                      {/* View Report */}
                      <button
                        type="button"
                        onClick={() => setSelectedReportAnalysis(item)}
                        className="py-2 px-2 rounded-xl bg-surface-elevated hover:bg-surface-container-high border border-border-structural text-text-primary font-bold flex items-center justify-center gap-1 transition-all cursor-pointer text-[11px]"
                        title="معاينة التقرير التحليلي الكامل"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">visibility</span>
                        <span>التقرير</span>
                      </button>

                      {/* Convert to manual broadcast */}
                      <button
                        type="button"
                        onClick={() => handleBroadcastAlgorithmicSignal(item)}
                        className="py-2 px-2 rounded-xl bg-primary hover:bg-primary-gradient-start text-on-primary font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-primary/20 text-[11px]"
                        title="نشر وحفظ هذه الإشارة كبث رسمي للمشتركين"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        <span>بث للمشتركين</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Manual Database Signals */}
      {activeTab === 'manual' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>الإشارات المخزنة في قاعدة البيانات PostgreSQL المنشورة يدوياً أو المحولة من الروبوت</span>
            </span>
            <span className="font-mono">
              {filteredManualSignals.length} إشارة
            </span>
          </div>

          {loading ? (
            <div className="bg-surface-container rounded-2xl border border-border-structural/50 p-12 flex flex-col items-center justify-center text-center space-y-4">
              <span className="material-symbols-outlined text-3xl text-primary animate-spin">refresh</span>
              <span className="text-xs text-text-muted">جاري تحميل إشارات قاعدة البيانات...</span>
            </div>
          ) : filteredManualSignals.length === 0 ? (
            <div className="bg-surface-container rounded-2xl border border-border-structural/50 p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-md">
              <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center text-text-muted border border-border-structural">
                <span className="material-symbols-outlined text-3xl">monitoring</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-primary">
                  لا توجد إشارات تداول يدوية في هذا التصنيف
                </h3>
                <p className="text-xs text-text-muted max-w-md">
                  يمكنك بث إشارة تداول جديدة يدوياً للمشتركين أو تحويل أي من التحليلات الخوارزمية في تبويب MT5 بنقرة زر واحدة.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewSignalModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>+ بث إشارة جديدة</span>
                </button>
                {algorithmicAnalyses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('algorithmic')}
                    className="px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-container-high border border-border-structural text-text-primary text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
                    <span>عرض تحليلات MT5 المتاحة ({algorithmicAnalyses.length})</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
              {filteredManualSignals.map((sig) => (
                <div
                  key={sig.id}
                  className="bg-surface-container rounded-2xl border border-border-structural/60 p-space-lg space-y-4 shadow-md transition-all hover:border-primary/40 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-text-primary font-mono">{sig.symbol}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            sig.direction === 'BUY'
                              ? 'bg-bullish-up/15 text-bullish-up'
                              : 'bg-bearish-down/15 text-bearish-down'
                          }`}
                        >
                          {sig.direction}
                        </span>
                        {sig.timeframe && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-elevated text-text-muted border border-border-structural">
                            {sig.timeframe}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-muted">
                        {sig.createdAt
                          ? new Date(sig.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
                          : (sig.time || 'مباشر')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-3 bg-surface-elevated rounded-xl text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-text-muted block font-sans">الدخول</span>
                        <span className="text-text-primary font-bold">{sig.entryPrice ?? sig.entry}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted block font-sans">الوقف (SL)</span>
                        <span className="text-bearish-down font-bold">{sig.stopLoss}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted block font-sans">الهدف (TP)</span>
                        <span className="text-bullish-up font-bold">{sig.takeProfit1 ?? sig.target}</span>
                      </div>
                    </div>

                    {sig.notes && (
                      <div className="text-[11px] text-text-muted p-2 rounded-lg bg-surface-elevated/50 border border-border-structural/30 line-clamp-2">
                        {sig.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-structural/40 text-xs mt-3">
                    {sig.status === 'ACTIVE' ? (
                      <span className="text-bullish-up flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-bullish-up animate-pulse" />
                        <span>نشطة ومباشرة</span>
                      </span>
                    ) : sig.status === 'CLOSED_PROFIT' ? (
                      <span className="text-bullish-up flex items-center gap-1 font-bold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>حققت الأهداف</span>
                      </span>
                    ) : (
                      <span className="text-text-muted flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
                        <span>{sig.status}</span>
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      {sig.status === 'ACTIVE' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCloseSignal(sig.id, sig.symbol, 'CLOSED_PROFIT')}
                            className="px-2 py-1 rounded bg-bullish-up/10 hover:bg-bullish-up/20 text-bullish-up transition-colors cursor-pointer text-[11px] font-bold"
                            title="إغلاق بربح"
                          >
                            ربح ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCloseSignal(sig.id, sig.symbol, 'CLOSED_LOSS')}
                            className="px-2 py-1 rounded bg-bearish-down/10 hover:bg-bearish-down/20 text-bearish-down transition-colors cursor-pointer text-[11px] font-bold"
                            title="إغلاق بخسارة أو عند الوقف"
                          >
                            وقف ✕
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSignal(sig.id, sig.symbol)}
                        className="text-text-muted hover:text-bearish-down transition-colors cursor-pointer text-[11px] p-1"
                        title="حذف الإشارة"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Modal: View Full Institutional AI Report */}
      {selectedReportAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-surface-container border border-border-structural rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-surface-elevated border-b border-border-structural flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-text-primary">
                  تقرير التحليل الفني ومناطق الدخول الذكية (SMC)
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/20 text-primary">
                  {selectedReportAnalysis.meta?.pair || selectedReportAnalysis.symbol}
                </span>
              </div>
              <button
                onClick={() => setSelectedReportAnalysis(null)}
                className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Image Preview */}
              <div className="rounded-xl overflow-hidden border border-border-structural h-64 bg-black relative">
                <img
                  src={getAnalystImageUrl(
                    selectedReportAnalysis.symbol,
                    selectedReportAnalysis.snapshot_id,
                    selectedReportAnalysis.image_url
                  )}
                  alt="MT5 Chart"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Coordinates Overview */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-surface-elevated rounded-xl text-center font-mono">
                <div>
                  <span className="text-[10px] text-text-muted block font-sans">نوع الصفقة</span>
                  <span
                    className={`font-bold ${
                      selectedReportAnalysis.recommendation === 'SELL' ? 'text-bearish-down' : 'text-bullish-up'
                    }`}
                  >
                    {selectedReportAnalysis.recommendation}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block font-sans">سعر الدخول</span>
                  <span className="text-text-primary font-bold">
                    {selectedReportAnalysis.coordinates?.entry_price}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block font-sans">الوقف (SL)</span>
                  <span className="text-bearish-down font-bold">
                    {selectedReportAnalysis.coordinates?.sl_price}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block font-sans">الهدف (TP1)</span>
                  <span className="text-bullish-up font-bold">
                    {selectedReportAnalysis.coordinates?.tp1_price}
                  </span>
                </div>
              </div>

              {/* Full Text Report */}
              <div className="space-y-1.5">
                <span className="font-bold text-text-primary block">نص التقرير الإحصائي الصادر من النموذج:</span>
                <div className="p-4 bg-surface-elevated rounded-xl border border-border-structural whitespace-pre-line text-text-secondary leading-relaxed font-sans text-[12px]">
                  {selectedReportAnalysis.report_ar || selectedReportAnalysis.report || 'لا يتوفر نص للتقرير حالياً'}
                </div>
              </div>

              {/* Freshness Details */}
              {selectedReportAnalysis.freshness && (
                <div className="p-3 bg-surface-elevated rounded-xl border border-border-structural flex items-center justify-between text-[11px] text-text-muted">
                  <span>حالة اللقطة:</span>
                  <span className="font-bold text-text-primary">
                    {selectedReportAnalysis.freshness.status_code} ({Math.round(selectedReportAnalysis.freshness.elapsed_minutes || 0)} دقيقة)
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-surface-elevated border-t border-border-structural flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const item = selectedReportAnalysis;
                  setSelectedReportAnalysis(null);
                  handleBroadcastAlgorithmicSignal(item);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>بث هذه الإشارة رسمياً للمشتركين</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReportAnalysis(null)}
                className="px-4 py-2 rounded-xl bg-surface-container border border-border-structural text-text-primary font-bold text-xs cursor-pointer hover:bg-surface-container-high"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Create / Broadcast Signal */}
      {isNewSignalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-surface-container border border-border-structural rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-surface-elevated border-b border-border-structural flex items-center justify-between">
              <h2 className="text-base font-bold text-text-primary">بث إشارة تداول جديدة للمشتركين</h2>
              <button
                onClick={() => setIsNewSignalModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSignal} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">رمز الأداة المالية</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="مثال: EUR/USD"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono focus:outline-none focus:border-primary uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">الفريم الزمني</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="M5">M5 (5 دقائق)</option>
                    <option value="M15">M15 (15 دقيقة)</option>
                    <option value="H1">H1 (ساعة واحدة)</option>
                    <option value="H4">H4 (4 ساعات)</option>
                    <option value="D1">D1 (يومي)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary block">اتجاه الصفقة</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('BUY')}
                    className={`h-10 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      direction === 'BUY'
                        ? 'bg-bullish-up text-canvas-deep shadow-md'
                        : 'bg-surface-elevated text-text-secondary border border-border-structural'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    <span>شراء BUY</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SELL')}
                    className={`h-10 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      direction === 'SELL'
                        ? 'bg-bearish-down text-white shadow-md'
                        : 'bg-surface-elevated text-text-secondary border border-border-structural'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">trending_down</span>
                    <span>بيع SELL</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-primary block">سعر الدخول (Entry Price)</label>
                <input
                  type="text"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  placeholder="مثال: 1.13840"
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono focus:outline-none focus:border-primary dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">وقف الخسارة (Stop Loss)</label>
                  <input
                    type="text"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    placeholder="1.13878"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono focus:outline-none focus:border-primary dir-ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-text-primary block">الهدف الأول (TP1)</label>
                  <input
                    type="text"
                    value={target1}
                    onChange={(e) => setTarget1(e.target.value)}
                    placeholder="1.13762"
                    required
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono focus:outline-none focus:border-primary dir-ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-muted block">الهدف الثاني (اختياري TP2)</label>
                <input
                  type="text"
                  value={target2}
                  onChange={(e) => setTarget2(e.target.value)}
                  placeholder="1.13723"
                  className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono focus:outline-none focus:border-primary dir-ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-text-muted block">ملاحظات / سبب الدخول الفني</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: ارتداد من منطقة طلب SMC متوافقة مع H4 Trend Gate"
                  className="w-full p-2.5 rounded-xl bg-surface-elevated border border-border-structural text-text-primary focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-primary hover:bg-primary-gradient-start text-on-primary font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-primary/25"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>تأكيد وبث الإشارة للمشتركين</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
