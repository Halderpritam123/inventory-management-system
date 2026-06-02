/**
 * Property-based and unit tests for Zod validation schemas.
 * Validates: Requirements 9.2, 10.2
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { productSchema, customerSchema } from './schemas'

// ---------------------------------------------------------------------------
// Product Schema Tests
// ---------------------------------------------------------------------------

describe('productSchema', () => {
  // Unit tests
  it('accepts valid product data', () => {
    const result = productSchema.safeParse({
      name: 'Widget',
      sku: 'SKU-001',
      price: 9.99,
      stock_quantity: 10,
    })
    expect(result.success).toBe(true)
  })

  it('accepts zero stock', () => {
    const result = productSchema.safeParse({ name: 'A', sku: 'B', price: 1, stock_quantity: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = productSchema.safeParse({ name: '', sku: 'B', price: 1, stock_quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects empty sku', () => {
    const result = productSchema.safeParse({ name: 'A', sku: '', price: 1, stock_quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects price = 0', () => {
    const result = productSchema.safeParse({ name: 'A', sku: 'B', price: 0, stock_quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects price < 0', () => {
    const result = productSchema.safeParse({ name: 'A', sku: 'B', price: -1, stock_quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative stock', () => {
    const result = productSchema.safeParse({ name: 'A', sku: 'B', price: 1, stock_quantity: -1 })
    expect(result.success).toBe(false)
  })

  // Property: Form Validation
  it('rejects any price <= 0 (property)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.float({ max: Math.fround(0), noNaN: true }),
          fc.constant(0),
          fc.float({ max: Math.fround(-0.01), noNaN: true })
        ),
        (price) => {
          const result = productSchema.safeParse({
            name: 'Test',
            sku: 'SKU',
            price,
            stock_quantity: 0,
          })
          return !result.success
        }
      ),
      { numRuns: 100 }
    )
  })

  it('rejects any negative stock_quantity (property)', () => {
    fc.assert(
      fc.property(fc.integer({ max: -1 }), (stock_quantity) => {
        const result = productSchema.safeParse({
          name: 'Test',
          sku: 'SKU',
          price: 10,
          stock_quantity,
        })
        return !result.success
      }),
      { numRuns: 100 }
    )
  })

  it('rejects whitespace-only name (property)', () => {
    fc.assert(
      fc.property(
        // Generate strings with at least one char, all whitespace
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 10 })
          .map((chars) => chars.join('')),
        (name) => {
          const result = productSchema.safeParse({
            name,
            sku: 'SKU',
            price: 10,
            stock_quantity: 0,
          })
          // trim().min(1) should reject whitespace-only strings
          return !result.success
        }
      ),
      { numRuns: 50 }
    )
  })

  it('accepts valid price and stock combinations (property)', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
        fc.integer({ min: 0, max: 100000 }),
        (price, stock_quantity) => {
          const result = productSchema.safeParse({
            name: 'Widget',
            sku: 'SKU-001',
            price: Math.round(price * 100) / 100,
            stock_quantity,
          })
          return result.success
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Customer Schema Tests
// ---------------------------------------------------------------------------

describe('customerSchema', () => {
  it('accepts valid customer data', () => {
    const result = customerSchema.safeParse({
      full_name: 'Jane Doe',
      email: 'jane@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('accepts customer with optional phone', () => {
    const result = customerSchema.safeParse({
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1-555-0100',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty full_name', () => {
    const result = customerSchema.safeParse({ full_name: '', email: 'jane@example.com' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email: no @', () => {
    const result = customerSchema.safeParse({ full_name: 'Jane', email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email: no domain', () => {
    const result = customerSchema.safeParse({ full_name: 'Jane', email: 'jane@' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only full_name (property)', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 10 })
          .map((chars) => chars.join('')),
        (full_name) => {
          const result = customerSchema.safeParse({
            full_name,
            email: 'valid@example.com',
          })
          return !result.success
        }
      ),
      { numRuns: 50 }
    )
  })

  it('rejects invalid email strings (property)', () => {
    // Generate strings that are NOT valid emails
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter((s) => !s.includes('@')),
          fc.constant('notanemail'),
          fc.constant('@nodomain'),
          fc.constant('missing@'),
          fc.constant('double@@sign.com')
        ),
        (email) => {
          const result = customerSchema.safeParse({
            full_name: 'Test User',
            email,
          })
          return !result.success
        }
      ),
      { numRuns: 100 }
    )
  })
})
