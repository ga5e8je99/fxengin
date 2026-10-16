'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, AreaSeries, ColorType } from 'lightweight-charts';
import { fetchMarketRates } from '../services/ratesService';

// Default baseline market instruments
const INSTRUMENT_META = {
  EURUSD: {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    nameAr: 'اليورو / دولار أمريكي',
    precision: 4,
    minMove: 0.0001,
    basePrice: 1.0845,
    spread: '0.2',
    volatility: 0.0008,
  },
  XAUUSD: {
    symbol: 'XAU/USD',
    name: 'Gold / US Dollar',
    nameAr: 'الذهب مقابل الدولار',
    precision: 2,
    minMove: 0.01,
    basePrice: 2654.50,
    spread: '0.9',
    volatility: 3.5,
  },
  GBPUSD: {
    symbol: 'GBP/USD',
    name: 'British Pound / US Dollar',
    nameAr: 'الجنيه الإسترليني / دولار',
    precision: 4,
    minMove: 0.0001,
    basePrice: 1.3062,
    spread: '0.4',
    volatility: 0.0011,
  },
  BTCUSD: {
    symbol: 'BTC/USD',
    name: 'Bitcoin / US Dollar',
    nameAr: 'البيتكوين مقابل الدولار',
    precision: 2,
    minMove: 0.01,
    basePrice: 64280.00,
    spread: '1.5',
    volatility: 120.0,
  },
};

/**
 * Generate synthetic realistic financial time-series for smooth presentation
 */
function generateHistoricalData(instId, targetPrice, pointsCount = 45) {
  const meta = INSTRUMENT_META[instId] || INSTRUMENT_META.EURUSD;
  const currentPrice = targetPrice || meta.basePrice;
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  const intervalSeconds = 3600 * 4; // 4-hour candles/points

  let price = currentPrice * 0.978; // start slightly below for realistic organic uptrend/action
  const seedMultiplier = instId === 'XAUUSD' ? 2.5 : instId === 'BTCUSD' ? 85 : 0.0007;

  for (let i = pointsCount - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    // Controlled mean-reverting random walk towards target price
    const progress = (pointsCount - 1 - i) / (pointsCount - 1);
    const targetAtStep = price + (currentPrice - price) * (0.08 + progress * 0.15);
    const noise = (Math.sin(i * 0.7) * 0.6 + Math.cos(i * 1.3) * 0.4) * seedMultiplier;
    price = targetAtStep + noise;

    if (i === 0) {
      price = currentPrice;
    }

    data.push({
      time,
      value: parseFloat(price.toFixed(meta.precision)),
    });
  }

  return data;
}

