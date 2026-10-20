import { convert, formatPrice } from './utils/price.js'

export function monthlyReport(sales, rates) {
  return Object.entries(sales).map(([currency, amount]) => {
    const yen = convert(amount, rates[currency] ?? 1)
    return `${formatPrice(amount, currency)} → ${formatPrice(yen)}`
  })
}
