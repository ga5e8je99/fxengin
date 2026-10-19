'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { fetchMarketRates, subscribeToRatesStream } from '../services/ratesService';

const INITIAL_PAIRS = [
  { pair: 'XAU/USD', price: '4,284.55', change: '+0.22%', pos: true },
  { pair: 'XAG/USD', price: '64.29',    change: '+0.72%', pos: true },
  { pair: 'EUR/USD', price: '1.13889',  change: '+0.11%', pos: true },
  { pair: 'GBP/USD', price: '1.32400',  change: '+0.23%', pos: true },
  { pair: 'USD/JPY', price: '157.185',  change: '-1.01%', pos: false },
  { pair: 'USD/CAD', price: '1.41410',  change: '+0.01%', pos: true },
  { pair: 'USD/CHF', price: '0.82795',  change: '+0.09%', pos: true },
  { pair: 'AUD/USD', price: '0.70230',  change: '+0.18%', pos: true },
  { pair: 'EUR/JPY', price: '179.108',  change: '-0.84%', pos: false },
  { pair: 'GBP/JPY', price: '208.275',  change: '-0.73%', pos: false },
  { pair: 'AUD/JPY', price: '110.434',  change: '-0.77%', pos: false },
  { pair: 'CAD/JPY', price: '111.155',  change: '-1.01%', pos: false },
  { pair: 'CHF/JPY', price: '189.854',  change: '-0.89%', pos: false },
  { pair: 'BTC/USD', price: '83,946.50', change: '-0.18%', pos: false },
  { pair: 'ETH/USD', price: '2,686.84',  change: '-0.18%', pos: false },
];

function getPairIcon(pair) {
  const clean = (pair || '').replace('/', '').toUpperCase();
  if (clean.includes('XAU') || clean.includes('GOLD')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '17px',
        height: '17px',
        borderRadius: '3px',
        background: 'linear-gradient(135deg, #FFE066 0%, #FB8704 100%)',
        fontSize: '10px',
        color: '#1a0d00',
        fontWeight: 900,
        boxShadow: '0 0 6px rgba(251, 135, 4, 0.45)',
        flexShrink: 0,
      }}>
        ✦
      </span>
    );
  }
  if (clean.includes('BTC')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '17px',
        height: '17px',
        borderRadius: '50%',
        background: '#F7931A',
        color: '#FFFFFF',
        fontSize: '10px',
        fontWeight: 900,
        flexShrink: 0,
      }}>
        ₿
      </span>
    );
  }
  if (clean.includes('ETH')) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '17px',
        height: '17px',
        borderRadius: '50%',
        background: '#627EEA',
        color: '#FFFFFF',
        fontSize: '10px',
        fontWeight: 800,
        flexShrink: 0,
      }}>
        Ξ
      </span>
    );
  }
  if (clean.startsWith('EUR')) return <span style={{ fontSize: '13px', lineHeight: 1 }}>🇪🇺</span>;
  if (clean.startsWith('GBP')) return <span style={{ fontSize: '13px', lineHeight: 1 }}>🇬🇧</span>;
  if (clean.startsWith('USD')) return <span style={{ fontSize: '13px', lineHeight: 1 }}>🇺🇸</span>;
  if (clean.startsWith('AUD')) return <span style={{ fontSize: '13px', lineHeight: 1 }}>🇦🇺</span>;
  if (clean.startsWith('CAD')) return <span style={{ fontSize: '13px', lineHeight: 1 }}>🇨🇦</span>;
  if (clean.startsWith('CHF')) return <span style={{ fontSize: '13px', lineHeight: 1 }}>🇨🇭</span>;
  return null;
}

