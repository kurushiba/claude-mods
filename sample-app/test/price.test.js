import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { applyDiscount, shippingFee, subtotal, total, withTax } from '../src/price.js'

const items = [
  { id: 'a', price: 1200, quantity: 2 },
  { id: 'b', price: 800, quantity: 1 },
]

describe('subtotal', () => {
  it('adds price × quantity of every item', () => assert.equal(subtotal(items), 3200))
  it('is 0 for no items', () => assert.equal(subtotal([]), 0))
  it('counts quantity', () => assert.equal(subtotal([{ price: 100, quantity: 5 }]), 500))
})

describe('applyDiscount', () => {
  it('takes 10% off', () => assert.equal(applyDiscount(1000, 10), 900))
  it('keeps the amount at 0%', () => assert.equal(applyDiscount(1000, 0), 1000))
  it('makes it free at 100%', () => assert.equal(applyDiscount(1000, 100), 0))
  it('rejects a negative percent', () => assert.throws(() => applyDiscount(1000, -1), RangeError))
  it('rejects more than 100%', () => assert.throws(() => applyDiscount(1000, 101), RangeError))
})

describe('withTax', () => {
  it('adds 10% by default', () => assert.equal(withTax(1000), 1100))
  it('takes another rate', () => assert.equal(withTax(1000, 0.08), 1080))
})

describe('shippingFee and total', () => {
  it('is free from 5000 yen', () => assert.equal(shippingFee(5000), 0))
  it('adds shipping under 5000 yen', () => assert.equal(total(items), 3520 + 500))
})
