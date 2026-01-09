import { useState } from 'react'
import './LoginSection.css'
import { AuthModeSwitch } from './AuthModeSwitch'
import type { AuthMode } from '../lib/types'

interface LoginSectionProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onForgotPassword: (email: string) => Promise<void>
  onError: (message: string) => void
  isLoading: boolean
}

export function LoginSection({ onSignIn, onSignUp, onForgotPassword, onError, isLoading }: LoginSectionProps): JSX.Element {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (!email) {
      return
    }

    if (mode === 'forgot') {
      await onForgotPassword(email)
      return
    }

    if (!password) {
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        onError('Passwords do not match')
        return
      }
      await onSignUp(email, password)
    } else {
      await onSignIn(email, password)
    }
  }

  const handleModeChange = (newMode: AuthMode): void => {
    setMode(newMode)
    setConfirmPassword('')
  }

  // Forgot password view
  if (mode === 'forgot') {
    return (
      <div className="login-section">
        <div className="forgot-password-header">
          <h2>Reset Password</h2>
          <p>Enter your email and we'll send you a link to reset your password.</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => handleModeChange('signin')}
            disabled={isLoading}
          >
            Back to Sign In
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="login-section">
      <AuthModeSwitch mode={mode} onModeChange={handleModeChange} />
      
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="your@email.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Password"
            required
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        {mode === 'signup' && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}
        
        <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        {mode === 'signin' && (
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => handleModeChange('forgot')}
            disabled={isLoading}
          >
            Forgot password?
          </button>
        )}
      </form>
    </div>
  )
}

