/**
 * Page to Permission Mapping Configuration
 * Maps each page route to its required View permission
 * This ensures users with View permission can access the page
 * Individual actions within pages check specific permissions
 */

export const PAGE_PERMISSIONS = {
  // Admin Pages
  '/pages/admin/all-departments': 'Department.View',
  '/pages/admin/new-department': 'Department.Create',
  '/pages/admin/edit-department': 'Department.Update',
  '/pages/admin/all-teams': 'Team.View',
  '/pages/admin/all-employees': 'User.View',
  '/pages/admin/new-employee': 'User.Create',
  '/pages/admin/shifts': 'Shift.View',
  '/pages/admin/leaves': ['LeaveRequest.View', 'LeaveRequest.ViewTeams', 'LeaveRequest.Review', 'LeaveRequest.Confirm', 'LeaveRequest.Override', 'LeaveRequest.ViewCount', 'LeaveRequest.ViewStatistics', 'LeaveRequest.ViewLogs'],
  '/pages/admin/break': 'Break.View',
  '/pages/admin/attendance': 'ClockinLog.View',
  '/pages/admin/Roles&Permissions': 'Role.View',
  '/pages/admin/New_Role': 'Role.Create',
  '/pages/admin/company': 'Company.View',
  
  // User Pages
  '/pages/User/dashboard': null, // No permission required
  '/pages/User/time_tracking': ['ClockinLog.Clockin', 'ClockinLog.Clockout'],
  '/pages/User/attendance-logs': 'ClockinLog.View',
  '/pages/User/break-tracking': ['BreakLog.Create', 'BreakLog.EndBreak', 'BreakLog.View'],
  '/pages/User/leaves': ['LeaveRequest.Submit', 'LeaveRequest.UserView'],
  '/pages/User/profile': null, // No permission required (own profile)
};

/**
 * Get View permission(s) for a page path
 * @param {string} pathname - The current pathname
 * @returns {string|string[]|null} - View permission code(s) or null if no permission required
 */
export const getPageViewPermission = (pathname) => {
  // Check exact match first
  if (PAGE_PERMISSIONS[pathname]) {
    return PAGE_PERMISSIONS[pathname];
  }
  
  // Check pathname starts with any key
  for (const [route, permission] of Object.entries(PAGE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      return permission;
    }
  }
  
  return null;
};

/**
 * Resource action permissions mapping
 * Maps resource names to their action permissions
 */
export const RESOURCE_ACTIONS = {
  Department: {
    view: 'Department.View',
    create: 'Department.Create',
    update: 'Department.Update',
    delete: 'Department.Delete',
    restore: 'Department.Restore',
    assignSupervisor: 'Department.AssignSupervisor',
    removeSupervisor: 'Department.RemoveSupervisor',
  },
  Team: {
    view: 'Team.View',
    create: 'Team.Create',
    update: 'Team.Update',
    delete: 'Team.Delete',
    restore: 'Team.Restore',
    addMember: 'Team.AddMember',
    removeMember: 'Team.RemoveMember',
    updateMember: 'Team.UpdateMember',
    viewMembers: 'Team.ViewMembers',
  },
  User: {
    view: 'User.View',
    create: 'User.Create',
    update: 'User.Update',
    delete: 'User.Delete',
    viewAllProfiles: 'User.Profile.ViewAll',
  },
  Shift: {
    view: 'Shift.View',
    create: 'Shift.Create',
    update: 'Shift.Update',
    delete: 'Shift.Delete',
    restore: 'Shift.Restore',
  },
  ShiftAssignment: {
    view: 'ShiftAssignment.View',
    assignUser: 'ShiftAssignment.AssignUser',
    update: 'ShiftAssignment.Update',
    delete: 'ShiftAssignment.Delete',
    restore: 'ShiftAssignment.Restore',
    bulkAssign: 'ShiftAssignment.BulkAssign',
  },
  Break: {
    view: 'Break.View',
    create: 'Break.Create',
    update: 'Break.Update',
    delete: 'Break.Delete',
    restore: 'Break.Restore',
  },
  BreakLog: {
    view: 'BreakLog.View',
    create: 'BreakLog.Create',
    endBreak: 'BreakLog.EndBreak',
    update: 'BreakLog.Update',
  },
  ClockinLog: {
    view: 'ClockinLog.View',
    clockin: 'ClockinLog.Clockin',
    clockout: 'ClockinLog.Clockout',
    update: 'ClockinLog.Update',
  },
  LeaveRequest: {
    view: 'LeaveRequest.View',
    submit: 'LeaveRequest.Submit',
    viewTeams: 'LeaveRequest.ViewTeams',
    review: 'LeaveRequest.Review',
    confirm: 'LeaveRequest.Confirm',
    override: 'LeaveRequest.Override',
    cancel: 'LeaveRequest.Cancel',
    userView: 'LeaveRequest.UserView',
    viewCount: 'LeaveRequest.ViewCount',
    viewStatistics: 'LeaveRequest.ViewStatistics',
    viewLogs: 'LeaveRequest.ViewLogs',
  },
  LeaveType: {
    view: 'LeaveType.View',
    update: 'LeaveType.Update',
  },
  LeaveBalance: {
    view: 'LeaveBalance.View',
    create: 'LeaveBalance.Create',
    update: 'LeaveBalance.Update',
    delete: 'LeaveBalance.Delete',
    restore: 'LeaveBalance.Restore',
  },
  Role: {
    view: 'Role.View',
    create: 'Role.Create',
    update: 'Role.Update',
    delete: 'Role.Delete',
    restore: 'Role.Restore',
    viewPermissions: 'Role.ViewPermissions',
    viewUsers: 'Role.ViewUsers',
  },
  Company: {
    view: 'Company.View',
    create: 'Company.Create',
    update: 'Company.Update',
    delete: 'Company.Delete',
    restore: 'Company.Restore',
    assignUser: 'Company.AssignUser',
    removeUser: 'Company.RemoveUser',
    getUser: 'Company.GetUser',
  },
  Permission: {
    view: 'Permission.View',
  },
};

/**
 * Get action permission for a resource
 * @param {string} resource - Resource name (e.g., 'Department', 'User')
 * @param {string} action - Action name (e.g., 'create', 'update', 'delete')
 * @returns {string|null} - Permission code or null
 */
export const getActionPermission = (resource, action) => {
  const resourceActions = RESOURCE_ACTIONS[resource];
  if (!resourceActions) return null;
  return resourceActions[action] || null;
};

