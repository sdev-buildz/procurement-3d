import { describe, expect, it } from 'vitest'
import { getVisibleLabelIds, type LabelRectangle } from './labelVisibility'

const rectangle = (id: string, left: number, priority = 0): LabelRectangle => ({
  id,
  left,
  top: 10,
  right: left + 40,
  bottom: 30,
  priority,
})

describe('getVisibleLabelIds', () => {
  it('hides overlapping labels while keeping labels that have room', () => {
    const visible = getVisibleLabelIds([
      rectangle('first', 10),
      rectangle('overlapping', 45),
      rectangle('separate', 100),
    ])

    expect(visible).toEqual(new Set(['first', 'separate']))
  })

  it('keeps selected labels ahead of nearby unselected labels', () => {
    const visible = getVisibleLabelIds([
      rectangle('unselected', 10),
      rectangle('selected', 10, 2),
    ])

    expect(visible).toEqual(new Set(['selected']))
  })
})
