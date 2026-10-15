'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../Modal';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../services/apiClient';
import {
  getLiveSessionById,
  setLiveSessionStatus,
  pinChatMessage,
  deleteChatMessage,
  getLiveStatusConfig,
  getStreamCredentials,
  getLiveChatHistory,
  sendLiveChatMessage,
} from '../../services/liveService';
import { toast } from 'react-toastify';
import {
  HiOutlineClipboardCopy,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePlay,
  HiOutlineStop,
  HiOutlineBan,
  HiOutlineBookmark,
  HiOutlineTrash,
  HiOutlineChatAlt,
  HiOutlineRefresh,
  HiOutlineVideoCamera,
  HiOutlineMicrophone,
  HiOutlineDesktopComputer,
  HiOutlinePaperAirplane,
  HiOutlineArrowsExpand,
  HiOutlineSwitchHorizontal,
  HiOutlineMinus,
  HiOutlineExternalLink,
} from 'react-icons/hi';

export default function LiveStudioControlModal({
  isOpen,
  onClose,
  sessionId,
  onSessionUpdated,
}) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState(false);

  // In-Browser Web Studio (Camera / Screen / WebRTC) State
  const [hasCamera, setHasCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [connectedViewersCount, setConnectedViewersCount] = useState(0);
  const [qualityPreset, setQualityPreset] = useState('1080p'); // '1080p' | '720p' | 'smooth'

  // Picture-in-Picture Tab for Lecturer Live stream during Screen Share
  const cameraPipVideoRef = useRef(null);
  const [pipPosition, setPipPosition] = useState('bottom-left'); // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  const [pipSize, setPipSize] = useState('normal'); // 'compact' | 'normal' | 'large'
  const [isPipMinimized, setIsPipMinimized] = useState(false);

  const isScreenSharingRef = useRef(isScreenSharing);
  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  const qualityPresetRef = useRef(qualityPreset);
  useEffect(() => {
    qualityPresetRef.current = qualityPreset;
  }, [qualityPreset]);

  const iceCandidateQueuesRef = useRef({});

  const pipPositionRef = useRef(pipPosition);
  useEffect(() => {
    pipPositionRef.current = pipPosition;
  }, [pipPosition]);

  const pipSizeRef = useRef(pipSize);
  useEffect(() => {
    pipSizeRef.current = pipSize;
  }, [pipSize]);

  const isCameraActiveRef = useRef(isCameraActive);
  useEffect(() => {
    isCameraActiveRef.current = isCameraActive;
  }, [isCameraActive]);

  const isPipMinimizedRef = useRef(isPipMinimized);
  useEffect(() => {
    isPipMinimizedRef.current = isPipMinimized;
  }, [isPipMinimized]);

  const videoPreviewRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({}); // viewerSocketId -> RTCPeerConnection
  const chatEndRef = useRef(null);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      senderName: 'طارق الزهراني',
      senderRole: 'VIP',
      content: 'ما هو الهدف القادم لصفقة الذهب بعد كسر 2,345؟',
      timestamp: '14:32',
      isPinned: true,
    },
    {
      id: 'msg-2',
      senderName: 'أحمد التميمي',
      senderRole: 'TRADER',
      content: 'الصوت والصورة واضحة جداً يا باشا، استمر!',
      timestamp: '14:35',
      isPinned: false,
    },
    {
      id: 'msg-3',
      senderName: 'سارة عبد الله',
      senderRole: 'USER',
      content: 'هل سيتم حفظ التسجيل في قسم الكورسات بعد الانتهاء؟',
      timestamp: '14:38',
      isPinned: false,
    },
  ]);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const [sessionRes, credsRes, chatRes] = await Promise.all([
        getLiveSessionById(sessionId),
        getStreamCredentials(sessionId).catch(() => null),
        getLiveChatHistory(sessionId).catch(() => null),
      ]);

      if (sessionRes.ok && sessionRes.data) {
        const sessData = sessionRes.data.session || sessionRes.data;
        if (credsRes?.ok && credsRes?.data?.streamKey) {
          sessData.streamKey = credsRes.data.streamKey;
        }
        setSession(sessData);
      }

      if (chatRes?.ok && Array.isArray(chatRes.data)) {
        const loadedMessages = [];
        for (const m of chatRes.data) {
          const content = (m.message || m.content || '').trim();
          const sender = m.senderName || '';
          const last = loadedMessages[loadedMessages.length - 1];
          if (last && (last.content || '').trim() === content && last.senderName === sender) {
            continue;
          }
          loadedMessages.push({
            id: m.id,
            senderName: sender,
            senderRole: m.userRole || (m.isModerator ? 'ADMIN' : 'TRADER'),
            content,
            timestamp: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
              : 'الآن',
            isPinned: Boolean(m.isPinned),
          });
        }
        setMessages(loadedMessages);
      }
    } catch {
      toast.error('تعذر جلب بيانات غرفة التحكم بالبث');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSession();
    } else {
      setSession(null);
    }
  }, [isOpen, sessionId, fetchSession]);

  const copyText = (text, label) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`تم نسخ ${label} إلى الحافظة`);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await setLiveSessionStatus(sessionId, newStatus);
      if (res.ok) {
        toast.success(`تم تغيير حالة البث إلى: ${newStatus}`);
        fetchSession();
        if (onSessionUpdated) onSessionUpdated();
      } else {
        toast.error(res.data?.message || 'فشل تحديث حالة البث');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث حالة البث');
    }
  };

  const handleTogglePin = async (msgId, currentPinned) => {
    try {
      const res = await pinChatMessage(sessionId, msgId, !currentPinned);
      if (res.ok || res.status === 200) {
        toast.success(currentPinned ? 'تم إلغاء تثبيت الرسالة' : 'تم تثبيت الرسالة في أعلى القاعة');
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, isPinned: !currentPinned } : m))
        );
      } else {
        toast.error(res.data?.message || 'فشل تعديل تثبيت الرسالة');
      }
    } catch {
      // optimistic fallback
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isPinned: !currentPinned } : m))
      );
      toast.info(currentPinned ? 'تم إلغاء التثبيت' : 'تم تثبيت الرسالة');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة من الدردشة الحية؟')) return;
    try {
      const res = await deleteChatMessage(sessionId, msgId);
      if (res.ok || res.status === 200) {
        toast.success('تم حذف الرسالة وبث الحذف للمشاهدين');
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
      } else {
        toast.error(res.data?.message || 'فشل حذف الرسالة');
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.info('تم حذف الرسالة');
    }
  };

  // --- In-Browser Web Studio (Camera / Mic / Screen Share) Functions ---

  const startCamera = async (overridePreset) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('متصفحك لا يدعم الوصول للكاميرا والميكروفون');
        return;
      }
      const activePreset = overridePreset || qualityPreset;
      const isFHD = activePreset === '1080p';
      const isHD = activePreset === '720p';

      const videoConstraints = isFHD
        ? {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 60, min: 30 },
          }
        : isHD
        ? {
            width: { ideal: 1280, min: 960 },
            height: { ideal: 720, min: 540 },
            frameRate: { ideal: 30 },
          }
        : {
            width: { ideal: 960 },
            height: { ideal: 540 },
            frameRate: { ideal: 24 },
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2,
        },
      });

      cameraStreamRef.current = stream;
      setHasCamera(true);
      setIsCameraActive(true);
      setIsMicActive(true);

      if (!isScreenSharing) {
        localStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.play().catch(() => {});
        }
      } else {
        // While sharing screen, route camera to the floating PiP video tab
        if (cameraPipVideoRef.current) {
          cameraPipVideoRef.current.srcObject = stream;
          cameraPipVideoRef.current.play().catch(() => {});
        }
        // Ensure audio track is preserved in localStreamRef so viewers hear admin
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack && localStreamRef.current) {
          const currentAudio = localStreamRef.current.getAudioTracks()[0];
          if (!currentAudio) {
            localStreamRef.current.addTrack(audioTrack);
          }
        }
      }

      if (isBroadcastingRef.current) {
        broadcastOffersToAllViewers();
      }

      toast.success(
        isFHD
          ? 'تم تشغيل الكاميرا والميكروفون بدقة 1080p Full HD فائقة الوضوح'
          : 'تم تشغيل الكاميرا والميكروفون بنجاح'
      );
    } catch (err) {
      console.error('Error opening camera:', err);
      toast.error('تعذر الوصول للكاميرا أو الميكروفون. يرجى التأكد من منح الإذن للمتصفح.');
    }
  };

  useEffect(() => {
    if (!isScreenSharing && videoPreviewRef.current && localStreamRef.current) {
      if (videoPreviewRef.current.srcObject !== localStreamRef.current) {
        videoPreviewRef.current.srcObject = localStreamRef.current;
      }
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [hasCamera, isScreenSharing]);

  // Synchronize camera stream to Lecturer PiP Video when screen sharing
  useEffect(() => {
    if (isScreenSharing && !isPipMinimized && cameraPipVideoRef.current) {
      if (cameraStreamRef.current && cameraStreamRef.current.getVideoTracks().length > 0) {
        if (cameraPipVideoRef.current.srcObject !== cameraStreamRef.current) {
          cameraPipVideoRef.current.srcObject = cameraStreamRef.current;
        }
        cameraPipVideoRef.current.play().catch(() => {});
      }
    }
  }, [isScreenSharing, isPipMinimized, hasCamera, isCameraActive]);

  const toggleMic = () => {
    const audioTrack =
      localStreamRef.current?.getAudioTracks()[0] ||
      cameraStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = nextState));
      cameraStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = nextState));
      setIsMicActive(nextState);
      toast.info(nextState ? 'تم تفعيل المايك' : 'تم كتم المايك');
    }
  };

  const toggleCamera = () => {
    const stream = isScreenSharing ? cameraStreamRef.current : localStreamRef.current;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((track) => {
          track.enabled = nextState;
        });
        setIsCameraActive(nextState);
        toast.info(nextState ? 'تم تفعيل الكاميرا' : 'تم إيقاف الكاميرا مؤقتاً');
      }
    }
  };

  const cyclePipPosition = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const positions = ['bottom-left', 'bottom-right', 'top-right', 'top-left'];
    const nextIdx = (positions.indexOf(pipPosition) + 1) % positions.length;
    setPipPosition(positions[nextIdx]);
  };

  const cyclePipSize = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const sizes = ['normal', 'large', 'compact'];
    const nextIdx = (sizes.indexOf(pipSize) + 1) % sizes.length;
    setPipSize(sizes[nextIdx]);
  };

  const triggerNativePiP = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (cameraPipVideoRef.current && document.pictureInPictureEnabled) {
        await cameraPipVideoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn('Native PiP notice:', err);
      toast.info('ميزة Picture-in-Picture المنفصلة غير مفعلة أو غير مدعومة في متصفحك.');
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendOfferToViewer = async (viewerSocketId) => {
    if (!isBroadcastingRef.current) return;
    try {
      if (peerConnectionsRef.current[viewerSocketId]) {
        try {
          peerConnectionsRef.current[viewerSocketId].close();
        } catch (e) {}
        delete peerConnectionsRef.current[viewerSocketId];
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      });
      peerConnectionsRef.current[viewerSocketId] = pc;

      const isSharing = isScreenSharingRef.current;
      const screenTrack = screenStreamRef.current?.getVideoTracks()[0];
      const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
      const audioTrack =
        localStreamRef.current?.getAudioTracks()[0] ||
        cameraStreamRef.current?.getAudioTracks()[0];

      if (isSharing && screenTrack && screenTrack.readyState === 'live') {
        // Track 1: OS-Level Screen Capture (Direct hardware pipeline; 60fps and NEVER throttles in background)
        const sStream = new MediaStream([screenTrack]);
        const sender1 = pc.addTrack(screenTrack, sStream);
        try {
          const params1 = sender1.getParameters();
          if (!params1.encodings || params1.encodings.length === 0) params1.encodings = [{}];
          params1.encodings[0].maxBitrate = 5500000;
          params1.encodings[0].maxFramerate = 60;
          params1.encodings[0].degradationPreference = 'maintain-resolution';
          sender1.setParameters(params1).catch(() => {});
        } catch (e) {}

        // Track 2: Native Webcam Capture for Viewer Floating PiP Tab
        if (camTrack && camTrack.readyState === 'live') {
          const cStream = new MediaStream([camTrack]);
          const sender2 = pc.addTrack(camTrack, cStream);
          try {
            const params2 = sender2.getParameters();
            if (!params2.encodings || params2.encodings.length === 0) params2.encodings = [{}];
            params2.encodings[0].maxBitrate = 1400000;
            params2.encodings[0].maxFramerate = 30;
            params2.encodings[0].degradationPreference = 'balanced';
            sender2.setParameters(params2).catch(() => {});
          } catch (e) {}
        }
      } else if (camTrack && camTrack.readyState === 'live') {
        // Normal Camera Mode (Single Video Track)
        const cStream = new MediaStream([camTrack]);
        const sender = pc.addTrack(camTrack, cStream);
        try {
          const params = sender.getParameters();
          if (!params.encodings || params.encodings.length === 0) params.encodings = [{}];
          const bitrateConfig = {
            '1080p': { maxBitrate: 5500000, maxFramerate: 60 },
            '720p': { maxBitrate: 2800000, maxFramerate: 30 },
            smooth: { maxBitrate: 1600000, maxFramerate: 30 },
          };
          const activeCfg = bitrateConfig[qualityPresetRef.current] || bitrateConfig['1080p'];
          params.encodings[0].maxBitrate = activeCfg.maxBitrate;
          params.encodings[0].maxFramerate = activeCfg.maxFramerate;
          params.encodings[0].degradationPreference = 'maintain-resolution';
          sender.setParameters(params).catch(() => {});
        } catch (e) {}
      }

      if (audioTrack && audioTrack.readyState === 'live') {
        const aStream = new MediaStream([audioTrack]);
        pc.addTrack(audioTrack, aStream);
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            targetSocketId: viewerSocketId,
            candidate: e.candidate,
          });
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });

      let enhancedSdp = offer.sdp;
      enhancedSdp = enhancedSdp.replace(
        /a=fmtp:(\d+) (.*minptime.*)/g,
        'a=fmtp:$1 $2;stereo=1;sprop-stereo=1;useinbandfec=1;cbr=0;maxaveragebitrate=128000'
      );
      const finalOffer = new RTCSessionDescription({
        type: offer.type,
        sdp: enhancedSdp,
      });

      await pc.setLocalDescription(finalOffer);
      socketRef.current?.emit('webrtc-offer', {
        targetSocketId: viewerSocketId,
        sdp: finalOffer,
      });
    } catch (err) {
      console.error(`Error sending WebRTC offer to viewer ${viewerSocketId}:`, err);
    }
  };

  const broadcastOffersToAllViewers = () => {
    Object.keys(peerConnectionsRef.current).forEach((viewerSocketId) => {
      sendOfferToViewer(viewerSocketId);
    });
  };

  const startScreenShare = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error('متصفحك لا يدعم مشاركة الشاشة');
        return;
      }

      // If camera is not yet active, proactively start it so the lecturer is visible in PiP
      if (!cameraStreamRef.current) {
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 360 },
              frameRate: { ideal: 30 },
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          cameraStreamRef.current = camStream;
          setHasCamera(true);
          setIsCameraActive(true);
          setIsMicActive(true);
          if (cameraPipVideoRef.current) {
            cameraPipVideoRef.current.srcObject = camStream;
            cameraPipVideoRef.current.play().catch(() => {});
          }
        } catch (camErr) {
          console.warn('Camera not opened initially on screen share:', camErr);
        }
      }

      let screenStream = null;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            frameRate: { ideal: 60 },
          },
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch (displayErr) {
        if (displayErr.name === 'NotAllowedError') {
          return; // User dismissed screen share dialog
        }
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      }
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (!screenVideoTrack) {
        toast.error('لم يتم تحديد شاشة للمشاركة');
        return;
      }

      screenVideoTrack.contentHint = 'detail';
      screenStreamRef.current = screenStream;

      // Preserve mic audio & mix with system audio if captured
      let audioTrack =
        localStreamRef.current?.getAudioTracks()[0] ||
        cameraStreamRef.current?.getAudioTracks()[0];
      if (!audioTrack && hasCamera) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioTrack = micStream.getAudioTracks()[0];
          setIsMicActive(true);
        } catch (e) {
          console.warn('Microphone permission notice:', e);
        }
      }

      const systemAudioTrack = screenStream.getAudioTracks()[0];
      if (systemAudioTrack && audioTrack) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const actx = new AudioCtx();
            const dest = actx.createMediaStreamDestination();
            const micSrc = actx.createMediaStreamSource(new MediaStream([audioTrack]));
            const sysSrc = actx.createMediaStreamSource(new MediaStream([systemAudioTrack]));
            micSrc.connect(dest);
            sysSrc.connect(dest);
            audioTrack = dest.stream.getAudioTracks()[0];
          }
        } catch (mixErr) {
          console.warn('Audio mixing notice:', mixErr);
        }
      } else if (systemAudioTrack && !audioTrack) {
        audioTrack = systemAudioTrack;
      }

      const broadcastStream = new MediaStream([screenVideoTrack]);
      if (audioTrack) broadcastStream.addTrack(audioTrack);
      localStreamRef.current = broadcastStream;

      // Update studio preview
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = screenStream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Update studio local PiP
      if (cameraPipVideoRef.current && cameraStreamRef.current) {
        cameraPipVideoRef.current.srcObject = cameraStreamRef.current;
        cameraPipVideoRef.current.play().catch(() => {});
      }

      isScreenSharingRef.current = true;
      setIsScreenSharing(true);

      // Send multi-track offers (Track 1: Screen, Track 2: Camera PiP) to all viewers
      broadcastOffersToAllViewers();

      toast.success('تم تفعيل مشاركة الشاشة وبث كاميرا المحاضر بجودة فائقة بدون أي تقطيع!');

      screenVideoTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('Error sharing screen:', err);
        toast.error('تعذر مشاركة الشاشة');
      }
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    isScreenSharingRef.current = false;
    setIsScreenSharing(false);

    const camVideoTrack = cameraStreamRef.current?.getVideoTracks()[0];
    const audioTrack =
      localStreamRef.current?.getAudioTracks()[0] ||
      cameraStreamRef.current?.getAudioTracks()[0];

    if (camVideoTrack && camVideoTrack.readyState === 'live') {
      const restored = new MediaStream([camVideoTrack]);
      if (audioTrack) restored.addTrack(audioTrack);
      localStreamRef.current = restored;

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = restored;
        videoPreviewRef.current.play().catch(() => {});
      }
    } else {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }

    // Switch all viewers back to single-track camera stream
    broadcastOffersToAllViewers();
    toast.info('تم إنهاء مشاركة الشاشة والعودة للبث المباشر بالكاميرا');
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const handleSendAdminMessage = async (e) => {
    if (e) e.preventDefault();
    const text = adminChatInput.trim();
    if (!text || isSendingChat) return;

    setIsSendingChat(true);
    const senderName = session?.instructorName || 'المحاضر / الإدارة';
    setAdminChatInput('');

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-chat', {
        sessionId,
        message: text,
        userName: senderName,
        userRole: 'INSTRUCTOR',
        isModerator: true,
      });
      setIsSendingChat(false);
    } else {
      try {
        await sendLiveChatMessage(sessionId, text);
      } catch (err) {
        toast.error('فشل إرسال الرسالة عبر الخادم');
      } finally {
        setIsSendingChat(false);
      }
    }
  };

  const lastViewerToastRef = useRef(0);
  const notifiedViewersRef = useRef(new Set());
  const isBroadcastingRef = useRef(false);

  useEffect(() => {
    isBroadcastingRef.current = isBroadcasting;
  }, [isBroadcasting]);

  // Unified WebSockets connection for real-time chat, audience tracking, and WebRTC signaling
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const socketUrl = API_BASE_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    const iceCandidateQueues = {};

    socket.on('connect', () => {
      socket.emit('join-session', {
        sessionId,
        role: isBroadcastingRef.current ? 'broadcaster' : 'moderator',
        userName: session?.instructorName || 'المحاضر / الإدارة',
      });
    });

    socket.on('new-chat-message', (msg) => {
      if (!msg) return;
      const textContent = (msg.message || msg.content || '').trim();
      const sender = msg.senderName || '';
      if (!textContent) return;

      setMessages((prev) => {
        // 1. Deduplicate by ID
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;

        // 2. Deduplicate consecutive identical messages from the same sender
        if (prev.length > 0) {
          const lastMsg = prev[prev.length - 1];
          const lastContent = (lastMsg.content || lastMsg.message || '').trim();
          const lastSender = lastMsg.senderName || '';
          if (lastContent === textContent && lastSender === sender) {
            return prev;
          }
        }

        return [
          ...prev,
          {
            id: msg.id || `admin-msg-${Date.now()}`,
            senderName: sender,
            senderRole: msg.userRole || (msg.isModerator ? 'INSTRUCTOR' : 'TRADER'),
            isModerator: Boolean(msg.isModerator),
            content: textContent,
            timestamp: msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            isPinned: Boolean(msg.isPinned),
          },
        ];
      });
    });

    socket.on('chat-message-pinned', ({ messageId, isPinned }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isPinned } : m))
      );
    });

    socket.on('chat-message-deleted', ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    });

    socket.on('viewers-count', ({ count }) => {
      if (typeof count === 'number') {
        setConnectedViewersCount(count);
      }
    });

    socket.on('viewer-joined', async ({ viewerSocketId, userName, userId, viewersCount }) => {
      if (!isBroadcastingRef.current) return;

      try {
        await sendOfferToViewer(viewerSocketId);

        if (typeof viewersCount === 'number') {
          setConnectedViewersCount(viewersCount);
        } else {
          setConnectedViewersCount((prev) => prev + 1);
        }

        const viewerKey = userId || userName || viewerSocketId;
        const now = Date.now();
        if (viewerKey && !notifiedViewersRef.current.has(viewerKey) && now - lastViewerToastRef.current > 2000) {
          notifiedViewersRef.current.add(viewerKey);
          lastViewerToastRef.current = now;
          toast.info(`انضم متداول جديد للمشاهدة: ${userName || 'متداول'}`, {
            toastId: `viewer-joined-${viewerKey}`,
            autoClose: 4000,
          });
        }
      } catch (err) {
        console.error('Error setting up WebRTC for viewer:', viewerSocketId, err);
      }
    });

    socket.on('webrtc-answer', async ({ fromSocketId, sdp }) => {
      const pc = peerConnectionsRef.current[fromSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const queue = iceCandidateQueuesRef.current[fromSocketId] || [];
          while (queue.length > 0) {
            const cand = queue.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }
          delete iceCandidateQueuesRef.current[fromSocketId];
        } catch (err) {
          console.error('Error setting remote description on broadcaster:', err);
        }
      }
    });

    socket.on('ice-candidate', async ({ fromSocketId, candidate }) => {
      if (!candidate) return;
      const pc = peerConnectionsRef.current[fromSocketId];
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate on broadcaster:', err);
        }
      } else {
        if (!iceCandidateQueuesRef.current[fromSocketId]) {
          iceCandidateQueuesRef.current[fromSocketId] = [];
        }
        iceCandidateQueuesRef.current[fromSocketId].push(candidate);
      }
    });

    socket.on('viewer-left', ({ viewerSocketId, viewersCount, userId, userName }) => {
      if (peerConnectionsRef.current[viewerSocketId]) {
        peerConnectionsRef.current[viewerSocketId].close();
        delete peerConnectionsRef.current[viewerSocketId];
      }
      if (typeof viewersCount === 'number') {
        setConnectedViewersCount(viewersCount);
      } else {
        setConnectedViewersCount((prev) => Math.max(0, prev - 1));
      }
      const viewerKey = userId || userName || viewerSocketId;
      if (viewerKey) {
        notifiedViewersRef.current.delete(viewerKey);
      }
    });

    return () => {
      isBroadcastingRef.current = false;
      if (socketRef.current) {
        socketRef.current.emit('broadcaster-stop', { sessionId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, sessionId, qualityPreset, session?.instructorName]);

  const startLiveBroadcast = () => {
    if (!localStreamRef.current && !hasCamera && !isScreenSharing) {
      toast.warning('يرجى فتح الكاميرا أو مشاركة الشاشة أولاً قبل بدء البث');
      return;
    }

    isBroadcastingRef.current = true;
    setIsBroadcasting(true);

    if (socketRef.current) {
      socketRef.current.emit('join-session', {
        sessionId,
        role: 'broadcaster',
        userName: session?.instructorName || 'المحاضر / الإدارة',
      });
      socketRef.current.emit('broadcaster-start', { sessionId });
    }

    broadcastOffersToAllViewers();

    toast.success('أنت الآن على الهواء مباشرة بجودة 1080p Full HD وبدون تقطيع!');
    if (onSessionUpdated) onSessionUpdated();
  };

  const stopLiveBroadcast = () => {
    isBroadcastingRef.current = false;
    setIsBroadcasting(false);

    if (socketRef.current) {
      socketRef.current.emit('broadcaster-stop', { sessionId });
      socketRef.current.emit('join-session', {
        sessionId,
        role: 'moderator',
        userName: session?.instructorName || 'المحاضر / الإدارة',
      });
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    notifiedViewersRef.current.clear();

    setConnectedViewersCount(0);
    toast.info('تم إنهاء البث الحي للمتداولين.');
    if (onSessionUpdated) onSessionUpdated();
  };

  if (!isOpen) return null;

  const statusCfg = session ? getLiveStatusConfig(session.status) : null;
  const isLive = session?.status === 'LIVE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="غرفة التحكم المركزية بالبث المباشر (Studio Control Room)"
      subtitle={`إدارة مفاتيح OBS، مشغل البث، والتحكم الفوري بالدردشة: ${session?.title || 'جاري التحميل...'}`}
      maxWidth="max-w-7xl"
    >
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#0488F8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#A7AFBF]">جاري الاتصال باستوديو البث...</span>
        </div>
      ) : !session ? (
        <div className="py-8 text-center text-[#A7AFBF]">تعذر تحميل بيانات جلسة البث.</div>
      ) : (
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Top Ingest & Status Bar */}
          <div className="p-4 rounded-2xl bg-[#06142F] border border-[#12315C] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span
                style={{
                  backgroundColor: statusCfg?.bgColor,
                  color: statusCfg?.color,
                  borderColor: statusCfg?.borderColor,
                }}
                className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2"
              >
                {isLive && <span className="w-2.5 h-2.5 rounded-full bg-[#16C784] animate-ping" />}
                <span>{statusCfg?.labelAr}</span>
              </span>

              <div>
                <h4 className="font-bold text-[#F5F7FA] line-clamp-1">{session.title}</h4>
                <span className="text-xs text-[#A7AFBF]">
                  المحاضر: {session.instructorName || 'كريم زهران'}
                </span>
              </div>
            </div>

            {/* Quick Status Changers */}
            <div className="flex items-center gap-2 flex-wrap">
              {!isLive && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('LIVE')}
                  className="px-3 py-1.5 rounded-xl bg-[#16C784] hover:bg-[#12A86E] text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
                >
                  <HiOutlinePlay />
                  <span>بدء البث (Go LIVE)</span>
                </button>
              )}

              {isLive && (
                <button
                  type="button"
                  onClick={() => handleStatusChange('ENDED')}
                  className="px-3 py-1.5 rounded-xl bg-[#F6465D] hover:bg-[#D9384E] text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
                >
                  <HiOutlineStop />
                  <span>إنهاء البث (End Broadcast)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleStatusChange('CANCELLED')}
                className="px-3 py-1.5 rounded-xl bg-[#12315C] hover:bg-[#1A4278] text-[#A7AFBF] hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-all"
                title="إلغاء الجلسة"
              >
                <HiOutlineBan />
                <span>إلغاء</span>
              </button>
            </div>
          </div>

          {/* ── Main Studio Grid (2-Column Layout) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* ── Column 1: Video Studio & Screen Share (8 Columns) ── */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#06142F] to-[#0A1F44] border border-[#0488F8]/40 space-y-3 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0488F8]/20 flex items-center justify-center text-[#0488F8]">
                      {isScreenSharing ? (
                        <HiOutlineDesktopComputer className="text-lg text-[#A855F7]" />
                      ) : (
                        <HiOutlineVideoCamera className="text-lg" />
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-[#F5F7FA] text-xs sm:text-sm">
                        {isScreenSharing ? 'مشاركة شاشة التحليل الحي (Screen Share)' : 'استوديو البث الحي من المتصفح (Web Studio)'}
                      </h5>
                      <span className="text-[11px] text-[#A7AFBF]">
                        {isScreenSharing
                          ? 'يتم الآن بث شاشتك بدقة 1080p FHD ومعدل بت عالي مع صوت المايكرفون للشرح'
                          : 'افتح الكاميرا والمايك أو شارك شاشتك والمنصات مباشرة للمتداولين'}
                      </span>
                    </div>
                  </div>

                  {isBroadcasting && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#16C784]/15 border border-[#16C784]/30 text-[#16C784] text-xs font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-[#16C784]" />
                      <span>البث نشط على الهواء ({connectedViewersCount} متداول متصل)</span>
                    </div>
                  )}
                </div>

                {/* Video Camera & Screen Preview Screen */}
                <div className="relative w-full aspect-video bg-[#00030D] rounded-xl overflow-hidden border border-[#12315C] flex items-center justify-center">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />

                  {!isScreenSharing && (!hasCamera || !isCameraActive) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-[#00030D]/95 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0488F8]/20 to-[#A855F7]/20 border border-[#A855F7]/40 flex items-center justify-center text-[#A855F7] shadow-lg shadow-[#A855F7]/20 animate-pulse">
                        <HiOutlineDesktopComputer className="text-3xl text-[#C084FC]" />
                      </div>
                      <div className="space-y-1">
                        <h6 className="font-bold text-white text-base">
                          {isBroadcasting ? 'البث نشط على الهواء! اضغط لمشاركة الشاشة' : 'استوديو البث الحي جاهز'}
                        </h6>
                        <p className="text-xs text-[#A7AFBF] max-w-md mx-auto leading-relaxed">
                          {isBroadcasting
                            ? 'المشاهدون متصلون الآن! اضغط بالأسفل لمشاركة شاشة الشارت والمنصات (TradingView/MT5) أو تفعيل الكاميرا:'
                            : 'يمكنك مشاركة شاشتك مباشرة (شارت التداول والمنصات) أو تشغيل الكاميرا والميكروفون للمشاهدين:'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-center pt-1">
                        <button
                          type="button"
                          onClick={startScreenShare}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#7C3AED] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl shadow-[#A855F7]/30 ring-2 ring-[#A855F7]/50 cursor-pointer transition-all animate-bounce"
                        >
                          <HiOutlineDesktopComputer className="text-xl" />
                          <span>مشاركة الشاشة مباشرة (شارت التداول)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => (hasCamera ? toggleCamera() : startCamera())}
                          className="px-4 py-2.5 rounded-xl bg-[#0488F8] hover:bg-[#0370CC] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-[#0488F8]/25 cursor-pointer transition-all"
                        >
                          <HiOutlineVideoCamera className="text-lg" />
                          <span>{hasCamera ? 'تفعيل الكاميرا' : 'تشغيل الكاميرا والمايك'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status Tags inside preview */}
                  {(hasCamera || isScreenSharing) && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                      {isScreenSharing && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#A855F7]/90 backdrop-blur text-[11px] font-bold text-white border border-white/20 shadow flex items-center gap-1.5 animate-pulse">
                          <HiOutlineDesktopComputer className="text-sm" />
                          <span>مشاركة الشاشة (1080p FHD Detail)</span>
                        </span>
                      )}
                      {hasCamera && (
                        <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-[#16C784]' : 'bg-[#F6465D]'}`} />
                          <span>{isCameraActive ? 'الكاميرا نشطة' : 'الكاميرا معطلة'}</span>
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur text-[11px] font-bold text-white border border-white/10 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isMicActive ? 'bg-[#16C784]' : 'bg-[#F6465D]'}`} />
                        <span>{isMicActive ? 'المايك يعمل' : 'المايك مكتوم'}</span>
                      </span>
                    </div>
                  )}

                  {/* Floating Lecturer Live Tab (Picture-in-Picture) during Screen Sharing */}
                  {isScreenSharing && isPipMinimized && (
                    <button
                      type="button"
                      onClick={() => setIsPipMinimized(false)}
                      className={`absolute z-30 ${
                        pipPosition === 'bottom-left'
                          ? 'bottom-3 left-3'
                          : pipPosition === 'bottom-right'
                          ? 'bottom-3 right-3'
                          : pipPosition === 'top-left'
                          ? 'top-14 left-3'
                          : 'top-14 right-3'
                      } px-3 py-1.5 rounded-xl bg-[#06142F]/95 backdrop-blur-md border border-[#0488F8]/60 text-white text-xs font-bold flex items-center gap-2 shadow-2xl shadow-black/90 hover:bg-[#0A1F44] transition-all cursor-pointer animate-pulse`}
                      title="انقر لاستعادة نافذة لايف المحاضر المصغرة"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${isCameraActive ? 'bg-[#16C784] animate-ping' : 'bg-[#F6465D]'}`} />
                      <HiOutlineVideoCamera className="text-sm text-[#0488F8]" />
                      <span>لايف المحاضر</span>
                      <HiOutlineArrowsExpand className="text-xs text-[#A7AFBF]" />
                    </button>
                  )}

                  {isScreenSharing && !isPipMinimized && (
                    <div
                      className={`absolute z-30 ${
                        pipPosition === 'bottom-left'
                          ? 'bottom-3 left-3'
                          : pipPosition === 'bottom-right'
                          ? 'bottom-3 right-3'
                          : pipPosition === 'top-left'
                          ? 'top-14 left-3'
                          : 'top-14 right-3'
                      } ${
                        pipSize === 'compact'
                          ? 'w-44 sm:w-52'
                          : pipSize === 'large'
                          ? 'w-72 sm:w-80'
                          : 'w-56 sm:w-64'
                      } rounded-2xl bg-[#06142F]/95 backdrop-blur-md border border-[#0488F8]/60 shadow-2xl shadow-black/90 flex flex-col overflow-hidden transition-all duration-300 ring-1 ring-white/10`}
                    >
                      {/* PiP Header */}
                      <div className="px-2.5 py-1.5 bg-gradient-to-r from-[#06142F] via-[#0A1F44] to-[#06142F] border-b border-[#12315C] flex items-center justify-between gap-1 select-none">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              hasCamera && isCameraActive ? 'bg-[#16C784] animate-pulse' : 'bg-[#F6465D]'
                            }`}
                          />
                          <span className="text-[11px] font-bold text-white truncate">
                            {session?.instructorName ? `لايف: ${session.instructorName}` : 'لايف المحاضر'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Cycle Corner Position */}
                          <button
                            type="button"
                            onClick={cyclePipPosition}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#A7AFBF] hover:text-white hover:bg-white/10 transition-colors"
                            title="نقل التابة لزاوية أخرى (الزوايا الـ 4)"
                          >
                            <HiOutlineSwitchHorizontal className="text-xs" />
                          </button>

                          {/* Cycle Size */}
                          <button
                            type="button"
                            onClick={cyclePipSize}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#A7AFBF] hover:text-white hover:bg-white/10 transition-colors"
                            title={`تغيير الحجم (الحالي: ${pipSize})`}
                          >
                            <HiOutlineArrowsExpand className="text-xs" />
                          </button>

                          {/* Native Desktop Picture-in-Picture */}
                          <button
                            type="button"
                            onClick={triggerNativePiP}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#A7AFBF] hover:text-[#0488F8] hover:bg-white/10 transition-colors"
                            title="فصل في نافذة عائمة على سطح المكتب (Desktop PiP)"
                          >
                            <HiOutlineExternalLink className="text-xs" />
                          </button>

                          {/* Minimize */}
                          <button
                            type="button"
                            onClick={() => setIsPipMinimized(true)}
                            className="w-5 h-5 rounded flex items-center justify-center text-[#A7AFBF] hover:text-[#F6465D] hover:bg-white/10 transition-colors"
                            title="تصغير التابة"
                          >
                            <HiOutlineMinus className="text-xs" />
                          </button>
                        </div>
                      </div>

                      {/* PiP Video Body */}
                      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden group">
                        <video
                          ref={cameraPipVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className={`w-full h-full object-cover transition-opacity duration-200 ${
                            hasCamera && isCameraActive ? 'opacity-100' : 'opacity-0 absolute'
                          }`}
                        />

                        {/* Fallback overlay when Camera is Off or not opened */}
                        {(!hasCamera || !isCameraActive) && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-[#06142F]/90 space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-[#12315C] flex items-center justify-center text-[#A7AFBF]">
                              <HiOutlineVideoCamera className="text-base" />
                            </div>
                            <span className="text-[10px] text-[#A7AFBF] font-medium leading-tight">
                              {hasCamera ? 'الكاميرا متوقفة مؤقتاً' : 'كاميرا المحاضر غير مفعلة'}
                            </span>
                            <button
                              type="button"
                              onClick={hasCamera ? toggleCamera : () => startCamera()}
                              className="px-2.5 py-1 rounded-lg bg-[#0488F8] hover:bg-[#0370CC] text-white text-[10px] font-bold shadow cursor-pointer transition-all flex items-center gap-1"
                            >
                              <HiOutlineVideoCamera className="text-xs" />
                              <span>{hasCamera ? 'تفعيل الكاميرا' : 'تشغيل الكاميرا'}</span>
                            </button>
                          </div>
                        )}

                        {/* Hover Overlay Controls */}
                        {hasCamera && isCameraActive && (
                          <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                            <span className="text-[9.5px] text-white/90 font-bold px-1 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#16C784]" />
                              <span>كاميرا حية</span>
                            </span>

                            <button
                              type="button"
                              onClick={toggleCamera}
                              className="px-2 py-0.5 rounded bg-black/60 hover:bg-[#F6465D] text-white text-[9.5px] font-bold border border-white/20 transition-all cursor-pointer"
                              title="إيقاف الكاميرا مؤقتاً"
                            >
                              إيقاف مؤقت
                            </button>
                          </div>
                        )}
                      </div>

                      {/* PiP Footer Status */}
                      <div className="px-2.5 py-1 bg-[#040D1E] border-t border-[#12315C]/60 flex items-center justify-between text-[9.5px] text-[#A7AFBF]">
                        <span className="truncate">
                          {pipPosition === 'bottom-left' && 'الزاوية: أسفل اليسار'}
                          {pipPosition === 'bottom-right' && 'الزاوية: أسفل اليمين'}
                          {pipPosition === 'top-left' && 'الزاوية: أعلى اليسار'}
                          {pipPosition === 'top-right' && 'الزاوية: أعلى اليمين'}
                        </span>
                        <span className="text-[#0488F8] font-bold text-[9px] uppercase tracking-wider">
                          {pipSize}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Studio Controls Toolbar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#12315C]/60">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isScreenSharing
                          ? 'bg-[#A855F7] text-white border-[#A855F7] shadow-lg shadow-[#A855F7]/40 ring-2 ring-[#A855F7]/50 animate-pulse'
                          : 'bg-gradient-to-r from-[#A855F7]/30 to-[#7C3AED]/30 text-[#C084FC] hover:text-white border-[#A855F7]/50 hover:bg-[#A855F7] hover:border-[#A855F7]'
                      }`}
                      title="مشاركة شاشة الكمبيوتر أو نافذة التداول للمشاهدين"
                    >
                      <HiOutlineDesktopComputer className="text-base" />
                      <span>{isScreenSharing ? 'إيقاف مشاركة الشاشة' : 'مشاركة الشاشة (شارت)'}</span>
                    </button>

                    {isScreenSharing && (
                      <button
                        type="button"
                        onClick={() => setIsPipMinimized((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                          !isPipMinimized
                            ? 'bg-[#0488F8]/20 text-[#0488F8] border-[#0488F8]/50 shadow-md shadow-[#0488F8]/20'
                            : 'bg-[#12315C] text-[#A7AFBF] hover:text-white border-[#1E4984]'
                        }`}
                        title="إظهار أو تصغير تابة كاميرا المحاضر أثناء مشاركة الشاشة"
                      >
                        <HiOutlineVideoCamera className="text-base" />
                        <span>{isPipMinimized ? 'إظهار تابة المحاضر' : 'تابة المحاضر (نشطة)'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={hasCamera ? toggleCamera : () => startCamera()}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        hasCamera && isCameraActive
                          ? 'bg-[#12315C] text-[#F5F7FA] border-[#1E4984] hover:bg-[#1A4278]'
                          : hasCamera && !isCameraActive
                          ? 'bg-[#F6465D]/15 text-[#F6465D] border-[#F6465D]/30'
                          : 'bg-[#12315C] text-[#A7AFBF] hover:text-white border-[#1E4984]'
                      }`}
                    >
                      <HiOutlineVideoCamera className="text-base" />
                      <span>{hasCamera ? (isCameraActive ? 'إيقاف الكاميرا' : 'تفعيل الكاميرا') : 'فتح الكاميرا'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        isMicActive
                          ? 'bg-[#12315C] text-[#F5F7FA] border-[#1E4984] hover:bg-[#1A4278]'
                          : 'bg-[#F6465D]/15 text-[#F6465D] border-[#F6465D]/30'
                      }`}
                    >
                      <HiOutlineMicrophone className="text-base" />
                      <span>{isMicActive ? 'كتم المايك' : 'تشغيل المايك'}</span>
                    </button>
                  </div>

                  {/* Quality Presets & Start/Stop Live */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#00030D] p-1 rounded-xl border border-[#12315C]">
                      <span className="text-[10.5px] text-[#A7AFBF] px-2 font-bold">الجودة:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setQualityPreset('1080p');
                          if (hasCamera) startCamera('1080p');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          qualityPreset === '1080p'
                            ? 'bg-[#0488F8] text-white shadow-md'
                            : 'text-[#A7AFBF] hover:text-white'
                        }`}
                        title="1080p Full HD @ 60fps"
                      >
                        1080p
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQualityPreset('720p');
                          if (hasCamera) startCamera('720p');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          qualityPreset === '720p'
                            ? 'bg-[#0488F8] text-white shadow-md'
                            : 'text-[#A7AFBF] hover:text-white'
                        }`}
                        title="720p HD @ 30fps"
                      >
                        720p
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setQualityPreset('smooth');
                          if (hasCamera) startCamera('smooth');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          qualityPreset === 'smooth'
                            ? 'bg-[#0488F8] text-white shadow-md'
                            : 'text-[#A7AFBF] hover:text-white'
                        }`}
                        title="Smooth Mobile"
                      >
                        Smooth
                      </button>
                    </div>

                    {!isBroadcasting ? (
                      <button
                        type="button"
                        onClick={startLiveBroadcast}
                        disabled={!hasCamera && !isScreenSharing}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#F6465D] to-[#E02438] hover:opacity-90 disabled:opacity-40 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#F6465D]/30 cursor-pointer transition-all animate-bounce"
                      >
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                        <span>بدء البث الحي الآن</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopLiveBroadcast}
                        className="px-5 py-2 rounded-xl bg-[#F6465D] hover:bg-[#D9384E] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                      >
                        <HiOutlineStop />
                        <span>إنهاء البث الحي</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OBS / Streaming Credentials Box */}
              <div className="p-4 rounded-2xl bg-[#06142F] border border-[#12315C] space-y-3 shadow-lg">
                <h5 className="font-bold text-[#F5F7FA] text-xs">
                  إعدادات الإدخال لبرامج البث الخارجية (OBS Studio / vMix / RTMP Ingest):
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#A7AFBF] mb-1">
                      رابط خادم البث (RTMP Server URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="rtmp://live.fxengen.com/live"
                        className="flex-1 h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={() => copyText('rtmp://live.fxengen.com/live', 'رابط السيرفر')}
                        className="p-2 rounded-lg bg-[#12315C] text-[#0488F8] hover:bg-[#1A4278] cursor-pointer"
                        title="نسخ"
                      >
                        <HiOutlineClipboardCopy />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#A7AFBF] mb-1">
                      مفتاح البث المخصص (Stream Key)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showKey ? 'text' : 'password'}
                        readOnly
                        value={session?.streamKey || 'جاري التوليد...'}
                        className="flex-1 h-9 px-3 rounded-lg bg-[#0A1B3D] border border-[#12315C] text-[#F5F7FA] font-mono text-xs dir-ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="p-2 rounded-lg bg-[#12315C] text-[#A7AFBF] hover:text-white cursor-pointer"
                        title={showKey ? 'إخفاء' : 'إظهار'}
                      >
                        {showKey ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(session?.streamKey || '', 'مفتاح البث')
                        }
                        className="p-2 rounded-lg bg-[#12315C] text-[#0488F8] hover:bg-[#1A4278] cursor-pointer"
                        title="نسخ"
                      >
                        <HiOutlineClipboardCopy />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Column 2: Interactive Real-time Chatbox (4 Columns) ── */}
            <div className="lg:col-span-4 rounded-2xl bg-[#06142F] border border-[#12315C] flex flex-col h-[640px] overflow-hidden shadow-xl">
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-[#12315C] flex items-center justify-between bg-[#0A1B3D]/60 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#A855F7]/20 flex items-center justify-center text-[#A855F7]">
                    <HiOutlineChatAlt className="text-lg" />
                  </div>
                  <div>
                    <h5 className="font-bold text-[#F5F7FA] text-xs sm:text-sm flex items-center gap-1.5">
                      <span>دردشة البث المباشر</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#12315C] text-[#0488F8] text-[10px] font-bold">
                        {messages.length} رسائل
                      </span>
                    </h5>
                    <span className="text-[10px] text-[#16C784] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16C784] animate-pulse" />
                      <span>الدردشة متصلة وفورية مع الحضور</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchSession}
                  className="p-1.5 rounded-lg bg-[#12315C] text-[#A7AFBF] hover:text-white cursor-pointer transition-all"
                  title="تحديث الرسائل"
                >
                  <HiOutlineRefresh className="text-sm" />
                </button>
              </div>

              {/* Quick Announcement / Signal Chips for Admin */}
              <div className="px-3 py-2 bg-[#00030D]/60 border-b border-[#12315C]/60 flex items-center gap-1.5 overflow-x-auto shrink-0">
                <span className="text-[10px] text-[#A7AFBF] font-bold shrink-0">سريعة:</span>
                {[
                  'مرحباً بكم جميعاً',
                  'تحليل مباشر EUR/USD',
                  'صفقة جديدة قيد التجهيز',
                  'التزموا بإدارة المخاطر',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdminChatInput(chip)}
                    className="px-2.5 py-1 rounded-lg bg-[#12315C]/80 hover:bg-[#0488F8]/20 hover:border-[#0488F8]/40 border border-[#1E4984] text-[10.5px] text-[#F5F7FA] whitespace-nowrap cursor-pointer transition-all shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Messages Scrollable Stream */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[460px]">
                {messages.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-center text-[#A7AFBF] text-xs">
                    <HiOutlineChatAlt className="text-3xl mb-1 opacity-40" />
                    <span>لا توجد رسائل حتى الآن، اكتب رسالة ترحيبية للمشاهدين!</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInstructor =
                      msg.isModerator ||
                      msg.senderRole === 'INSTRUCTOR' ||
                      msg.senderRole === 'ADMIN' ||
                      msg.senderRole === 'SUPER_ADMIN';

                    return (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          msg.isPinned
                            ? 'bg-[#FB8704]/10 border-[#FB8704]/40'
                            : isInstructor
                            ? 'bg-[#0488F8]/10 border-[#0488F8]/30'
                            : 'bg-[#0A1B3D] border-[#12315C]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-xs ${isInstructor ? 'text-[#0488F8]' : 'text-[#F5F7FA]'}`}>
                              {msg.senderName}
                            </span>
                            {isInstructor ? (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#0488F8] text-white font-bold">
                                ★ المحاضر / الإدارة
                              </span>
                            ) : (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-[#12315C] text-[#A7AFBF] font-semibold">
                                {msg.senderRole || 'متداول'}
                              </span>
                            )}
                            <span className="text-[10px] text-[#687287] font-tabular">
                              {msg.timestamp}
                            </span>
                            {msg.isPinned && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#FB8704]/20 text-[#FB8704] font-bold">
                                مثبتة
                              </span>
                            )}
                          </div>

                          {/* Moderation Controls (Pin / Delete) */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleTogglePin(msg.id, msg.isPinned)}
                              className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                                msg.isPinned
                                  ? 'bg-[#FB8704]/20 text-[#FB8704]'
                                  : 'text-[#A7AFBF] hover:text-white hover:bg-[#12315C]'
                              }`}
                              title={msg.isPinned ? 'إلغاء التثبيت' : 'تثبيت في الشات'}
                            >
                              <HiOutlineBookmark />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 rounded text-[#F6465D] hover:bg-[#F6465D]/20 cursor-pointer"
                              title="حذف الرسالة"
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-[#E2E8F0] leading-relaxed break-words">
                          {msg.content}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Written Admin Chat Input Form */}
              <form
                onSubmit={handleSendAdminMessage}
                className="p-3 bg-[#0A1B3D] border-t border-[#12315C] flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={adminChatInput}
                  onChange={(e) => setAdminChatInput(e.target.value)}
                  placeholder="اكتب رسالة للمتداولين والمشاهدين الآن..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-[#06142F] border border-[#12315C] focus:border-[#0488F8] text-[#F5F7FA] placeholder-[#687287] text-xs outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!adminChatInput.trim() || isSendingChat}
                  className="h-10 px-4 rounded-xl bg-[#0488F8] hover:bg-[#0370CC] disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#0488F8]/20 cursor-pointer shrink-0"
                >
                  {isSendingChat ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <HiOutlinePaperAirplane className="rotate-90 text-sm" />
                      <span>إرسال</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#12315C] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#12315C] text-[#A7AFBF] hover:text-white cursor-pointer"
            >
              إغلاق غرفة التحكم
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
