import { useEffect, useRef, useState, useCallback } from 'react'

interface TimeTrackerOptions {
  onSave?: (timeSpent: number) => Promise<void>
  autoSaveInterval?: number // in milliseconds, default 30 seconds
}

export const useTimeTracker = (
  options: TimeTrackerOptions = {}
): {
  sessionTime: number
  isActive: boolean
  hasUnsavedTime: boolean
  saveProgress: () => Promise<void>
  resetTracker: () => void
  cleanup: () => Promise<void>
} => {
  const { onSave, autoSaveInterval = 30000 } = options

  // Track timing state
  const [isActive, setIsActive] = useState(true)
  const [sessionTime, setSessionTime] = useState(0) // Current session time in seconds
  const startTimeRef = useRef<Date>(new Date())
  const lastSaveTimeRef = useRef<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedTimeRef = useRef(false)

  // Calculate time since last save
  const calculateSessionTime = useCallback(() => {
    if (!isActive) return 0

    const now = new Date()
    const timeSinceLastSave = Math.round((now.getTime() - lastSaveTimeRef.current.getTime()) / 1000)
    return Math.max(0, timeSinceLastSave)
  }, [isActive])

  // Update session time every second
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (isActive) {
        const newSessionTime = calculateSessionTime()
        setSessionTime(newSessionTime)
        hasUnsavedTimeRef.current = newSessionTime > 0
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, calculateSessionTime])

  // Auto-save progress periodically
  useEffect(() => {
    if (onSave && autoSaveInterval > 0) {
      autoSaveIntervalRef.current = setInterval(async () => {
        if (hasUnsavedTimeRef.current && sessionTime > 0) {
          try {
            await onSave(sessionTime)
            lastSaveTimeRef.current = new Date()
            hasUnsavedTimeRef.current = false
          } catch (error) {
            console.error('Auto-save failed:', error)
          }
        }
      }, autoSaveInterval)

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current)
        }
      }
    }
  }, [onSave, autoSaveInterval, sessionTime])

  // Handle window focus/blur for activity detection
  useEffect(() => {
    const handleFocus = (): void => {
      setIsActive(true)
      // Reset the "last save time" to now to prevent counting inactive time
      lastSaveTimeRef.current = new Date()
    }

    const handleBlur = (): void => {
      setIsActive(false)
    }

    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        setIsActive(false)
      } else {
        setIsActive(true)
        lastSaveTimeRef.current = new Date()
      }
    }

    // Listen for window focus/blur events
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Manual save function
  const saveProgress = useCallback(async (): Promise<void> => {
    if (onSave && hasUnsavedTimeRef.current && sessionTime > 0) {
      try {
        await onSave(sessionTime)
        lastSaveTimeRef.current = new Date()
        hasUnsavedTimeRef.current = false
      } catch (error) {
        console.error('Manual save failed:', error)
        throw error
      }
    }
  }, [onSave, sessionTime])

  // Reset the tracker (for new lesson/session)
  const resetTracker = useCallback(() => {
    startTimeRef.current = new Date()
    lastSaveTimeRef.current = new Date()
    setSessionTime(0)
    hasUnsavedTimeRef.current = false
  }, [])

  // Cleanup function for component unmount
  const cleanup = useCallback(async (): Promise<void> => {
    // Clear all intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current)
    }

    // Save any unsaved progress - use current values from refs instead of state
    const currentSessionTime = calculateSessionTime()
    if (hasUnsavedTimeRef.current && currentSessionTime > 0 && onSave) {
      try {
        await onSave(currentSessionTime)
      } catch (error) {
        console.error('Cleanup save failed:', error)
      }
    }
  }, [onSave, calculateSessionTime])

  return {
    sessionTime,
    isActive,
    hasUnsavedTime: hasUnsavedTimeRef.current,
    saveProgress,
    resetTracker,
    cleanup
  }
}

// Utility function to format time display
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}
