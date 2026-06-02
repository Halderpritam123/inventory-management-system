import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000' }),
  tagTypes: ['Customer'],
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: () => '/api/v1/customers',
      providesTags: ['Customer'],
    }),
    getCustomerById: builder.query({
      query: (id) => `/api/v1/customers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Customer', id }],
    }),
    createCustomer: builder.mutation({
      query: (data) => ({ url: '/api/v1/customers', method: 'POST', body: data }),
      invalidatesTags: ['Customer'],
    }),
    deleteCustomer: builder.mutation({
      query: (id) => ({ url: `/api/v1/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Customer'],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApi
