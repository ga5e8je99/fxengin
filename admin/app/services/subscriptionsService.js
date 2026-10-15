/**
 * @file subscriptionsService.js
 * Centralized service for Subscriptions & Access Plans Management in FXENGIN Admin Dashboard
 */

import { adminFetch } from './apiClient';

/**
 * جلب جميع باقات الاشتراك وإحصائياتها للوحة التحكم
 */
export async function fetchAdminPlans() {
  const res = await adminFetch('/admin/subscriptions/plans');
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data };
  }
  return { success: false, error: res.data?.message || 'فشل جلب باقات الاشتراكات' };
}

/**
 * جلب إحصائيات الاشتراكات السريعة
 */
export async function fetchAdminSubscriptionStats() {
  const res = await adminFetch('/admin/subscriptions/stats');
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data };
  }
  return { success: false, error: res.data?.message || 'فشل جلب إحصائيات الاشتراكات' };
}

/**
 * إنشاء باقة اشتراك جديدة
 */
export async function createAdminPlan(planData) {
  const res = await adminFetch('/admin/subscriptions/plans', {
    method: 'POST',
    body: JSON.stringify(planData),
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: res.data.message };
  }
  return { success: false, error: res.data?.message || 'فشل إنشاء الباقة' };
}

/**
 * تحديث باقة اشتراك موجودة
 */
export async function updateAdminPlan(id, planData) {
  const res = await adminFetch(`/admin/subscriptions/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(planData),
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: res.data.message };
  }
  return { success: false, error: res.data?.message || 'فشل تحديث بيانات الباقة' };
}

/**
 * حذف / أرشفة باقة اشتراك
 */
export async function deleteAdminPlan(id) {
  const res = await adminFetch(`/admin/subscriptions/plans/${id}`, {
    method: 'DELETE',
  });
  if (res.ok && res.data) {
    return { success: true, message: res.data.message };
  }
  return { success: false, error: res.data?.message || 'فشل حذف الباقة' };
}

/**
 * جلب قائمة المشتركين والمبيعات مع تفاصيل الدفع والكوبونات
 */
export async function fetchAdminSubscribers() {
  const res = await adminFetch('/admin/subscriptions/subscribers');
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, total: res.data.total };
  }
  return { success: false, error: res.data?.message || 'فشل جلب سجل المشتركين' };
}

/**
 * تعيين اشتراك يدوي لمستخدم
 */
export async function assignSubscriptionToUser(payload) {
  const res = await adminFetch('/admin/subscriptions/assign', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: res.data.message };
  }
  return { success: false, error: res.data?.message || 'فشل تعيين الاشتراك للمستخدم' };
}
