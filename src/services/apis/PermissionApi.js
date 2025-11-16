import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const permissionApi = createApi({
  reducerPath: "permissionApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Permission"],
  endpoints: (builder) => ({
    getAllPermissions: builder.query({
      query: () => ({
        url: "/api/v1/Permission/GetAll",
        method: "GET",
      }),
      providesTags: ["Permission"],
    }),
  }),
});

export const { useGetAllPermissionsQuery } = permissionApi;

