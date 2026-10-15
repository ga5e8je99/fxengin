/**
 * @file depositService.js
 * Service for fetching, normalizing, and deduplicating deposit transactions
 * API Endpoint: https://n8n-p4oh.srv1867849.hstgr.cloud/webhook/deposit/hisrec
 */
export const DEPOSIT_API_ENDPOINT = '/api/deposits';

/**
 * Maps numeric or string status to standardized status object
 * status === 1 -> Completed / Success
 */
export function getDepositStatusInfo(status, isRtl = true) {
  const numStatus = Number(status);
  switch (numStatus) {
    case 1:
      return {
        code: 1,
        key: 'COMPLETED',
        label: isRtl ? 'مكتمل / ناجح' : 'Completed',
        badgeType: 'SUCCESS',
        color: '#16C784',
        bgColor: 'rgba(22, 199, 132, 0.12)',
        borderColor: 'rgba(22, 199, 132, 0.25)',
      };
    case 0:
      return {
        code: 0,
        key: 'PENDING',
        label: isRtl ? 'قيد الانتظار' : 'Pending',
        badgeType: 'PENDING',
        color: '#FBBF24',
        bgColor: 'rgba(251, 191, 36, 0.12)',
        borderColor: 'rgba(251, 191, 36, 0.25)',
      };
    case 2:
      return {
        code: 2,
        key: 'FAILED',
        label: isRtl ? 'فشل / مرفوض' : 'Failed',
        badgeType: 'FAILED',
        color: '#F6465D',
        bgColor: 'rgba(246, 70, 93, 0.12)',
        borderColor: 'rgba(246, 70, 93, 0.25)',
      };
    case 6:
      return {
        code: 6,
        key: 'CREDITED_LOCKED',
        label: isRtl ? 'مضاف / مقفل' : 'Credited (Locked)',
        badgeType: 'WARNING',
        color: '#FB8704',
        bgColor: 'rgba(251, 135, 4, 0.12)',
        borderColor: 'rgba(251, 135, 4, 0.25)',
      };
    case 7:
      return {
        code: 7,
        key: 'WRONG_DEPOSIT',
        label: isRtl ? 'إيداع خاطئ' : 'Wrong Deposit',
        badgeType: 'FAILED',
        color: '#F6465D',
        bgColor: 'rgba(246, 70, 93, 0.12)',
        borderColor: 'rgba(246, 70, 93, 0.25)',
      };
    case 8:
      return {
        code: 8,
        key: 'WAITING_CONFIRMATION',
        label: isRtl ? 'بانتظار التأكيدات' : 'Confirming',
        badgeType: 'PENDING',
        color: '#0488F8',
        bgColor: 'rgba(4, 136, 248, 0.12)',
        borderColor: 'rgba(4, 136, 248, 0.25)',
      };
    default:
      return {
        code: numStatus,
        key: 'UNKNOWN',
        label: isRtl ? `حالة (${status})` : `Status (${status})`,
        badgeType: 'DEFAULT',
        color: '#A7AFBF',
        bgColor: '#06142F',
        borderColor: '#12315C',
      };
  }
}

/**
 * Format timestamp (ms) to human-readable date/time string
 */
export function formatTimestamp(timestamp, isRtl = true) {
  if (!timestamp) return '—';
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return '—';

  const date = new Date(num);
  if (isNaN(date.getTime())) return '—';

  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return date.toLocaleString(isRtl ? 'ar-EG' : 'en-US');
  }
}

/**
 * Shorten long hash/address with ellipsis
 * e.g. ffc9792c047a3c88b129c2d89cadbab7b9fa8b975da478da01d2e8bffe16cbec -> ffc9792c...ecb
 */
export function truncateHash(str, frontChars = 8, backChars = 4) {
  if (!str) return '—';
  const s = String(str).trim();
  // Handle off-chain transfers neatly
  if (s.toLowerCase().startsWith('off-chain')) {
    return s;
  }
  if (s.length <= frontChars + backChars + 3) return s;
  return `${s.slice(0, frontChars)}...${s.slice(-backChars)}`;
}

/**
 * Normalizes raw API response (Array or Object containing Array)
 * and deduplicates records strictly by txId (falling back to id).
 */
