import { useState, useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import Layout from './components/Layout'
import Chat from './components/Chat'
import './App.css'

/**
 * Root App component.
 * Manages dark mode (persisted in localStorage) and renders the
 * full InternFinder shell with sidebar, header, and chat area.
 */
export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem('internfinder_theme') === 'dark'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('internfinder_theme', darkMode ? 'dark' : 'light')
    } catch {
      // ignore
    }
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode((prev) => !prev)

  return (
    <div className="app-root">
      {/* Dark mode toggle button in top-right corner */}
      <button
        className="app-theme-toggle"
        onClick={toggleDarkMode}
        aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        type="button"
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <Layout title="InternFinder">
        <Chat />
      </Layout>
    </div>
  )
}
