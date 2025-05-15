'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const MIN_TRIM_DURATION_PERCENTAGE = 5; // Minimum 5% duration for a trimmed segment

/**
 * Custom hook to manage video trimming functionality.
 * 
 * @param {string} videoId - The ID of the current video
 * @param {boolean} isPlayerReady - Whether the player is ready
 * @param {boolean} isDraggingTrimHandle - Whether user is currently dragging a trim handle
 * 
 * @returns {Object} Trim state and setters
 * 
 * Note: trimEnd is set to 100 (full video length) by default.
 * This means no end trim is applied until user explicitly sets it.
 */
export default function useVideoTrimming(videoId, isPlayerReady, isDraggingTrimHandle) {
  // Set default trim values - start at 0%, end at 100% (full video)
  const [trimStart, setTrimStartInternal] = useState(0);
  const [trimEnd, setTrimEndInternal] = useState(100);
  const [isClient, setIsClient] = useState(false);
  // Track previous videoId to detect changes and reset trim values
  const previousVideoIdRef = useRef(null);
  const loadedFromStorageRef = useRef(false);

  // Create a safe storage key from video ID
  const getStorageKey = useCallback((id) => {
    if (!id) return null;
    // Create a consistent key that works with localStorage
    return `trim-${id}`;
  }, []);

  // Mark as client-side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load trim values from localStorage when videoId or player readiness changes
  useEffect(() => {
    if (!isClient) return;
    
    // Handle the case where videoId becomes null during transitions
    if (!videoId) {
      // Reset values when videoId is null
      setTrimStartInternal(0);
      setTrimEndInternal(100);
      loadedFromStorageRef.current = false;
      return;
    }

    // If videoId changed, we need to reset trim values and load new ones
    if (previousVideoIdRef.current !== videoId) {
      // Reset values first when switching videos
      setTrimStartInternal(0);
      setTrimEndInternal(100);
      loadedFromStorageRef.current = false;
      
      try {
        const storageKey = getStorageKey(videoId);
        const savedTrimValues = localStorage.getItem(storageKey);
        
        if (savedTrimValues) {
          const { start, end } = JSON.parse(savedTrimValues);
          
          // Validate saved values
          if (typeof start === 'number' && typeof end === 'number' &&
              !isNaN(start) && !isNaN(end) &&
              start >= 0 && end <= 100 && start < end && 
              (end - start) >= MIN_TRIM_DURATION_PERCENTAGE) {
            setTrimStartInternal(start);
            setTrimEndInternal(end);
            loadedFromStorageRef.current = true;
          }
        }
      } catch (error) {
        // Silent error handling for localStorage operations
      }
      
      // Update the previous videoId reference
      previousVideoIdRef.current = videoId;
    }
  }, [videoId, isClient, getStorageKey]);

  // Save trim values to localStorage when they change
  useEffect(() => {
    // Only save if we have a videoId and we're on client-side
    if (!isClient || !videoId) return;

    // Don't save while dragging to avoid excessive writes
    if (isDraggingTrimHandle) return;

    // Skip saving if values are at the default/reset state (full video)
    if (trimStart === 0 && trimEnd === 100) {
      // If there's an existing setting, delete it to reset to default
      try {
        const storageKey = getStorageKey(videoId);
        if (localStorage.getItem(storageKey)) {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        // Silent error handling
      }
      return;
    }

    try {
      // Validate before saving
      const validStart = Math.max(0, Math.min(trimStart, 100 - MIN_TRIM_DURATION_PERCENTAGE));
      const validEnd = Math.max(validStart + MIN_TRIM_DURATION_PERCENTAGE, Math.min(100, trimEnd));

      if (validStart < validEnd) {
        const trimData = { start: validStart, end: validEnd };
        const storageKey = getStorageKey(videoId);
        localStorage.setItem(storageKey, JSON.stringify(trimData));
      }
    } catch (error) {
      // Silent error handling for localStorage operations
    }
  }, [trimStart, trimEnd, videoId, isDraggingTrimHandle, isClient, getStorageKey]);

  // Set start time with validation to ensure it's within valid range
  const setTrimStart = useCallback((newStart) => {
    setTrimStartInternal(prevStart => {
      if (isNaN(newStart)) return prevStart;
      
      // Ensure newStart is between 0 and (trimEnd - minimum duration)
      const validStart = Math.max(0, Math.min(newStart, trimEnd - MIN_TRIM_DURATION_PERCENTAGE));
      return validStart;
    });
  }, [trimEnd]);

  // Set end time with validation to ensure it's within valid range
  const setTrimEnd = useCallback((newEnd) => {
    setTrimEndInternal(prevEnd => {
      if (isNaN(newEnd)) return prevEnd;
      
      // Ensure newEnd is between (trimStart + minimum duration) and 100
      const validEnd = Math.max(trimStart + MIN_TRIM_DURATION_PERCENTAGE, Math.min(newEnd, 100));
      return validEnd;
    });
  }, [trimStart]);

  return {
    trimStart,
    setTrimStart,
    trimEnd,
    setTrimEnd,
  };
} 