import './AuthModeSwitch.css'

type AuthMode = 'signin' | 'signup'

interface AuthModeSwitchProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  disabled?: boolean
}

export default function AuthModeSwitch({ mode, onModeChange, disabled }: AuthModeSwitchProps) {
  return (
    <div className="auth-mode-switch">
      <button 
        type="button"
        className={`auth-mode-option ${mode === 'signin' ? 'active' : ''}`}
        onClick={() => onModeChange('signin')}
        disabled={disabled}
      >
        Sign In
      </button>
      <button 
        type="button"
        className={`auth-mode-option ${mode === 'signup' ? 'active' : ''}`}
        onClick={() => onModeChange('signup')}
        disabled={disabled}
      >
        Sign Up
      </button>
    </div>
  )
}

