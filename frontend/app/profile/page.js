'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiAward,
  FiShield,
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiLogOut,
  FiArrowRight,
  FiLock,
  FiTrendingUp,
  FiPlayCircle,
  FiDownload,
  FiEdit2,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { LuGraduationCap } from 'react-icons/lu';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../utils/toast';
import { getAppRoute } from '../utils/routes';
import { apiFetch } from '../services/apiClient';
import JoinUsSection from '../components/JoinUsSection';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, revokeAllSessions, refetchUser, updateProfile } = useAuth();
  const { t, isAr } = useLanguage();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'courses' | 'certificates' | 'security'

  // Edit profile state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editExperienceLevel, setEditExperienceLevel] = useState('BEGINNER');
  const [profileSaving, setProfileSaving] = useState(false);

  // Security fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Sync profile data from /auth/me on mount
  useEffect(() => {
    if (isAuthenticated) {
      refetchUser?.();
    }
  }, [isAuthenticated]);

  // If user is not logged in, show login prompt
  if (!isAuthenticated || !user) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '460px',
            width: '100%',
            textAlign: 'center',
            padding: '36px 24px',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(251, 135, 4, 0.15)',
              border: '1px solid var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent)',
            }}
          >
            <FiUser size={30} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {isAr ? 'يرجى تسجيل الدخول أولاً' : 'Please Sign In First'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            {isAr
              ? 'تحتاج لتسجيل الدخول أو إنشاء حساب جديد للوصول إلى لوحة تحكم حسابك وكورساتك الخاصة.'
              : 'You need to sign in or create an account to view your profile dashboard and enrolled courses.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/login" className="btn-primary" style={{ padding: '0 24px', height: '42px', textDecoration: 'none' }}>
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <Link href="/register" className="btn-secondary" style={{ padding: '0 24px', height: '42px', textDecoration: 'none' }}>
              {isAr ? 'إنشاء حساب جديد' : 'Register'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showToast.error(isAr ? 'يرجى ملء جميع حقول كلمة المرور' : 'Please fill all password fields');
      return;
    }
    if (newPassword.length < 8) {
      showToast.error(isAr ? 'يجب ألا تقل كلمة المرور الجديدة عن 8 خانات' : 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast.error(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    setPassLoading(true);
    try {
      const res = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || (isAr ? 'فشل تغيير كلمة المرور' : 'Failed to update password'));
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast.success(data.message || (isAr ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully'));
    } catch (err) {
      showToast.error(err.message || (isAr ? 'كلمة المرور الحالية غير صحيحة' : 'Incorrect current password'));
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast.info(isAr ? 'تم تسجيل الخروج بنجاح' : 'Logged out successfully');
    router.push('/');
  };

  const handleRevokeAll = async () => {
    setRevokeLoading(true);
    try {
      await revokeAllSessions();
      showToast.info(isAr ? 'تم إنهاء كافة الجلسات وتسجيل الخروج' : 'All active sessions revoked');
      router.push('/login');
    } catch (e) {
      console.warn('Revoke all failed:', e);
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditFullName(user?.fullName || '');
    setEditPhoneNumber(user?.phoneNumber || '');
    setEditExperienceLevel(user?.experienceLevel || 'BEGINNER');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setProfileSaving(true);
    try {
      const res = await updateProfile({
        fullName: editFullName.trim(),
        phoneNumber: editPhoneNumber.trim(),
        experienceLevel: editExperienceLevel,
      });
      if (res?.success) {
        showToast.success(isAr ? 'تم حفظ وتحديث بياناتك بنجاح' : 'Profile updated successfully');
        setIsEditingProfile(false);
        refetchUser?.();
      } else {
        showToast.error(res?.message || (isAr ? 'فشل حفظ التعديلات' : 'Failed to save changes'));
      }
    } catch (err) {
      showToast.error(isAr ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving');
    } finally {
      setProfileSaving(false);
    }
  };

  // Level badge helper
  const getLevelLabel = (level) => {
    switch (level) {
      case 'ADVANCED':
        return isAr ? 'محترف / متقدم' : 'Pro / Advanced';
      case 'INTERMEDIATE':
        return isAr ? 'متوسط' : 'Intermediate';
      default:
        return isAr ? 'مبتدئ' : 'Beginner';
    }
  };

  const enrolledCourses = Array.isArray(user?.enrolledCourses) ? user.enrolledCourses : [];
  const totalCompletedHours = enrolledCourses.reduce((sum, c) => sum + (Number(c.hours) || 0), 0);
  const issuedCertificates = enrolledCourses.filter((c) => c.progress === 100 || c.certificateIssued);
  const avgCompletion = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((sum, c) => sum + (Number(c.progress) || 0), 0) / enrolledCourses.length)
    : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 90% 50% at 50% 0%, rgba(4, 136, 248, 0.08) 0%, transparent 70%), var(--bg-dark)',
        padding: '30px 0 80px',
      }}
    >
      <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* ── Top Breadcrumb & Actions Bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <Link
            href={getAppRoute('/', user)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'color 0.15s ease',
            }}
          >
            <FiArrowRight size={15} style={{ transform: isAr ? 'none' : 'rotate(180deg)' }} />
            <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(246, 70, 93, 0.1)',
              border: '1px solid rgba(246, 70, 93, 0.3)',
              color: 'var(--error)',
              padding: '7px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FiLogOut size={14} />
            <span>{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>

        {/* ── Hero Profile Card ── */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.95) 0%, rgba(1, 7, 30, 0.95) 100%)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '28px',
            boxShadow: '0 16px 40px rgba(0, 3, 13, 0.6)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glow */}
          <div aria-hidden style={{
            position: 'absolute',
            top: '-20%',
            insetInlineEnd: '-10%',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(251, 135, 4, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
            {/* User Info Left */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              {/* Avatar Initials */}
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '18px',
                  background: 'var(--accent-gradient)',
                  color: '#FFFFFF',
                  fontSize: '28px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(251, 135, 4, 0.35)',
                  flexShrink: 0,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'FX'}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {user.fullName || (isAr ? 'عضو أكاديمية FXENGIN' : 'FXENGIN Trader')}
                  </h1>
                  <span
                    className="badge badge-vip"
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <FiShield size={12} />
                    {user.role || 'USER'}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--primary)',
                      background: 'rgba(4, 136, 248, 0.12)',
                      border: '1px solid rgba(4, 136, 248, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {getLevelLabel(user.experienceLevel)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FiMail size={13} color="var(--text-muted)" />
                    {user.email}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <FiPhone size={13} color="var(--text-muted)" />
                    {user.phoneNumber || (isAr ? 'غير محدد' : 'N/A')}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status & Admin Actions Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.isAdmin) && (
                <a
                  href={process.env.NEXT_PUBLIC_ADMIN_URL || (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') ? 'http://186.240.145.87:3005' : 'http://localhost:3001')}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(251, 135, 4, 0.25) 0%, rgba(251, 135, 4, 0.1) 100%)',
                    border: '1px solid var(--accent)',
                    borderRadius: '10px',
                    padding: '10px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(251, 135, 4, 0.25)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiShield size={16} color="var(--accent)" />
                  <span>{isAr ? 'لوحة تحكم الإدارة' : 'Admin Panel'}</span>
                </a>
              )}

              <div
                style={{
                  background: 'rgba(22, 199, 132, 0.12)',
                  border: '1px solid rgba(22, 199, 132, 0.35)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FiCheckCircle size={18} color="var(--success)" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>
                    {isAr ? 'حساب نشط ومفعل' : 'Active Account'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isAr ? 'وصول كامل للأكاديمية' : 'Full Academy Access'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KPI Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {[
              { label: isAr ? 'الكورسات المسجلة' : 'Enrolled Courses', value: `${enrolledCourses.length}`, icon: <FiBookOpen color="var(--primary)" /> },
              { label: isAr ? 'ساعات التعلم المكتملة' : 'Completed Hours', value: `${totalCompletedHours}h`, icon: <FiClock color="var(--accent)" /> },
              { label: isAr ? 'الشهادات المعتمدة' : 'Certificates', value: `${issuedCertificates.length}`, icon: <FiAward color="var(--success)" /> },
              { label: isAr ? 'متوسط نسبة الإنجاز' : 'Avg. Completion', value: `${avgCompletion}%`, icon: <FiTrendingUp color="#38BDF8" /> },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                    {value}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs Navigation ── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid var(--border)',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {[
            { id: 'overview', label: isAr ? 'البيانات الشخصية' : 'Personal Details', icon: <FiUser size={15} /> },
            { id: 'courses', label: isAr ? 'دوراتي التدريبية' : 'My Courses', icon: <FiBookOpen size={15} /> },
            { id: 'certificates', label: isAr ? 'الشهادات والإنجازات' : 'Certificates', icon: <FiAward size={15} /> },
            { id: 'affiliate', label: isAr ? 'برنامج الشركاء (10% عمولة)' : 'Affiliate (10%)', icon: <FiTrendingUp size={15} /> },
            { id: 'security', label: isAr ? 'الأمان وكلمة المرور' : 'Security & Password', icon: <FiLock size={15} /> },
          ].map(({ id, label, icon }) => {
            const isTabActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px 8px 0 0',
                  background: isTabActive ? 'rgba(4, 136, 248, 0.12)' : 'transparent',
                  border: 'none',
                  borderBottom: isTabActive ? '2px solid var(--primary)' : '2px solid transparent',
                  color: isTabActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '14px',
                  fontWeight: isTabActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════ TAB 1: OVERVIEW & PERSONAL DETAILS (IMPORTANT INFO ONLY) ══════════════ */}
        {activeTab === 'overview' && (
          <div className="card" style={{ padding: '24px', background: 'var(--surface-elevated)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {isAr ? 'معلومات الحساب الأساسية' : 'Account Information'}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  {isAr ? 'البيانات المسجلة لحسابك في منصة FXENGIN' : 'Your registered credentials on FXENGIN Platform'}
                </p>
              </div>

              {!isEditingProfile ? (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(4, 136, 248, 0.12)',
                    border: '1px solid var(--primary)',
                    color: 'var(--primary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <FiEdit2 size={14} />
                  <span>{isAr ? 'تعديل البيانات' : 'Edit Profile'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <FiX size={14} />
                  <span>{isAr ? 'إلغاء' : 'Cancel'}</span>
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      {isAr ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input
                      type="text"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      placeholder={isAr ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      {isAr ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      placeholder={isAr ? '+201xxxxxxxxx أو +966xxxxxxxxx' : '+1234567890'}
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: 600 }}>
                      {isAr ? 'مستوى التداول' : 'Trading Experience Level'}
                    </label>
                    <select
                      value={editExperienceLevel}
                      onChange={(e) => setEditExperienceLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    >
                      <option value="BEGINNER">{isAr ? 'مبتدئ (Beginner)' : 'Beginner'}</option>
                      <option value="INTERMEDIATE">{isAr ? 'متوسط (Intermediate)' : 'Intermediate'}</option>
                      <option value="ADVANCED">{isAr ? 'محترف / متقدم (Advanced)' : 'Advanced'}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="btn-primary"
                    style={{
                      padding: '0 24px',
                      height: '42px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 700,
                    }}
                  >
                    <FiCheck size={16} />
                    <span>{profileSaving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {[
                  { label: isAr ? 'الاسم الكامل' : 'Full Name', value: user.fullName || '—' },
                  { label: isAr ? 'البريد الإلكتروني' : 'Email Address', value: user.email || '—' },
                  { label: isAr ? 'رقم الهاتف' : 'Phone Number', value: user.phoneNumber || '—' },
                  { label: isAr ? 'مستوى التداول' : 'Trading Level', value: getLevelLabel(user.experienceLevel) },
                  { label: isAr ? 'نوع الحساب' : 'Role', value: (user.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : (user.role === 'ADMIN' ? 'ADMIN' : (user.role || 'USER'))), color: (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') ? 'var(--accent)' : undefined },
                  { label: isAr ? 'تاريخ الانضمام' : 'Member Since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '2026' },
                  { label: isAr ? 'حالة الحساب' : 'Account Status', value: isAr ? 'نشط وموثق' : 'Active & Verified', color: 'var(--success)' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                    }}
                  >
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '5px' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '14.5px', fontWeight: 600, color: color || 'var(--text-primary)' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB 2: MY ENROLLED COURSES ══════════════ */}
        {activeTab === 'courses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {enrolledCourses.length === 0 ? (
              <div
                className="card"
                style={{
                  background: 'var(--surface-elevated)',
                  borderRadius: '16px',
                  border: '1px dashed var(--border)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '14px',
                    background: 'rgba(4, 136, 248, 0.1)',
                    border: '1px solid rgba(4, 136, 248, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <FiBookOpen size={26} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {isAr ? 'لا توجد دورات تدريبية مسجلة حالياً' : 'No Enrolled Courses Yet'}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '440px', lineHeight: 1.6 }}>
                    {isAr
                      ? 'لم تقم بالتسجيل في أي دورة بعد. استكشف دورات الأكاديمية الاحترافية وابدأ رحلتك التعليمية الآن.'
                      : 'You have not enrolled in any courses yet. Explore our professional academy courses and start learning today.'}
                  </p>
                </div>
                <Link
                  href={getAppRoute('/courses', user)}
                  className="btn-primary"
                  style={{
                    height: '40px',
                    padding: '0 20px',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    marginTop: '4px',
                  }}
                >
                  <FiPlayCircle size={16} />
                  <span>{isAr ? 'تصفح دورات الأكاديمية' : 'Browse Academy Courses'}</span>
                </Link>
              </div>
            ) : (
              enrolledCourses.map((course) => (
                <div
                  key={course.id}
                  className="card"
                  style={{
                    background: 'var(--surface-elevated)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    padding: '20px',
                    display: 'flex',
                    gap: '20px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Course Thumbnail */}
                  <div
                    style={{
                      width: '160px',
                      height: '100px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      position: 'relative',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={course.img}
                      alt={course.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#FFF',
                        fontWeight: 700,
                      }}
                    >
                      {course.category}
                    </div>
                  </div>

                  {/* Course Info */}
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {isAr ? course.title : (course.titleEn || course.title)}
                      </h4>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      {isAr ? `المدرب: ${course.instructor} • آخر درس: ${course.lastLesson}` : `Instructor: ${course.instructor} • Last lesson: ${course.lastLesson}`}
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>{isAr ? `التقدم: ${course.completedLessons} من ${course.totalLessons} درساً` : `Progress: ${course.completedLessons}/${course.totalLessons} lessons`}</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{course.progress}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${course.progress}%`,
                            height: '100%',
                            background: 'var(--primary-gradient)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* CTA Action */}
                  <div>
                    <Link
                      href={getAppRoute(`/courses/${course.id}/learn`, user)}
                      className="btn-primary"
                      style={{
                        height: '40px',
                        padding: '0 20px',
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <FiPlayCircle size={16} />
                      <span>{isAr ? 'متابعة التعلم' : 'Continue Learning'}</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════════════ TAB 3: CERTIFICATES & ACHIEVEMENTS ══════════════ */}
        {activeTab === 'certificates' && (
          <div className="card" style={{ padding: '24px', background: 'var(--surface-elevated)', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {isAr ? 'شهادات الإتمام المعتمدة' : 'Verified Certificates of Completion'}
            </h3>

            {issuedCertificates.length === 0 ? (
              <div
                style={{
                  border: '1px dashed var(--border)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: 'rgba(22, 199, 132, 0.1)',
                    border: '1px solid rgba(22, 199, 132, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--success)',
                  }}
                >
                  <LuGraduationCap size={28} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {isAr ? 'لا توجد شهادات صادرة بعد' : 'No Certificates Issued Yet'}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '420px', lineHeight: 1.6 }}>
                    {isAr
                      ? 'ستحصل على شهادة إتمام معتمدة وموثقة برقم تسلسلي فور إكمالك 100% من محاضرات واختبارات أي دورة تدريبية.'
                      : 'You will receive a verified certificate with a serial number upon completing 100% of any enrolled course.'}
                  </p>
                </div>
                <Link
                  href={getAppRoute('/courses', user)}
                  className="btn-secondary"
                  style={{
                    height: '38px',
                    padding: '0 18px',
                    fontSize: '13px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'none',
                    marginTop: '4px',
                  }}
                >
                  <FiBookOpen size={14} color="var(--accent)" />
                  <span>{isAr ? 'استعراض الدورات المتاحة' : 'Browse Available Courses'}</span>
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {issuedCertificates.map((cert) => (
                  <div
                    key={cert.id}
                    style={{
                      border: '1px solid rgba(22, 199, 132, 0.3)',
                      background: 'rgba(22, 199, 132, 0.05)',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '12px',
                          background: 'rgba(22, 199, 132, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--success)',
                        }}
                      >
                        <LuGraduationCap size={28} />
                      </div>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {isAr ? `شهادة إتمام ${cert.title}` : `Certificate of Completion: ${cert.titleEn || cert.title}`}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                          {isAr ? `صادرة للمتدرب: ${user.fullName}` : `Issued to: ${user.fullName}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => showToast.success(isAr ? 'جاري تجهيز وتحميل الشهادة PDF...' : 'Preparing certificate download...')}
                      className="btn-secondary"
                      style={{
                        height: '38px',
                        padding: '0 16px',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <FiDownload size={14} />
                      <span>{isAr ? 'تحميل الشهادة PDF' : 'Download PDF'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB 4: SECURITY & PASSWORD ══════════════ */}
        {activeTab === 'security' && (
          <div
            className="card"
            style={{
              padding: 'clamp(28px, 4vw, 40px)',
              background: 'var(--surface-elevated)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              maxWidth: '760px',
              margin: '10px auto 40px auto',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04)',
            }}
          >
            {/* Header with Shield Icon Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(4, 136, 248, 0.22), rgba(4, 136, 248, 0.06))',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  boxShadow: '0 0 20px rgba(4, 136, 248, 0.2)',
                  flexShrink: 0,
                }}
              >
                <FiShield size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                  {isAr ? 'أمان الحساب وكلمة المرور' : 'Account Security & Password'}
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {isAr
                    ? 'قم بتحديث كلمة المرور بانتظام لحماية حسابك واستثماراتك وبياناتك الشخصية'
                    : 'Update your password regularly to protect your account, trading data, and personal information.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 136, 248, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 136, 248, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(4, 136, 248, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={passLoading}
                style={{
                  height: '46px',
                  marginTop: '8px',
                  justifyContent: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: passLoading ? 'not-allowed' : 'pointer',
                  width: '100%',
                }}
              >
                <FiLock size={16} />
                <span>{passLoading ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}</span>
              </button>
            </form>

            {/* Global Logout / Revoke All Sessions */}
            <div
              style={{
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(246, 70, 93, 0.1)',
                    border: '1px solid rgba(246, 70, 93, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--error)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <FiLogOut size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {isAr ? 'جلسات التداول النشطة والأجهزة' : 'Active Trader Sessions'}
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {isAr
                      ? 'تسجيل الخروج وإنهاء صلاحية الوصول لجميع الجلسات المفتوحة على كافة الأجهزة والمتصفحات فوراً.'
                      : 'Revoke all active trader sessions across all devices and browsers immediately.'}
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleRevokeAll}
                  disabled={revokeLoading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: 'rgba(246, 70, 93, 0.12)',
                    border: '1px solid rgba(246, 70, 93, 0.35)',
                    color: 'var(--error)',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: revokeLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(246, 70, 93, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(246, 70, 93, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(246, 70, 93, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(246, 70, 93, 0.35)';
                  }}
                >
                  <FiLogOut size={15} />
                  <span>
                    {revokeLoading
                      ? (isAr ? 'جاري إنهاء الجلسات...' : 'Revoking sessions...')
                      : (isAr ? 'تسجيل الخروج من كافة الأجهزة (Global Logout)' : 'Logout from all devices (Global Logout)')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ TAB 5: AFFILIATE & PARTNER PROGRAM ══════════════ */}
        {activeTab === 'affiliate' && (
          <div style={{ marginTop: '12px' }}>
            <JoinUsSection onlyLoggedIn={false} showHeader={false} />
          </div>
        )}

      </div>
    </div>
  );
}
