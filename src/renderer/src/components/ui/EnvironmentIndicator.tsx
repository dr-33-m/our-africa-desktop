import React, { useEffect, useState, useRef } from 'react';
import { apiClient } from '../../lib/apiClient';

const EnvironmentIndicator: React.FC = () => {
  const [environment, setEnvironment] = useState<'local' | 'production'>('production');
  const [healthStatus, setHealthStatus] = useState<string>('checking...');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const env = apiClient.getEnvironment();
    setEnvironment(env);

    // Test health check
    const checkHealth = async () => {
      try {
        const result = await apiClient.healthCheck();
        if (result.success) {
          const mode = env === 'local' ? 'Offline' : 'Online';
          setHealthStatus(`✅ ${result.data?.status || 'OK'} (${mode})`);
          setIsHealthy(true);
        } else {
          const mode = env === 'local' ? 'Offline' : 'Online';
          setHealthStatus(`❌ ${result.error?.error || 'Failed'} (${mode})`);
          setIsHealthy(false);
        }
      } catch {
        const mode = environment === 'local' ? 'Offline' : 'Online';
        setHealthStatus(`❌ Connection failed (${mode})`);
        setIsHealthy(false);
      }
    };

    checkHealth();
  }, [environment]);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
    
    // Auto-hide after 3 seconds when expanded
    if (!isExpanded) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
    }
  };

  const handleMouseLeave = () => {
    // Auto-hide when mouse leaves (with small delay)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 1000);
  };

  const handleMouseEnter = () => {
    // Cancel auto-hide when mouse enters
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isOfflineMode = environment === 'local';

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
          ${isOfflineMode ? 'bg-green-500' : 'bg-blue-500'}
          ${!isHealthy ? 'animate-pulse' : ''}
          hover:scale-110 hover:shadow-xl
        `}
        title={`Click to see ${isOfflineMode ? 'Offline' : 'Online'} mode details`}
      />

      {/* Expanded Details - Only Visible When Clicked */}
      {isExpanded && (
        <div className="absolute bottom-6 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-48 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${
              isOfflineMode ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <span className="font-medium text-gray-900 dark:text-white">
              {isOfflineMode ? 'OFFLINE MODE' : 'ONLINE MODE'}
            </span>
          </div>
          
          <div className="text-gray-600 dark:text-gray-400 mb-1">
            {healthStatus}
          </div>
          
          <div className="text-gray-500 dark:text-gray-500 text-xs border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
            {isOfflineMode ? 'Learning without internet' : 'Cloud-based learning'}
          </div>
          
          <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            Click dot to hide
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentIndicator;
