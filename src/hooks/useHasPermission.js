import { useMemo } from 'react';
import { getPermissions } from '../utils/page';
import { hasBackendPermission } from '../utils/permissionMapping';
import { usePermissions } from '../services/PermissionProvider';

/**
 * Hook to check if user has specific backend permission(s)
 * @param {string|string[]} permissions - Single permission code or array of permission codes
 * @returns {boolean} - True if user has at least one of the specified permissions
 * 
 * @example
 * const canCreate = useHasPermission('Department.Create');
 * const canEdit = useHasPermission(['Department.Update', 'Department.Edit']);
 */
export const useHasPermission = (permissions) => {
  const { isAdmin } = usePermissions();
  const userPermissions = getPermissions() || [];

  return useMemo(() => {
    // Admin has all permissions
    if (isAdmin()) {
      return true;
    }

    // Convert single permission to array
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

    // Check if user has any of the specified permissions
    return hasBackendPermission(userPermissions, permissionArray);
  }, [permissions, userPermissions, isAdmin]);
};

