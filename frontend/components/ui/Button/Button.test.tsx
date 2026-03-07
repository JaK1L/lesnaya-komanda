import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click</Button>)
    await user.click(screen.getByText('Click'))
    
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByText('Primary')).toHaveClass('primary')
    
    rerender(<Button variant="secondary">Secondary</Button>)
    expect(screen.getByText('Secondary')).toHaveClass('secondary')
  })

  it('applies size classes', () => {
    const { rerender } = render(<Button size="small">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('small')
    
    rerender(<Button size="large">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('large')
  })

  it('renders as link when href is provided', () => {
    render(<Button href="/test">Link</Button>)
    const link = screen.getByText('Link')
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick} disabled>Disabled</Button>)
    await user.click(screen.getByText('Disabled'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        Text
      </Button>
    )
    expect(screen.getByText('Icon')).toBeInTheDocument()
    expect(screen.getByText('Text')).toBeInTheDocument()
  })
})
