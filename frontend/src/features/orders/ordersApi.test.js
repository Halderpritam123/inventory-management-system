/**
 * Unit tests for ordersApi RTK Query configuration.
 * Validates: Requirements 12.6
 */
import { describe, it, expect } from 'vitest'
import { ordersApi } from './ordersApi'

describe('ordersApi configuration', () => {
  it('has correct reducerPath', () => {
    expect(ordersApi.reducerPath).toBe('ordersApi')
  })

  it('has all expected endpoints', () => {
    const endpointNames = Object.keys(ordersApi.endpoints)
    expect(endpointNames).toContain('getOrders')
    expect(endpointNames).toContain('getOrderById')
    expect(endpointNames).toContain('createOrder')
    expect(endpointNames).toContain('deleteOrder')
  })

  it('getOrders is a query endpoint', () => {
    expect(ordersApi.endpoints.getOrders.select).toBeDefined()
  })

  it('createOrder is a mutation endpoint', () => {
    expect(ordersApi.endpoints.createOrder.initiate).toBeDefined()
  })

  it('deleteOrder is a mutation endpoint', () => {
    expect(ordersApi.endpoints.deleteOrder.initiate).toBeDefined()
  })

  it('exports useGetOrdersQuery hook', async () => {
    const { useGetOrdersQuery } = await import('./ordersApi')
    expect(typeof useGetOrdersQuery).toBe('function')
  })

  it('exports useCreateOrderMutation hook', async () => {
    const { useCreateOrderMutation } = await import('./ordersApi')
    expect(typeof useCreateOrderMutation).toBe('function')
  })

  it('exports useDeleteOrderMutation hook', async () => {
    const { useDeleteOrderMutation } = await import('./ordersApi')
    expect(typeof useDeleteOrderMutation).toBe('function')
  })
})
