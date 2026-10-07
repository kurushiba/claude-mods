import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { canUse, discountPercent, findCoupon, normalizeCode } from '../src/coupon.js'

describe('normalizeCode', () => {
  it('upper-cases the code', () => assert.equal(normalizeCode('welcome10'), 'WELCOME10'))
  it('trims spaces', () => assert.equal(normalizeCode('  VIP30 '), 'VIP30'))
})

describe('findCoupon', () => {
  it('finds a known code', () => assert.equal(findCoupon('SUMMER20').percent, 20))
  it('answers null for an unknown code', () => assert.equal(findCoupon('NOPE'), null))
})

describe('canUse', () => {
  it('allows a coupon with no minimum', () => assert.equal(canUse('WELCOME10', 100), true))
  it('allows at the minimum', () => assert.equal(canUse('SUMMER20', 3000), true))
  it('refuses under the minimum', () => assert.equal(canUse('VIP30', 9999), false))
  it('refuses an unknown code', () => assert.equal(canUse('NOPE', 100000), false))
})

describe('discountPercent', () => {
  it('answers the percent when usable', () => assert.equal(discountPercent('vip30', 20000), 30))
  it('answers 0 when not usable', () => assert.equal(discountPercent('VIP30', 500), 0))
})
