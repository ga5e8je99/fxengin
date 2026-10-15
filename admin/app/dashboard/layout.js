'use client';

import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommandPalette from '../components/CommandPalette';
import { useAdmin } from '../context/AdminContext';

export default function DashboardLayout({ children }) {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
  } = useAdmin();

  return (
    <div className="min-h-screen bg-canvas-deep text-on-surface antialiased">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block fixed right-0 top-0 h-full w-72 z-50">
        <Sidebar />
      </div>

      {/* Mobile Drawer (RTL: Slide in from the Right) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-start animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-canvas-deep/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl bg-surface-container-low border-l border-border-structural">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content Area with Right Padding for Sidebar */}
      <div className="pr-0 md:pr-72 min-h-screen flex flex-col w-full max-w-full">
        <Header />

        <main className="relative bg-canvas-deep min-h-screen w-full max-w-full overflow-x-hidden px-3.5 sm:px-6 lg:px-8 pt-24 sm:pt-26 pb-8 sm:pb-12 flex-1">
          {children}
        </main>
      </div>

      {/* Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
}