export default function FXEngineChart({
  selectedId = 'EURUSD',
  isAr = true,
  height = 230,
}) {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);

  const [livePrice, setLivePrice] = useState(null);
  const [change24h, setChange24h] = useState(0.42);
  const [priceFlash, setPriceFlash] = useState(null); // 'up' | 'down' | null
  const [activeTimeframe, setActiveTimeframe] = useState('1M');
  const [liveRatesCache, setLiveRatesCache] = useState({});

  const meta = useMemo(() => INSTRUMENT_META[selectedId] || INSTRUMENT_META.EURUSD, [selectedId]);

  // Fetch real market rates from platform backend or scanner
  useEffect(() => {
    let isMounted = true;

    async function loadRates() {
      try {
        const res = await fetchMarketRates();
        if (res && res.data && Array.isArray(res.data) && isMounted) {
          const cache = {};
          res.data.forEach((item) => {
            const sym = (item.symbol || '').replace('/', '').toUpperCase();
            cache[sym] = item;
          });
          setLiveRatesCache(cache);

          const matching = cache[selectedId];
          if (matching && matching.price) {
            setLivePrice(matching.price);
            if (typeof matching.change24h === 'number') {
              setChange24h(matching.change24h);
            }
          }
        }
      } catch (err) {
        // Fallback gracefully to meta baseline
        if (isMounted && !livePrice) {
          setLivePrice(meta.basePrice);
        }
      }
    }

    loadRates();
    const interval = setInterval(loadRates, 25000); // sync with market every 25s

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedId, meta.basePrice]);

  // Update live price when instrument changes
  useEffect(() => {
    const rateItem = liveRatesCache[selectedId];
    if (rateItem && rateItem.price) {
      setLivePrice(rateItem.price);
      if (typeof rateItem.change24h === 'number') {
        setChange24h(rateItem.change24h);
      }
    } else {
      setLivePrice(meta.basePrice);
    }
  }, [selectedId, liveRatesCache, meta.basePrice]);

  // Initialize and manage the lightweight-charts instance
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Clear previous elements
    container.innerHTML = '';

    const isPositive = change24h >= 0;
    const themeColor = isPositive ? '#00F0FF' : '#F6465D';
    const areaTopColor = isPositive ? 'rgba(0, 240, 255, 0.28)' : 'rgba(246, 70, 93, 0.28)';
    const areaBottomColor = isPositive ? 'rgba(0, 240, 255, 0.00)' : 'rgba(246, 70, 93, 0.00)';

    const chart = createChart(container, {
      width: container.clientWidth || 400,
      height: height,
      layout: {
        attributionLogo: false,
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6882A6',
        fontFamily: 'monospace, system-ui, -apple-system, sans-serif',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(18, 49, 92, 0.25)', style: 1 },
        horzLines: { color: 'rgba(18, 49, 92, 0.25)', style: 1 },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(0, 240, 255, 0.45)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0A1B3D',
        },
        horzLine: {
          color: 'rgba(0, 240, 255, 0.45)',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0A1B3D',
        },
      },
      timeScale: {
        borderColor: 'rgba(18, 49, 92, 0.35)',
        timeVisible: true,
        secondsVisible: false,
        borderVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(18, 49, 92, 0.35)',
        borderVisible: true,
        scaleMargins: {
          top: 0.12,
          bottom: 0.12,
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: themeColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: meta.precision,
        minMove: meta.minMove,
      },
    });

    const pointsCount = activeTimeframe === '1D' ? 24 : activeTimeframe === '1W' ? 36 : 48;
    const initialData = generateHistoricalData(selectedId, livePrice || meta.basePrice, pointsCount);
    series.setData(initialData);
    chart.timeScale().fitContent();

    chartInstanceRef.current = chart;
    seriesRef.current = series;

    // Aggressively purge any TradingView attribution logo from container
    const purgeAttrLogo = () => {
      if (!container) return;
      const logos = container.querySelectorAll('#tv-attr-logo, a[href*="tradingview"], a[title*="TradingView"]');
      logos.forEach((el) => el.remove());
    };
    purgeAttrLogo();
    const logoTimer1 = setTimeout(purgeAttrLogo, 40);
    const logoTimer2 = setTimeout(purgeAttrLogo, 200);

    // Responsive auto-resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries.length) return;
      const { width: newWidth } = entries[0].contentRect;
      if (newWidth > 0) {
        chart.applyOptions({ width: newWidth });
        chart.timeScale().fitContent();
        purgeAttrLogo();
      }
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(logoTimer1);
      clearTimeout(logoTimer2);
      resizeObserver.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
      seriesRef.current = null;
    };
  }, [selectedId, activeTimeframe, height, meta.minMove, meta.precision]);

  // Realistic live micro-ticks simulation to give the chart an institutional "alive" heartbeat
  useEffect(() => {
    const tickInterval = setInterval(() => {
      if (!seriesRef.current) return;

      setLivePrice((prev) => {
        const current = prev || meta.basePrice;
        const tickDelta = (Math.random() - 0.49) * meta.volatility * 0.08;
        const nextPrice = parseFloat((current + tickDelta).toFixed(meta.precision));

        const isUp = nextPrice >= current;
        setPriceFlash(isUp ? 'up' : 'down');
        setTimeout(() => setPriceFlash(null), 600);

        try {
          const now = Math.floor(Date.now() / 1000);
          seriesRef.current.update({
            time: now,
            value: nextPrice,
          });
        } catch (e) {
          // ignore timestamp sequence edge cases
        }

        return nextPrice;
      });
    }, 1800);

    return () => clearInterval(tickInterval);
  }, [meta.basePrice, meta.precision, meta.volatility]);

  const displayPriceFormatted = livePrice
    ? livePrice.toLocaleString('en-US', {
        minimumFractionDigits: meta.precision,
        maximumFractionDigits: meta.precision,
      })
    : meta.basePrice.toFixed(meta.precision);

  const isPos = change24h >= 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: '#010514',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* ── Subdued Proprietary Engine Watermark ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '46%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(20px, 3.2vw, 34px)',
          fontWeight: 900,
          letterSpacing: '5px',
          color: 'rgba(0, 240, 255, 0.032)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          fontFamily: 'monospace',
          textTransform: 'uppercase',
          zIndex: 1,
        }}
      >
        FXENGIN CORE ENGINE
      </div>

      {/* ── Top Custom Header (Live Price, Change & Timeframe Pills) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 4px 10px 4px',
          borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
          marginBottom: '6px',
          direction: 'ltr',
          zIndex: 2,
        }}
      >
        {/* Left: Live Price & Ticker Flash */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  letterSpacing: '0.5px',
                  color:
                    priceFlash === 'up'
                      ? '#00E676'
                      : priceFlash === 'down'
                      ? '#F6465D'
                      : '#FFFFFF',
                  transition: 'color 0.25s ease',
                }}
              >
                {displayPriceFormatted}
              </span>

              {/* 24h Change Pill */}
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: isPos ? 'rgba(0, 230, 118, 0.12)' : 'rgba(246, 70, 93, 0.12)',
                  color: isPos ? '#00E676' : '#F6465D',
                  border: isPos
                    ? '1px solid rgba(0, 230, 118, 0.25)'
                    : '1px solid rgba(246, 70, 93, 0.25)',
                }}
              >
                {isPos ? '+' : ''}
                {typeof change24h === 'number' ? change24h.toFixed(2) : change24h}%
              </span>
            </div>

            <span
              style={{
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {isAr ? meta.nameAr : meta.name}
            </span>
          </div>
        </div>

        {/* Right: Timeframe Selector Pills */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(6, 20, 47, 0.6)', padding: '2px', borderRadius: '6px' }}>
          {['1D', '1W', '1M'].map((tf) => (
            <button
              key={tf}
              type="button"
              onClick={() => setActiveTimeframe(tf)}
              style={{
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: 'monospace',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: activeTimeframe === tf ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: activeTimeframe === tf ? '#00F0FF' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Native Canvas Chart Container (Zero TradingView Branding) ── */}
      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
          height: `${height}px`,
          minHeight: `${height}px`,
          position: 'relative',
          zIndex: 2,
        }}
      />

      {/* ── Suppress third-party attribution logo ── */}
      <style>{`
        #tv-attr-logo,
        a#tv-attr-logo,
        .tv-attr-logo,
        a[href*="tradingview.com"],
        a[title*="TradingView"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          z-index: -9999 !important;
        }
      `}</style>
    </div>
  );
}
