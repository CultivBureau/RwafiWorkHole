import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // Get all users with optional filters
    getAllUsers: builder.query({
      query: ({ departmentId, teamId, name, pageNumber = 1, pageSize = 100 } = {}) => {
        const params = { pageNumber, pageSize };
        if (departmentId) params.departmentId = departmentId;
        if (teamId) params.teamId = teamId;
        if (name) params.name = name;
        
        return {
          url: "/api/v1/User/GetAll",
          method: "GET",
          params,
        };
      },
      providesTags: ["User"],
    }),

    // Create a new user
    createUser: builder.mutation({
      query: (body) => ({
        url: "/api/v1/User/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Update an existing user
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/User/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Delete a user
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/api/v1/User/Delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),

    // Restore a user
    restoreUser: builder.mutation({
      query: (id) => ({
        url: `/api/v1/User/Restore/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),

    // Get user by ID
    getUserById: builder.query({
      query: (userId) => ({
        url: `/api/v1/User/GetById/${userId}`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [{ type: "User", id: userId }],
    }),

    // Get multiple users by IDs (if your API supports it)
    getUsersByIds: builder.query({
      query: (userIds) => ({
        url: `/api/v1/User/GetByIds`,
        method: "POST",
        body: { userIds },
      }),
      providesTags: (result) => [{ type: "User", id: "LIST" }],
    }),

    // Get user profile by ID (for admin viewing employee profiles)
    getUserProfileById: builder.query({
      query: (userId) => ({
        url: `/api/v1/User/GetUserProfile/${userId}/profile`,
        method: "GET",
      }),
      providesTags: (result, error, userId) => [{ type: "User", id: `profile-${userId}` }],
    }),

    // Get user statistics
    getUserStatistics: builder.query({
      query: () => ({
        url: "/api/v1/User/GetUserStatistics/statistics",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRestoreUserMutation,
  useGetUserByIdQuery,
  useGetUsersByIdsQuery,
  useGetUserProfileByIdQuery,
  useGetUserStatisticsQuery,
} = userApi;

