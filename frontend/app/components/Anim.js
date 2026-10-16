'use client';
import { useEffect, useRef } from 'react';

/**
 * Wraps children in an element that animates smoothly when entering the viewport.
 * Uses IntersectionObserver — GPU-accelerated, zero layout thrash.
 *
 * @param {string}  className  Extra classes on the wrapper
 * @param {number}  delay      Delay in ms (or seconds like 0.2)
 * @param {string}  direction  'up' | 'down' | 'left' | 'right' | 'fade' | 'zoom'
 * @param {string}  as         HTML tag to render ('div' | 'section' | 'article' …)
 */
export default function Anim({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  as: Tag = 'div',
  style,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Normalize delay: 0.2 -> 200ms
    const normalizedDelay = delay > 0 && delay < 10 ? delay * 1000 : delay;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (normalizedDelay > 0) {
            setTimeout(() => {
              el.classList.add('visible', 'aos-animate');
            }, normalizedDelay);
          } else {
            el.classList.add('visible', 'aos-animate');
          }
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const dirClass =
    direction === 'left'   ? 'anim anim-left'
    : direction === 'right'  ? 'anim anim-right'
    : direction === 'down'   ? 'anim anim-down'
    : direction === 'zoom'   ? 'anim anim-zoom'
    : direction === 'fade'   ? 'anim anim-fade'
    : 'anim';

  return (
    <Tag
      ref={ref}
      suppressHydrationWarning
      className={`${dirClass} ${className}`.trim()}
      data-aos={`fade-${direction}`}
      data-aos-delay={delay}
      style={style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
