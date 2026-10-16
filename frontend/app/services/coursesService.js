/**
 * @file coursesService.js
 * @description Comprehensive Courses & LMS Service for FXENGIN Core API
 * Integrates:
 * - GET  /courses
 * - GET  /courses/{slug}
 * - POST /courses/{slug}/enroll
 * - GET  /courses/{slug}/learn
 * - POST /courses/lessons/{lessonId}/heartbeat
 * - GET  /courses/lessons/{lessonId}/stream
 * - GET  /courses/lessons/{...}/resources/.../download
 * - POST /courses/quizzes/{quizId}/submit
 */

import { API_BASE_URL, apiFetch, getAccessToken } from './apiClient.js';

/**
 * Resolve absolute URL for stream, download, or media asset.
 * If path is relative or starts with /api, resolves against API_BASE_URL.
 * @param {string} urlOrPath
 * @returns {string}
 */
export function resolveMediaUrl(urlOrPath) {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    return urlOrPath;
  }
  const prefix = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = urlOrPath.startsWith('/') ? urlOrPath : `/${urlOrPath}`;
  return `${prefix}${cleanPath}`;
}

/**
 * Fetch all available courses catalog from core backend
 * Endpoint: GET /courses
 * @returns {Promise<{success: boolean, data: Array, error?: string}>}
 */
export async function fetchCourses() {
  try {
    const res = await apiFetch('/courses', {
      method: 'GET',
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch courses (HTTP ${res.status})`);
    }

    const data = await res.json();
    const coursesList = Array.isArray(data) ? data : (data?.data || []);

    return {
      success: true,
      data: coursesList,
    };
  } catch (err) {
    console.warn('API Error (fetchCourses):', err.message);
    return {
      success: false,
      data: [],
      error: err.message,
    };
  }
}

/**
 * Fetch detailed course syllabus and enrollment status
 * Endpoint: GET /courses/{slug}
 * @param {string} slug
 * @returns {Promise<{success: boolean, data?: object, error?: string, statusCode?: number}>}
 */
export async function fetchCourseBySlug(slug) {
  if (!slug) return { success: false, error: 'Course slug is required' };

  try {
    const res = await apiFetch(`/courses/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        error: `Failed to fetch course details (HTTP ${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    console.warn(`API Error (fetchCourseBySlug for ${slug}):`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Enroll currently authenticated user or guest buyer in a course
 * Endpoint: POST /courses/{slug}/enroll
 * @param {string} slug
 * @param {object} [paymentData] - Optional payment, buyer, and coupon details
 * @returns {Promise<{success: boolean, message?: string, enrollmentId?: string, error?: string, statusCode?: number}>}
 */
export async function enrollCourse(slug, paymentData = {}) {
  if (!slug) return { success: false, error: 'Course slug is required' };

  try {
    const res = await apiFetch(`/courses/${encodeURIComponent(slug)}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData || {}),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || (res.status === 401 ? 'يرجى تسجيل الدخول أولاً للتسجيل في الكورس' : 'فشل التسجيل في الكورس'),
        error: data?.error || `HTTP ${res.status}`,
        statusCode: res.status,
      };
    }

    return {
      success: true,
      message: data?.message || 'تم التسجيل في الكورس بنجاح!',
      enrollmentId: data?.enrollmentId,
      data,
    };
  } catch (err) {
    console.error(`API Error (enrollCourse for ${slug}):`, err);
    return {
      success: false,
      message: 'تعذر الاتصال بالخادم لإتمام التسجيل',
      error: err.message,
    };
  }
}

/**
 * Fetch authenticated learning classroom data, lesson stream tokens, and anti-piracy watermark
 * Endpoint: GET /courses/{slug}/learn
 * @param {string} slug
 * @returns {Promise<{success: boolean, data?: object, error?: string, unauthorized?: boolean, statusCode?: number}>}
 */
