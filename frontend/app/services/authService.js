/**
 * @file authService.js
 * @description Authentication service for FXENGIN Core API
 * Re-exports apiClient methods and provides register, login, current user, logout, revoke-all
 */

import {
  API_BASE_URL,
  apiFetch,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  rotateRefreshToken,
  setOnSessionExpired,
  handleSessionExpired,
} from './apiClient.js';

export {
  API_BASE_URL,
  apiFetch,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  rotateRefreshToken,
  setOnSessionExpired,
  handleSessionExpired,
};

/**
 * 2. POST /auth/revoke-all
 * Revoke All Active Trader Sessions (Global Logout)
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function revokeAllSessions() {
  try {
    const accessToken = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/auth/revoke-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
      },
    });

    const data = await response.json().catch(() => null);

    // Clear local authentication tokens & user session
    clearTokens();

    if (!response.ok) {
      console.warn('Revoke all returned status:', response.status, data);
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return {
        success: false,
        message: data?.message || 'Failed to revoke sessions completely',
      };
    }

    // Redirect user to login page
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    return {
      success: true,
      message: data?.message || 'All active trader sessions have been securely revoked.',
      data,
    };
  } catch (error) {
    console.error('API Error (revokeAllSessions):', error);
    clearTokens();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return {
      success: true,
      message: 'Logged out from all local devices.',
    };
  }
}

/**
 * Register a new user
 * Endpoint: POST /auth/register
 * @param {Object} userData
 * @returns {Promise<{success: boolean, data?: any, message?: string, errors?: any}>}
 */
export async function registerUser(userData) {
  try {
    const payload = {
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.confirmPassword || userData.password,
      fullName: userData.fullName || userData.name || 'Trader',
      phoneNumber: userData.phoneNumber || '+1 555-0199',
      experienceLevel: (userData.experienceLevel || userData.level || 'BEGINNER').toUpperCase(),
      dateOfBirth: userData.dateOfBirth || '1995-06-15',
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || (Array.isArray(data?.errors) ? data.errors.join(', ') : 'Registration failed'),
        errors: data?.errors,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: data,
      message: data?.message || 'Registration successful',
    };
  } catch (error) {
    console.error('API Error (registerUser):', error);
    return {
      success: false,
      message: 'Network error. Please check your internet connection.',
      error: error.message,
    };
  }
}

/**
 * Login user
 * Endpoint: POST /auth/login
 * @param {Object} credentials
 * @returns {Promise<{success: boolean, data?: any, accessToken?: string, refreshToken?: string, expiresIn?: number, user?: any, message?: string, requireOtp?: boolean}>}
 */
export async function loginUser(credentials) {
  try {
    const payload = {
      email: credentials.email,
      password: credentials.password,
      ...(credentials.otpCode ? { otpCode: credentials.otpCode } : {}),
    };

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        message: data?.message || 'Invalid email or password',
        statusCode: response.status,
      };
    }

    if (data?.requireOtp) {
      return {
        success: true,
        requireOtp: true,
        message: data?.message || 'تم إرسال كود التحقق (OTP) إلى بريدك الإلكتروني',
        email: data?.email,
      };
    }

    const accessToken = data?.accessToken || data?.data?.accessToken;
    const refreshToken = data?.refreshToken || data?.data?.refreshToken;
    const user = data?.user || data?.data?.user;

    if (accessToken) {
      setTokens(accessToken, refreshToken);
    }

    return {
      success: true,
      requireOtp: false,
      data: data,
      accessToken,
      refreshToken,
      expiresIn: data?.expiresIn,
      user,
      message: data?.message || 'Login successful',
    };
  } catch (error) {
    console.error('API Error (loginUser):', error);
    return {
      success: false,
      message: 'Network error. Please check your internet connection.',
      error: error.message,
    };
  }
}

/**
 * Update user profile
 * Endpoint: PATCH /auth/profile
 * @param {Object} fields - { fullName?, phoneNumber?, experienceLevel? }
 * @returns {Promise<{success: boolean, user?: any, message?: string}>}
 */
export async function updateUserProfile(fields) {
  try {
    const res = await apiFetch('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(fields),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: data?.message || 'فشل تحديث البيانات' };
    }
    return {
      success: true,
      user: data?.user || data,
      message: data?.message || 'تم تحديث البيانات بنجاح',
    };
  } catch (err) {
    return { success: false, message: 'حدث خطأ في الاتصال بالخادم', error: err.message };
  }
}

/**
 * Social Authentication (Google & Apple)
 * Endpoint: POST /auth/social
 * @param {Object} payload - { provider: 'GOOGLE' | 'APPLE', idToken?: string, authorizationCode?: string, email?: string, fullName?: string }
 * @returns {Promise<{success: boolean, user?: any, accessToken?: string, refreshToken?: string, message?: string}>}
 */
export async function socialAuthLogin(payload) {
  try {
    const res = await apiFetch('/auth/social', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        success: false,
        message: data?.message || 'فشل تسجيل الدخول بالحساب الاجتماعي',
      };
    }
    return {
      success: true,
      ...data,
      user: data?.user || data?.data?.user,
    };
  } catch (err) {
    return {
      success: false,
      message: 'تعذر الاتصال بخادم المصادقة',
      error: err.message,
    };
  }
}

