import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL  }),
  tagTypes: ['Order'],
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => '/api/v1/orders',
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (id) => `/api/v1/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    createOrder: builder.mutation({
      query: (data) => ({ url: '/api/v1/orders', method: 'POST', body: data }),
      invalidatesTags: ['Order'],
    }),
    deleteOrder: builder.mutation({
      query: (id) => ({ url: `/api/v1/orders/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Order'],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useDeleteOrderMutation,
} = ordersApi
