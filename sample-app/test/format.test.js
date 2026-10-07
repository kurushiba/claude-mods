import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { formatLine, formatQuantity, formatYen, truncate } from '../src/format.js'

describe('formatYen', () => {
  it('adds the yen sign', () => assert.equal(formatYen(500), '¥500'))
  it('adds thousands separators', () => assert.equal(formatYen(1234567), '¥1,234,567'))
  it('shows zero', () => assert.equal(formatYen(0), '¥0'))
})

describe('formatQuantity and formatLine', () => {
  it('adds the counter word', () => assert.equal(formatQuantity(3), '3点'))
  it('shows name, quantity and price', () => {
    assert.equal(formatLine({ name: 'りんご', price: 150, quantity: 2 }), 'りんご × 2  ¥300')
  })
})

describe('truncate', () => {
  it('keeps short text', () => assert.equal(truncate('abc', 5), 'abc'))
  it('keeps text of exactly max', () => assert.equal(truncate('abcde', 5), 'abcde'))
  it('cuts long text with an ellipsis', () => assert.equal(truncate('abcdefg', 5), 'abcd…'))
})
