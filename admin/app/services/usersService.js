/**
 * @file usersService.js
 * Comprehensive service for Admin User Management & Institutional Control
 * Integrates all 13 admin endpoints from core.fxengen.com
 */

import { adminFetch, getAdminToken, setAdminToken, clearAdminToken } from './apiClient';

/**
 * Supported User Roles
 */
export const USER_ROLES = {
  USER: {
    key: 'USER',
    labelAr: 'مستخدم عادي',
    labelEn: 'Standard User',
    color: '#A7AFBF',
    bgColor: 'rgba(167, 175, 191, 0.12)',
    borderColor: 'rgba(167, 175, 191, 0.25)',
    icon: 'person',
  },
  TRADER: {
    key: 'TRADER',
    labelAr: 'متداول (Trader)',
    labelEn: 'Trader',
    color: '#0488F8',
    bgColor: 'rgba(4, 136, 248, 0.12)',
    borderColor: 'rgba(4, 136, 248, 0.3)',
    icon: 'show_chart',
  },
  VIP: {
    key: 'VIP',
    labelAr: 'عضو VIP',
    labelEn: 'VIP Member',
    color: '#FB8704',
    bgColor: 'rgba(251, 135, 4, 0.15)',
    borderColor: 'rgba(251, 135, 4, 0.35)',
    icon: 'workspace_premium',
  },
  ADMIN: {
    key: 'ADMIN',
    labelAr: 'مدير (Admin)',
    labelEn: 'Administrator',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    icon: 'verified_user',
  },
  SUPER_ADMIN: {
    key: 'SUPER_ADMIN',
    labelAr: 'مدير رئيسي (Super Admin)',
    labelEn: 'Super Administrator',
    color: '#EC4899',
    bgColor: 'rgba(236, 72, 153, 0.18)',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    icon: 'shield_person',
  },
};

/**
 * Supported Experience Levels
 */
export const EXPERIENCE_LEVELS = {
  BEGINNER: {
    key: 'BEGINNER',
    labelAr: 'مبتدئ (Beginner)',
    labelEn: 'Beginner',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
  INTERMEDIATE: {
    key: 'INTERMEDIATE',
    labelAr: 'متوسط (Intermediate)',
    labelEn: 'Intermediate',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
  },
  ADVANCED: {
    key: 'ADVANCED',
    labelAr: 'متقدم / محترف (Advanced)',
    labelEn: 'Advanced',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
  },
};

/**
 * Get role configuration helper
 */
export function getRoleConfig(role) {
  return USER_ROLES[role] || {
    key: role,
    labelAr: role || 'غير محدد',
    labelEn: role || 'Unknown',
    color: '#A7AFBF',
    bgColor: 'rgba(167, 175, 191, 0.12)',
    borderColor: 'rgba(167, 175, 191, 0.25)',
    icon: 'account_circle',
  };
}

/**
 * Get experience configuration helper
 */
export function getExperienceConfig(level) {
  return EXPERIENCE_LEVELS[level] || {
    key: level,
    labelAr: level || 'غير محدد',
    labelEn: level || 'Unknown',
    color: '#A7AFBF',
    bgColor: 'rgba(167, 175, 191, 0.12)',
  };
}

/**
 * Format ISO date to readable string
 */
export function formatUserDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateStr);
  }
}

