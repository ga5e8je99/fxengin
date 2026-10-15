'use client';

import React from 'react';
import Image from 'next/image';
import {
  HiOutlineBookOpen,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineVideoCamera,
  HiStar,
} from 'react-icons/hi';
import { getTierConfig, getDifficultyConfig } from '../../services/coursesService';

export default function CourseCard({
  course,
  onManageCurriculum,
  onEditCourse,
  onManageEnrollments,
  onViewAnalytics,
  onDeleteCourse,
  onTogglePublish,
  isTogglingPublish = false,
}) {
  const tierCfg = getTierConfig(course.accessTier);
  const diffCfg = getDifficultyConfig(course.difficulty);

  const studentsCount = course.enrolledStudentsCount || course.studentsCount || 0;
  const sectionsCount = course.sectionsCount || course.sections?.length || 0;
  const lessonsCount = course.lessonsCount || 0;
  const duration = course.totalDurationMinutes || 0;

  return (
    <div className="surface-card rounded-2xl overflow-hidden border border-[#12315C] hover:border-[#0488F8]/50 transition-all duration-300 flex flex-col group shadow-xl">
      {/* 1. Cover Image & Badges */}
      <div className="relative h-48 w-full bg-[#06142F] overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#06142F] to-[#0A1B3D] text-[#A7AFBF]">
            <HiOutlineVideoCamera className="text-5xl opacity-40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#00030D] via-transparent to-black/40" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2 z-10">
          {/* Difficulty & Tier */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              style={{
                backgroundColor: tierCfg.bgColor,
                color: tierCfg.color,
                borderColor: tierCfg.borderColor,
              }}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md"
            >
              {tierCfg.labelAr}
            </span>

            <span
              style={{
                backgroundColor: diffCfg.bgColor,
                color: diffCfg.color,
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md"
            >
              {diffCfg.labelAr}
            </span>
          </div>

          {/* Publish status toggle button */}
          <button
            type="button"
            onClick={() => onTogglePublish(course.id)}
            disabled={isTogglingPublish}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all shadow cursor-pointer ${
              course.isPublished
                ? 'bg-[#16C784]/25 text-[#16C784] border border-[#16C784]/50 hover:bg-[#16C784]/35'
                : 'bg-[#FB8704]/25 text-[#FB8704] border border-[#FB8704]/50 hover:bg-[#FB8704]/35'
            }`}
            title="انقر لتبديل حالة النشر"
          >
            {course.isPublished ? '● منشور للجمهور' : '○ مسودة (Draft)'}
          </button>
        </div>

        {/* Bottom price tag on image */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          <span className="text-lg font-black text-white font-tabular drop-shadow">
            {course.price > 0 ? `$${course.price}` : 'مجاني'}
          </span>
          {course.discountPrice && course.discountPrice > course.price && (
            <span className="text-xs text-[#A7AFBF] line-through font-tabular">
              ${course.discountPrice}
            </span>
          )}
        </div>

        {/* Rating pill */}
        {course.adminRating && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-[#00030D]/80 backdrop-blur-md px-2 py-0.5 rounded-md text-xs text-[#FBBF24]">
            <HiStar className="text-sm" />
            <span className="font-bold font-tabular">{course.adminRating}</span>
            {course.adminReviewCount && (
              <span className="text-[10px] text-[#A7AFBF]">({course.adminReviewCount})</span>
            )}
          </div>
        )}
      </div>

      {/* 2. Content & Meta */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {course.category && (
            <span className="text-[11px] font-bold text-[#0488F8] tracking-wider uppercase block mb-1">
              {course.category}
            </span>
          )}
          <h3 className="text-base font-bold text-[#F5F7FA] line-clamp-1 group-hover:text-[#0488F8] transition-colors">
            {course.title}
          </h3>
          {course.subtitle && (
            <p className="text-xs text-[#A7AFBF] line-clamp-2 mt-1 leading-relaxed">
              {course.subtitle}
            </p>
          )}
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/50 text-center text-xs text-[#A7AFBF]">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#687287]">الفصول / الحصص</span>
            <span className="font-bold text-[#F5F7FA] font-tabular mt-0.5">
              {sectionsCount} فصول • {lessonsCount} حصة
            </span>
          </div>

          <div className="flex flex-col items-center border-r border-l border-[#12315C]/40">
            <span className="text-[10px] text-[#687287]">الطلاب</span>
            <span className="font-bold text-[#F5F7FA] font-tabular mt-0.5">
              {studentsCount} مسجل
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#687287]">المدة المقدرة</span>
            <span className="font-bold text-[#F5F7FA] font-tabular mt-0.5">
              {duration > 0 ? `${duration} دقيقة` : '—'}
            </span>
          </div>
        </div>

        {/* 3. Action Buttons Grid */}
        <div className="space-y-2 pt-1 border-t border-[#12315C]/60">
          {/* Main Primary Action: Curriculum Builder */}
          <button
            type="button"
            onClick={() => onManageCurriculum(course)}
            className="w-full py-2.5 px-3 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <HiOutlineBookOpen className="text-base" />
            <span>إدارة المنهاج والحصص (Curriculum Editor)</span>
          </button>

          {/* Secondary Actions Row */}
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => onEditCourse(course)}
              className="py-1.5 px-2 rounded-lg bg-[#12315C]/60 hover:bg-[#12315C] text-[#A7AFBF] hover:text-white flex items-center justify-center gap-1 transition-colors"
              title="تعديل بيانات الكورس"
            >
              <HiOutlinePencilAlt />
              <span className="hidden sm:inline">تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => onManageEnrollments(course)}
              className="py-1.5 px-2 rounded-lg bg-[#12315C]/60 hover:bg-[#12315C] text-[#A7AFBF] hover:text-white flex items-center justify-center gap-1 transition-colors"
              title="إدارة الطلاب والاشتراكات"
            >
              <HiOutlineUserGroup />
              <span className="hidden sm:inline">الطلاب</span>
            </button>

            <button
              type="button"
              onClick={() => onViewAnalytics(course)}
              className="py-1.5 px-2 rounded-lg bg-[#12315C]/60 hover:bg-[#12315C] text-[#A7AFBF] hover:text-white flex items-center justify-center gap-1 transition-colors"
              title="تحليلات أداء الكورس"
            >
              <HiOutlineChartBar />
              <span className="hidden sm:inline">تحليلات</span>
            </button>

            <button
              type="button"
              onClick={() => onDeleteCourse(course)}
              className="py-1.5 px-2 rounded-lg bg-[#F6465D]/10 hover:bg-[#F6465D]/20 text-[#F6465D] flex items-center justify-center gap-1 transition-colors font-bold"
              title="حذف الكورس نهائياً"
            >
              <HiOutlineTrash />
              <span className="hidden sm:inline">حذف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
