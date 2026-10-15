/**
 * @file coursesService.js
 * Centralized service for Admin LMS & Courses Management
 * Integrates all 22 LMS endpoints from core.fxengen.com
 */

import { adminFetch } from './apiClient';

/**
 * Supported Access Tiers for Courses
 */
export const COURSE_ACCESS_TIERS = {
  FREE: {
    key: 'FREE',
    labelAr: 'مجاني للجميع',
    labelEn: 'Free for All',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  STARTER: {
    key: 'STARTER',
    labelAr: 'باقة المبتدئ (Starter)',
    labelEn: 'Starter Tier',
    color: '#06B6D4',
    bgColor: 'rgba(6, 182, 212, 0.12)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  PRO: {
    key: 'PRO',
    labelAr: 'باقة المحترف (Pro)',
    labelEn: 'Pro Tier',
    color: '#0488F8',
    bgColor: 'rgba(4, 136, 248, 0.12)',
    borderColor: 'rgba(4, 136, 248, 0.3)',
  },
  VIP: {
    key: 'VIP',
    labelAr: 'باقة كبار الشخصيات (VIP)',
    labelEn: 'VIP Tier',
    color: '#FB8704',
    bgColor: 'rgba(251, 135, 4, 0.15)',
    borderColor: 'rgba(251, 135, 4, 0.35)',
  },
  ONE_TIME: {
    key: 'ONE_TIME',
    labelAr: 'شراء منفصل (One-Time Purchase)',
    labelEn: 'One-Time Purchase',
    color: '#A855F7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
};

/**
 * Course Difficulty Levels
 */
export const COURSE_DIFFICULTIES = {
  BEGINNER: {
    key: 'BEGINNER',
    labelAr: 'مبتدئ (Beginner)',
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
  INTERMEDIATE: {
    key: 'INTERMEDIATE',
    labelAr: 'متوسط (Intermediate)',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
  },
  ADVANCED: {
    key: 'ADVANCED',
    labelAr: 'متقدم (Advanced)',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.12)',
  },
};

export function getTierConfig(tier) {
  return (
    COURSE_ACCESS_TIERS[tier] || {
      key: tier,
      labelAr: tier || 'غير محدد',
      color: '#A7AFBF',
      bgColor: 'rgba(167, 175, 191, 0.12)',
      borderColor: 'rgba(167, 175, 191, 0.25)',
    }
  );
}

export function getDifficultyConfig(difficulty) {
  if (difficulty === 'VIP_ELITE') {
    return COURSE_DIFFICULTIES.ADVANCED;
  }
  return (
    COURSE_DIFFICULTIES[difficulty] || {
      key: difficulty,
      labelAr: difficulty || 'غير محدد',
      color: '#A7AFBF',
      bgColor: 'rgba(167, 175, 191, 0.12)',
    }
  );
}

// ========================================================
// 1. Course Level Operations (1 - 5 & 21, 22)
// ========================================================

/**
 * 1. POST /admin/courses
 * Create a new course with full metadata
 */
export async function createCourse(courseData) {
  const res = await adminFetch('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });
  return res;
}

/**
 * 2. GET /admin/courses
 * List all courses with statistics
 */
export async function findAllCourses() {
  const res = await adminFetch('/admin/courses', {
    method: 'GET',
  });
  return res;
}

/**
 * 3. GET /admin/courses/{id}
 * Detailed course hierarchy (sections, lessons, resources, captions, quizzes)
 */
export async function findCourseById(id) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  return res;
}

/**
 * 4. PUT /admin/courses/{id}
 * Update course details
 */
export async function updateCourse(id, courseData) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  });
  return res;
}

/**
 * 5. DELETE /admin/courses/{id}
 * Permanently delete course with all child sections and lessons
 */
export async function deleteCourse(id) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res;
}

/**
 * 21. GET /admin/courses/{id}/analytics
 * Course performance analytics, completion rates & engagement
 */
export async function getCourseAnalytics(id) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(id)}/analytics`, {
    method: 'GET',
  });
  return res;
}

/**
 * 22. POST /admin/courses/{id}/publish-toggle
 * Toggle publish status with one click
 */
export async function toggleCoursePublish(id) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(id)}/publish-toggle`, {
    method: 'POST',
  });
  return res;
}

