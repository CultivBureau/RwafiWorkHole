import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import { setAuthToken, removeAuthToken, setToken, setAuthTokens } from "../../utils/page";
import Cookies from "js-cookie";

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
          
          // Handle new API response structure with accessToken and refreshToken
          const responseValue = data.value || data;
          
          if (responseValue?.accessToken && responseValue?.refreshToken) {
            setAuthTokens(responseValue.accessToken, responseValue.refreshToken);
            
            // Also store refreshTokenExpiresAt if available
            if (responseValue.refreshTokenExpiresAt) {
              // Store expiry date in cookies for reference
              Cookies.set("refresh_token_expires_at", responseValue.refreshTokenExpiresAt, { expires: 20 });
            }
          } else if (responseValue?.accessToken) {
            // Fallback: only accessToken available
            setAuthToken(responseValue.accessToken);
          } else if (data.value?.token) {
            // Legacy support: old token format
            setToken(data.value.token);
          } else if (data.token) {
            // Legacy support: old token format
            setToken(data.token);
          }
        } catch (error) {
          // Error handling
        }
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
          
          // Handle new API response structure with accessToken and refreshToken
          const responseValue = data.value || data;
          
          if (responseValue?.accessToken && responseValue?.refreshToken) {
            setAuthTokens(responseValue.accessToken, responseValue.refreshToken);
            
            // Store refreshTokenExpiresAt if available
            if (responseValue.refreshTokenExpiresAt) {
              Cookies.set("refresh_token_expires_at", responseValue.refreshTokenExpiresAt, { expires: 20 });
            }
          } else if (responseValue?.accessToken) {
            setAuthToken(responseValue.accessToken);
          } else if (data.value?.token) {
            // Legacy support
            setToken(data.value.token);
          } else if (data.token) {
            // Legacy support
            setToken(data.token);
          }
        } catch (error) {
          // Error handling
        }
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