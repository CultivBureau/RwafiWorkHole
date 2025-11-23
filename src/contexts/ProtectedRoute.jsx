import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, getUserInfo, getRefreshToken, isTokenExpired, isRefreshTokenExpired, getPermissions } from "../utils/page";
import { useMeQuery } from "../services/apis/AuthApi";
import { hasBackendPermission } from "../utils/permissionMapping";

// Helper function to check if user is admin
const isAdminUser = (userData, userInfoFromCookie) => {
  // Helper function to normalize role
  const normalizeRole = (role) => {
    if (!role) return null;
    if (typeof role === 'string') return role.toLowerCase();
    if (typeof role === 'object' && role?.name) return role.name.toLowerCase();
    return null;
  };

  // Check roles from API data
  if (userData?.roles) {
    const roles = Array.isArray(userData.roles) ? userData.roles : [userData.roles];
    const normalizedRoles = roles.map(normalizeRole).filter(Boolean);
    if (normalizedRoles.some(r => r === 'admin')) return true;
  }

  // Check role from cookie (decoded token)
  if (userInfoFromCookie) {
    const msRoleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    const role = userInfoFromCookie[msRoleKey] || userInfoFromCookie.role;
    if (role) {
      const normalizedRole = normalizeRole(role);
      if (normalizedRole === 'admin') return true;
    }
  }

  return false;
};

// Helper function to check if user has Dashboard.View permission
const hasDashboardViewPermission = () => {
  const userPermissions = getPermissions() || [];
  return hasBackendPermission(userPermissions, 'Dashboard.View');
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Get token and user info from cookies FIRST (available immediately on refresh)
  // These are synchronous reads, so they're available immediately
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const userInfoFromCookie = getUserInfo();
  
  // Check if we have any form of authentication
  // Priority: userInfoFromCookie > refreshToken > token
  const hasValidAuth = userInfoFromCookie || refreshToken || token;
  
  // If we have no authentication at all, redirect to login
  if (!hasValidAuth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  
  // Check token expiry status (only if token exists)
  const tokenExpired = token ? isTokenExpired(token) : true;
  const hasValidRefreshToken = refreshToken && !isRefreshTokenExpired();
  
  // Get user data from /me (will trigger token refresh if needed via baseQuery)
  // IMPORTANT: Don't skip if we have userInfoFromCookie - we still want to try to get fresh data
  // Only skip if we have absolutely no authentication
  const { data: user, isLoading, error } = useMeQuery(undefined, {
    skip: !token && !refreshToken && !userInfoFromCookie,
  });
  
  // Check if user has Dashboard.View permission from cookies
  const hasDashboardView = hasDashboardViewPermission();
  const currentPath = location.pathname;
  
  // Dashboard routing: Strict permission-based routing
  // ONLY check Dashboard.View permission - no role fallbacks
  // Check this BEFORE allowing access to prevent wrong dashboard access
  if (userInfoFromCookie || (!isLoading && user)) {
    // If user has Dashboard.View permission, they MUST access admin dashboard
    if (hasDashboardView && currentPath === '/pages/User/dashboard') {
      return <Navigate to="/pages/admin/dashboard" replace />;
    }
    
    // If user doesn't have Dashboard.View permission, they MUST access user dashboard
    if (!hasDashboardView && currentPath === '/pages/admin/dashboard') {
      return <Navigate to="/pages/User/dashboard" replace />;
    }
  }
  
  // PRIORITY 1: If we have userInfoFromCookie, we were authenticated - allow access immediately
  // This is the KEY FIX for page refresh - cookies are available immediately
  // Token refresh will happen automatically via baseQuery if token is expired
  if (userInfoFromCookie) {
    // Allow access immediately - don't wait for API or check errors
    // The baseQuery will handle token refresh automatically if needed
    // Even if /me API fails, user can still use the app with cookie data
    return children;
  }
  
  // PRIORITY 2: If we have a refresh token (even if access token is expired), allow access
  // The baseQuery refresh mechanism will handle token refresh automatically
  if (hasValidRefreshToken) {
    // While refreshing token, show loading
    if (isLoading) {
      return null; // Show loading while refreshing
    }
    
    // Allow access - token refresh is happening in background via baseQuery
    return children;
  }
  
  // PRIORITY 3: If we have a valid (non-expired) token, proceed normally
  if (token && !tokenExpired) {
    // While loading user data, wait
    if (isLoading) {
      return null;
    }
    
    // Allow access - token is valid
    return children;
  }
  
  // PRIORITY 4: If token is expired but we have a refresh token, allow access
  // This should be handled by PRIORITY 2, but adding as fallback
  if (tokenExpired && hasValidRefreshToken) {
    if (isLoading) {
      return null;
    }
    return children;
  }
  
  // FINAL SAFETY CHECK: If we have ANY authentication, NEVER redirect to login
  // This ensures that even if there are errors or edge cases, we don't lose the user's session
  if (hasValidAuth) {
    // If there's an error but we have authentication, still allow access
    // The error might be temporary (network issue, API down, etc.)
    // User can still use the app with cookie data
    
    // If user is suspended, redirect (but only if we have user data from API)
    if (user?.value?.status === "suspended" || user?.status === "suspended") {
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    
    // If API is still loading, wait a bit
    if (isLoading) {
      return null;
    }
    
    // Allow access - we have authentication
    return children;
  }
  
  // Only redirect if we truly have NO authentication at all
  // This should never happen if cookies were set correctly
  return <Navigate to="/" replace state={{ from: location }} />;
};

export default ProtectedRoute;