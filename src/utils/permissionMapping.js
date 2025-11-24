/**
 * ===================================================================================
 * PERMISSION MAPPING
 * ===================================================================================
 * 
 * Maps backend permission codes to frontend permission names.
 * 
 * Backend returns permission codes like "User.Create", "Break.View", etc.
 * Frontend uses camelCase names like "addEditEmployees", "viewAttendanceReports", etc.
 * 
 * This mapping connects the two systems.
 */

/**
 * Mapping from frontend permission names to backend permission codes
 * Multiple backend codes can map to one frontend permission (OR logic)
 */
export const FRONTEND_TO_BACKEND_MAPPING = {
  // ==================== LEAVE MANAGEMENT ====================
  approveRejectLeaveRequests: [
    "LeaveRequest.Review",
    "LeaveRequest.Confirm",
    "LeaveRequest.Override",
  ],
  viewTeamLeaveRequests: [
    "LeaveRequest.ViewTeams",
  ],
  reviewLeaveRequests: [
    "LeaveRequest.Review",
  ],
  viewAllLeaveRequests: [
    "LeaveRequest.View",
  ],
  confirmLeaveRequests: [
    "LeaveRequest.Confirm",
  ],
  overrideLeaveRequests: [
    "LeaveRequest.Override",
  ],
  editLeaveBalance: [
    "LeaveBalance.Update",
    "LeaveBalance.Create",
    "LeaveBalance.Delete",
  ],
  viewLeaveBalance: [
    "LeaveBalance.View",
  ],
  viewLeaveCalendar: [
    "LeaveRequest.View",
    "LeaveRequest.ViewTeams",
  ],
  requestLeave: [
    "LeaveRequest.Submit",
  ],
  cancelLeave: [
    "LeaveRequest.Cancel",
  ],
  viewLeaveTypes: [
    "LeaveType.View",
  ],
  editLeaveTypes: [
    "LeaveType.Update",
  ],

  // ==================== ATTENDANCE & CLOCK-IN ====================
  viewAttendanceReports: [
    "ClockinLog.View",
  ],
  editAttendanceLogs: [
    "ClockinLog.Update",
  ],
  approveLateArrivalJustifications: [
    "ClockinLog.Update", // Can update to approve late arrivals
  ],
  clockInOut: [
    "ClockinLog.Clockin",
    "ClockinLog.Clockout",
  ],
  viewOwnAttendanceLogs: [
    "ClockinLog.View", // Users can view their own logs
  ],
  manageClockInRules: [
    "ClockinRule.Create",
    "ClockinRule.Update",
    "ClockinRule.Delete",
    "ClockinRule.Restore",
  ],
  viewClockInRules: [
    "ClockinRule.View",
  ],

  // ==================== BREAK MANAGEMENT ====================
  manageBreakCategories: [
    "Break.Create",
    "Break.Update",
    "Break.Delete",
    "Break.Restore",
  ],
  viewBreakCategories: [
    "Break.View",
  ],
  startBreakLog: [
    "BreakLog.Create",
  ],
  endBreakLog: [
    "BreakLog.EndBreak",
  ],
  viewBreakLogs: [
    "BreakLog.View",
  ],
  updateBreakLogs: [
    "BreakLog.Update",
  ],

  // ==================== EMPLOYEE MANAGEMENT ====================
  addEditEmployees: [
    "User.Create",
    "User.Update",
  ],
  viewEmployeeProfiles: [
    "User.View",
    "User.Profile.ViewAll",
  ],
  deactivateEmployees: [
    "User.Delete",
  ],

  // ==================== ROLES & PERMISSIONS MANAGEMENT ====================
  assignRoles: [
    "Role.Create",
    "Role.Update",
    "Role.ViewPermissions",
  ],
  viewRoles: [
    "Role.View",
  ],
  deleteRoles: [
    "Role.Delete",
  ],
  restoreRoles: [
    "Role.Restore",
  ],
  viewUsersByRole: [
    "Role.ViewUsers",
  ],
  viewPermissions: [
    "Permission.View",
  ],

  // ==================== COMPANY & DEPARTMENT SETTINGS ====================
  editCompanySettings: [
    "Company.Update",
    "Department.Create",
    "Department.Update",
    "Department.Delete",
    "Department.Restore",
  ],
  viewCompany: [
    "Company.View",
  ],
  createCompany: [
    "Company.Create",
  ],
  deleteCompany: [
    "Company.Delete",
  ],
  restoreCompany: [
    "Company.Restore",
  ],
  assignUserToCompany: [
    "Company.AssignUser",
  ],
  removeUserFromCompany: [
    "Company.RemoveUser",
  ],
  viewUsersInCompany: [
    "Company.GetUser",
  ],
  viewDepartments: [
    "Department.View",
  ],
  viewDepartmentSupervisor: [
    "Department.GetSupervisor",
  ],
  assignSupervisorToDepartment: [
    "Department.AssignSupervisor",
  ],
  removeSupervisorFromDepartment: [
    "Department.RemoveSupervisor",
  ],

  // ==================== TEAM MANAGEMENT ====================
  viewTeams: [
    "Team.View",
  ],
  createTeams: [
    "Team.Create",
  ],
  updateTeams: [
    "Team.Update",
  ],
  deleteTeams: [
    "Team.Delete",
  ],
  restoreTeams: [
    "Team.Restore",
  ],
  viewTeamMembers: [
    "Team.ViewMembers",
  ],
  addTeamMember: [
    "Team.AddMember",
  ],
  updateTeamMember: [
    "Team.UpdateMember",
  ],
  removeTeamMember: [
    "Team.RemoveMember",
  ],

  // ==================== SHIFT MANAGEMENT ====================
  viewShifts: [
    "Shift.View",
  ],
  createShifts: [
    "Shift.Create",
  ],
  updateShifts: [
    "Shift.Update",
  ],
  deleteShifts: [
    "Shift.Delete",
  ],
  restoreShifts: [
    "Shift.Restore",
  ],
  viewShiftAssignments: [
    "ShiftAssignment.View",
  ],
  assignUserToShift: [
    "ShiftAssignment.AssignUser",
  ],
  updateShiftAssignment: [
    "ShiftAssignment.Update",
  ],
  deleteShiftAssignment: [
    "ShiftAssignment.Delete",
  ],
  restoreShiftAssignment: [
    "ShiftAssignment.Restore",
  ],
  bulkAssignShifts: [
    "ShiftAssignment.BulkAssign",
  ],
};

