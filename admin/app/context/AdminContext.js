'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  adminLogin as apiAdminLogin,
  adminRegister as apiAdminRegister,
  getAdminIdentity,
  getSuperAdminDossier,
  logoutAdmin as apiLogoutAdmin,
  getStoredAdminProfile,
  getStoredAdminDossier,
  getAdminToken,
  clearAdminToken,
} from '../services/authService';
import { adminFetch } from '../services/apiClient';
import { ToastContainer } from 'react-toastify';

const AdminContext = createContext(null);

export const initialUsers = [];
export const initialCourses = [];
export const initialArticles = [];
export const initialAnalyses = [];
export const initialTransactions = [];


export function AdminProvider({ children }) {
  const [lang, setLang] = useState('ar');
  const [users, setUsers] = useState(initialUsers);
  const [courses, setCourses] = useState(initialCourses);
  const [articles, setArticles] = useState(initialArticles);
  const [analyses, setAnalyses] = useState(initialAnalyses);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'FXENGIN — Forex Engineer',
    siteNameAr: 'منصة FXENGIN للتعليم وأسواق المال',
    maintenanceMode: false,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    currency: 'USD',
    allowRegistrations: true,
    autoApproveSignals: true,
  });

  // Super Admin Identity & Security Dossier state
  const [adminUser, setAdminUser] = useState(null);
  const [superAdminDossier, setSuperAdminDossier] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sync / Verify Admin Session with core.fxengen.com
  const refreshAdminSession = useCallback(async () => {
    const token = getAdminToken();
    if (!token) return;
    setIsAuthLoading(true);
    try {
      const [idRes, dossierRes] = await Promise.all([
        getAdminIdentity(),
        getSuperAdminDossier(),
      ]);
      if (idRes.ok && idRes.data) {
        setAdminUser(idRes.data);
      } else if (idRes.status === 401) {
        clearAdminToken();
        setAdminUser(null);
        setSuperAdminDossier(null);
        return;
      }
      if (dossierRes.ok && dossierRes.data) {
        setSuperAdminDossier(dossierRes.data);
      }
    } catch (err) {
      console.warn('Failed to refresh admin session:', err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const loginSuperAdmin = async (credentials) => {
    setIsAuthLoading(true);
    try {
      const res = await apiAdminLogin(credentials);
      if (res.ok && res.data) {
        if (res.data.admin) setAdminUser(res.data.admin);
        const dossierRes = await getSuperAdminDossier();
        if (dossierRes.ok && dossierRes.data) {
          setSuperAdminDossier(dossierRes.data);
        }
        // Load system settings immediately upon login
        adminFetch('/admin/settings').then((sRes) => {
          if (sRes.ok && sRes.data) {
            const s = sRes.data.data || sRes.data;
            setSystemSettings((prev) => ({ ...prev, ...s }));
          }
        }).catch(() => {});
      }
      return res;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const registerAdmin = async (registrationData) => {
    setIsAuthLoading(true);
    try {
      const res = await apiAdminRegister(registrationData);
      if (res.ok && res.data) {
        if (res.data.admin) setAdminUser(res.data.admin);
        const dossierRes = await getSuperAdminDossier();
        if (dossierRes.ok && dossierRes.data) {
          setSuperAdminDossier(dossierRes.data);
        }
      }
      return res;
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logoutSuperAdmin = () => {
    apiLogoutAdmin();
    setAdminUser(null);
    setSuperAdminDossier(null);
  };

  const saveManualToken = async (token) => {
    if (!token) {
      logoutSuperAdmin();
      return;
    }
    const clean = token.replace(/^Bearer\s+/i, '').trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_token', clean);
    }
    await refreshAdminSession();
  };

  // Listen for unauthorized 401 events across the app to redirect to /login
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleUnauthorized = (e) => {
      const ep = e.detail?.endpoint || '';
      if (!ep.includes('/admin/auth/login') && window.location.pathname !== '/login') {
        clearAdminToken();
        setAdminUser(null);
        setSuperAdminDossier(null);
        window.location.href = '/login';
      }
    };
    window.addEventListener('fxengin:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('fxengin:unauthorized', handleUnauthorized);
  }, []);

  // Load persisted state if exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('fxengin_admin_lang');
      if (savedLang) setLang(savedLang);

      const savedUsers = localStorage.getItem('fxengin_admin_users');
      if (savedUsers) {
        try { setUsers(JSON.parse(savedUsers)); } catch {}
      }

      const savedCourses = localStorage.getItem('fxengin_admin_courses');
      if (savedCourses) {
        try { setCourses(JSON.parse(savedCourses)); } catch {}
      }

      const savedAnalyses = localStorage.getItem('fxengin_admin_analyses');
      if (savedAnalyses) {
        try { setAnalyses(JSON.parse(savedAnalyses)); } catch {}
      }

      const cachedProfile = getStoredAdminProfile();
      if (cachedProfile) setAdminUser(cachedProfile);

      const cachedDossier = getStoredAdminDossier();
      if (cachedDossier) setSuperAdminDossier(cachedDossier);

      // Check live admin session & settings only if admin token is present
      const token = getAdminToken();
      if (token) {
        refreshAdminSession();

        // Load system settings from backend API
        adminFetch('/admin/settings').then((res) => {
          if (res.ok && res.data) {
            const s = res.data.data || res.data;
            setSystemSettings((prev) => ({ ...prev, ...s }));
          }
        }).catch(() => {});
      }
    }
  }, [refreshAdminSession]);

  // Sync lang direction to HTML
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
      localStorage.setItem('fxengin_admin_lang', lang);
    }
  }, [lang]);

  // Toggle Language
  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  // User CRUD
  const addUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=100&auto=format&fit=crop&q=80`,
      status: 'ACTIVE',
      ...userData,
    };
    const updated = [newUser, ...users];
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_users', JSON.stringify(updated));
    }
    return newUser;
  };

  const updateUser = (id, updatedFields) => {
    const updated = users.map(u => u.id === id ? { ...u, ...updatedFields } : u);
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_users', JSON.stringify(updated));
    }
  };

  const deleteUser = (id) => {
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_users', JSON.stringify(updated));
    }
  };

  // Course CRUD
  const addCourse = (courseData) => {
    const newCourse = {
      id: `crs-${Date.now().toString().slice(-4)}`,
      enrolled: 0,
      lessonsCount: Number(courseData.lessonsCount) || 12,
      status: courseData.status || 'PUBLISHED',
      thumbnail: courseData.thumbnail || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
      ...courseData,
    };
    const updated = [newCourse, ...courses];
    setCourses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_courses', JSON.stringify(updated));
    }
    return newCourse;
  };

  const updateCourse = (id, updatedFields) => {
    const updated = courses.map(c => c.id === id ? { ...c, ...updatedFields } : c);
    setCourses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_courses', JSON.stringify(updated));
    }
  };

  const deleteCourse = (id) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_courses', JSON.stringify(updated));
    }
  };

  // Article CRUD
  const addArticle = (articleData) => {
    const newArticle = {
      id: `art-${Date.now().toString().slice(-4)}`,
      views: 0,
      date: new Date().toISOString().split('T')[0],
      status: 'PUBLISHED',
      ...articleData,
    };
    setArticles([newArticle, ...articles]);
    return newArticle;
  };

  const deleteArticle = (id) => {
    setArticles(articles.filter(a => a.id !== id));
  };

  // Analysis / Signal CRUD
  const addAnalysis = (analysisData) => {
    const newAnalysis = {
      id: `sig-${Date.now().toString().slice(-4)}`,
      status: 'ACTIVE',
      statusLabel: 'نشطة ومباشرة',
      confidence: '85%',
      author: 'إدارة أبحاث FXENGIN',
      date: 'اليوم، الآن',
      ...analysisData,
    };
    const updated = [newAnalysis, ...analyses];
    setAnalyses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_analyses', JSON.stringify(updated));
    }
    return newAnalysis;
  };

  const deleteAnalysis = (id) => {
    const updated = analyses.filter(s => s.id !== id);
    setAnalyses(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fxengin_admin_analyses', JSON.stringify(updated));
    }
  };

  return (
    <AdminContext.Provider
      value={{
        lang,
        setLang,
        toggleLanguage,
        isRtl: lang === 'ar',
        users,
        addUser,
        updateUser,
        deleteUser,
        courses,
        addCourse,
        updateCourse,
        deleteCourse,
        articles,
        addArticle,
        deleteArticle,
        analyses,
        addAnalysis,
        deleteAnalysis,
        transactions,
        systemSettings,
        setSystemSettings,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        activeTab,
        setActiveTab,
        // Admin Authentication & Security
        adminUser,
        superAdminDossier,
        isAuthLoading,
        isDossierModalOpen,
        setIsDossierModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshAdminSession,
        loginSuperAdmin,
        registerAdmin,
        logoutSuperAdmin,
        saveManualToken,
        isAuthenticated: !!adminUser || (typeof window !== 'undefined' && !!getAdminToken()),
      }}
    >
      {children}
      <ToastContainer
        position="bottom-left"
        theme="dark"
        limit={3}
        autoClose={4000}
        toastStyle={{
          backgroundColor: '#0A1B3D',
          border: '1px solid #12315C',
          color: '#F5F7FA',
        }}
      />
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
