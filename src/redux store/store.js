import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../services/apis/AuthApi";
import { companyApi } from "../services/apis/CompanyApi";
import { departmentApi } from "../services/apis/DepartmentApi";
import { roleApi } from "../services/apis/RoleApi";
import { teamApi } from "../services/apis/TeamApi";
import { shiftApi } from "../services/apis/ShiftApi";
import { userApi } from "../services/apis/UserApi";
import { leaveApi } from "../services/apis/LeaveApi";
import { leaveTypeApi } from "../services/apis/LeaveTypeApi";
import { leaveBalanceApi } from "../services/apis/LeaveBalanceApi";
import { permissionApi } from "../services/apis/PermissionApi";
import { breakApi } from "../services/apis/BreakApi";
import { clockinLogApi } from "../services/apis/ClockinLogApi";
import { dashboardApi } from "../services/apis/DashboardApi";

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [companyApi.reducerPath]: companyApi.reducer,
    [departmentApi.reducerPath]: departmentApi.reducer,
    [roleApi.reducerPath]: roleApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [shiftApi.reducerPath]: shiftApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [leaveApi.reducerPath]: leaveApi.reducer,
    [leaveTypeApi.reducerPath]: leaveTypeApi.reducer,
    [clockinLogApi.reducerPath]: clockinLogApi.reducer,
    [leaveBalanceApi.reducerPath]: leaveBalanceApi.reducer,
    [permissionApi.reducerPath]: permissionApi.reducer,
    [breakApi.reducerPath]: breakApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      authApi.middleware,
      companyApi.middleware,
      departmentApi.middleware,
      roleApi.middleware,
      teamApi.middleware,
      shiftApi.middleware,
      userApi.middleware,
      leaveApi.middleware,
      leaveTypeApi.middleware,
      clockinLogApi.middleware,
      leaveBalanceApi.middleware,
      permissionApi.middleware,
      breakApi.middleware,
      dashboardApi.middleware,
    ),
});

export default store;
