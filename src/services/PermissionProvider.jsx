import React, { createContext, useContext, useMemo } from "react";
import { PermissionsProvider } from "react-permission-guard";
import { useMeQuery } from "./apis/AuthApi";
import { getAuthToken, getPermissions, getUserInfo } from "../utils/page";
import { convertBackendToFrontendPermissions } from "../utils/permissionMapping";

// Static permission mapping based on role
// TODO: Replace with API call when backend is ready
const ROLE_PERMISSIONS_MAP = {
  admin: [
    // Admin has all permissions
    "approveRejectLeaveRequests",
    "editLeaveBalance",
    "viewLeaveBalance",
    "viewLeaveCalendar",
    "viewAttendanceReports",
    "editAttendanceLogs",
    "approveLateArrivalJustifications",
    "addEditEmployees",
    "assignRoles",
    "viewRoles",
    "deleteRoles",
    "restoreRoles",
    "viewUsersByRole",
    "viewEmployeeProfiles",
    "deactivateEmployees",
    "editCompanySettings",
    "viewCompany",
    "createCompany",
    "deleteCompany",
    "restoreCompany",
    "assignUserToCompany",
    "removeUserFromCompany",
    "viewUsersInCompany",
    "viewDepartments",
    "viewDepartmentSupervisor",
    "assignSupervisorToDepartment",
    "removeSupervisorFromDepartment",
    "manageBreakCategories",
    "viewBreakCategories",
    "startBreakLog",
    "endBreakLog",
    "viewBreakLogs",
    "updateBreakLogs",
    "manageClockInRules",
    "viewClockInRules",
    "viewTeams",
    "createTeams",
    "updateTeams",
    "deleteTeams",
    "restoreTeams",
    "viewTeamMembers",
    "addTeamMember",
    "updateTeamMember",
    "removeTeamMember",
    "viewShifts",
    "createShifts",
    "updateShifts",
    "deleteShifts",
    "restoreShifts",
    "viewShiftAssignments",
    "assignUserToShift",
    "updateShiftAssignment",
    "deleteShiftAssignment",
    "restoreShiftAssignment",
    "bulkAssignShifts",
    "viewLeaveTypes",
    "editLeaveTypes",
    "cancelLeave",
    "viewPermissions",
  ],
  employee: [
    // Employees have basic permissions only
    "requestLeave",
    "cancelLeave",
    "clockInOut",
    "viewOwnAttendanceLogs",
    "startBreakLog",
    "endBreakLog",
    "viewBreakLogs",
  ],
  // Custom roles will have permissions passed dynamically (when API is ready)
};

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const token = getAuthToken();
  const { data: meResponse, isLoading, error } = useMeQuery(undefined, {
    skip: !token,
  });

  // Extract permissions for react-permission-guard
  const permissionsArray = useMemo(() => {
    // First, try to get permissions from cookies (extracted from token)
    // This ensures permissions are available immediately, even before API loads
    const backendPermissionCodes = getPermissions(); // Returns array of backend codes like ["User.Create", "Break.View"]
    
    // Get user data from API (may be null if API hasn't loaded yet)
    const userData = meResponse?.value || null;
    
    // Also get user info from cookies (decoded token) as fallback
    // This is critical - it allows us to work even if API hasn't loaded yet
    const userInfoFromCookie = getUserInfo();
    
    // If we have no data at all (no token decoded, no API), return basic permissions
    if (!userData && !userInfoFromCookie && !backendPermissionCodes) {
      // Return basic employee permissions as fallback to prevent unauthorized errors
      return ROLE_PERMISSIONS_MAP.employee || [];
    }

    // Helper function to normalize role - handle both object format {id, name} and string format
    const normalizeRole = (role) => {
      if (!role) return null;
      if (typeof role === 'string') return role.toLowerCase();
      if (typeof role === 'object' && role?.name) return role.name.toLowerCase();
      return null;
    };
    
    // Determine role from API response or cookie
    let roles = [];
    if (userData?.roles) {
      roles = userData.roles;
    } else if (userInfoFromCookie) {
      // Get role from decoded token in cookie
      const msRoleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      roles = userInfoFromCookie[msRoleKey] || [];
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const normalizedRoles = roleArray.map(normalizeRole).filter(Boolean);
    const userRole = normalizedRoles[0] || "employee";
    const isAdminRole = normalizedRoles.some((r) => r === "admin");

    // Get permissions based on role
    let permissions = [];
    
    if (isAdminRole) {
      // Admin gets all admin permissions + basic user permissions (for accessing user pages)
      const adminPerms = ROLE_PERMISSIONS_MAP.admin || [];
      const userPerms = ROLE_PERMISSIONS_MAP.employee || [];
      permissions = [...new Set([...adminPerms, ...userPerms])]; // Combine and deduplicate
    } else {
      // For non-admin users (including custom roles): 
      // ALWAYS start with ALL basic employee permissions (for accessing ALL user pages)
      const basicEmployeePerms = ROLE_PERMISSIONS_MAP.employee || [];
      permissions = [...basicEmployeePerms];
      
      // Then ADD admin permissions if user has backend permission codes
      if (backendPermissionCodes && backendPermissionCodes.length > 0) {
        // Convert backend codes (e.g., "User.Create") to frontend permissions (e.g., "addEditEmployees")
        const adminPerms = convertBackendToFrontendPermissions(backendPermissionCodes);
        // Add admin permissions to the basic employee permissions
        permissions = [...new Set([...permissions, ...adminPerms])];
      }
      // If no backend codes, user still has basic employee permissions (all user tabs)
    }

    return permissions;
  }, [meResponse]);

  const contextValue = useMemo(() => {
    // Get user data from API
    const userData = meResponse?.value || null;
    
    // Also get user info from cookies (decoded token) as fallback
    const userInfoFromCookie = getUserInfo();
    
    // Helper function to normalize role - handle both object format {id, name} and string format
    const normalizeRole = (role) => {
      if (!role) return null;
      if (typeof role === 'string') return role.toLowerCase();
      if (typeof role === 'object' && role?.name) return role.name.toLowerCase();
      return null;
    };
    
    // Determine role from API response or cookie
    let roles = [];
    if (userData?.roles) {
      roles = userData.roles;
    } else if (userInfoFromCookie) {
      // Get role from decoded token in cookie
      const msRoleKey = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      roles = userInfoFromCookie[msRoleKey] || [];
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const normalizedRoles = roleArray.map(normalizeRole).filter(Boolean);
    const userRole = normalizedRoles[0] || "employee";
    const isAdminRole = normalizedRoles.some((r) => r === "admin");
    
    // If no user data AND no cookie data, return minimal context with basic permissions
    // This prevents unauthorized errors during initial load
    if (!userData && !userInfoFromCookie) {
      return {
        user: null,
        role: "employee", // Default to employee role
        permissions: ROLE_PERMISSIONS_MAP.employee || [], // Give basic permissions
        isLoading,
        error,
        hasPermission: (permission) => {
          // Allow access to basic employee permissions
          const basicPerms = ROLE_PERMISSIONS_MAP.employee || [];
          return basicPerms.includes(permission);
        },
        isAdmin: () => false,
        isEmployee: () => true,
        getUserRole: () => "employee",
      };
    }

    // Helper functions
    const hasPermission = (permission) => {
      if (!permission) return false;
      if (isAdminRole) return true; // Admin has all permissions
      return permissionsArray.includes(permission);
    };

    const isAdmin = () => isAdminRole;

    const isEmployee = () => !isAdminRole && userRole === "employee";

    const getUserRole = () => {
      if (isAdminRole) return "admin";
      return userRole;
    };

    return {
      user: userData || userInfoFromCookie,
      role: isAdminRole ? "admin" : userRole,
      permissions: permissionsArray,
      isLoading,
      error,
      hasPermission,
      isAdmin,
      isEmployee,
      getUserRole,
    };
  }, [meResponse, isLoading, error, permissionsArray]);

  // Create config for react-permission-guard
  // The library expects getPermissionsEndpoint to be a string URL
  // Since we're using cookies, we'll use a data URL that returns our permissions as JSON
  const permissionsConfig = useMemo(() => {
    // Create a data URL that returns permissions as JSON
    // This mimics an API endpoint response
    const permissionsJson = JSON.stringify(permissionsArray);
    const dataUrl = `data:application/json;charset=utf-8,${encodeURIComponent(permissionsJson)}`;
    
    return {
      getPermissionsEndpoint: dataUrl,
    };
  }, [permissionsArray]);

  return (
    <PermissionsProvider config={permissionsConfig}>
      <PermissionContext.Provider value={contextValue}>
        {children}
      </PermissionContext.Provider>
    </PermissionsProvider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
};