export function normalizeDeposits(raw) {
  if (!raw) return [];

  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'object') {
    if (Array.isArray(raw.body)) {
      list = raw.body;
    } else if (Array.isArray(raw.data)) {
      list = raw.data;
    } else if (Array.isArray(raw.result)) {
      list = raw.result;
    } else if (Array.isArray(raw.deposits)) {
      list = raw.deposits;
    } else if (Array.isArray(raw.transactions)) {
      list = raw.transactions;
    } else {
      // Look for any array value in object keys
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key])) {
          list = raw[key];
          break;
        }
      }
      // Fallback: If raw itself is a single transaction object (e.g. has id, txId, or amount)
      if (list.length === 0 && (raw.txId || raw.id || raw.amount)) {
        list = [raw];
      }
    }
  }

  if (!Array.isArray(list)) return [];

  // Deduplication by txId (requirement 21: "استخدم txId كـ unique transaction identifier وتجنب عرض transaction مكررة")
  const seenTxIds = new Set();
  const normalized = [];

  for (const item of list) {
    if (!item) continue;

    // Determine unique identifier: txId is primary, fallback to id if missing
    const uniqueKey = item.txId ? String(item.txId).trim().toLowerCase() : (item.id ? `id-${item.id}` : null);
    if (uniqueKey && seenTxIds.has(uniqueKey)) {
      continue; // Skip duplicate
    }
    if (uniqueKey) {
      seenTxIds.add(uniqueKey);
    }

    const rawAmount = item.amount !== undefined && item.amount !== null ? String(item.amount) : '0';
    const numAmount = parseFloat(rawAmount) || 0;
    const coin = (item.coin || 'USDT').toUpperCase();
    const network = (item.network || 'TRX').toUpperCase();
    const status = item.status !== undefined ? Number(item.status) : 1;
    const insertTime = Number(item.insertTime) || 0;
    const completeTime = Number(item.completeTime) || 0;

    normalized.push({
      id: String(item.id || ''),
      amount: rawAmount,
      numericAmount: numAmount,
      coin,
      network,
      status,
      address: String(item.address || ''),
      addressTag: String(item.addressTag || ''),
      txId: String(item.txId || ''),
      insertTime,
      completeTime,
      transferType: item.transferType !== undefined ? Number(item.transferType) : 0,
      confirmTimes: String(item.confirmTimes || '1/1'),
      unlockConfirm: Number(item.unlockConfirm) || 0,
      walletType: Number(item.walletType) || 0,
      travelRuleStatus: Number(item.travelRuleStatus) || 0,
    });
  }

  return normalized;
}

const STORAGE_KEY = 'fxengin_admin_deposits_cache';

/**
 * Fetch deposit transactions from API endpoint
 */
export async function fetchDepositHistory() {
  try {
    const res = await fetch(DEPOSIT_API_ENDPOINT, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.warn(`[DepositService] /api/deposits responded with HTTP ${res.status}`);
      // Fallback from localStorage
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            const cachedList = JSON.parse(cached);
            if (Array.isArray(cachedList) && cachedList.length > 0) {
              return {
                success: true,
                data: cachedList,
                rawCount: cachedList.length,
                timestamp: Date.now(),
                isCached: true,
              };
            }
          } catch {}
        }
      }

      return {
        success: false,
        data: [],
        error: `HTTP ${res.status} ${res.statusText}`,
        timestamp: Date.now(),
      };
    }

    const json = await res.json();
    const deposits = normalizeDeposits(json);

    if (deposits.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deposits));
      } catch {}
    }

    return {
      success: true,
      data: deposits,
      rawCount: Array.isArray(json) ? json.length : (json?.body?.length || deposits.length),
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn('[DepositService] Notice fetching deposit history:', err.message);

    // Fallback to localStorage on network exception
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const cachedList = JSON.parse(cached);
          if (Array.isArray(cachedList) && cachedList.length > 0) {
            return {
              success: true,
              data: cachedList,
              rawCount: cachedList.length,
              timestamp: Date.now(),
              isCached: true,
            };
          }
        } catch {}
      }
    }

    return {
      success: false,
      data: [],
      error: err.message || 'فشل في الاتصال بمزود البيانات',
      timestamp: Date.now(),
    };
  }
}
