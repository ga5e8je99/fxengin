/**
 * @file offersService.js
 * Admin Service for managing Offers, Discounts, Bonuses & Promo Codes
 * Communicates with the local admin API (/api/offers) and maintains reactive state.
 */

export async function fetchAdminOffers(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const query = params.toString();
    const res = await fetch(`/api/offers${query ? `?${query}` : ''}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'فشل جلب العروض', data: [] };
    }

    const json = await res.json();
    return {
      success: true,
      data: Array.isArray(json.data) ? json.data : [],
      metrics: json.metrics || null,
    };
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function createAdminOffer(payload) {
  try {
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'فشل إنشاء العرض' };
    }

    return { success: true, message: json.message || 'تمت إضافة العرض بنجاح', data: json.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateAdminOffer(id, payload) {
  try {
    const res = await fetch('/api/offers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...payload }),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'فشل تعديل العرض' };
    }

    return { success: true, message: json.message || 'تم تحديث العرض بنجاح', data: json.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleAdminOfferStatus(id) {
  try {
    const res = await fetch('/api/offers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'toggle-status' }),
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'فشل تغيير حالة العرض' };
    }

    return { success: true, message: json.message || 'تم تغيير حالة العرض بنجاح', data: json.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminOffer(id) {
  try {
    const res = await fetch(`/api/offers?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'فشل حذف العرض' };
    }

    return { success: true, message: json.message || 'تم حذف العرض بنجاح' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function fetchOffersStats() {
  try {
    const res = await fetchAdminOffers();
    if (!res.success) {
      return {
        totalOffers: 0,
        activeOffers: 0,
        totalCoupons: 0,
        bonusCount: 0,
        signalsCount: 0,
      };
    }

    const offers = res.data || [];
    return {
      totalOffers: offers.length,
      activeOffers: offers.filter((o) => o.isActive !== false).length,
      totalCoupons: offers.filter((o) => Boolean(o.code)).length,
      bonusCount: offers.filter((o) => o.category === 'bonus').length,
      signalsCount: offers.filter((o) => o.category === 'signals').length,
    };
  } catch {
    return {
      totalOffers: 0,
      activeOffers: 0,
      totalCoupons: 0,
      bonusCount: 0,
      signalsCount: 0,
    };
  }
}
