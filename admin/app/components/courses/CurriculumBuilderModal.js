'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../Modal';
import {
  findCourseById,
  createSection,
  updateSection,
  deleteSection,
  createLesson,
  updateLesson,
  deleteLesson,
  addLessonResource,
  deleteLessonResource,
  addLessonCaption,
  deleteLessonCaption,
  createOrUpdateQuiz,
  deleteQuiz,
  detectVideoDuration,
} from '../../services/coursesService';
import { toast } from 'react-toastify';
import {
  HiOutlineFolder,
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineVideoCamera,
  HiOutlineDocumentText,
  HiOutlineQuestionMarkCircle,
  HiOutlineTranslate,
  HiChevronDown,
  HiChevronUp,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineLockClosed,
} from 'react-icons/hi';

function formatSecondsToTime(seconds) {
  const sec = Number(seconds) || 0;
  if (sec <= 0) return '0 ثانية';
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remSec = sec % 60;
  if (hrs > 0) {
    return `${hrs} س ${mins} د ${remSec > 0 ? `${remSec} ث` : ''}`.trim();
  }
  if (mins > 0) {
    return `${mins} دقيقة ${remSec > 0 ? `و ${remSec} ثانية` : ''}`.trim();
  }
  return `${remSec} ثانية`;
}

