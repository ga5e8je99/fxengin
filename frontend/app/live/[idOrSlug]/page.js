'use client';

import { useState, useEffect, useRef, useMemo, useCallback, use } from 'react';
import { io } from 'socket.io-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiArrowLeft,
  FiArrowRight,
  FiPlay,
  FiPause,
  FiRadio,
  FiUsers,
  FiSend,
  FiLock,
  FiShield,
  FiAlertCircle,
  FiMessageSquare,
  FiShare2,
  FiSmile,
  FiVolume2,
  FiMaximize2,
  FiBookmark,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiVideo,
  FiRefreshCw,
  FiX,
  FiMinimize2,
} from 'react-icons/fi';
import {
  fetchLiveRoom,
  fetchLiveChatHistory,
  sendLiveChatMessage,
  verifyLiveAccessCode,
  checkLiveEmailAccess,
  DEFAULT_RTMP_SERVER_URL,
  DEFAULT_STREAM_KEY,
  getSessionPlaybackUrl,
} from '../../services/liveService';
import WebinarPaymentModal from '../../components/WebinarPaymentModal';
import { showToast } from '../../utils/toast';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { getAppRoute } from '../../utils/routes';

function StreamVideoPlayer({ streamUrl, title, isAr }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hlsInstance = null;
    const isM3u8 = streamUrl.includes('.m3u8') || streamUrl.includes('/live/');

    if (isM3u8) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      } else {
        import('hls.js').then(({ default: Hls }) => {
          if (!videoRef.current) return;
          if (Hls.isSupported()) {
            // High Definition Anti-Stutter HLS Configuration
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false, // Stable live playback preventing edge starvation
              backBufferLength: 90,
              maxBufferLength: 30, // 30-second safe buffer
              maxMaxBufferLength: 60,
              maxBufferSize: 60 * 1000 * 1000, // 60MB smooth buffer for 1080p FHD
              maxBufferHole: 0.5,
              highBufferWatchdogPeriod: 2,
              nudgeOffset: 0.1,
              nudgeMaxRetry: 5,
              liveSyncDurationCount: 3, // Safe sync buffer: buffers 3 chunks ahead to guarantee 0 stutter
              liveMaxLatencyDurationCount: 8,
              liveDurationInfinity: true,
              manifestLoadingTimeOut: 15000,
              manifestLoadingMaxRetry: 6,
              levelLoadingTimeOut: 15000,
              levelLoadingMaxRetry: 6,
              fragLoadingTimeOut: 20000,
              fragLoadingMaxRetry: 6,
              startLevel: -1, // Auto / Highest available quality
              autoStartLoad: true,
            });
            hlsInstance = hls;
            hls.loadSource(streamUrl);
            hls.attachMedia(videoRef.current);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {
                  if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                  }
                });
              }
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal && hlsInstance) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.warn('HLS Network Error, auto recovering...', data);
                    hlsInstance.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.warn('HLS Media Error, auto recovering...', data);
                    hlsInstance.recoverMediaError();
                    break;
                  default:
                    console.error('Fatal HLS Error, reloading source...', data);
                    try {
                      hlsInstance.destroy();
                    } catch (e) {}
                    break;
                }
              }
            });
          } else {
            videoRef.current.src = streamUrl;
          }
        }).catch(() => {
          if (videoRef.current) {
            videoRef.current.src = streamUrl;
          }
        });
      }
    } else {
      video.src = streamUrl;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [streamUrl]);

  if (!streamUrl) return null;

  const isYoutube = streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be');
  if (isYoutube) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = streamUrl.match(regExp);
    const embedUrl = match && match[2]?.length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`
      : streamUrl;

    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      title={title}
      controls
      autoPlay
      playsInline
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}

function optimizeSdpForUltraLowLatency(sdp) {
  if (!sdp) return sdp;
  let modifiedSdp = sdp;
  // Enable Opus High-Fidelity & Inband Forward Error Correction (FEC)
  // FEC enables the decoder to reconstruct lost audio packets seamlessly with ZERO stutter!
  modifiedSdp = modifiedSdp.replace(
    /a=fmtp:(\d+) (.*minptime.*)/g,
    'a=fmtp:$1 $2;stereo=1;sprop-stereo=1;useinbandfec=1;cbr=0;maxaveragebitrate=128000;minptime=20;maxptime=40'
  );
  if (!modifiedSdp.includes('useinbandfec=1')) {
    modifiedSdp = modifiedSdp.replace(
      /(a=rtpmap:(\d+) opus\/48000\/2\r\n)/,
      '$1a=fmtp:$2 stereo=1;sprop-stereo=1;useinbandfec=1;cbr=0;maxaveragebitrate=128000;minptime=20\r\n'
    );
  }
  return modifiedSdp;
}

function UnifiedLiveStreamPlayer({
  sessionId,
  streamUrl,
  title,
  isAr,
  user,
  onNewChatMessage,
  onPinChatMessage,
  onDeleteChatMessage,
  socketRef: externalSocketRef,
}) {
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const localSocketRef = useRef(null);
  const socketRef = externalSocketRef || localSocketRef;
  const [isWebRtcLive, setIsWebRtcLive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamQualityInfo, setStreamQualityInfo] = useState({ resolution: '1080p FHD', fps: 60, status: 'مستقر' });

  // Floating Lecturer Live Camera PiP Tab for Viewer
  const pipVideoRef = useRef(null);
  const pipStreamRef = useRef(null);
  const [hasPipStream, setHasPipStream] = useState(false);
  const [viewerPipPos, setViewerPipPos] = useState('bottom-left'); // 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left'
  const [viewerPipSize, setViewerPipSize] = useState('normal'); // 'compact' | 'normal' | 'large'
  const [isViewerPipMinimized, setIsViewerPipMinimized] = useState(false);

  const cycleViewerPipPos = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const positions = ['bottom-left', 'bottom-right', 'top-right', 'top-left'];
    const nextIdx = (positions.indexOf(viewerPipPos) + 1) % positions.length;
    setViewerPipPos(positions[nextIdx]);
  };

  const cycleViewerPipSize = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const sizes = ['normal', 'large', 'compact'];
    const nextIdx = (sizes.indexOf(viewerPipSize) + 1) % sizes.length;
    setViewerPipSize(sizes[nextIdx]);
  };

  const getViewerPipPositionStyle = (pos) => {
    switch (pos) {
      case 'bottom-right':
        return { bottom: '18px', right: '18px' };
      case 'top-left':
        return { top: '60px', left: '18px' };
      case 'top-right':
        return { top: '60px', right: '18px' };
      case 'bottom-left':
      default:
        return { bottom: '18px', left: '18px' };
    }
  };

  const getViewerPipSizeStyle = (size) => {
    switch (size) {
      case 'compact':
        return { width: '220px', height: '135px' };
      case 'large':
        return { width: '360px', height: '220px' };
      case 'normal':
      default:
        return { width: '280px', height: '172px' };
    }
  };

  // Keep latest callbacks in refs to prevent useEffect reconnection thrashing
  const onNewChatMessageRef = useRef(onNewChatMessage);
  const onPinChatMessageRef = useRef(onPinChatMessage);
  const onDeleteChatMessageRef = useRef(onDeleteChatMessage);
  useEffect(() => {
    onNewChatMessageRef.current = onNewChatMessage;
    onPinChatMessageRef.current = onPinChatMessage;
    onDeleteChatMessageRef.current = onDeleteChatMessage;
  }, [onNewChatMessage, onPinChatMessage, onDeleteChatMessage]);

  // Check if streamUrl is an actual stream (e.g. YouTube or real live external source), not the dummy placeholder
  const isRealExternalStream = useMemo(() => {
    if (!streamUrl) return false;
    if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) return true;
    if (streamUrl.includes('fxengen.com')) return false; // dummy placeholder domain
    return streamUrl.includes('.m3u8') || streamUrl.includes('.mp4');
  }, [streamUrl]);

  useEffect(() => {
    if (!sessionId) return;

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    const candidateQueue = [];

    let hasJoined = false;
    let joinTimer = null;
    const requestJoin = () => {
      if (hasJoined) return;
      if (joinTimer) clearTimeout(joinTimer);
      joinTimer = setTimeout(() => {
        if (socket.connected) {
          hasJoined = true;
          socket.emit('join-session', {
            sessionId,
            role: 'viewer',
            userId: user?.id,
            userName: user?.fullName || 'متداول',
          });
        }
      }, 100);
    };

    socket.on('connect', () => {
      hasJoined = false;
      requestJoin();
    });

    socket.on('broadcaster-online', () => {
      if (!pcRef.current || pcRef.current.connectionState !== 'connected') {
        hasJoined = false;
        requestJoin();
      }
    });

    socket.on('stream-started', () => {
      if (!pcRef.current || pcRef.current.connectionState !== 'connected') {
        hasJoined = false;
        requestJoin();
      }
    });

    socket.on('webrtc-offer', async ({ fromSocketId, sdp }) => {
      if (pcRef.current) {
        try {
          pcRef.current.close();
        } catch (e) {}
      }

      setHasPipStream(false);
      pipStreamRef.current = null;
      if (pipVideoRef.current) {
        pipVideoRef.current.srcObject = null;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      });
      pcRef.current = pc;

      const receivedVideoTrackIds = [];

      pc.ontrack = (event) => {
        try {
          if (event.receiver) {
            // Anti-Stuttering Jitter Buffer Smoothing:
            // 250ms target absorbs packet arrival variances and prevents micro-freezes
            if ('playoutDelayHint' in event.receiver) {
              event.receiver.playoutDelayHint = 0.25;
            }
            if ('jitterBufferTarget' in event.receiver) {
              event.receiver.jitterBufferTarget = 250;
            }
          }
        } catch (e) {}

        if (event.track.kind === 'video') {
          const isSecondVideo =
            receivedVideoTrackIds.length > 0 &&
            !receivedVideoTrackIds.includes(event.track.id);

          if (!receivedVideoTrackIds.includes(event.track.id)) {
            receivedVideoTrackIds.push(event.track.id);
          }

          if (isSecondVideo) {
            // Second video is the Lecturer Camera PiP!
            const pipStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
            pipStreamRef.current = pipStream;
            if (pipVideoRef.current) {
              pipVideoRef.current.srcObject = pipStream;
              pipVideoRef.current.muted = true;
              pipVideoRef.current.play().catch(() => {});
            }
            setHasPipStream(true);

            event.track.onended = () => {
              setHasPipStream(false);
              pipStreamRef.current = null;
            };
          } else {
            // First video is Main Stage (Screen or Camera)
            const incomingStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
            if (videoRef.current) {
              if (videoRef.current.srcObject !== incomingStream) {
                videoRef.current.srcObject = incomingStream;
              }
              videoRef.current.muted = true;
              videoRef.current.playbackRate = 1.0;
              videoRef.current.play().catch((err) => {
                console.log('Autoplay play deferred:', err);
              });
              setIsWebRtcLive(true);
            }
          }
        } else if (event.track.kind === 'audio') {
          if (videoRef.current) {
            if (!videoRef.current.srcObject) {
              videoRef.current.srcObject = new MediaStream([event.track]);
            } else {
              const currentAudio = videoRef.current.srcObject.getAudioTracks();
              if (!currentAudio.some((t) => t.id === event.track.id)) {
                videoRef.current.srcObject.addTrack(event.track);
              }
            }
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit('ice-candidate', {
            targetSocketId: fromSocketId,
            candidate: event.candidate,
          });
        }
      };

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        while (candidateQueue.length > 0) {
          const cand = candidateQueue.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.warn('Error flushing ICE candidate:', err);
          }
        }

        const answer = await pc.createAnswer();
        const lowLatencyAnswerSdp = optimizeSdpForUltraLowLatency(answer.sdp);
        const optimizedAnswer = new RTCSessionDescription({
          type: answer.type,
          sdp: lowLatencyAnswerSdp,
        });
        await pc.setLocalDescription(optimizedAnswer);
        socket.emit('webrtc-answer', {
          targetSocketId: fromSocketId,
          sdp: optimizedAnswer,
        });
      } catch (err) {
        console.error('Error in WebRTC answer negotiation:', err);
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      if (!candidate) return;
      const pc = pcRef.current;
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding ICE candidate on viewer:', err);
        }
      } else {
        candidateQueue.push(candidate);
      }
    });

    socket.on('new-chat-message', (msg) => {
      if (onNewChatMessageRef.current && msg) {
        onNewChatMessageRef.current(msg);
      }
    });

    socket.on('chat-message-pinned', (data) => {
      if (onPinChatMessageRef.current && data) {
        onPinChatMessageRef.current(data);
      }
    });

    socket.on('chat-message-deleted', (data) => {
      if (onDeleteChatMessageRef.current && data) {
        onDeleteChatMessageRef.current(data);
      }
    });

    socket.on('broadcaster-offline', () => {
      setIsWebRtcLive(false);
      setHasPipStream(false);
      pipStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
      if (pcRef.current) pcRef.current.close();
    });

    socket.on('stream-stopped', () => {
      setIsWebRtcLive(false);
      setHasPipStream(false);
      pipStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
      if (pcRef.current) pcRef.current.close();
    });

    return () => {
      if (joinTimer) clearTimeout(joinTimer);
      socket.disconnect();
      if (pcRef.current) pcRef.current.close();
    };
  }, [sessionId, user?.id]);

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const unmuteAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div
      ref={videoContainerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* 1. WebRTC Video Element (Always present in DOM to prevent display stalls) */}
      <video
        ref={videoRef}
        title={title}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#000',
        }}
      />

      {/* Floating Lecturer Live Camera PiP Tab for Viewer */}
      {hasPipStream && !isViewerPipMinimized && (
        <div
          style={{
            position: 'absolute',
            zIndex: 25,
            ...getViewerPipPositionStyle(viewerPipPos),
            ...getViewerPipSizeStyle(viewerPipSize),
            borderRadius: '14px',
            overflow: 'hidden',
            background: 'rgba(6, 20, 47, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(4, 136, 248, 0.55)',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(4, 136, 248, 0.25)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* PiP Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'linear-gradient(180deg, rgba(6, 20, 47, 0.98) 0%, rgba(6, 20, 47, 0.75) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              userSelect: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#16C784',
                  boxShadow: '0 0 8px #16C784',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#FFF' }}>
                {isAr ? 'لايف المحاضر (مباشر)' : 'Instructor Live'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {/* Position Switcher */}
              <button
                type="button"
                onClick={cycleViewerPipPos}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#A0AEC0',
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                title={isAr ? 'تغيير المكان' : 'Move Window'}
              >
                <FiRefreshCw size={11} />
              </button>

              {/* Size Switcher */}
              <button
                type="button"
                onClick={cycleViewerPipSize}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#A0AEC0',
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  transition: 'all 0.15s',
                }}
                title={isAr ? 'تغيير الحجم' : 'Resize'}
              >
                {viewerPipSize === 'compact' ? 'S' : viewerPipSize === 'large' ? 'L' : 'M'}
              </button>

              {/* Minimize Button */}
              <button
                type="button"
                onClick={() => setIsViewerPipMinimized(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#A0AEC0',
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                title={isAr ? 'تصغير' : 'Minimize'}
              >
                <FiMinimize2 size={11} />
              </button>
            </div>
          </div>

          {/* PiP Video Body */}
          <div style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, background: '#000' }}>
            <video
              ref={(el) => {
                pipVideoRef.current = el;
                if (el && pipStreamRef.current && el.srcObject !== pipStreamRef.current) {
                  el.srcObject = pipStreamRef.current;
                  el.muted = true;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* Minimized Restore Badge */}
      {hasPipStream && isViewerPipMinimized && (
        <button
          type="button"
          onClick={() => setIsViewerPipMinimized(false)}
          style={{
            position: 'absolute',
            bottom: '18px',
            left: isAr ? '18px' : 'auto',
            right: isAr ? 'auto' : '18px',
            zIndex: 25,
            background: 'rgba(6, 20, 47, 0.92)',
            border: '1.5px solid rgba(4, 136, 248, 0.6)',
            borderRadius: '20px',
            padding: '6px 14px',
            color: '#FFF',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#16C784',
              boxShadow: '0 0 7px #16C784',
            }}
          />
          <span>{isAr ? 'كاميرا المحاضر' : 'Instructor Cam'}</span>
        </button>
      )}

      {/* 2. WebRTC Live Overlay Badges & Quality Indicators */}
      {isWebRtcLive && (
        <>
          <div
            style={{
              position: 'absolute',
              top: '14px',
              right: isAr ? '14px' : 'auto',
              left: isAr ? 'auto' : '14px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {/* Live Indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(22, 199, 132, 0.25)',
                border: '1px solid rgba(22, 199, 132, 0.6)',
                color: '#16C784',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 800,
                backdropFilter: 'blur(8px)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#16C784',
                  boxShadow: '0 0 8px #16C784',
                }}
              />
              <span>{isAr ? 'بث استوديو مباشر' : 'Live Broadcast'}</span>
            </div>

            {/* Anti-Stutter & High Quality 1080p Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(4, 136, 248, 0.25)',
                border: '1px solid rgba(4, 136, 248, 0.5)',
                color: '#45ACFF',
                padding: '5px 11px',
                borderRadius: '20px',
                fontSize: '10.5px',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
              }}
              title={isAr ? 'تقنية منع التقطيع وتصحيح الأخطاء التلقائي نشطة' : 'Anti-Stutter Buffer Active'}
            >
              <FiShield size={12} color="#45ACFF" />
              <span>1080p FHD • {isAr ? 'مانع التقطيع نشط' : 'Smooth Buffer'}</span>
            </div>
          </div>

          {/* Top-Right/Left Controls (Fullscreen) */}
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: isAr ? '14px' : 'auto',
              right: isAr ? 'auto' : '14px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFF',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
              }}
              title={isAr ? 'ملء الشاشة' : 'Fullscreen'}
            >
              <FiMaximize2 size={15} />
            </button>
          </div>

          {/* Unmute Prompt Button */}
          {isMuted && (
            <button
              type="button"
              onClick={unmuteAudio}
              style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 15,
                background: 'linear-gradient(135deg, #0488F8 0%, #0369C7 100%)',
                color: '#FFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 24px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 24px rgba(4, 136, 248, 0.4)',
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s ease',
              }}
            >
              <FiVolume2 size={17} />
              <span>{isAr ? 'اضغط لتشغيل الصوت الفائق (HD Audio)' : 'Click to Unmute HD Audio'}</span>
            </button>
          )}
        </>
      )}

      {/* 3. Fallback: External stream if WebRTC is not live and real stream exists */}
      {!isWebRtcLive && isRealExternalStream && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 4, background: '#000' }}>
          <StreamVideoPlayer streamUrl={streamUrl} title={title} isAr={isAr} />
        </div>
      )}

      {/* 4. Waiting Screen Overlay if WebRTC not live and no external stream */}
      {!isWebRtcLive && !isRealExternalStream && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #01071E 0%, #06142F 100%)',
            textAlign: 'center',
            padding: '24px',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(4, 136, 248, 0.15)',
              border: '1px solid rgba(4, 136, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0488F8',
              boxShadow: '0 0 25px rgba(4, 136, 248, 0.2)',
            }}
          >
            <FiRadio size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', margin: '0 0 8px 0' }}>
              {isAr ? 'في انتظار بدء البث المباشر من المحاضر...' : 'Waiting for host to begin live stream...'}
            </h3>
            <p style={{ fontSize: '13px', color: '#A7AFBF', margin: 0, maxWidth: '400px', lineHeight: 1.6 }}>
              {isAr
                ? 'المحاضر متواجد في الاستوديو وسيبدأ الشرح قريباً. سيبدأ البث بجودة 1080p وبدون أي تقطيع تلقائياً فور انطلاقه.'
                : 'The host is in the studio and will begin broadcasting soon. The stream will begin in full 1080p quality automatically.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LiveRoomPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const idOrSlug = unwrappedParams?.idOrSlug || unwrappedParams?.id;
  const { isAr } = useLanguage();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Enforce Login: Any user must be authenticated before joining or subscribing to live courses/sessions
  useEffect(() => {
    if (!authLoading && !user && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        const fullCurrentPath = window.location.pathname + window.location.search;
        showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً لدخول قاعة البث المباشر' : 'Please sign in first to access the live session');
        router.replace(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
      }
    }
  }, [authLoading, user, isAuthenticated, isAr, router]);

  // Room state
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canAccess, setCanAccess] = useState(true);
  const [accessReason, setAccessReason] = useState(null);
  const [isWebRtcActive, setIsWebRtcActive] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Passcode verification state
  const [passcodeInput, setPasscodeInput] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [passcodeError, setPasscodeError] = useState('');
  const [activeAccessCode, setActiveAccessCode] = useState('');

  // Database Email Lookup state
  const [dbCheckEmail, setDbCheckEmail] = useState('');
  const [isCheckingDbEmail, setIsCheckingDbEmail] = useState(false);
  const [dbLookupResult, setDbLookupResult] = useState(null);

  // RTMP & Stream Key state
  const [copiedRtmp, setCopiedRtmp] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [showBroadcasterCard, setShowBroadcasterCard] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef(null);
  const socketRef = useRef(null);

  const handleNewChatMessage = useCallback((msg) => {
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
        const lastContent = (lastMsg.message || lastMsg.content || '').trim();
        const lastSender = lastMsg.senderName || '';
        if (lastContent === textContent && lastSender === sender) {
          return prev;
        }
      }

      return [
        ...prev,
        {
          id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          sessionId: msg.sessionId,
          userId: msg.userId,
          senderName: sender,
          message: textContent,
          isModerator: Boolean(msg.isModerator),
          userRole: msg.userRole,
          isPinned: Boolean(msg.isPinned),
          createdAt: msg.createdAt || new Date().toISOString(),
        },
      ];
      return [...prev, msg];
    });
  }, []);

  const handlePinChatMessage = useCallback((data) => {
    if (!data?.messageId) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === data.messageId ? { ...m, isPinned: data.isPinned } : m))
    );
  }, []);

  const handleDeleteChatMessage = useCallback((data) => {
    if (!data?.messageId) return;
    setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
  }, []);

  // Sync dbCheckEmail when user object loads
  useEffect(() => {
    if (user?.email) {
      setDbCheckEmail((prev) => prev || user.email);
    }
  }, [user?.email]);

  // Floating Watermark coordinates animation
  const [watermarkPos, setWatermarkPos] = useState({ top: 30, left: 40 });
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 55) + 20,
        left: Math.floor(Math.random() * 55) + 20,
      });
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // 1. Fetch live room details & check stored access code / database email access
  useEffect(() => {
    let isMounted = true;
    async function loadRoom() {
      if (!idOrSlug) return;
      setLoading(true);
      setError('');

      let codeToTry = '';
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        codeToTry = urlParams.get('code') || '';
        if (!codeToTry) {
          codeToTry = localStorage.getItem(`fxengin_live_code_${idOrSlug}`) || '';
        }
      }

      // If no code in URL or localStorage, check if the current logged in user has an active code in DB
      if (!codeToTry && user?.email) {
        try {
          const checkRes = await checkLiveEmailAccess(idOrSlug, user.email);
          if (checkRes?.hasAccess && checkRes?.accessCode) {
            codeToTry = checkRes.accessCode;
          }
        } catch (e) {}
      }

      if (codeToTry) {
        setActiveAccessCode(codeToTry);
        setPasscodeInput(codeToTry);
      }

      try {
        const res = await fetchLiveRoom(idOrSlug, codeToTry);
        if (!isMounted) return;

        if (res.success && res.session) {
          setRoomData(res.session);
          const isFreeSession = Boolean(res.session?.isFree || Number(res.session?.price) <= 0);
          const isPermitted = res.canAccess !== false || isFreeSession || (Boolean(user) && res.accessDeniedReason === 'LOGIN_REQUIRED');
          setCanAccess(isPermitted);
          setAccessReason(isPermitted ? null : res.accessDeniedReason);

          const finalMatchedCode = codeToTry || res.data?.matchedAccessCode;
          if (finalMatchedCode && res.session.id) {
            setActiveAccessCode(finalMatchedCode);
            setPasscodeInput(finalMatchedCode);
            try {
              localStorage.setItem(`fxengin_live_code_${res.session.id}`, finalMatchedCode);
              localStorage.setItem(`fxengin_live_code_${idOrSlug}`, finalMatchedCode);
            } catch (err) {}
          }
        } else {
          setError(res.error || (isAr ? 'تعذر العثور على جلسة البث المباشر' : 'Live room not found.'));
        }
      } catch (err) {
        console.error('Error entering live room:', err);
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRoom();
    return () => {
      isMounted = false;
    };
  }, [idOrSlug, isAr, user?.email]);

  // Handle Verify Passcode
  const handleVerifyAccessCode = async (e) => {
    e?.preventDefault();
    if (!user) {
      const fullCurrentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/live/${idOrSlug}`;
      showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً لتأكيد كود الدخول' : 'Please sign in first to verify access code');
      router.push(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
      return;
    }
    if (!passcodeInput.trim()) return;
    setIsVerifyingCode(true);
    setPasscodeError('');
    try {
      const res = await verifyLiveAccessCode(idOrSlug, passcodeInput.trim());
      if (res.ok && res.data?.valid) {
        showToast(res.data.message || (isAr ? 'تم التحقق بنجاح!' : 'Passcode verified!'), 'success');
        const code = passcodeInput.trim().toUpperCase();
        setActiveAccessCode(code);
        try {
          localStorage.setItem(`fxengin_live_code_${roomData?.id || idOrSlug}`, code);
          localStorage.setItem(`fxengin_live_code_${idOrSlug}`, code);
        } catch (err) {}

        const roomRes = await fetchLiveRoom(idOrSlug, code);
        if (roomRes.success && roomRes.session) {
          setRoomData(roomRes.session);
          setCanAccess(true);
        }
      } else {
        setPasscodeError(res.data?.message || (isAr ? 'كود الدخول غير صحيح أو ملغي في قاعدة البيانات' : 'Invalid or revoked passcode'));
      }
    } catch (err) {
      setPasscodeError(isAr ? 'حدث خطأ أثناء التحقق' : 'Verification error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Direct unlock with code (e.g. after payment or DB lookup)
  const handleDirectUnlockWithCode = async (code) => {
    if (!code || !code.trim()) return;
    const cleanCode = code.trim().toUpperCase();
    setPasscodeInput(cleanCode);
    setIsVerifyingCode(true);
    setPasscodeError('');
    try {
      const res = await verifyLiveAccessCode(roomData?.id || idOrSlug, cleanCode);
      if (res.ok && res.data?.valid) {
        showToast(res.data.message || (isAr ? 'تم التحقق بنجاح ودخول البث المباشر!' : 'Passcode verified successfully!'), 'success');
        setActiveAccessCode(cleanCode);
        try {
          localStorage.setItem(`fxengin_live_code_${roomData?.id || idOrSlug}`, cleanCode);
          localStorage.setItem(`fxengin_live_code_${idOrSlug}`, cleanCode);
        } catch (err) {}

        const roomRes = await fetchLiveRoom(idOrSlug, cleanCode);
        if (roomRes.success && roomRes.session) {
          setRoomData(roomRes.session);
          setCanAccess(true);
        }
      } else {
        setPasscodeError(res.data?.message || (isAr ? 'كود الدخول غير صالح' : 'Invalid code'));
      }
    } catch {
      setPasscodeError(isAr ? 'حدث خطأ أثناء التحقق' : 'Verification error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Check email in Database ("لو في قاعدة البيانات باينه انه دفع هدخل الكود و يدخل البث")
  const handleCheckDbEmail = async (e) => {
    e?.preventDefault();
    if (!user) {
      const fullCurrentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/live/${idOrSlug}`;
      showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً للتحقق من بيانات الاشتراك' : 'Please sign in first to verify subscription');
      router.push(`/login?redirect=${encodeURIComponent(fullCurrentPath)}`);
      return;
    }
    const emailToTest = (dbCheckEmail || user?.email || '').trim().toLowerCase();
    if (!emailToTest) {
      showToast(isAr ? 'يرجى كتابة البريد الإلكتروني للبحث في قاعدة البيانات' : 'Please enter your email', 'warning');
      return;
    }
    setIsCheckingDbEmail(true);
    setDbLookupResult(null);
    try {
      const res = await checkLiveEmailAccess(roomData?.id || idOrSlug, emailToTest);
      if (res?.hasAccess && res?.accessCode) {
        setDbLookupResult({
          found: true,
          accessCode: res.accessCode,
          fullName: res.fullName,
          message: isAr ? 'تم التحقق! تم العثور على اشتراكك وتذكرتك المسجلة في قاعدة البيانات.' : 'Verified access record found in database!',
        });
        setPasscodeInput(res.accessCode);
      } else {
        setDbLookupResult({
          found: false,
          message: isAr ? 'لم يتم العثور على اشتراك مدفوع لهذا البريد في قاعدة البيانات. يرجى الاشتراك وسداد الرسوم أولاً.' : 'No active paid access record found for this email. Please subscribe first.',
        });
      }
    } catch {
      setDbLookupResult({
        found: false,
        message: isAr ? 'تعذر الاتصال بقاعدة البيانات' : 'Failed to query database',
      });
    } finally {
      setIsCheckingDbEmail(false);
    }
  };

  const sessionId = roomData?.id;

  // 2. Fetch Chat History (Real-time updates delivered via WebSockets in LivePlayer)
  useEffect(() => {
    let isMounted = true;

    if (sessionId) {
      fetchLiveChatHistory(sessionId).then((chatRes) => {
        if (isMounted && chatRes.success && Array.isArray(chatRes.messages)) {
          const loaded = [];
          for (const m of chatRes.messages) {
            const content = (m.message || m.content || '').trim();
            const sender = m.senderName || '';
            const last = loaded[loaded.length - 1];
            if (last && (last.message || last.content || '').trim() === content && last.senderName === sender) {
              continue;
            }
            loaded.push(m);
          }
          setMessages(loaded);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send new chat message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !sessionId || isSending) return;

    if (!user) {
      showToast.info(isAr ? 'يرجى تسجيل الدخول للمشاركة في الشات المباشر' : 'Sign in to chat');
      router.push(`/login?redirect=/live/${idOrSlug}`);
      return;
    }

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send-chat', {
        sessionId,
        message: text,
        userId: user?.id,
        userName: user?.fullName || 'متداول',
        userRole: 'TRADER',
        isModerator: false,
      });
      setIsSending(false);
    } else {
      try {
        const res = await sendLiveChatMessage(sessionId, text);
        if (res.success && res.messageData) {
          handleNewChatMessage(res.messageData);
        } else {
          showToast.error(res.error || (isAr ? 'فشل إرسال الرسالة' : 'Failed to send message'));
        }
      } catch (err) {
        showToast.error(isAr ? 'تعذر إرسال الرسالة' : 'Failed to send message');
      } finally {
        setIsSending(false);
      }
    }
  };

  // Watermark
  const watermark = useMemo(() => {
    if (user) {
      return {
        name: user.fullName || user.email,
        email: user.email,
        clientIp: 'SECURE_STREAM',
      };
    }
    return null;
  }, [user]);

  // Pinned announcements in chat
  const pinnedMessage = useMemo(() => {
    return messages.find((m) => m.isPinned);
  }, [messages]);

  // Loading state
  if (loading) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          background: '#00030D',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F5F7FA',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid rgba(4, 136, 248, 0.2)',
              borderTopColor: '#0488F8',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#A7AFBF' }}>
            {isAr ? 'جاري الاتصال بغرفة البث المباشر والشات...' : 'Connecting to Live Broadcast Floor...'}
          </div>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (error || !roomData) {
    return (
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          background: '#00030D',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#F5F7FA',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '480px', background: '#06142F', border: '1px solid #12315C', padding: '36px', borderRadius: '16px' }}>
          <FiAlertCircle size={44} color="#F6465D" style={{ marginBottom: '14px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>
            {isAr ? 'تعذر الدخول لقاعة البث' : 'Broadcast Room Unavailable'}
          </h2>
          <p style={{ color: '#A7AFBF', fontSize: '14px', marginBottom: '24px' }}>
            {error || (isAr ? 'لم يتم العثور على الجلسة المحددة أو انتهى البث.' : 'Session ended or not found.')}
          </p>
          <Link href={getAppRoute('/live', user)} className="btn-primary" style={{ height: '42px', padding: '0 20px', textDecoration: 'none' }}>
            {isAr ? 'العودة لجدول البث المباشر' : 'Back to Live Streams'}
          </Link>
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
      {/* ── 1. Live Room Header ── */}
      <header
        style={{
          height: '64px',
          background: 'rgba(1, 7, 30, 0.98)',
          borderBottom: '1px solid #12315C',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href={getAppRoute('/live', user)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#A7AFBF',
              textDecoration: 'none',
              fontSize: '12.5px',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid #12315C',
            }}
          >
            {isAr ? <FiArrowRight size={14} /> : <FiArrowLeft size={14} />}
            <span>{isAr ? 'جدول الجلسات' : 'All Sessions'}</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F6465D',
                color: '#FFF',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF' }} />
              LIVE
            </span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFF' }} className="hide-mobile">
              {roomData.title}
            </span>
          </div>
        </div>

        {/* Right Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#16C784', fontWeight: 700 }}>
            <FiUsers size={15} />
            <span>{roomData.maxParticipants || 500} {isAr ? 'متصل' : 'viewers'}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                navigator.clipboard?.writeText(window.location.href);
                showToast.success(isAr ? 'تم نسخ رابط البث المباشر!' : 'Live link copied!');
              }
            }}
            className="btn-secondary"
            style={{ height: '34px', padding: '0 12px', fontSize: '12px', gap: '4px' }}
          >
            <FiShare2 size={13} />
            <span className="hide-mobile">{isAr ? 'مشاركة' : 'Share'}</span>
          </button>
        </div>
      </header>

      {/* ── 2. Live Broadcast & Real-Time Chat Layout ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          flex: 1,
          minHeight: 'calc(100vh - 64px)',
        }}
        className="live-room-grid"
      >
        {/* Left Column: Stream Screen & Info */}
        <main style={{ display: 'flex', flexDirection: 'column', background: '#010514', overflowY: 'auto' }}>
          {/* Main Video Stream Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#000',
              maxHeight: '72vh',
              boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
            }}
          >
            {/* Stream Player or Access Gate */}
            {!canAccess ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.96), rgba(1, 7, 30, 0.99))',
                  textAlign: 'center',
                  padding: '30px 24px',
                  gap: '16px',
                  overflowY: 'auto',
                }}
              >
                {/* Check if Paid Course requiring purchase or code */}
                {accessReason === 'PAYMENT_OR_CODE_REQUIRED' || Number(roomData?.price) > 0 ? (
                  <div style={{ maxWidth: '520px', width: '100%', margin: '0 auto' }}>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(251, 135, 4, 0.15)',
                        border: '2px solid rgba(251, 135, 4, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FB8704',
                        margin: '0 auto 14px',
                        boxShadow: '0 0 25px rgba(251, 135, 4, 0.25)',
                      }}
                    >
                      <FiLock size={28} />
                    </div>

                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: 'rgba(251, 135, 4, 0.15)',
                        color: '#FB8704',
                        border: '1px solid rgba(251, 135, 4, 0.3)',
                        marginBottom: '10px',
                      }}
                    >
                      {isAr ? 'كورس تدريبي مباشر مدفوع' : 'PAID LIVE MASTERCLASS'}
                    </span>

                    <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#FFF', margin: '0 0 8px 0' }}>
                      {isAr ? 'تذكرة الدخول الحصرية مطلوبة' : 'Live Course Pass Required'}
                    </h3>

                    <p style={{ fontSize: '13px', color: '#A7AFBF', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                      {isAr
                        ? 'هذا البث المباشر مخصص للطلاب المسجلين. يمكنك شراء التذكرة أونلاين فورياً أو إدخال كود الدخول الخاص بك أدناه.'
                        : 'This live session is reserved for enrolled members. Purchase a ticket online or enter your unique access code below.'}
                    </p>

                    {/* 1. Subscription & Payment Option ("لو هو مش مشترك يشترك و يدفع قبل ما يدخل") */}
                    <div
                      style={{
                        background: 'rgba(3, 9, 30, 0.95)',
                        border: '1px solid #12315C',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        marginBottom: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ textAlign: isAr ? 'right' : 'left' }}>
                          <span style={{ fontSize: '11px', color: '#A7AFBF', display: 'block' }}>
                            {isAr ? 'رسوم اشتراك الكورس:' : 'Registration Fee:'}
                          </span>
                          <span style={{ fontSize: '20px', fontWeight: 900, color: '#16C784', fontFamily: 'tabular-nums' }}>
                            ${Number(roomData?.price) || 149} {roomData?.currency || 'USDT'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!user) {
                              showToast.info(isAr ? 'يرجى تسجيل الدخول أولاً للاشتراك في البث المباشر' : 'Please sign in first to subscribe to the live session');
                              router.push(`/login?redirect=${encodeURIComponent(`/live/${encodeURIComponent(roomData?.id || idOrSlug)}`)}`);
                              return;
                            }
                            setShowPaymentModal(true);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #FB8704, #F59E0B)',
                            color: '#000',
                            padding: '10px 22px',
                            fontSize: '13px',
                            fontWeight: 800,
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(251, 135, 4, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{isAr ? 'اشترك وسدد عبر الدعم الفني' : 'Subscribe & Pay via Support'}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '11px', color: '#A7AFBF' }}>
                        <Link
                          href={user ? `/checkout?type=live&id=${encodeURIComponent(roomData?.id || idOrSlug)}` : `/login?redirect=${encodeURIComponent(`/checkout?type=live&id=${encodeURIComponent(roomData?.id || idOrSlug)}`)}`}
                          style={{ color: '#0488F8', textDecoration: 'underline' }}
                        >
                          {isAr ? 'أو الانتقال لصفحة الدفع الكاملة (Checkout)' : 'Or open full checkout page'}
                        </Link>
                      </div>
                    </div>

                    {/* 2. Access Code Form ("هدخل الكود و يدخل البث") */}
                    <div
                      style={{
                        background: 'rgba(0, 3, 13, 0.7)',
                        border: '1px solid #12315C',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        marginBottom: '16px',
                        textAlign: isAr ? 'right' : 'left',
                      }}
                    >
                      <label
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#F5F7FA',
                          marginBottom: '8px',
                        }}
                      >
                        {isAr ? 'أدخل كود الدخول الخاص بك لدخول القاعة فوراً:' : 'Enter your unique access passcode:'}
                      </label>

                      <form
                        onSubmit={handleVerifyAccessCode}
                        style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}
                      >
                        <input
                          type="text"
                          required
                          value={passcodeInput}
                          onChange={(e) => {
                            setPasscodeInput(e.target.value.toUpperCase());
                            setPasscodeError('');
                          }}
                          placeholder="FXL-XXXX-XXXX"
                          style={{
                            flex: 1,
                            height: '42px',
                            background: '#00030D',
                            border: passcodeError ? '1px solid #F6465D' : '1px solid #12315C',
                            borderRadius: '10px',
                            padding: '0 14px',
                            color: '#FFF',
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            letterSpacing: '1.5px',
                            outline: 'none',
                            textTransform: 'uppercase',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={isVerifyingCode || !passcodeInput.trim()}
                          style={{
                            background: '#0488F8',
                            color: '#FFF',
                            border: 'none',
                            padding: '0 20px',
                            borderRadius: '10px',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            opacity: isVerifyingCode || !passcodeInput.trim() ? 0.6 : 1,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isVerifyingCode ? (isAr ? 'جاري التحقق...' : 'Checking...') : (isAr ? 'تأكيد ودخول البث' : 'Verify & Enter')}
                        </button>
                      </form>

                      {passcodeError && (
                        <p style={{ fontSize: '11.5px', color: '#F6465D', marginTop: '6px', marginBottom: 0 }}>
                          {passcodeError}
                        </p>
                      )}
                    </div>

                    {/* 3. Database Email Lookup Tool ("لو في قاعدة البيانات باينه انه دفع هدخل الكود و يدخل البث") */}
                    <div
                      style={{
                        background: 'rgba(6, 20, 47, 0.6)',
                        border: '1px dashed rgba(251, 135, 4, 0.45)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        textAlign: isAr ? 'right' : 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <FiCheck style={{ color: 'var(--accent)' }} />
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {isAr
                            ? 'دفعت مسبقاً وتريد استرجاع كودك المسجل في قاعدة البيانات؟'
                            : 'Already paid? Lookup your verified passcode from database:'}
                        </span>
                      </div>

                      <form
                        onSubmit={handleCheckDbEmail}
                        style={{ display: 'flex', gap: '8px', alignItems: 'stretch', marginBottom: '8px' }}
                      >
                        <input
                          type="email"
                          required
                          value={dbCheckEmail}
                          onChange={(e) => setDbCheckEmail(e.target.value)}
                          placeholder="trader@gmail.com"
                          style={{
                            flex: 1,
                            height: '38px',
                            background: '#00030D',
                            border: '1px solid #12315C',
                            borderRadius: '8px',
                            padding: '0 12px',
                            color: '#FFF',
                            fontSize: '12.5px',
                            direction: 'ltr',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="submit"
                          disabled={isCheckingDbEmail || !dbCheckEmail.trim()}
                          style={{
                            background: 'rgba(251, 135, 4, 0.2)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            padding: '0 14px',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {isCheckingDbEmail ? (isAr ? 'جاري الفحص...' : 'Checking...') : (isAr ? 'فحص في قاعدة البيانات' : 'Lookup')}
                        </button>
                      </form>

                      {dbLookupResult && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            marginTop: '8px',
                            background: dbLookupResult.found ? 'rgba(22, 199, 132, 0.15)' : 'rgba(246, 70, 93, 0.15)',
                            border: dbLookupResult.found ? '1px solid rgba(22, 199, 132, 0.4)' : '1px solid rgba(246, 70, 93, 0.4)',
                            color: dbLookupResult.found ? '#16C784' : '#F6465D',
                          }}
                        >
                          <p style={{ margin: '0 0 6px 0', fontWeight: 600 }}>{dbLookupResult.message}</p>
                          {dbLookupResult.found && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', letterSpacing: '1.5px', color: '#FFF' }}>
                                {dbLookupResult.accessCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDirectUnlockWithCode(dbLookupResult.accessCode)}
                                style={{
                                  background: '#16C784',
                                  color: '#000',
                                  padding: '6px 14px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  fontWeight: 800,
                                  fontSize: '11.5px',
                                  cursor: 'pointer',
                                }}
                              >
                                {isAr ? 'دخول البث المباشر بهذا الكود ←' : 'Enter Stream with Code →'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(246, 70, 93, 0.15)',
                        border: '1px solid rgba(246, 70, 93, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#F6465D',
                      }}
                    >
                      <FiLock size={28} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', margin: '0 0 8px 0' }}>
                        {accessReason === 'VIP_SUBSCRIPTION_REQUIRED'
                          ? (isAr ? 'جلسة بث حصرية لمشتركي باقات VIP' : 'Exclusive VIP Live Session')
                          : (isAr ? 'يرجى تسجيل الدخول لمشاهدة البث' : 'Sign in to watch live session')}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#A7AFBF', maxWidth: '420px', margin: 0, lineHeight: 1.6 }}>
                        {accessReason === 'VIP_SUBSCRIPTION_REQUIRED'
                          ? (isAr ? 'هذه الجلسة متاحة حصرياً للمشتركين في باقات الـ VIP. يرجى الترقية للوصول للبث.' : 'This session is exclusive for VIP tier subscribers. Upgrade to get full access.')
                          : (isAr ? 'سجل دخولك مجاناً لمتابعة التحليلات اللحظية والتفاعل في الشات المباشر.' : 'Sign in to join the interactive floor, stream, and real-time chat.')}
                      </p>
                    </div>
                    {accessReason === 'VIP_SUBSCRIPTION_REQUIRED' ? (
                      <Link
                        href="/pricing"
                        style={{
                          background: 'linear-gradient(135deg, #FFB800, #F59E0B)',
                          color: '#000',
                          padding: '10px 24px',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          borderRadius: '8px',
                          textDecoration: 'none',
                        }}
                      >
                        {isAr ? 'الترقية إلى VIP' : 'Upgrade to VIP'}
                      </Link>
                    ) : (
                      <Link
                        href={`/login?redirect=/live/${idOrSlug}`}
                        style={{
                          background: '#0488F8',
                          color: '#FFF',
                          padding: '10px 24px',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          borderRadius: '8px',
                          textDecoration: 'none',
                        }}
                      >
                        {isAr ? 'تسجيل الدخول الآن' : 'Sign In Now'}
                      </Link>
                    )}
                  </>
                )}
              </div>
            ) : (
              <UnifiedLiveStreamPlayer
                sessionId={sessionId}
                streamUrl={roomData.streamUrl || getSessionPlaybackUrl(roomData)}
                title={roomData.title}
                isAr={isAr}
                user={user}
                onNewChatMessage={handleNewChatMessage}
                onPinChatMessage={handlePinChatMessage}
                onDeleteChatMessage={handleDeleteChatMessage}
                socketRef={socketRef}
              />
            )}

            {/* Anti-Piracy Dynamic Floating Watermark */}
            {watermark && (
              <div
                style={{
                  position: 'absolute',
                  top: `${watermarkPos.top}%`,
                  left: `${watermarkPos.left}%`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  zIndex: 20,
                  color: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '11px',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  textShadow: '0 0 4px rgba(0,0,0,0.9)',
                  userSelect: 'none',
                  transition: 'top 3s ease, left 3s ease',
                  textAlign: 'center',
                }}
              >
                <div>{watermark.name} • {watermark.email}</div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>IP: {watermark.clientIp} · FXENGIN LIVE STREAM</div>
              </div>
            )}
          </div>

          {/* Session Overview Box */}
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#F5F7FA', margin: '0 0 8px 0' }}>
                  {roomData.title}
                </h1>
                <div style={{ fontSize: '13.5px', color: '#A7AFBF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{roomData.instructorName || 'كبير المحللين'}</span>
                  <span>•</span>
                  <span>{isAr ? 'جلسة تحليل تفاعلية حية' : 'Interactive Live Market Floor'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#16C784', background: 'rgba(22, 199, 132, 0.12)', padding: '4px 10px', borderRadius: '6px' }}>
                  {isAr ? 'جلسة مجانية لجميع المتداولين' : 'Open for all traders'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowBroadcasterCard((prev) => !prev)}
                  style={{
                    background: 'rgba(4, 136, 248, 0.15)',
                    color: '#0488F8',
                    border: '1px solid rgba(4, 136, 248, 0.35)',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FiRadio size={13} />
                  <span>{isAr ? 'إعدادات البث (RTMP)' : 'Stream Setup (RTMP)'}</span>
                </button>
              </div>
            </div>

            {/* RTMP Server & Stream Key Panel */}
            {showBroadcasterCard && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 20, 47, 0.98), rgba(1, 7, 30, 0.95))',
                  border: '1px solid rgba(4, 136, 248, 0.35)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '20px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiRadio size={16} color="var(--accent)" />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFF' }}>
                      {isAr ? 'إعدادات البث عبر OBS Studio / vMix' : 'OBS Studio / vMix Ingest Settings'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#16C784', background: 'rgba(22, 199, 132, 0.15)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {isAr ? 'خادم RTMP مباشر' : 'Live RTMP Server'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
                  {/* Field 1: RTMP Server URL */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#A7AFBF', marginBottom: '6px', fontWeight: 600 }}>
                      {isAr ? 'رابط خادم البث (RTMP Server URL)' : 'RTMP Server URL'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#00030D', border: '1px solid #12315C', borderRadius: '8px', padding: '6px 10px', gap: '8px' }}>
                      <input
                        type="text"
                        readOnly
                        value={DEFAULT_RTMP_SERVER_URL}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#FFF', fontSize: '12.5px', fontFamily: 'monospace', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(DEFAULT_RTMP_SERVER_URL);
                          setCopiedRtmp(true);
                          showToast.success(isAr ? 'تم نسخ رابط خادم البث!' : 'RTMP URL copied!');
                          setTimeout(() => setCopiedRtmp(false), 2500);
                        }}
                        style={{ background: 'transparent', border: 'none', color: copiedRtmp ? '#16C784' : '#0488F8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}
                      >
                        {copiedRtmp ? <FiCheck size={14} /> : <FiCopy size={14} />}
                        <span>{copiedRtmp ? (isAr ? 'تم' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Field 2: Stream Key */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', color: '#A7AFBF', marginBottom: '6px', fontWeight: 600 }}>
                      {isAr ? 'مفتاح البث المخصص (Stream Key)' : 'Stream Key'}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#00030D', border: '1px solid #12315C', borderRadius: '8px', padding: '6px 10px', gap: '8px' }}>
                      <input
                        type={showStreamKey ? 'text' : 'password'}
                        readOnly
                        value={roomData.streamKey || DEFAULT_STREAM_KEY}
                        style={{ flex: 1, background: 'transparent', border: 'none', color: '#FFF', fontSize: '12.5px', fontFamily: 'monospace', outline: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowStreamKey((prev) => !prev)}
                        style={{ background: 'transparent', border: 'none', color: '#A7AFBF', cursor: 'pointer', padding: '2px 4px' }}
                        title={showStreamKey ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                      >
                        {showStreamKey ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const key = roomData.streamKey || DEFAULT_STREAM_KEY;
                          navigator.clipboard?.writeText(key);
                          setCopiedKey(true);
                          showToast.success(isAr ? 'تم نسخ مفتاح البث!' : 'Stream key copied!');
                          setTimeout(() => setCopiedKey(false), 2500);
                        }}
                        style={{ background: 'transparent', border: 'none', color: copiedKey ? '#16C784' : 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700 }}
                      >
                        {copiedKey ? <FiCheck size={14} /> : <FiCopy size={14} />}
                        <span>{copiedKey ? (isAr ? 'تم' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#7E8B9F', lineHeight: 1.6 }}>
                  {isAr
                    ? 'في برنامج OBS Studio: اختر Settings > Stream > Service (Custom) وضع Server URL و Stream Key ثم اضغط Start Streaming.'
                    : 'In OBS Studio: Settings > Stream > Service (Custom) > Enter Server URL and Stream Key, then click Start Streaming.'}
                </div>
              </div>
            )}

            <p style={{ fontSize: '14px', color: '#A7AFBF', lineHeight: 1.7, margin: '0 0 24px 0', background: '#06142F', border: '1px solid #12315C', padding: '18px', borderRadius: '12px' }}>
              {roomData.description}
            </p>
          </div>
        </main>

        {/* Right Column: Real-Time Interactive Live Chat via SSE */}
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
          {/* Chat Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #12315C', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#06142F' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiMessageSquare size={16} color="#0488F8" />
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFF' }}>
                {isAr ? 'الشات المباشر (Live Chat)' : 'Live Chat'}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#16C784', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16C784' }} />
              {isAr ? 'متصل عبر SSE' : 'Live Stream'}
            </span>
          </div>

          {/* Pinned Message if exists */}
          {pinnedMessage && (
            <div style={{ padding: '10px 14px', background: 'rgba(251, 135, 4, 0.1)', borderBottom: '1px solid rgba(251, 135, 4, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#F5F7FA' }}>
              <FiBookmark size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong>{pinnedMessage.senderName}:</strong> {pinnedMessage.message}
              </div>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: '#687287', fontSize: '13px' }}>
                {isAr ? 'لا توجد رسائل بعد. كن أول من يرحب بالمجتمع!' : 'No messages yet. Say hello!'}
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = user?.id && msg.userId === user.id;
                const isMod = Boolean(msg.isModerator || msg.userRole === 'SUPER_ADMIN' || msg.userRole === 'INSTRUCTOR');

                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isMod
                        ? 'rgba(4, 136, 248, 0.12)'
                        : isMe
                        ? 'rgba(251, 135, 4, 0.1)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isMod
                        ? '1px solid rgba(4, 136, 248, 0.3)'
                        : isMe
                        ? '1px solid rgba(251, 135, 4, 0.25)'
                        : '1px solid transparent',
                      fontSize: '13px',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700, color: isMod ? '#0488F8' : isMe ? 'var(--accent)' : '#FFF' }}>
                          {msg.senderName}
                        </span>
                        {isMod && (
                          <span style={{ fontSize: '9.5px', background: 'linear-gradient(135deg, #0488F8, #7C3AED)', color: '#FFF', padding: '1.5px 6px', borderRadius: '4px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <span>★</span>
                            <span>{isAr ? 'المحاضر / الإدارة' : 'INSTRUCTOR'}</span>
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#687287', fontFamily: 'monospace' }}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div style={{ color: '#E2E8F0', wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Reaction Trading Chips */}
          <div style={{ padding: '6px 12px', display: 'flex', gap: '6px', borderTop: '1px solid rgba(18, 49, 92, 0.6)', overflowX: 'auto', background: '#010514' }}>
            {[
              { label: isAr ? 'شراء' : 'BUY', text: 'فرصة شراء ممتازة' },
              { label: isAr ? 'بيع' : 'SELL', text: 'صفقة بيع مع الاتجاه' },
              { label: isAr ? 'الذهب' : 'GOLD', text: 'ما هو التحليل القادم للذهب XAUUSD؟' },
              { label: isAr ? 'شكراً يا كابتن' : 'Thanks!', text: 'شكراً جزيلاً على الشرح الرائع' },
            ].map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => setInputText((prev) => (prev ? `${prev} ${chip.text}` : chip.text))}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid #12315C',
                  color: '#A7AFBF',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Input Box */}
          <form onSubmit={handleSendMessage} style={{ padding: '12px', borderTop: '1px solid #12315C', background: '#06142F' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isAr ? 'شارك برأيك في الشات...' : 'Send a message...'}
                maxLength={300}
                style={{
                  flex: 1,
                  height: '42px',
                  background: '#01071E',
                  border: '1px solid #12315C',
                  borderRadius: '8px',
                  padding: '0 12px',
                  color: '#FFF',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="btn-primary"
                style={{
                  height: '42px',
                  width: '42px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: !inputText.trim() || isSending ? 0.5 : 1,
                  cursor: !inputText.trim() || isSending ? 'not-allowed' : 'pointer',
                }}
              >
                <FiSend size={16} />
              </button>
            </div>
          </form>
        </aside>
      </div>

      {/* ── 3. Quick Payment / USDT Checkout Modal ── */}
      <WebinarPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={(payData) => {
          setShowPaymentModal(false);
          if (payData?.accessCode) {
            handleDirectUnlockWithCode(payData.accessCode);
          }
        }}
        user={user}
        session={roomData || { id: idOrSlug, title: roomData?.title, price: roomData?.price }}
      />

      <style>{`
        @media (max-width: 960px) {
          .live-room-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
