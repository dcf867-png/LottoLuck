import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  it('renders game tabs and lucky stars tab', () => {
    render(<Header activeTab="powerball" onTabChange={() => {}} onAuthClick={() => {}} />)
    expect(screen.getByRole('button', { name: /powerball/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /mega millions/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lucky stars/i })).toBeInTheDocument()
  })

  it('calls onTabChange with megamillions when tab clicked', () => {
    const onChange = vi.fn()
    render(<Header activeTab="powerball" onTabChange={onChange} onAuthClick={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /mega millions/i }))
    expect(onChange).toHaveBeenCalledWith('megamillions')
  })
})
