"use client";
import Cookies from "js-cookie";

// Set tokens in cookies
export const setAuthTokens = (accessToken, refreshToken, refreshTokenExpiresAt = null) => {
  // Cookie options to ensure persistence across page refreshes
  const cookieOptions = { 
    expires: 2,
    path: '/', // Make cookies available for entire site
    sameSite: 'lax' // Allow cookies to be sent with same-site requests
  };
  
  // Set access token with 2 days expiry
  Cookies.set("access_token", accessToken, cookieOptions);
  
  // Calculate refresh token expiry from refreshTokenExpiresAt if provided
  if (refreshToken && refreshTokenExpiresAt) {
    const expiryDate = new Date(refreshTokenExpiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    // Set refresh token with calculated expiry (minimum 1 day, maximum 20 days)
    const expiresDays = Math.max(1, Math.min(daysUntilExpiry, 20));
    const refreshCookieOptions = {
      expires: expiresDays,
      path: '/',
      sameSite: 'lax'
    };
    Cookies.set("refresh_token", refreshToken, refreshCookieOptions);
    Cookies.set("refresh_token_expires_at", refreshTokenExpiresAt, refreshCookieOptions);
  } else if (refreshToken) {
    // Fallback to 20 days if no expiry date provided
    const refreshCookieOptions = {
      expires: 20,
      path: '/',
      sameSite: 'lax'
    };
    Cookies.set("refresh_token", refreshToken, refreshCookieOptions);
  }
};

// Set single token (for new API structure)
export const setToken = (token) => {
  Cookies.set("access_token", token, { expires: 2, path: '/', sameSite: 'lax' }); // 2 days
};

// Set only access token
export const setAuthToken = (token) => {
  Cookies.set("access_token", token, { expires: 2, path: '/', sameSite: 'lax' }); // 2 days
};

// Retrieve access token from cookies
export const getAuthToken = () => {
  const token = Cookies.get("access_token");
  return token || null;
};

// Retrieve refresh token from cookies
export const getRefreshToken = () => {
  const token = Cookies.get("refresh_token");
  return token || null;
};

// Remove all tokens from cookies
export const removeAuthToken = () => {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("refresh_token_expires_at");
  Cookies.remove("user_info");
  Cookies.remove("user_permissions");
  // Remove any other user-related cookies
  Cookies.remove("companyId");
};

// Complete logout - clears all data and reloads page for fresh state
export const logout = () => {
  // Remove all authentication-related cookies
  removeAuthToken();
  
  // Clear any localStorage items related to user session (if any)
  // Note: Keep theme and language preferences
  try {
    // Only clear session-related items, keep user preferences
    // localStorage.clear(); // Don't clear everything, keep theme/lang
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
  
  // Reload the page to ensure clean state for next user
  // This clears Redux cache, React state, and ensures fresh data load
  window.location.href = "/";
};

// Check if tokens are expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
};

// Get token expiry time in milliseconds
export const getTokenExpiry = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000; // Convert to milliseconds
  } catch (error) {
    return null;
  }
};

// Check if token will expire soon (within specified minutes)
export const isTokenExpiringSoon = (token, minutes = 5) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const expiryTime = payload.exp;
    const timeUntilExpiry = expiryTime - currentTime;
    const minutesUntilExpiry = timeUntilExpiry / 60;
    
    return minutesUntilExpiry <= minutes;
  } catch (error) {
    return true;
  }
};

// Get decoded user info from cookies
export const getUserInfo = () => {
  try {
    const userInfo = Cookies.get("user_info");
    return userInfo ? JSON.parse(userInfo) : null;
  } catch {
    return null;
  }
};

// Get companyId from token or separate cookie
export const getCompanyId = () => {
  // First try to get from decoded token
  const token = getAuthToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.companyId) {
        return payload.companyId;
      }
    } catch (error) {
      // Error decoding token
    }
  }
  
  // Try to get from user info cookie
  const userInfo = getUserInfo();
  if (userInfo?.companyId) {
    return userInfo.companyId;
  }
  
  // Fallback to separate cookie if exists
  const companyIdCookie = Cookies.get("companyId");
  if (companyIdCookie) {
    return companyIdCookie;
  }
  
  return null;
};

// Remove user info from cookies
export const removeUserInfo = () => {
  Cookies.remove("user_info");
};

// Extract permissions from token and save to cookies
export const setPermissionsFromToken = (token) => {
  if (!token) return;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const permissionsString = payload.permissions;
    
    if (permissionsString) {
      // Parse the JSON string to get array of permissions
      const permissions = JSON.parse(permissionsString);
      // Store permissions array in cookies
      Cookies.set("user_permissions", JSON.stringify(permissions), { expires: 2, path: '/', sameSite: 'lax' });
      return permissions;
    }
  } catch (error) {
    return null;
  }
  
  return null;
};

// Get permissions from cookies
export const getPermissions = () => {
  try {
    const permissions = Cookies.get("user_permissions");
    return permissions ? JSON.parse(permissions) : null;
  } catch {
    return null;
  }
};

// Remove permissions from cookies
export const removePermissions = () => {
  Cookies.remove("user_permissions");
};

// Extract and save user info from token
export const setUserInfoFromToken = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const msRoleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = payload[msRoleKey];
    
    const userInfo = {
      sub: payload.sub,
      unique_name: payload.unique_name,
      firstName: payload.firstName,
      lastName: payload.lastName,
      jobTitle: payload.jobTitle,
      companyId: payload.companyId,
      role: role, // Store as 'role' for easy access
      [msRoleKey]: role, // Also store with full key for compatibility
    };
    
    // Store user info in cookies with same expiry as access token (2 days)
    Cookies.set("user_info", JSON.stringify(userInfo), { expires: 2, path: '/', sameSite: 'lax' });
    return userInfo;
  } catch (error) {
    console.error("Error extracting user info from token:", error);
    return null;
  }
};

// Check if refresh token is expired based on refreshTokenExpiresAt
export const isRefreshTokenExpired = () => {
  const refreshTokenExpiresAt = Cookies.get("refresh_token_expires_at");
  if (!refreshTokenExpiresAt) {
    // If no expiry date, check if refresh token exists
    const refreshToken = getRefreshToken();
    return !refreshToken;
  }
  
  try {
    const expiryDate = new Date(refreshTokenExpiresAt);
    const now = new Date();
    return expiryDate <= now;
  } catch (error) {
    // If parsing fails, assume expired
    return true;
  }
};

// Get refresh token expiry date
export const getRefreshTokenExpiry = () => {
  const refreshTokenExpiresAt = Cookies.get("refresh_token_expires_at");
  if (!refreshTokenExpiresAt) return null;
  
  try {
    return new Date(refreshTokenExpiresAt);
  } catch (error) {
    return null;
  }
};