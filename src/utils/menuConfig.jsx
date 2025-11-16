import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  BarChart3,
  Wallet,
  Users,
  Shield,
  Building2,
  Building,
  Coffee,
  UsersRound,
  Clock,
} from "lucide-react";
import { hasBackendPermission } from "./permissionMapping";
import { getPermissions } from "./page";
import { getPageViewPermission } from "../config/pagePermissions";

// Permission to menu item mapping for admin pages
// These are the additional menu items that appear for custom roles based on permissions
// Each menu item now maps to backend permission codes
export const PERMISSION_MENU_ITEMS = [
  {
    key: "admin_leaves",
    name: "Leave Requests",
    path: "/pages/admin/leaves",
    permission: "approveRejectLeaveRequests", // Frontend permission name
    backendPermissions: ["LeaveRequest.Review", "LeaveRequest.Confirm", "LeaveRequest.Override"], // Backend codes
    Icon: Calendar,
    category: "admin",
  },
  {
    key: "admin_attendance",
    name: "Attendance",
    path: "/pages/admin/attendance",
    permission: "viewAttendanceReports",
    backendPermissions: ["ClockinLog.View"],
    Icon: CalendarCheck,
    category: "admin",
  },
  {
    key: "admin_break",
    name: "Break Management",
    path: "/pages/admin/break",
    permission: "manageBreakCategories", // Frontend permission name
    backendPermissions: ["Break.View", "Break.Create", "Break.Update", "Break.Delete", "Break.Restore"], // Backend codes
    Icon: Coffee,
    category: "admin",
  },
  {
    key: "admin_employees",
    name: "All Employees",
    path: "/pages/admin/all-employees",
    permission: "viewEmployeeProfiles",
    backendPermissions: ["User.View"],
    Icon: Users,
    category: "admin",
  },
  {
    key: "admin_departments",
    name: "Departments",
    path: "/pages/admin/all-departments",
    permission: "editCompanySettings",
    backendPermissions: ["Department.View", "Department.Create", "Department.Update", "Department.Delete"],
    Icon: Building2,
    category: "admin",
  },
  {
    key: "admin_company",
    name: "Company",
    path: "/pages/admin/company",
    permission: "editCompanySettings",
    backendPermissions: ["Company.View"],
    Icon: Building,
    category: "admin",
  },
  {
    key: "admin_roles_permissions",
    name: "Roles & Permissions",
    path: "/pages/admin/Roles&Permissions",
    permission: "assignRoles",
    backendPermissions: ["Role.View", "Role.Create", "Role.Update", "Role.ViewPermissions"],
    Icon: Shield,
    category: "admin",
  },
  {
    key: "admin_shifts",
    name: "Shifts",
    path: "/pages/admin/shifts",
    permission: "viewShifts",
    backendPermissions: ["Shift.View", "Shift.Create", "Shift.Update", "Shift.Delete", "Shift.Restore", "ShiftAssignment.View", "ShiftAssignment.AssignUser"],
    Icon: Clock,
    category: "admin",
  },
];

// Helper function to get all admin menu items
// Permission filtering is now handled by react-permission-guard Guard components
export const getAdminMenuItemsByPermissions = () => {
  return PERMISSION_MENU_ITEMS;
};

/**
 * Extract View permission from backend permissions array
 * @param {string[]} backendPermissions - Array of permission codes
 * @returns {string|null} - View permission code or null
 */
const getViewPermission = (backendPermissions) => {
  if (!backendPermissions || backendPermissions.length === 0) return null;
  // Find permission ending with .View
  return backendPermissions.find(perm => perm.endsWith('.View')) || null;
};

/**
 * Check if user has permission for a menu item based on backend permission codes
 * For page access, we only require View permission (not all permissions)
 * @param {Object} menuItem - Menu item object with backendPermissions array
 * @returns {boolean}
 */
export const hasMenuItemPermission = (menuItem) => {
  if (!menuItem.backendPermissions || menuItem.backendPermissions.length === 0) {
    return true; // No backend permissions required, show item
  }
  
  const userPermissions = getPermissions() || [];
  
  // For page access, only check if user has View permission
  // Individual actions within the page will check specific permissions
  const viewPermission = getViewPermission(menuItem.backendPermissions);
  if (viewPermission) {
    return hasBackendPermission(userPermissions, [viewPermission]);
  }
  
  // If no View permission found, check if user has any of the permissions
  return hasBackendPermission(userPermissions, menuItem.backendPermissions);
};


