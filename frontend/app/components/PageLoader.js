'use client';
import { useEffect, useState } from 'react';
import LogoAssembler from './LogoAssembler';

export default function PageLoader({ isLoading }) {
  const [visible, setVisible] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
    } else {
      const timeout = setTimeout(() => {
        setVisible(false);
      }, 350);
      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(6, 20, 47, 0.98) 0%, rgba(1, 7, 30, 0.98) 50%, rgba(0, 3, 13, 0.99) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isLoading ? 1 : 0,
        transition: 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isLoading ? 'all' : 'none',
        userSelect: 'none',
      }}
    >
      {/* Ambient background brand glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(251, 135, 4, 0.18) 0%, rgba(4, 136, 248, 0.12) 45%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* Pure Standalone Logo Assembler (No Frames, No Text, No Progress Bar) */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LogoAssembler width={110} height={110} />
      </div>
    </div>
  );
}
