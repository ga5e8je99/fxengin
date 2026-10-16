'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import {
  registerUser,
  loginUser,
  loginWithOtp,
  socialAuthLogin,
  fetchCurrentUser,
  logoutUser,
  revokeAllSessions,
  rotateRefreshToken,
  setOnSessionExpired,
  getAccessToken,
  getRefreshToken,
} from '../services/authService';
import { fetchMyEnrolledCourses } from '../services/coursesService';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  loading: true,
  register: async () => {},
  login: async () => {},
  socialLogin: async () => {},
  logout: async () => {},
  revokeAllSessions: async () => {},
  globalLogout: async () => {},
  rotateToken: async () => {},
  refetchUser: async () => {},
  enrollUserCourse: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from storage on mount (client-only) to avoid SSR hydration mismatch
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('fxengin_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      }
    } catch (e) {
      console.error('Failed to load user from storage', e);
    }
    // Hard fallback: never allow auth loading state to block UI for more than 1.5s
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(safetyTimer);
  }, []);

  // Register session expired listener to clean user state
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
    });
  }, []);

  // Sync user profile with GET /auth/me on mount
  useEffect(() => {
    let isMounted = true;
    const syncUser = async () => {
      const token = getAccessToken();
      const refreshToken = getRefreshToken();
      if (!token && !refreshToken) {
        if (isMounted) {
          setUser(null);
          try {
            localStorage.removeItem('fxengin_user');
          } catch (e) {}
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetchCurrentUser();
        let myCourses = [];
        try {
          const courseRes = await fetchMyEnrolledCourses();
          if (courseRes.success && Array.isArray(courseRes.enrolledCourses)) {
            myCourses = courseRes.enrolledCourses;
          }
        } catch (e) {}

        if (res.success && res.user && isMounted) {
          const freshCourses = Array.isArray(res.user.enrolledCourses)
            ? res.user.enrolledCourses
            : myCourses;

          const updated = {
            ...res.user,
            enrolledCourses: freshCourses,
          };
          setUser(updated);
          try {
            localStorage.setItem('fxengin_user', JSON.stringify(updated));
          } catch (e) {}
        } else if (res.unauthorized && isMounted) {
          setUser(null);
          try {
            localStorage.removeItem('fxengin_user');
            localStorage.removeItem('fxengin_access_token');
            localStorage.removeItem('fxengin_refresh_token');
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Failed to sync current user with backend:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    syncUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const register = async (userData) => {
    const result = await registerUser(userData);
    if (result.success && result.data) {
      const accessToken = result.data.accessToken || result.accessToken;
      const refreshToken = result.data.refreshToken || result.refreshToken;
      const rawUser = result.data.user || result.user || result.data;

      // Direct instant authentication if register endpoint returned tokens
      if (accessToken && rawUser) {
        const fullUserData = {
          ...rawUser,
          dateOfBirth: rawUser.dateOfBirth || userData.dateOfBirth,
          enrolledCourses: rawUser.enrolledCourses || [],
        };

        setUser(fullUserData);
        try {
          localStorage.setItem('fxengin_user', JSON.stringify(fullUserData));
          localStorage.setItem('fxengin_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('fxengin_refresh_token', refreshToken);
          }
        } catch (e) {
          console.error('Failed to persist session in localStorage', e);
        }

        return {
          success: true,
          autoLoggedIn: true,
          data: fullUserData,
          accessToken,
        };
      }

      // Step 2: Attempt auto-login with in-memory credentials if tokens weren't in direct register response
      try {
        const loginRes = await loginUser({
          email: userData.email,
          password: userData.password,
        });

        if (loginRes.success && (loginRes.data?.user || loginRes.user || loginRes.data)) {
          const lUser = loginRes.user || loginRes.data?.user || loginRes.data;
          const fullUserData = {
            ...lUser,
            dateOfBirth: lUser.dateOfBirth || userData.dateOfBirth,
            enrolledCourses: lUser.enrolledCourses || [],
          };

          setUser(fullUserData);
          try {
            localStorage.setItem('fxengin_user', JSON.stringify(fullUserData));
            if (loginRes.accessToken || loginRes.data?.accessToken) {
              localStorage.setItem('fxengin_access_token', loginRes.accessToken || loginRes.data.accessToken);
            }
            if (loginRes.refreshToken || loginRes.data?.refreshToken) {
              localStorage.setItem('fxengin_refresh_token', loginRes.refreshToken || loginRes.data.refreshToken);
            }
          } catch (e) {
            console.error('Failed to persist session in localStorage', e);
          }

          return {
            success: true,
            autoLoggedIn: true,
            data: fullUserData,
            accessToken: loginRes.accessToken || loginRes.data?.accessToken,
          };
        }
      } catch (autoLoginErr) {
        console.warn('Auto-login after register failed, fallback to login page:', autoLoginErr);
      }

      // Fallback: registration succeeded, redirect to /login to get token
      return {
        success: true,
        autoLoggedIn: false,
        email: userData.email,
        data: result.data,
      };
    }

    return result;
  };

  const login = async (credentials) => {
    const result = await loginUser(credentials);
    if (result.requireOtp) {
      return result;
    }
    const rawUser = result.user || result.data?.user;
    if (result.success && rawUser) {
      const fullUserData = {
        ...rawUser,
        enrolledCourses: rawUser.enrolledCourses || [],
      };
      setUser(fullUserData);
      try {
        localStorage.setItem('fxengin_user', JSON.stringify(fullUserData));
        const aToken = result.accessToken || result.data?.accessToken;
        const rToken = result.refreshToken || result.data?.refreshToken;
        if (aToken) {
          localStorage.setItem('fxengin_access_token', aToken);
        }
        if (rToken) {
          localStorage.setItem('fxengin_refresh_token', rToken);
        }
        if (result.data?.token) {
          localStorage.setItem('fxengin_token', result.data.token);
        }
      } catch (e) {
        console.error('Failed to persist login session', e);
      }
    }
    return result;
  };

  const loginOtp = async (targetEmail, targetCode) => {
    const result = await loginWithOtp(targetEmail, targetCode);
    const rawUser = result.user || result.data?.user;
    if (result.success && rawUser) {
      const fullUserData = {
        ...rawUser,
        enrolledCourses: rawUser.enrolledCourses || [],
      };
      setUser(fullUserData);
      try {
        localStorage.setItem('fxengin_user', JSON.stringify(fullUserData));
        const aToken = result.accessToken || result.data?.accessToken;
        if (aToken) localStorage.setItem('fxengin_access_token', aToken);
        const rToken = result.refreshToken || result.data?.refreshToken;
        if (rToken) localStorage.setItem('fxengin_refresh_token', rToken);
      } catch (e) {
        console.error('Failed to persist OTP login session', e);
      }
      return { success: true, user: fullUserData };
    }
    return result;
  };

  const socialLogin = async (payload) => {
    const result = await socialAuthLogin(payload);
    const rawUser = result.user || result.data?.user;
    if (result.success && rawUser) {
      const fullUserData = {
        ...rawUser,
        enrolledCourses: rawUser.enrolledCourses || [],
      };
      setUser(fullUserData);
      try {
        localStorage.setItem('fxengin_user', JSON.stringify(fullUserData));
        const aToken = result.accessToken || result.data?.accessToken;
        const rToken = result.refreshToken || result.data?.refreshToken;
        if (aToken) localStorage.setItem('fxengin_access_token', aToken);
        if (rToken) localStorage.setItem('fxengin_refresh_token', rToken);
      } catch (e) {
        console.error('Failed to persist social login session', e);
      }
      return { success: true, user: fullUserData };
    }
    return result;
  };

  const updateProfile = async (updatedFields) => {
    try {
      const { updateUserProfile } = await import('../services/authService');
      const res = await updateUserProfile(updatedFields);
      if (res.success && res.user) {
        const fullUserData = {
          ...(user || {}),
          ...res.user,
        };
        setUser(fullUserData);
        try {
          localStorage.setItem('fxengin_user', JSON.stringify(fullUserData));
        } catch (e) {}
        return { success: true, user: fullUserData };
      }
      return res;
    } catch (e) {
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...updatedFields };
        try {
          localStorage.setItem('fxengin_user', JSON.stringify(updated));
        } catch (err) {}
        return updated;
      });
      return { success: true };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Backend logout error:', e);
    } finally {
      setUser(null);
    }
  };

  const revokeAll = async () => {
    try {
      const res = await revokeAllSessions();
      setUser(null);
      return res;
    } catch (e) {
      console.warn('Backend revoke-all error:', e);
      setUser(null);
      return { success: true };
    }
  };

  const rotateToken = async () => {
    return await rotateRefreshToken();
  };

  const refetchUser = async () => {
    try {
      const res = await fetchCurrentUser();
      let myCourses = [];
      try {
        const courseRes = await fetchMyEnrolledCourses();
        if (courseRes.success && Array.isArray(courseRes.enrolledCourses)) {
          myCourses = courseRes.enrolledCourses;
        }
      } catch (e) {}

      if (res.success && res.user) {
        const freshCourses = Array.isArray(res.user.enrolledCourses)
          ? res.user.enrolledCourses
          : myCourses;

        const full = {
          ...(res.user || {}),
          enrolledCourses: freshCourses,
        };
        setUser(full);
        try {
          localStorage.setItem('fxengin_user', JSON.stringify(full));
        } catch (e) {}
        return full;
      }
    } catch (e) {
      console.warn('Refetch user error:', e);
    }
    return null;
  };

  const enrollUserCourse = (course) => {
    if (!course) return;
    setUser((prev) => {
      if (!prev) return null;
      const currentList = prev.enrolledCourses || [];
      const courseId = course.id || course.slug;
      if (currentList.some((c) => String(c.id) === String(courseId) || (c.slug && c.slug === course.slug))) {
        return prev;
      }
      const newCourseItem = {
        id: course.id || courseId,
        slug: course.slug || courseId,
        title: course.titleAr || course.title || 'Course',
        titleEn: course.titleEn || course.title || 'Course',
        category: course.categoryAr || course.category || 'تداول',
        progress: 0,
        completedLessons: 0,
        totalLessons: course.lessons || course.lessonsCount || 1,
        hours: course.hours || 12,
        img: course.img || course.thumbnailUrl || '/assets/Images/Main/c1.webp',
        lastLesson: 'مقدمة المنهاج',
        instructor: course.instructor || 'أكاديمية FXENGIN',
      };
      const updated = {
        ...prev,
        enrolledCourses: [newCourseItem, ...currentList],
      };
      try {
        localStorage.setItem('fxengin_user', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update storage with enrolled course', e);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        register,
        login,
        loginOtp,
        socialLogin,
        logout,
        revokeAllSessions: revokeAll,
        globalLogout: revokeAll,
        revokeAll,
        rotateToken,
        setUser,
        updateProfile,
        refetchUser,
        enrollUserCourse,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
