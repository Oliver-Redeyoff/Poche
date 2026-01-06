import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { colors } from '@poche/shared'
import './index.css'

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
  
  // Accent
  root.style.setProperty('--color-accent-terracotta', c.accent.terracotta)
  root.style.setProperty('--color-accent-sand', c.accent.sand)
  root.style.setProperty('--color-accent-sage', c.accent.sage)
  
  // Semantic
  root.style.setProperty('--color-success', c.semantic.success)
  root.style.setProperty('--color-success-light', c.semantic.successLight)
  root.style.setProperty('--color-error', c.semantic.error)
  root.style.setProperty('--color-error-light', c.semantic.errorLight)
  root.style.setProperty('--color-warning', c.semantic.warning)
  root.style.setProperty('--color-warning-light', c.semantic.warningLight)
  root.style.setProperty('--color-info', c.semantic.info)
  root.style.setProperty('--color-info-light', c.semantic.infoLight)
}

// Detect and apply color scheme
function applyColorScheme() {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setColorVariables(isDark ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

// Initial application
applyColorScheme()

// Listen for color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColorScheme)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
