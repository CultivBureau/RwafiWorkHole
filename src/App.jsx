import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useContext, Suspense, lazy } from "react";
import ProtectedRoute from "./contexts/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LangProvider } from "./contexts/LangContext";
import { AttendanceUpdateProvider } from "./contexts/AttendanceUpdateContext";
import { BreakUpdateProvider } from "./contexts/BreakUpdateContext";
import { TimerProvider } from "./contexts/TimerContext";
import Error from "./components/Error/Error";
import { GlobalErrorContext } from "./contexts/GlobalErrorContext";
import { useTokenRefresh } from './hooks/useTokenRefresh';
import Loading from "./components/Loading/Loading";
import { PermissionGuard } from "./components/common/PermissionGuard";

// Keep Login eagerly loaded for fast initial render
import Login from "./components/login/login";

// Lazy load all other pages for better performance
// User Pages
const Dashboard = lazy(() => import("./pages/User/dashboard/page"));
const Leaves = lazy(() => import("./pages/User/leaves/page"));
const TimeTracking = lazy(() => import("./pages/User/time_tracking/page"));
const AttendanceLogs = lazy(() => import("./pages/User/attendance-logs/page"));
const BreakTracking = lazy(() => import("./pages/User/break-tracking/page"));
const Performance = lazy(() => import("./pages/User/Performance/page"));
const TeamWallet = lazy(() => import("./pages/User/team-wallet/page"));
const Profile = lazy(() => import("./pages/Profile"));

// Auth Pages
const ForgetPassword = lazy(() => import("./components/forget-password/ForgetPassword"));
const ResetPassword = lazy(() => import("./components/reset-password/resetPassword"));

// Admin Pages
const DashboardAdmin = lazy(() => import("./pages/admin/dashboard/page"));
const AttendanceAdmin = lazy(() => import("./pages/admin/attendance/page"));
const PerformanceAdmin = lazy(() => import("./pages/admin/Performance/page"));
const BreakAdmin = lazy(() => import("./pages/admin/break/page"));
const LeavesAdmin = lazy(() => import("./pages/admin/leaves/page"));
const UsersAdmin = lazy(() => import("./pages/admin/users/page"));
const AllEmployees = lazy(() => import("./pages/admin/all-employees/page"));
const NewEmployee = lazy(() => import("./pages/admin/new-employee/page"));
const AllDepartments = lazy(() => import("./pages/admin/all-departments/page"));
const NewDepartment = lazy(() => import("./pages/admin/new-department/page"));
const EditDepartment = lazy(() => import("./pages/admin/edit-department/page"));
const AllTeamsPage = lazy(() => import("./pages/admin/all-teams/page"));
const RolesAndPermissions = lazy(() => import("./pages/admin/Roles&Permissions/page"));
const NewRole = lazy(() => import("./pages/admin/New_Role/page"));
const AssignRoleUsers = lazy(() => import("./pages/admin/assign-role-users/page"));
const AdminTeamWallet = lazy(() => import("./pages/admin/TeamWallet/page"));
const Company = lazy(() => import("./pages/admin/company/page"));
const AllShifts = lazy(() => import("./pages/admin/shifts/page"));
const ShiftAssignments = lazy(() => import("./pages/admin/shifts/assignments/page"));

function App() {
  useTokenRefresh();
  const { globalError, setGlobalError } = useContext(GlobalErrorContext);

  return (
    <ThemeProvider>
      <LangProvider>
        <AttendanceUpdateProvider>
          <BreakUpdateProvider>
            <TimerProvider>
              {globalError ? (
                <Error
                  {...globalError}
                  onRefresh={() => {
                    setGlobalError(null);
                    window.location.reload();
                  }}
                  onGoHome={() => {
                    setGlobalError(null);
                    window.location.href = "/";
                  }}
                  onGoBack={() => setGlobalError(null)}
                />
              ) : (
                <BrowserRouter>
                  <Routes>
                    {/* Public Routes - No Protection */}
                    <Route path="/" element={<Login />} />
                    <Route
                      path="/forget-password"
                      element={
                        <Suspense fallback={<Loading />}>
                          <ForgetPassword />
                        </Suspense>
                      }
                    />
                    <Route 
                      path="/reset-password" 
                      element={
                        <Suspense fallback={<Loading />}>
                          <ResetPassword />
                        </Suspense>
                      } 
                    />

                    {/* Protected User Routes - Lazy Loaded */}
                    <Route
                      path="/pages/User/dashboard"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <Dashboard />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/leaves"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <Leaves />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/Performance"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <Performance />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/team-wallet"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <TeamWallet />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/time_tracking"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <TimeTracking />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/attendance-logs"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <AttendanceLogs />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/break-tracking"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <BreakTracking />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/pages/User/profile"
                      element={
                        <ProtectedRoute>
                          <Suspense fallback={<Loading />}>
                            <Profile />
                          </Suspense>
                        </ProtectedRoute>
                      }
                    />

                  {/* Protected Admin Routes - Lazy Loaded */}
                  <Route
                    path="/pages/admin/dashboard"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <DashboardAdmin />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/attendance"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["viewAttendanceReports"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <AttendanceAdmin />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/break"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["viewBreakCategories"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <BreakAdmin />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/leaves"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["approveRejectLeaveRequests"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <LeavesAdmin />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/users"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["viewEmployeeProfiles"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <UsersAdmin />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/new-employee"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["addEditEmployees"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <NewEmployee />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/company"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <Company />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/shifts"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <AllShifts />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/shifts/:shiftId/assignments"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <ShiftAssignments />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/all-employees"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["viewEmployeeProfiles"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <AllEmployees />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/all-departments"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <AllDepartments />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/new-department"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["editCompanySettings"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <NewDepartment />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/edit-department/:id"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["editCompanySettings"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <EditDepartment />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/all-teams"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["viewTeams"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <AllTeamsPage />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/Roles&Permissions"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <RolesAndPermissions />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/New_Role"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard
                          permissions={["assignRoles"]}
                        >
                          <Suspense fallback={<Loading />}>
                            <NewRole />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/assign-role-users/:roleId"
                    element={
                      <ProtectedRoute>
                        <PermissionGuard backendPermissions={["Role.Update", "Role.ViewUsers"]}>
                          <Suspense fallback={<Loading />}>
                            <AssignRoleUsers />
                          </Suspense>
                        </PermissionGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/Performance"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <PerformanceAdmin />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pages/admin/TeamWallet"
                    element={
                      <ProtectedRoute>
                        <Suspense fallback={<Loading />}>
                          <AdminTeamWallet />
                        </Suspense>
                      </ProtectedRoute>
                    }
                  />
                  {/* Catch all route - redirect to login for any unmatched routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
              )}
            </TimerProvider>

          </BreakUpdateProvider>
        </AttendanceUpdateProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

export default App;