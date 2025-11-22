# Backend Permission Codes Mapping

This document maps all backend permission codes from the API to their usage in the application.

## Permission Codes from API

### User Management
- `User.Create` - Create new user
- `User.Update` - Update existing user
- `User.Delete` - Delete user
- `User.View` - View users
- `User.Profile.ViewAll` - View Employees Profiles

### Department Management
- `Department.View` - View departments
- `Department.Create` - Create department
- `Department.Update` - Update department
- `Department.Delete` - Delete department
- `Department.Restore` - Restore department
- `Department.GetSupervisor` - View department supervisor
- `Department.AssignSupervisor` - Assign supervisor to department
- `Department.RemoveSupervisor` - Remove supervisor from department

### Team Management
- `Team.View` - View teams
- `Team.Create` - Create new team
- `Team.Update` - Update team
- `Team.Delete` - Delete team
- `Team.Restore` - Restore deleted team
- `Team.ViewMembers` - View members in a team
- `Team.AddMember` - Add member to team
- `Team.RemoveMember` - Remove member from team
- `Team.UpdateMember` - Update team member

### Break Management
- `Break.View` - View breaks
- `Break.Create` - Create break
- `Break.Update` - Update break
- `Break.Delete` - Delete break
- `Break.Restore` - Restore deleted break

### Break Log Management
- `BreakLog.View` - View break logs
- `BreakLog.Create` - Start a break log
- `BreakLog.EndBreak` - End a break log
- `BreakLog.Update` - Update break log

### Clock-in/Clock-out Management
- `ClockinLog.View` - View clock-in logs
- `ClockinLog.Clockin` - Record clock-in
- `ClockinLog.Clockout` - Record clock-out
- `ClockinLog.Update` - Update clock-in log

### Company Management
- `Company.View` - View companies
- `Company.Create` - Create company
- `Company.Update` - Update company
- `Company.Delete` - Delete company
- `Company.Restore` - Restore company
- `Company.AssignUser` - Assign user to company
- `Company.RemoveUser` - Remove user from company
- `Company.GetUser` - View users in company

### Leave Management
- `LeaveRequest.View` - View leave requests
- `LeaveRequest.Submit` - Submit leave request
- `LeaveRequest.ViewTeams` - View team leave requests
- `LeaveRequest.Review` - Review leave requests
- `LeaveRequest.Confirm` - Confirm leave request
- `LeaveRequest.Override` - Override leave request decision
- `LeaveRequest.Cancel` - Cancel leave request
- `LeaveRequest.UserView` - Employee: View their own leave requests
- `LeaveRequest.ViewCount` - View total leave request count
- `LeaveRequest.ViewStatistics` - View leave request statistics
- `LeaveRequest.ViewLogs` - View leave logs for users

### Leave Type Management
- `LeaveType.View` - View leave types
- `LeaveType.Update` - Update leave types

### Leave Balance Management
- `LeaveBalance.View` - View leave balances
- `LeaveBalance.Create` - Create leave balance record
- `LeaveBalance.Update` - Update leave balance
- `LeaveBalance.Delete` - Delete leave balance
- `LeaveBalance.Restore` - Restore deleted leave balance

### Role Management
- `Role.View` - View roles
- `Role.Create` - Create new role
- `Role.Update` - Update role
- `Role.Delete` - Delete role
- `Role.Restore` - Restore role
- `Role.ViewUsers` - View users by role
- `Role.ViewPermissions` - View role permissions

### Shift Management
- `Shift.View` - View shifts
- `Shift.Create` - Create shift
- `Shift.Update` - Update shift
- `Shift.Delete` - Delete shift
- `Shift.Restore` - Restore deleted shift

### Shift Assignment Management
- `ShiftAssignment.View` - View shift assignments
- `ShiftAssignment.AssignUser` - Assign user to shift
- `ShiftAssignment.Update` - Update shift assignment
- `ShiftAssignment.Delete` - Delete shift assignment
- `ShiftAssignment.Restore` - Restore shift assignment
- `ShiftAssignment.BulkAssign` - Bulk assign users to shifts

### Permission Management
- `Permission.View` - View all Permissions in System

## Route to Permission Mapping

### Admin Routes
- `/pages/admin/dashboard` - No permission required
- `/pages/admin/all-departments` - `Department.View`
- `/pages/admin/new-department` - `Department.Create`
- `/pages/admin/edit-department/:id` - `Department.Update`
- `/pages/admin/all-teams` - `Team.View`
- `/pages/admin/all-employees` - `User.View`
- `/pages/admin/new-employee` - `User.Create`
- `/pages/admin/shifts` - `Shift.View`
- `/pages/admin/shifts/:shiftId/assignments` - `ShiftAssignment.View`, `ShiftAssignment.AssignUser`
- `/pages/admin/leaves` - `LeaveRequest.View`, `LeaveRequest.ViewTeams`, `LeaveRequest.Review`, `LeaveRequest.Confirm`, `LeaveRequest.Override`
- `/pages/admin/break` - `Break.View`
- `/pages/admin/attendance` - `ClockinLog.View`
- `/pages/admin/Roles&Permissions` - `Role.View`
- `/pages/admin/New_Role` - `Role.Create`
- `/pages/admin/assign-role-users/:roleId` - `Role.Update`, `Role.ViewUsers`
- `/pages/admin/company` - `Company.View`

### User Routes
- `/pages/User/dashboard` - No permission required
- `/pages/User/time_tracking` - `ClockinLog.Clockin`, `ClockinLog.Clockout`
- `/pages/User/attendance-logs` - `ClockinLog.View`
- `/pages/User/break-tracking` - `BreakLog.Create`, `BreakLog.EndBreak`, `BreakLog.View`
- `/pages/User/leaves` - `LeaveRequest.Submit`, `LeaveRequest.UserView`
- `/pages/User/profile` - No permission required (own profile)

