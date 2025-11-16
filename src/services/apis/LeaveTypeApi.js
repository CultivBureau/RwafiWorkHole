import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const leaveTypeApi = createApi({
  reducerPath: "leaveTypeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["LeaveTypes"],
  endpoints: (builder) => ({
    // Get all leave types (paginated)
    // Supports status filtering: 0=active, 1=inactive, 2=all
    getAllLeaveTypes: builder.query({
      query: ({ pageNumber = 1, pageSize = 20, status } = {}) => {
        const params = {
          pageNumber,
          pageSize,
        };
        // Add status filter if provided (0=active, 1=inactive, 2=all)
        // Always include status parameter to ensure proper filtering
        if (status !== undefined && status !== null) {
          params.status = status;
        } else {
          // Default to all if status is not provided
          params.status = 2;
        }
        return {
          url: "/api/v1/LeaveType/GetAll",
          method: "GET",
          params,
        };
      },
      providesTags: (result) => [{ type: "LeaveTypes", id: "LIST" }],
    }),

    // Get a single leave type by id
    getLeaveTypeById: builder.query({
      query: (id) => ({
        url: `/api/v1/LeaveType/GetById/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "LeaveTypes", id }],
    }),

    // Create a new leave type
    createLeaveType: builder.mutation({
      query: (body) => ({
        url: "/api/v1/LeaveType/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "LeaveTypes", id: "LIST" }],
    }),

    // Update an existing leave type
    updateLeaveType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/LeaveType/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "LeaveTypes", id: "LIST" },
        { type: "LeaveTypes", id },
      ],
    }),

    // Delete a leave type (soft delete - sets status to inactive)
    deleteLeaveType: builder.mutation({
      query: (id) => ({
        url: `/api/v1/LeaveType/Delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "LeaveTypes", id: "LIST" }],
    }),

    // Restore a leave type (sets status back to active)
    restoreLeaveType: builder.mutation({
      query: (id) => ({
        url: `/api/v1/LeaveType/Restore/${id}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "LeaveTypes", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllLeaveTypesQuery,
  useGetLeaveTypeByIdQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useRestoreLeaveTypeMutation,
} = leaveTypeApi;

