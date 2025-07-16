import React, { useEffect, useState, useRef } from 'react'

const EnvironmentIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [healthStatus, setHealthStatus] = useState<string>('checking...')
  const [isExpanded, setIsExpanded] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      setHealthStatus(online ? '✅ Connected to internet' : '❌ No internet connection')
    }

    const handleOnline = () => {
      setIsOnline(true)
      setHealthStatus('✅ Connected to internet')
    }

    const handleOffline = () => {
      setIsOnline(false)
      setHealthStatus('❌ No internet connection')
    }

    // Set initial status
    updateOnlineStatus()

    // Add event listeners for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Optional: Test actual connectivity with a simpler approach
    const testConnectivity = async () => {
      if (navigator.onLine) {
        try {
          // Use a simple fetch to a reliable endpoint
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

          await fetch('https://httpbin.org/get', {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
          })

          clearTimeout(timeoutId)
          setHealthStatus('✅ Internet connection verified')
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            setHealthStatus('❌ Connection timeout - limited connectivity')
          } else {
            setHealthStatus('✅ Connected to internet (basic check)')
          }
        }
      }
    }

    // Test connectivity on mount with a small delay
    setTimeout(() => {
      testConnectivity()
    }, 1000)

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleClick = () => {
    setIsExpanded(!isExpanded)

    // Auto-hide after 3 seconds when expanded
    if (!isExpanded) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false)
      }, 3000)
    }
  }

  const handleMouseLeave = () => {
    // Auto-hide when mouse leaves (with small delay)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false)
    }, 1000)
  }

  const handleMouseEnter = () => {
    // Cancel auto-hide when mouse enters
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Status Light - Always Visible */}
      <div
        onClick={handleClick}
        className={`
          w-3 h-3 rounded-full cursor-pointer transition-all duration-200 shadow-lg
          ${isOnline ? 'bg-green-500' : 'bg-red-500'}
          ${!isOnline ? 'animate-pulse' : ''}
          hover:scale-110 hover:shadow-xl
        `}
        title={`Click to see ${isOnline ? 'Online' : 'Offline'} status details`}
      />

      {/* Expanded Details - Only Visible When Clicked */}
      {isExpanded && (
        <div className="absolute bottom-6 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-48 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="font-medium text-gray-900 dark:text-white">
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="text-gray-600 dark:text-gray-400 mb-1">{healthStatus}</div>

          <div className="text-gray-500 dark:text-gray-500 text-xs border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            {isOnline ? 'Internet connection available' : 'No internet connection'}
          </div>

          <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click dot to hide</div>
        </div>
      )}
    </div>
  )
}

export default EnvironmentIndicator