/**
 * Fetch Social Auth Configuration (Google & Apple Client IDs)
 * Endpoint: GET /auth/social-config
 */
export async function getSocialConfig() {
  try {
    const res = await apiFetch('/auth/social-config', { method: 'GET' });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      return data || { googleClientId: '', appleClientId: '' };
    }
  } catch (err) {
    console.warn('Failed to fetch social config:', err);
  }
  return { googleClientId: '', appleClientId: '' };
}

/**
 * Get current authenticated user profile from /auth/me
 * @returns {Promise<{success: boolean, user?: any, message?: string, unauthorized?: boolean}>}
 */
export async function fetchCurrentUser() {
  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return { success: false, unauthorized: true, message: 'No access token found' };
    }

    const response = await apiFetch('/auth/me', {
      method: 'GET',
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
        return { success: false, unauthorized: true, message: 'Session expired' };
      }
      return {
        success: false,
        message: data?.message || 'Failed to fetch user profile',
        statusCode: response.status,
      };
    }

    return {
      success: true,
      user: data?.user || data,
    };
  } catch (error) {
    console.error('API Error (fetchCurrentUser):', error);
    return {
      success: false,
      message: 'Network error while fetching profile.',
      error: error.message,
    };
  }
}

/**
 * Logout user on backend by revoking current refreshToken
 * Endpoint: POST /auth/logout
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function logoutUser() {
  try {
    const refreshToken = getRefreshToken();
    const accessToken = getAccessToken();

    if (refreshToken) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      }).catch((e) => console.warn('Logout API call failed:', e));
    }

    clearTokens();

    return {
      success: true,
      message: 'Session revoked successfully. Logged out.',
    };
  } catch (error) {
    console.error('API Error (logoutUser):', error);
    clearTokens();
    return {
      success: true,
      message: 'Logged out locally.',
    };
  }
}

/**
 * Request password reset (Send 6-digit OTP code to email)
 * Endpoint: POST /auth/forgot-password
 * @param {string} email
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function requestPasswordReset(email) {
  try {
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return {
        success: false,
        message: 'يرجى إدخال بريد إلكتروني صالح',
      };
    }

    return await sendOtp(cleanEmail, 'RESET_PASSWORD');
  } catch (err) {
    return {
      success: false,
      message: 'حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة لاحقاً.',
    };
  }
}

/**
 * Verify 6-digit OTP reset code
 * Endpoint: POST /auth/verify-otp
 * @param {string} email
 * @param {string} otp
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function verifyResetOtp(email, otp) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return {
        success: false,
        message: 'يجب إدخال رمز تحقق مكون من 6 أرقام.',
      };
    }

    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, code: cleanOtp, purpose: 'RESET_PASSWORD' }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        message: data?.message || 'تم التحقق من الرمز بنجاح.',
      };
    }

    const errData = res ? await res.json().catch(() => ({})) : null;
    return {
      success: false,
      message: errData?.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'تعذر التحقق من الرمز. يرجى التأكد من اتصالك بالإنترنت.',
    };
  }
}

/**
 * Set new password
 * Endpoint: POST /auth/reset-password
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.otp
 * @param {string} params.newPassword
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function resetPassword({ email, otp, newPassword }) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp || '').trim();

    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        otp: cleanOtp,
        password: newPassword,
        confirmPassword: newPassword,
      }),
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        success: true,
        message: data?.message || 'تم إعادة تعيين كلمة المرور بنجاح.',
      };
    }

    const errData = res ? await res.json().catch(() => ({})) : null;
    return {
      success: false,
      message: errData?.message || 'فشل تحديث كلمة المرور. يرجى التأكد من صلاحية الرمز.',
    };
  } catch (err) {
    return {
      success: false,
      message: 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مجدداً.',
    };
  }
}

/**
 * Send OTP verification code to email via fxengin519@gmail.com
 * Endpoint: POST /auth/send-otp
 */
export async function sendOtp(email, purpose = 'LOGIN') {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        success: false,
        message: data?.message || (res.status === 409 ? 'البريد الإلكتروني مسجل مسبقاً في المنصة. يرجى تسجيل الدخول.' : 'تعذر إرسال كود التحقق'),
        statusCode: res.status,
      };
    }
    return { success: true, message: data?.message, email: data?.email, statusCode: res.status };
  } catch (err) {
    return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
  }
}

/**
 * Verify OTP code
 * Endpoint: POST /auth/verify-otp
 */
export async function verifyOtp(email, code, purpose = 'LOGIN') {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: String(code).trim(), purpose }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: data?.message || 'كود التحقق غير صحيح أو منتهي الصلاحية' };
    }
    return { success: true, message: data?.message };
  } catch (err) {
    return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
  }
}

/**
 * Direct Login via OTP
 * Endpoint: POST /auth/login-otp
 */
export async function loginWithOtp(email, code) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), code: String(code).trim() }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, message: data?.message || 'كود التحقق غير صحيح أو منتهي الصلاحية' };
    }
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
    }
    return { success: true, ...data };
  } catch (err) {
    return { success: false, message: 'حدث خطأ في الاتصال بالخادم' };
  }
}