export async function fetchCourseLearn(slug) {
  if (!slug) return { success: false, error: 'Course slug is required' };

  try {
    const res = await apiFetch(`/courses/${encodeURIComponent(slug)}/learn`, {
      method: 'GET',
    });

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        unauthorized: true,
        statusCode: res.status,
        error: 'يجب التسجيل في الكورس وتسجيل الدخول للوصول إلى قاعة المحاضرات',
      };
    }

    if (!res.ok) {
      return {
        success: false,
        statusCode: res.status,
        error: `Failed to load learning room (HTTP ${res.status})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error(`API Error (fetchCourseLearn for ${slug}):`, err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Send playback progress heartbeat to record watch time
 * Endpoint: POST /courses/lessons/{lessonId}/heartbeat
 * @param {string} lessonId
 * @param {{ currentTime: number, deltaSeconds: number }} progress
 * @returns {Promise<{success: boolean, data?: object, isCompleted?: boolean, error?: string}>}
 */
export async function sendLessonHeartbeat(lessonId, { currentTime, deltaSeconds = 10 }) {
  if (!lessonId) return { success: false, error: 'Lesson ID is required' };

  try {
    const clampedCurrent = Math.max(0, Math.round(Number(currentTime) || 0));
    const clampedDelta = Math.min(60, Math.max(1, Math.round(Number(deltaSeconds) || 10)));

    const res = await apiFetch(`/courses/lessons/${encodeURIComponent(lessonId)}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({
        currentTime: clampedCurrent,
        deltaSeconds: clampedDelta,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        error: data?.message || `Heartbeat failed with HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      isCompleted: Boolean(data?.isCompleted),
      watchedSeconds: data?.watchedSeconds,
      percentWatched: data?.percentWatched,
      message: data?.message,
      data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Resolve secure streaming URL for a lesson
 * Endpoint: GET /courses/lessons/{lessonId}/stream?token=...
 * @param {string} videoUrl - Direct video URL or relative path
 * @param {string} [lessonId] - Optional lesson ID
 * @returns {string}
 */
export function getSecureStreamUrl(videoUrl, lessonId) {
  if (videoUrl) return resolveMediaUrl(videoUrl);
  if (lessonId) {
    const token = getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const prefix = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${prefix}/courses/lessons/${encodeURIComponent(lessonId)}/stream${query}`;
  }
  return '';
}

/**
 * Resolve secure download URL for lesson resources / PDFs
 * Endpoint: GET /courses/lessons/{lessonId}/resources/{resourceId}/download?token=...
 * @param {string} fileUrl - Direct file URL or relative path
 * @param {string} [lessonId] - Lesson ID
 * @param {string} [resourceId] - Resource attachment ID
 * @returns {string}
 */
export function getSecureResourceDownloadUrl(fileUrl, lessonId, resourceId) {
  if (lessonId && resourceId) {
    const token = getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}&ticket=${encodeURIComponent(token)}` : '';
    const prefix = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    return `${prefix}/courses/lessons/${encodeURIComponent(lessonId)}/resources/${encodeURIComponent(resourceId)}/download${query}`;
  }
  if (fileUrl) return resolveMediaUrl(fileUrl);
  return '';
}

/**
 * Submit answers for a lesson quiz
 * Endpoint: POST /courses/quizzes/{quizId}/submit
 * @param {string} quizId
 * @param {Array<{questionId: string, choiceId: string}>} answersArray
 * @returns {Promise<{
 *   success: boolean,
 *   isPassed?: boolean,
 *   score?: number,
 *   passingScore?: number,
 *   attemptNumber?: number,
 *   remainingAttempts?: number,
 *   feedback?: Array,
 *   message?: string,
 *   error?: string
 * }>}
 */
export async function submitQuiz(quizId, answersArray) {
  if (!quizId) return { success: false, error: 'Quiz ID is required' };

  try {
    const formattedAnswers = Array.isArray(answersArray)
      ? answersArray.map((ans) => ({
          questionId: String(ans.questionId),
          choiceId: String(ans.choiceId),
        }))
      : [];

    const res = await apiFetch(`/courses/quizzes/${encodeURIComponent(quizId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        answers: formattedAnswers,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        message: data?.message || 'فشل تقديم الاختبار',
        error: data?.error || `HTTP ${res.status}`,
      };
    }

    return {
      success: true,
      isPassed: Boolean(data?.isPassed),
      score: data?.score ?? 0,
      passingScore: data?.passingScore ?? 70,
      attemptNumber: data?.attemptNumber ?? 1,
      remainingAttempts: data?.remainingAttempts ?? 0,
      feedback: data?.feedback || [],
      message: data?.message || (data?.isPassed ? 'تهانينا! لقد اجتزت الاختبار بنجاح.' : 'لم تجتز درجة النجاح المطلوبة.'),
      data,
    };
  } catch (err) {
    console.error(`API Error (submitQuiz for ${quizId}):`, err);
    return {
      success: false,
      message: 'تعذر الاتصال بالخادم لتقديم الاختبار',
      error: err.message,
    };
  }
}

/**
 * Fetch user's enrolled courses from backend
 * Endpoint: GET /courses/my-courses
 * @returns {Promise<{success: boolean, enrolledCourses: Array, count: number}>}
 */
export async function fetchMyEnrolledCourses() {
  try {
    const token = getAccessToken();
    if (!token) return { success: true, count: 0, enrolledCourses: [] };

    const res = await apiFetch('/courses/my-courses', {
      method: 'GET',
    });

    if (!res.ok) {
      return { success: false, count: 0, enrolledCourses: [] };
    }

    const data = await res.json();
    return {
      success: true,
      count: data.count ?? (data.enrolledCourses?.length || 0),
      enrolledCourses: data.enrolledCourses || [],
    };
  } catch (err) {
    console.warn('API Error (fetchMyEnrolledCourses):', err.message);
    return { success: false, count: 0, enrolledCourses: [] };
  }
}

