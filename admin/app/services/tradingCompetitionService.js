import { adminFetch } from './apiClient';

/**
 * جلب لوحة المتصدرين للمسابقة للإدارة
 */
export async function fetchAdminTradingLeaderboard(limit = 100) {
  const res = await adminFetch(`/admin/trading/leaderboard?limit=${limit}`);
  return res.data || { success: false, leaderboard: [] };
}

/**
 * جلب كافة الحسابات التجريبية للمتسابقين مع الفلترة والبحث
 */
export async function fetchAdminTradingAccounts(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.planId && params.planId !== 'ALL') query.set('planId', params.planId);

  const qs = query.toString();
  const res = await adminFetch(`/admin/trading/accounts${qs ? `?${qs}` : ''}`);
  return res.data || { success: false, accounts: [] };
}

/**
 * جلب كافة باقات المسابقة والحسابات التجريبية
 */
export async function fetchAdminTradingPlans() {
  const res = await adminFetch('/admin/trading/plans');
  return res.data || { success: false, plans: [] };
}

/**
 * إنشاء باقة مسابقة جديدة
 */
export async function createAdminTradingPlan(payload) {
  const res = await adminFetch('/admin/trading/plans', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || { success: false, message: 'فشل إنشاء باقة المسابقة' };
}

/**
 * تحديث باقة مسابقة
 */
export async function updateAdminTradingPlan(id, payload) {
  const res = await adminFetch(`/admin/trading/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data || { success: false, message: 'فشل تحديث باقة المسابقة' };
}

/**
 * حذف باقة مسابقة
 */
export async function deleteAdminTradingPlan(id) {
  const res = await adminFetch(`/admin/trading/plans/${id}`, {
    method: 'DELETE',
  });
  return res.data || { success: false, message: 'فشل حذف الباقة' };
}

/**
 * إعادة ضبط الحساب التجريبي لرصيده الابتدائي
 */
export async function resetAdminTradingAccount(id) {
  const res = await adminFetch(`/admin/trading/accounts/${id}/reset`, {
    method: 'POST',
  });
  return res.data || { success: false, message: 'فشل إعادة ضبط الحساب' };
}

/**
 * تغيير حالة الحساب (ACTIVE / DISQUALIFIED)
 */
export async function updateAdminTradingAccountStatus(id, status) {
  const res = await adminFetch(`/admin/trading/accounts/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.data || { success: false, message: 'فشل تحديث حالة الحساب' };
}

/**
 * إضافة متسابق يدوي للمسابقة (مشترك عبر الشركة) مع كامل تفاصيله ونتائجه
 */
export async function createAdminManualParticipant(payload) {
  const res = await adminFetch('/admin/trading/accounts/manual', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data || { success: false, message: 'فشل إضافة المتسابق' };
}

/**
 * تحديث بيانات ونتائج حساب متسابق يدوياً
 */
export async function updateAdminTradingAccount(id, payload) {
  const res = await adminFetch(`/admin/trading/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.data || { success: false, message: 'فشل تحديث بيانات الحساب' };
}

/**
 * حذف حساب متسابق
 */
export async function deleteAdminTradingAccount(id) {
  const res = await adminFetch(`/admin/trading/accounts/${id}`, {
    method: 'DELETE',
  });
  return res.data || { success: false, message: 'فشل حذف الحساب' };
}

