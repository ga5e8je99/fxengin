'use client';

const BROKER_STORAGE_KEY = 'fxengin_broker_session';

/**
 * Get currently stored broker session from localStorage
 */
export function getCurrentBrokerSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BROKER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('Failed to parse broker session', e);
    return null;
  }
}

/**
 * Save broker session to localStorage
 */
export function saveBrokerSession(broker, token) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      BROKER_STORAGE_KEY,
      JSON.stringify({
        broker,
        token,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.error('Failed to save broker session', e);
  }
}

/**
 * Clear broker session
 */
export function logoutBroker() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BROKER_STORAGE_KEY);
  } catch (e) {}
}

/**
 * Authenticate broker via credentials or 1-click demo login
 */
export async function loginBroker({ usernameOrEmail, password, demoBrokerId }) {
  try {
    const res = await fetch('/api/brokers/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password, demoBrokerId }),
    });
    const data = await res.json();
    if (data.success && data.broker) {
      saveBrokerSession(data.broker, data.token);
    }
    return data;
  } catch (error) {
    return { success: false, error: error.message || 'فشل الاتصال بالخادم' };
  }
}

/**
 * Get public list of contracted brokers for quick selection
 */
export async function fetchContractedBrokers() {
  try {
    const res = await fetch('/api/brokers/portal/auth', { cache: 'no-store' });
    const data = await res.json();
    return data.success ? data.accounts || [] : [];
  } catch (e) {
    return [];
  }
}

/**
 * Fetch events for a broker
 */
export async function fetchBrokerEvents(brokerId) {
  try {
    const query = brokerId ? `?brokerId=${encodeURIComponent(brokerId)}` : '';
    const res = await fetch(`/api/brokers/portal/events${query}`, { cache: 'no-store' });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Create a new Event Request
 */
export async function createBrokerEvent(eventData) {
  try {
    const res = await fetch('/api/brokers/portal/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update an Event
 */
export async function updateBrokerEvent(id, updates) {
  try {
    const res = await fetch('/api/brokers/portal/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete an Event
 */
export async function deleteBrokerEvent(id) {
  try {
    const res = await fetch(`/api/brokers/portal/events?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch ad & offer contracts
 */
export async function fetchBrokerContracts(brokerId) {
  try {
    const query = brokerId ? `?brokerId=${encodeURIComponent(brokerId)}` : '';
    const res = await fetch(`/api/brokers/portal/contracts${query}`, { cache: 'no-store' });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message, data: [] };
  }
}

/**
 * Create a new contract (Ad or Offer)
 */
export async function createBrokerContract(contractData) {
  try {
    const res = await fetch('/api/brokers/portal/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contractData),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
}
