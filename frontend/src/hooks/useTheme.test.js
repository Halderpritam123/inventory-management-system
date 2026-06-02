/**
 * Unit tests for the useTheme hook.
 * Validates: Requirements 7.3, 7.4, 7.5
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

// Mock matchMedia before each test
const mockMatchMedia = (matches) => {
  const listeners = []
  return {
    matches,
    addEventListener: (event, handler) => listeners.push(handler),
    removeEventListener: (event, handler) => {
      const idx = listeners.indexOf(handler)
      if (idx > -1) listeners.splice(idx, 1)
    },
  }
}

beforeEach(() => {
  // Clear localStorage and DOM classes before each test
  localStorage.clear()
  document.documentElement.classList.remove('dark')

  // Default: no dark preference
  window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(false))
})

describe('useTheme', () => {
  it('reads theme from localStorage on mount', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('reads light theme from localStorage', () => {
    localStorage.setItem('theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('defaults to system when no localStorage value', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
  })

  it('falls back to system preference when no stored value (dark OS)', () => {
    window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(true))
    const { result } = renderHook(() => useTheme())
    // Theme state is 'system', and dark class should be applied
    expect(result.current.theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('falls back to light when OS prefers light and no stored value', () => {
    window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(false))
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('calling setTheme("dark") adds dark class to documentElement', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(result.current.theme).toBe('dark')
  })

  it('calling setTheme("light") removes dark class from documentElement', () => {
    document.documentElement.classList.add('dark')
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(result.current.theme).toBe('light')
  })

  it('setTheme persists value to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('setTheme("system") applies OS preference', () => {
    window.matchMedia = vi.fn().mockReturnValue(mockMatchMedia(true))
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('system')
    })
    expect(result.current.theme).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
