'use client';

import React from 'react';
import Image from 'next/image';
import {
  HiOutlineBookOpen,
  HiOutlinePencilAlt,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineTrash,
  HiStar,
} from 'react-icons/hi';
import { getTierConfig, getDifficultyConfig } from '../../services/coursesService';

export default function CourseTableView({
  courses = [],
  onManageCurriculum,
  onEditCourse,
  onManageEnrollments,
  onViewAnalytics,
  onDeleteCourse,
  onTogglePublish,
  isTogglingPublish = false,
}) {
  if (courses.length === 0) {
    return (
      <div className="surface-card p-12 text-center text-[#A7AFBF] rounded-2xl border border-[#12315C]">
        لا توجد كورسات تدريبية مطابقة لمعايير البحث.
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden rounded-2xl border border-[#12315C] shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#06142F] text-[#A7AFBF] text-xs font-medium uppercase tracking-wider border-b border-[#12315C]/60 select-none">
              <th className="py-3.5 px-4">الكورس التدريبي</th>
              <th className="py-3.5 px-4">التصنيف والمستوى</th>
              <th className="py-3.5 px-4">الباقة والسعر</th>
              <th className="py-3.5 px-4 text-center">المحتوى</th>
              <th className="py-3.5 px-4 text-center">الطلاب</th>
              <th className="py-3.5 px-4">حالة النشر</th>
              <th className="py-3.5 px-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#12315C]/30 text-xs sm:text-sm">
            {courses.map((course) => {
              const tierCfg = getTierConfig(course.accessTier);
              const diffCfg = getDifficultyConfig(course.difficulty);
              const studentsCount = course.enrolledStudentsCount || course.studentsCount || 0;
              const sectionsCount = course.sectionsCount || course.sections?.length || 0;
              const lessonsCount = course.lessonsCount || 0;

              return (
                <tr key={course.id} className="hover:bg-[#06142F]/60 transition-colors">
                  {/* Course Identity */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-[#12315C] shrink-0 border border-[#12315C]">
                        {course.thumbnailUrl && (
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#F5F7FA] line-clamp-1">
                          {course.title}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#A7AFBF]">
                          {course.adminRating && (
                            <span className="flex items-center text-[#FBBF24]">
                              <HiStar className="text-xs" />
                              <span className="font-bold font-tabular">{course.adminRating}</span>
                            </span>
                          )}
                          <span className="font-mono text-[#0488F8] dir-ltr">{course.slug || course.id}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Difficulty */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-[#F5F7FA]">
                        {course.category || 'عام'}
                      </span>
                      <span
                        style={{ color: diffCfg.color }}
                        className="text-[11px] font-semibold"
                      >
                        {diffCfg.labelAr}
                      </span>
                    </div>
                  </td>

                  {/* Tier & Price */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        style={{
                          backgroundColor: tierCfg.bgColor,
                          color: tierCfg.color,
                          borderColor: tierCfg.borderColor,
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block w-fit"
                      >
                        {tierCfg.labelAr}
                      </span>
                      <span className="font-bold text-[#F5F7FA] font-tabular">
                        {course.price > 0 ? `$${course.price}` : 'مجاني'}
                      </span>
                    </div>
                  </td>

                  {/* Content Stats */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-tabular font-bold text-[#F5F7FA]">
                      {sectionsCount} فصول
                    </span>
                    <span className="text-xs text-[#A7AFBF] block">
                      {lessonsCount} حصة
                    </span>
                  </td>

                  {/* Students */}
                  <td className="py-3.5 px-4 text-center font-tabular font-bold text-[#F5F7FA]">
                    {studentsCount}
                  </td>

                  {/* Publish Status Toggle */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onTogglePublish(course.id)}
                      disabled={isTogglingPublish}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        course.isPublished
                          ? 'bg-[#16C784]/20 text-[#16C784] border border-[#16C784]/40 hover:bg-[#16C784]/30'
                          : 'bg-[#FB8704]/20 text-[#FB8704] border border-[#FB8704]/40 hover:bg-[#FB8704]/30'
                      }`}
                    >
                      {course.isPublished ? 'منشور' : 'مسودة'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onManageCurriculum(course)}
                        className="p-1.5 rounded-lg bg-[#0488F8]/15 hover:bg-[#0488F8]/25 text-[#0488F8] transition-colors"
                        title="إدارة المنهاج والحصص"
                      >
                        <HiOutlineBookOpen className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditCourse(course)}
                        className="p-1.5 rounded-lg bg-[#12315C] hover:bg-[#1A4278] text-[#A7AFBF] hover:text-white transition-colors"
                        title="تعديل بيانات الكورس"
                      >
                        <HiOutlinePencilAlt className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onManageEnrollments(course)}
                        className="p-1.5 rounded-lg bg-[#12315C] hover:bg-[#1A4278] text-[#A7AFBF] hover:text-white transition-colors"
                        title="إدارة الطلاب المسجلين"
                      >
                        <HiOutlineUserGroup className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onViewAnalytics(course)}
                        className="p-1.5 rounded-lg bg-[#12315C] hover:bg-[#1A4278] text-[#A7AFBF] hover:text-white transition-colors"
                        title="تحليلات الأداء"
                      >
                        <HiOutlineChartBar className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteCourse(course)}
                        className="p-1.5 rounded-lg bg-[#F6465D]/10 hover:bg-[#F6465D]/20 text-[#F6465D] transition-colors font-bold"
                        title="حذف الكورس نهائياً"
                      >
                        <HiOutlineTrash className="text-base" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
