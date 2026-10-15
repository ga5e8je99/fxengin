'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  HiOutlineUserAdd,
  HiOutlineDownload,
  HiOutlineKey,
  HiOutlineShieldExclamation,
} from 'react-icons/hi';

import {
  getUsersMetrics,
  getUsersList,
  exportUsers,
  downloadUsersCsv,
  createUser,
  updateUserProfile,
  updateUserStatus,
  updateUserRole,
  adminResetPassword,
  deleteUser,
  bulkDeleteUsers,
  revokeUserSessions,
  getAdminToken,
} from '../../services/usersService';

import UserMetricsCards from '../../components/users/UserMetricsCards';
import UserFiltersBar from '../../components/users/UserFiltersBar';
import UsersTable from '../../components/users/UsersTable';
import CreateUserModal from '../../components/users/CreateUserModal';
import EditUserModal from '../../components/users/EditUserModal';
import UserDetailsModal from '../../components/users/UserDetailsModal';
import {
  UpdateStatusModal,
  UpdateRoleModal,
  ResetPasswordModal,
  DeleteUserModal,
  BulkDeleteModal,
} from '../../components/users/UserActionModals';
import AdminTokenModal from '../../components/users/AdminTokenModal';



export default function UsersPage() {
  // Filters and Pagination State
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    role: 'ALL',
    isActive: 'ALL',
    experienceLevel: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    fromDate: '',
    toDate: '',
  });

  // Data States
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [metrics, setMetrics] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // UI Status
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [inspectUserId, setInspectUserId] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [statusUser, setStatusUser] = useState(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  const [roleUser, setRoleUser] = useState(null);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordResetResult, setPasswordResetResult] = useState(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isSubmittingBulkDelete, setIsSubmittingBulkDelete] = useState(false);

  const [isAdminTokenOpen, setIsAdminTokenOpen] = useState(false);

  // Fetch metrics summary (GET /admin/users/metrics/summary)
  const fetchMetrics = useCallback(async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await getUsersMetrics();
      if (res.ok && res.data) {
        setMetrics(res.data);
      } else if (res.status === 401) {
        setAuthError(true);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingMetrics(false);
    }
  }, []);

  // Fetch users list (GET /admin/users)
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const res = await getUsersList(filters);
      if (res.ok && res.data) {
        setUsers(res.data.items || []);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
        setAuthError(false);
      } else if (res.status === 401) {
        setAuthError(true);
        setUsers([]);
        setPagination({
          page: 1,
          limit: 20,
          totalItems: 0,
          totalPages: 1,
        });
      } else {
        toast.error(res.data?.message || 'فشل جلب قائمة المستخدمين');
      }
    } catch (err) {
      toast.error('تعذر الاتصال بخادم المستخدمين');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Search & Filter Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // reset page to 1 on filter changes
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      role: 'ALL',
      isActive: 'ALL',
      experienceLevel: 'ALL',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      fromDate: '',
      toDate: '',
    });
    setSelectedIds([]);
    toast.info('تمت إعادة ضبط الفلاتر');
  };

  // Selection handlers
  const handleSelectUser = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const currentIds = users.map((u) => u.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...currentIds])));
    } else {
      const currentIds = new Set(users.map((u) => u.id));
      setSelectedIds(selectedIds.filter((id) => !currentIds.has(id)));
    }
  };

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // 1. Export Users (GET /admin/users/export)
  const handleExportUsers = async () => {
    setIsExporting(true);
    toast.info('جاري إعداد تقرير المستخدمين المشفر والآمن...');
    try {
      const res = await exportUsers();
      if (res.ok && Array.isArray(res.data)) {
        const success = downloadUsersCsv(
          res.data,
          `fxengin-users-${new Date().toISOString().split('T')[0]}.csv`
        );
        if (success) {
          toast.success(`تم تصدير الدليل بنجاح (${res.data.length} سجل)`);
        } else {
          toast.warning('لا توجد بيانات مستخدمين لتصديرها');
        }
      } else if (res.status === 401) {
        toast.error('انتهت صلاحية الجلسة، يرجى تحديث توكن المسؤول');
        setIsAdminTokenOpen(true);
      } else {
        // Fallback export with current table records
        downloadUsersCsv(users, `fxengin-users-export.csv`);
        toast.info('تم تصدير السجلات المعروضة محلياً');
      }
    } catch {
      toast.error('حدث خطأ أثناء تصدير ملف المستخدمين');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Create User (POST /admin/users)
  const handleCreateUser = async (userData) => {
    setIsSubmittingCreate(true);
    try {
      const res = await createUser(userData);
      if (res.ok) {
        toast.success(`تم إنشاء حساب المستخدم "${userData.fullName}" بنجاح`);
        setIsCreateOpen(false);
        fetchUsers();
        fetchMetrics();
      } else {
        toast.error(res.data?.message || 'فشل إنشاء المستخدم');
      }
    } catch {
      toast.error('خطأ غير متوقع أثناء إضافة المستخدم');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // 3. Update Profile (PATCH /admin/users/{id})
  const handleUpdateProfile = async (id, updatedFields) => {
    setIsSubmittingEdit(true);
    try {
      const res = await updateUserProfile(id, updatedFields);
      if (res.ok) {
        toast.success('تم تحديث الملف الشخصي للمستخدم بنجاح');
        setEditUser(null);
        fetchUsers();
      } else {
        toast.error(res.data?.message || 'فشل تحديث البيانات');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث بيانات المستخدم');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // 4. Update Status (PATCH /admin/users/{id}/status)
  const handleUpdateStatus = async (id, { isActive, reason }) => {
    setIsSubmittingStatus(true);
    try {
      const res = await updateUserStatus(id, { isActive, reason });
      if (res.ok) {
        toast.success(
          isActive ? 'تمت إعادة تنشيط الحساب بنجاح' : 'تم تجميد / إيقاف الحساب بنجاح'
        );
        setStatusUser(null);
        fetchUsers();
        fetchMetrics();
      } else {
        toast.error(res.data?.message || 'فشل تعديل حالة الحساب');
      }
    } catch {
      toast.error('حدث خطأ أثناء تعديل حالة الحساب');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // 5. Update Role (PATCH /admin/users/{id}/role)
  const handleUpdateRole = async (id, { role }) => {
    setIsSubmittingRole(true);
    try {
      const res = await updateUserRole(id, { role });
      if (res.ok) {
        toast.success(`تم تعديل صلاحية المستخدم إلى ${role} بنجاح`);
        setRoleUser(null);
        fetchUsers();
        fetchMetrics();
      } else {
        toast.error(res.data?.message || 'فشل تعديل صلاحيات المستخدم');
      }
    } catch {
      toast.error('حدث خطأ أثناء ترقية / خفض الرتبة');
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // 6. Reset Password (POST /admin/users/{id}/reset-password)
  const handleResetPassword = async (id, { newPassword, generateRandom }) => {
    setIsSubmittingPassword(true);
    try {
      const res = await adminResetPassword(id, { newPassword, generateRandom });
      if (res.ok && res.data) {
        setPasswordResetResult(res.data);
        toast.success('تمت إعادة ضبط كلمة المرور بنجاح');
      } else {
        toast.error(res.data?.message || 'فشل إعادة ضبط كلمة المرور');
      }
    } catch {
      toast.error('خطأ أثناء تنفيذ إعادة تعيين كلمة المرور');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // 7. Revoke All Sessions (POST /admin/users/{id}/revoke-sessions)
  const handleRevokeSessions = async (user) => {
    if (!confirm(`هل أنت متأكد من تسجيل خروج "${user.fullName || user.email}" إجبارياً من كافة الأجهزة؟`)) {
      return;
    }
    try {
      const res = await revokeUserSessions(user.id);
      if (res.ok) {
        toast.success('تم إبطال جميع الجلسات النشطة للمستخدم بنجاح');
        fetchUsers();
      } else {
        toast.error(res.data?.message || 'فشل إبطال الجلسات');
      }
    } catch {
      toast.error('حدث خطأ أثناء إبطال الجلسات');
    }
  };

  // 8. Delete Single User (DELETE /admin/users/{id})
  const handleDeleteUser = async (id) => {
    setIsSubmittingDelete(true);
    try {
      const res = await deleteUser(id);
      if (res.ok) {
        toast.success('تم حذف حساب المستخدم نهائياً');
        setDeleteTargetUser(null);
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        fetchUsers();
        fetchMetrics();
      } else {
        toast.error(res.data?.message || 'فشل حذف المستخدم');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف المستخدم');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // 9. Bulk Delete (POST /admin/users/bulk-delete)
  const handleConfirmBulkDelete = async (userIds) => {
    setIsSubmittingBulkDelete(true);
    try {
      const res = await bulkDeleteUsers(userIds);
      if (res.ok) {
        toast.success(`تم حذف ${userIds.length} حساب بنجاح وبشكل آمن`);
        setIsBulkDeleteOpen(false);
        setSelectedIds([]);
        fetchUsers();
        fetchMetrics();
      } else {
        toast.error(res.data?.message || 'فشل الحذف الجماعي للحسابات');
      }
    } catch {
      toast.error('حدث خطأ أثناء عملية الحذف الجماعي');
    } finally {
      setIsSubmittingBulkDelete(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6 text-[#F5F7FA]">
      {/* 1. Top Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#A7AFBF] mb-1">
            <Link href="/dashboard" className="hover:text-[#0488F8] transition-colors">
              الرئيسية
            </Link>
            <span>&gt;</span>
            <span className="text-[#F5F7FA]">المستخدمون والمتداولون</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F7FA]">
              إدارة المتداولين والكوادر الفنية
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0488F8]/15 text-[#0488F8] border border-[#0488F8]/30 font-tabular">
              {metrics?.totalUsers
                ? `${metrics.totalUsers.toLocaleString('en-US')} مستخدم`
                : `${pagination.totalItems.toLocaleString('en-US')} مستخدم`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Add User */}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#0488F8]/20 transition-all cursor-pointer"
            type="button"
          >
            <HiOutlineUserAdd className="text-lg" />
            <span>+ إضافة متداول جديد</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportUsers}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-[#F5F7FA] hover:border-[#0488F8] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            type="button"
          >
            <HiOutlineDownload className="text-lg" />
            <span>{isExporting ? 'جاري التصدير...' : 'تصدير تقرير (CSV)'}</span>
          </button>

          {/* Admin Token / Key Config */}
          <button
            onClick={() => setIsAdminTokenOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-[#FB8704] hover:border-[#FB8704]/50 text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer"
            type="button"
            title="تكوين توكن المسؤول (JWT Token)"
          >
            <HiOutlineKey className="text-lg text-[#FB8704]" />
            <span className="hidden md:inline">مفتاح التخويل</span>
          </button>
        </div>
      </div>

      {/* Auth Banner if 401 */}
      {authError && (
        <div className="p-4 rounded-2xl bg-[#FB8704]/10 border border-[#FB8704]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#FB8704] animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <HiOutlineShieldExclamation className="text-2xl shrink-0" />
            <div>
              <p className="font-bold">
                تنبيه أمني: يلزم إدخال رمز وصول مسؤول (Admin JWT Token) للاتصال المباشر بقاعدة البيانات
              </p>
              <p className="text-xs text-[#A7AFBF] mt-0.5">
                يمكنك الضغط على الزر أدناه لتسجيل الدخول أو لصق توكن صالح للوصول إلى كافة نقاط النهاية الـ 13 الحية.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAdminTokenOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#FB8704] text-[#00030D] font-bold text-xs shrink-0 hover:bg-[#E07903] transition-all cursor-pointer shadow"
          >
            تسجيل الدخول / إدخال التوكن
          </button>
        </div>
      )}

      {/* 2. Platform KPI Metrics Cards */}
      <UserMetricsCards
        metrics={metrics}
        isLoading={isLoadingMetrics}
        onRefresh={fetchMetrics}
      />

      {/* 3. Search & Filter Controls */}
      <UserFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalItems={pagination.totalItems}
        isLoading={isLoadingUsers}
      />

      {/* 4. Interactive Users Table */}
      <UsersTable
        users={users}
        pagination={pagination}
        selectedIds={selectedIds}
        onSelectUser={handleSelectUser}
        onSelectAll={handleSelectAll}
        onPageChange={(page) => handleFilterChange('page', page)}
        onLimitChange={(limit) => handleFilterChange('limit', limit)}
        isLoading={isLoadingUsers}
        onInspectUser={(id) => setInspectUserId(id)}
        onEditUser={(user) => setEditUser(user)}
        onChangeRole={(user) => setRoleUser(user)}
        onChangeStatus={(user) => setStatusUser(user)}
        onResetPassword={(user) => {
          setPasswordUser(user);
          setPasswordResetResult(null);
        }}
        onRevokeSessions={handleRevokeSessions}
        onDeleteUser={(user) => setDeleteTargetUser(user)}
        onBulkDelete={() => setIsBulkDeleteOpen(true)}
      />

      {/* ==========================================
          MODALS & DIALOGS
      =========================================== */}

      {/* Create User Modal (POST /admin/users) */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateUser}
        isSubmitting={isSubmittingCreate}
      />

      {/* User Details & Forensic Sessions Modal (GET /admin/users/{id} & GET /admin/users/{id}/sessions) */}
      <UserDetailsModal
        isOpen={Boolean(inspectUserId)}
        onClose={() => setInspectUserId(null)}
        userId={inspectUserId}
      />

      {/* Edit User Modal (PATCH /admin/users/{id}) */}
      <EditUserModal
        isOpen={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSubmit={handleUpdateProfile}
        isSubmitting={isSubmittingEdit}
      />

      {/* Update Status Modal (PATCH /admin/users/{id}/status) */}
      <UpdateStatusModal
        isOpen={Boolean(statusUser)}
        onClose={() => setStatusUser(null)}
        user={statusUser}
        onSubmit={handleUpdateStatus}
        isSubmitting={isSubmittingStatus}
      />

      {/* Update Role Modal (PATCH /admin/users/{id}/role) */}
      <UpdateRoleModal
        isOpen={Boolean(roleUser)}
        onClose={() => setRoleUser(null)}
        user={roleUser}
        onSubmit={handleUpdateRole}
        isSubmitting={isSubmittingRole}
      />

      {/* Reset Password Modal (POST /admin/users/{id}/reset-password) */}
      <ResetPasswordModal
        isOpen={Boolean(passwordUser)}
        onClose={() => {
          setPasswordUser(null);
          setPasswordResetResult(null);
        }}
        user={passwordUser}
        onSubmit={handleResetPassword}
        isSubmitting={isSubmittingPassword}
        resetResult={passwordResetResult}
      />

      {/* Delete Single User Modal (DELETE /admin/users/{id}) */}
      <DeleteUserModal
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        user={deleteTargetUser}
        onConfirm={handleDeleteUser}
        isSubmitting={isSubmittingDelete}
      />

      {/* Bulk Delete Modal (POST /admin/users/bulk-delete) */}
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        selectedIds={selectedIds}
        onConfirm={handleConfirmBulkDelete}
        isSubmitting={isSubmittingBulkDelete}
      />

      {/* Admin Authorization / JWT Token Modal */}
      <AdminTokenModal
        isOpen={isAdminTokenOpen}
        onClose={() => setIsAdminTokenOpen(false)}
        onSuccess={() => {
          fetchUsers();
          fetchMetrics();
        }}
      />
    </div>
  );
}
