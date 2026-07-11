import { useCallback } from 'react'
import { useAppContext } from '../context/AppContext'

export function useTheme() {
  const { state, setState } = useAppContext()

  const toggleTheme = useCallback(() => {
    setState({ darkMode: !state.darkMode })
  }, [state.darkMode, setState])

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setState({ darkMode: theme === 'dark' })
  }, [setState])

  return {
    theme: state.darkMode ? 'dark' : 'light',
    isDark: state.darkMode,
    toggleTheme,
    setTheme
  }
}