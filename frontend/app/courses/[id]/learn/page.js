'use client';
import { useState, useEffect, useRef, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiArrowRight,
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize2,
  FiCheckCircle,
  FiBookOpen,
  FiDownload,
  FiMessageSquare,
  FiLayers,
  FiClock,
  FiAward,
  FiCheck,
  FiFileText,
  FiHelpCircle,
  FiSettings,
  FiLock,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import {
  fetchCourseLearn,
  sendLessonHeartbeat,
  getSecureStreamUrl,
  getSecureResourceDownloadUrl,
  submitQuiz,
} from '../../../services/coursesService';
import { showToast } from '../../../utils/toast';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuth } from '../../../context/AuthContext';
import { getAppRoute } from '../../../utils/routes';

export default function CourseLearnPlayerPage({ params }) {
  const router = useRouter();
  const unwrappedParams = typeof params?.then === 'function' ? use(params) : (params || {});
  const courseId = unwrappedParams?.courseId || unwrappedParams?.id;
  const { isAr } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Classroom API State
  const [learnData, setLearnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Enforce Login: Redirect unauthenticated visitors to login immediately
  useEffect(() => {
    if (!authLoading && !user && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        const fullCurrentPath = window.location.pathname + window.location.search;
        showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً للوصول إلى قاعة التدريب' : 'Please sign in to access the classroom');
        router.replace(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
      }
    }
  }, [authLoading, user, isAuthenticated, isAr, router]);

  // Load classroom data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadClassroom() {
      if (!courseId) return;
      setLoading(true);
      setErrorMessage('');
      try {
        const res = await fetchCourseLearn(courseId);
        if (!isMounted) return;

        if (res.unauthorized || !res.success || !res.data) {
          setUnauthorized(true);
          const errorMsg =
            res.error ||
            res.message ||
            (isAr
              ? 'عفواً، لا يمكنك الدخول لقاعة المحاضرات! هذه الدورة تتطلب اشتراكاً مفعّلاً أو كود تفعيل صالح.'
              : 'Access denied! This course requires an active subscription or activation code.');
          setErrorMessage(errorMsg);

          if (typeof window !== 'undefined') {
            if (!user && !localStorage.getItem('fxengin_access_token')) {
              const fullCurrentPath = window.location.pathname + window.location.search;
              showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً' : 'Please sign in first');
              router.replace(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
              return;
            }

            // Immediately redirect un-subscribed / un-activated user away from learn link
            showToast.error(errorMsg);
            const redirectUrl = getAppRoute(`/courses/${courseId}`, user);
            setTimeout(() => {
              router.replace(redirectUrl);
            }, 150);
            return;
          }
        } else if (res.success && res.data) {
          setLearnData(res.data);
        } else {
          setUnauthorized(true);
          setErrorMessage(isAr ? 'الدورة التدريبية غير متاحة أو غير منشورة حالياً' : 'Course is unavailable or unpublished.');
          const redirectUrl = getAppRoute(`/courses/${courseId}`, user);
          router.replace(redirectUrl);
        }
      } catch (err) {
        console.warn('Classroom fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadClassroom();
    return () => {
      isMounted = false;
    };
  }, [courseId, isAr, user, router]);

  // Combine course metadata
  const course = useMemo(() => {
    if (learnData?.course) {
      return {
        id: learnData.course.id,
        slug: learnData.course.slug || learnData.course.id,
        titleAr: learnData.course.title,
        titleEn: learnData.course.title,
        subtitleAr: learnData.course.subtitle || '',
        subtitleEn: learnData.course.subtitle || '',
        thumbnailUrl: learnData.course.thumbnailUrl || '/assets/Images/test/course1.webp',
        difficulty: learnData.course.difficulty || (isAr ? 'متوسط' : 'Intermediate'),
        category: learnData.course.category || (isAr ? 'تداول' : 'Trading'),
        previewVideo: learnData.course.promoVideoUrl || '',
      };
    }
    return null;
  }, [learnData, isAr]);

  // Anti-piracy dynamic watermark
  const watermark = useMemo(() => {
    if (learnData?.watermark) return learnData.watermark;
    if (user) {
      return {
        userName: user.fullName || user.email || 'Verified Trader',
        userEmail: user.email || '',
        clientIp: 'SECURE_STREAM',
        issuedAt: new Date().toISOString(),
      };
    }
    return null;
  }, [learnData, user]);

  // Floating watermark position shifting gently to prevent screen capture
  const [watermarkPos, setWatermarkPos] = useState({ top: 25, left: 30 });
  useEffect(() => {
    const wmInterval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 60) + 20,
        left: Math.floor(Math.random() * 60) + 20,
      });
    }, 10000);
    return () => clearInterval(wmInterval);
  }, []);

  // Format modules & lessons
  const modules = useMemo(() => {
    if (learnData?.sections && Array.isArray(learnData.sections) && learnData.sections.length > 0) {
      return learnData.sections.map((sec, secIdx) => ({
        id: sec.id || `sec-${secIdx}`,
        moduleTitleAr: sec.title || `الفصل ${secIdx + 1}`,
        moduleTitleEn: sec.title || `Module ${secIdx + 1}`,
        lessons: (sec.lessons || []).map((l, lIdx) => ({
          id: l.id || `${secIdx + 1}-${lIdx + 1}`,
          titleAr: l.title,
          titleEn: l.title,
          duration: l.durationSeconds
            ? `${Math.floor(l.durationSeconds / 60)}:${String(l.durationSeconds % 60).padStart(2, '0')}`
            : '15:00',
          durationSeconds: l.durationSeconds || 900,
          videoUrl: l.videoUrl,
          videoQualities: l.videoQualities || null,
          captions: l.captions || [],
          resources: l.resources || [],
          quiz: l.quiz || null,
          hasQuiz: Boolean(l.hasQuiz || l.quiz),
          freePreview: Boolean(l.isFreePreview),
          isUnlocked: l.isUnlocked !== undefined ? l.isUnlocked : true,
          isCompleted: Boolean(l.isCompleted),
        })),
      }));
    }
    return [];
  }, [learnData]);

  // Flatten all lessons across all modules
  const allLessons = useMemo(() => {
    return modules.flatMap((m) => m.lessons) || [];
  }, [modules]);

  // Active playing lesson state
  const [activeLessonId, setActiveLessonId] = useState('');
  useEffect(() => {
    if (allLessons.length > 0 && !activeLessonId) {
      setActiveLessonId(allLessons[0].id);
    }
  }, [allLessons, activeLessonId]);

  const activeLesson = useMemo(() => {
    return allLessons.find((l) => l.id === activeLessonId) || allLessons[0] || null;
  }, [allLessons, activeLessonId]);

  const activeLessonIndex = useMemo(() => {
    return allLessons.findIndex((l) => l.id === activeLessonId);
  }, [allLessons, activeLessonId]);

  // Video state & controls
  const playerContainerRef = useRef(null);
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState('1x');
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [activeTab, setActiveTab] = useState('notes'); // 'notes' | 'resources' | 'quiz' | 'qa'
  const [controlsHovered, setControlsHovered] = useState(true);
  const controlsTimerRef = useRef(null);

  // Load YouTube IFrame API script dynamically once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(tag, firstScript);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Completed lessons tracking
  const [completedLessonIds, setCompletedLessonIds] = useState([]);

  useEffect(() => {
    if (allLessons.length > 0) {
      const initialCompleted = allLessons.filter((l) => l.isCompleted).map((l) => l.id);
      if (initialCompleted.length > 0) {
        setCompletedLessonIds((prev) => Array.from(new Set([...prev, ...initialCompleted])));
      }
    }
  }, [allLessons]);

  // Playback Heartbeat Timer (calls POST /courses/lessons/{lessonId}/heartbeat every 10s of active playback)
  useEffect(() => {
    let hbInterval = null;

    if (isPlaying && activeLesson?.id) {
      hbInterval = setInterval(async () => {
        let currentSec = 0;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            currentSec = Math.round(ytPlayerRef.current.getCurrentTime() || 0);
          } catch (e) {}
        } else if (videoRef.current && !videoRef.current.paused) {
          currentSec = Math.round(videoRef.current.currentTime || 0);
        } else {
          return;
        }

        try {
          const res = await sendLessonHeartbeat(activeLesson.id, {
            currentTime: currentSec,
            deltaSeconds: 10,
          });

          if (res.success && res.isCompleted) {
            setCompletedLessonIds((prev) => {
              if (!prev.includes(activeLesson.id)) {
                showToast.success(isAr ? 'أحسنت! لقد أكملت متطلبات هذه الحصة بنجاح' : 'Lesson completed successfully!');
                return [...prev, activeLesson.id];
              }
              return prev;
            });
          }
        } catch (e) {
          // Heartbeat failures don't disrupt video playback
        }
      }, 10000);
    }

    return () => {
      if (hbInterval) clearInterval(hbInterval);
    };
  }, [isPlaying, activeLesson?.id, isAr]);

  const [videoHasError, setVideoHasError] = useState(false);

  // Reset video error state whenever active lesson or quality changes
  useEffect(() => {
    setVideoHasError(false);
  }, [activeLessonId, selectedQuality]);

  // Video source resolution (supports direct YouTube/Vimeo, signed videoUrl & videoQualities, or CDN fallback)
  const currentVideoSrc = useMemo(() => {
    if (!activeLesson) return '';
    // If activeLesson has a direct YouTube or Vimeo link, prioritize it directly
    if (
      activeLesson.videoUrl &&
      (activeLesson.videoUrl.includes('youtube.com') ||
       activeLesson.videoUrl.includes('youtu.be') ||
       activeLesson.videoUrl.includes('vimeo.com'))
    ) {
      return activeLesson.videoUrl;
    }
    if (activeLesson.videoQualities?.[selectedQuality]) {
      return getSecureStreamUrl(activeLesson.videoQualities[selectedQuality], activeLesson.id);
    }
    if (activeLesson.videoUrl) {
      return getSecureStreamUrl(activeLesson.videoUrl, activeLesson.id);
    }
    // Only query secure stream if lesson actually has a registered video asset on backend
    if (activeLesson.hasVideo) {
      return getSecureStreamUrl(null, activeLesson.id);
    }
    if (course?.previewVideo && !course.previewVideo.includes('sample-videos.com')) {
      return course.previewVideo;
    }
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }, [activeLesson, selectedQuality, course?.previewVideo]);

  // Detect YouTube streams
  // Detect YouTube streams and extract video ID
  const isYoutube = useMemo(() => {
    if (!currentVideoSrc) return false;
    return currentVideoSrc.includes('youtube.com') || currentVideoSrc.includes('youtu.be');
  }, [currentVideoSrc]);

  const youtubeVideoId = useMemo(() => {
    if (!currentVideoSrc) return null;
    const youtuMatch = currentVideoSrc.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (youtuMatch && youtuMatch[1]) return youtuMatch[1];
    const watchMatch = currentVideoSrc.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) return watchMatch[1];
    const embedMatch = currentVideoSrc.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) return embedMatch[1];
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = currentVideoSrc.match(regExp);
    return match && match[2]?.length === 11 ? match[2] : null;
  }, [currentVideoSrc]);

  // Mount and manage YouTube IFrame API Player instance
  useEffect(() => {
    if (!isYoutube || !youtubeVideoId) {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
      return;
    }

    let isMounted = true;
    let timer = null;

    const initOrLoadYT = () => {
      if (!isMounted) return;
      if (typeof window === 'undefined' || !window.YT || !window.YT.Player) {
        timer = setTimeout(initOrLoadYT, 150);
        return;
      }

      const container = document.getElementById('fxengin-yt-player');
      if (!container) {
        timer = setTimeout(initOrLoadYT, 150);
        return;
      }

      // If player already exists, cue the new video smoothly
      if (ytPlayerRef.current && typeof ytPlayerRef.current.cueVideoById === 'function') {
        try {
          ytPlayerRef.current.cueVideoById(youtubeVideoId);
          setCurrentTime(0);
          setIsPlaying(false);
          return;
        } catch (err) {
          try {
            ytPlayerRef.current.destroy();
          } catch (e) {}
          ytPlayerRef.current = null;
        }
      }

      try {
        ytPlayerRef.current = new window.YT.Player('fxengin-yt-player', {
          width: '100%',
          height: '100%',
          videoId: youtubeVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0, // Fully hides YouTube controls for FXENGIN branded controls
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              const d = event.target.getDuration();
              if (d && d > 0) setDuration(d);
              if (isMuted) {
                event.target.mute();
              } else {
                event.target.unMute();
                event.target.setVolume(volume * 100);
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              // 1: PLAYING, 2: PAUSED, 0: ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                const d = event.target.getDuration();
                if (d && d > 0) setDuration(d);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                setIsPlaying(false);
                toggleLessonCompletion(activeLesson?.id);
                handleNextLesson();
              }
            },
            onError: () => {
              if (isMounted) setVideoHasError(true);
            },
          },
        });
      } catch (err) {
        console.warn('YT player initialization failed:', err);
      }
    };

    initOrLoadYT();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [isYoutube, youtubeVideoId, activeLesson?.id]);

  // YouTube playback time sync poller
  useEffect(() => {
    let interval = null;
    if (isYoutube && isPlaying) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setCurrentTime(cur);
            if (dur && dur > 0 && (!duration || Math.abs(duration - dur) > 1)) {
              setDuration(dur);
            }
          } catch (e) {}
        }
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isYoutube, isPlaying, duration]);

  // Detect Vimeo streams
  const isVimeo = useMemo(() => {
    if (!currentVideoSrc) return false;
    return currentVideoSrc.includes('vimeo.com');
  }, [currentVideoSrc]);

  const vimeoEmbedUrl = useMemo(() => {
    if (!isVimeo) return '';
    const match = currentVideoSrc.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/);
    const id = match ? match[3] : null;
    return id ? `https://player.vimeo.com/video/${id}?autoplay=0&title=0&byline=0&portrait=0` : currentVideoSrc;
  }, [currentVideoSrc, isVimeo]);

  // Progress Calculation
  const progressPercent = Math.round(
    ((completedLessonIds.length || 0) / (allLessons.length || 1)) * 100
  );

  const toggleLessonCompletion = async (id) => {
    if (!id) return;
    if (completedLessonIds.includes(id)) {
      setCompletedLessonIds(completedLessonIds.filter((item) => item !== id));
    } else {
      setCompletedLessonIds([...completedLessonIds, id]);
      showToast.success(isAr ? 'تم تحديد الحصة كمكتملة' : 'Lesson marked as completed');
      // Fire immediate completion heartbeat
      try {
        await sendLessonHeartbeat(id, { currentTime: 1200, deltaSeconds: 30 });
      } catch (e) {}
    }
  };

  const handleNextLesson = () => {
    if (activeLessonIndex < allLessons.length - 1) {
      setActiveLessonId(allLessons[activeLessonIndex + 1].id);
      setIsPlaying(false);
      setCurrentTime(0);
      setQuizResult(null);
      setVideoHasError(false);
    }
  };

  const handlePrevLesson = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonId(allLessons[activeLessonIndex - 1].id);
      setIsPlaying(false);
      setCurrentTime(0);
      setQuizResult(null);
      setVideoHasError(false);
    }
  };

  const handleMouseMovePlayer = () => {
    setControlsHovered(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setControlsHovered(false);
      }, 2800);
    }
  };

  // Video controls helpers (Unified for YouTube & HTML5 Video)
  const togglePlay = () => {
    if (isYoutube && ytPlayerRef.current) {
      try {
        const state = typeof ytPlayerRef.current.getPlayerState === 'function'
          ? ytPlayerRef.current.getPlayerState()
          : null;

        if (state === 1 || state === 3 || isPlaying) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (e) {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
      return;
    }

    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setVideoHasError(false);
          })
          .catch((err) => {
            console.warn('Playback prevented or unsupported media format:', err);
            setIsPlaying(false);
          });
      }
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = isAr ? rect.right - e.clientX : e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const effectiveDuration = duration || activeLesson?.durationSeconds || 0;
    const targetTime = ratio * effectiveDuration;

    setCurrentTime(targetTime);

    if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      try {
        ytPlayerRef.current.seekTo(targetTime, true);
      } catch (e) {}
      return;
    }

    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed);
    const rate = parseFloat(speed);
    if (isYoutube && ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch (e) {}
    }
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (isYoutube && ytPlayerRef.current) {
      try {
        if (nextMuted) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      } catch (e) {}
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  const handleQuizSubmit = async () => {
    if (!activeLesson?.quiz?.id) return;
    const questions = activeLesson.quiz.questions || [];

    const formatted = questions.map((q) => ({
      questionId: q.id,
      choiceId: quizAnswers[q.id] || '',
    }));

    const unanswered = formatted.filter((a) => !a.choiceId);
    if (unanswered.length > 0) {
      showToast.warn(isAr ? 'يرجى الإجابة على جميع أسئلة الاختبار قبل التقديم' : 'Please answer all questions before submitting.');
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const res = await submitQuiz(activeLesson.quiz.id, formatted);
      setQuizResult(res);
      if (res.isPassed) {
        showToast.success(isAr ? `تهانينا! اجتزت الاختبار بنجاح بنتيجة ${res.score}%` : `Congratulations! You passed with ${res.score}%`);
        setCompletedLessonIds((prev) => Array.from(new Set([...prev, activeLesson.id])));
      } else {
        showToast.warn(res.message || (isAr ? 'للأسف لم تتجاوز درجة النجاح' : 'Did not pass quiz minimum score.'));
      }
    } catch (err) {
      showToast.error(isAr ? 'فشل إرسال الاختبار، يرجى المحاولة ثانية' : 'Failed to submit quiz.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Loading State Guard
  if (loading) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          background: '#00030D',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#F5F7FA',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <FiRefreshCw
            size={40}
            style={{
              animation: 'spin 1s linear infinite',
              color: 'var(--accent, #FB8704)',
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: '#A7AFBF', fontSize: '15px', fontWeight: 600 }}>
            {isAr ? 'جاري تحميل قاعة المحاضرات التفاعلية...' : 'Loading interactive classroom...'}
          </p>
        </div>
      </div>
    );
  }

  // Unauthorized Barrier
  if (unauthorized || (!loading && !learnData)) {
    const targetCoursePath = course?.slug || course?.id || courseId;
    const redirectUrl = getAppRoute(`/courses/${targetCoursePath}`, user);
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          background: '#00030D',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#F5F7FA',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            background: '#06142F',
            border: '1.5px solid rgba(246, 70, 93, 0.45)',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(246, 70, 93, 0.15)',
              border: '1px solid rgba(246, 70, 93, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F6465D',
              margin: '0 auto 20px',
            }}
          >
            <FiLock size={34} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: '#FFFFFF' }}>
            {isAr ? 'غير مصرح بالدخول لقاعة المحاضرات' : 'Classroom Access Denied'}
          </h2>
          <p style={{ color: '#A7AFBF', fontSize: '14.5px', lineHeight: 1.7, marginBottom: '28px' }}>
            {errorMessage || (isAr
              ? 'عفواً، هذه الدورة تتطلب اشتراكاً مفعّلاً أو كود تفعيل صالح. لا يمكنك الدخول لقاعة المحاضرات قبل إتمام الاشتراك وتفعيل الكود.'
              : 'This course requires an active subscription or valid activation code. Access is restricted.')}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={redirectUrl}
              className="btn-primary"
              style={{
                height: '46px',
                padding: '0 22px',
                fontSize: '14px',
                fontWeight: 800,
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #FB8704 0%, #FA5A04 100%)',
                color: '#000000',
              }}
            >
              {isAr ? 'العودة لصفحة الكورس والاشتراك' : 'Back to Course & Enroll'}
            </Link>
            <Link
              href="/activate"
              className="btn-secondary"
              style={{
                height: '46px',
                padding: '0 20px',
                fontSize: '14px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {isAr ? 'تفعيل كود الدخول' : 'Activate Code'}
            </Link>
            {!user && (
              <Link
                href={`/login?redirect=${encodeURIComponent(`/courses/${targetCoursePath}/learn`)}`}
                className="btn-secondary"
                style={{
                  height: '46px',
                  padding: '0 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                {isAr ? 'تسجيل الدخول' : 'Sign In'}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not Found / Error Fallback
  if (!course) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          background: '#00030D',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#F5F7FA',
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            background: '#06142F',
            border: '1px solid #12315C',
            borderRadius: '16px',
            padding: '40px 32px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#EF4444',
              margin: '0 auto 20px',
            }}
          >
            <FiAlertCircle size={32} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>
            {isAr ? 'تعذر تحميل قاعة التدريب' : 'Unable to Load Classroom'}
          </h2>
          <p style={{ color: '#A7AFBF', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
            {errorMessage || (isAr
              ? 'الدورة التدريبية غير موجودة أو لم يتم نشرها بعد، أو قد تحتاج إلى تسجيل الدخول بحساب مسجل.'
              : 'Course is not available or unpublished. Please verify your access.')}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              href={getAppRoute('/courses', user)}
              className="btn-primary"
              style={{
                height: '44px',
                padding: '0 22px',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {isAr ? 'تصفح كافة الكورسات' : 'Browse Courses'}
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{
                height: '44px',
                padding: '0 20px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <FiRefreshCw style={{ marginInlineEnd: '6px' }} />
              {isAr ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        background: '#00030D',
        color: '#F5F7FA',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── 1. Classroom Top Navigation Bar ── */}
      <header
        style={{
          height: '64px',
          background: 'rgba(1, 7, 30, 0.96)',
          borderBottom: '1px solid #12315C',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Left: Back to Course & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href={getAppRoute(`/courses/${course?.slug || course?.id || courseId}`, user)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#A7AFBF',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #12315C',
              transition: 'all 0.15s ease',
            }}
          >
            {isAr ? <FiArrowRight size={15} /> : <FiArrowLeft size={15} />}
            <span>{isAr ? 'تفاصيل الكورس' : 'Course Details'}</span>
          </Link>

          <div className="hide-mobile" style={{ borderInlineStart: '1px solid #12315C', paddingInlineStart: '16px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F5F7FA' }}>
              {isAr ? (course?.titleAr || 'دورة تدريبية') : (course?.titleEn || 'Course')}
            </div>
            <div style={{ fontSize: '11px', color: '#0488F8', fontWeight: 600 }}>
              {isAr ? `الدرس الحالي: ${activeLesson?.titleAr || ''}` : `Current: ${activeLesson?.titleEn || ''}`}
            </div>
          </div>
        </div>

        {/* Right: Progress Ring & Certificate Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: isAr ? 'left' : 'right' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#16C784', fontFamily: 'monospace' }}>
                {progressPercent}% {isAr ? 'مكتمل' : 'Completed'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#687287' }}>
                {completedLessonIds.length} / {allLessons.length || 1} {isAr ? 'درس' : 'lessons'}
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div
              style={{
                width: '70px',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0488F8, #16C784)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (progressPercent >= 100) {
                showToast.success(isAr ? 'تهانينا! سيتم إصدار شهادتك المعتمدة وإرسالها لبريدك فوراً.' : 'Certificate is being generated for your account!');
              } else {
                showToast.info(isAr ? `أكمل جميع الحصص والاختبارات للحصول على الشهادة (${progressPercent}% حالياً)` : `Complete all lessons to earn certificate (${progressPercent}% done)`);
              }
            }}
            className="btn-primary"
            style={{
              height: '36px',
              padding: '0 14px',
              fontSize: '12.5px',
              fontWeight: 700,
              gap: '6px',
            }}
          >
            <FiAward size={15} />
            <span className="hide-mobile">{isAr ? 'طلب الشهادة' : 'Certificate'}</span>
          </button>
        </div>
      </header>

      {/* ── 2. Main Video Classroom & Side Playlist Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          flex: 1,
          minHeight: 'calc(100vh - 64px)',
        }}
        className="classroom-layout-grid"
      >
        {/* ── Left Column: Video Player & Tabs ── */}
        <main
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#010514',
            overflowY: 'auto',
          }}
        >
          {/* 16:9 Video Canvas Player */}
          <div
            ref={playerContainerRef}
            onMouseMove={handleMouseMovePlayer}
            onMouseLeave={() => {
              if (isPlaying) setControlsHovered(false);
            }}
            style={{
              position: 'relative',
              width: '100%',
              background: '#000000',
              aspectRatio: '16 / 9',
              maxHeight: '68vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden',
            }}
          >
            {/* Embedded YouTube API Player Container */}
            {isYoutube ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}
              >
                <div id="fxengin-yt-player" style={{ width: '100%', height: '100%' }} />
              </div>
            ) : isVimeo ? (
              /* Vimeo Embed Player */
              <iframe
                src={vimeoEmbedUrl}
                title={activeLesson?.title || course?.titleAr || course?.titleEn || 'Lesson'}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 1 }}
              />
            ) : videoHasError ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  padding: '30px',
                  textAlign: 'center',
                  color: '#A7AFBF',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(180deg, #06142F 0%, #00030D 100%)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(251, 135, 4, 0.15)',
                    border: '1px solid rgba(251, 135, 4, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <FiPlay size={28} />
                </div>
                <h4 style={{ color: '#F5F7FA', margin: 0, fontSize: '16px', fontWeight: 800 }}>
                  {isAr ? 'جاري تجهيز وتسجيل هذه الحصة التدريبية' : 'Lesson video is being recorded'}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', maxWidth: '420px', lineHeight: 1.6 }}>
                  {isAr
                    ? 'سيتم رفع التسجيل الكامل لهذه الحصة قريباً من قبل المحاضر. يمكنك تصفح الملاحظات والملفات المرفقة بالأسفل.'
                    : 'The instructor will upload this lecture replay shortly. You can review the attached materials below.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVideoHasError(false);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="btn-primary"
                  style={{ height: '34px', padding: '0 16px', fontSize: '12px', marginTop: '6px' }}
                >
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </button>
              </div>
            ) : (
              /* HTML5 Native Secure Video Stream */
              <video
                ref={videoRef}
                key={`${activeLesson?.id}-${selectedQuality}-${currentVideoSrc}`}
                src={currentVideoSrc || undefined}
                controls={false}
                playsInline
                onError={() => {
                  setVideoHasError(true);
                  setIsPlaying(false);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                    setDuration(videoRef.current.duration || 0);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration || 0);
                    setVideoHasError(false);
                  }
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  toggleLessonCompletion(activeLesson?.id);
                  handleNextLesson();
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  background: '#000',
                }}
              >
                {activeLesson?.captions?.map((cap) => (
                  <track
                    key={cap.id}
                    kind="subtitles"
                    src={cap.url}
                    srcLang={cap.language}
                    label={cap.label}
                    default={cap.isDefault}
                  />
                ))}
              </video>
            )}

            {/* Anti-Piracy Dynamic Watermark Overlay */}
            {watermark && (
              <div
                style={{
                  position: 'absolute',
                  top: `${watermarkPos.top}%`,
                  left: `${watermarkPos.left}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  color: 'rgba(255, 255, 255, 0.28)',
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  textShadow: '0 0 4px rgba(0,0,0,0.9)',
                  userSelect: 'none',
                  transition: 'top 3s ease, left 3s ease',
                  textAlign: 'center',
                }}
              >
                <div>{watermark.userName} • {watermark.userEmail}</div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>IP: {watermark.clientIp || 'AUTHORIZED'} · FXENGIN SECURE</div>
              </div>
            )}

            {/* Top Stream Quality Badge (Non-blocking) */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: isAr ? '12px' : 'auto',
                left: isAr ? 'auto' : '12px',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            >
              <span
                style={{
                  background: 'rgba(1, 7, 30, 0.85)',
                  border: '1px solid #12315C',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0488F8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
                }}
              >
                <span>FXENGIN STREAM</span>
                <span style={{ color: '#FB8704' }}>
                  • {isYoutube ? 'YouTube HD' : isVimeo ? 'Vimeo HD' : selectedQuality}
                </span>
              </span>
            </div>

            {/* Transparent Full-Canvas Click Layer to toggle Play/Pause */}
            {!videoHasError && (
              <div
                onClick={togglePlay}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 8,
                  cursor: 'pointer',
                }}
              />
            )}

            {/* FXENGIN Custom Branded Video Controls Overlay */}
            {!videoHasError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '20px',
                  background: isPlaying
                    ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 35%, transparent 75%, rgba(0,0,0,0.5) 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.7) 100%)',
                  opacity: !isPlaying || controlsHovered ? 1 : 0,
                  transition: 'opacity 0.25s ease',
                  pointerEvents: !isPlaying || controlsHovered ? 'auto' : 'none',
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    togglePlay();
                  }
                }}
              >
                {/* Top video bar: Title & Quality Selector */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                  {/* Video Quality Switcher */}
                  {activeLesson?.videoQualities && !isYoutube && !isVimeo && (
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(1, 7, 30, 0.8)', padding: '2px 4px', borderRadius: '6px', border: '1px solid #12315C' }}>
                      {Object.keys(activeLesson.videoQualities).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSelectedQuality(q)}
                          style={{
                            padding: '2px 6px',
                            background: selectedQuality === q ? '#FB8704' : 'transparent',
                            color: selectedQuality === q ? '#000' : '#FFF',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Center Play/Pause Big Button */}
                <div style={{ alignSelf: 'center', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '50%',
                      background: 'rgba(251, 135, 4, 0.95)',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      cursor: 'pointer',
                      boxShadow: '0 0 30px rgba(251, 135, 4, 0.6)',
                      transform: 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {isPlaying ? <FiPause size={30} /> : <FiPlay size={30} style={{ marginInlineStart: '4px' }} />}
                  </button>
                </div>

                {/* Bottom Scrubber & Controls */}
                <div style={{ pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  {/* Timeline Scrubber */}
                  <div
                    onClick={handleSeek}
                    style={{
                      width: '100%',
                      height: '6px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '3px',
                      marginBottom: '14px',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(0, (currentTime / (duration || activeLesson?.durationSeconds || 1)) * 100))}%`,
                        height: '100%',
                        background: '#FB8704',
                        borderRadius: '3px',
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: isAr ? 'auto' : '-6px',
                          left: isAr ? '-6px' : 'auto',
                          top: '-4px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          background: '#FFF',
                          boxShadow: '0 0 8px #FB8704',
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls buttons row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <button
                        type="button"
                        onClick={togglePlay}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
                      >
                        {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
                      </button>

                      <button
                        type="button"
                        onClick={handlePrevLesson}
                        disabled={activeLessonIndex === 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: activeLessonIndex === 0 ? '#687287' : '#FFF',
                          cursor: activeLessonIndex === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAr ? <FiArrowRight size={18} /> : <FiArrowLeft size={18} />}
                      </button>

                      <button
                        type="button"
                        onClick={handleNextLesson}
                        disabled={activeLessonIndex === allLessons.length - 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: activeLessonIndex === allLessons.length - 1 ? '#687287' : '#FFF',
                          cursor: activeLessonIndex === allLessons.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isAr ? <FiArrowLeft size={18} /> : <FiArrowRight size={18} />}
                      </button>

                      <span style={{ fontSize: '12px', color: '#A7AFBF', fontFamily: 'monospace' }}>
                        {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / {activeLesson?.duration || (duration > 0 ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, '0')}` : '15:00')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Speed Selector */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {['1x', '1.25x', '1.5x'].map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            onClick={() => changeSpeed(spd)}
                            style={{
                              padding: '2px 8px',
                              background: playbackSpeed === spd ? '#0488F8' : 'rgba(255, 255, 255, 0.1)',
                              color: '#FFF',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'monospace',
                            }}
                          >
                            {spd}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={toggleMute}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
                      >
                        {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
                      >
                        <FiMaximize2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lesson Details & Tabs Area */}
          <div style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 6px 0' }}>
                  {isAr ? activeLesson?.titleAr : activeLesson?.titleEn}
                </h2>
                <div style={{ fontSize: '13px', color: '#A7AFBF' }}>
                  {isAr ? (course?.instructorAr || 'FXENGIN Academy') : (course?.instructorEn || 'FXENGIN Academy')} · {activeLesson?.duration}
                </div>
              </div>

              {/* Navigation & Mark as Complete Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePrevLesson}
                  disabled={activeLessonIndex === 0}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #12315C',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: activeLessonIndex === 0 ? '#687287' : '#F5F7FA',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: activeLessonIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: activeLessonIndex === 0 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  title={isAr ? 'الحصة السابقة' : 'Previous Lesson'}
                >
                  {isAr ? <FiArrowRight size={16} /> : <FiArrowLeft size={16} />}
                  <span>{isAr ? 'السابقة' : 'Prev'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextLesson}
                  disabled={activeLessonIndex === allLessons.length - 1}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '42px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    border: '1px solid #12315C',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: activeLessonIndex === allLessons.length - 1 ? '#687287' : '#F5F7FA',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: activeLessonIndex === allLessons.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: activeLessonIndex === allLessons.length - 1 ? 0.4 : 1,
                    transition: 'all 0.15s ease',
                  }}
                  title={isAr ? 'الحصة التالية' : 'Next Lesson'}
                >
                  <span>{isAr ? 'التالية' : 'Next'}</span>
                  {isAr ? <FiArrowLeft size={16} /> : <FiArrowRight size={16} />}
                </button>

                {/* Mark as Complete Button */}
                <button
                  type="button"
                  onClick={() => toggleLessonCompletion(activeLesson?.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '42px',
                    padding: '0 18px',
                    borderRadius: '8px',
                    border: completedLessonIds.includes(activeLesson?.id) ? '1px solid #16C784' : '1px solid #12315C',
                    background: completedLessonIds.includes(activeLesson?.id) ? 'rgba(22, 199, 132, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: completedLessonIds.includes(activeLesson?.id) ? '#16C784' : '#F5F7FA',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FiCheckCircle size={16} />
                  <span>
                    {completedLessonIds.includes(activeLesson?.id)
                      ? (isAr ? 'تم إكمال الدرس' : 'Completed')
                      : (isAr ? 'تحديد كمكتمل' : 'Mark as Complete')}
                  </span>
                </button>
              </div>
            </div>

            {/* Tabs Selector Bar */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                borderBottom: '1px solid #12315C',
                paddingBottom: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { key: 'notes', icon: <FiFileText size={15} />, labelAr: 'ملخص الدرس والملاحظات', labelEn: 'Lesson Notes' },
                { key: 'resources', icon: <FiDownload size={15} />, labelAr: `المرفقات والتحميل (${activeLesson?.resources?.length || 0})`, labelEn: `Downloads (${activeLesson?.resources?.length || 0})` },
                ...(activeLesson?.hasQuiz || activeLesson?.quiz
                  ? [{ key: 'quiz', icon: <FiHelpCircle size={15} />, labelAr: 'اختبار الحصة التقييمي', labelEn: 'Lesson Quiz' }]
                  : []),
                { key: 'qa', icon: <FiMessageSquare size={15} />, labelAr: 'أسئلة ونقاشات المتداولين', labelEn: 'Q&A Discussions' },
              ].map((tb) => {
                const isTabActive = activeTab === tb.key;
                return (
                  <button
                    key={tb.key}
                    type="button"
                    onClick={() => setActiveTab(tb.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isTabActive ? 700 : 500,
                      color: isTabActive ? '#FFFFFF' : '#A7AFBF',
                      background: isTabActive ? 'rgba(4, 136, 248, 0.15)' : 'transparent',
                      border: `1px solid ${isTabActive ? '#0488F8' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >
                    {tb.icon}
                    <span>{isAr ? tb.labelAr : tb.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Lesson Notes */}
            {activeTab === 'notes' && (
              <div style={{ background: '#06142F', border: '1px solid #12315C', borderRadius: '14px', padding: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 14px 0' }}>
                  {isAr ? 'النقاط الجوهرية للدرس:' : 'Core Technical Keynotes:'}
                </h4>
                <ul style={{ paddingInlineStart: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#A7AFBF', lineHeight: 1.7 }}>
                  <li>{isAr ? 'تأكيد إغلاق شمعة الأربع ساعات (H4) أعلى منطقة العرض لاحتساب الكسر الحقيقي وتدفق السيولة.' : 'Confirm H4 candle closure above supply zone to validate institutional order flow.'}</li>
                  <li>{isAr ? 'استخدام أمر وقف الخسارة أسفل ذيل شمعة السيولة لتجنب الخروج المبكر بفعل الفروقات السعرية.' : 'Place stop-loss safely below the liquidity sweep wick to mitigate noise.'}</li>
                  <li>{isAr ? 'تأمين 50% من حجم الصفقة عند تحقيق الهدف الأول (TP1) ونقل الـ SL لنقطة الدخول.' : 'Scale out 50% position size at TP1 and trail stop to breakeven.'}</li>
                </ul>
              </div>
            )}

            {/* Tab 2: Resources & Downloads */}
            {activeTab === 'resources' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeLesson?.resources && activeLesson.resources.length > 0 ? (
                  activeLesson.resources.map((resItem) => (
                    <div
                      key={resItem.id}
                      style={{
                        background: '#06142F',
                        border: '1px solid #12315C',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiFileText size={22} color="#0488F8" />
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#F5F7FA' }}>
                            {resItem.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#687287' }}>
                            {resItem.fileType || 'FILE'} • {resItem.fileSize || 'Attachment'}
                          </div>
                        </div>
                      </div>

                      <a
                        href={getSecureResourceDownloadUrl(resItem.fileUrl, activeLesson?.id, resItem.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="btn-secondary"
                        style={{ height: '34px', padding: '0 14px', fontSize: '12px', gap: '6px', textDecoration: 'none' }}
                      >
                        <FiDownload size={13} />
                        <span>{isAr ? 'تحميل المرفق' : 'Download'}</span>
                      </a>
                    </div>
                  ))
                ) : (
                  <div style={{ background: '#06142F', border: '1px solid #12315C', borderRadius: '10px', padding: '24px', textAlign: 'center', color: '#A7AFBF' }}>
                    <FiDownload size={28} color="#0488F8" style={{ marginBottom: '8px' }} />
                    <div style={{ fontSize: '14px' }}>
                      {isAr ? 'لا توجد مرفقات إضافية لهذه الحصة.' : 'No downloadable resources attached to this lesson.'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Interactive Quiz (POST /courses/quizzes/{quizId}/submit) */}
            {activeTab === 'quiz' && (
              <div style={{ background: '#06142F', border: '1px solid #12315C', borderRadius: '14px', padding: '24px' }}>
                {activeLesson?.quiz ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 4px 0' }}>
                          {activeLesson.quiz.title}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#A7AFBF' }}>
                          {isAr ? `درجة النجاح: ${activeLesson.quiz.passingScore}% • الحد الأقصى للمحاولات: ${activeLesson.quiz.maxAttempts || 3}` : `Passing Score: ${activeLesson.quiz.passingScore}% • Max Attempts: ${activeLesson.quiz.maxAttempts || 3}`}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          background: 'rgba(251, 135, 4, 0.12)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(251, 135, 4, 0.3)',
                        }}
                      >
                        {isAr ? 'اختبار تقييم استيعاب' : 'Comprehension Assessment'}
                      </span>
                    </div>

                    {/* Quiz Result Banner */}
                    {quizResult && (
                      <div
                        style={{
                          background: quizResult.isPassed ? 'rgba(22, 199, 132, 0.12)' : 'rgba(246, 70, 93, 0.12)',
                          border: `1px solid ${quizResult.isPassed ? '#16C784' : '#F6465D'}`,
                          borderRadius: '10px',
                          padding: '16px',
                          marginBottom: '20px',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '14.5px', color: quizResult.isPassed ? '#16C784' : '#F6465D', marginBottom: '4px' }}>
                          {quizResult.isPassed ? '✓ ' : '✕ '} {quizResult.message}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#A7AFBF' }}>
                          {isAr ? `الدرجة المحققة: ${quizResult.score}% • المحاولات المتبقية: ${quizResult.remainingAttempts}` : `Score: ${quizResult.score}% • Remaining Attempts: ${quizResult.remainingAttempts}`}
                        </div>
                      </div>
                    )}

                    {/* Questions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {activeLesson.quiz.questions?.map((q, qIdx) => (
                        <div key={q.id} style={{ background: '#01071E', border: '1px solid #12315C', borderRadius: '10px', padding: '16px' }}>
                          <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#F5F7FA', marginBottom: '12px' }}>
                            {qIdx + 1}. {q.question}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.choices?.map((choice) => {
                              const isSelected = quizAnswers[q.id] === choice.id;
                              return (
                                <label
                                  key={choice.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    background: isSelected ? 'rgba(4, 136, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                    border: `1px solid ${isSelected ? '#0488F8' : '#12315C'}`,
                                    cursor: 'pointer',
                                    fontSize: '13.5px',
                                    color: '#F5F7FA',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`quiz_q_${q.id}`}
                                    value={choice.id}
                                    checked={isSelected}
                                    onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: choice.id }))}
                                    style={{ accentColor: '#0488F8' }}
                                  />
                                  <span>{choice.text}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Explanation if result received */}
                          {quizResult?.feedback && (
                            (() => {
                              const fb = quizResult.feedback.find((f) => f.questionId === q.id);
                              if (!fb) return null;
                              return (
                                <div
                                  style={{
                                    marginTop: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '6px',
                                    fontSize: '12.5px',
                                    background: fb.isCorrect ? 'rgba(22, 199, 132, 0.08)' : 'rgba(246, 70, 93, 0.08)',
                                    borderInlineStart: `3px solid ${fb.isCorrect ? '#16C784' : '#F6465D'}`,
                                    color: '#F5F7FA',
                                  }}
                                >
                                  <strong>{isAr ? 'التوضيح الفني: ' : 'Explanation: '}</strong>
                                  {fb.explanation}
                                </div>
                              );
                            })()
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={isSubmittingQuiz}
                      onClick={handleQuizSubmit}
                      className="btn-primary"
                      style={{
                        marginTop: '20px',
                        height: '44px',
                        padding: '0 24px',
                        fontSize: '14px',
                        fontWeight: 800,
                        gap: '6px',
                      }}
                    >
                      <FiCheck size={16} />
                      <span>{isSubmittingQuiz ? (isAr ? 'جاري تصحيح الاختبار...' : 'Submitting...') : (isAr ? 'تقديم الاختبار واعتماد النتيجة' : 'Submit Quiz')}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#A7AFBF' }}>
                    <FiHelpCircle size={32} color="#0488F8" style={{ marginBottom: '10px' }} />
                    <div>{isAr ? 'لا يوجد اختبار تقييمي لهذه الحصة حالياً' : 'No quiz scheduled for this lesson.'}</div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Q&A */}
            {activeTab === 'qa' && (
              <div style={{ background: '#06142F', border: '1px solid #12315C', borderRadius: '14px', padding: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 16px 0' }}>
                  {isAr ? 'اطرح سؤالاً على المدرب ومجتمع المتداولين' : 'Ask the Instructor & Community'}
                </h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                  <input
                    type="text"
                    placeholder={isAr ? 'اكتب سؤالك أو استفسارك حول الدرس...' : 'Ask your question regarding this lesson...'}
                    style={{
                      flex: 1,
                      height: '44px',
                      background: '#01071E',
                      border: '1px solid #12315C',
                      borderRadius: '8px',
                      padding: '0 14px',
                      color: '#F5F7FA',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => showToast.success(isAr ? 'تم إرسال سؤالك وسيقوم المحلل بالرد قريباً!' : 'Question posted!')}
                    className="btn-primary"
                    style={{ height: '44px', padding: '0 18px', fontSize: '13px' }}
                  >
                    {isAr ? 'إرسال السؤال' : 'Post Question'}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#01071E', padding: '14px', borderRadius: '10px', border: '1px solid #12315C' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0488F8' }}>أحمد المنصور</span>
                      <span style={{ fontSize: '11px', color: '#687287' }}>منذ 3 ساعات</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#A7AFBF', margin: '0 0 10px 0' }}>
                      هل يفضل تطبيق استراتيجية دايفرجنس الـ RSI على فريم الـ 15 دقيقة أم فريم الأربع ساعات فقط؟
                    </p>
                    <div style={{ background: 'rgba(4, 136, 248, 0.08)', borderInlineStart: '2px solid #0488F8', padding: '8px 12px', fontSize: '12.5px', color: '#F5F7FA' }}>
                      <strong>رد المدرب:</strong> فريم الأربع ساعات واليومي يعطي إشارات أقوى بكثير وأقل ضوضاء، بينما فريم الـ 15 دقيقة مناسب فقط للسكالبينج السريع.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ── Right Column: Playlist & Curriculum Sidebar ── */}
        <aside
          style={{
            background: '#01071E',
            borderInlineStart: '1px solid #12315C',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: '64px',
          }}
        >
          {/* Sidebar Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #12315C', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiLayers size={16} color="#0488F8" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#F5F7FA' }}>
                {isAr ? 'منهاج الدورة' : 'Curriculum'}
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#A7AFBF', fontFamily: 'monospace' }}>
              {allLessons.length} {isAr ? 'حصة' : 'lessons'}
            </span>
          </div>

          {/* Modules List Scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {modules.map((mod, modIdx) => (
              <div key={mod.id || modIdx} style={{ marginBottom: '14px' }}>
                {/* Module Heading */}
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#A7AFBF',
                    padding: '8px 10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '6px',
                    marginBottom: '8px',
                  }}
                >
                  {isAr ? mod.moduleTitleAr : mod.moduleTitleEn}
                </div>

                {/* Lessons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {mod.lessons.map((les) => {
                    const isCurrent = les.id === activeLessonId;
                    const isDone = completedLessonIds.includes(les.id);

                    return (
                      <div
                        key={les.id}
                        onClick={() => {
                          setActiveLessonId(les.id);
                          setIsPlaying(true);
                          setQuizResult(null);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: isCurrent ? 'rgba(4, 136, 248, 0.15)' : 'transparent',
                          border: `1px solid ${isCurrent ? '#0488F8' : 'transparent'}`,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          {/* Checkbox circle */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLessonCompletion(les.id);
                            }}
                            aria-label="Toggle Complete"
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isDone ? '#16C784' : 'transparent',
                              border: `1px solid ${isDone ? '#16C784' : '#687287'}`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#FFF',
                              cursor: 'pointer',
                              flexShrink: 0,
                              padding: 0,
                            }}
                          >
                            {isDone && <FiCheck size={11} />}
                          </button>

                          {/* Lesson Title */}
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: isCurrent ? 700 : 500,
                              color: isCurrent ? '#FFFFFF' : '#A7AFBF',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isAr ? les.titleAr : les.titleEn}
                          </span>
                        </div>

                        {/* Badges / Duration */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {les.hasQuiz && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--accent)',
                                background: 'rgba(251, 135, 4, 0.15)',
                                padding: '1px 5px',
                                borderRadius: '3px',
                              }}
                            >
                              QUIZ
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: isCurrent ? '#0488F8' : '#687287',
                              fontFamily: 'monospace',
                              flexShrink: 0,
                            }}
                          >
                            {les.duration}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <style>{`
        #fxengin-yt-player, iframe#fxengin-yt-player {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border: none !important;
        }
        @media (max-width: 960px) {
          .classroom-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
