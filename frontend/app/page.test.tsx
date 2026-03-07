import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import Home from './page'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    a: ({ children, ...props }: any) => <a {...props}>{children}</a>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hero section', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] })
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('LESNAYA')).toBeInTheDocument()
      expect(screen.getByText('Добро пожаловать в цифровой лес')).toBeInTheDocument()
    })
  })

  it('renders streamers section title', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] })
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('СТРИМЕРЫ ЛЕСНОЙ КОМАНДЫ')).toBeInTheDocument()
    })
  })

  it('renders news section title', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] })
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('НОВОСТИ')).toBeInTheDocument()
    })
  })

  it('shows empty state when no online players', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] })
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Тише Боссы спят....')).toBeInTheDocument()
    })
  })

  it('displays online players when available', async () => {
    const mockPlayers = [
      {
        discord_id: 1,
        discord_username: 'Player1',
        forest_rank: 'Волк',
        is_online: true,
        avatar_url: 'https://example.com/avatar1.jpg',
      },
    ]
    
    mockedAxios.get.mockResolvedValue({ data: mockPlayers })
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Player1')).toBeInTheDocument()
      expect(screen.getByText('Волк')).toBeInTheDocument()
    })
  })

  it('shows error message when API fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'))
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText(/Ошибка загрузки данных/i)).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}))
    
    render(<Home />)
    
    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
