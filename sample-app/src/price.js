export function subtotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function applyDiscount(amount, percent) {
  if (percent < 0 || percent > 100) {
    throw new RangeError('percent must be between 0 and 100')
  }
  return Math.round(amount * (100 - percent)) / 100
}

export function withTax(amount, rate = 0.1) {
  return Math.round(amount * (1 + rate))
}

export function shippingFee(amount) {
  return amount >= 5000 ? 0 : 500
}

export function total(items, { discountPercent = 0, taxRate = 0.1 } = {}) {
  const discounted = applyDiscount(subtotal(items), discountPercent)
  const taxed = withTax(discounted, taxRate)
  return taxed + shippingFee(taxed)
}
