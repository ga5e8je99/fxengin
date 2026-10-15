/**
 * @file liveService.js
 * Admin Live Broadcast Studio Service
 * Connects to live streaming sessions, OBS keys, chat moderation, and broadcast status
 */

import { adminFetch } from './apiClient';

/**
 * Supported Live Session Statuses
 */
export const LIVE_STATUSES = {
  SCHEDULED: {
    key: 'SCHEDULED',
    labelAr: 'مجدول (Scheduled)',
    color: '#0488F8',
    bgColor: 'rgba(4, 136, 248, 0.15)',
    borderColor: 'rgba(4, 136, 248, 0.35)',
  },
  LIVE: {
    key: 'LIVE',
    labelAr: 'بث مباشر حي (LIVE)',
    color: '#16C784',
    bgColor: 'rgba(22, 199, 132, 0.2)',
    borderColor: 'rgba(22, 199, 132, 0.5)',
  },
  ENDED: {
    key: 'ENDED',
    labelAr: 'منتهي (Ended)',
    color: '#A7AFBF',
    bgColor: 'rgba(167, 175, 191, 0.12)',
    borderColor: 'rgba(167, 175, 191, 0.25)',
  },
  CANCELLED: {
    key: 'CANCELLED',
    labelAr: 'ملغي (Cancelled)',
    color: '#F6465D',
    bgColor: 'rgba(246, 70, 93, 0.15)',
    borderColor: 'rgba(246, 70, 93, 0.35)',
  },
};

/**
 * Stream Source Types
 */
export const STREAM_TYPES = {
  HLS: {
    key: 'HLS',
    labelAr: 'HLS Stream (.m3u8)',
    badgeColor: '#0488F8',
  },
  YOUTUBE: {
    key: 'YOUTUBE',
    labelAr: 'YouTube Live Embed',
    badgeColor: '#EF4444',
  },
  OBS: {
    key: 'OBS',
    labelAr: 'OBS Studio / RTMP',
    badgeColor: '#A855F7',
  },
  CUSTOM: {
    key: 'CUSTOM',
    labelAr: 'بث مخصص (Custom WebRTC/CDN)',
    badgeColor: '#FB8704',
  },
};

export function getLiveStatusConfig(status) {
  return (
    LIVE_STATUSES[status] || {
      key: status,
      labelAr: status || 'غير محدد',
      color: '#A7AFBF',
      bgColor: 'rgba(167, 175, 191, 0.12)',
      borderColor: 'rgba(167, 175, 191, 0.25)',
    }
  );
}

// ==========================================
// 1. GET /admin/live
// List all live broadcast sessions
// ==========================================
export async function listAllLiveSessions() {
  const res = await adminFetch('/admin/live', {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 2. POST /admin/live
// Schedule or create a new live session
// ==========================================
export async function createLiveSession(sessionData) {
  const res = await adminFetch('/admin/live', {
    method: 'POST',
    body: JSON.stringify(sessionData),
  });
  return res;
}

// ==========================================
// 3. GET /admin/live/{id}
// Fetch live session by ID with OBS stream keys
// ==========================================
export async function getLiveSessionById(id) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 4. PUT /admin/live/{id}
// Update live session details, timing, links, access tier
// ==========================================
export async function updateLiveSession(id, sessionData) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
  return res;
}

// ==========================================
// 5. DELETE /admin/live/{id}
// Delete live session permanently
// ==========================================
export async function deleteLiveSession(id) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res;
}

// ==========================================
// 6. PATCH /admin/live/{id}/status
// Set live status (LIVE, ENDED, CANCELLED, SCHEDULED)
// ==========================================
export async function setLiveSessionStatus(id, status) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res;
}

// ==========================================
// 7. POST /admin/live/{id}/chat/{messageId}/pin
// Pin or unpin chat message
// ==========================================
export async function pinChatMessage(sessionId, messageId, isPinned = true) {
  const res = await adminFetch(
    `/admin/live/${encodeURIComponent(sessionId)}/chat/${encodeURIComponent(messageId)}/pin`,
    {
      method: 'POST',
      body: JSON.stringify({ isPinned }),
    }
  );
  return res;
}

// ==========================================
// 8. DELETE /admin/live/{id}/chat/{messageId}
// Delete offending chat message from live room
// ==========================================
export async function deleteChatMessage(sessionId, messageId) {
  const res = await adminFetch(
    `/admin/live/${encodeURIComponent(sessionId)}/chat/${encodeURIComponent(messageId)}`,
    {
      method: 'DELETE',
    }
  );
  return res;
}

// ==========================================
// 9. GET /admin/live/{id}/credentials
// Fetch OBS Studio credentials & stream keys
// ==========================================
export async function getStreamCredentials(id) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}/credentials`, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 10. POST /admin/live/{id}/credentials/regenerate
// Regenerate stream key
// ==========================================
export async function regenerateStreamCredentials(id) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}/credentials/regenerate`, {
    method: 'POST',
  });
  return res;
}

// ==========================================
// 11. GET /live/{sessionId}/chat
// Fetch live chat history for moderation
// ==========================================
export async function getLiveChatHistory(sessionId) {
  const res = await adminFetch(`/live/${encodeURIComponent(sessionId)}/chat`, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 12. PATCH /admin/live/{id}/timer
// Adjust schedule countdown timer
// ==========================================
export async function updateLiveTimer(id, { scheduledStartTime, addMinutes }) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(id)}/timer`, {
    method: 'PATCH',
    body: JSON.stringify({ scheduledStartTime, addMinutes }),
  });
  return res;
}

// ==========================================
// 13. POST /live/{sessionId}/chat
// Send a message to live chat as admin/instructor
// ==========================================
export async function sendLiveChatMessage(sessionId, message) {
  const res = await adminFetch(`/live/${encodeURIComponent(sessionId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return res;
}

// ==========================================
// 14. GET /admin/live/{id}/access-codes
// List all enrolled students & access codes
// ==========================================
export async function listLiveAccessCodes(sessionId) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(sessionId)}/access-codes`, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 15. POST /admin/live/{id}/access-codes
// Manually add student & issue unique access code
// ==========================================
export async function createManualAccessCode(sessionId, payload) {
  const res = await adminFetch(`/admin/live/${encodeURIComponent(sessionId)}/access-codes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
}

// ==========================================
// 16. PATCH /admin/live/access-codes/{codeId}/revoke
// Toggle revoke / activate access code
// ==========================================
export async function toggleRevokeAccessCode(codeId, isRevoked) {
  const res = await adminFetch(`/admin/live/access-codes/${encodeURIComponent(codeId)}/revoke`, {
    method: 'PATCH',
    body: JSON.stringify({ isRevoked }),
  });
  return res;
}

// ==========================================
// 17. POST /admin/live/access-codes/{codeId}/regenerate
// Regenerate unique access code for a student
// ==========================================
export async function regenerateAccessCode(codeId) {
  const res = await adminFetch(`/admin/live/access-codes/${encodeURIComponent(codeId)}/regenerate`, {
    method: 'POST',
  });
  return res;
}

