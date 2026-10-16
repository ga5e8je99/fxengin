'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Script from 'next/script';
import { fetchAdSenseConfig } from '../services/adsService';

const GoogleAdSenseContext = createContext({
  config: null,
  isEnabled: false,
  publisherId: '',
  slots: {},
});

export function GoogleAdSenseProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchAdSenseConfig()
      .then((data) => {
        if (isMounted && data) {
          setConfig(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const isEnabled = Boolean(config?.isEnabled && config?.publisherId);
  const publisherId = config?.publisherId || '';

  return (
    <GoogleAdSenseContext.Provider
      value={{
        config,
        isEnabled,
        publisherId,
        slots: {
          horizontal: config?.slotHorizontal,
          skyscraperRight: config?.slotRightBar,
          skyscraperLeft: config?.slotLeftBar,
          mobileTopBar: config?.slotMobileBar,
        },
      }}
    >
      {/* ── Official Google AdSense Client Script (Loaded only when enabled) ── */}
      {isEnabled && (
        <Script
          id="google-adsense-script"
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
            publisherId
          )}`}
          crossOrigin="anonymous"
          onLoad={() => setLoaded(true)}
          data-adtest={config?.testMode ? 'on' : undefined}
        />
      )}

      {children}
    </GoogleAdSenseContext.Provider>
  );
}

/**
 * Hook to access Google AdSense context
 */
export function useGoogleAdSense() {
  return useContext(GoogleAdSenseContext);
}

/**
 * Reusable Google AdSense Unit Component
 */
export function GoogleAdUnit({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = '',
}) {
  const { isEnabled, publisherId, config } = useGoogleAdSense();
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (!isEnabled || !publisherId || !slot) return;

    try {
      if (typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      setAdError(true);
    }
  }, [isEnabled, publisherId, slot]);

  if (!isEnabled || !publisherId || !slot || adError) {
    return null;
  }

  return (
    <div className={`google-ad-container overflow-hidden text-center my-2 ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
        data-adtest={config?.testMode ? 'on' : undefined}
      />
    </div>
  );
}

export default GoogleAdSenseProvider;
