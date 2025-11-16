import {
  Clock,
  CalendarCheck,
  Coffee,
  BarChart3,
  LogOut,
  Wallet,
} from "lucide-react";
import { hasBackendPermission } from "./permissionMapping";
import { getPermissions } from "./page";

/**
 * User menu items with permission mappings
 * These are shown to admins if they have the corresponding permissions
 * Each menu item maps to backend permission codes
 */
export const USER_MENU_ITEMS = [
  {
    key: "user_time_tracking",
    name: "Time Tracking",
    path: "/pages/User/time_tracking",
    permission: "clockInOut", // Frontend permission name
    backendPermissions: ["ClockinLog.Clockin", "ClockinLog.Clockout"], // Backend codes
    Icon: Clock,
    category: "user",
    children: [
      {
        key: "user_attendance",
        name: "Attendance",
        path: "/pages/User/attendance-logs",
        permission: "viewOwnAttendanceLogs",
        backendPermissions: ["ClockinLog.View"],
        Icon: CalendarCheck,
      },
      {
        key: "user_break_tracking",
        name: "Break Tracking",
        path: "/pages/User/break-tracking",
        permission: "startBreakLog",
        backendPermissions: ["BreakLog.Create", "BreakLog.EndBreak", "BreakLog.View"],
        Icon: Coffee,
      },
    ],
  },
  {
    key: "user_leaves",
    name: "Leaves",
    path: "/pages/User/leaves",
    permission: "requestLeave",
    backendPermissions: ["LeaveRequest.Submit", "LeaveRequest.View"],
    Icon: LogOut,
    category: "user",
  },
];

/**
 * Get all user menu items
 * Permission filtering is handled by PermissionGuard components
 */
export const getUserMenuItems = () => {
  return USER_MENU_ITEMS;
};

/**
 * Check if user has permission for a menu item based on backend permission codes
 * @param {Object} menuItem - Menu item object with backendPermissions array
 * @returns {boolean}
 */
export const hasMenuItemPermission = (menuItem) => {
  if (!menuItem.backendPermissions || menuItem.backendPermissions.length === 0) {
    return true; // No backend permissions required, show item
  }
  
  const userPermissions = getPermissions() || [];
  return hasBackendPermission(userPermissions, menuItem.backendPermissions);
};

