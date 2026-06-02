/**
 * Property tests for order live total calculation.
 *
 * Property: Live Order Total
 * For any array of items with valid quantity (int > 0) and unit_price (float > 0),
 * the computed total equals sum(qty × unit_price).
 *
 * Validates: Requirements 11.3
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { computeOrderTotal, computeSubtotal } from './orderUtils'

// Strategies
const positiveInt = fc.integer({ min: 1, max: 1000 })
const positivePrice = fc.float({ min: Math.fround(0.01), max: Math.fround(9999.99), noNaN: true })

describe('computeOrderTotal', () => {
  it('returns 0 for empty items array', () => {
    expect(computeOrderTotal([])).toBe(0)
  })

  it('computes single item total correctly', () => {
    expect(computeOrderTotal([{ price: 10.0, quantity: 3 }])).toBeCloseTo(30.0)
  })

  it('computes multi-item total correctly', () => {
    const items = [
      { price: 25.0, quantity: 2 },
      { price: 10.5, quantity: 4 },
    ]
    expect(computeOrderTotal(items)).toBeCloseTo(92.0)
  })

  it('skips items with zero quantity', () => {
    const items = [
      { price: 10.0, quantity: 0 },
      { price: 5.0, quantity: 2 },
    ]
    expect(computeOrderTotal(items)).toBeCloseTo(10.0)
  })
})

describe('computeSubtotal', () => {
  it('computes subtotal correctly', () => {
    expect(computeSubtotal(9.99, 5)).toBeCloseTo(49.95)
  })
})

describe('Property: Live Order Total', () => {
  it('total equals sum of (qty × price) for any valid item array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            price: positivePrice,
            quantity: positiveInt,
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (items) => {
          const total = computeOrderTotal(items)
          const expected = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
          return Math.abs(total - expected) < 0.001
        }
      ),
      { numRuns: 100 }
    )
  })

  it('adding an item never decreases the total', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ price: positivePrice, quantity: positiveInt }),
          { minLength: 0, maxLength: 10 }
        ),
        fc.record({ price: positivePrice, quantity: positiveInt }),
        (items, newItem) => {
          const before = computeOrderTotal(items)
          const after = computeOrderTotal([...items, newItem])
          return after >= before
        }
      ),
      { numRuns: 100 }
    )
  })

  it('total is commutative with respect to item order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ price: positivePrice, quantity: positiveInt }),
          { minLength: 2, maxLength: 10 }
        ),
        (items) => {
          const reversed = [...items].reverse()
          const total1 = computeOrderTotal(items)
          const total2 = computeOrderTotal(reversed)
          return Math.abs(total1 - total2) < 0.001
        }
      ),
      { numRuns: 100 }
    )
  })
})
