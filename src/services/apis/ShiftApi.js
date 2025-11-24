import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const shiftApi = createApi({
  reducerPath: "shiftApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Shifts"],
  endpoints: (builder) => ({
    // Get all shifts (paginated)
    getAllShifts: builder.query({
      query: ({ pageNumber = 1, pageSize = 10, status } = {}) => {
        const params = {
          pageNumber,
          pageSize,
        };
        // Add status filter - always include status parameter
        // 0 = active, 1 = inactive, 2 = all
        // Always send status parameter to ensure proper filtering
        // Note: We explicitly check !== undefined && !== null to include 0
        if (status !== undefined && status !== null) {
          params.status = status;
        } else {
          // Default to all if status is not provided
          params.status = 2;
        }
        console.log('API Request - Status filter:', status, 'Params:', params);
        return {
          url: "/api/Shift",
          method: "GET",
          params,
        };
      },
      providesTags: (result) => [{ type: "Shifts", id: "LIST" }],
    }),

    // Get a single shift by id
    getShiftById: builder.query({
      query: (id) => ({
        url: `/api/Shift/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Shifts", id }],
    }),

    // Create a new shift
    createShift: builder.mutation({
      query: (body) => ({
        url: "/api/Shift",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Shifts", id: "LIST" }],
    }),

    // Update an existing shift
    updateShift: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/Shift/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Shifts", id: "LIST" },
        { type: "Shifts", id },
      ],
    }),

    // Delete a shift (soft delete - sets status to inactive)
    deleteShift: builder.mutation({
      query: (id) => ({
        url: `/api/Shift/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Shifts", id: "LIST" }],
    }),

    // Restore a shift (sets status back to active)
    restoreShift: builder.mutation({
      query: (id) => ({
        url: `/api/Shift/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Shifts", id: "LIST" },
        { type: "Shifts", id },
      ],
    }),

    // Assign shift to a user (legacy endpoint)
    assignUserShift: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Shift/AssignUser/assignments",
        method: "POST",
        body,
      }),
    }),

    // Assign users to a shift (new endpoint)
    assignUsersToShift: builder.mutation({
      query: (body) => ({
        url: "/api/Shift/assignments",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Shifts", id: "LIST" },
        { type: "Shifts", id: "ALL-ASSIGNMENTS" },
      ],
    }),

    // Update shift assignments (update users assigned to a shift)
    updateShiftAssignments: builder.mutation({
      query: ({ shiftId, ...body }) => ({
        url: `/api/Shift/assignments/${shiftId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Shifts", id: "LIST" }],
    }),

    // Get all assignments (for all shifts) - filter by shiftId on client side
    getAllShiftAssignments: builder.query({
      query: () => ({
        url: `/api/Shift/assignments`,
        method: "GET",
      }),
      providesTags: (result) => [{ type: "Shifts", id: "ALL-ASSIGNMENTS" }],
    }),

    // Update a single assignment (update effective dates for one user)
    updateShiftAssignment: builder.mutation({
      query: ({ assignmentId, ...body }) => ({
        url: `/api/Shift/assignments/${assignmentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: () => [
        { type: "Shifts", id: "LIST" },
        { type: "Shifts", id: "ALL-ASSIGNMENTS" },
      ],
    }),

    // Delete a single assignment (remove user from shift)
    deleteShiftAssignment: builder.mutation({
      query: ({ assignmentId }) => ({
        url: `/api/Shift/assignments/${assignmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: () => [
        { type: "Shifts", id: "LIST" },
        { type: "Shifts", id: "ALL-ASSIGNMENTS" },
      ],
    }),
  }),
});

export const {
  useGetAllShiftsQuery,
  useGetShiftByIdQuery,
  useCreateShiftMutation,
  useUpdateShiftMutation,
  useDeleteShiftMutation,
  useRestoreShiftMutation,
  useAssignUserShiftMutation,
  useAssignUsersToShiftMutation,
  useUpdateShiftAssignmentsMutation,
  useGetAllShiftAssignmentsQuery,
  useUpdateShiftAssignmentMutation,
  useDeleteShiftAssignmentMutation,
} = shiftApi;

