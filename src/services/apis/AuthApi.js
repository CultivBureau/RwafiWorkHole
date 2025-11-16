import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import { setAuthToken, removeAuthToken, setToken } from "../../utils/page";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Authentication/login",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Handle new API response structure with 'value' wrapper
          if (data.value?.token) {
            setToken(data.value.token);
          } else if (data.token) {
            setToken(data.token);
          }
        } catch {}
      },
    }),
    register: builder.mutation({
      query: (body) => ({
        url: "/api/v1/Authentication/Register",
        method: "POST",
        body,
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Handle new API response structure with 'value' wrapper
          if (data.value?.token) {
            setToken(data.value.token);
          } else if (data.token) {
            setToken(data.token);
          }
        } catch {}
      },
    }),
    me: builder.query({
      query: () => ({
        url: "/api/v1/User/GetUserProfile/me",
        method: "GET",
      }),
      // Don't throw error on 404, just return empty data
      transformErrorResponse: (response, meta, arg) => {
        // If 404, return empty data instead of throwing
        if (response?.status === 404) {
          return { value: null };
        }
        return response;
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useMeQuery,
} = authApi;