// ==========================================
// 1. GET /admin/users/metrics/summary
// Platform User Analytics & KPI Metrics
// ==========================================
export async function getUsersMetrics() {
  const res = await adminFetch('/admin/users/metrics/summary', {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 2. GET /admin/users/export
// Export Sanitized User Directory
// ==========================================
export async function exportUsers() {
  const res = await adminFetch('/admin/users/export', {
    method: 'GET',
  });
  return res;
}

/**
 * Convert user directory array to CSV and trigger browser download
 */
export function downloadUsersCsv(users, filename = 'fxengin-users-directory.csv') {
  if (!users || !Array.isArray(users) || users.length === 0) {
    return false;
  }

  const headers = [
    'User ID',
    'Full Name',
    'Email',
    'Phone Number',
    'Role',
    'Experience Level',
    'Status',
    'Active Sessions',
    'Created At',
  ];

  const rows = users.map((u) => [
    `"${u.id || ''}"`,
    `"${(u.fullName || '').replace(/"/g, '""')}"`,
    `"${u.maskedEmail || u.email || ''}"`,
    `"${u.maskedPhoneNumber || u.phoneNumber || ''}"`,
    `"${u.role || ''}"`,
    `"${u.experienceLevel || ''}"`,
    u.isActive ? 'Active' : 'Suspended',
    u.activeSessionsCount ?? 0,
    `"${u.createdAt || ''}"`,
  ]);

  // Prepend UTF-8 BOM for Arabic character preservation in Excel
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

// ==========================================
// 3. GET /admin/users
// List Users with Filtering, Pagination & Search
// ==========================================
export async function getUsersList(params = {}) {
  const query = new URLSearchParams();

  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search && params.search.trim()) query.append('search', params.search.trim());
  if (params.role && params.role !== 'ALL') query.append('role', params.role);
  if (params.isActive !== undefined && params.isActive !== 'ALL' && params.isActive !== '') {
    query.append('isActive', params.isActive === true || params.isActive === 'true' ? 'true' : 'false');
  }
  if (params.experienceLevel && params.experienceLevel !== 'ALL') {
    query.append('experienceLevel', params.experienceLevel);
  }
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);
  if (params.fromDate) query.append('fromDate', params.fromDate);
  if (params.toDate) query.append('toDate', params.toDate);

  const queryString = query.toString();
  const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;

  const res = await adminFetch(endpoint, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 4. POST /admin/users
// Direct User Provisioning (Create User)
// ==========================================
export async function createUser(userData) {
  const res = await adminFetch('/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      fullName: userData.fullName,
      password: userData.password,
      phoneNumber: userData.phoneNumber || undefined,
      role: userData.role || 'USER',
      experienceLevel: userData.experienceLevel || 'BEGINNER',
    }),
  });
  return res;
}

// ==========================================
// 5. POST /admin/users/bulk-delete
// Bulk Delete User Accounts (Zero Leak Safe Decommissioning)
// ==========================================
export async function bulkDeleteUsers(userIds) {
  const res = await adminFetch('/admin/users/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });
  return res;
}

// ==========================================
// 6. GET /admin/users/{id}
// Get Detailed User Profile by ID
// ==========================================
export async function getUserById(id) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 7. PATCH /admin/users/{id}
// Update User Profile Details
// ==========================================
export async function updateUserProfile(id, payload) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      fullName: payload.fullName,
      phoneNumber: payload.phoneNumber,
      experienceLevel: payload.experienceLevel,
    }),
  });
  return res;
}

// ==========================================
// 8. DELETE /admin/users/{id}
// Permanently Delete User Account (Super Admin Only)
// ==========================================
export async function deleteUser(id) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res;
}

// ==========================================
// 9. PATCH /admin/users/{id}/status
// Suspend / Ban or Reactivate User Account
// ==========================================
export async function updateUserStatus(id, { isActive, reason }) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      isActive: Boolean(isActive),
      ...(reason ? { reason: reason.trim() } : {}),
    }),
  });
  return res;
}

// ==========================================
// 10. PATCH /admin/users/{id}/role
// Elevate / Demote User Role (Super Admin Only)
// ==========================================
export async function updateUserRole(id, { role }) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
  return res;
}

// ==========================================
// 11. POST /admin/users/{id}/reset-password
// Administrative Password Reset (Super Admin Only)
// ==========================================
export async function adminResetPassword(id, { newPassword, generateRandom = false }) {
  const body = { generateRandom };
  if (!generateRandom && newPassword) {
    body.newPassword = newPassword;
  }

  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res;
}

// ==========================================
// 12. GET /admin/users/{id}/sessions
// Inspect Active User Sessions (Security Forensics)
// ==========================================
export async function getUserSessions(id) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}/sessions`, {
    method: 'GET',
  });
  return res;
}

// ==========================================
// 13. POST /admin/users/{id}/revoke-sessions
// Revoke All User Sessions (Global Force Logout)
// ==========================================
export async function revokeUserSessions(id) {
  const res = await adminFetch(`/admin/users/${encodeURIComponent(id)}/revoke-sessions`, {
    method: 'POST',
  });
  return res;
}

// ==========================================
// Administrative Authentication Helper
// POST /admin/auth/login
// ==========================================
export async function adminLogin({ email, password }) {
  const res = await adminFetch('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res.ok && res.data?.accessToken) {
    setAdminToken(res.data.accessToken);
  }

  return res;
}

export { getAdminToken, setAdminToken, clearAdminToken };
