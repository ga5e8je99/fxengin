'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  HiOutlineVideoCamera,
  HiOutlinePlus,
  HiOutlineRefresh,
} from 'react-icons/hi';

import {
  listAllLiveSessions,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession,
  setLiveSessionStatus,
} from '../../services/liveService';
import { useAdmin } from '../../context/AdminContext';
import { API_BASE_URL } from '../../services/apiClient';

import LiveMetricsCards from '../../components/live/LiveMetricsCards';
import LiveFiltersBar from '../../components/live/LiveFiltersBar';
import LiveSessionCard from '../../components/live/LiveSessionCard';
import CreateEditLiveModal from '../../components/live/CreateEditLiveModal';
import LiveStudioControlModal from '../../components/live/LiveStudioControlModal';
import LiveAccessCodesModal from '../../components/live/LiveAccessCodesModal';

export default function LiveStudioPage() {
  const { setIsLoginModalOpen, isAuthenticated } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    streamType: 'ALL',
  });

  // Modal States
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedSessionForEdit, setSelectedSessionForEdit] = useState(null);
  const [studioSessionId, setStudioSessionId] = useState(null);
  const [accessCodesSession, setAccessCodesSession] = useState(null);

  // Fetch all sessions (GET /admin/live)
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await listAllLiveSessions();
      if (res.ok && Array.isArray(res.data)) {
        setSessions(res.data);
        setAuthError(false);
      } else {
        if (res.status === 401) {
          setAuthError(true);
        }
        // Fallback to public /live endpoint if admin returns empty or 401
        const publicRes = await fetch(`${API_BASE_URL}/live`).catch(() => null);
        if (publicRes && publicRes.ok) {
          const publicData = await publicRes.json();
          const combined = [
            ...(publicData.liveNow || []),
            ...(publicData.upcoming || []),
            ...(publicData.replays || []),
          ];
          setSessions(combined);
        }
      }
    } catch {
      toast.error('تعذر الاتصال بخادم البث المباشر');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, isAuthenticated]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      streamType: 'ALL',
    });
    toast.info('تمت إعادة ضبط فلاتر البث');
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = s.title?.toLowerCase().includes(q);
        const matchesDesc = s.description?.toLowerCase().includes(q);
        const matchesInst = s.instructorName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesInst) return false;
      }

      if (filters.status !== 'ALL') {
        if (s.status !== filters.status) return false;
      }

      if (filters.streamType !== 'ALL') {
        if (s.streamType !== filters.streamType) return false;
      }

      return true;
    });
  }, [sessions, filters]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // Create or Update Session (POST /admin/live & PUT /admin/live/{id})
  const handleCreateOrUpdateSession = async (sessionPayload) => {
    setIsSubmitting(true);
    try {
      if (selectedSessionForEdit) {
        const res = await updateLiveSession(selectedSessionForEdit.id, sessionPayload);
        if (res.ok) {
          toast.success('تم تحديث جلسة البث المباشر بنجاح');
          setIsCreateEditOpen(false);
          setSelectedSessionForEdit(null);
          fetchSessions();
        } else {
          if (res.status === 401) {
            setAuthError(true);
            toast.error('غير مصرح: يلزم تسجيل الدخول كمسؤول.');
          } else {
            const errorMsg = Array.isArray(res.data?.message)
              ? res.data.message.join(' | ')
              : (res.data?.message || 'فشل تحديث جلسة البث');
            toast.error(errorMsg);
          }
        }
      } else {
        const res = await createLiveSession(sessionPayload);
        if (res.ok) {
          toast.success('تمت جدولة جلسة البث المباشر بنجاح');
          setIsCreateEditOpen(false);
          fetchSessions();
        } else {
          if (res.status === 401) {
            setAuthError(true);
            toast.error('غير مصرح: يلزم تسجيل الدخول كمسؤول.');
          } else {
            const errorMsg = Array.isArray(res.data?.message)
              ? res.data.message.join(' | ')
              : (res.data?.message || 'فشل إنشاء جلسة البث');
            toast.error(errorMsg);
          }
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ الجلسة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Status (PATCH /admin/live/{id}/status)
  const handleStatusChange = async (sessionId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await setLiveSessionStatus(sessionId, newStatus);
      if (res.ok) {
        toast.success(`تم تغيير حالة البث إلى ${newStatus}`);
        fetchSessions();
      } else {
        if (res.status === 401) {
          setAuthError(true);
          toast.error('غير مصرح: انتهت الجلسة أو يلزم تسجيل دخول المسؤول.');
        } else {
          // Optimistic UI toggle
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
          );
          toast.info(`تم تحديث الحالة: ${newStatus}`);
        }
      }
    } catch {
      toast.error('خطأ أثناء تغيير حالة البث');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Delete Session (DELETE /admin/live/{id})
  const handleDeleteSession = async (session) => {
    if (!confirm(`هل أنت متأكد من حذف جلسة البث "${session.title}" نهائياً؟`)) {
      return;
    }
    try {
      const res = await deleteLiveSession(session.id);
      if (res.ok) {
        toast.success('تم حذف جلسة البث المباشر بنجاح');
        fetchSessions();
      } else {
        if (res.status === 401) {
          setAuthError(true);
          toast.error('غير مصرح: يلزم تسجيل دخول المسؤول.');
        } else {
          toast.error(res.data?.message || 'فشل حذف الجلسة');
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف جلسة البث');
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
            <span className="text-[#F5F7FA]">استوديو البث المباشر</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F7FA]">
              استوديو البث المباشر وغرف التداول الحية
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30 font-tabular flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16C784] animate-ping" />
              <span>LIVE STUDIO</span>
            </span>
          </div>
          <p className="text-xs text-[#A7AFBF] mt-1 max-w-2xl">
            منظومة إدارة البث الحي لغرف التداول، الربط ببرنامج OBS ومفاتيح البث، مراقبة الحضور، وإدارة دردشة المشاهدين.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {mounted && !isAuthenticated && (
            <Link
              href="/login"
              className="px-3.5 py-2.5 rounded-xl bg-accent-hover/20 hover:bg-accent-hover/30 border border-accent-hover/40 text-accent-hover font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <span className="material-symbols-outlined text-[18px]">vpn_key</span>
              <span>تسجيل دخول مسؤول</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setSelectedSessionForEdit(null);
              setIsCreateEditOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#0488F8]/20 transition-all cursor-pointer"
          >
            <HiOutlinePlus className="text-lg" />
            <span>+ جدولة بث مباشر جديد</span>
          </button>

          <button
            type="button"
            onClick={fetchSessions}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-[#F5F7FA] hover:border-[#0488F8] transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <HiOutlineRefresh className={`text-lg ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Security / Auth Banner if 401 */}
      {authError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-amber-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-2xl shrink-0">lock</span>
            <div>
              <p className="font-bold">
                تنبيه أمني: يلزم تصريح مسؤول (Admin Authorization) لجدولة وإدارة البث المباشر
              </p>
              <p className="text-xs text-[#A7AFBF] mt-0.5">
                أنت تشاهد حالياً وضع الاستعراض العام. لإنشاء أو تعديل جلسات البث والتحكم في مفاتيح OBS وروابط RTMP، يرجى تسجيل الدخول أو إدخال رمز JWT.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-canvas-deep font-bold text-xs shrink-0 transition-all cursor-pointer shadow flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">vpn_key</span>
            <span>تسجيل الدخول كمسؤول</span>
          </Link>
        </div>
      )}

      {/* 2. Top Metrics */}
      <LiveMetricsCards sessions={sessions} isLoading={isLoading} />

      {/* 3. Search and Filters */}
      <LiveFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={filteredSessions.length}
      />

      {/* 4. Live Sessions Cards Grid */}
      {filteredSessions.length === 0 ? (
        <div className="surface-card p-12 text-center text-[#A7AFBF] rounded-2xl border border-[#12315C] space-y-3">
          <HiOutlineVideoCamera className="text-4xl text-[#A7AFBF] mx-auto opacity-40" />
          <p className="font-bold text-[#F5F7FA]">لا توجد جلسات بث مباشر مطابقة للبحث</p>
          <p className="text-xs text-[#687287]">
            انقر على &quot;+ جدولة بث مباشر جديد&quot; لبدء بث غرفة تداول حية للطلاب والمتداولين.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => (
            <LiveSessionCard
              key={session.id}
              session={session}
              onOpenStudio={(s) => setStudioSessionId(s.id)}
              onOpenAccessCodes={(s) => setAccessCodesSession(s)}
              onEdit={(s) => {
                setSelectedSessionForEdit(s);
                setIsCreateEditOpen(true);
              }}
              onDelete={handleDeleteSession}
              onStatusChange={handleStatusChange}
              isUpdatingStatus={isUpdatingStatus}
            />
          ))}
        </div>
      )}

      {/* ========================================================
          MODALS & DRAWERS
      ======================================================== */}

      {/* 1. Create / Edit Live Session Modal */}
      <CreateEditLiveModal
        isOpen={isCreateEditOpen}
        onClose={() => {
          setIsCreateEditOpen(false);
          setSelectedSessionForEdit(null);
        }}
        session={selectedSessionForEdit}
        onSubmit={handleCreateOrUpdateSession}
        isSubmitting={isSubmitting}
      />

      {/* 2. Studio Control Room & Live Chat Moderation */}
      <LiveStudioControlModal
        isOpen={Boolean(studioSessionId)}
        onClose={() => setStudioSessionId(null)}
        sessionId={studioSessionId}
        onSessionUpdated={fetchSessions}
      />

      {/* 3. Live Access Codes & Attendees Management Modal */}
      <LiveAccessCodesModal
        isOpen={Boolean(accessCodesSession)}
        onClose={() => {
          setAccessCodesSession(null);
          fetchSessions();
        }}
        sessionId={accessCodesSession?.id}
        sessionTitle={accessCodesSession?.title}
      />
    </div>
  );
}
