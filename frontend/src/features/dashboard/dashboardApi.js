import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['Dashboard'],
  keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => '/api/v1/dashboard/stats',
      providesTags: ['Dashboard'],
    }),
  }),
})

export const { useGetDashboardStatsQuery } = dashboardApi
