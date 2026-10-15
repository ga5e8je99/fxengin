/**
 * @file adsService.js
 * Centralized service for Advertisement Spaces & Banners Management in FXENGIN Admin Dashboard
 */

import { adminFetch } from './apiClient';

/**
 * جلب جميع الإعلانات مع الفلاتر (المساحة، الحالة، البحث)
 */
export async function fetchAdminAds(params = {}) {
  const query = new URLSearchParams();
  if (params.placement && params.placement !== 'ALL') {
    query.set('placement', params.placement);
  }
  if (params.isActive !== undefined && params.isActive !== 'ALL') {
    query.set('isActive', String(params.isActive));
  }
  if (params.search) {
    query.set('search', params.search);
  }

  const endpoint = `/admin/ads${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await adminFetch(endpoint);
  if (res.ok && res.data) {
    return { success: true, data: Array.isArray(res.data) ? res.data : res.data.data || [] };
  }
  return { success: false, error: res.data?.message || 'فشل جلب الإعلانات', data: [] };
}

/**
 * جلب إحصائيات أداء الإعلانات (Total, Active, Clicks, Views, CTR)
 */
export async function fetchAdsStats() {
  const res = await adminFetch('/admin/ads/stats');
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data };
  }
  return { success: false, error: res.data?.message || 'فشل جلب إحصائيات الإعلانات' };
}

/**
 * جلب تفاصيل إعلان معين
 */
export async function fetchAdminAdById(id) {
  const res = await adminFetch(`/admin/ads/${id}`);
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data };
  }
  return { success: false, error: res.data?.message || 'فشل جلب تفاصيل الإعلان' };
}

/**
 * إنشاء إعلان جديد
 */
export async function createAdminAd(adData) {
  const res = await adminFetch('/admin/ads', {
    method: 'POST',
    body: JSON.stringify(adData),
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: 'تم إنشاء الإعلان بنجاح' };
  }
  return { success: false, error: res.data?.message || 'فشل إنشاء الإعلان' };
}

/**
 * تعديل إعلان
 */
export async function updateAdminAd(id, adData) {
  const res = await adminFetch(`/admin/ads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(adData),
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: 'تم تحديث الإعلان بنجاح' };
  }
  return { success: false, error: res.data?.message || 'فشل تحديث الإعلان' };
}

/**
 * تبديل حالة تفعيل الإعلان (Active / Inactive)
 */
export async function toggleAdminAdStatus(id) {
  const res = await adminFetch(`/admin/ads/${id}/toggle-status`, {
    method: 'PATCH',
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: 'تم تغيير حالة الإعلان بنجاح' };
  }
  return { success: false, error: res.data?.message || 'فشل تغيير حالة الإعلان' };
}

/**
 * حذف إعلان
 */
export async function deleteAdminAd(id) {
  const res = await adminFetch(`/admin/ads/${id}`, {
    method: 'DELETE',
  });
  if (res.ok && res.data) {
    return { success: true, message: 'تم حذف الإعلان بنجاح' };
  }
  return { success: false, error: res.data?.message || 'فشل حذف الإعلان' };
}

/**
 * استعادة الإعلانات الافتراضية
 */
export async function seedDefaultAds() {
  const res = await adminFetch('/admin/ads/seed-defaults', {
    method: 'POST',
  });
  if (res.ok && res.data) {
    return { success: true, message: 'تمت استعادة الإعلانات الافتراضية بنجاح' };
  }
  return { success: false, error: res.data?.message || 'فشل استعادة الإعلانات الافتراضية' };
}

/**
 * جلب إعدادات جوجل أدسنس (Google AdSense Configuration)
 */
export async function fetchAdSenseConfig() {
  const res = await adminFetch('/admin/ads/adsense-config');
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data };
  }
  return { success: false, error: res.data?.message || 'فشل جلب إعدادات Google AdSense' };
}

/**
 * تحديث إعدادات جوجل أدسنس
 */
export async function updateAdSenseConfig(configData) {
  const res = await adminFetch('/admin/ads/adsense-config', {
    method: 'PUT',
    body: JSON.stringify(configData),
  });
  if (res.ok && res.data) {
    return { success: true, data: res.data.data || res.data, message: 'تم تحديث إعدادات Google AdSense بنجاح' };
  }
  return { success: false, error: res.data?.message || 'فشل تحديث إعدادات Google AdSense' };
}

/**
 * جلب محتوى ملف ads.txt
 */
export async function fetchAdsTxt() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/ads/ads-txt`);
    if (res.ok) {
      const text = await res.text();
      return { success: true, text };
    }
  } catch (e) {
    // fallback
  }
  return { success: false, text: '' };
}
