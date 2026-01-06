import './AuthModeSwitch.css'
import type { AuthMode } from '../lib/types'

interface AuthModeSwitchProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
}

export function AuthModeSwitch({ mode, onModeChange }: AuthModeSwitchProps): JSX.Element {
  return (
    <div className="auth-mode-switch">
      <button 
        type="button"
        className={`auth-mode-option ${mode === 'signin' ? 'active' : ''}`}
        onClick={() => onModeChange('signin')}
      >
        Sign In
      </button>
      <button 
        type="button"
        className={`auth-mode-option ${mode === 'signup' ? 'active' : ''}`}
        onClick={() => onModeChange('signup')}
      >
        Sign Up
      </button>
    </div>
  )
}

