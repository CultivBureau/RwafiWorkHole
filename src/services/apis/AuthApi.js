import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import { 
  setAuthToken, 
  removeAuthToken, 
  setToken, 
  setAuthTokens,
  setPermissionsFromToken,
  setUserInfoFromToken
} from "../../utils/page";

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
            // Set tokens with refresh token expiry date
            setAuthTokens(
              responseValue.accessToken, 
              responseValue.refreshToken,
              responseValue.refreshTokenExpiresAt
            );
            
            // Extract and save permissions from access token
            setPermissionsFromToken(responseValue.accessToken);
            
            // Extract and save user info from access token
            setUserInfoFromToken(responseValue.accessToken);
          } else if (responseValue?.accessToken) {
            // Fallback: only accessToken available
            setAuthToken(responseValue.accessToken);
            setPermissionsFromToken(responseValue.accessToken);
            setUserInfoFromToken(responseValue.accessToken);
          } else if (data.value?.token) {
            // Legacy support: old token format
            setToken(data.value.token);
            setPermissionsFromToken(data.value.token);
            setUserInfoFromToken(data.value.token);
          } else if (data.token) {
            // Legacy support: old token format
            setToken(data.token);
            setPermissionsFromToken(data.token);
            setUserInfoFromToken(data.token);
          }
        } catch (error) {
          // Error handling
          console.error("Login error:", error);
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
            // Set tokens with refresh token expiry date
            setAuthTokens(
              responseValue.accessToken, 
              responseValue.refreshToken,
              responseValue.refreshTokenExpiresAt
            );
            
            // Extract and save permissions from access token
            setPermissionsFromToken(responseValue.accessToken);
            
            // Extract and save user info from access token
            setUserInfoFromToken(responseValue.accessToken);
          } else if (responseValue?.accessToken) {
            // Fallback: only accessToken available
            setAuthToken(responseValue.accessToken);
            setPermissionsFromToken(responseValue.accessToken);
            setUserInfoFromToken(responseValue.accessToken);
          } else if (data.value?.token) {
            // Legacy support
            setToken(data.value.token);
            setPermissionsFromToken(data.value.token);
            setUserInfoFromToken(data.value.token);
          } else if (data.token) {
            // Legacy support
            setToken(data.token);
            setPermissionsFromToken(data.token);
            setUserInfoFromToken(data.token);
          }
        } catch (error) {
          // Error handling
          console.error("Register error:", error);
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