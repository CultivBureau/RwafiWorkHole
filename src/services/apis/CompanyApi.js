import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Company"],
  endpoints: (builder) => ({
    getUserCompaniesByEmail: builder.mutation({
      query: (email) => ({
        url: "/api/v1/User/GetUserCompaniesByEmail/companies",
        method: "POST",
        body: { email: email },
      }),
    }),
    getCompanyById: builder.query({
      query: (id) => ({
        url: `/api/v1/Company/GetById/${id}`,
        method: "GET",
      }),
      providesTags: ["Company"],
    }),
    updateCompany: builder.mutation({
      query: ({ companyId, name }) => ({
        url: `/api/v1/Company/Update/${companyId}`,
        method: "PUT",
        body: { name },
      }),
      invalidatesTags: ["Company"],
    }),
    updateCompanyDetails: builder.mutation({
      query: ({ companyId, name, attachments }) => {
        const formData = new FormData();
        
        // Add company name - only if provided (optional field)
        if (name && name.trim()) {
          formData.append("Name", name.trim());
        }
        
        // Add attachments array - matches new schema: Attachments[{id, internalId, file, fileName, expiryDate}]
        // Schema: { "id": 0, "internalId": "uuid", "file": "string", "fileName": "string", "expiryDate": "2025-11-09" }
        if (attachments && Array.isArray(attachments) && attachments.length > 0) {
          attachments.forEach((attachment, index) => {
            // Send id (optional)
            if (attachment.id !== undefined && attachment.id !== null) {
              formData.append(`Attachments[${index}].id`, attachment.id.toString());
            }
            
            // Send internalId (optional) - UUID string
            if (attachment.internalId) {
              formData.append(`Attachments[${index}].internalId`, attachment.internalId);
            }
            
            // Send file only if it's a File object (optional)
            // If no file is sent, backend should keep existing file
            if (attachment.file instanceof File) {
              formData.append(`Attachments[${index}].file`, attachment.file);
            }
            
            // Send fileName (optional) - string
            if (attachment.fileName) {
              formData.append(`Attachments[${index}].fileName`, attachment.fileName);
            }
            
            // Send expiryDate (optional) - Format: "2025-11-09" (YYYY-MM-DD)
            if (attachment.expiryDate && attachment.expiryDate.trim()) {
              formData.append(`Attachments[${index}].expiryDate`, attachment.expiryDate.trim());
            }
          });
        }
        
        // Debug: Log FormData contents (for development only)
        if (import.meta.env.DEV) {
          console.log("FormData contents:");
          for (let pair of formData.entries()) {
            console.log(pair[0] + ": " + (pair[1] instanceof File ? pair[1].name : pair[1]));
          }
        }
        
        return {
          url: `/api/v1/Company/UpdateDetails/${companyId}/details`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["Company"],
    }),
  }),
});

export const { 
  useGetUserCompaniesByEmailMutation,
  useGetCompanyByIdQuery,
  useUpdateCompanyMutation,
  useUpdateCompanyDetailsMutation,
} = companyApi;