// ========================================================
// 2. Sections Management (6 - 8)
// ========================================================

/**
 * 6. POST /admin/courses/{courseId}/sections
 * Create a new section/chapter in the course
 */
export async function createSection(courseId, sectionData) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(courseId)}/sections`, {
    method: 'POST',
    body: JSON.stringify(sectionData),
  });
  return res;
}

/**
 * 7. PUT /admin/courses/sections/{sectionId}
 * Update or reorder section
 */
export async function updateSection(sectionId, sectionData) {
  const res = await adminFetch(`/admin/courses/sections/${encodeURIComponent(sectionId)}`, {
    method: 'PUT',
    body: JSON.stringify(sectionData),
  });
  return res;
}

/**
 * 8. DELETE /admin/courses/sections/{sectionId}
 * Delete entire section and its lessons
 */
export async function deleteSection(sectionId) {
  const res = await adminFetch(`/admin/courses/sections/${encodeURIComponent(sectionId)}`, {
    method: 'DELETE',
  });
  return res;
}

// ========================================================
// 3. Lessons Management (9 - 11)
// ========================================================

/**
 * 9. POST /admin/courses/sections/{sectionId}/lessons
 * Create a new lesson with video streams and watch threshold
 */
export async function createLesson(sectionId, lessonData) {
  const res = await adminFetch(`/admin/courses/sections/${encodeURIComponent(sectionId)}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lessonData),
  });
  return res;
}

/**
 * 10. PUT /admin/courses/lessons/{lessonId}
 * Update lesson video, stream qualities, and completion threshold
 */
export async function updateLesson(lessonId, lessonData) {
  const res = await adminFetch(`/admin/courses/lessons/${encodeURIComponent(lessonId)}`, {
    method: 'PUT',
    body: JSON.stringify(lessonData),
  });
  return res;
}

/**
 * 11. DELETE /admin/courses/lessons/{lessonId}
 * Delete lesson
 */
export async function deleteLesson(lessonId) {
  const res = await adminFetch(`/admin/courses/lessons/${encodeURIComponent(lessonId)}`, {
    method: 'DELETE',
  });
  return res;
}

// ========================================================
// 4. Lesson Resources & Captions (12 - 15)
// ========================================================

/**
 * 12. POST /admin/courses/lessons/{lessonId}/resources
 * Attach a PDF, ZIP, or code file to a lesson
 */
export async function addLessonResource(lessonId, resourceData) {
  const res = await adminFetch(`/admin/courses/lessons/${encodeURIComponent(lessonId)}/resources`, {
    method: 'POST',
    body: JSON.stringify(resourceData),
  });
  return res;
}

/**
 * 13. DELETE /admin/courses/lessons/resources/{resourceId}
 * Delete lesson resource attachment
 */
export async function deleteLessonResource(resourceId) {
  const res = await adminFetch(`/admin/courses/lessons/resources/${encodeURIComponent(resourceId)}`, {
    method: 'DELETE',
  });
  return res;
}

/**
 * 14. POST /admin/courses/lessons/{lessonId}/captions
 * Add a caption / subtitle file (.vtt)
 */
export async function addLessonCaption(lessonId, captionData) {
  const res = await adminFetch(`/admin/courses/lessons/${encodeURIComponent(lessonId)}/captions`, {
    method: 'POST',
    body: JSON.stringify(captionData),
  });
  return res;
}

/**
 * 15. DELETE /admin/courses/lessons/captions/{captionId}
 * Delete caption / subtitle
 */
export async function deleteLessonCaption(captionId) {
  const res = await adminFetch(`/admin/courses/lessons/captions/${encodeURIComponent(captionId)}`, {
    method: 'DELETE',
  });
  return res;
}

// ========================================================
// 5. Lesson Quizzes (16 - 17)
// ========================================================

/**
 * 16. POST /admin/courses/lessons/{lessonId}/quiz
 * Create or replace evaluation quiz for a lesson
 */
export async function createOrUpdateQuiz(lessonId, quizData) {
  const res = await adminFetch(`/admin/courses/lessons/${encodeURIComponent(lessonId)}/quiz`, {
    method: 'POST',
    body: JSON.stringify(quizData),
  });
  return res;
}

/**
 * 17. DELETE /admin/courses/quizzes/{quizId}
 * Delete evaluation quiz
 */
export async function deleteQuiz(quizId) {
  const res = await adminFetch(`/admin/courses/quizzes/${encodeURIComponent(quizId)}`, {
    method: 'DELETE',
  });
  return res;
}

// ========================================================
// 6. Course Enrollments (18 - 20)
// ========================================================

/**
 * 18. GET /admin/courses/{id}/enrollments
 * List enrolled students with completion status and search
 */
export async function getCourseEnrollments(id, params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  const endpoint = `/admin/courses/${encodeURIComponent(id)}/enrollments${qs ? `?${qs}` : ''}`;

  const res = await adminFetch(endpoint, {
    method: 'GET',
  });
  return res;
}

/**
 * 19. POST /admin/courses/{id}/enrollments/grant
 * Grant a student access to the course manually
 */
export async function grantCourseEnrollment(id, enrollmentData) {
  const res = await adminFetch(`/admin/courses/${encodeURIComponent(id)}/enrollments/grant`, {
    method: 'POST',
    body: JSON.stringify(enrollmentData),
  });
  return res;
}

/**
 * 20. DELETE /admin/courses/{id}/enrollments/{userId}
 * Revoke student access from the course
 */
export async function revokeCourseEnrollment(id, userId) {
  const res = await adminFetch(
    `/admin/courses/${encodeURIComponent(id)}/enrollments/${encodeURIComponent(userId)}`,
    {
      method: 'DELETE',
    }
  );
  return res;
}

/**
 * 21. GET /admin/courses/enrollments/all
 * List all course sales and enrollments across the entire platform
 */
export async function getAllCourseEnrollments(params = {}) {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);

  const qs = query.toString();
  const endpoint = `/admin/courses/enrollments/all${qs ? `?${qs}` : ''}`;

  const res = await adminFetch(endpoint, {
    method: 'GET',
  });
  return res;
}

// ========================================================
// 7. Coupons & Discount Codes Management
// ========================================================

/**
 * GET /admin/coupons
 * List all coupons
 */
export async function getCoupons() {
  const res = await adminFetch('/admin/coupons', {
    method: 'GET',
  });
  return res;
}

/**
 * POST /admin/coupons
 * Create a new coupon
 */
export async function createCoupon(couponData) {
  const res = await adminFetch('/admin/coupons', {
    method: 'POST',
    body: JSON.stringify(couponData),
  });
  return res;
}

/**
 * PUT /admin/coupons/:id
 * Update coupon
 */
