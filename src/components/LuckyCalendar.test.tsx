import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import LuckyCalendar from './LuckyCalendar'
import { buildNatalChart } from '../lib/astrology'
import { regularMonthAt } from '../lib/calendarMonths'
import { scoreDays } from '../lib/luckyDays'

describe('LuckyCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 1, 12))
  })
  afterEach(() => { vi.useRealTimers() })

  it('opens Top Lucky Days by default and collapses it from the heading', () => {
    render(
      <LuckyCalendar
        title="Test Calendar"
        description="Test"
        chart={buildNatalChart('1985-06-15')}
        scoreDays={scoreDays}
        monthAt={regularMonthAt}
      />,
    )

    const heading = screen.getByRole('button', { name: /top lucky days/i })
    expect(heading.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getAllByText(/^Moon in [A-Za-z]+$/)).toHaveLength(5)

    fireEvent.click(heading)
    expect(heading.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryAllByText(/^Moon in [A-Za-z]+$/)).toHaveLength(0)

    fireEvent.click(heading)
    expect(screen.getAllByText(/^Moon in [A-Za-z]+$/)).toHaveLength(5)
  })
})
