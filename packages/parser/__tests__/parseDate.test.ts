import {it, expect, describe} from 'vitest'
import {parseDate} from '../utils/parseDate'

describe('parseDate', () => {
  it('should parse the date', () => {
    expect(parseDate('11/07/2001').toISOString()).toBe(
      '2001-07-11T00:00:00.000Z'
    )
  })
})
