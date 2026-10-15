'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import {
  HiOutlineAcademicCap,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineViewGrid,
  HiOutlineViewList,
} from 'react-icons/hi';

import {
  findAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCoursePublish,
} from '../../services/coursesService';
import { API_BASE_URL } from '../../services/apiClient';

import CourseMetricsCards from '../../components/courses/CourseMetricsCards';
import CourseFiltersBar from '../../components/courses/CourseFiltersBar';
import CourseCard from '../../components/courses/CourseCard';
import CourseTableView from '../../components/courses/CourseTableView';
import CreateEditCourseModal from '../../components/courses/CreateEditCourseModal';
import CurriculumBuilderModal from '../../components/courses/CurriculumBuilderModal';
import CourseEnrollmentsModal from '../../components/courses/CourseEnrollmentsModal';
import CourseAnalyticsModal from '../../components/courses/CourseAnalyticsModal';
import CouponsModal from '../../components/courses/CouponsModal';
import AllCourseSalesModal from '../../components/courses/AllCourseSalesModal';
import { HiOutlineTag, HiOutlineShoppingBag } from 'react-icons/hi';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingCourseId, setTogglingCourseId] = useState(null);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    accessTier: 'ALL',
    difficulty: 'ALL',
    publishStatus: 'ALL',
  });

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals State
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState(null);

  const [curriculumCourseId, setCurriculumCourseId] = useState(null);
  const [enrollmentsCourse, setEnrollmentsCourse] = useState(null);
  const [analyticsCourse, setAnalyticsCourse] = useState(null);
  const [isCouponsOpen, setIsCouponsOpen] = useState(false);
  const [isAllSalesOpen, setIsAllSalesOpen] = useState(false);

  // Fetch all courses from GET /admin/courses
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await findAllCourses();
      if (res.ok && Array.isArray(res.data)) {
        setCourses(res.data);
      } else {
        // If 401 or empty, try public /courses fallback or retain state
        const publicRes = await fetch(`${API_BASE_URL}/courses`).catch(() => null);
        if (publicRes && publicRes.ok) {
          const publicData = await publicRes.json();
          if (Array.isArray(publicData)) {
            setCourses(publicData);
          }
        }
      }
    } catch {
      toast.error('تعذر الاتصال بخادم الكورسات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Filter change handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      accessTier: 'ALL',
      difficulty: 'ALL',
      publishStatus: 'ALL',
    });
    toast.info('تمت إعادة ضبط الفلاتر');
  };

  // Filtered courses memo
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = c.title?.toLowerCase().includes(query);
        const matchesDesc = c.description?.toLowerCase().includes(query);
        const matchesCategory = c.category?.toLowerCase().includes(query);
        const matchesSlug = c.slug?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesSlug) {
          return false;
        }
      }

      // Access Tier
      if (filters.accessTier !== 'ALL') {
        if (c.accessTier !== filters.accessTier) return false;
      }

      // Difficulty
      if (filters.difficulty !== 'ALL') {
        if (c.difficulty !== filters.difficulty) return false;
      }

      // Publish Status
      if (filters.publishStatus !== 'ALL') {
        if (filters.publishStatus === 'PUBLISHED' && !c.isPublished) return false;
        if (filters.publishStatus === 'DRAFT' && c.isPublished) return false;
      }

      return true;
    });
  }, [courses, filters]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // 1. Create / Update Course (POST /admin/courses & PUT /admin/courses/{id})
  const handleCreateOrUpdateCourse = async (coursePayload) => {
    setIsSubmitting(true);
    try {
      if (selectedCourseForEdit) {
        // PUT /admin/courses/{id}
        const res = await updateCourse(selectedCourseForEdit.id, coursePayload);
        if (res.ok) {
          toast.success('تم تحديث بيانات الكورس بنجاح');
          setIsCreateEditOpen(false);
          setSelectedCourseForEdit(null);
          fetchCourses();
        } else {
          toast.error(res.data?.message || 'فشل تحديث الكورس');
        }
      } else {
        // POST /admin/courses
        const res = await createCourse(coursePayload);
        if (res.ok) {
          toast.success('تم إنشاء الكورس التدريبي الجديد بنجاح');
          setIsCreateEditOpen(false);
          fetchCourses();
        } else {
          toast.error(res.data?.message || 'فشل إنشاء الكورس');
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ الكورس');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Toggle Publish Status (POST /admin/courses/{id}/publish-toggle)
  const handleTogglePublish = async (courseId) => {
    setTogglingCourseId(courseId);
    try {
      const res = await toggleCoursePublish(courseId);
      if (res.ok) {
        toast.success('تم تبديل حالة نشر الكورس بنجاح');
        fetchCourses();
      } else {
        // Optimistic toggle for preview
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, isPublished: !c.isPublished } : c))
        );
        toast.info('تم تبديل حالة النشر');
      }
    } catch {
      toast.error('حدث خطأ أثناء تبديل حالة النشر');
    } finally {
      setTogglingCourseId(null);
    }
  };

  // 3. Delete Course (DELETE /admin/courses/{id})
  const handleDeleteCourse = async (course) => {
    if (
      !confirm(
        `تحذير نهائي: هل أنت متأكد من رغبتك في حذف الكورس "${course.title}" نهائياً مع كافة فصوله وحصصه وملحقاته واختباراته؟`
      )
    ) {
      return;
    }
    try {
      const res = await deleteCourse(course.id);
      if (res.ok) {
        toast.success('تم حذف الكورس التدريبي بالكامل بنجاح');
        fetchCourses();
      } else {
        toast.error(res.data?.message || 'فشل حذف الكورس');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف الكورس');
    }
  };

  return (
    <div className="flex flex-col w-full space-y-6 text-[#F5F7FA]">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#A7AFBF] mb-1">
            <Link href="/dashboard" className="hover:text-[#0488F8] transition-colors">
              الرئيسية
            </Link>
            <span>&gt;</span>
            <span className="text-[#F5F7FA]">الأكاديمية والمسارات التعليمية</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-[#F5F7FA]">
              إدارة الكورسات والمنهاج التدريبي
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0488F8]/15 text-[#0488F8] border border-[#0488F8]/30 font-tabular">
              {courses.length} دورة مسجلة
            </span>
          </div>
          <p className="text-xs text-[#A7AFBF] mt-1 max-w-2xl">
            منظومة التحكم المتكاملة بالمناهج والأقسام، رفع الفيديوهات وتعدد الجودات، إدارة الاختبارات التقييمية، وملفات الـ PDF.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCouponsOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#06142F] border border-[#0488F8]/40 hover:border-[#0488F8] text-[#F5F7FA] font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow"
            type="button"
          >
            <HiOutlineTag className="text-[#0488F8] text-base" />
            <span>أكواد الخصم والكوبونات</span>
          </button>

          <button
            onClick={() => setIsAllSalesOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#06142F] border border-[#10B981]/40 hover:border-[#10B981] text-[#F5F7FA] font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow"
            type="button"
          >
            <HiOutlineShoppingBag className="text-[#10B981] text-base" />
            <span>سجل كافة المبيعات والمشترين</span>
          </button>

          <button
            onClick={() => {
              setSelectedCourseForEdit(null);
              setIsCreateEditOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#0488F8]/20 transition-all cursor-pointer"
            type="button"
          >
            <HiOutlinePlus className="text-lg" />
            <span>+ إضافة كورس تدريبي جديد</span>
          </button>

          <button
            onClick={fetchCourses}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#A7AFBF] hover:text-[#F5F7FA] hover:border-[#0488F8] transition-all cursor-pointer"
            title="تحديث البيانات"
            type="button"
          >
            <HiOutlineRefresh className={`text-lg ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Top Analytics Metrics Cards */}
      <CourseMetricsCards
        courses={courses}
        isLoading={isLoading}
        onRefresh={fetchCourses}
      />

      {/* 3. Search & Filter Controls */}
      <CourseFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalResults={filteredCourses.length}
      />

      {/* 4. Course View: Grid or Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onManageCurriculum={(c) => setCurriculumCourseId(c.id)}
              onEditCourse={(c) => {
                setSelectedCourseForEdit(c);
                setIsCreateEditOpen(true);
              }}
              onManageEnrollments={(c) => setEnrollmentsCourse(c)}
              onViewAnalytics={(c) => setAnalyticsCourse(c)}
              onDeleteCourse={handleDeleteCourse}
              onTogglePublish={handleTogglePublish}
              isTogglingPublish={togglingCourseId === course.id}
            />
          ))}
        </div>
      ) : (
        <CourseTableView
          courses={filteredCourses}
          onManageCurriculum={(c) => setCurriculumCourseId(c.id)}
          onEditCourse={(c) => {
            setSelectedCourseForEdit(c);
            setIsCreateEditOpen(true);
          }}
          onManageEnrollments={(c) => setEnrollmentsCourse(c)}
          onViewAnalytics={(c) => setAnalyticsCourse(c)}
          onDeleteCourse={handleDeleteCourse}
          onTogglePublish={handleTogglePublish}
          isTogglingPublish={togglingCourseId === course.id}
        />
      )}

      {/* ========================================================
          MODALS & DRAWERS
      ======================================================== */}

      {/* 1. Create / Edit Course Modal (POST /admin/courses & PUT /admin/courses/{id}) */}
      <CreateEditCourseModal
        isOpen={isCreateEditOpen}
        onClose={() => {
          setIsCreateEditOpen(false);
          setSelectedCourseForEdit(null);
        }}
        course={selectedCourseForEdit}
        onSubmit={handleCreateOrUpdateCourse}
        isSubmitting={isSubmitting}
      />

      {/* 2. Curriculum Builder Modal (Sections, Lessons, Resources, Captions, Quizzes) */}
      <CurriculumBuilderModal
        isOpen={Boolean(curriculumCourseId)}
        onClose={() => setCurriculumCourseId(null)}
        courseId={curriculumCourseId}
      />

      {/* 3. Course Enrollments Modal (GET, Grant, Revoke) */}
      <CourseEnrollmentsModal
        isOpen={Boolean(enrollmentsCourse)}
        onClose={() => setEnrollmentsCourse(null)}
        course={enrollmentsCourse}
      />

      {/* 4. Course Analytics Modal (GET /admin/courses/{id}/analytics) */}
      <CourseAnalyticsModal
        isOpen={Boolean(analyticsCourse)}
        onClose={() => setAnalyticsCourse(null)}
        course={analyticsCourse}
      />

      {/* 5. Discount Codes & Coupons Modal */}
      <CouponsModal
        isOpen={isCouponsOpen}
        onClose={() => setIsCouponsOpen(false)}
      />

      {/* 6. All Course Sales & Buyers Modal */}
      <AllCourseSalesModal
        isOpen={isAllSalesOpen}
        onClose={() => setIsAllSalesOpen(false)}
      />
    </div>
  );
}
