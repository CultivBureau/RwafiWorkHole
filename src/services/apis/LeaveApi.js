import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const leaveApi = createApi({
  reducerPath: "leaveApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LeaveRequests"],
  endpoints: (builder) => ({
    // Get all team lead leave requests (paginated)
    getAllTeamLeadRequests: builder.query({
      query: ({ pageNumber = 1, pageSize = 20 } = {}) => ({
        url: "/api/v1/LeaveRequest/GetAllTeamLead/team",
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: () => [
        { type: "LeaveRequests", id: "TEAM_LEAD_LIST" },
      ],
    }),

    // Team lead review (approve/reject)
    teamLeadReview: builder.mutation({
      query: ({ requestId, isApproved, comment }) => ({
        url: `/api/v1/LeaveRequest/TeamLeadReview/${requestId}/review`,
        method: "PUT",
        body: {
          isApproved,
          comment: comment || "",
        },
      }),
      invalidatesTags: [
        { type: "LeaveRequests", id: "TEAM_LEAD_LIST" },
        { type: "LeaveRequests", id: "HR_LIST" },
        { type: "Dashboard", id: "EMPLOYEE_LEAVE_SUMMARY" },
      ],
    }),

    // Get all HR leave requests (paginated) - Only shows requests approved by team lead
    // Rejected and pending requests are filtered out (both backend and frontend)
    getAllHrRequests: builder.query({
      query: ({ pageNumber = 1, pageSize = 20 } = {}) => ({
        url: "/api/v1/LeaveRequest/GetAllHr/hr",
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: () => [
        { type: "LeaveRequests", id: "HR_LIST" },
      ],
    }),

    // HR confirm leave request
    hrConfirm: builder.mutation({
      query: ({ requestId, isConfirmed, comment }) => ({
        url: `/api/v1/LeaveRequest/HrConfirm/${requestId}/confirm`,
        method: "PUT",
        body: {
          isConfirmed,
          comment: comment || "",
        },
      }),
      invalidatesTags: [
        { type: "LeaveRequests", id: "HR_LIST" },
        { type: "LeaveRequests", id: "TEAM_LEAD_LIST" },
        { type: "Dashboard", id: "EMPLOYEE_LEAVE_SUMMARY" },
      ],
    }),

    // HR override leave request
    hrOverride: builder.mutation({
      query: ({ requestId, forceApprove, justification }) => ({
        url: `/api/v1/LeaveRequest/HrOverride/${requestId}/override`,
        method: "PUT",
        body: {
          forceApprove,
          justification: justification || "",
        },
      }),
      invalidatesTags: [
        { type: "LeaveRequests", id: "HR_LIST" },
        { type: "LeaveRequests", id: "TEAM_LEAD_LIST" },
      ],
    }),

    // Get user's own leave requests
    getMyLeaveRequests: builder.query({
      query: () => ({
        url: "/api/v1/LeaveRequest/GetMy/my",
        method: "GET",
      }),
      providesTags: () => [
        { type: "LeaveRequests", id: "MY_LIST" },
      ],
    }),

    // Submit a new leave request
    submitLeaveRequest: builder.mutation({
      query: ({ leaveTypeId, startDate, endDate, reason }) => ({
        url: "/api/v1/LeaveRequest/Submit",
        method: "POST",
        body: {
          leaveTypeId,
          startDate,
          endDate,
          reason,
        },
      }),
      invalidatesTags: [
        { type: "LeaveRequests", id: "MY_LIST" },
        { type: "LeaveRequests", id: "TEAM_LEAD_LIST" },
        { type: "Dashboard", id: "EMPLOYEE_LEAVE_SUMMARY" },
      ],
    }),

    // Get leave request statistics
    getLeaveStatistics: builder.query({
      query: () => ({
        url: "/api/v1/LeaveRequest/GetStatistics/statistics",
        method: "GET",
      }),
      providesTags: ["LeaveRequests"],
    }),

    // Get user leave logs (for profile page)
    getUserLeaveLogs: builder.query({
      query: ({ userId, pageNumber = 1, pageSize = 20 }) => ({
        url: `/api/v1/LeaveRequest/GetUserLeaveLogs/logs/${userId}`,
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: (result, error, { userId }) => [
        { type: "LeaveRequests", id: `USER_LOGS_${userId}` },
        { type: "LeaveRequests", id: "MY_LIST" },
      ],
    }),
  }),
});

export const {
  useGetAllTeamLeadRequestsQuery,
  useTeamLeadReviewMutation,
  useGetAllHrRequestsQuery,
  useHrConfirmMutation,
  useHrOverrideMutation,
  useGetMyLeaveRequestsQuery,
  useSubmitLeaveRequestMutation,
  useGetLeaveStatisticsQuery,
  useGetUserLeaveLogsQuery,
} = leaveApi;

