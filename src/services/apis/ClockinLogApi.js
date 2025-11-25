import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const clockinLogApi = createApi({
  reducerPath: "clockinLogApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ClockinLogs"],
  endpoints: (builder) => ({
    getCompanyClockinLogs: builder.query({
      query: ({ pageNumber = 1, pageSize = 20 } = {}) => ({
        url: "/api/v1/ClockinLogs/GetAllByCompanyId/company",
        method: "GET",
        params: { pageNumber, pageSize },
      }),
      providesTags: (result) => [{ type: "ClockinLogs", id: "COMPANY_LIST" }],
    }),

    getUserClockinLogs: builder.query({
      query: ({ userId, pageNumber = 1, pageSize = 20 }) => {
        if (!userId) {
          throw new Error("User ID is required");
        }
        return {
          url: `/api/v1/ClockinLogs/GetAllByUserId/user/${userId}`,
          method: "GET",
          params: { pageNumber, pageSize },
        };
      },
      // Handle 404 errors gracefully - return empty array instead of throwing
      transformErrorResponse: (response, meta, arg) => {
        // If 404, return empty data instead of throwing
        if (response?.status === 404) {
          return { value: [], totalCount: 0 };
        }
        return response;
      },
      providesTags: (result, error, arg) => [
        { type: "ClockinLogs", id: `USER_${arg?.userId || "UNKNOWN"}` },
        { type: "ClockinLogs", id: "USER_LIST" },
        { type: "ClockinLogs", id: "LIST" },
      ],
    }),

    getDepartmentClockinLogs: builder.query({
      query: () => ({
        url: "/api/v1/ClockinLogs/GetDepartmentClockinLogs/department",
        method: "GET",
      }),
      transformResponse: (response) => {
        if (!response) return [];

        if (Array.isArray(response)) {
          return response;
        }

        if (Array.isArray(response?.value)) {
          return response.value;
        }

        if (Array.isArray(response?.data)) {
          return response.data;
        }

        return [];
      },
      providesTags: [{ type: "ClockinLogs", id: "DEPARTMENT_LIST" }],
    }),

    getTeamClockinLogs: builder.query({
      query: (teamId) => {
        if (!teamId) {
          throw new Error("Team ID is required");
        }
        return {
          url: `/api/v1/ClockinLogs/GetTeamClockinLogs/team/${teamId}`,
          method: "GET",
        };
      },
      transformResponse: (response) => {
        if (!response) return [];

        if (Array.isArray(response)) {
          return response;
        }

        if (Array.isArray(response?.value)) {
          return response.value;
        }

        if (Array.isArray(response?.data)) {
          return response.data;
        }

        return [];
      },
      transformErrorResponse: (response, meta, arg) => {
        if (response?.status === 404) {
          return [];
        }
        return response;
      },
      providesTags: (result, error, teamId) => [
        { type: "ClockinLogs", id: `TEAM_${teamId || "UNKNOWN"}` },
        { type: "ClockinLogs", id: "TEAM_LIST" },
      ],
    }),

    getClockinLogById: builder.query({
      query: (id) => ({
        url: `/api/v1/ClockinLogs/GetById/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "ClockinLogs", id }],
    }),

    // Get clock-in logs for user profile
    getUserProfileClockInLogs: builder.query({
      query: ({ userId, pageNumber = 1, pageSize = 20 } = {}) => {
        const params = {
          pageNumber,
          pageSize,
        };
        return {
          url: `/api/v1/ClockinLogs/GetUserClockinProfile/user/profile/${userId}`,
          method: "GET",
          params,
        };
      },
      providesTags: (result, error, { userId }) => [
        { type: "ClockinLogs", id: `user-profile-${userId}` },
        { type: "ClockinLogs", id: "USER_LIST" },
        { type: "ClockinLogs", id: "LIST" },
      ],
    }),

    clockIn: builder.mutation({
      query: ({ latitude, longitude, reason }) => {
        // Ensure latitude and longitude are valid numbers
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid latitude or longitude");
        }
        
        // Get current UTC time
        const utcDateTime = new Date().toISOString();
        
        // According to Swagger docs, the API expects camelCase fields directly in the body (not wrapped in "request")
        const requestBody = {
          latitude: String(lat),
          longitude: String(lng),
          reason: reason || null, // Use null instead of empty string for optional fields
          utcDateTime: utcDateTime, // Send UTC time to backend
        };
        
        return {
          url: "/api/v1/ClockinLogs/Clockin/clockin",
          method: "POST",
          body: requestBody,
        };
      },
      // Transform response to handle different API response structures
      transformResponse: (response, meta, arg) => {
        // Return response as-is - API returns { value: {...}, statusCode: 200, ... }
        return response;
      },
      invalidatesTags: (result, error, arg, meta) => {
        // Invalidate all user queries to ensure timer updates
        return [
          { type: "ClockinLogs", id: "COMPANY_LIST" },
          { type: "ClockinLogs", id: "USER_LIST" },
          { type: "ClockinLogs", id: "LIST" },
        ];
      },
    }),

    clockOut: builder.mutation({
      query: ({ latitude, longitude }) => {
        // Ensure latitude and longitude are valid numbers
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid latitude or longitude");
        }
        
        // Get current UTC time
        const utcDateTime = new Date().toISOString();
        
        // According to Swagger docs, the API expects camelCase fields directly in the body (not wrapped in "request")
        const requestBody = {
          latitude: String(lat),
          longitude: String(lng),
          utcDateTime: utcDateTime, // Send UTC time to backend
        };
        
        return {
          url: "/api/v1/ClockinLogs/Clockout/clockout",
          method: "POST",
          body: requestBody,
        };
      },
      invalidatesTags: (result, error, arg, meta) => {
        // Invalidate all user queries to ensure timer updates
        return [
          { type: "ClockinLogs", id: "COMPANY_LIST" },
          { type: "ClockinLogs", id: "USER_LIST" },
          { type: "ClockinLogs", id: "LIST" },
        ];
      },
    }),

    // Get attendance summary
    getAttendanceSummary: builder.query({
      query: () => ({
        url: "/api/v1/ClockinLogs/GetAttendanceSummary/summary",
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
      providesTags: [{ type: "ClockinLogs", id: "SUMMARY" }],
    }),

    // Get current attendance summary
    getCurrentAttendanceSummary: builder.query({
      query: ({ userId, companyId } = {}) => {
        const params = {};
        if (userId) params.userId = userId;
        if (companyId) params.companyId = companyId;
        return {
          url: "/api/v1/ClockinLogs/GetCurrentAttendanceSummary/summary/current",
          method: "GET",
          params,
        };
      },
      transformResponse: (response) => {
        // API returns { value: {...}, statusCode: 200, ... }
        // Extract the value object which contains the summary data
        if (response?.value) {
          return response.value;
        }
        // Fallback if response structure is different
        return response;
      },
      providesTags: [{ type: "ClockinLogs", id: "CURRENT_SUMMARY" }],
    }),
  }),
});

export const {
  useGetCompanyClockinLogsQuery,
  useLazyGetCompanyClockinLogsQuery,
  useGetDepartmentClockinLogsQuery,
  useGetTeamClockinLogsQuery,
  useGetUserClockinLogsQuery,
  useLazyGetUserClockinLogsQuery,
  useGetClockinLogByIdQuery,
  useGetUserProfileClockInLogsQuery,
  useGetAttendanceSummaryQuery,
  useGetCurrentAttendanceSummaryQuery,
  useClockInMutation,
  useClockOutMutation,
} = clockinLogApi;


