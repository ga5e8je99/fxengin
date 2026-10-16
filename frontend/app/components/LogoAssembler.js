'use client';
import { useState } from 'react';
import Image from 'next/image';
import styles from './LogoAssembler.module.css';

export default function LogoAssembler({
  width = 96,
  height = 96,
  className = '',
  onClick,
}) {
  const [animationKey, setAnimationKey] = useState(0);

  // Re-trigger assembly animation on click
  const handleReassemble = (e) => {
    setAnimationKey((prev) => prev + 1);
    if (onClick) onClick(e);
  };

  return (
    <div
      key={animationKey}
      onClick={handleReassemble}
      title="FXENGIN Core Brand"
      className={`${styles.assemblerRoot} ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <div className={styles.stageWrapper}>
        {/* Layer 1: Vector Animation Stage (Shield + Rising Bars + Laser Trend + Data Nodes) */}
        <svg
          viewBox="0 0 100 100"
          className={styles.vectorStage}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Orange Bars Gradient */}
            <linearGradient id="fxOrangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFA41C" />
              <stop offset="50%" stopColor="#FB8704" />
              <stop offset="100%" stopColor="#FA5A04" />
            </linearGradient>

            {/* Blue Shield Gradient */}
            <linearGradient id="fxShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="40%" stopColor="#0488F8" />
              <stop offset="100%" stopColor="#0356C7" />
            </linearGradient>

            {/* Cyan Laser Trend Gradient */}
            <linearGradient id="fxTrendGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="60%" stopColor="#0488F8" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {/* 1. Hexagonal Blue Shield Frame */}
          <g className={styles.shieldFrame}>
            <path
              d="M 50 94 L 20 74 L 14 38 L 22 34 L 26 66 L 50 82 L 74 66 L 78 34 L 86 38 L 80 74 Z"
              fill="url(#fxShieldGrad)"
            />
          </g>

          {/* 2. Three Ascending Financial Trend Bars */}
          <g className={styles.barLeft}>
            <path
              d="M 28 35 L 40 23 L 40 60 C 40 62 38 64 36 64 L 32 64 C 30 64 28 62 28 60 Z"
              fill="url(#fxOrangeGrad)"
            />
          </g>
          <g className={styles.barCenter}>
            <path
              d="M 44 17 L 56 5 L 56 70 C 56 72 54 74 52 74 L 48 74 C 46 74 44 72 44 70 Z"
              fill="url(#fxOrangeGrad)"
            />
          </g>
          <g className={styles.barRight}>
            <path
              d="M 60 12 L 72 1 L 72 60 C 72 62 70 64 68 64 L 64 64 C 62 64 60 62 60 60 Z"
              fill="url(#fxOrangeGrad)"
            />
          </g>

          {/* 3. Dynamic Laser Trend Line */}
          <path
            d="M 8 74 L 32 62 L 50 76 L 66 62 L 92 48"
            stroke="url(#fxTrendGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.trendLinePath}
          />

          {/* 4. Glowing Data Node Points */}
          <circle cx="8" cy="74" r="5" fill="#080E1C" stroke="#00F0FF" strokeWidth="3" className={`${styles.nodePoint} ${styles.node1}`} />
          <circle cx="32" cy="62" r="5" fill="#080E1C" stroke="#00F0FF" strokeWidth="3" className={`${styles.nodePoint} ${styles.node2}`} />
          <circle cx="50" cy="76" r="5.5" fill="#080E1C" stroke="#00F0FF" strokeWidth="3" className={`${styles.nodePoint} ${styles.node3}`} />
          <circle cx="66" cy="62" r="5" fill="#080E1C" stroke="#00F0FF" strokeWidth="3" className={`${styles.nodePoint} ${styles.node4}`} />
          <circle cx="92" cy="48" r="5" fill="#080E1C" stroke="#00F0FF" strokeWidth="3" className={`${styles.nodePoint} ${styles.node5}`} />
        </svg>

        {/* Layer 2: Master High-Fidelity Brand Logo */}
        <Image
          src="/assets/Images/Logo/logo.webp"
          alt="FXENGIN Unified Brand"
          width={width}
          height={height}
          className={styles.masterFidelityLogo}
          priority
        />
      </div>
    </div>
  );
}
