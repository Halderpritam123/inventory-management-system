import { configureStore } from '@reduxjs/toolkit'
import { productsApi } from '@/features/products/productsApi'
import { customersApi } from '@/features/customers/customersApi'
import { ordersApi } from '@/features/orders/ordersApi'
import { dashboardApi } from '@/features/dashboard/dashboardApi'

export const store = configureStore({
  reducer: {
    [productsApi.reducerPath]: productsApi.reducer,
    [customersApi.reducerPath]: customersApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(productsApi.middleware)
      .concat(customersApi.middleware)
      .concat(ordersApi.middleware)
      .concat(dashboardApi.middleware),
})
