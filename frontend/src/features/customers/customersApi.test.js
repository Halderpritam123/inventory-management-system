/**
 * Unit tests for customersApi RTK Query configuration.
 * Validates: Requirements 12.6
 */
import { describe, it, expect } from 'vitest'
import { customersApi } from './customersApi'

describe('customersApi configuration', () => {
  it('has correct reducerPath', () => {
    expect(customersApi.reducerPath).toBe('customersApi')
  })

  it('has all expected endpoints', () => {
    const endpointNames = Object.keys(customersApi.endpoints)
    expect(endpointNames).toContain('getCustomers')
    expect(endpointNames).toContain('getCustomerById')
    expect(endpointNames).toContain('createCustomer')
    expect(endpointNames).toContain('deleteCustomer')
  })

  it('getCustomers is a query endpoint', () => {
    expect(customersApi.endpoints.getCustomers.select).toBeDefined()
  })

  it('createCustomer is a mutation endpoint', () => {
    expect(customersApi.endpoints.createCustomer.initiate).toBeDefined()
  })

  it('deleteCustomer is a mutation endpoint', () => {
    expect(customersApi.endpoints.deleteCustomer.initiate).toBeDefined()
  })

  it('exports useGetCustomersQuery hook', async () => {
    const { useGetCustomersQuery } = await import('./customersApi')
    expect(typeof useGetCustomersQuery).toBe('function')
  })

  it('exports useCreateCustomerMutation hook', async () => {
    const { useCreateCustomerMutation } = await import('./customersApi')
    expect(typeof useCreateCustomerMutation).toBe('function')
  })

  it('exports useDeleteCustomerMutation hook', async () => {
    const { useDeleteCustomerMutation } = await import('./customersApi')
    expect(typeof useDeleteCustomerMutation).toBe('function')
  })
})
