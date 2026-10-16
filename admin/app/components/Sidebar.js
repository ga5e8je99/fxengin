'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAdmin } from '../context/AdminContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { setIsMobileMenuOpen } = useAdmin();

  const handleNavClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    {
      name: 'نظرة عامة',
      href: '/dashboard',
      icon: 'grid_view',
      badge: '01',
      badgeType: 'default',
    },
    {
      name: 'المستخدمون والتجار',
      href: '/dashboard/users',
      icon: 'group',
      badge: '02',
      badgeType: 'default',
    },
    {
      name: 'الكورسات والدروس',
      href: '/dashboard/courses',
      icon: 'school',
      badge: '03',
      badgeType: 'default',
    },
    {
      name: 'استوديو البث المباشر',
      href: '/dashboard/live',
      icon: 'live_tv',
      badge: 'LIVE',
      badgeType: 'active',
    },
    {
      name: 'المقالات والأخبار',
      href: '/dashboard/articles',
      icon: 'newspaper',
      badge: '04',
      badgeType: 'default',
    },
    {
      name: 'التحليلات والإشارات',
      href: '/dashboard/analysis',
      icon: 'monitoring',
      badge: 'ACT',
      badgeType: 'active',
    },
    {
      name: 'الطلبات والمدفوعات',
      href: '/dashboard/payments',
      icon: 'payments',
      badge: 'PAY',
      badgeType: 'active',
    },
    {
      name: 'أكواد التفعيل',
      href: '/dashboard/activation-codes',
      icon: 'key',
      badge: 'CODE',
      badgeType: 'default',
    },
    {
      name: 'مسابقة التداول ومحاكي MT5',
      href: '/dashboard/trading-competition',
      icon: 'emoji_events',
      badge: 'MT5',
      badgeType: 'active',
    },
    {
      name: 'الاشتراكات والفوترة',
      href: '/dashboard/subscriptions',
      icon: 'credit_card',
      badge: '06',
      badgeType: 'default',
    },
    {
      name: 'الوسطاء وشركاء التداول',
      href: '/dashboard/brokers',
      icon: 'account_balance',
      badge: 'IB',
      badgeType: 'active',
    },
    {
      name: 'برنامج الشركاء (Affiliates)',
      href: '/dashboard/affiliates',
      icon: 'military_tech',
      badge: '10%',
      badgeType: 'active',
    },
    {
      name: 'المساحات الإعلانية',
      href: '/dashboard/ads',
      icon: 'campaign',
      badge: 'ADS',
      badgeType: 'active',
    },
    {
      name: 'الصفحات والمحتوى (CMS)',
      href: '/dashboard/pages',
      icon: 'description',
      badge: 'CMS',
      badgeType: 'active',
    },
    {
      name: 'الوسائط والإعدادات',
      href: '/dashboard/settings',
      icon: 'settings',
      badge: '08',
      badgeType: 'default',
    },
  ];

  return (
    <aside className="h-full w-full bg-surface-container-low border-l border-border-structural flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="h-20 px-space-md sm:px-space-lg flex items-center justify-between border-b border-border-structural/60 shrink-0">
          <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-space-sm">
            <div className="relative h-8 w-8 shrink-0">
              <Image
                src="/assets/Images/Logo/logo.webp"
                alt="FXENGIN Brand Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-bold">
                FXENGIN
              </span>
              <span className="font-telemetry-micro text-telemetry-micro text-primary uppercase tracking-wider">
                Forex Engineer v3.4
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-space-2xs px-space-xs py-0.5 rounded bg-surface-elevated border border-border-structural">
              <span className="w-1.5 h-1.5 rounded-full bg-bullish-up animate-pulse"></span>
              <span className="font-telemetry-micro text-telemetry-micro text-bullish-up dir-ltr">
                LIVE
              </span>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg bg-surface-elevated border border-border-structural flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="إغلاق القائمة"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-space-md py-space-sm shrink-0">
          <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider px-space-xs">
            بوابات التحكم الفني
          </span>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-space-xs space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`group flex items-center justify-between px-space-md py-space-sm rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-surface-elevated text-primary font-bold border-r-2 border-primary-container shadow-[inset_-2px_0_0_0_#2a91ff]'
                    : 'text-on-surface-variant hover:bg-surface-elevated hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-space-sm">
                  <span
                    className={`material-symbols-outlined transition-colors ${
                      isActive
                        ? 'text-primary'
                        : 'text-text-secondary group-hover:text-primary'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-label-lg text-label-lg font-medium">
                    {item.name}
                  </span>
                </div>

                {item.badgeType === 'active' ? (
                  <span className="font-telemetry-micro text-telemetry-micro text-bullish-up px-1.5 py-0.5 rounded bg-bullish-up/10 dir-ltr">
                    {item.badge}
                  </span>
                ) : (
                  <span className="font-telemetry-micro text-telemetry-micro text-text-muted px-1.5 py-0.5 rounded bg-surface-container-high/40 dir-ltr">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Financial Trading Server Status Widget */}
      <div className="p-space-md border-t border-border-structural/60 space-y-2">
        <div className="p-space-md rounded-xl bg-surface-container border border-border-structural flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-text-muted">
              خادم التداول المالي
            </span>
            <span className="font-telemetry-micro text-telemetry-micro text-bullish-up dir-ltr">
              99.98% OK
            </span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded overflow-hidden">
            <div className="bg-bullish-up h-full w-[99.98%]"></div>
          </div>
          <div className="flex items-center justify-between text-text-muted font-telemetry-micro text-telemetry-micro">
            <span className="dir-ltr">Ping: 12ms</span>
            <span className="dir-ltr">LDN-EQ4</span>
          </div>
        </div>

        {/* Dedicated Login & Sign-up Link */}
        <Link
          href="/login"
          className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-elevated/70 hover:bg-surface-elevated border border-border-structural/80 hover:border-primary/50 text-text-secondary hover:text-text-primary transition-all text-xs font-medium group"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
              lock
            </span>
            <span>بوابة الدخول والتسجيل</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary dir-ltr">
            Auth Portal
          </span>
        </Link>
      </div>
    </aside>
  );
}
