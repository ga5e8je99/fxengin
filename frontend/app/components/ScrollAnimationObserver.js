'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global High-Performance Animation-on-Scroll (AOS) Engine
 * Automatically observes `.anim`, `[data-aos]`, `.scroll-reveal`, and prominent cards.
 * Runs at 60/120 FPS using GPU-accelerated translate3d and IntersectionObserver.
 * Safe from infinite DOM mutation loops and memory leaks.
 */
export default function ScrollAnimationObserver() {
  const pathname = usePathname();
  const observerRef = useRef(null);
  const observedSet = useRef(new WeakSet());

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    // Honor reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.anim, [data-aos], .scroll-reveal').forEach((el) => {
        el.classList.add('visible', 'aos-animate');
      });
      return;
    }

    // Clean up previous observer instance
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Single persistent IntersectionObserver instance per route
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;

            // Read delay from data attribute or inline style
            const rawDelay =
              el.getAttribute('data-aos-delay') ||
              el.getAttribute('data-delay') ||
              el.style.animationDelay;

            let delayMs = 0;
            if (rawDelay) {
              const num = parseFloat(rawDelay);
              delayMs = num < 10 ? num * 1000 : num;
            }

            if (delayMs > 0) {
              setTimeout(() => {
                el.classList.add('visible', 'aos-animate');
              }, delayMs);
            } else {
              el.classList.add('visible', 'aos-animate');
            }

            observerRef.current?.unobserve(el);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    let debounceTimer = null;

    const scanAndObserve = () => {
      if (!observerRef.current) return;

      // 1. Select explicit animated elements
      const targets = document.querySelectorAll(
        '.anim:not(.visible), [data-aos]:not(.aos-animate), .scroll-reveal:not(.visible)'
      );

      targets.forEach((el) => {
        if (!observedSet.current.has(el)) {
          observedSet.current.add(el);
          observerRef.current.observe(el);
        }
      });

      // 2. Auto-reveal cards inside grids with natural stagger (only unobserved elements)
      const autoStaggerContainers = document.querySelectorAll(
        '.cards-grid, .courses-grid, .analyses-grid, .broker-grid'
      );

      autoStaggerContainers.forEach((container) => {
        const directChildren = Array.from(container.children);
        directChildren.forEach((child, idx) => {
          if (
            !observedSet.current.has(child) &&
            !child.classList.contains('anim') &&
            !child.classList.contains('scroll-reveal') &&
            !child.hasAttribute('data-aos')
          ) {
            child.classList.add('scroll-reveal');
            child.style.transitionDelay = `${Math.min(idx * 70, 350)}ms`;
            observedSet.current.add(child);
            observerRef.current.observe(child);
          }
        });
      });
    };

    // Staggered scans for dynamically rendered Next.js client components
    scanAndObserve();
    const t1 = setTimeout(scanAndObserve, 150);
    const t2 = setTimeout(scanAndObserve, 500);
    const t3 = setTimeout(scanAndObserve, 1000);

    // Debounced MutationObserver that only fires on newly inserted DOM elements
    const mutationObserver = new MutationObserver((mutations) => {
      let hasAddedNodes = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          hasAddedNodes = true;
          break;
        }
      }

      if (hasAddedNodes) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(scanAndObserve, 200);
      }
    });

    const mainContainer = document.querySelector('main') || document.body;
    if (mainContainer) {
      mutationObserver.observe(mainContainer, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (observerRef.current) observerRef.current.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
