/**
 * @file couponService.js
 * @description Client service to validate discount coupons against FXENGIN core API
 */

import { apiFetch } from './apiClient';

/**
 * Validate a coupon code and calculate discounted pricing
 * @param {string} code
 * @param {number} amount
 * @param {string} [courseId]
 * @returns {Promise<{
 *   valid: boolean,
 *   code?: string,
 *   discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT',
 *   discountValue?: number,
 *   discountAmount?: number,
 *   finalAmount?: number,
 *   originalAmount?: number,
 *   message?: string,
 *   error?: string
 * }>}
 */
export async function validateCoupon(code, amount, courseId = null) {
  if (!code || !code.trim()) {
    return { valid: false, error: 'يرجى إدخال كود الخصم' };
  }

  try {
    const payload = {
      code: code.trim().toUpperCase(),
      amount: Number(amount) || 0,
    };
    if (courseId) {
      payload.courseId = String(courseId);
    }

    const res = await apiFetch('/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        valid: false,
        error: data.message || 'كود الخصم غير صالح أو منتهي الصلاحية',
      };
    }

    return {
      valid: true,
      code: data.code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      discountAmount: data.discountAmount,
      finalAmount: data.finalAmount,
      originalAmount: data.originalAmount,
      message: data.message || 'تم تطبيق الخصم بنجاح!',
    };
  } catch (err) {
    console.error('Coupon validation error:', err);
    return {
      valid: false,
      error: 'تعذر التحقق من كود الخصم، يرجى المحاولة مرة أخرى',
    };
  }
}
