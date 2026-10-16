/**
 * @file coursePricing.js
 * @description Centralized helper for course pricing (before & after discount) and user enrollment check.
 */

/**
 * Resolve price before discount and price after discount for any course.
 *
 * @param {object} course - Course data from API or DB
 * @param {string} [format='dollar'] - 'dollar' ($299) or 'usdt' (299 USDT)
 * @returns {{
 *   isFree: boolean,
 *   hasDiscount: boolean,
 *   currentPrice: number,
 *   originalPrice: number | null,
 *   discountPercent: number,
 *   discountAmount: number,
 *   currentPriceStr: string,
 *   currentPriceStrEn: string,
 *   originalPriceStr: string | null,
 *   originalPriceStrEn: string | null,
 * }}
 */
export function getCoursePricing(course, format = 'dollar') {
  if (!course) {
    return {
      isFree: false,
      hasDiscount: false,
      currentPrice: 0,
      originalPrice: null,
      discountPercent: 0,
      discountAmount: 0,
      currentPriceStr: '$0',
      currentPriceStrEn: '$0',
      originalPriceStr: null,
      originalPriceStrEn: null,
    };
  }

  const isFree =
    course.accessTier === 'FREE' ||
    (course.price === 0 && (course.discountPrice === null || course.discountPrice === undefined || Number(course.discountPrice) === 0));

  if (isFree) {
    return {
      isFree: true,
      hasDiscount: false,
      currentPrice: 0,
      originalPrice: null,
      discountPercent: 0,
      discountAmount: 0,
      currentPriceStr: 'مجاني',
      currentPriceStrEn: 'Free',
      originalPriceStr: null,
      originalPriceStrEn: null,
    };
  }

  const rawP1 = course.price !== undefined && course.price !== null ? Number(course.price) : 0;
  const rawP2 =
    course.discountPrice !== undefined && course.discountPrice !== null && !isNaN(Number(course.discountPrice))
      ? Number(course.discountPrice)
      : null;

  // If both prices exist and are positive numbers
  if (rawP2 !== null && rawP2 > 0 && rawP1 > 0 && rawP1 !== rawP2) {
    // The higher is the original price before discount; the lower is after discount
    const originalPrice = Math.max(rawP1, rawP2);
    const currentPrice = Math.min(rawP1, rawP2);
    const discountAmount = originalPrice - currentPrice;
    const discountPercent = Math.round((discountAmount / originalPrice) * 100);

    const isDollar = format === 'dollar';
    const curPStr = isDollar ? `$${currentPrice}` : `${currentPrice} USDT`;
    const origPStr = isDollar ? `$${originalPrice}` : `${originalPrice} USDT`;

    return {
      isFree: false,
      hasDiscount: true,
      currentPrice,
      originalPrice,
      discountPercent,
      discountAmount,
      currentPriceStr: curPStr,
      currentPriceStrEn: curPStr,
      originalPriceStr: origPStr,
      originalPriceStrEn: origPStr,
    };
  }

  // Single price (no discount applied)
  const currentPrice = rawP1 > 0 ? rawP1 : (rawP2 || 0);
  const isDollar = format === 'dollar';
  const curPStr = isDollar ? `$${currentPrice}` : `${currentPrice} USDT`;

  return {
    isFree: currentPrice === 0,
    hasDiscount: false,
    currentPrice,
    originalPrice: null,
    discountPercent: 0,
    discountAmount: 0,
    currentPriceStr: currentPrice === 0 ? 'مجاني' : curPStr,
    currentPriceStrEn: currentPrice === 0 ? 'Free' : curPStr,
    originalPriceStr: null,
    originalPriceStrEn: null,
  };
}

/**
 * Check if the currently authenticated user is enrolled in or has access to a specific course.
 *
 * @param {object|null} user - The user object from useAuth()
 * @param {object|string} course - Course object or course ID / slug
 * @returns {boolean}
 */
export function isUserEnrolledInCourse(user, course) {
  if (!course) return false;
  if (typeof course === 'object' && course.isEnrolled) return true;
  if (!user) return false;

  const targetId = typeof course === 'string' ? course : String(course.id || course.courseId || '');
  const targetSlug = typeof course === 'object' && course.slug ? String(course.slug).toLowerCase() : '';

  if (Array.isArray(user.enrolledCourses)) {
    const isEnrolled = user.enrolledCourses.some((c) => {
      if (!c) return false;
      const cId = String(c.id || c.courseId || '');
      const cSlug = c.slug ? String(c.slug).toLowerCase() : '';

      if (targetId && (cId === targetId || cSlug === targetId.toLowerCase())) return true;
      if (targetSlug && (cSlug === targetSlug || cId === targetSlug)) return true;
      return false;
    });

    if (isEnrolled) return true;
  }

  // Also check if user has active entitlements for this course
  if (Array.isArray(user.entitlements)) {
    const hasEntitlement = user.entitlements.some((ent) => {
      if (!ent || ent.status !== 'ACTIVE') return false;
      const entProductId = String(ent.productId || '');
      return (targetId && entProductId === targetId) || (targetSlug && entProductId === targetSlug);
    });
    if (hasEntitlement) return true;
  }

  return false;
}
