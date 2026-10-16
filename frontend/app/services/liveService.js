/**
 * @file liveService.js
 * @description Official Live Streaming & Interactive Real-Time Chat Service for FXENGIN
 * Integrates:
 * - GET  /live (active broadcasts, upcoming sessions, replays)
 * - GET  /live/{idOrSlug} (room details, stream URL, access validation, watermark)
 * - GET  /live/{sessionId}/chat (chat history)
 * - POST /live/{sessionId}/chat (post real-time chat messages)
 * - GET  /live/{sessionId}/chat/stream (SSE real-time chat & announcement stream)
 */

import { API_BASE_URL, apiFetch } from './apiClient.js';

export const DEFAULT_RTMP_SERVER_URL = process.env.NEXT_PUBLIC_RTMP_SERVER_URL || 'rtmp://live.fxengen.com/live';
export const DEFAULT_STREAM_KEY = process.env.NEXT_PUBLIC_DEFAULT_STREAM_KEY || 'live_key_default_99182';
export const DEFAULT_LIVE_HLS_URL = process.env.NEXT_PUBLIC_LIVE_HLS_URL || 'https://live.fxengen.com/live/live_key_default_99182/index.m3u8';

/**
 * Resolve live streaming playback URL for video player
 * @param {object} session
 * @returns {string}
 */
export function getSessionPlaybackUrl(session) {
  if (session?.streamUrl) return session.streamUrl;
  if (session?.playbackEndpoints?.hls) return session.playbackEndpoints.hls;
  const key = session?.streamKey || DEFAULT_STREAM_KEY;
  return `https://live.fxengen.com/live/${encodeURIComponent(key)}/index.m3u8`;
}

/**
 * Fetch list of live streaming sessions (liveNow, upcoming, replays)
 * Endpoint: GET /live
 * @returns {Promise<{
 *   success: boolean,
 *   liveNow: Array,
 *   upcoming: Array,
 *   replays: Array,
 *   totalActiveCount: number,
 *   totalUpcomingCount: number,
 *   error?: string
 * }>}
 */
