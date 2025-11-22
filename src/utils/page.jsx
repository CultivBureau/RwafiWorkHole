"use client";
import Cookies from "js-cookie";

// Set tokens in cookies
export const setAuthTokens = (accessToken, refreshToken) => {
  Cookies.set("access_token", accessToken, { expires: 2 }); // 2 days for access token
  Cookies.set("refresh_token", refreshToken, { expires: 20 }); // 20 days for refresh token
};

// Set single token (for new API structure)
export const setToken = (token) => {
  Cookies.set("access_token", token, { expires: 2 }); // 2 days
};

// Set only access token
export const setAuthToken = (token) => {
  Cookies.set("access_token", token, { expires: 2 }); // 2 days
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
      console.error("Error decoding token:", error);
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
      Cookies.set("user_permissions", JSON.stringify(permissions), { expires: 2 });
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