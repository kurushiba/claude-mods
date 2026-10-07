const COUPONS = {
  WELCOME10: { percent: 10, minAmount: 0 },
  SUMMER20: { percent: 20, minAmount: 3000 },
  VIP30: { percent: 30, minAmount: 10000 },
}

export function normalizeCode(code) {
  return code.trim().toUpperCase()
}

export function findCoupon(code) {
  return COUPONS[normalizeCode(code)] ?? null
}

export function canUse(code, amount) {
  const coupon = findCoupon(code)
  return coupon !== null && amount >= coupon.minAmount
}

export function discountPercent(code, amount) {
  return canUse(code, amount) ? findCoupon(code).percent : 0
}
