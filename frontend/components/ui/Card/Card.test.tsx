import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies clickable class when onClick is provided', () => {
    const handleClick = vi.fn()
    render(<Card onClick={handleClick}>Clickable</Card>)
    expect(screen.getByText('Clickable')).toHaveClass('clickable')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Card onClick={handleClick}>Click me</Card>)
    await user.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('applies variant classes', () => {
    const { rerender } = render(<Card variant="bordered">Bordered</Card>)
    expect(screen.getByText('Bordered')).toHaveClass('bordered')
    
    rerender(<Card variant="elevated">Elevated</Card>)
    expect(screen.getByText('Elevated')).toHaveClass('elevated')
  })

  it('applies custom className', () => {
    render(<Card className="custom-class">Custom</Card>)
    expect(screen.getByText('Custom')).toHaveClass('custom-class')
  })

  it('renders complex children', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
      </Card>
    )
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })
})
