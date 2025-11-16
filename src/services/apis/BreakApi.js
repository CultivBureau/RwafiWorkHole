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

    // Get break logs for a specific user
    getUserBreakLogs: builder.query({
      query: ({ userId, pageNumber = 1, pageSize = 10 }) => ({
        url: `/api/BreakLog/user/${userId}`,
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      providesTags: ["Break"],
    }),

    // Start a break for the current user
    startBreak: builder.mutation({
      query: ({ breakId, utcDateTime }) => {
        // Ensure UTC time is sent
        const utcTime = utcDateTime || getCurrentUtcTime();
        return {
          url: "/api/BreakLog/start",
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
          url: "/api/BreakLog/end",
          method: "PUT",
          body: {
            utcDateTime: utcTime,
          },
        };
      },
      invalidatesTags: ["Break"],
    }),
  }),
});

export const {
  useGetAllBreaksQuery,
  useGetBreakByIdQuery,
  useCreateBreakMutation,
  useUpdateBreakMutation,
  useDeleteBreakMutation,
  useGetUserBreakLogsQuery,
  useStartBreakMutation,
  useEndBreakMutation,
} = breakApi;

