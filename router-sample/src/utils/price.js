const SYMBOLS = { JPY: '¥', USD: '$', EUR: '€' }

export function formatPrice(amount, currency = 'JPY') {
  const symbol = SYMBOLS[currency] ?? `${currency} `
  const digits = currency === 'JPY' ? 0 : 2
  return `${symbol}${amount.toFixed(digits)}`
}

export function convert(amount, rate) {
  return amount * rate
}
