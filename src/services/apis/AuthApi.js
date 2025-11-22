import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";
import { setAuthToken, removeAuthToken, setToken, setAuthTokens } from "../../utils/page";
import Cookies from "js-cookie";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => {
        console.log('[AUTH API] Login request:', {
          url: "/api/v1/Authentication/login",
          email: body.email,
          companyId: body.companyId,
          hasPassword: !!body.password,
        });
        return {
          url: "/api/v1/Authentication/login",
          method: "POST",
          body,
        };
      },
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log('[AUTH API] Login response received:', data);
          
          // Handle new API response structure with accessToken and refreshToken
          const responseValue = data.value || data;
          
          if (responseValue?.accessToken && responseValue?.refreshToken) {
            console.log('[AUTH API] AccessToken and RefreshToken found, setting both tokens');
            setAuthTokens(responseValue.accessToken, responseValue.refreshToken);
            
            // Also store refreshTokenExpiresAt if available
            if (responseValue.refreshTokenExpiresAt) {
              console.log('[AUTH API] RefreshToken expires at:', responseValue.refreshTokenExpiresAt);
              // Store expiry date in cookies for reference
              Cookies.set("refresh_token_expires_at", responseValue.refreshTokenExpiresAt, { expires: 20 });
            }
          } else if (responseValue?.accessToken) {
            // Fallback: only accessToken available
            console.log('[AUTH API] Only AccessToken found, setting access token only');
            setAuthToken(responseValue.accessToken);
          } else if (data.value?.token) {
            // Legacy support: old token format
            console.log('[AUTH API] Legacy token format found in data.value.token, setting token');
            setToken(data.value.token);
          } else if (data.token) {
            // Legacy support: old token format
            console.log('[AUTH API] Legacy token format found in data.token, setting token');
            setToken(data.token);
          } else {
            console.warn('[AUTH API] No token found in response:', data);
          }
        } catch (error) {
          console.error('[AUTH API] Error in onQueryStarted:', error);
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
          console.log('[AUTH API] Register response received:', data);
          
          // Handle new API response structure with accessToken and refreshToken
          const responseValue = data.value || data;
          
          if (responseValue?.accessToken && responseValue?.refreshToken) {
            console.log('[AUTH API] AccessToken and RefreshToken found in register, setting both tokens');
            setAuthTokens(responseValue.accessToken, responseValue.refreshToken);
            
            // Store refreshTokenExpiresAt if available
            if (responseValue.refreshTokenExpiresAt) {
              Cookies.set("refresh_token_expires_at", responseValue.refreshTokenExpiresAt, { expires: 20 });
            }
          } else if (responseValue?.accessToken) {
            console.log('[AUTH API] Only AccessToken found in register, setting access token only');
            setAuthToken(responseValue.accessToken);
          } else if (data.value?.token) {
            // Legacy support
            setToken(data.value.token);
          } else if (data.token) {
            // Legacy support
            setToken(data.token);
          }
        } catch (error) {
          console.error('[AUTH API] Error in register onQueryStarted:', error);
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