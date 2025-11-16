import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    // Create a new team
    createTeam: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Team/Create",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, body) => [
        "Teams",
        { type: "Teams", id: "LIST" },
        { type: "Teams", id: `DEPARTMENT-${body.departmentId}` },
      ],
    }),

    // Get teams by department ID
    getTeamsByDepartment: builder.query({
      query: (departmentId) => ({
        url: `/api/v1/Team/GetByDepartment/department/${departmentId}`,
        method: "GET",
      }),
      providesTags: (result, error, departmentId) => [
        { type: "Teams", id: `DEPARTMENT-${departmentId}` },
      ],
    }),

    // Get team users/members
    getTeamUsers: builder.query({
      query: (teamId) => {
        if (!teamId) {
          throw new Error("teamId is required");
        }
        return {
          url: `/api/v1/Team/GetTeamUsers/${teamId}/users`,
          method: "GET",
        };
      },
      providesTags: (result, error, teamId) => [
        { type: "Teams", id: `TEAM-USERS-${teamId}` },
      ],
    }),

    // Add user to team
    addUserToTeam: builder.mutation({
      query: ({ teamId, userId }) => ({
        url: `/api/v1/Team/AddUserToTeam/${teamId}/users`,
        method: "POST",
        body: {
          userId,
          teamId,
        },
      }),
      invalidatesTags: (result, error, { teamId }) => [
        "Teams",
        { type: "Teams", id: "LIST" },
        { type: "Teams", id: `TEAM-USERS-${teamId}` },
      ],
    }),
    // Add users to team (plural - accepts array of userIds)
    addUsersToTeam: builder.mutation({
      query: ({ teamId, userIds }) => ({
        url: `/api/v1/Team/AddUsersToTeam/${teamId}/users`,
        method: "POST",
        body: {
          userIds: Array.isArray(userIds) ? userIds : [userIds],
        },
      }),
      invalidatesTags: (result, error, { teamId, departmentId }) => {
        const deptId = departmentId || result?.value?.[0]?.team?.departmentId;
        return [
          "Teams",
          { type: "Teams", id: "LIST" },
          { type: "Teams", id: `TEAM-USERS-${teamId}` },
          ...(deptId ? [{ type: "Teams", id: `DEPARTMENT-${deptId}` }] : []),
        ];
      },
    }),

    // Update team
    updateTeam: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/api/v1/Team/Update/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        "Teams",
        { type: "Teams", id: "LIST" },
        { type: "Teams", id: `DEPARTMENT-${departmentId}` },
      ],
    }),

    // Delete team
    deleteTeam: builder.mutation({
      query: (arg) => {
        // Accept either id (string) or { id, departmentId } object
        const id = typeof arg === 'string' ? arg : arg.id;
        return {
          url: `/api/v1/Team/Delete/${id}`,
          method: "DELETE",
        };
      },
      invalidatesTags: (result, error, arg) => {
        // Get departmentId from arg if it's an object, or from result
        const departmentId = (typeof arg === 'object' && arg.departmentId)
          || result?.value?.departmentId
          || result?.departmentId;
        const tags = [
          "Teams",
          { type: "Teams", id: "LIST" },
        ];
        // If we have departmentId, invalidate department-specific teams
        if (departmentId) {
          tags.push({ type: "Teams", id: `DEPARTMENT-${departmentId}` });
        }
        return tags;
      },
    }),

    // Update users in team (replaces all users)
    updateUsersInTeam: builder.mutation({
      query: ({ teamId, userIds }) => ({
        url: `/api/v1/Team/UpdateUsersInTeam/${teamId}/users`,
        method: "PUT",
        body: {
          userIds: Array.isArray(userIds) ? userIds : [userIds],
        },
      }),
      invalidatesTags: (result, error, arg) => {
        try {
          if (!arg || typeof arg !== 'object' || !arg.teamId) {
            return ["Teams", { type: "Teams", id: "LIST" }];
          }

          const { teamId, departmentId } = arg;
          const deptId = departmentId || result?.value?.[0]?.team?.departmentId || result?.value?.[0]?.departmentId;

          const tags = [
            "Teams",
            { type: "Teams", id: "LIST" },
            { type: "Teams", id: `TEAM-USERS-${teamId}` },
          ];

          if (deptId) {
            tags.push({ type: "Teams", id: `DEPARTMENT-${deptId}` });
          }

          return tags;
        } catch (err) {
          console.error('Error in updateUsersInTeam invalidatesTags:', err);
          return ["Teams", { type: "Teams", id: "LIST" }];
        }
      },
    }),

    // Delete users from team
    deleteUsersFromTeam: builder.mutation({
      query: ({ teamId, userIds }) => ({
        url: `/api/v1/Team/DeleteUsersFromTeam/${teamId}/users`,
        method: "DELETE",
        body: {
          userIds: Array.isArray(userIds) ? userIds : [userIds],
        },
      }),
      invalidatesTags: (result, error, arg) => {
        if (!arg || !arg.teamId) return ["Teams", { type: "Teams", id: "LIST" }];

        const { teamId, departmentId } = arg;
        const deptId = departmentId || result?.value?.[0]?.team?.departmentId || result?.value?.[0]?.departmentId;

        return [
          "Teams",
          { type: "Teams", id: "LIST" },
          { type: "Teams", id: `TEAM-USERS-${teamId}` },
          ...(deptId ? [{ type: "Teams", id: `DEPARTMENT-${deptId}` }] : []),
        ];
      },
    }),

    // Assign user to a team
    assignUserToTeam: builder.mutation({
      query: ({ teamId, userId }) => ({
        url: `/api/v1/Team/AddUserToTeam/${teamId}/users`,
        method: "POST",
        body: { userId, teamId },
      }),
      invalidatesTags: ["Teams"],
    }),


  }),
  tagTypes: ["Teams"],
});

export const {
  useAssignUserToTeamMutation,
  useCreateTeamMutation,
  useGetTeamsByDepartmentQuery,
  useGetTeamUsersQuery,
  useAddUserToTeamMutation,
  useAddUsersToTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useUpdateUsersInTeamMutation,
  useDeleteUsersFromTeamMutation
} = teamApi;

