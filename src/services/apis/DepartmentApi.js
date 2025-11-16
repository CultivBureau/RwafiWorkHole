import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const departmentApi = createApi({
  reducerPath: "departmentApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Get all departments (paginated)
    getAllDepartments: builder.query({
      query: ({ pageNumber = 1, pageSize = 20, status } = {}) => {
        const params = {
          pageNumber,
          pageSize,
        };
        // Add status filter if provided ("active", "inactive", or undefined for all)
        if (status !== undefined && status !== null) {
          params.status = status;
        }
        return {
          url: "/api/v1/Department/GetAll",
          method: "GET",
          params,
        };
      },
      // Don't throw error on 401, just return empty data
      transformErrorResponse: (response, meta, arg) => {
        // If 401, return empty data instead of throwing
        if (response?.status === 401) {
          return { value: [] };
        }
        return response;
      },
      providesTags: (result) => [{ type: "Departments", id: "LIST" }],
    }),

    // Get a single department by id
    getDepartmentById: builder.query({
      query: (id) => ({
        url: `/api/v1/Department/GetById/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Departments", id }],
    }),

    // Create a new department
    createDepartment: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Department/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Departments", id: "LIST" }],
    }),

    // Update an existing department
    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/Department/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Departments", id: "LIST" }],
    }),

    // Soft delete a department
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/api/v1/Department/Delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Departments", id: "LIST" }],
    }),

    // Restore a soft-deleted department
    restoreDepartment: builder.mutation({
      query: (id) => ({
        url: `/api/v1/Department/Restore/${id}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Departments", id: "LIST" }],
    }),

    // Get department supervisor
    getDepartmentSupervisor: builder.query({
      query: (id) => ({
        url: `/api/v1/Department/GetSupervisor/${id}/supervisor`,
        method: "GET",
      }),
    }),

    // Assign supervisor
    assignSupervisor: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/api/Department/${id}/supervisor/${userId}`,
        method: "PUT",
      }),
      invalidatesTags: ["Departments"],
    }),

    // Remove supervisor
    removeSupervisor: builder.mutation({
      query: (id) => ({
        url: `/api/Department/${id}/remove-supervisor`,
        method: "PUT",
      }),
      invalidatesTags: ["Departments"],
    }),

    // Get department statistics
    getDepartmentStatistics: builder.query({
      query: () => ({
        url: "/api/v1/Department/GetStatistics/statistics",
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
  }),
  tagTypes: ["Departments"],
});

export const {
  useGetAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useRestoreDepartmentMutation,
  useGetDepartmentSupervisorQuery,
  useAssignSupervisorMutation,
  useRemoveSupervisorMutation,
  useGetDepartmentStatisticsQuery,
} = departmentApi;

