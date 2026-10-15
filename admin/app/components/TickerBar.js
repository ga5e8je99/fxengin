'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchDirectTradingViewRates } from '../services/ratesService';

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

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0 1.25rem',
        whiteSpace: 'nowrap',
        borderLeft: '1px solid rgba(18, 49, 92, 0.45)',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F5F7FA', letterSpacing: '0.02em' }}>
        {pair}
      </span>
      <span
        style={{
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: flash === 'up' ? '#16c784' : flash === 'down' ? '#f6465d' : '#A7AFBF',
          padding: '0 2px',
          transition: 'color 0.25s ease',
        }}
      >
        {price}
      </span>
      <span
        style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          color: pos ? '#16c784' : '#f6465d',
          background: pos ? 'rgba(22, 199, 132, 0.12)' : 'rgba(246, 70, 93, 0.12)',
          padding: '0.1rem 0.35rem',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.15rem',
        }}
      >
        {pos ? '▲' : '▼'} {change}
      </span>
    </div>
  );
}

export default function TickerBar() {
  const [rates, setRates] = useState(INITIAL_PAIRS);

  useEffect(() => {
    let isMounted = true;

    const syncRates = (data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        const hasLivePrices = data.some((item) => Math.abs(Number(item.change24h || 0)) > 0.0001);
        if (!hasLivePrices) return false;
        const mapped = data.map((item) => ({
          pair: item.symbol,
          price: item.priceFormatted,
          change: item.changeFormatted,
          pos: item.pos,
        }));
        setRates(mapped);
        return true;
      }
      return false;
    };

    // Initial fetch
    fetchDirectTradingViewRates().then((tvData) => syncRates(tvData));

    // Heartbeat sync every 15s to keep rates fresh without flooding
    const heartbeatTimer = setInterval(async () => {
      if (!isMounted) return;
      try {
        const tvData = await fetchDirectTradingViewRates();
        syncRates(tvData);
      } catch {}
    }, 15000);

    return () => {
      isMounted = false;
      clearInterval(heartbeatTimer);
    };
  }, []);

  const displayList = rates.length > 0 ? rates : INITIAL_PAIRS;

  return (
    <div
      style={{
        position: 'relative',
        height: '1.75rem', // 28px (matching h-7)
        background: '#00030D',
        borderBottom: '1px solid rgba(18, 49, 92, 0.6)',
        overflow: 'hidden',
        width: '100%',
        direction: 'ltr',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Left/Right subtle fade overlays */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '2.5rem',
          background: 'linear-gradient(to left, #00030D, transparent)',
          zIndex: 3,
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
          width: '2.5rem',
          background: 'linear-gradient(to right, #00030D, transparent)',
          zIndex: 3,
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
            <TickerItem key={`adm-a-${item.pair}-${i}`} {...item} />
          ))}
        </div>
        <div className="ticker-group" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
          {displayList.map((item, i) => (
            <TickerItem key={`adm-b-${item.pair}-${i}`} {...item} />
          ))}
        </div>
      </div>
    </div>
  );
}
