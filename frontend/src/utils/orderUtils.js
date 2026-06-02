/**
 * Utility functions for order calculations.
 * These are tested via property-based tests.
 */

/**
 * Compute the live order total from an array of order items.
 * Each item: { price: number, quantity: number }
 * Returns the sum of (price * quantity) for all items.
 */
export function computeOrderTotal(items) {
  return items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0
    const qty = parseInt(item.quantity, 10) || 0
    return sum + price * qty
  }, 0)
}

/**
 * Compute the subtotal for a single line item.
 */
export function computeSubtotal(price, quantity) {
  return parseFloat(price) * parseInt(quantity, 10)
}
