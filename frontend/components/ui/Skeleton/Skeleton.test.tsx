import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders single skeleton by default', () => {
    const { container } = render(<Skeleton />)
    const skeletons = container.querySelectorAll('.skeleton')
    expect(skeletons).toHaveLength(1)
  })

  it('renders multiple skeletons when count is provided', () => {
    const { container } = render(<Skeleton count={3} />)
    const skeletons = container.querySelectorAll('.skeleton')
    expect(skeletons).toHaveLength(3)
  })

  it('applies custom width', () => {
    const { container } = render(<Skeleton width="200px" />)
    const skeleton = container.querySelector('.skeleton')
    expect(skeleton).toHaveStyle({ width: '200px' })
  })

  it('applies custom height', () => {
    const { container } = render(<Skeleton height="50px" />)
    const skeleton = container.querySelector('.skeleton')
    expect(skeleton).toHaveStyle({ height: '50px' })
  })

  it('applies both width and height', () => {
    const { container } = render(<Skeleton width="100px" height="30px" />)
    const skeleton = container.querySelector('.skeleton')
    expect(skeleton).toHaveStyle({ width: '100px', height: '30px' })
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-skeleton" />)
    expect(container.querySelector('.custom-skeleton')).toBeInTheDocument()
  })
})
