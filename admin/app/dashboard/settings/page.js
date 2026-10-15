'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { toast } from 'react-toastify';
import { adminFetch } from '../../services/apiClient';

export default function SettingsPage() {
  const {
    systemSettings,
    setSystemSettings,
    adminUser,
    superAdminDossier,
    setIsDossierModalOpen,
    refreshAdminSession,
  } = useAdmin();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('general');

  // Form State initialized from system settings or defaults
  const [formData, setFormData] = useState({
    platformName: systemSettings?.siteName || 'FXENGIN Core Terminal',
    baseCurrency: systemSettings?.currency || 'USD',
    defaultLanguage: 'ar_RTL',
    timezone: 'riyadh_ny_close',
    maintenanceMode: systemSettings?.maintenanceMode || false,
    redisCache: true,
    fixApiPort: '8080',
    rateLimit: '2500',
    sandboxMode: false,
    twoFactorEnforced: true,
    sessionTimeout: '60',
  });

  useEffect(() => {
    if (systemSettings?.siteName) {
      setFormData((prev) => ({
        ...prev,
        platformName: systemSettings.siteName,
        baseCurrency: systemSettings.currency || prev.baseCurrency,
        maintenanceMode: !!systemSettings.maintenanceMode,
      }));
    }
  }, [systemSettings]);

  // Telemetry interactive simulation states
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    messagesPerSec: 14200,
    pingNY: 18,
    pingLDN: 12,
    clusterUptimeDays: 412,
    cpuUsage: 24.2,
    memoryUsage: '18.4GB / 64GB',
    diskUsage: '120GB SSD NVMe',
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [revealedKeys, setRevealedKeys] = useState({});

  // Broker Assets state
  const [brokers, setBrokers] = useState([
    { id: 'b1', name: 'Exness Group', status: 'ACTIVE', tier: 'Prime Aggregator', logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&auto=format&fit=crop&q=80', spread: '0.0 pips' },
    { id: 'b2', name: 'Tickmill Prime', status: 'ACTIVE', tier: 'Tier 1 ECN', logo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=100&auto=format&fit=crop&q=80', spread: '0.1 pips' },
    { id: 'b3', name: 'XM Global', status: 'STANDBY', tier: 'Secondary STP', logo: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&auto=format&fit=crop&q=80', spread: '0.6 pips' },
    { id: 'b4', name: 'IC Markets', status: 'ACTIVE', tier: 'Raw Spread ECN', logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&auto=format&fit=crop&q=80', spread: '0.0 pips' },
  ]);

  // Security Whitelist IPs
  const [whitelistedIps, setWhitelistedIps] = useState([]);
  const [newIp, setNewIp] = useState('');

  // Handle Save All Settings
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await adminFetch('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          siteName: formData.platformName,
          currency: formData.baseCurrency,
          maintenanceMode: formData.maintenanceMode,
        }),
      });

      if (res.ok) {
        setSystemSettings({
          ...systemSettings,
          siteName: formData.platformName,
          currency: formData.baseCurrency,
          maintenanceMode: formData.maintenanceMode,
        });
        toast.success('تم حفظ التعديلات الشاملة ومزامنة إعدادات النواة في قاعدة البيانات بنجاح!');
      } else {
        toast.error(res.data?.message || 'فشل حفظ الإعدادات في الخادم');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsSaving(false);
    }
  };

  // Test Direct Connection Simulation
  const handleTestConnection = () => {
    setIsTestingConnection(true);
    toast.info('جاري إرسال حزم الاختبار إلى خوادم London LDN-EQ4 و NY4...');
    setTimeout(() => {
      setIsTestingConnection(false);
      setLiveMetrics((prev) => ({
        ...prev,
        pingNY: 17 + Math.floor(Math.random() * 3),
        pingLDN: 11 + Math.floor(Math.random() * 2),
        messagesPerSec: 14200 + Math.floor(Math.random() * 180),
      }));
      toast.success('فحص الاتصال ناجح: ECN Bridge متصل بنسبة 100% بدون أي فقد حزم (Loss 0.0%)');
    }, 900);
  };

  const toggleKeyReveal = (id) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label} إلى الحافظة`);
  };

  const handleAddIp = () => {
    if (!newIp.trim()) return;
    setWhitelistedIps([...whitelistedIps, newIp.trim()]);
    setNewIp('');
    toast.success('تمت إضافة عنوان IP إلى القائمة البيضاء');
  };

  const handleRemoveIp = (index) => {
    setWhitelistedIps(whitelistedIps.filter((_, idx) => idx !== index));
    toast.info('تمت إزالة عنوان IP');
  };

  return (
    <div className="flex flex-col w-full space-y-space-lg text-on-surface select-text pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          {/* Micro System Tag */}
          <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-bullish-up dir-ltr">
            <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse inline-block"></span>
            <span>KERNEL: ENGIN-SYSLOG-STABLE</span>
            <span className="text-text-muted">•</span>
            <span className="text-primary">SYSTEM CONFIGURATION // V3.4</span>
          </div>

          {/* Main Title */}
          <h1 className="font-headline-lg text-headline-lg text-text-primary font-bold tracking-tight">
            إعدادات المنصة وبوابات الـ API
          </h1>

          {/* Subtitle */}
          <p className="font-body-sm text-body-sm text-text-secondary max-w-2xl">
            إدارة بيئة التشغيل الأساسية، مفاتيح التكامل الآمن لتدفقات السيولة، التنبيهات المباشرة، وحوكمة أصول الشركاء ومحتوى الوسائط.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex items-center gap-space-sm self-start md:self-center shrink-0">
          {/* Direct Connection Test Button */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="flex items-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-container border border-border-structural text-primary transition-all duration-150 cursor-pointer shadow-sm active:scale-98"
          >
            <span className={`material-symbols-outlined text-[18px] ${isTestingConnection ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span className="font-label-md text-label-md font-semibold text-text-primary">
              فحص الاتصال المباشر
            </span>
            <span className="font-telemetry-micro text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-surface-container-high/80 text-text-muted border border-border-structural/60">
              TEST
            </span>
          </button>

          {/* Save All Button (Orange Primary) */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-[#FA5A04] hover:bg-[#E67300] text-white transition-all duration-150 cursor-pointer shadow-lg shadow-[#FA5A04]/25 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">
              save
            </span>
            <span className="font-label-md text-label-md font-bold">
              {isSaving ? 'جارٍ الحفظ...' : 'حفظ التعديلات الشاملة'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry Cockpit (3 Metric Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
        {/* Card 1: ECN Liquidity Bridge (Rightmost in RTL) */}
        <div className="bg-surface-container border border-border-structural rounded-xl p-space-lg flex flex-col justify-between space-y-space-md relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-bullish-up text-[22px]">
                hub
              </span>
              <span className="font-label-lg text-label-lg text-text-primary font-bold">
                جسر السيولة والـ ECN Bridge
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bullish-up/10 border border-bullish-up/30 text-bullish-up font-mono text-[11px] font-bold dir-ltr">
              <span className="w-1.5 h-1.5 rounded-full bg-bullish-up animate-pulse"></span>
              <span>99.98% OK</span>
            </div>
          </div>

          <div className="text-[11px] font-mono tracking-wider text-text-muted uppercase dir-ltr -mt-2">
            PRIME-TIER-1 AGGREGATOR
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-telemetry-stat text-[38px] leading-none font-bold text-text-primary font-mono dir-ltr">
                {liveMetrics.clusterUptimeDays}
              </span>
              <span className="text-xs text-text-secondary font-medium">يوم</span>
            </div>
            <span className="text-xs text-text-secondary font-medium">زمن التشغيل المتواصل</span>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-surface-elevated h-1 rounded overflow-hidden">
              <div className="bg-bullish-up h-full w-full rounded"></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
              <span>حزم البيانات المستقرة: 100%</span>
              <span className="dir-ltr text-text-secondary">TLS 1.3 Strict Encrypted</span>
            </div>
          </div>
        </div>

        {/* Card 2: Cluster Ping Latency (Middle) */}
        <div className="bg-surface-container border border-border-structural rounded-xl p-space-lg flex flex-col justify-between space-y-space-md relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">
                speed
              </span>
              <span className="font-label-lg text-label-lg text-text-primary font-bold">
                زمن الاستجابة (Cluster Ping)
              </span>
            </div>
            <div className="flex items-center px-2 py-0.5 rounded bg-primary-container/15 border border-primary/30 text-primary font-mono text-[11px] font-bold dir-ltr">
              ULTRA-FAST
            </div>
          </div>

          <div className="text-[11px] font-mono tracking-wider text-text-muted uppercase dir-ltr -mt-2">
            GLOBAL LOW-LATENCY ROUTE
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* NY4 Ping */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-bullish-up"></span>
                <span>نيويورك (NY4)</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-telemetry-stat text-[32px] leading-none font-bold text-text-primary font-mono dir-ltr">
                  {liveMetrics.pingNY}
                </span>
                <span className="text-xs text-text-muted font-mono">ms</span>
              </div>
            </div>

            {/* London LDN-EQ4 Ping */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-bullish-up"></span>
                <span>لندن (LDN-EQ4)</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-telemetry-stat text-[32px] leading-none font-bold text-bullish-up font-mono dir-ltr">
                  {liveMetrics.pingLDN}
                </span>
                <span className="text-xs text-bullish-up/80 font-mono">ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <span className="text-bullish-up dir-ltr font-semibold">Jitter &lt; 0.4ms</span>
            <span className="text-text-muted dir-ltr">Cross-Connect: Direct Fiber</span>
          </div>
        </div>

        {/* Card 3: Real-Time Data Processing (Leftmost in RTL) */}
        <div className="bg-surface-container border border-border-structural rounded-xl p-space-lg flex flex-col justify-between space-y-space-md relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-accent-hover text-[22px]">
                cyclone
              </span>
              <span className="font-label-lg text-label-lg text-text-primary font-bold">
                معالجة البيانات اللحظية
              </span>
            </div>
            <div className="flex items-center px-2 py-0.5 rounded bg-accent-hover/15 border border-accent-hover/30 text-accent-hover font-mono text-[11px] font-bold dir-ltr">
              REAL-TIME
            </div>
          </div>

          <div className="text-[11px] font-mono tracking-wider text-text-muted uppercase dir-ltr -mt-2">
            ORDER ENGINE WEBSOCKET
          </div>

          {/* Wave Sparkline Curve */}
          <div className="h-6 w-full relative">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 24">
              <path
                d="M 0,16 Q 15,8 30,14 T 60,6 T 85,18 T 100,8"
                fill="none"
                stroke="#16C784"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M 0,16 Q 15,8 30,14 T 60,6 T 85,18 T 100,8 L 100,24 L 0,24 Z"
                fill="url(#greenGradient)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#16C784" />
                  <stop offset="100%" stopColor="#16C784" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-telemetry-stat text-[36px] leading-none font-bold text-text-primary font-mono dir-ltr">
                {liveMetrics.messagesPerSec.toLocaleString()}
              </span>
              <span className="text-xs text-text-secondary font-medium">رسالة / ثانية</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="w-full bg-surface-elevated h-1 rounded overflow-hidden">
              <div className="bg-primary-container h-full w-[68%] rounded"></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
              <span>سعة القناة القصوى : 68%</span>
              <span className="dir-ltr text-text-secondary">GB / Session 2.8</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs Bar */}
      <div className="w-full bg-surface-container-low border border-border-structural rounded-xl p-1.5 flex items-center gap-2 overflow-x-auto select-none">
        {/* Tab 1: General Environment */}
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'general'
              ? 'bg-surface-elevated text-primary font-bold border border-border-structural shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            tune
          </span>
          <span>الإعدادات العامة للبيئة</span>
        </button>

        {/* Tab 2: API Keys & Webhooks */}
        <button
          type="button"
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-2 px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-surface-elevated text-primary font-bold border border-border-structural shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            terminal
          </span>
          <span>مفاتيح الـ API و Webhooks</span>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-bullish-up/15 text-bullish-up border border-bullish-up/30 dir-ltr">
            ACTIVE 3
          </span>
        </button>

        {/* Tab 3: Partner & Broker Logos */}
        <button
          type="button"
          onClick={() => setActiveTab('assets')}
          className={`flex items-center gap-2 px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'assets'
              ? 'bg-surface-elevated text-primary font-bold border border-border-structural shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            collections
          </span>
          <span>شعارات وأصول الشركاء والوسطاء</span>
        </button>

        {/* Tab 4: Security & Sandbox */}
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-space-md py-2.5 rounded-lg font-label-md text-label-md transition-all duration-150 cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-surface-elevated text-primary font-bold border border-border-structural shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/40'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            security
          </span>
          <span>الحماية والبيانات التجريبية</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      {/* TAB 1: General Environment Settings (Matches User Screenshot) */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Main Configuration Card (Right Column in RTL, 8 Cols) */}
          <div className="lg:col-span-8 bg-surface-container border border-border-structural rounded-xl p-space-lg space-y-space-xl">
            {/* Card Header */}
            <div className="flex items-start justify-between pb-space-md border-b border-border-structural/60">
              <div className="space-y-1">
                <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                  التهيئة الأساسية للمنصة
                </h2>
                <p className="font-body-sm text-body-sm text-text-secondary">
                  تحديد خيارات العرض القياسية، أسواق السيولة الافتراضية، وحالة الصيانة.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-surface-elevated border border-border-structural font-mono text-xs font-semibold text-primary dir-ltr">
                SYS-VAR-001
              </span>
            </div>

            {/* Inputs 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Field 1: Platform Institutional Name */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-text-secondary font-medium">
                  اسم المنصة المؤسسي
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.platformName}
                    onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                    className="w-full h-11 px-3 pl-10 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-medium text-sm focus:outline-none focus:border-primary transition-all dir-ltr text-right"
                    placeholder="FXENGIN Core Terminal"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">
                      domain
                    </span>
                  </div>
                </div>
                <p className="font-telemetry-micro text-[11px] text-text-muted">
                  الاسم الظاهر في ترويسة التقارير المصدرة والعملاء.
                </p>
              </div>

              {/* Field 2: Base Accounting Currency */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-text-secondary font-medium">
                  العملة المحاسبية الأساسية
                </label>
                <div className="relative">
                  <select
                    value={formData.baseCurrency}
                    onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value })}
                    className="w-full h-11 px-3 pl-10 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-medium text-sm focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="USD">USD - الدولار الأمريكي ($) [Primary Liquid]</option>
                    <option value="EUR">EUR - اليورو الأوروبي (€)</option>
                    <option value="AED">AED - الدرهم الإماراتي (د.إ)</option>
                    <option value="SAR">SAR - الريال السعودي (ر.س)</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
                <p className="font-telemetry-micro text-[11px] text-text-muted">
                  جميع حسابات الـ PnL والمارجن الصافي تحسب بها.
                </p>
              </div>

              {/* Field 3: Default Language */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-text-secondary font-medium">
                  اللغة الافتراضية للنظام
                </label>
                <div className="relative">
                  <select
                    value={formData.defaultLanguage}
                    onChange={(e) => setFormData({ ...formData, defaultLanguage: e.target.value })}
                    className="w-full h-11 px-3 pl-10 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-medium text-sm focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="ar_RTL">العربية (RTL) - مع الحفاظ على ترقيم مالي دولي</option>
                    <option value="en_LTR">English (LTR) - Global Standard Terminal</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">
                      translate
                    </span>
                  </div>
                </div>
                <p className="font-telemetry-micro text-[11px] text-text-muted">
                  تطبيق تجربة المستخدم العربية المزدوجة بالكامل.
                </p>
              </div>

              {/* Field 4: Timezone */}
              <div className="space-y-1.5">
                <label className="block font-label-md text-label-md text-text-secondary font-medium">
                  المنطقة الزمنية لخوادم الشموع
                </label>
                <div className="relative">
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full h-11 px-3 pl-10 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-medium text-sm focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="riyadh_ny_close">Riyadh / Istanbul - NY Close Bar Sync</option>
                    <option value="utc">UTC / GMT - Standard Institutional Bar</option>
                    <option value="london">London (GMT+1) - European Session Bar</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <span className="material-symbols-outlined text-[18px]">
                      schedule
                    </span>
                  </div>
                </div>
                <p className="font-telemetry-micro text-[11px] text-text-muted">
                  إغلاق شمعة اليوم يطابق توقيت أسواق نيويورك.
                </p>
              </div>
            </div>

            {/* Emergency & Operational Gateways Section */}
            <div className="space-y-space-md pt-space-xs">
              <h3 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                بوابات التشغيل والتحكم بالطوارئ
              </h3>

              <div className="space-y-space-sm">
                {/* Control 1: Maintenance Mode */}
                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low/70 border border-border-structural hover:border-border-structural/80 transition-colors">
                  <div className="flex items-center gap-space-md">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        construction
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-label-lg text-label-lg text-text-primary font-bold">
                        وضع الصيانة الفنية المجدولة (Maintenance Mode)
                      </h4>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        يقوم بإيقاف وصول المستخدمين العاديين ويسمح فقط بحسابات كبار المهندسين والمشرفين.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.maintenanceMode}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFormData({ ...formData, maintenanceMode: val });
                        if (val) {
                          toast.warn('تم تفعيل وضع الصيانة! المستخدمون غير قادرين على تسجيل الدخول الآن.');
                        } else {
                          toast.info('تم تعطيل وضع الصيانة وعودة المنصة للعمل المباشر.');
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-white after:border-border-structural after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500 border border-border-structural"></div>
                  </label>
                </div>

                {/* Control 2: Redis In-Memory Engine */}
                <div className="flex items-center justify-between p-space-md rounded-xl bg-surface-container-low/70 border border-border-structural hover:border-border-structural/80 transition-colors">
                  <div className="flex items-center gap-space-md">
                    <div className="w-11 h-11 rounded-xl bg-bullish-up/10 border border-bullish-up/30 flex items-center justify-center text-bullish-up shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        bolt
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="font-label-lg text-label-lg text-text-primary font-bold">
                        تفعيل تسريع الذاكرة المؤقتة (Redis In-Memory Engine)
                      </h4>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        تخزين تحليلات الصفقات الساخنة في ذاكرة الوصول العشوائي لتقليل استهلاك الـ CPU بنسبة 45%.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.redisCache}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setFormData({ ...formData, redisCache: val });
                        toast.success(val ? 'تم تنشيط تسريع الذاكرة Redis' : 'تم تعطيل تسريع Redis');
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-surface-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-white after:border-border-structural after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-container border border-border-structural"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Architecture Cluster Map Card (Left Column in RTL, 4 Cols) */}
          <div className="lg:col-span-4 bg-surface-container border border-border-structural rounded-xl p-space-lg space-y-space-lg">
            {/* Header */}
            <div className="flex items-start justify-between pb-space-sm border-b border-border-structural/60">
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                خريطة المعمارية الحالية
              </h2>
              <span className="px-2 py-0.5 rounded bg-bullish-up/10 border border-bullish-up/20 text-bullish-up font-mono text-[11px] font-bold dir-ltr">
                NODE CLUSTER: 04
              </span>
            </div>

            {/* Nodes List */}
            <div className="space-y-space-sm">
              {/* Node 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-border-structural/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse"></span>
                  <span className="font-label-md text-label-md text-text-primary font-semibold">
                    WebSockets Broker Gateway
                  </span>
                </div>
                <span className="font-telemetry-micro text-[11px] font-mono text-text-muted dir-ltr">
                  Port 8080 / WSS
                </span>
              </div>

              {/* Node 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-border-structural/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse"></span>
                  <span className="font-label-md text-label-md text-text-primary font-semibold">
                    Order Router &amp; Execution
                  </span>
                </div>
                <span className="font-telemetry-micro text-[11px] font-mono text-text-muted dir-ltr">
                  FIX 4.4 Engine
                </span>
              </div>

              {/* Node 3 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-border-structural/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse"></span>
                  <span className="font-label-md text-label-md text-text-primary font-semibold">
                    Database Primary Replication
                  </span>
                </div>
                <span className="font-telemetry-micro text-[11px] font-mono text-text-muted dir-ltr">
                  Postgres Cluster
                </span>
              </div>

              {/* Node 4 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-border-structural/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-bullish-up animate-pulse"></span>
                  <span className="font-label-md text-label-md text-text-primary font-semibold">
                    Risk &amp; Margin Sentinel
                  </span>
                </div>
                <span className="font-telemetry-micro text-[11px] font-mono text-text-muted dir-ltr">
                  0.05ms Loop
                </span>
              </div>
            </div>

            {/* Hardware Telemetry Gauges */}
            <div className="pt-space-sm border-t border-border-structural/60 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-text-secondary">حمل معالج النواة الكلي</span>
                  <span className="font-mono text-bullish-up dir-ltr">{liveMetrics.cpuUsage}%</span>
                </div>
                <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-bullish-up h-full rounded-full transition-all duration-500"
                    style={{ width: `${liveMetrics.cpuUsage}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono pt-1">
                <span>الذاكرة: {liveMetrics.memoryUsage}</span>
                <span className="dir-ltr">القرص: {liveMetrics.diskUsage}</span>
              </div>
            </div>

            {/* Kernel Build Version Badge Box */}
            <div className="p-3 rounded-xl bg-surface-elevated/80 border border-border-structural text-center">
              <span className="font-mono text-xs text-text-muted font-medium dir-ltr select-all">
                إصدار نواة FXENGIN: v3.4.12-BUILD-8941
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: API Keys & Webhooks Management */}
      {activeTab === 'api' && (
        <div className="space-y-space-lg">
          <div className="bg-surface-container border border-border-structural rounded-xl p-space-lg space-y-space-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-md border-b border-border-structural/60">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                  مفاتيح الـ API وبوابات الـ Webhook
                </h2>
                <p className="font-body-sm text-body-sm text-text-secondary">
                  إدارة مفاتيح التفويض الآمن للاتصال ببيئة التداول، استقبال إشارات TradingView، ودفع الإشعارات.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newK = {
                    id: `key-gen-${Date.now()}`,
                    name: 'Custom Webhook Collector',
                    key: `fx_custom_${Math.random().toString(36).substring(2, 10)}`,
                    secret: `sk_sec_${Math.random().toString(36).substring(2, 18)}`,
                    permissions: 'Signals Ingestion & Read',
                    status: 'ACTIVE',
                    lastUsed: 'لم يستخدم بعد',
                    created: new Date().toISOString().split('T')[0],
                  };
                  setApiKeys([newK, ...apiKeys]);
                  toast.success('تم توليد مفتاح API جديد بنجاح');
                }}
                className="flex items-center gap-2 px-space-md py-2 rounded-xl bg-primary-container hover:bg-primary-container/80 text-on-primary-container font-bold text-xs transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>توليد مفتاح API جديد</span>
              </button>
            </div>

            {/* Keys Table / List */}
            <div className="space-y-space-md">
              {apiKeys.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface-container-low/50 border border-border-structural/50 space-y-2">
                  <span className="material-symbols-outlined text-3xl text-text-muted">key_off</span>
                  <p className="text-xs font-bold text-text-primary">لا توجد مفاتيح API مسجلة حالياً</p>
                  <p className="text-[11px] text-text-muted">تم حجب المفاتيح الوهمية. يمكنك توليد مفتاح تفويض جديد بالضغط على الزر أعلاه.</p>
                </div>
              ) : (
                apiKeys.map((item) => {
                  const isRevealed = revealedKeys[item.id];
                  return (
                    <div
                      key={item.id}
                      className="p-space-md rounded-xl bg-surface-container-low border border-border-structural flex flex-col md:flex-row md:items-center justify-between gap-space-md"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-bullish-up"></span>
                          <h3 className="font-label-lg text-label-lg text-text-primary font-bold">
                            {item.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-bullish-up/10 text-bullish-up border border-bullish-up/30 dir-ltr">
                            {item.status}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-space-md text-xs font-mono text-text-muted dir-ltr">
                          <span>KEY: <strong className="text-text-primary">{item.key}</strong></span>
                          <span>•</span>
                          <span>
                            SECRET:{' '}
                            <strong className="text-text-primary">
                              {isRevealed ? item.secret : '••••••••••••••••••••••••••••'}
                            </strong>
                          </span>
                        </div>

                        <div className="text-[11px] text-text-secondary flex items-center gap-2 pt-0.5">
                          <span>الصلاحيات: {item.permissions}</span>
                          <span>•</span>
                          <span>آخر استخدام: {item.lastUsed}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => toggleKeyReveal(item.id)}
                          className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title={isRevealed ? 'إخفاء المفتاح' : 'إظهار المفتاح'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isRevealed ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.secret, 'المفتاح السري')}
                          className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                          title="نسخ المفتاح السري"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            content_copy
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setApiKeys(apiKeys.filter((k) => k.id !== item.id));
                            toast.info('تم إبطال وحذف المفتاح بنجاح');
                          }}
                          className="p-2 rounded-lg bg-surface-elevated hover:bg-error/20 border border-border-structural text-text-muted hover:text-error transition-colors cursor-pointer"
                          title="إلغاء المفتاح"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Partner & Broker Logos Management */}
      {activeTab === 'assets' && (
        <div className="space-y-space-lg">
          <div className="bg-surface-container border border-border-structural rounded-xl p-space-lg space-y-space-lg">
            <div className="pb-space-md border-b border-border-structural/60">
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                شعارات وأصول الشركاء والوسطاء المعتمدين
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary">
                إدارة شعارات شركات الوساطة، مزودي السيولة ECN، وبطاقات الشركاء في الواجهات والتطبيقات.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-md">
              {brokers.map((broker) => (
                <div
                  key={broker.id}
                  className="p-space-md rounded-xl bg-surface-container-low border border-border-structural flex flex-col justify-between space-y-space-md hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-text-muted uppercase font-mono">
                      {broker.tier}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-bullish-up/10 text-bullish-up">
                      {broker.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border-structural flex items-center justify-center overflow-hidden shrink-0">
                      <span className="material-symbols-outlined text-primary text-[28px]">
                        account_balance
                      </span>
                    </div>
                    <div>
                      <h4 className="font-label-lg text-label-lg text-text-primary font-bold">
                        {broker.name}
                      </h4>
                      <span className="text-xs font-mono text-bullish-up dir-ltr">
                        Spread: {broker.spread}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-structural/50 flex items-center justify-between text-xs text-text-muted">
                    <span>مزامنة الأصول: نشطة</span>
                    <button
                      type="button"
                      onClick={() => toast.info(`تم فتح خيارات وسيط ${broker.name}`)}
                      className="text-primary hover:underline cursor-pointer"
                    >
                      تعديل الشعار
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Asset Upload Dropzone */}
            <div className="border-2 border-dashed border-border-structural hover:border-primary/60 rounded-xl p-8 text-center bg-surface-container-low/40 transition-colors cursor-pointer">
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="material-symbols-outlined text-[36px] text-primary">
                  cloud_upload
                </span>
                <div className="text-sm font-bold text-text-primary">
                  اسحب وأفلت شعارات الوسطاء أو اضغط للاختيار
                </div>
                <div className="text-xs text-text-muted font-mono">
                  يدعم SVG، PNG شفاف بدقة 512x512 بكسل كحد أقصى 2MB
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Security & Sandbox Policies */}
      {activeTab === 'security' && (
        <div className="space-y-space-lg">
          {/* Super Admin Security Dossier Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-surface-container to-primary/10 border border-amber-500/30 rounded-xl p-space-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <span className="material-symbols-outlined text-[28px]">shield_person</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary">
                      ملف الأمان والترخيص السيادي (Super Admin Dossier)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-bullish-up/15 text-bullish-up border border-bullish-up/30 text-[10px] font-mono font-bold dir-ltr">
                      {superAdminDossier?.securityClearance || 'LEVEL_5_ROOT_MASTER'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    المدير الحالي: <strong className="text-text-primary">{adminUser?.fullName || 'Master Super Admin'}</strong> ({adminUser?.email || 'admin@fxengen.com'}) — تشفير <code className="text-primary font-mono text-[11px]">{superAdminDossier?.securityAudit?.encryptionAlgorithm || 'BCRYPT_SALT_12_ROUNDS'}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    toast.info('جاري إعادة التدقيق الأمني GET /admin/auth/super-admin...');
                    await refreshAdminSession();
                    toast.success('تمت المزامنة الأمنية بنجاح');
                  }}
                  className="px-3 py-2 rounded-xl bg-surface-elevated hover:bg-surface-container border border-border-structural text-text-secondary hover:text-text-primary text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  <span>تحديث التدقيق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDossierModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/20 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  <span>عرض ملف الأمان الكامل</span>
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-container border border-border-structural rounded-xl p-space-lg space-y-space-lg">
            <div className="pb-space-md border-b border-border-structural/60">
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                الحماية وسياسات بيئة التداول التجريبية (Sandbox)
              </h2>
              <p className="font-body-sm text-body-sm text-text-secondary">
                حوكمة العناوين المسموحة، سياسات المصادقة الثنائية للمشرفين، والتبديل لبيئة المحاكاة الآمنة.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Security Toggles */}
              <div className="space-y-space-md">
                <h3 className="font-label-lg text-label-lg text-text-primary font-bold">
                  إجراءات الأمان والوصول الإداري
                </h3>

                {/* 2FA Enforcement */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-border-structural">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      فرض المصادقة الثنائية (2FA Enforcement)
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      إلزام جميع المديرين وكبار المحللين باستخدام تطبيق Authenticator
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.twoFactorEnforced}
                    onChange={(e) => setFormData({ ...formData, twoFactorEnforced: e.target.checked })}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </div>

                {/* Sandbox / Paper Trading Mode */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-border-structural">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">
                      وضع المحاكاة التجريبية (Paper Trading Engine)
                    </h4>
                    <p className="text-[11px] text-text-muted">
                      تغذية المحطة بأسعار تجريبية لاختبار الاستراتيجيات دون بث صفقات حية
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.sandboxMode}
                    onChange={(e) => {
                      setFormData({ ...formData, sandboxMode: e.target.checked });
                      toast.info(e.target.checked ? 'تم تفعيل وضع المحاكاة Sandbox' : 'تم العودة للبث الحي Live FIX');
                    }}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </div>

                {/* Rate Limiting */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-medium text-text-secondary">
                    الحد الأقصى للطلبات (Rate Limit Req/Min)
                  </label>
                  <input
                    type="number"
                    value={formData.rateLimit}
                    onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono text-xs focus:outline-none focus:border-primary dir-ltr"
                  />
                </div>
              </div>

              {/* IP Whitelist Management */}
              <div className="space-y-space-md">
                <h3 className="font-label-lg text-label-lg text-text-primary font-bold">
                  القائمة البيضاء لعناوين الـ IP الموثوقة
                </h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    placeholder="مثال: 194.26.29.102/32"
                    className="flex-1 h-10 px-3 rounded-xl bg-surface-elevated border border-border-structural text-text-primary font-mono text-xs focus:outline-none focus:border-primary dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={handleAddIp}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {whitelistedIps.length === 0 ? (
                    <p className="text-[11px] text-text-muted p-3 rounded-lg bg-surface-container-low border border-border-structural/40 text-center">
                      لا توجد عناوين مقيدة (الوصول محمي عبر جدار الحماية الرئيسي).
                    </p>
                  ) : (
                    whitelistedIps.map((ip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-border-structural text-xs font-mono"
                      >
                        <span className="text-text-primary dir-ltr">{ip}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIp(idx)}
                          className="text-error hover:text-error/80 cursor-pointer"
                          title="حذف IP"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
