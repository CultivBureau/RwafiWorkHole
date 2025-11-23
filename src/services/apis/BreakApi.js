import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import { getCurrentUtcTime } from "../../utils/timeUtils";

export const breakApi = createApi({
  reducerPath: "breakApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Break"],
  endpoints: (builder) => ({
    // Get all breaks (paginated)
    getAllBreaks: builder.query({
      query: ({ pageNumber = 1, pageSize = 10 } = {}) => ({
        url: "/api/v1/Break/GetAll",
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: ["Break"],
    }),

    // Get break by ID
    getBreakById: builder.query({
      query: (id) => ({
        url: `/api/v1/Break/GetById/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Break", id }],
    }),

    // Create a new break
    createBreak: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Break/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Break"],
    }),

    // Update an existing break
    updateBreak: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/Break/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Break", id }, "Break"],
    }),

    // Delete a break
    deleteBreak: builder.mutation({
      query: (id) => ({
        url: `/api/v1/Break/Delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Break"],
    }),

    // Restore a deleted break
    restoreBreak: builder.mutation({
      query: (id) => ({
        url: `/api/v1/Break/Restore/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Break"],
    }),

    // ==================== BreakLog Endpoints ====================
    
    // Get break log by ID
    getBreakLogById: builder.query({
      query: (id) => ({
        url: `/api/v1/BreakLog/GetById/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Break", id: `log-${id}` }],
    }),

    // Get all break logs for company
    getAllBreakLogs: builder.query({
      query: ({ pageNumber = 1, pageSize = 10 } = {}) => ({
        url: "/api/v1/BreakLog/GetAll/company",
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: ["Break"],
    }),

    // Get break logs for a specific user
    getUserBreakLogs: builder.query({
      query: ({ userId, pageNumber = 1, pageSize = 10 }) => ({
        url: `/api/v1/BreakLog/GetAllByUserId/user/${userId}`,
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: (result, error, { userId }) => [
        { type: "Break", id: `user-${userId}` },
        "Break",
      ],
    }),

    // Start a break for the current user
    startBreak: builder.mutation({
      query: ({ breakId, utcDateTime }) => {
        // Ensure UTC time is sent
        const utcTime = utcDateTime || getCurrentUtcTime();
        return {
          url: "/api/v1/BreakLog/StartBreak/start",
          method: "POST",
          body: {
            breakId,
            utcDateTime: utcTime,
          },
        };
      },
      invalidatesTags: ["Break"],
    }),

    // End the current break for the user
    endBreak: builder.mutation({
      query: ({ utcDateTime }) => {
        // Ensure UTC time is sent
        const utcTime = utcDateTime || getCurrentUtcTime();
        return {
          url: "/api/v1/BreakLog/EndBreak/end",
          method: "PUT",
          body: {
            utcDateTime: utcTime,
          },
        };
      },
      invalidatesTags: ["Break"],
    }),

    // Get current user break summary
    getCurrentUserBreakSummary: builder.query({
      query: () => ({
        url: "/api/v1/BreakLog/GetCurrentUserBreakSummary/summary/current",
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
      providesTags: [{ type: "Break", id: "CURRENT_SUMMARY" }],
    }),
  }),
});

export const {
  useGetAllBreaksQuery,
  useGetBreakByIdQuery,
  useCreateBreakMutation,
  useUpdateBreakMutation,
  useDeleteBreakMutation,
  useRestoreBreakMutation,
  useGetBreakLogByIdQuery,
  useGetAllBreakLogsQuery,
  useGetUserBreakLogsQuery,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetCurrentUserBreakSummaryQuery,
} = breakApi;

