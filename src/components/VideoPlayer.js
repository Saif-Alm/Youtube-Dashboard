'use client';

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { FiPlay, FiPause, FiAlertCircle } from 'react-icons/fi';
import useYouTubePlayer from '../hooks/useYouTubePlayer';
import useVideoTrimming from '../hooks/useVideoTrimming';

// Use React.memo to prevent unnecessary re-renders
const VideoPlayer = memo(function VideoPlayer({ video }) {
  const progressBarRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isDraggingTrimHandle, setIsDraggingTrimHandle] = useState(false);
  const [componentError, setComponentError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(null);
  
  // Client-side only initialization
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update video ID when video prop changes
  useEffect(() => {
    const newVideoId = video?.id?.videoId;
    if (newVideoId && mounted) {
      if (newVideoId !== currentVideoId) {
        // Clear and set video ID to ensure proper reset of trim values
        setCurrentVideoId(null);
        setTimeout(() => setCurrentVideoId(newVideoId), 10);
      }
    }
  }, [video?.id?.videoId, mounted, currentVideoId]);

  const {
    iframeRef: playerIframeRef,
    isPlayerReady,
    isPlaying,
    currentTime,
    duration,
    error: playerError,
    playVideo,
    pauseVideo,
    seekTo,
  } = useYouTubePlayer(
    currentVideoId,
    useCallback(() => {
      // Player ready callback
    }, []),
    useCallback((event) => {
      // Only needed for player state changes
    }, []),
    useCallback((event) => {
      let errorMessage = 'An error occurred with the video';
      switch (event.data) {
        case 2:
          errorMessage = 'Invalid parameter';
          break;
        case 5:
          errorMessage = 'HTML5 player error';
          break;
        case 100:
          errorMessage = 'Video not found or has been removed';
          break;
        case 101:
        case 150:
          errorMessage = 'Video owner doesn\'t allow embedding';
          break;
        default:
          break;
      }
      setComponentError(errorMessage);
    }, [])
  );

  // Force re-initialization when video changes - MOVED AFTER isPlayerReady is defined
  useEffect(() => {
    if (!currentVideoId) return;
    
    // This will ensure the player is properly recreated
    const timer = setTimeout(() => {
      if (!isPlayerReady) {
        // Force a re-render by setting state
        setCurrentVideoId(prevId => prevId === currentVideoId ? null : prevId);
        setTimeout(() => setCurrentVideoId(currentVideoId), 50);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [currentVideoId, isPlayerReady]);

  // Use currentVideoId instead of videoIdRef.current to ensure trim settings reset
  // when videos change. This is important because the useVideoTrimming hook needs
  // to detect video ID changes to load the correct trim settings from localStorage.
  const {
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
  } = useVideoTrimming(currentVideoId, isPlayerReady, isDraggingTrimHandle);

  useEffect(() => {
    if (playerError) {
      let errorMessage = 'An error occurred with the video player';
      switch (playerError) {
        case 2:
          errorMessage = 'Invalid video parameter.';
          break;
        case 5:
          errorMessage = 'An HTML5 player error occurred.';
          break;
        case 100:
          errorMessage = 'Video not found. It may have been removed or set to private.';
          break;
        case 101:
        case 150:
          errorMessage = 'The video owner does not allow this video to be embedded.';
          break;
        default:
          errorMessage = `Player error code: ${playerError}`;
      }
      setComponentError(errorMessage);
    } else {
      setComponentError(null);
    }
  }, [playerError]);

  // Fix: Improved trim handling
  useEffect(() => {
    if (!isPlayerReady || !isPlaying || !duration) return;

    const trimStartTime = (trimStart / 100) * duration;
    const trimEndTime = (trimEnd / 100) * duration;

    if (currentTime < trimStartTime) {
      seekTo(trimStartTime);
    }
    else if (currentTime >= trimEndTime) {
      pauseVideo();
      seekTo(trimStartTime);
    }
  }, [currentTime, isPlaying, isPlayerReady, duration, trimStart, trimEnd, seekTo, pauseVideo]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseVideo();
    } else {
      const trimStartTime = (trimStart / 100) * duration;
      if (currentTime < trimStartTime || currentTime >= (trimEnd / 100) * duration) {
        seekTo(trimStartTime);
      }
      playVideo();
    }
  }, [isPlaying, pauseVideo, trimStart, duration, currentTime, trimEnd, seekTo, playVideo]);

  const handleKeyDown = useCallback((e) => {
    if (document.activeElement.tagName.toLowerCase() === 'input') return;
    
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (isPlayerReady && duration) {
          const newTime = Math.min(currentTime + 5, duration);
          seekTo(newTime);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (isPlayerReady && duration) {
          const newTime = Math.max(currentTime - 5, 0);
          seekTo(newTime);
        }
        break;
      default:
        break;
    }
  }, [isPlayerReady, duration, currentTime, seekTo, togglePlay]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Direct progress bar click handling for better accuracy
  const handleProgressBarClick = useCallback((e) => {
    if (!progressBarRef.current || !duration || !isPlayerReady) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    
    // Account for the container's padding (12px on each side)
    const containerPadding = 12;
    const effectiveWidth = rect.width - (containerPadding * 2);
    const effectiveLeft = rect.left + containerPadding;
    
    // Calculate adjusted position considering padding
    const clickX = e.clientX - effectiveLeft;
    // Ensure the click is within the effective area
    const clampedClickX = Math.max(0, Math.min(clickX, effectiveWidth));
    
    // Calculate click position as percentage of the effective progress bar width (0-100%)
    const clickPositionPercent = (clampedClickX / effectiveWidth) * 100;
    const clickPositionTime = (clickPositionPercent / 100) * duration;
    const trimStartTime = (trimStart / 100) * duration;
    const trimEndTime = (trimEnd / 100) * duration;
    
    // Ensure the click is within the trim range
    if (clickPositionPercent < trimStart || clickPositionPercent > trimEnd) {
      // If clicked outside trim range, move to nearest trim point
      seekTo(clickPositionPercent <= trimStart ? trimStartTime : trimEndTime);
    } else {
      // Clicked within trim range, directly seek to that position
      seekTo(clickPositionTime);
    }
    
    e.stopPropagation();
  }, [progressBarRef, duration, isPlayerReady, trimEnd, trimStart, seekTo]);

  const createTrimDragHandler = useCallback((trimType) => (e) => {
    e.stopPropagation();
    setIsDraggingTrimHandle(true);
    document.body.style.userSelect = 'none';

    const handleElement = e.currentTarget;
    const progressBarElement = progressBarRef.current;
    if (!progressBarElement || !isPlayerReady) {
      setIsDraggingTrimHandle(false);
      document.body.style.userSelect = '';
      return;
    }
    const rect = progressBarElement.getBoundingClientRect();

    const onDragMove = (event) => {
      const position = ((event.clientX - rect.left) / rect.width) * 100;
      let newTrimValue;

      if (trimType === 'start') {
        newTrimValue = Math.max(0, Math.min(position, trimEnd - 5));
        setTrimStart(newTrimValue);
        const trimStartTime = (newTrimValue / 100) * duration;
        if (currentTime < trimStartTime || currentTime >= (trimEnd / 100) * duration) {
          seekTo(trimStartTime);
        }
      } else {
        newTrimValue = Math.max(trimStart + 5, Math.min(position, 100));
        setTrimEnd(newTrimValue);
        const trimEndTime = (newTrimValue / 100) * duration;
        if (currentTime >= trimEndTime) {
          seekTo((trimStart / 100) * duration);
        }
      }
    };

    const onDragEnd = () => {
      setIsDraggingTrimHandle(false);
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('mouseleave', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    };

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('mouseleave', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }, [isPlayerReady, trimEnd, trimStart, duration, currentTime, seekTo, setTrimStart, setTrimEnd]);

  // Calculate current progress as percentage of total duration
  const progressPercent = useMemo(() => {
    if (!duration) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const formattedCurrentTime = useMemo(() => formatTime(currentTime), [currentTime]);
  const formattedDuration = useMemo(() => formatTime(duration), [duration]);

  // During initial server-side render, return minimal placeholder
  if (!mounted) {
    return (
      <div className="video-player-wrapper">
        <div className="relative w-full bg-black" style={{ height: 'var(--video-height, 60vh)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse">Loading player...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={videoContainerRef}
      className="video-player-wrapper"
    >
      {componentError ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-center p-6">
          <FiAlertCircle className="text-danger h-12 w-12 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Video Error</h3>
          <p className="text-secondary mb-4">{componentError}</p>
          <button 
            type="button"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      ) : (
        <>
          {/* Video Player Container */}
          <div className="relative w-full bg-black" style={{ height: 'var(--video-height, 60vh)' }}>
            <div className="absolute inset-0" ref={playerIframeRef}></div>
            {!isPlayerReady && !componentError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
                <div className="text-white animate-pulse">Loading video...</div>
              </div>
            )}
          </div>
          
          {/* Video Controls - always visible */}
          <div className="video-controls opacity-100">
            {/* Progress Bar */}
            <div 
              className="video-progress-container" 
              ref={progressBarRef}
              onClick={handleProgressBarClick}
            >
              <div className="video-progress-background"></div>
              
              {/* Trim Area - only render when not conflicting with progress fill */}
              {(trimStart > 0 || trimEnd < 100) && (
                <div 
                  className="video-trim-bar" 
                  style={{ 
                    left: `${trimStart}%`, 
                    width: `${trimEnd - trimStart}%` 
                  }}
                ></div>
              )}
              
              {/* Progress Fill */}
              <div 
                className="video-progress-fill" 
                style={{ 
                  width: `${progressPercent}%`,
                  backgroundColor: progressPercent >= trimStart && progressPercent <= trimEnd 
                    ? '#1a73e8' // Blue when within trim range
                    : '#ea4335'  // Red when outside trim range
                }}
              ></div>
              
              {/* Trim Handles */}
              <div 
                className="video-trim-handle"
                style={{ left: `${trimStart}%` }}
                onMouseDown={createTrimDragHandler('start')}
                onTouchStart={createTrimDragHandler('start')}
                aria-label="Set trim start"
              ></div>
              
              <div 
                className="video-trim-handle"
                style={{ left: `${trimEnd}%` }}
                onMouseDown={createTrimDragHandler('end')}
                onTouchStart={createTrimDragHandler('end')}
                aria-label="Set trim end"
              ></div>
            </div>
            
            {/* Control Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <button 
                  type="button"
                  className="video-control-button mr-2 focus-ring"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <FiPause className="w-6 h-6" />
                  ) : (
                    <FiPlay className="w-6 h-6" />
                  )}
                </button>
                
                <div className="text-sm text-secondary">
                  <span>{formattedCurrentTime}</span>
                  <span className="mx-1">/</span>
                  <span>{formattedDuration}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

// Format seconds to MM:SS
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default VideoPlayer; 