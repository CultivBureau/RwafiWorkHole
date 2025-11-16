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
  }),
});

export const {
  useGetMyLeaveBalanceQuery,
} = leaveBalanceApi;

