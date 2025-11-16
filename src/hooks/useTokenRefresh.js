import { useEffect, useRef } from 'react';
import { getAuthToken, getRefreshToken, isTokenExpired, isTokenExpiringSoon, removeAuthToken } from '../utils/page';

export const useTokenRefresh = () => {
  const refreshTimeoutRef = useRef(null);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    const scheduleTokenCheck = () => {
      const now = Date.now();
      
      // Prevent too frequent checks (minimum 5 minutes between checks)
      if (now - lastCheckRef.current < 5 * 60 * 1000) {
        return;
      }
      
      lastCheckRef.current = now;
      
      const accessToken = getAuthToken();
      const refreshToken = getRefreshToken();
      
      // Clear any existing timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }

      // If no tokens, don't schedule anything
      if (!accessToken || !refreshToken) {
        return;
      }

      // If access token is already expired, let the next API call handle the refresh
      if (isTokenExpired(accessToken)) {
        return;
      }

      // If refresh token is expired, clear tokens
      if (isTokenExpired(refreshToken)) {
        removeAuthToken();
        window.location.href = '/';
        return;
      }

      // Check if access token will expire soon (within 15 minutes)
      if (isTokenExpiringSoon(accessToken, 15)) {
        // Schedule a check in 10 minutes to trigger refresh
        refreshTimeoutRef.current = setTimeout(() => {
          // The next API call will trigger the refresh automatically
        }, 10 * 60 * 1000); // 10 minutes
      } else {
        // Schedule check for when token is about to expire
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          const expTime = payload.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeUntilExpiry = expTime - currentTime;
          
          // Check 15 minutes before expiry
          const checkTime = Math.max(timeUntilExpiry - (15 * 60 * 1000), 10 * 60 * 1000); // At least 10 minutes
          
          refreshTimeoutRef.current = setTimeout(() => {
            // The next API call will trigger the refresh automatically
          }, checkTime);
        } catch (error) {
          console.log('Error parsing token:', error);
        }
      }
    };

    // Schedule the initial check
    scheduleTokenCheck();

    // Also check every 2 hours as a fallback (reduced frequency)
    const interval = setInterval(scheduleTokenCheck, 2 * 60 * 60 * 1000); // 2 hours

    return () => {
      clearInterval(interval);
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);
};
