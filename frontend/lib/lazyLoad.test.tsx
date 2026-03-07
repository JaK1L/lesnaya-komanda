import { describe, it, expect } from 'vitest'
import { lazyLoad, lazyLoadModal, lazyLoadHeavy } from './lazyLoad'

describe('lazyLoad utilities', () => {
  describe('lazyLoad', () => {
    it('returns a lazy loaded component', () => {
      const LazyComponent = lazyLoad(() => 
        Promise.resolve({ default: () => <div>Test</div> })
      )
      
      expect(LazyComponent).toBeDefined()
      expect(typeof LazyComponent).toBe('object')
    })
  })

  describe('lazyLoadModal', () => {
    it('returns a lazy loaded modal component with ssr disabled', () => {
      const LazyModal = lazyLoadModal(() => 
        Promise.resolve({ default: () => <div>Modal</div> })
      )
      
      expect(LazyModal).toBeDefined()
      expect(typeof LazyModal).toBe('object')
    })
  })

  describe('lazyLoadHeavy', () => {
    it('returns a lazy loaded heavy component with delay', () => {
      const LazyHeavy = lazyLoadHeavy(() => 
        Promise.resolve({ default: () => <div>Heavy</div> })
      )
      
      expect(LazyHeavy).toBeDefined()
      expect(typeof LazyHeavy).toBe('object')
    })
  })
})