/**
 * Reverse mapping: backend permission codes to frontend permission names
 */
export const BACKEND_TO_FRONTEND_MAPPING = {};

// Build reverse mapping
Object.entries(FRONTEND_TO_BACKEND_MAPPING).forEach(([frontendPerm, backendCodes]) => {
  backendCodes.forEach(backendCode => {
    if (!BACKEND_TO_FRONTEND_MAPPING[backendCode]) {
      BACKEND_TO_FRONTEND_MAPPING[backendCode] = [];
    }
    BACKEND_TO_FRONTEND_MAPPING[backendCode].push(frontendPerm);
  });
});

/**
 * Convert backend permission codes to frontend permission names
 * @param {string[]} backendCodes - Array of backend permission codes from token
 * @returns {string[]} Array of frontend permission names
 */
export const convertBackendToFrontendPermissions = (backendCodes) => {
  if (!backendCodes || !Array.isArray(backendCodes)) {
    return [];
  }

  const frontendPermissions = new Set();

  backendCodes.forEach(backendCode => {
    // Direct mapping
    if (BACKEND_TO_FRONTEND_MAPPING[backendCode]) {
      BACKEND_TO_FRONTEND_MAPPING[backendCode].forEach(perm => {
        frontendPermissions.add(perm);
      });
    }
  });

  return Array.from(frontendPermissions);
};

/**
 * Check if user has a specific backend permission code
 * Handles both string arrays and object arrays with 'code' property
 * @param {string[]|Object[]} backendCodes - Array of backend permission codes (strings or objects with 'code' property)
 * @param {string|string[]} requiredPermissions - Required backend permission code(s)
 * @returns {boolean}
 */
export const hasBackendPermission = (backendCodes, requiredPermissions) => {
  // Handle null/undefined cases
  if (!backendCodes) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[hasBackendPermission] backendCodes is null or undefined');
    }
    return false;
  }
  
  // Ensure backendCodes is an array
  const codesArray = Array.isArray(backendCodes) ? backendCodes : [backendCodes];
  
  if (!requiredPermissions) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[hasBackendPermission] requiredPermissions is null or undefined');
    }
    return false;
  }
  
  const requiredArray = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  // Extract permission codes from backendCodes (handle both string and object formats)
  const permissionCodes = codesArray.map(perm => {
    // If it's already a string, return it (trimmed)
    if (typeof perm === 'string') return perm.trim();
    // If it's an object with a 'code' property, extract it
    if (typeof perm === 'object' && perm !== null) {
      if (perm.code && typeof perm.code === 'string') return perm.code.trim();
      // Also check for nested structures
      if (perm.value && typeof perm.value === 'string') return perm.value.trim();
    }
    return null;
  }).filter(Boolean); // Remove null values
  
  // Normalize required permissions (trim and ensure strings)
  const normalizedRequired = requiredArray.map(perm => 
    typeof perm === 'string' ? perm.trim() : String(perm).trim()
  );
  
  // Debug logging in development - only log if match is false or if it's a critical permission check
  const hasMatch = normalizedRequired.some(perm => permissionCodes.includes(perm));
  const isCriticalCheck = normalizedRequired.some(perm => 
    perm.includes('Department.View') || perm.includes('Role.View') || perm.includes('Shift.View') ||
    perm.includes('Company.View') || perm.includes('User.View')
  );
  
  if (process.env.NODE_ENV === 'development' && (!hasMatch || isCriticalCheck)) {

  }
  
  // Check if any required permission exists in the user's permissions (case-sensitive exact match)
  return normalizedRequired.some(perm => permissionCodes.includes(perm));
};

