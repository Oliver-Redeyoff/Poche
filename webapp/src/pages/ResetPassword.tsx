import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

// Backend API URL - update for production
const API_URL = 'http://localhost:3000'

type Status = 'idle' | 'loading' | 'success' | 'error'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  
  const token = searchParams.get('token')
  const error = searchParams.get('error')

  useEffect(() => {
    // Handle error from callback redirect
    if (error === 'INVALID_TOKEN') {
      setStatus('error')
      setErrorMessage('This password reset link is invalid or has expired. Please request a new one.')
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setStatus('error')
      setErrorMessage('Missing reset token. Please use the link from your email.')
      return
    }

    if (password.length < 8) {
      setStatus('error')
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMessage('Passwords do not match.')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to reset password')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-logo">
            <img src="/logo.png" alt="Poche" />
            <span>Poche</span>
          </div>
          
          <div className="reset-password-success">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1>Password Reset!</h1>
            <p>Your password has been successfully updated. You can now sign in with your new password.</p>
            <a href="/" className="btn btn-primary">
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Error state (no token or invalid token)
  if (!token || error === 'INVALID_TOKEN') {
    return (
      <div className="reset-password-page">
        <div className="reset-password-container">
          <div className="reset-password-logo">
            <img src="/logo.png" alt="Poche" />
            <span>Poche</span>
          </div>
          
          <div className="reset-password-error">
            <div className="error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1>Invalid Reset Link</h1>
            <p>{errorMessage || 'This password reset link is invalid or has expired. Please request a new one from the app or browser extension.'}</p>
            <a href="/" className="btn btn-primary">
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Form state
  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-logo">
          <img src="/logo.png" alt="Poche" />
          <span>Poche</span>
        </div>
        
        <div className="reset-password-header">
          <h1>Create New Password</h1>
          <p>Enter your new password below. Make sure it's at least 8 characters long.</p>
        </div>

        <form onSubmit={handleSubmit} className="reset-password-form">
          {status === 'error' && errorMessage && (
            <div className="form-error">
              {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">New Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
              disabled={status === 'loading'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              minLength={8}
              disabled={status === 'loading'}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="reset-password-footer">
          <a href="/">← Back to Homepage</a>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

