import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'
import { useAuth } from '../../contexts/AuthContext'
import Logo from '../../components/Logo'

type AuthMode = 'signin' | 'signup' | 'forgot'

export default function Auth() {
  const navigate = useNavigate()
  const { signIn, signUp, forgotPassword } = useAuth()
  
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'forgot') {
        await forgotPassword(email)
        setForgotPasswordSent(true)
      } else if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters')
          setIsLoading(false)
          return
        }
        await signUp(email, password, name || undefined)
        navigate('/app')
      } else {
        await signIn(email, password)
        navigate('/app')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
    setForgotPasswordSent(false)
  }

  if (forgotPasswordSent) {
    return (
      <div className="app-auth-page">
        <div className="app-auth-container">
          <Logo />
          
          <div className="app-auth-success">
            <div className="success-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h1>Check Your Email</h1>
            <p>
              If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
            </p>
            <button 
              className="btn btn-secondary"
              onClick={() => switchMode('signin')}
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-auth-page">
      <div className="app-auth-container">
        <div className='app-auth-logo-container'>
          <Logo />
        </div>

        {/* <div className="app-auth-header">
          <h1>
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p>
            {mode === 'signin' && 'Sign in to access your saved articles'}
            {mode === 'signup' && 'Start saving articles to read later'}
            {mode === 'forgot' && "Enter your email and we'll send you a reset link"}
          </p>
        </div> */}

        <form className="app-auth-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="name">Name (optional)</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-full"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : (
              mode === 'signin' ? 'Sign In' :
              mode === 'signup' ? 'Create Account' :
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="app-auth-footer">
          {mode === 'signin' && (
            <>
              <p>
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')}>Sign up</button>
              </p>
              <p>
                <button onClick={() => switchMode('forgot')}>Forgot password?</button>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button onClick={() => switchMode('signin')}>Sign in</button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              Remember your password?{' '}
              <button onClick={() => switchMode('signin')}>Sign in</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

