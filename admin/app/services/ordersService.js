import { adminFetch } from './apiClient';

/**
 * جلب قائمة الطلبات للإدارة مع الفلترة والبحث
 */
export async function fetchAdminOrders(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = `/admin/orders${qs ? `?${qs}` : ''}`;
  const res = await adminFetch(endpoint, { method: 'GET' });
  return res.data || { success: false, data: [] };
}

/**
 * اعتماد طلب السداد وتوليد كود التفعيل وإرساله للعميل
 */
export async function approveAdminOrder(orderId, payload = {}) {
  const res = await adminFetch(`/admin/orders/${orderId}/approve`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = res.data || { success: false, message: 'فشل اعتماد الطلب' };
  if (data.success && data.orderNumber) {
    try {
      await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_conversion_by_order',
          orderNumber: data.orderNumber,
        }),
      });
    } catch (e) {
      console.warn('Affiliate confirm hook error:', e);
    }
  }
  return data;
}

/**
 * رفض طلب السداد مع إبداء السبب
 */
export async function rejectAdminOrder(orderId, reason = '') {
  const res = await adminFetch(`/admin/orders/${orderId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.data || { success: false, message: 'فشل رفض الطلب' };
}

/**
 * جلب قائمة كافة أكواد التفعيل
 */
export async function fetchAdminActivationCodes(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  const endpoint = `/admin/activation-codes${qs ? `?${qs}` : ''}`;
  const res = await adminFetch(endpoint, { method: 'GET' });
  return res.data || { success: false, data: [] };
}

/**
 * إلغاء كود تفعيل
 */
export async function revokeAdminActivationCode(codeId, reason = '') {
  const res = await adminFetch(`/admin/activation-codes/${codeId}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return res.data || { success: false, message: 'فشل إلغاء الكود' };
}

/**
 * إعادة توليد كود تفعيل جديد وإبطال القديم
 */
export async function regenerateAdminActivationCode(codeId, notes = '') {
  const res = await adminFetch(`/admin/activation-codes/${codeId}/regenerate`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return res.data || { success: false, message: 'فشل إعادة توليد الكود' };
}

/**
 * تفعيل الطلب أو الكود مباشرة وتوليد كود التفعيل للعميل
 */
export async function activateAdminActivationCode(id, notes = '') {
  const res = await adminFetch(`/admin/activation-codes/${id}/activate`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  const data = res.data || { success: false, message: 'فشل تفعيل الكود' };
  if (data.success && data.orderNumber) {
    try {
      await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_conversion_by_order',
          orderNumber: data.orderNumber,
        }),
      });
    } catch (e) {
      console.warn('Affiliate confirm hook error:', e);
    }
  }
  return data;
}

/**
 * حذف نهائي لكود التفعيل أو الطلب المعلق من قاعدة البيانات
 */
export async function deleteAdminActivationCode(id) {
  const res = await adminFetch(`/admin/activation-codes/${id}`, {
    method: 'DELETE',
  });
  return res.data || { success: false, message: 'فشل حذف السجل' };
}

/**
 * حذف نهائي للطلب من قاعدة البيانات
 */
export async function deleteAdminOrder(id) {
  const res = await adminFetch(`/admin/orders/${id}`, {
    method: 'DELETE',
  });
  return res.data || { success: false, message: 'فشل حذف الطلب' };
}