export default function CurriculumBuilderModal({
  isOpen,
  onClose,
  courseId,
}) {
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Section Add/Edit Form State
  const [isSectionFormOpen, setIsSectionFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [sectionOrder, setSectionOrder] = useState(0);

  // Lesson Add/Edit Form State
  const [isLessonFormOpen, setIsLessonFormOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  const [durationAutoDetected, setDurationAutoDetected] = useState(false);
  const videoUrlDebounceRef = useRef(null);

  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    durationSeconds: 0,
    videoUrl: '',
    videoQualities: { '1080p': '', '720p': '', '480p': '' },
    isFreePreview: false,
    requiredWatchPercent: 80,
    orderIndex: 0,
  });

  // Resource Form State
  const [resourceLessonId, setResourceLessonId] = useState(null);
  const [resourceData, setResourceData] = useState({
    title: '',
    fileType: 'PDF',
    fileUrl: '',
    fileSize: '2.5 MB',
  });

  // Caption Form State
  const [captionLessonId, setCaptionLessonId] = useState(null);
  const [captionData, setCaptionData] = useState({
    language: 'ar',
    label: 'العربية',
    url: '',
    isDefault: true,
  });

  // Quiz Form State
  const [quizLessonId, setQuizLessonId] = useState(null);
  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    passingScore: 70,
    maxAttempts: 3,
    questions: [
      {
        question: '',
        points: 1,
        choices: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
        ],
      },
    ],
  });

  // Expanded sections tracker
  const [expandedSections, setExpandedSections] = useState({});

  const loadCourseData = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const res = await findCourseById(courseId);
      if (res.ok && res.data) {
        setCourse(res.data);
        // Expand first section by default
        if (res.data.sections && res.data.sections.length > 0) {
          const firstId = res.data.sections[0].id;
          setExpandedSections((prev) => ({ ...prev, [firstId]: true }));
        }
      } else {
        toast.error('فشل جلب تفاصيل منهاج الكورس');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحميل المنهاج');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (isOpen && courseId) {
      loadCourseData();
    } else {
      setCourse(null);
      setIsSectionFormOpen(false);
      setIsLessonFormOpen(false);
      setResourceLessonId(null);
      setCaptionLessonId(null);
      setQuizLessonId(null);
    }
  }, [isOpen, courseId, loadCourseData]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ==========================================
  // SECTION HANDLERS (POST, PUT, DELETE)
  // ==========================================
  const handleOpenSectionForm = (sec = null) => {
    if (sec) {
      setEditingSection(sec);
      setSectionTitle(sec.title || '');
      setSectionDescription(sec.description || '');
      setSectionOrder(sec.orderIndex ?? 0);
    } else {
      setEditingSection(null);
      setSectionTitle('');
      setSectionDescription('');
      setSectionOrder((course?.sections?.length || 0) + 1);
    }
    setIsSectionFormOpen(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim()) return;

    try {
      if (editingSection) {
        const res = await updateSection(editingSection.id, {
          title: sectionTitle.trim(),
          description: sectionDescription.trim() || undefined,
          orderIndex: Number(sectionOrder) || 0,
        });
        if (res.ok) {
          toast.success('تم تحديث القسم بنجاح');
          setIsSectionFormOpen(false);
          loadCourseData();
        } else {
          toast.error(res.data?.message || 'فشل تحديث القسم');
        }
      } else {
        const res = await createSection(courseId, {
          title: sectionTitle.trim(),
          description: sectionDescription.trim() || undefined,
          orderIndex: Number(sectionOrder) || 0,
        });
        if (res.ok) {
          toast.success('تمت إضافة القسم الجديد بنجاح');
          setIsSectionFormOpen(false);
          loadCourseData();
        } else {
          toast.error(res.data?.message || 'فشل إنشاء القسم');
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ القسم');
    }
  };

  const handleDeleteSection = async (secId) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم وكافة الحصص والملحقات التابعة له؟')) {
      return;
    }
    try {
      const res = await deleteSection(secId);
      if (res.ok) {
        toast.success('تم حذف القسم بالكامل');
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل حذف القسم');
      }
    } catch {
      toast.error('خطأ أثناء حذف القسم');
    }
  };

  // ==========================================
  // LESSON HANDLERS (POST, PUT, DELETE)
  // ==========================================
  const handleAutoDetectDuration = async (urlToInspect, showToastFeedback = true) => {
    const rawUrl = urlToInspect || lessonData.videoUrl || lessonData.videoQualities?.['1080p'];
    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      if (showToastFeedback) {
        toast.info('يرجى إدخال رابط الفيديو أولاً لتحديد التوقيت تلقائياً');
      }
      return;
    }

    setIsDetectingDuration(true);
    try {
      const res = await detectVideoDuration(rawUrl.trim());
      if (res.ok && res.durationSeconds > 0) {
        setLessonData((prev) => ({
          ...prev,
          durationSeconds: res.durationSeconds,
        }));
        setDurationAutoDetected(true);
        if (showToastFeedback) {
          toast.success(
            `تم تحديد مدة الفيديو تلقائياً: ${res.humanReadable || formatSecondsToTime(res.durationSeconds)} (${res.durationSeconds} ثانية)`
          );
        }
      } else {
        setDurationAutoDetected(false);
        if (showToastFeedback) {
          toast.warn('لم نتمكن من تحديد المدة تلقائياً من هذا الرابط، يمكنك إدخالها يدوياً');
        }
      }
    } catch {
      setDurationAutoDetected(false);
      if (showToastFeedback) {
        toast.error('خطأ أثناء جلب مدة الفيديو');
      }
    } finally {
      setIsDetectingDuration(false);
    }
  };

  const handleVideoUrlChange = (newUrl) => {
    setLessonData((prev) => ({ ...prev, videoUrl: newUrl }));
    setDurationAutoDetected(false);
    if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
      if (videoUrlDebounceRef.current) clearTimeout(videoUrlDebounceRef.current);
      videoUrlDebounceRef.current = setTimeout(() => {
        handleAutoDetectDuration(newUrl, false);
      }, 500);
    }
  };

  const handleQualityChange = (quality, url) => {
    setLessonData((prev) => ({
      ...prev,
      videoQualities: { ...prev.videoQualities, [quality]: url },
    }));
    // If main videoUrl is empty and 1080p is added, auto-detect from 1080p
    if (!lessonData.videoUrl && quality === '1080p' && url && (url.startsWith('http://') || url.startsWith('https://'))) {
      if (videoUrlDebounceRef.current) clearTimeout(videoUrlDebounceRef.current);
      videoUrlDebounceRef.current = setTimeout(() => {
        handleAutoDetectDuration(url, false);
      }, 500);
    }
  };

  const handleOpenLessonForm = (sectionId, lesson = null) => {
    setTargetSectionId(sectionId);
    setDurationAutoDetected(false);
    if (videoUrlDebounceRef.current) clearTimeout(videoUrlDebounceRef.current);

    if (lesson) {
      setEditingLesson(lesson);
      setLessonData({
        title: lesson.title || '',
        description: lesson.description || '',
        durationSeconds: lesson.durationSeconds || 0,
        videoUrl: lesson.videoUrl || '',
        videoQualities: lesson.videoQualities || { '1080p': '', '720p': '', '480p': '' },
        isFreePreview: Boolean(lesson.isFreePreview),
        requiredWatchPercent: lesson.requiredWatchPercent ?? 80,
        orderIndex: lesson.orderIndex ?? 0,
      });

      // If existing lesson has URL but 0 duration, auto-fetch
      if (lesson.videoUrl && (!lesson.durationSeconds || Number(lesson.durationSeconds) === 0)) {
        setTimeout(() => handleAutoDetectDuration(lesson.videoUrl, false), 100);
      }
    } else {
      setEditingLesson(null);
      setLessonData({
        title: '',
        description: '',
        durationSeconds: 0,
        videoUrl: '',
        videoQualities: { '1080p': '', '720p': '', '480p': '' },
        isFreePreview: false,
        requiredWatchPercent: 80,
        orderIndex: 0,
      });
    }
    setIsLessonFormOpen(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonData.title.trim()) return;

    try {
      let finalDuration = Number(lessonData.durationSeconds) || 0;
      const targetUrl = lessonData.videoUrl || lessonData.videoQualities?.['1080p'];

      // If duration is still 0 and URL is present, try resolving right before save
      if (finalDuration <= 0 && targetUrl) {
        try {
          const detected = await detectVideoDuration(targetUrl);
          if (detected?.ok && detected.durationSeconds > 0) {
            finalDuration = detected.durationSeconds;
          }
        } catch {
          // Continue with default
        }
      }

      const payload = {
        ...lessonData,
        durationSeconds: finalDuration,
        requiredWatchPercent: Number(lessonData.requiredWatchPercent) || 80,
        orderIndex: Number(lessonData.orderIndex) || 0,
      };

      if (editingLesson) {
        const res = await updateLesson(editingLesson.id, payload);
        if (res.ok) {
          toast.success('تم تحديث بيانات الحصة بنجاح');
          setIsLessonFormOpen(false);
          loadCourseData();
        } else {
          toast.error(res.data?.message || 'فشل تحديث الحصة');
        }
      } else {
        const res = await createLesson(targetSectionId, payload);
        if (res.ok) {
          toast.success('تمت إضافة الحصة التدريبية بنجاح');
          setIsLessonFormOpen(false);
          loadCourseData();
        } else {
          toast.error(res.data?.message || 'فشل إضافة الحصة');
        }
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ الحصة التدريبية');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الحصة ومرفقاتها؟')) return;
    try {
      const res = await deleteLesson(lessonId);
      if (res.ok) {
        toast.success('تم حذف الحصة التدريبية بنجاح');
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل حذف الحصة');
      }
    } catch {
      toast.error('خطأ أثناء حذف الحصة');
    }
  };

  // ==========================================
  // RESOURCES HANDLERS (POST, DELETE)
  // ==========================================
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!resourceData.title || !resourceData.fileUrl) return;
    try {
      const res = await addLessonResource(resourceLessonId, resourceData);
      if (res.ok) {
        toast.success('تم إرفاق الملف التدريبي بنجاح');
        setResourceLessonId(null);
        setResourceData({ title: '', fileType: 'PDF', fileUrl: '', fileSize: '2.5 MB' });
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل إرفاق الملف');
      }
    } catch {
      toast.error('خطأ أثناء إرفاق الملف التدريبي');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('هل تريد حذف هذا المرفق؟')) return;
    try {
      const res = await deleteLessonResource(resourceId);
      if (res.ok) {
        toast.success('تم حذف المرفق');
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل حذف المرفق');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف المرفق');
    }
  };

  // ==========================================
  // CAPTIONS HANDLERS (POST, DELETE)
  // ==========================================
  const handleAddCaption = async (e) => {
    e.preventDefault();
    if (!captionData.url) return;
    try {
      const res = await addLessonCaption(captionLessonId, captionData);
      if (res.ok) {
        toast.success('تمت إضافة ملف الترجمة بنجاح');
        setCaptionLessonId(null);
        setCaptionData({ language: 'ar', label: 'العربية', url: '', isDefault: true });
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل إضافة الترجمة');
      }
    } catch {
      toast.error('حدث خطأ أثناء إضافة ملف الترجمة');
    }
  };

  const handleDeleteCaption = async (captionId) => {
    if (!confirm('هل تريد إزالة ملف الترجمة هذا؟')) return;
    try {
      const res = await deleteLessonCaption(captionId);
      if (res.ok) {
        toast.success('تم حذف ملف الترجمة');
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل حذف الترجمة');
      }
    } catch {
      toast.error('حدث خطأ أثناء حذف ملف الترجمة');
    }
  };

  // ==========================================
  // QUIZ HANDLERS (POST, DELETE)
  // ==========================================
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    if (!quizData.title) return;
    try {
      const res = await createOrUpdateQuiz(quizLessonId, {
        ...quizData,
        passingScore: Number(quizData.passingScore) || 70,
        maxAttempts: Number(quizData.maxAttempts) || 3,
      });
      if (res.ok) {
        toast.success('تم حفظ الاختبار التقييمي بنجاح');
        setQuizLessonId(null);
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل حفظ الاختبار');
      }
    } catch {
      toast.error('حدث خطأ أثناء حفظ الاختبار');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('هل أنت متأكد من حذف الاختبار التقييمي؟')) return;
    try {
      const res = await deleteQuiz(quizId);
      if (res.ok) {
        toast.success('تم حذف الاختبار التقييمي');
        loadCourseData();
      } else {
        toast.error(res.data?.message || 'فشل حذف الاختبار');
      }
    } catch {
      toast.error('خطأ أثناء حذف الاختبار');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="محرر المنهاج الأكاديمي والمحتوى التدريبي (Curriculum Builder)"
      subtitle={`إدارة فصول وحصص وجودات فيديو ومرفقات كورس: ${course?.title || 'جاري التحميل...'}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Header Action Strip */}
        <div className="flex items-center justify-between pb-3 border-b border-[#12315C]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#F5F7FA]">
              فصول ومحاضرات المنهاج ({course?.sections?.length || 0} فصل)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCourseData}
              className="p-2 rounded-xl bg-[#06142F] border border-[#12315C] text-[#A7AFBF] hover:text-white"
              title="تحديث البيانات"
            >
              <HiOutlineRefresh className="text-base" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenSectionForm()}
              className="px-3 py-1.5 rounded-xl bg-[#0488F8] hover:bg-[#0370CE] text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <HiOutlinePlus className="text-sm" />
              <span>+ إضافة فصل جديد (Section)</span>
            </button>
          </div>
        </div>

        {/* Section Form Drawer/Modal Inline */}
        {isSectionFormOpen && (
          <form onSubmit={handleSaveSection} className="p-4 rounded-2xl bg-[#06142F] border border-[#0488F8]/50 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#0488F8]">
                {editingSection ? 'تعديل بيانات الفصل' : 'إضافة فصل تدريبي جديد للكورس'}
              </h4>
              <button
                type="button"
                onClick={() => setIsSectionFormOpen(false)}
                className="text-xs text-[#A7AFBF] hover:text-white"
              >
                إلغاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  عنوان الفصل / القسم <span className="text-[#F6465D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="مثال: الفصل الأول: البنية الهيكلية وتدفق السيولة"
                  className="w-full h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
                />
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={sectionOrder}
                  onChange={(e) => setSectionOrder(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-tabular outline-none focus:border-[#0488F8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#A7AFBF] mb-1 font-medium">
                وصف مختصر للقسم (اختياري)
              </label>
              <input
                type="text"
                value={sectionDescription}
                onChange={(e) => setSectionDescription(e.target.value)}
                placeholder="محاور ومخرجات هذا الفصل..."
                className="w-full h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#0488F8]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSectionFormOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#12315C] text-[#A7AFBF]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#0488F8] text-white font-bold"
              >
                {editingSection ? 'حفظ التعديل' : 'حفظ القسم'}
              </button>
            </div>
          </form>
        )}

        {/* Lesson Form Inline */}
        {isLessonFormOpen && (
          <form onSubmit={handleSaveLesson} className="p-4 rounded-2xl bg-[#06142F] border border-[#16C784]/50 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#16C784]">
                {editingLesson ? 'تعديل بيانات الحصة التدريبية' : 'إضافة حصة جديدة'}
              </h4>
              <button
                type="button"
                onClick={() => setIsLessonFormOpen(false)}
                className="text-xs text-[#A7AFBF] hover:text-white"
              >
                إلغاء
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  عنوان الحصة <span className="text-[#F6465D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                  placeholder="مثال: الحصة 1: اقتناص فجوات القيمة العادلة FVG"
                  className="w-full h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] outline-none focus:border-[#16C784]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#A7AFBF] font-medium text-xs">
                    رابط الفيديو الأساسي (Stream URL)
                  </label>
                  {(lessonData.videoUrl || lessonData.videoQualities?.['1080p']) && (
                    <button
                      type="button"
                      onClick={() => handleAutoDetectDuration(lessonData.videoUrl, true)}
                      disabled={isDetectingDuration}
                      className="text-[11px] text-[#0488F8] hover:text-[#16C784] flex items-center gap-1 transition font-medium"
                      title="استخراج التوقيت تلقائياً من الرابط"
                    >
                      <HiOutlineRefresh className={`w-3.5 h-3.5 ${isDetectingDuration ? 'animate-spin' : ''}`} />
                      تحديد التوقيت تلقائياً
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={lessonData.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData('text');
                    if (pasted && (pasted.startsWith('http://') || pasted.startsWith('https://'))) {
                      handleAutoDetectDuration(pasted, false);
                    }
                  }}
                  onBlur={() => {
                    if (lessonData.videoUrl && (!lessonData.durationSeconds || Number(lessonData.durationSeconds) === 0)) {
                      handleAutoDetectDuration(lessonData.videoUrl, false);
                    }
                  }}
                  placeholder="https://youtu.be/... أو رابط الفيديو"
                  className="w-full h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs outline-none focus:border-[#16C784] dir-ltr text-right"
                />
              </div>
            </div>

            {/* Video Qualities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#A7AFBF] mb-1">
                  جودة 1080p URL
                </label>
                <input
                  type="url"
                  value={lessonData.videoQualities?.['1080p'] || ''}
                  onChange={(e) => handleQualityChange('1080p', e.target.value)}
                  placeholder="https://...1080p.mp4"
                  className="w-full h-9 px-2.5 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-[11px] dir-ltr text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#A7AFBF] mb-1">
                  جودة 720p URL
                </label>
                <input
                  type="url"
                  value={lessonData.videoQualities?.['720p'] || ''}
                  onChange={(e) => handleQualityChange('720p', e.target.value)}
                  placeholder="https://...720p.mp4"
                  className="w-full h-9 px-2.5 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs dir-ltr text-right"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#A7AFBF] mb-1">
                  جودة 480p URL
                </label>
                <input
                  type="url"
                  value={lessonData.videoQualities?.['480p'] || ''}
                  onChange={(e) => handleQualityChange('480p', e.target.value)}
                  placeholder="https://...480p.mp4"
                  className="w-full h-9 px-2.5 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs dir-ltr text-right"
                />
              </div>
            </div>

            {/* Duration, Watch %, Free Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#A7AFBF] font-medium text-xs flex items-center gap-1.5">
                    <HiOutlineClock className="w-3.5 h-3.5 text-[#0488F8]" />
                    <span>المدة</span>
                    <span className="text-[10px] text-[#16C784] bg-[#16C784]/10 border border-[#16C784]/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-normal">
                      <HiOutlineLockClosed className="w-2.5 h-2.5" />
                      تلقائي
                    </span>
                  </label>
                  {Number(lessonData.durationSeconds) > 0 && (
                    <span className="text-[11px] font-bold text-[#16C784] bg-[#16C784]/15 border border-[#16C784]/30 px-2 py-0.5 rounded-md dir-rtl font-tabular">
                      {formatSecondsToTime(lessonData.durationSeconds)}
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={
                      Number(lessonData.durationSeconds) > 0
                        ? `${lessonData.durationSeconds} ثانية (${formatSecondsToTime(lessonData.durationSeconds)})`
                        : isDetectingDuration
                        ? 'جاري فحص وتحديد المدة...'
                        : 'يُحدد تلقائياً بمجرد إدخال الرابط'
                    }
                    placeholder="يُحدد تلقائياً بمجرد إدخال الرابط"
                    className="w-full h-10 px-3 pl-10 rounded-xl bg-[#07132B]/85 border border-[#12315C] text-[#F5F7FA] font-medium text-xs outline-none cursor-not-allowed select-none focus:outline-none focus:border-[#12315C]"
                    title="المدة يتم تحديدها تلقائياً من رابط الفيديو بدون إدخال يدوي"
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoDetectDuration(lessonData.videoUrl || lessonData.videoQualities?.['1080p'], true)}
                    disabled={isDetectingDuration}
                    title="إعادة فحص وتحديد المدة تلقائياً من الرابط"
                    className="absolute left-2 text-[#0488F8] hover:text-[#16C784] transition p-1 rounded-lg hover:bg-[#12315C]/50"
                  >
                    {isDetectingDuration ? (
                      <HiOutlineRefresh className="w-4 h-4 animate-spin text-[#0488F8]" />
                    ) : Number(lessonData.durationSeconds) > 0 ? (
                      <HiOutlineSparkles className="w-4 h-4 text-[#16C784]" />
                    ) : (
                      <HiOutlineLockClosed className="w-4 h-4 text-[#6C7D93]" />
                    )}
                  </button>
                </div>

                {isDetectingDuration && (
                  <p className="text-[11px] text-[#0488F8] mt-1 flex items-center gap-1 animate-pulse font-medium">
                    <HiOutlineRefresh className="w-3.5 h-3.5 animate-spin" />
                    جاري استخراج مدة الفيديو تلقائياً...
                  </p>
                )}

                {!isDetectingDuration && Number(lessonData.durationSeconds) > 0 && (
                  <p className="text-[11px] text-[#16C784] mt-1 flex items-center gap-1 font-medium">
                    <span>✓</span> تم تحديد المدة تلقائياً ({formatSecondsToTime(lessonData.durationSeconds)})
                  </p>
                )}

                {!isDetectingDuration && Number(lessonData.durationSeconds) <= 0 && (
                  <p className="text-[11px] text-[#718096] mt-1 flex items-center gap-1">
                    <HiOutlineLockClosed className="w-3 h-3 text-[#A0AEC0]" />
                    حقل آلي: تُحسب المدة تلقائياً من الرابط ولا تُكتب يدوياً.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">
                  نسبة المشاهدة الإلزامية (%)
                </label>
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={lessonData.requiredWatchPercent}
                  onChange={(e) =>
                    setLessonData({ ...lessonData, requiredWatchPercent: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-tabular"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lessonData.isFreePreview}
                    onChange={(e) =>
                      setLessonData({ ...lessonData, isFreePreview: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#16C784]"
                  />
                  <span className="font-bold text-[#F5F7FA]">متاح للمعاينة المجانية</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLessonFormOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#12315C] text-[#A7AFBF]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#16C784] text-white font-bold"
              >
                {editingLesson ? 'تحديث الحصة' : 'إضافة الحصة'}
              </button>
            </div>
          </form>
        )}

        {/* Resource Attachment Form */}
        {resourceLessonId && (
          <form onSubmit={handleAddResource} className="p-4 rounded-2xl bg-[#06142F] border border-[#A855F7]/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#A855F7]">إرفاق ملف تدريبي للحصة (PDF / ZIP / Code)</h4>
              <button
                type="button"
                onClick={() => setResourceLessonId(null)}
                className="text-xs text-[#A7AFBF]"
              >
                إلغاء
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">عنوان المرفق</label>
                <input
                  type="text"
                  required
                  value={resourceData.title}
                  onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })}
                  placeholder="مثال: كتاب إتقان كتل الأوامر PDF"
                  className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA]"
                />
              </div>
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">رابط الملف (S3/CDN URL)</label>
                <input
                  type="url"
                  required
                  value={resourceData.fileUrl}
                  onChange={(e) => setResourceData({ ...resourceData, fileUrl: e.target.value })}
                  placeholder="https://...file.pdf"
                  className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs dir-ltr text-right"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResourceLessonId(null)}
                className="px-3 py-1 rounded bg-[#12315C] text-[#A7AFBF]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded bg-[#A855F7] text-white font-bold"
              >
                إرفاق الملف
              </button>
            </div>
          </form>
        )}

        {/* Captions Form */}
        {captionLessonId && (
          <form onSubmit={handleAddCaption} className="p-4 rounded-2xl bg-[#06142F] border border-[#FB8704]/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#FB8704]">إضافة ملف ترجمة وكابشن (.vtt)</h4>
              <button
                type="button"
                onClick={() => setCaptionLessonId(null)}
                className="text-xs text-[#A7AFBF]"
              >
                إلغاء
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[#A7AFBF] mb-1">رمز اللغة (ar, en)</label>
                <input
                  type="text"
                  required
                  value={captionData.language}
                  onChange={(e) => setCaptionData({ ...captionData, language: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA]"
                />
              </div>
              <div>
                <label className="block text-[#A7AFBF] mb-1">التسمية الظاهرة</label>
                <input
                  type="text"
                  required
                  value={captionData.label}
                  onChange={(e) => setCaptionData({ ...captionData, label: e.target.value })}
                  placeholder="العربية"
                  className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA]"
                />
              </div>
              <div>
                <label className="block text-[#A7AFBF] mb-1">رابط ملف .vtt</label>
                <input
                  type="url"
                  required
                  value={captionData.url}
                  onChange={(e) => setCaptionData({ ...captionData, url: e.target.value })}
                  placeholder="https://...captions.vtt"
                  className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs dir-ltr text-right"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCaptionLessonId(null)}
                className="px-3 py-1 rounded bg-[#12315C] text-[#A7AFBF]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded bg-[#FB8704] text-white font-bold"
              >
                إضافة الترجمة
              </button>
            </div>
          </form>
        )}

        {/* Quiz Form */}
        {quizLessonId && (
          <form onSubmit={handleSaveQuiz} className="p-4 rounded-2xl bg-[#06142F] border border-[#FBBF24]/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#FBBF24]">إنشاء / تعديل اختبار تقييمي للحصة (Quiz)</h4>
              <button
                type="button"
                onClick={() => setQuizLessonId(null)}
                className="text-xs text-[#A7AFBF]"
              >
                إلغاء
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A7AFBF] mb-1 font-medium">عنوان الاختبار</label>
                <input
                  type="text"
                  required
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  placeholder="مثال: اختبار قياس استيعاب الحصة الأولى"
                  className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A7AFBF] mb-1">درجة النجاح (%)</label>
                  <input
                    type="number"
                    value={quizData.passingScore}
                    onChange={(e) => setQuizData({ ...quizData, passingScore: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-tabular"
                  />
                </div>
                <div>
                  <label className="block text-[#A7AFBF] mb-1">أقصى محاولات</label>
                  <input
                    type="number"
                    value={quizData.maxAttempts}
                    onChange={(e) => setQuizData({ ...quizData, maxAttempts: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-tabular"
                  />
                </div>
              </div>
            </div>

            {/* Question 1 */}
            <div className="p-3 rounded-xl bg-[#0A1B3D] border border-[#12315C] space-y-2">
              <label className="block text-[#A7AFBF] font-medium">نص السؤال الأول</label>
              <input
                type="text"
                required
                value={quizData.questions[0]?.question || ''}
                onChange={(e) => {
                  const updated = [...quizData.questions];
                  updated[0] = { ...updated[0], question: e.target.value };
                  setQuizData({ ...quizData, questions: updated });
                }}
                placeholder="اكتب نص السؤال هنا..."
                className="w-full h-9 px-3 rounded-lg bg-[#06142F] border border-[#12315C] text-[#F5F7FA]"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-[#16C784]">الخيار الصحيح (True)</label>
                  <input
                    type="text"
                    required
                    value={quizData.questions[0]?.choices[0]?.text || ''}
                    onChange={(e) => {
                      const updated = [...quizData.questions];
                      updated[0].choices[0] = { text: e.target.value, isCorrect: true };
                      setQuizData({ ...quizData, questions: updated });
                    }}
                    placeholder="الإجابة الصحيحة"
                    className="w-full h-8 px-2.5 rounded bg-[#06142F] border border-[#16C784]/40 text-[#F5F7FA] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#F6465D]">الخيار الخاطئ (False)</label>
                  <input
                    type="text"
                    required
                    value={quizData.questions[0]?.choices[1]?.text || ''}
                    onChange={(e) => {
                      const updated = [...quizData.questions];
                      updated[0].choices[1] = { text: e.target.value, isCorrect: false };
                      setQuizData({ ...quizData, questions: updated });
                    }}
                    placeholder="إجابة بديلة خاطئة"
                    className="w-full h-8 px-2.5 rounded bg-[#06142F] border border-[#F6465D]/40 text-[#F5F7FA] text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuizLessonId(null)}
                className="px-3 py-1 rounded bg-[#12315C] text-[#A7AFBF]"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded bg-[#FBBF24] text-[#00030D] font-bold"
              >
                حفظ الاختبار
              </button>
            </div>
          </form>
        )}

        {/* Hierarchy Tree */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#A7AFBF]">جاري تحميل محتوى المنهاج...</span>
          </div>
        ) : !course?.sections || course.sections.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#06142F] border border-[#12315C] text-center space-y-3">
            <HiOutlineFolder className="text-4xl text-[#A7AFBF] mx-auto opacity-50" />
            <p className="font-bold text-[#F5F7FA]">لم يتم إنشاء أي فصول لهذا الكورس بعد</p>
            <p className="text-xs text-[#687287]">
              ابدأ بالضغط على زر &quot;إضافة فصل جديد&quot; أعلاه لتقسيم المنهاج إلى فصول دراسية وحصص.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {course.sections.map((section, sIdx) => {
              const isExpanded = Boolean(expandedSections[section.id]);
              const lessons = section.lessons || [];

              return (
                <div
                  key={section.id}
                  className="rounded-2xl bg-[#06142F] border border-[#12315C] overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="p-3.5 flex items-center justify-between bg-[#0A1B3D]/80 hover:bg-[#0A1B3D] transition-colors select-none">
                    <div
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <button type="button" className="text-[#A7AFBF]">
                        {isExpanded ? <HiChevronUp className="text-lg" /> : <HiChevronDown className="text-lg" />}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#0488F8]/20 text-[#0488F8] font-bold text-xs flex items-center justify-center font-tabular">
                          {sIdx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-[#F5F7FA]">
                          {section.title}
                        </h4>
                        <span className="text-xs text-[#A7AFBF] font-tabular">
                          ({lessons.length} حصة)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenLessonForm(section.id)}
                        className="px-2.5 py-1 rounded-lg bg-[#16C784]/15 hover:bg-[#16C784]/25 text-[#16C784] text-xs font-bold flex items-center gap-1"
                        title="إضافة حصة داخل هذا الفصل"
                      >
                        <HiOutlinePlus />
                        <span>إضافة حصة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenSectionForm(section)}
                        className="p-1.5 rounded-lg text-[#A7AFBF] hover:text-white hover:bg-[#12315C]"
                        title="تعديل اسم الفصل"
                      >
                        <HiOutlinePencilAlt className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-1.5 rounded-lg text-[#F6465D] hover:bg-[#F6465D]/15 font-bold"
                        title="حذف الفصل"
                      >
                        <HiOutlineTrash className="text-base" />
                      </button>
                    </div>
                  </div>

                  {/* Lessons List under section */}
                  {isExpanded && (
                    <div className="p-3 space-y-2 border-t border-[#12315C]/60 bg-[#06142F]/60">
                      {lessons.length === 0 ? (
                        <div className="py-4 text-center text-xs text-[#687287]">
                          لا توجد حصص في هذا الفصل حتى الآن. انقر على &quot;+ إضافة حصة&quot; لإرفاق الدروس.
                        </div>
                      ) : (
                        lessons.map((lesson, lIdx) => (
                          <div
                            key={lesson.id}
                            className="p-3 rounded-xl bg-[#0A1B3D] border border-[#12315C]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                              <HiOutlineVideoCamera className="text-xl text-[#0488F8] shrink-0 mt-0.5 sm:mt-0" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-[#F5F7FA] truncate">
                                    {lesson.title}
                                  </span>
                                  {lesson.isFreePreview && (
                                    <span className="px-1.5 py-0.5 rounded bg-[#16C784]/20 text-[#16C784] text-[10px] font-bold">
                                      معاينة مجانية
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-[#A7AFBF] mt-1 font-tabular">
                                  <span>
                                    المدة: {formatSecondsToTime(lesson.durationSeconds || 0)}
                                  </span>
                                  <span>مشاهدة إلزامية: {lesson.requiredWatchPercent || 80}%</span>
                                  {lesson.hasQuiz && (
                                    <span className="text-[#FBBF24] font-bold">★ اختبار تقييمي</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Sub-item Actions for lesson */}
                            <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-auto">
                              {/* Add Resource */}
                              <button
                                type="button"
                                onClick={() => {
                                  setResourceLessonId(lesson.id);
                                  setIsLessonFormOpen(false);
                                  setCaptionLessonId(null);
                                  setQuizLessonId(null);
                                }}
                                className="px-2 py-1 rounded bg-[#A855F7]/15 hover:bg-[#A855F7]/25 text-[#A855F7] text-[11px] font-bold flex items-center gap-1"
                                title="إرفاق ملف PDF أو كود"
                              >
                                <HiOutlineDocumentText />
                                <span>مرفق</span>
                              </button>

                              {/* Add Caption */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCaptionLessonId(lesson.id);
                                  setIsLessonFormOpen(false);
                                  setResourceLessonId(null);
                                  setQuizLessonId(null);
                                }}
                                className="px-2 py-1 rounded bg-[#FB8704]/15 hover:bg-[#FB8704]/25 text-[#FB8704] text-[11px] font-bold flex items-center gap-1"
                                title="إضافة ملف ترجمة .vtt"
                              >
                                <HiOutlineTranslate />
                                <span>ترجمة</span>
                              </button>

                              {/* Add Quiz */}
                              <button
                                type="button"
                                onClick={() => {
                                  setQuizLessonId(lesson.id);
                                  setIsLessonFormOpen(false);
                                  setResourceLessonId(null);
                                  setCaptionLessonId(null);
                                }}
                                className="px-2 py-1 rounded bg-[#FBBF24]/15 hover:bg-[#FBBF24]/25 text-[#FBBF24] text-[11px] font-bold flex items-center gap-1"
                                title="إضافة أو تعديل اختبار الحصة"
                              >
                                <HiOutlineQuestionMarkCircle />
                                <span>اختبار</span>
                              </button>

                              <div className="h-4 w-px bg-[#12315C] mx-1" />

                              {/* Edit Lesson */}
                              <button
                                type="button"
                                onClick={() => handleOpenLessonForm(section.id, lesson)}
                                className="p-1 rounded text-[#A7AFBF] hover:text-white"
                                title="تعديل بيانات الحصة"
                              >
                                <HiOutlinePencilAlt className="text-sm" />
                              </button>

                              {/* Delete Lesson */}
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-1 rounded text-[#F6465D] hover:bg-[#F6465D]/15"
                                title="حذف الحصة"
                              >
                                <HiOutlineTrash className="text-sm" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#12315C] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white hover:bg-[#1A4278] transition-colors"
          >
            إغلاق المحرر
          </button>
        </div>
      </div>
    </Modal>
  );
}
