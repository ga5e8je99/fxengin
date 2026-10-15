'use client';

import React from 'react';
import Image from 'next/image';
import {
  HiOutlineVideoCamera,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineChatAlt2,
  HiOutlineUsers,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineAdjustments,
  HiOutlinePlay,
  HiOutlineStop,
  HiOutlineTicket,
} from 'react-icons/hi';
import { getLiveStatusConfig } from '../../services/liveService';

export default function LiveSessionCard({
  session,
  onOpenStudio,
  onOpenAccessCodes,
  onEdit,
  onDelete,
  onStatusChange,
  isUpdatingStatus = false,
}) {
  const statusCfg = getLiveStatusConfig(session.status);
  const isLive = session.status === 'LIVE';
  const isScheduled = session.status === 'SCHEDULED';

  const scheduledDate = session.scheduledStartTime
    ? new Date(session.scheduledStartTime).toLocaleString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  return (
    <div className="surface-card rounded-2xl overflow-hidden border border-[#12315C] hover:border-[#0488F8]/50 transition-all duration-300 flex flex-col group shadow-xl">
      {/* 1. Cover Image & Indicators */}
      <div className="relative h-44 w-full bg-[#06142F] overflow-hidden">
        {session.coverImage ? (
          <Image
            src={session.coverImage}
            alt={session.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#06142F] to-[#0A1B3D] text-[#A7AFBF]">
            <HiOutlineVideoCamera className="text-5xl opacity-40" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#00030D] via-transparent to-black/50" />

        {/* Top Badges */}
        <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2 z-10">
          <span
            style={{
              backgroundColor: statusCfg.bgColor,
              color: statusCfg.color,
              borderColor: statusCfg.borderColor,
            }}
            className="px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 shadow"
          >
            {isLive && <span className="w-2 h-2 rounded-full bg-[#16C784] animate-ping" />}
            <span>{statusCfg.labelAr}</span>
          </span>

          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0A1B3D]/80 backdrop-blur-md text-[#0488F8] border border-[#12315C]">
            {session.streamType || 'HLS'}
          </span>
        </div>

        {/* Instructor name */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 text-xs text-white font-medium drop-shadow">
          <HiOutlineUser className="text-sm text-[#0488F8]" />
          <span>{session.instructorName || 'كبير المحللين'}</span>
        </div>
      </div>

      {/* 2. Body Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#F5F7FA] line-clamp-1 group-hover:text-[#0488F8] transition-colors">
            {session.title}
          </h3>
          {session.description && (
            <p className="text-xs text-[#A7AFBF] line-clamp-2 mt-1 leading-relaxed">
              {session.description}
            </p>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 py-2 px-3 rounded-xl bg-[#06142F]/70 border border-[#12315C]/50 text-xs text-[#A7AFBF]">
          <div className="flex items-center gap-1.5">
            <HiOutlineCalendar className="text-[#0488F8]" />
            <span className="font-tabular text-[11px] truncate">{scheduledDate}</span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <HiOutlineChatAlt2 className="text-[#A855F7]" />
            <span className="font-tabular text-[11px]">
              {session.messagesCount || session.totalMessagesCount || 0} رسالة
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <HiOutlineUsers className="text-[#FB8704]" />
            <span className="font-tabular text-[11px]">
              السعة: {session.maxParticipants || 500}
            </span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            {!session.isFree || Number(session.price) > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#FB8704]/20 text-[#FB8704] border border-[#FB8704]/40 font-bold font-tabular">
                ${Number(session.price) || 0} {session.currency || 'USD'}
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30 font-bold">
                متاح مجاناً
              </span>
            )}
          </div>
        </div>

        {/* 3. Actions */}
        <div className="space-y-2 pt-1 border-t border-[#12315C]/60">
          {/* Access Codes & Attendees Management Button */}
          <button
            type="button"
            onClick={() => onOpenAccessCodes && onOpenAccessCodes(session)}
            className="w-full py-2 px-3 rounded-xl bg-[#06142F] hover:bg-[#0A1B3D] border border-[#FB8704]/40 hover:border-[#FB8704] text-[#FB8704] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <HiOutlineTicket className="text-base" />
            <span>
              أكواد الدخول والمشتركين ({session.accessCodesCount ?? session.totalEnrolledCount ?? session._count?.accessCodes ?? 0})
            </span>
          </button>

          {/* Main Action: Open Studio Control Room */}
          <button
            type="button"
            onClick={() => onOpenStudio(session)}
            className="w-full py-2 px-3 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <HiOutlineAdjustments className="text-base" />
            <span>غرفة التحكم وإدارة الدردشة (Studio Control)</span>
          </button>

          {/* Quick status & sub actions */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            {/* Start Live or End Live */}
            {isLive ? (
              <button
                type="button"
                onClick={() => onStatusChange(session.id, 'ENDED')}
                disabled={isUpdatingStatus}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#F6465D]/15 hover:bg-[#F6465D]/25 text-[#F6465D] font-bold flex items-center justify-center gap-1 transition-colors"
                title="إنهاء البث فوراً"
              >
                <HiOutlineStop />
                <span>إنهاء البث</span>
              </button>
            ) : isScheduled ? (
              <button
                type="button"
                onClick={() => onStatusChange(session.id, 'LIVE')}
                disabled={isUpdatingStatus}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#16C784]/15 hover:bg-[#16C784]/25 text-[#16C784] font-bold flex items-center justify-center gap-1 transition-colors"
                title="بدء البث الحي فوراً"
              >
                <HiOutlinePlay />
                <span>بدء البث (Go LIVE)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStatusChange(session.id, 'LIVE')}
                disabled={isUpdatingStatus}
                className="flex-1 py-1.5 px-2 rounded-lg bg-[#12315C] hover:bg-[#1A4278] text-[#A7AFBF] flex items-center justify-center gap-1 transition-colors"
              >
                <span>إعادة البث</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onEdit(session)}
              className="py-1.5 px-3 rounded-lg bg-[#12315C]/60 hover:bg-[#12315C] text-[#A7AFBF] hover:text-white transition-colors"
              title="تعديل الجلسة"
            >
              <HiOutlinePencilAlt className="text-sm" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(session)}
              className="py-1.5 px-3 rounded-lg bg-[#F6465D]/10 hover:bg-[#F6465D]/20 text-[#F6465D] transition-colors"
              title="حذف الجلسة"
            >
              <HiOutlineTrash className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
