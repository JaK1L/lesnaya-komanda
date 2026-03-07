import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from './ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders error icon', () => {
    render(<ErrorMessage message="Error" />)
    // Lucide icons render as SVG
    const container = screen.getByText('Error').parentElement
    expect(container?.querySelector('svg')).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const handleRetry = vi.fn()
    render(<ErrorMessage message="Error" onRetry={handleRetry} />)
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" />)
    expect(screen.queryByText('Попробовать снова')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const handleRetry = vi.fn()
    const user = userEvent.setup()
    
    render(<ErrorMessage message="Error" onRetry={handleRetry} />)
    await user.click(screen.getByText('Попробовать снова'))
    
    expect(handleRetry).toHaveBeenCalledOnce()
  })

  it('applies custom className', () => {
    render(<ErrorMessage message="Error" className="custom-error" />)
    const container = screen.getByText('Error').closest('.custom-error')
    expect(container).toBeInTheDocument()
  })
})