function TickerItem({ pair, price, change, pos }) {
  const [flash, setFlash] = useState(null);
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (prevPriceRef.current && prevPriceRef.current !== price) {
      const numOld = parseFloat(String(prevPriceRef.current).replace(/,/g, ''));
      const numNew = parseFloat(String(price).replace(/,/g, ''));
      if (!isNaN(numOld) && !isNaN(numNew) && numOld !== numNew) {
        setFlash(numNew > numOld ? 'up' : 'down');
        const timer = setTimeout(() => setFlash(null), 900);
        return () => clearTimeout(timer);
      }
    }
    prevPriceRef.current = price;
  }, [price]);

  const displaySymbol = (pair || '').replace('/', '');
  const icon = getPairIcon(pair);

  return (
    <Link
      href="/markets"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        padding: '0 1.25rem',
        whiteSpace: 'nowrap',
        borderLeft: '1px solid rgba(18, 49, 92, 0.45)',
        flexShrink: 0,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
        {displaySymbol}
      </span>
      <span
        style={{
          fontSize: '0.8125rem',
          fontFamily: 'monospace',
          fontWeight: 700,
          color: flash === 'up' ? '#00E676' : flash === 'down' ? '#F6465D' : 'var(--text-primary)',
          background: flash === 'up' ? 'rgba(0, 230, 118, 0.18)' : flash === 'down' ? 'rgba(246, 70, 93, 0.18)' : 'transparent',
          borderRadius: '4px',
          padding: '1px 5px',
          transition: 'all 0.2s ease',
        }}
      >
        {price}
      </span>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: pos ? 'var(--success)' : 'var(--error)',
          background: pos ? 'rgba(22, 199, 132, 0.12)' : 'rgba(246, 70, 93, 0.12)',
          boxShadow: 'none',
          padding: '0.125rem 0.375rem',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}
      >
        {pos ? '▲' : '▼'} {change}
      </span>
    </Link>
  );
}

export default function TickerBar() {
  const [rates, setRates] = useState(INITIAL_PAIRS);

  useEffect(() => {
    let isMounted = true;

    let lastUpdate = Date.now();

    const syncRates = (data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const hasLivePrices = data.some((item) => Math.abs(Number(item.change24h || 0)) > 0.0001);
        if (!hasLivePrices) {
          return false;
        }
        const mapped = data.map((item) => ({
          pair: item.symbol,
          price: item.priceFormatted,
          change: item.changeFormatted,
          pos: item.pos,
        }));
        setRates(mapped);
        lastUpdate = Date.now();
        return true;
      }
      return false;
    };

    // 1. Initial snapshot fetch
    fetchMarketRates().then((res) => {
      if (res.success && syncRates(res.data)) {
        lastUpdate = Date.now();
      }
    }).catch(() => {});

    // 2. Real-time live rate streaming (SSE pushes every 2s)
    const unsubscribe = subscribeToRatesStream(
      (streamRates) => {
        syncRates(streamRates);
      },
      (err) => {
        // SSE connection info/reconnecting
      }
    );

    // 3. Silent watchdog: only fetch if stream has been silent for > 15s
    const watchdogTimer = setInterval(async () => {
      if (!isMounted) return;
      if (Date.now() - lastUpdate > 15000) {
        try {
          const res = await fetchMarketRates();
          if (res.success) syncRates(res.data);
        } catch {
          // silent
        }
      }
    }, 10000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(watchdogTimer);
    };
  }, []);

  const displayList = rates.length > 0 ? rates : INITIAL_PAIRS;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'var(--header-height, 4.5rem)',
        insetInline: 0,
        zIndex: 90,
        background: 'rgba(0, 3, 13, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        boxShadow: 'none',
        height: 'var(--ticker-height, 2.75rem)',
        overflow: 'hidden',
        width: '100%',
        direction: 'ltr',
      }}
    >
      {/* Left/Right fade overlays */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '3.75rem',
          background: 'linear-gradient(to left, var(--bg-dark), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '3.75rem',
          background: 'linear-gradient(to right, var(--bg-dark), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Infinite Seamless Marquee */}
      <div
        className="ticker-marquee-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          width: 'max-content',
        }}
      >
        <div className="ticker-group" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {displayList.map((item, i) => (
            <TickerItem key={`a-${item.pair}-${i}`} {...item} />
          ))}
        </div>
        <div className="ticker-group" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
          {displayList.map((item, i) => (
            <TickerItem key={`b-${item.pair}-${i}`} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
