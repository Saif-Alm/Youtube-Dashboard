'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const YOUTUBE_API_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

export default function useYouTubePlayer(videoId, onPlayerReadyCallback, onPlayerStateChangeCallback, onPlayerErrorCallback) {
  const [player, setPlayer] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [currentTime, setCurrentTimeInternal] = useState(0);
  const [duration, setDurationInternal] = useState(0);
  const [error, setErrorInternal] = useState(null);
  
  const iframeRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const lastVideoIdRef = useRef(videoId);
  const ytApiLoadingRef = useRef(false);
  const playerInitializedRef = useRef(false);
  const updatePendingRef = useRef(false);
  const initAttemptsRef = useRef(0);
  const apiReadyRef = useRef(false);

  // Load YouTube Iframe API script only once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      apiReadyRef.current = true;
      return; // API already loaded
    }

    if (ytApiLoadingRef.current) {
      return; // Already loading
    }

    ytApiLoadingRef.current = true;

    // Create global callback for API to call when loaded
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoadingRef.current = false;
      apiReadyRef.current = true;
      if (iframeRef.current && videoId && !playerInitializedRef.current) {
        initializePlayer();
      }
    };

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }, []); // Only run once on mount

  const initializePlayer = useCallback(() => {
    initAttemptsRef.current += 1;
    
    // Prevent duplicate initializations for same video
    if (playerInitializedRef.current && lastVideoIdRef.current === videoId) {
      return;
    }

    if (!videoId || !iframeRef.current) {
      return;
    }
    
    if (!window.YT || !window.YT.Player) {
      // YouTube API not ready yet, it will call initializePlayer through onYouTubeIframeAPIReady
      if (initAttemptsRef.current < 3) {
        // Set a timer to check again in 1 second
        setTimeout(() => {
          if (apiReadyRef.current) {
            initializePlayer();
          }
        }, 1000);
      }
      return;
    }

    // Destroy existing player if it exists and videoId has changed
    if (player && lastVideoIdRef.current !== videoId) {
      try {
        player.destroy();
        playerInitializedRef.current = false;
      } catch (err) {
        // Ignore errors during cleanup
      }
      setPlayer(null);
      setIsPlayerReady(false);
      setIsPlayingState(false);
      setCurrentTimeInternal(0);
      setDurationInternal(0);
    }
    lastVideoIdRef.current = videoId;

    // If player is being initialized, prevent duplicate inits
    if (playerInitializedRef.current) {
      return;
    }
    
    playerInitializedRef.current = true;

    try {
      // Create a div element to host the iframe (required by YT API)
      const container = iframeRef.current;
      
      // Clear any existing content
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // Create a new div for YouTube to attach to
      const playerDiv = document.createElement('div');
      const uniqueId = `youtube-player-${videoId}-${Date.now()}`;
      playerDiv.id = uniqueId;
      playerDiv.style.width = '100%';
      playerDiv.style.height = '100%';
      container.appendChild(playerDiv);

      const ytPlayer = new window.YT.Player(playerDiv.id, {
        videoId: videoId,
        playerVars: {
          autoplay: 1, // Try to autoplay
          mute: 1,     // Mute initially to help with autoplay restrictions
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
          iv_load_policy: 3,
          origin: window.location.origin,
          enablejsapi: 1,
          widget_referrer: window.location.href
        },
        events: {
          'onReady': (event) => {
            setIsPlayerReady(true);
            setDurationInternal(event.target.getDuration());
            
            // Set iframe to fill container
            const iframe = event.target.getIframe();
            if (iframe) {
              iframe.style.position = 'absolute';
              iframe.style.top = '0';
              iframe.style.left = '0';
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
            }
            
            // Attempt to play
            try {
              event.target.playVideo();
              
              // After a brief moment, unmute if playing
              setTimeout(() => {
                try {
                  if (event.target.getPlayerState() === YOUTUBE_API_STATE.PLAYING) {
                    event.target.unMute();
                  } else {
                    // Try to play again
                    event.target.playVideo();
                  }
                } catch (e) {
                  // Silent error in delayed playback
                }
              }, 1500);
            } catch (e) {
              // Silent error playing video
            }
            
            if (onPlayerReadyCallback) {
              onPlayerReadyCallback(event);
            }
          },
          'onStateChange': (event) => {
            if (event.data === YOUTUBE_API_STATE.PLAYING) {
              setIsPlayingState(true);
            } else if (event.data === YOUTUBE_API_STATE.PAUSED) {
              setIsPlayingState(false);
            } else if (event.data === YOUTUBE_API_STATE.ENDED) {
              setIsPlayingState(false);
            } else {
              setIsPlayingState(false);
            }
            
            if (typeof event.target.getCurrentTime === 'function') {
              setCurrentTimeInternal(event.target.getCurrentTime());
            }
            
            if (typeof event.target.getDuration === 'function') {
              setDurationInternal(event.target.getDuration());
            }
            
            if (onPlayerStateChangeCallback) onPlayerStateChangeCallback(event);
          },
          'onError': (event) => {
            setErrorInternal(event.data);
            playerInitializedRef.current = false; // Allow re-init on error
            if (onPlayerErrorCallback) onPlayerErrorCallback(event);
          },
        },
      });
      setPlayer(ytPlayer);
      container.playerInstance = ytPlayer;
    } catch (error) {
      playerInitializedRef.current = false; // Allow re-init on error
      setErrorInternal('Failed to initialize player');
      if (onPlayerErrorCallback) {
        onPlayerErrorCallback({ data: 'initialization_failed', originalError: error });
      }
    }
  }, [videoId, onPlayerReadyCallback, onPlayerStateChangeCallback, onPlayerErrorCallback, player]);

  // Effect to initialize player when videoId changes
  useEffect(() => {
    if (videoId && videoId !== lastVideoIdRef.current) {
      playerInitializedRef.current = false; // Reset for new video
    }
    
    if (videoId && iframeRef.current && !playerInitializedRef.current) {
      if (window.YT && window.YT.Player) {
        initializePlayer();
      }
      // Otherwise, wait for API to load
    }
    
    // Cleanup: Destroy player on unmount or when videoId changes
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      if (videoId !== lastVideoIdRef.current) {
        if (iframeRef.current && iframeRef.current.playerInstance) {
          try {
            iframeRef.current.playerInstance.destroy();
            iframeRef.current.playerInstance = null;
            playerInitializedRef.current = false;
          } catch (e) {
            // Silent cleanup error
          }
        } else if (player) {
          try {
            player.destroy();
            playerInitializedRef.current = false;
          } catch (e) {
            // Silent cleanup error
          }
        }
      }
    };
  }, [videoId, initializePlayer]);

  // Time update loop using requestAnimationFrame with rate limiting
  useEffect(() => {
    if (isPlaying && isPlayerReady && player) {
      const updateFn = () => {
        try {
          if (updatePendingRef.current) {
            return; // Skip this frame if a previous update is still pending
          }
          
          updatePendingRef.current = true;
          
          if (player && typeof player.getCurrentTime === 'function') {
            const newTime = player.getCurrentTime();
            setCurrentTimeInternal(newTime);
          }
          
          updatePendingRef.current = false;
          
          if (isPlaying) {
            animationFrameIdRef.current = requestAnimationFrame(updateFn);
          }
        } catch (error) {
          updatePendingRef.current = false;
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
        }
      };
      
      if (!animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(updateFn);
      }
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      updatePendingRef.current = false;
    };
  }, [isPlaying, isPlayerReady, player]);

  // Control functions
  const playVideo = useCallback(() => {
    if (player && typeof player.playVideo === 'function') {
      try {
        player.playVideo();
      } catch (error) {
        setErrorInternal('Failed to play video');
      }
    }
  }, [player]);

  const pauseVideo = useCallback(() => {
    if (player && typeof player.pauseVideo === 'function') {
      try {
        player.pauseVideo();
      } catch (error) {
        setErrorInternal('Failed to pause video');
      }
    }
  }, [player]);

  const seekTo = useCallback((time, allowSeekAhead = true) => {
    if (player && typeof player.seekTo === 'function') {
      try {
        player.seekTo(time, allowSeekAhead);
        setCurrentTimeInternal(time);
      } catch (error) {
        setErrorInternal('Failed to seek video');
      }
    }
  }, [player]);

  // Assign iframe reference
  const assignIframeRef = useCallback((node) => {
    if (node !== iframeRef.current) {
      iframeRef.current = node;
      if (node && videoId && window.YT && window.YT.Player && !playerInitializedRef.current) {
        initializePlayer();
      }
    }
  }, [videoId, initializePlayer]);

  return {
    iframeRef: assignIframeRef,
    player,
    isPlayerReady,
    isPlaying,
    currentTime,
    duration,
    error,
    playVideo,
    pauseVideo,
    seekTo,
  };
} 