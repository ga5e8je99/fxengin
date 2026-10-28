'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  IoCalendarOutline,
  IoLocationOutline,
  IoPeopleOutline,
  IoCashOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoSparklesOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoEyeOutline,
  IoCloseCircleOutline,
  IoVideocamOutline,
  IoRestaurantOutline,
  IoMicOutline,
  IoGiftOutline,
  IoTvOutline,
  IoFlameOutline,
  IoPencilOutline,
  IoTrashOutline,
} from 'react-icons/io5';

export default function BrokerEventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/brokers/events', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setEvents(data.data || []);
      } else {
        toast.error('تعذر جلب طلبات الإيفينتات');
      }
    } catch (e) {
      toast.error('خطأ في الاتصال بقاعدة بيانات الإيفينتات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleUpdateStatus = async (eventId, newStatus, customNotes = null) => {
    setSavingStatus(true);
    try {
      const payload = {
        id: eventId,
        status: newStatus,
      };
      if (customNotes !== null) {
        payload.adminNotes = customNotes;
      }
      const res = await fetch('/api/brokers/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم تحديث حالة الإيفينت إلى: ${newStatus}`);
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: newStatus, adminNotes: customNotes ?? e.adminNotes } : e))
        );
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent((prev) => ({ ...prev, status: newStatus, adminNotes: customNotes ?? prev.adminNotes }));
        }
      } else {
        toast.error(data.error || 'تعذر تحديث الحالة');
      }
    } catch {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف طلب هذا الإيفينت؟')) return;
    try {
      const res = await fetch(`/api/brokers/events?id=${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('تم حذف طلب الإيفينت');
        setEvents((prev) => prev.filter((e) => e.id !== eventId));
        setIsDetailModalOpen(false);
      } else {
        toast.error(data.error || 'تعذر الحذف');
      }
    } catch {
      toast.error('خطأ أثناء الحذف');
    }
  };

  // Filtered Events
  const filtered = events.filter((e) => {
    const matchesSearch =
      !searchTerm ||
      e.titleAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.brokerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalEvents = events.length;
  const approvedCount = events.filter((e) => e.status === 'APPROVED').length;
  const inPlanningCount = events.filter((e) => e.status === 'IN_PLANNING').length;
  const newRequestsCount = events.filter((e) => e.status === 'NEW_REQUEST' || e.status === 'PENDING_REVIEW').length;
  const totalBudgets = events.reduce((acc, e) => acc + (Number(e.budgetUsd) || 0), 0);

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. Header & KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>إجمالي طلبات الإيفينتات</span>
            <IoCalendarOutline className="text-primary text-base" />
          </div>
          <div className="text-2xl font-black text-text-primary">{totalEvents}</div>
          <div className="text-xs text-text-secondary mt-1">فعاليات مسجلة من الوسطاء</div>
        </div>

        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>طلبات جديدة قيد الدراسة</span>
            <IoTimeOutline className="text-amber-500 text-base" />
          </div>
          <div className="text-2xl font-black text-amber-500">{newRequestsCount}</div>
          <div className="text-xs text-text-secondary mt-1">بحاجة لمراجعة فريق المؤتمرات</div>
        </div>

        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>معتمد ومجدول رسمياً</span>
            <IoCheckmarkCircleOutline className="text-bullish-up text-base" />
          </div>
          <div className="text-2xl font-black text-bullish-up">{approvedCount + inPlanningCount}</div>
          <div className="text-xs text-text-secondary mt-1">جاري التنفيذ وحجز القاعات</div>
        </div>

        <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4">
          <div className="text-telemetry-micro text-text-secondary font-bold uppercase mb-1 flex items-center justify-between">
            <span>الميزانية المرصودة من الوسطاء</span>
            <IoCashOutline className="text-accent text-base" />
          </div>
          <div className="text-2xl font-black text-accent">${totalBudgets.toLocaleString()}</div>
          <div className="text-xs text-text-secondary mt-1">إجمالي تكلفة الرعايات المقترحة</div>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-surface-container-low border border-border-structural/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="البحث بالوسيط، عنوان الإيفينت، أو المدينة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-sm text-text-primary focus:outline-none"
          >
            <option value="ALL">كافة الحالات</option>
            <option value="NEW_REQUEST">طلبات جديدة</option>
            <option value="PENDING_REVIEW">قيد الدراسة</option>
            <option value="IN_PLANNING">معتمد - قيد التنسيق</option>
            <option value="APPROVED">معتمد ومجدول</option>
            <option value="COMPLETED">مكتمل</option>
          </select>
        </div>

        <button
          onClick={loadEvents}
          className="flex items-center gap-1.5 px-3 py-2 bg-surface-container border border-border-structural/80 hover:bg-surface-container-high rounded-lg text-xs font-bold text-text-primary"
        >
          <IoRefreshOutline size={15} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      {/* 3. Events Grid */}
      {loading ? (
        <div className="text-center py-12 text-text-secondary">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-2"></div>
          <div>جاري تحميل طلبات الإيفينتات...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-low border border-dashed border-border-structural/80 rounded-xl p-12 text-center text-text-secondary">
          <IoCalendarOutline className="mx-auto text-4xl mb-3 text-text-tertiary" />
          <div className="font-bold text-base text-text-primary mb-1">لا توجد طلبات إيفينتات مطابقة</div>
          <div className="text-sm">لم يقم الوسطاء بتسجيل فعاليات تطابق معايير البحث الحالية.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((evt) => (
            <div
              key={evt.id}
              className={`bg-surface-container-low border rounded-xl p-5 flex flex-col justify-between transition-all hover:border-primary/50 ${
                evt.isVipEvent ? 'border-accent/40 shadow-lg shadow-accent/5' : 'border-border-structural/80'
              }`}
            >
              <div>
                {/* Header: Broker & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {evt.brokerName}
                  </span>

                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                      evt.status === 'APPROVED'
                        ? 'bg-bullish-up/10 text-bullish-up border-bullish-up/30'
                        : evt.status === 'IN_PLANNING'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                        : 'bg-primary/10 text-primary border-primary/30'
                    }`}
                  >
                    {evt.status === 'APPROVED'
                      ? 'معتمد ومجدول'
                      : evt.status === 'IN_PLANNING'
                      ? 'قيد التنسيق والحجز'
                      : 'طلب جديد'}
                  </span>
                </div>

                <h3 className="font-bold text-text-primary text-base line-clamp-2 mb-2">
                  {evt.titleAr}
                </h3>

                <p className="text-xs text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                  {evt.descriptionAr || 'ملتقى تداولي استراتيجي بحضور نخبة المتداولين.'}
                </p>

                {/* Event Specifications */}
                <div className="bg-surface-container-lowest/60 border border-border-structural/50 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-text-tertiary block">الميعاد:</span>
                    <span className="font-bold text-text-primary flex items-center gap-1 mt-0.5">
                      <IoCalendarOutline className="text-accent" /> {evt.eventDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-tertiary block">المكان:</span>
                    <span className="font-bold text-text-primary flex items-center gap-1 mt-0.5">
                      <IoLocationOutline className="text-primary" /> {evt.city}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-tertiary block">عدد الحضور:</span>
                    <span className="font-bold text-bullish-up flex items-center gap-1 mt-0.5">
                      <IoPeopleOutline /> {evt.expectedAttendees} شخص
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-text-tertiary block">التكلفة / الميزانية:</span>
                    <span className="font-bold text-accent flex items-center gap-1 mt-0.5">
                      <IoCashOutline /> ${(Number(evt.budgetUsd) || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* VIP Invitation Pill */}
                <div
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg mb-3 font-bold ${
                    evt.isVipEvent
                      ? 'bg-accent/10 border border-accent/25 text-accent'
                      : 'bg-primary/10 border border-primary/25 text-primary'
                  }`}
                >
                  <IoSparklesOutline />
                  <span>
                    {evt.invitationType === 'VIP_INVITATIONS_ONLY'
                      ? 'دعاوي VIP حصرية فقط'
                      : evt.invitationType === 'HYBRID_VIP_PUBLIC'
                      ? 'مقاعد VIP + تسجيل عام'
                      : 'دعوات عامة مفتوحة'}
                  </span>
                </div>

                {/* Service Icons */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {evt.servicesRequested?.catering && (
                    <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded text-text-secondary flex items-center gap-1">
                      <IoRestaurantOutline className="text-accent" /> ضيافة
                    </span>
                  )}
                  {evt.servicesRequested?.mediaCoverage && (
                    <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded text-text-secondary flex items-center gap-1">
                      <IoVideocamOutline className="text-primary" /> تصوير 4K
                    </span>
                  )}
                  {evt.servicesRequested?.liveStreaming && (
                    <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded text-text-secondary flex items-center gap-1">
                      <IoTvOutline className="text-bullish-up" /> بث مباشر
                    </span>
                  )}
                  {evt.servicesRequested?.fxenginSpeakers && (
                    <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded text-text-secondary flex items-center gap-1">
                      <IoMicOutline className="text-blue-400" /> متحدثو المنظومة
                    </span>
                  )}
                  {evt.servicesRequested?.giveaways && (
                    <span className="text-[10px] px-2 py-0.5 bg-surface-container rounded text-text-secondary flex items-center gap-1">
                      <IoGiftOutline className="text-amber-400" /> هدايا
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border-structural/60 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEvent(evt);
                    setAdminNotesInput(evt.adminNotes || '');
                    setIsDetailModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-3 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-text-primary flex items-center justify-center gap-1"
                >
                  <IoEyeOutline size={14} />
                  <span>الملف الكامل والملاحظات</span>
                </button>

                {evt.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(evt.id, 'APPROVED')}
                    className="py-1.5 px-3 bg-bullish-up/15 hover:bg-bullish-up/25 text-bullish-up border border-bullish-up/30 rounded-lg text-xs font-bold"
                    title="اعتماد الإيفينت"
                  >
                    اعتماد
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Event Dossier & Admin Feedback Modal */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas-deep/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-container-low border border-border-structural rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-on-surface shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border-structural/60 mb-5">
              <div>
                <span className="text-xs font-bold text-accent">{selectedEvent.id} • {selectedEvent.brokerName}</span>
                <h3 className="font-bold text-lg text-text-primary mt-1">{selectedEvent.titleAr}</h3>
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <IoCloseCircleOutline size={24} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-surface-container-lowest/70 border border-border-structural/60 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-text-tertiary block">الميعاد:</span>
                  <span className="font-bold text-text-primary block mt-0.5">{selectedEvent.eventDate}</span>
                  <span className="text-text-secondary">{selectedEvent.startTime} - {selectedEvent.endTime}</span>
                </div>

                <div>
                  <span className="text-text-tertiary block">المكان والقاعة:</span>
                  <span className="font-bold text-text-primary block mt-0.5">{selectedEvent.city}</span>
                  <span className="text-text-secondary">{selectedEvent.venueName || 'لم تحدد'}</span>
                </div>

                <div>
                  <span className="text-text-tertiary block">العدد المتوقع:</span>
                  <span className="font-bold text-bullish-up text-base block mt-0.5">{selectedEvent.expectedAttendees} شخص</span>
                </div>

                <div>
                  <span className="text-text-tertiary block">الميزانية المرصودة:</span>
                  <span className="font-bold text-accent text-base block mt-0.5">${(Number(selectedEvent.budgetUsd) || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* VIP Details */}
              <div className="p-3.5 bg-accent/10 border border-accent/25 rounded-xl">
                <div className="font-bold text-accent mb-1 flex items-center gap-1.5">
                  <IoSparklesOutline />
                  <span>طبيعة الدعوات وهل الحضور VIP:</span>
                </div>
                <div className="text-xs text-text-primary">
                  {selectedEvent.invitationType === 'VIP_INVITATIONS_ONLY'
                    ? 'دعاوي VIP حصرية فقط لكبار الشخصيات والمودعين'
                    : selectedEvent.invitationType === 'HYBRID_VIP_PUBLIC'
                    ? 'مقاعد VIP أمامية مخصصة + دعوات عامة'
                    : 'دعوات عامة ومفتوحة لجميع المتداولين'}
                </div>
                {Array.isArray(selectedEvent.vipPerks) && selectedEvent.vipPerks.length > 0 && (
                  <ul className="mt-2 list-disc list-inside text-xs text-text-secondary space-y-0.5">
                    {selectedEvent.vipPerks.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Speakers & Rep Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-surface-container rounded-lg border border-border-structural/50">
                  <span className="text-text-tertiary block mb-1">المتحدثون المطلوبون:</span>
                  <span className="font-bold text-text-primary">{selectedEvent.speakersRequested || 'خبراء FXENGIN'}</span>
                </div>

                <div className="p-3 bg-surface-container rounded-lg border border-border-structural/50">
                  <span className="text-text-tertiary block mb-1">مسؤول التواصل من الوسيط:</span>
                  <span className="font-bold text-text-primary">{selectedEvent.repContact || 'مكتب علاقات الشركاء'}</span>
                </div>
              </div>

              {/* Special Notes from Broker */}
              {selectedEvent.notes && (
                <div className="p-3 bg-surface-container rounded-lg border border-border-structural/50 text-xs">
                  <span className="text-text-tertiary block mb-1">ملاحظات ومتطلبات الوسيط:</span>
                  <p className="text-text-secondary m-0">{selectedEvent.notes}</p>
                </div>
              )}

              {/* Admin Feedback & Status Management */}
              <div className="pt-3 border-t border-border-structural/60">
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  ملاحظات وتنسيق إدارة FXENGIN (تظهر للوسيط في لوحة تحكمه):
                </label>
                <textarea
                  rows="3"
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="مثال: تم التواصل وتأكيد حجز قاعة فورسيزونز، جاري إعداد بطاقات الـ VIP وتجهيز منصة العرض..."
                  className="w-full p-2.5 bg-surface-container-lowest border border-border-structural/70 rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Status Update Buttons */}
              <div>
                <label className="block text-xs font-bold text-text-primary mb-2">تحديث حالة الإيفينت:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'PENDING_REVIEW', label: 'قيد الدراسة', color: 'bg-primary/10 text-primary border-primary/30' },
                    { id: 'IN_PLANNING', label: 'معتمد - جاري التنسيق', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
                    { id: 'APPROVED', label: 'معتمد ومجدول رسمياً', color: 'bg-bullish-up/10 text-bullish-up border-bullish-up/30' },
                    { id: 'COMPLETED', label: 'مكتمل بنجاح', color: 'bg-accent/10 text-accent border-accent/30' },
                    { id: 'REJECTED', label: 'مرفوض / اعتذار', color: 'bg-bearish-down/10 text-bearish-down border-bearish-down/30' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={savingStatus}
                      onClick={() => handleUpdateStatus(selectedEvent.id, s.id, adminNotesInput)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${s.color} ${
                        selectedEvent.status === s.id ? 'ring-2 ring-white/20' : 'opacity-80 hover:opacity-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-5 mt-5 border-t border-border-structural/60">
              <button
                type="button"
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="text-bearish-down hover:text-red-400 text-xs font-bold flex items-center gap-1"
              >
                <IoTrashOutline size={15} />
                <span>حذف هذا الطلب</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg text-xs font-bold text-text-primary"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
