import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Loading } from './Loading'

describe('Loading', () => {
  it('renders loading icon', () => {
    const { container } = render(<Loading />)
    // TreePine icon renders as SVG
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders with medium size by default', () => {
    const { container } = render(<Loading />)
    expect(container.querySelector('.medium')).toBeInTheDocument()
  })

  it('renders with small size', () => {
    const { container } = render(<Loading size="small" />)
    expect(container.querySelector('.small')).toBeInTheDocument()
  })

  it('renders with large size', () => {
    const { container } = render(<Loading size="large" />)
    expect(container.querySelector('.large')).toBeInTheDocument()
  })

  it('renders text when provided', () => {
    render(<Loading text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('does not render text when not provided', () => {
    const { container } = render(<Loading />)
    expect(container.querySelector('p')).not.toBeInTheDocument()
  })
})