export async function fetchLiveSessions() {
  try {
    const res = await apiFetch('/live', {
      method: 'GET',
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch live sessions (HTTP ${res.status})`);
    }

    const data = await res.json();
    return {
      success: true,
      liveNow: Array.isArray(data?.liveNow) ? data.liveNow : [],
      upcoming: Array.isArray(data?.upcoming) ? data.upcoming : [],
      replays: Array.isArray(data?.replays) ? data.replays : [],
      totalActiveCount: data?.totalActiveCount ?? (data?.liveNow?.length || 0),
      totalUpcomingCount: data?.totalUpcomingCount ?? (data?.upcoming?.length || 0),
      data,
    };
  } catch (err) {
    console.warn('API Error (fetchLiveSessions):', err.message);
    return {
      success: false,
      liveNow: [],
      upcoming: [],
      replays: [],
      totalActiveCount: 0,
      totalUpcomingCount: 0,
      error: err.message,
    };
  }
}

/**
 * Fetch detailed live room data, active video stream, access permissions, and watermark
 * Endpoint: GET /live/{idOrSlug}
 * @param {string} idOrSlug
 * @param {string} [accessCode]
 * @returns {Promise<{
 *   success: boolean,
 *   session?: object,
 *   canAccess?: boolean,
 *   accessDeniedReason?: string,
 *   watermark?: object,
 *   error?: string,
 *   statusCode?: number
 * }>}
 */
export async function fetchLiveRoom(idOrSlug, accessCode = '') {
  if (!idOrSlug) return { success: false, error: 'Session ID or slug is required' };

  let cleanId = idOrSlug;
  try {
    cleanId = decodeURIComponent(idOrSlug);
  } catch {}

  const url = accessCode
    ? `/live/${encodeURIComponent(cleanId)}?code=${encodeURIComponent(accessCode.trim())}`
    : `/live/${encodeURIComponent(cleanId)}`;

  try {
    const res = await apiFetch(url, {
      method: 'GET',
      headers: accessCode ? { 'x-access-code': accessCode.trim() } : {},
    });

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        error: `Failed to enter live room (HTTP ${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      session: data?.session || data,
      canAccess: Boolean(data?.canAccess),
      accessDeniedReason: data?.accessDeniedReason || null,
      watermark: data?.watermark || null,
      data,
    };
  } catch (err) {
    console.error(`API Error (fetchLiveRoom for ${idOrSlug}):`, err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Verify a unique access code for a live course
 * Endpoint: POST /live/{idOrSlug}/verify-code
 * @param {string} idOrSlug
 * @param {string} code
 */
export async function verifyLiveAccessCode(idOrSlug, code) {
  try {
    const res = await apiFetch(`/live/${encodeURIComponent(idOrSlug)}/verify-code`, {
      method: 'POST',
      body: JSON.stringify({ code: code?.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err) {
    return {
      ok: false,
      data: { message: err.message },
    };
  }
}

/**
 * Purchase a live course ticket and automatically generate unique access code
 * Endpoint: POST /live/{idOrSlug}/purchase
 * @param {string} idOrSlug
 * @param {object} payload
 */
export async function purchaseLiveCourse(idOrSlug, payload) {
  try {
    const res = await apiFetch(`/live/${encodeURIComponent(idOrSlug)}/purchase`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return {
      ok: res.ok,
      status: res.status,
      data,
    };
  } catch (err) {
    return {
      ok: false,
      data: { message: err.message },
    };
  }
}

/**
 * Fetch recent chat messages history for a live stream session
 * Endpoint: GET /live/{sessionId}/chat
 * @param {string} sessionId
 * @returns {Promise<{success: boolean, messages: Array, error?: string}>}
 */
export async function fetchLiveChatHistory(sessionId) {
  if (!sessionId) return { success: false, messages: [], error: 'Session ID is required' };

  try {
    const res = await apiFetch(`/live/${encodeURIComponent(sessionId)}/chat`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error(`Failed to load chat history (HTTP ${res.status})`);
    }

    const data = await res.json();
    const messages = Array.isArray(data) ? data : (data?.messages || []);

    return {
      success: true,
      messages,
    };
  } catch (err) {
    console.warn(`API Error (fetchLiveChatHistory for ${sessionId}):`, err.message);
    return {
      success: false,
      messages: [],
      error: err.message,
    };
  }
}

/**
 * Send a new live chat message to the broadcast session
 * Endpoint: POST /live/{sessionId}/chat
 * @param {string} sessionId
 * @param {string} message
 * @returns {Promise<{success: boolean, messageData?: object, error?: string, statusCode?: number}>}
 */
export async function sendLiveChatMessage(sessionId, message) {
  if (!sessionId || !message?.trim()) {
    return { success: false, error: 'Session ID and message text are required' };
  }

  try {
    const res = await apiFetch(`/live/${encodeURIComponent(sessionId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        message: message.trim(),
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        error: data?.message || `Failed to send chat message (HTTP ${res.status})`,
      };
    }

    return {
      success: true,
      messageData: data,
    };
  } catch (err) {
    console.error(`API Error (sendLiveChatMessage for ${sessionId}):`, err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Subscribe to real-time live chat messages and pinned announcements via SSE
 * Endpoint: GET /live/{sessionId}/chat/stream
 * @param {string} sessionId
 * @param {Function} onNewMessage - Callback when a new chat message arrives
 * @param {Function} [onError] - Optional error handler
 * @returns {Function} Cleanup function to close EventSource
 */
export function subscribeToLiveChatStream(sessionId, onNewMessage, onError) {
  if (typeof window === 'undefined' || !sessionId) {
    return () => {};
  }

  let eventSource = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;

    try {
      const url = `${API_BASE_URL}/live/${encodeURIComponent(sessionId)}/chat/stream`;
      eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        if (isClosed || !event.data) return;
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && typeof onNewMessage === 'function') {
            onNewMessage(parsed);
          }
        } catch (e) {
          console.warn('Error parsing live chat stream SSE event:', e);
        }
      };

      eventSource.onerror = (err) => {
        if (typeof onError === 'function') {
          onError(err);
        }
      };
    } catch (err) {
      console.warn(`Failed to connect to live chat stream for ${sessionId}:`, err);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}

/**
 * Check if an email has already paid and has an active access code for a live course
 * Endpoint: GET /live/{idOrSlug}/check-email-access?email=...
 */
export async function checkLiveEmailAccess(idOrSlug, email) {
  if (!idOrSlug || !email) return { hasAccess: false };
  try {
    const res = await apiFetch(
      `/live/${encodeURIComponent(idOrSlug)}/check-email-access?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      { method: 'GET' }
    );
    if (!res.ok) return { hasAccess: false };
    return await res.json();
  } catch (err) {
    console.warn('Error checking live email access:', err);
    return { hasAccess: false, error: err.message };
  }
}

