'use client';

import React from 'react';

/**
 * PageHeroBackground Component
 * Renders an authentic FXENGIN-branded blurred trading cockpit/chart background
 * with dark vignettes and cyan/amber glow overlays.
 *
 * Can be used as a standalone background layer inside an existing <section>:
 *    <section style={{ position: 'relative', overflow: 'hidden' }}>
 *      <PageHeroBackground />
 *      <div className="container" style={{ position: 'relative', zIndex: 2 }}>...</div>
 *    </section>
 *
 * Or as a wrapper:
 *    <PageHeroBackground className="..." style={{ ... }}>
 *      <div className="container">...</div>
 *    </PageHeroBackground>
 */
export default function PageHeroBackground({
  children,
  className = '',
  style = {},
  imageSrc = '/assets/Images/Main/page-hero-bg.webp',
  blur = '16px',
  brightness = '0.34',
  saturate = '1.25',
  opacity = 0.85,
  accentGlow = 'rgba(4, 136, 248, 0.16)',
  warmGlow = 'rgba(251, 135, 4, 0.08)',
}) {
  const backgroundLayers = (
    <>
      {/* 1. Blurred Brand Identity Image Layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-20px',
          backgroundImage: `url('${imageSrc}')`,
          backgroundPosition: 'center 25%',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          filter: `blur(${blur}) brightness(${brightness}) saturate(${saturate})`,
          transform: 'scale(1.06)',
          opacity: opacity,
          pointerEvents: 'none',
          zIndex: 0,
          willChange: 'transform',
        }}
      />

      {/* 2. Cyber Blue Ambient Radial Glow (Top Center) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '1200px',
          height: '100%',
          background: `radial-gradient(ellipse 70% 65% at 50% 0%, ${accentGlow} 0%, transparent 75%)`,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 3. Warm Amber Side Flare Glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '15%',
          right: '5%',
          width: '380px',
          height: '380px',
          background: `radial-gradient(circle, ${warmGlow} 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* 4. Smooth Bottom and Surface Transition Vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to bottom, rgba(1, 7, 30, 0.45) 0%, rgba(1, 7, 30, 0.72) 65%, var(--bg-primary, #01071E) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
    </>
  );

  // If used as a standalone background layer inside an existing section
  if (!children) {
    return backgroundLayers;
  }

  // If used as a wrapper component
  return (
    <section
      className={`page-hero-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(18, 49, 92, 0.35)',
        ...style,
      }}
    >
      {backgroundLayers}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </section>
  );
}
