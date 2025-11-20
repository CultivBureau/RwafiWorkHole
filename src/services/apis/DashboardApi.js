import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    // Get employee leave summary
    getEmployeeLeaveSummary: builder.query({
      query: () => ({
        url: "/api/v1/Dashboard/GetEmployeeLeaveSummary/employee-leave-summary",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
    // Get dashboard statistics
    getDashboardStatistics: builder.query({
      query: () => ({
        url: "/api/v1/Dashboard/GetStatistics/statistics",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useGetEmployeeLeaveSummaryQuery,
  useGetDashboardStatisticsQuery,
} = dashboardApi;

