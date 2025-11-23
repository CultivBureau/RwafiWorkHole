import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const leaveBalanceApi = createApi({
  reducerPath: "leaveBalanceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LeaveBalances"],
  endpoints: (builder) => ({
    // Get user's leave balance
    getMyLeaveBalance: builder.query({
      query: () => ({
        url: "/api/v1/LeaveBalance/GetMy/my",
        method: "GET",
      }),
      providesTags: (result) => [
        { type: "LeaveBalances", id: "MY_BALANCE" },
      ],
    }),
    // Get leave balances for a specific user
    getUserLeaveBalances: builder.query({
      query: (userId) => ({
        url: `/api/v1/User/GetLeaveBalances/${userId}/leave-balances`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [
        { type: "LeaveBalances", id: `USER-${userId}` },
      ],
    }),
    // Create a new leave balance
    createLeaveBalance: builder.mutation({
      query: (body) => ({
        url: "/api/v1/LeaveBalance/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "LeaveBalances", id: `USER-${userId}` },
        { type: "LeaveBalances", id: "MY_BALANCE" },
      ],
    }),
    // Update an existing leave balance
    updateLeaveBalance: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/LeaveBalance/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        "LeaveBalances",
        { type: "LeaveBalances", id: "MY_BALANCE" },
      ],
    }),
  }),
});

export const {
  useGetMyLeaveBalanceQuery,
  useGetUserLeaveBalancesQuery,
  useCreateLeaveBalanceMutation,
  useUpdateLeaveBalanceMutation,
} = leaveBalanceApi;

