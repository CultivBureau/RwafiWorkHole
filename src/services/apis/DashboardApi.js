import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    // Get time tracking summary
    getTimeTrackingSummary: builder.query({
      query: () => ({
        url: "/api/v1/Dashboard/GetTimeTrackingSummary/time-tracking/summary",
        method: "GET",
      }),
      transformResponse: (response) => {
        // API returns { value: {...}, statusCode: 200, ... }
        // Extract the value object which contains the summary data
        if (response?.value) {
          return response.value;
        }
        // Fallback if response structure is different
        return response;
      },
      providesTags: [{ type: "Dashboard", id: "TIME_TRACKING_SUMMARY" }],
    }),

    // Get employee dashboard cards
    getEmployeeDashboardCards: builder.query({
      query: () => ({
        url: "/api/v1/Dashboard/GetEmployeeDashboardCards/employee-attendance-summary",
        method: "GET",
      }),
      transformResponse: (response) => {
        // API returns { value: {...}, statusCode: 200, ... }
        // Extract the value object which contains the dashboard cards data
        if (response?.value) {
          return response.value;
        }
        // Fallback if response structure is different
        return response;
      },
      providesTags: [{ type: "Dashboard", id: "EMPLOYEE_DASHBOARD_CARDS" }],
    }),

    // Get admin dashboard statistics
    getAdminStatistics: builder.query({
      query: () => ({
        url: "/api/v1/Dashboard/GetStatistics/statistics",
        method: "GET",
      }),
      transformResponse: (response) => {
        // API returns { value: {...}, statusCode: 200, ... }
        // Extract the value object which contains the statistics data
        if (response?.value) {
          return response.value;
        }
        // Fallback if response structure is different
        return response;
      },
      providesTags: [{ type: "Dashboard", id: "ADMIN_STATISTICS" }],
    }),

    // Get employee leave summary
    getEmployeeLeaveSummary: builder.query({
      query: () => ({
        url: "/api/v1/Dashboard/GetEmployeeLeaveSummary/employee-leave-summary",
        method: "GET",
      }),
      transformResponse: (response) => {
        // API returns { value: {...}, statusCode: 200, ... }
        // Extract the value object which contains the leave summary data
        if (response?.value) {
          return response.value;
        }
        // Fallback if response structure is different
        return response;
      },
      providesTags: [{ type: "Dashboard", id: "EMPLOYEE_LEAVE_SUMMARY" }],
    }),
  }),
});

export const {
  useGetTimeTrackingSummaryQuery,
  useGetEmployeeDashboardCardsQuery,
  useGetAdminStatisticsQuery,
  useGetEmployeeLeaveSummaryQuery,
} = dashboardApi;

