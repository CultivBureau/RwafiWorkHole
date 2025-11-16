import React, { useState, useEffect } from "react";
import { PermissionGuard as RpgPermissionGuard } from "react-permission-guard";
import { usePermissions } from "../../services/PermissionProvider";
import { getPermissions } from "../../utils/page";
import { hasBackendPermission } from "../../utils/permissionMapping";
import Unauthorized from "../unauthorized/unauthorized";

/**
 * PermissionGuard component - Wrapper around react-permission-guard
 * Handles admin override and loading states while using react-permission-guard for permission checking
 * Works with both static permissions (for testing) and backend permission codes
 * 
 * Default behavior: Shows Unauthorized component when user doesn't have permission
 * You can override by passing a custom fallback prop
 * 
 * Supports both:
 * - permission/permissions: Frontend permission names (for react-permission-guard)
 * - backendPermissions: Backend permission codes (direct check)
 */
export const PermissionGuard = ({ 
  children, 
  permission, 
  permissions, 
  backendPermissions, // New: Array of backend permission codes like ["Break.View", "Break.Create"]
  fallback = null, 
  loadingFallback = null 
}) => {
  const { isLoading, isAdmin } = usePermissions();
  const [userPermissions, setUserPermissions] = useState(() => getPermissions() || []);
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  // Re-check permissions periodically in case they're loaded asynchronously
  useEffect(() => {
    const checkPermissions = () => {
      const perms = getPermissions() || [];
      setUserPermissions(perms);
      // Mark as checked if we have permissions or if we've waited long enough
      if (perms.length > 0 || !isLoading) {
        setPermissionsChecked(true);
      }
    };

    // Check immediately
    checkPermissions();

    // Also check after delays in case permissions are being set asynchronously
    const timeout1 = setTimeout(checkPermissions, 100);
    const timeout2 = setTimeout(checkPermissions, 500);
    const timeout3 = setTimeout(checkPermissions, 1000); // Add one more check after 1 second
    const timeout4 = setTimeout(checkPermissions, 2000); // Add one more check after 2 seconds
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, [isLoading]); // Re-check when loading state changes

  // Show loading fallback while loading OR while we haven't checked permissions yet
  if (isLoading || (!permissionsChecked && userPermissions.length === 0)) {
    return loadingFallback;
  }

  // Admin has all permissions - bypass guard
  if (isAdmin()) {
    return children;
  }

  // If backend permissions are provided, check them directly
  // Empty array means no permission required (allow all authenticated users)
  if (backendPermissions !== undefined) {
    // If empty array, allow access (for pages like dashboard that don't need specific permissions)
    if (backendPermissions.length === 0) {
      return children;
    }
    const userBackendPermissions = userPermissions;
    
    // Extract permission codes for logging
    const extractedUserCodes = Array.isArray(userBackendPermissions) && userBackendPermissions.length > 0 
      ? userBackendPermissions.map(p => {
          if (typeof p === 'string') return p;
          if (typeof p === 'object' && p?.code) return p.code;
          return String(p);
        })
      : [];
    
    // Debug logging (can be removed in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('[PermissionGuard] Checking permissions:', {
        required: backendPermissions,
        userHasRaw: userBackendPermissions,
        userHasCodes: extractedUserCodes,
        hasDepartmentView: extractedUserCodes.includes('Department.View'),
        hasRoleView: extractedUserCodes.includes('Role.View'),
        hasCompanyView: extractedUserCodes.includes('Company.View'),
        hasCompanyUpdate: extractedUserCodes.includes('Company.Update'),
        isLoading: isLoading,
        permissionsChecked: permissionsChecked
      });
    }
    
    // Only deny access if we've checked permissions and they're confirmed empty
    // Don't deny if we're still waiting for permissions to load
    if (Array.isArray(userBackendPermissions) && userBackendPermissions.length === 0 && permissionsChecked && !isLoading) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PermissionGuard] Permissions array is empty after checking - denying access');
      }
      return fallback !== null ? fallback : <Unauthorized />;
    }
    
    // If we don't have permissions yet but we're not loading, wait a bit more
    if (userBackendPermissions.length === 0 && !isLoading && !permissionsChecked) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PermissionGuard] Waiting for permissions to load...');
      }
      return loadingFallback;
    }
    
    const hasPermission = hasBackendPermission(userBackendPermissions, backendPermissions);
    
    if (!hasPermission) {
      // Only deny if we've actually checked and confirmed no permissions
      // Wait longer if permissions haven't been checked yet or if we're still loading
      if (permissionsChecked && userBackendPermissions.length > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[PermissionGuard] Access denied - user does not have required permissions', {
            required: backendPermissions,
            userHasCodes: extractedUserCodes,
            hasRequired: backendPermissions.map(req => extractedUserCodes.includes(req)),
            permissionsChecked: permissionsChecked,
            userPermissionsCount: userBackendPermissions.length
          });
        }
        return fallback !== null ? fallback : <Unauthorized />;
      }
      // Otherwise, wait for permissions to load (don't deny access prematurely)
      if (process.env.NODE_ENV === 'development') {
        console.log('[PermissionGuard] Waiting for permissions to load before denying access...', {
          permissionsChecked,
          userPermissionsCount: userBackendPermissions.length,
          isLoading
        });
      }
      return loadingFallback;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[PermissionGuard] Access granted for:', backendPermissions);
    }
    
    return children;
  }

  // SECURITY: If no permission specified, deny access by default
  // This prevents accidental exposure of protected content
  if (!permission && !permissions && !backendPermissions) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PermissionGuard] No permissions specified - denying access by default for security');
    }
    return fallback !== null ? fallback : <Unauthorized />;
  }

  // Use react-permission-guard's PermissionGuard component for frontend permissions
  // It will use permissions from PermissionsProvider (which gets static or backend permissions)
  // Default fallback: Show Unauthorized component instead of redirecting
  // You can override by passing a custom fallback prop (e.g., Navigate component)
  const fallbackComponent = fallback !== null ? fallback : <Unauthorized />;

  return (
    <RpgPermissionGuard 
      permission={permission}
      permissions={permissions}
      fallback={fallbackComponent}
      loadingFallback={loadingFallback}
    >
      {children}
    </RpgPermissionGuard>
  );
};

