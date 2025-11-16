import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Role"],
  endpoints: (builder) => ({
    // Get all roles (paginated)
    getAllRoles: builder.query({
      query: ({ pageNumber = 1, pageSize = 20 } = {}) => ({
        url: "/api/v1/Role/GetAll",
        method: "GET",
        params: {
          pageNumber,
          pageSize,
        },
      }),
      // Don't throw error on 401, just return empty data
      transformErrorResponse: (response, meta, arg) => {
        // If 401, return empty data instead of throwing
        if (response?.status === 401) {
          return { value: [] };
        }
        return response;
      },
      providesTags: ["Role"],
    }),

    // Get role by ID
    getRoleById: builder.query({
      query: (id) => ({
        url: `/api/v1/Role/GetById/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Role", id }],
    }),

    // Create a new role
    createRole: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Role/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Role"],
    }),

    // Update an existing role
    updateRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/Role/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Role", id }, "Role"],
    }),

    // Delete a role
    deleteRole: builder.mutation({
      query: (id) => ({
        url: `/api/v1/Role/Delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // Restore a deleted role
    restoreRole: builder.mutation({
      query: (id) => ({
        url: `/api/v1/Role/Restore/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Role"],
    }),

    // Get users by role id (paginated)
    getRoleUsers: builder.query({
      query: ({ id, pageNumber = 1, pageSize = 20 }) => ({
        url: `/api/v1/Role/GetUsers/${id}/users`,
        method: "GET",
        params: { pageNumber, pageSize },
      }),
      providesTags: (result, error, { id }) => [{ type: "Role", id: `${id}-users` }],
    }),

    // Get permissions by role id
    getRolePermissions: builder.query({
      query: (id) => ({
        url: `/api/v1/Role/GetPermissions/${id}/permissions`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Role", id: `${id}-permissions` }],
    }),

    // Assign user to role
    assignUserToRole: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/api/v1/Role/AssignUserToRole/${id}/assign-user/${userId}`,
        method: "POST",
      }),
      invalidatesTags: ["Role"],
    }),

    // Remove user from role
    removeUserFromRole: builder.mutation({
      query: ({ id, userId }) => ({
        url: `/api/v1/Role/RemoveUserFromRole/${id}/remove-user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),

    // Get role statistics
    getRoleStatistics: builder.query({
      query: () => ({
        url: "/api/v1/Role/GetRoleStatistics/statistics",
        method: "GET",
      }),
      providesTags: ["Role"],
    }),
  }),
});

export const {
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useRestoreRoleMutation,
  useGetRoleUsersQuery,
  useGetRolePermissionsQuery,
  useAssignUserToRoleMutation,
  useRemoveUserFromRoleMutation,
  useGetRoleStatisticsQuery,
} = roleApi;
