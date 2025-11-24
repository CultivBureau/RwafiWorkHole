import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { 
  getAuthToken, 
  setAuthToken, 
  removeAuthToken, 
  getRefreshToken, 
  isTokenExpired, 
  getUserInfo,
  isRefreshTokenExpired,
  setAuthTokens,
  setPermissionsFromToken,
  setUserInfoFromToken
} from "../../utils/page";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Track refresh attempts to prevent infinite loops
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 2;

// Helper function to check if we have any form of authentication
const hasAnyAuthentication = () => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const userInfoFromCookie = getUserInfo();
  return !!(token || refreshToken || userInfoFromCookie);
};

// Custom base query with automatic token refresh for all APIs
export const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState, endpoint, type }) => {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      // Set Content-Type for JSON requests
      if (args.body && !(args.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
    fetchFn: async (url, options = {}) => {
      // If body is FormData, ensure Content-Type is not set
      // Browser will automatically set it with boundary for multipart/form-data
      if (options.body instanceof FormData) {
        const headers = new Headers(options.headers);
        // Remove Content-Type header - browser will set it with boundary
        headers.delete('Content-Type');
        options.headers = headers;
      }
      return fetch(url, options);
    },
  })(args, api, extraOptions);

  // If the result is 401, check if we have cookie data or refresh token first
  // This prevents redirecting to login when token is expired but we can refresh
  if (result.error && result.error.status === 401) {
    const userInfoFromCookie = getUserInfo();
    const refreshToken = getRefreshToken();
    const hasValidRefreshToken = refreshToken && !isRefreshTokenExpired();
    
    // If we have cookie data (valid token decoded), don't redirect to login
    // ProtectedRoute will handle access based on cookies
    // OR if we have a valid refresh token, try to refresh first
    if (userInfoFromCookie && !hasValidRefreshToken) {
      // Reset refresh attempts and return error - let ProtectedRoute handle it
      // User can still access the app with cookie data
      refreshAttempts = 0;
      return result;
    }
    
    // Try to refresh if we have a refresh token (even if we have cookie data)
    // This ensures tokens are refreshed in the background
    if (refreshAttempts < MAX_REFRESH_ATTEMPTS) {
      // Check if refresh token exists and is not expired
      if (hasValidRefreshToken) {
        try {
          refreshAttempts++;
          
          // Try to refresh using the refresh token endpoint
          // Endpoint: POST /api/v1/Authentication/Refresh/refresh
          // Request body: { "refreshToken": "string" }
          // Response: { statusCode: 200, value: { accessToken, refreshToken, refreshTokenExpiresAt }, errorMessage: null, errors: null }
          const refreshResult = await fetchBaseQuery({
            baseUrl,
            prepareHeaders: (headers) => {
              headers.set("Content-Type", "application/json");
              return headers;
            },
          })({
            url: '/api/v1/Authentication/Refresh/refresh',
            method: 'POST',
            body: { refreshToken: refreshToken }, // fetchBaseQuery will automatically stringify this
          }, api, extraOptions);

          // Check if refresh was successful
          if (refreshResult.error) {
            // Refresh failed - check error response
            const errorMessage = refreshResult.error?.data?.errorMessage || refreshResult.error?.data?.message || 'Token refresh failed';
            console.error('Token refresh failed:', errorMessage);
            
            // If refresh token is invalid/expired, remove tokens
            if (hasAnyAuthentication()) {
              // We have some form of authentication, don't redirect - let ProtectedRoute handle it
              refreshAttempts = 0;
              return result;
            }
            // No authentication at all, remove tokens and redirect to login
            refreshAttempts = 0;
            removeAuthToken();
            window.location.href = '/';
            return result;
          }

          // Handle API response structure: { value: { accessToken, refreshToken, refreshTokenExpiresAt } }
          const refreshData = refreshResult.data?.value || refreshResult.data;
          
          if (refreshData?.accessToken && refreshData?.refreshToken) {
            // Store the new tokens with expiry date
            setAuthTokens(
              refreshData.accessToken,
              refreshData.refreshToken,
              refreshData.refreshTokenExpiresAt
            );
            
            // Extract and save permissions from new access token
            setPermissionsFromToken(refreshData.accessToken);
            
            // Extract and save user info from new access token
            setUserInfoFromToken(refreshData.accessToken);
            
            // Reset refresh attempts on successful refresh
            refreshAttempts = 0;
            
            // Retry the original request with the new token
            result = await fetchBaseQuery({
              baseUrl,
              prepareHeaders: (headers) => {
                headers.set("Authorization", `Bearer ${refreshData.accessToken}`);
                return headers;
              },
            })(args, api, extraOptions);
          } else if (refreshData?.accessToken) {
            // Fallback: only accessToken available
            setAuthToken(refreshData.accessToken);
            setPermissionsFromToken(refreshData.accessToken);
            setUserInfoFromToken(refreshData.accessToken);
            
            refreshAttempts = 0;
            
            result = await fetchBaseQuery({
              baseUrl,
              prepareHeaders: (headers) => {
                headers.set("Authorization", `Bearer ${refreshData.accessToken}`);
                return headers;
              },
            })(args, api, extraOptions);
          } else {
            // Refresh failed - but check if we have any authentication before redirecting
            if (hasAnyAuthentication()) {
              // We have some form of authentication, don't redirect - let ProtectedRoute handle it
              refreshAttempts = 0;
              return result;
            }
            // No authentication at all, remove tokens and redirect to login
            refreshAttempts = 0;
            removeAuthToken();
            window.location.href = '/';
          }
        } catch (error) {
          // Refresh failed - but check if we have any authentication before redirecting
          if (hasAnyAuthentication()) {
            // We have some form of authentication, don't redirect - let ProtectedRoute handle it
            refreshAttempts = 0;
            return result;
          }
          // No authentication at all, remove tokens and redirect to login
          refreshAttempts = 0;
          removeAuthToken();
          window.location.href = '/';
        }
      } else {
        // No valid refresh token - but check if we have any authentication before redirecting
        if (hasAnyAuthentication()) {
          // We have some form of authentication, don't redirect - let ProtectedRoute handle it
          refreshAttempts = 0;
          return result;
        }
        // No authentication at all, remove tokens and redirect to login
        refreshAttempts = 0;
        removeAuthToken();
        window.location.href = '/';
      }
    } else {
      // Too many refresh attempts - but check if we have any authentication before redirecting
      if (hasAnyAuthentication()) {
        // We have some form of authentication, don't redirect - let ProtectedRoute handle it
        refreshAttempts = 0;
        return result;
      }
      // No authentication at all, remove tokens and redirect to login
      refreshAttempts = 0;
      removeAuthToken();
      window.location.href = '/';
    }
  } else if (result.error && result.error.status !== 401) {
    // Reset refresh attempts for non-401 errors
    refreshAttempts = 0;
  }

  return result;
};