export async function updateCoupon(id, couponData) {
  const res = await adminFetch(`/admin/coupons/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(couponData),
  });
  return res;
}

/**
 * DELETE /admin/coupons/:id
 * Delete coupon
 */
export async function deleteCoupon(id) {
  const res = await adminFetch(`/admin/coupons/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return res;
}

// ========================================================
// 8. Video Duration Auto-Detection
// ========================================================

/**
 * Automatically detect video duration in seconds from any URL (YouTube, Vimeo, direct MP4)
 * Uses Next.js API route first, then falls back to Core API, and finally browser HTML5 video element.
 *
 * @param {string} url - Video stream or media URL
 * @returns {Promise<{ ok: boolean, durationSeconds: number, formatted?: string, humanReadable?: string, error?: string }>}
 */
export async function detectVideoDuration(url) {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { ok: false, error: 'رابط الفيديو فارغ' };
  }

  const cleanUrl = url.trim();

  // Try 1: Next.js API route (/api/video-duration)
  try {
    const res = await fetch(`/api/video-duration?url=${encodeURIComponent(cleanUrl)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data.durationSeconds > 0) {
        return {
          ok: true,
          durationSeconds: data.durationSeconds,
          formatted: data.formatted,
          humanReadable: data.humanReadable,
        };
      }
    }
  } catch {
    // Continue to backend fallback
  }

  // Try 2: Backend Admin Courses API (/admin/courses/video-duration)
  try {
    const res = await adminFetch(`/admin/courses/video-duration?url=${encodeURIComponent(cleanUrl)}`, {
      method: 'GET',
    });
    if (res.ok && res.data?.durationSeconds > 0) {
      return {
        ok: true,
        durationSeconds: res.data.durationSeconds,
        formatted: res.data.formatted,
        humanReadable: res.data.humanReadable,
      };
    }
  } catch {
    // Continue to client video element probe
  }

  // Try 3: YouTube Browser IFrame API fallback (bypasses any server bot protection)
  if (typeof window !== 'undefined' && (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be'))) {
    try {
      const ytDuration = await getYouTubeDurationInBrowser(cleanUrl);
      if (ytDuration && ytDuration > 0) {
        return {
          ok: true,
          durationSeconds: ytDuration,
        };
      }
    } catch {
      // Continue
    }
  }

  // Try 4: Direct video file via browser HTML5 Video element (for .mp4, .webm, S3, etc.)
  if (typeof window !== 'undefined' && /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(cleanUrl)) {
    try {
      const duration = await new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = cleanUrl;
        const timer = setTimeout(() => {
          video.src = '';
          resolve(null);
        }, 6000);
        video.onloadedmetadata = () => {
          clearTimeout(timer);
          if (video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
            resolve(Math.round(video.duration));
          } else {
            resolve(null);
          }
          video.src = '';
        };
        video.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };
      });

      if (duration && duration > 0) {
        return {
          ok: true,
          durationSeconds: duration,
        };
      }
    } catch {
      // Ignore
    }
  }

  return { ok: false, error: 'تعذر تحديد مدة الفيديو تلقائياً من هذا الرابط' };
}

/**
 * Helper to probe YouTube video duration directly within client browser via official IFrame API
 */
function getYouTubeDurationInBrowser(cleanUrl) {
  if (typeof window === 'undefined') return Promise.resolve(null);

  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/);
  if (!ytMatch || !ytMatch[1]) return Promise.resolve(null);
  const videoId = ytMatch[1];

  return new Promise((resolve) => {
    if (!window.YT) {
      if (!window.__ytIframeLoading) {
        window.__ytIframeLoading = true;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
    }

    let attempts = 0;
    const maxAttempts = 35; // 3.5 seconds

    const pollYT = () => {
      attempts++;
      if (window.YT && window.YT.Player) {
        const divId = 'yt-probe-' + Math.random().toString(36).slice(2, 9);
        const div = document.createElement('div');
        div.id = divId;
        div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(div);

        let timeout = null;
        let player = null;

        const cleanup = () => {
          if (timeout) clearTimeout(timeout);
          try {
            if (player && typeof player.destroy === 'function') player.destroy();
          } catch (_) {}
          try {
            const el = document.getElementById(divId);
            if (el && el.parentNode) el.parentNode.removeChild(el);
          } catch (_) {}
        };

        timeout = setTimeout(() => {
          cleanup();
          resolve(null);
        }, 5000);

        try {
          player = new window.YT.Player(divId, {
            videoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              modestbranding: 1,
              rel: 0,
            },
            events: {
              onReady: (e) => {
                try {
                  const d = e.target.getDuration();
                  if (typeof d === 'number' && d > 0) {
                    cleanup();
                    resolve(Math.round(d));
                    return;
                  }
                } catch (_) {}
              },
              onStateChange: (e) => {
                try {
                  const d = e.target.getDuration();
                  if (typeof d === 'number' && d > 0) {
                    cleanup();
                    resolve(Math.round(d));
                    return;
                  }
                } catch (_) {}
              },
              onError: () => {
                cleanup();
                resolve(null);
              },
            },
          });
        } catch (_) {
          cleanup();
          resolve(null);
        }
      } else if (attempts < maxAttempts) {
        setTimeout(pollYT, 100);
      } else {
        resolve(null);
      }
    };

    pollYT();
  });
}


