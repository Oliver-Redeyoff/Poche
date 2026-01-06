import { createRoot } from 'react-dom/client'
import { App } from './App'
import { colors } from '@poche/shared'
import './popup.css'

// Set CSS variables based on color scheme
function setColorVariables(scheme: 'light' | 'dark') {
  const c = colors[scheme]
  const root = document.documentElement
  
  // Brand
  root.style.setProperty('--color-brand-primary', c.brand.primary)
  root.style.setProperty('--color-brand-primary-light', c.brand.primaryLight)
  root.style.setProperty('--color-brand-primary-dark', c.brand.primaryDark)
  
  // Background
  root.style.setProperty('--color-bg-primary', c.background.primary)
  root.style.setProperty('--color-bg-secondary', c.background.secondary)
  root.style.setProperty('--color-bg-tertiary', c.background.tertiary)
  
  // Text
  root.style.setProperty('--color-text-primary', c.text.primary)
  root.style.setProperty('--color-text-secondary', c.text.secondary)
  root.style.setProperty('--color-text-tertiary', c.text.tertiary)
  root.style.setProperty('--color-text-quaternary', c.text.quaternary)
  
  // Border
  root.style.setProperty('--color-border-primary', c.border.primary)
  root.style.setProperty('--color-border-secondary', c.border.secondary)
  root.style.setProperty('--color-border-focus', c.border.focus)
  
  // Semantic
  root.style.setProperty('--color-success', c.semantic.success)
  root.style.setProperty('--color-success-light', c.semantic.successLight)
  root.style.setProperty('--color-error', c.semantic.error)
  root.style.setProperty('--color-error-light', c.semantic.errorLight)
  root.style.setProperty('--color-warning', c.semantic.warning)
  root.style.setProperty('--color-info', c.semantic.info)
}

// Detect and apply color scheme
function applyColorScheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setColorVariables(isDark ? 'dark' : 'light')
}

// Initial application
applyColorScheme()

// Listen for color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColorScheme)

// Initialize React app
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}
const root = createRoot(container)
root.render(<App />)
