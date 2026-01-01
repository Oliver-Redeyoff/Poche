import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import * as api from './lib/api'
import { tagToColor } from '../shared/util'

// Declare browser for Firefox compatibility
declare const browser: typeof chrome

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : browser

// Type definitions
interface SavedArticles {
  urls: string[]
  ids: number[]
}

type StatusType = 'info' | 'success' | 'error'

interface StatusMessageProps {
  message: string
  type: StatusType
}

type AuthMode = 'signin' | 'signup'

interface LoginSectionProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onError: (message: string) => void
  isLoading: boolean
}

interface MainSectionProps {
  userEmail: string
  onLogout: () => Promise<void>
  onSaveArticle: () => Promise<void>
  saveButtonDisabled: boolean
  saveButtonText: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
}

// Storage key for saved articles (per user)
function getSavedArticlesStorageKey(userId: string): string {
  return `poche_saved_articles_${userId}`
}

// Get saved articles from storage
async function getSavedArticles(userId: string): Promise<SavedArticles> {
  try {
    const storageKey = getSavedArticlesStorageKey(userId)
    const result = await browserAPI.storage.local.get(storageKey)
    return result[storageKey] || { urls: [], ids: [] }
  } catch (error) {
    console.error('Error getting saved articles:', error)
    return { urls: [], ids: [] }
  }
}

// Save article URL and ID to storage
async function saveArticleToStorage(userId: string, articleId: number, url: string): Promise<void> {
  try {
    const storageKey = getSavedArticlesStorageKey(userId)
    const saved = await getSavedArticles(userId)
    
    if (url && !saved.urls.includes(url)) {
      saved.urls.push(url)
    }
    if (articleId && !saved.ids.includes(articleId)) {
      saved.ids.push(articleId)
    }
    
    await browserAPI.storage.local.set({ [storageKey]: saved })
  } catch (error) {
    console.error('Error saving article to storage:', error)
  }
}

// Sync saved articles from backend
async function syncSavedArticlesFromBackend(userId: string): Promise<void> {
  try {
    const articles = await api.getArticles()
    
    const urls = articles
      .map(article => article.url)
      .filter((url): url is string => url !== null)
    const ids = articles.map(article => article.id)
    
    const storageKey = getSavedArticlesStorageKey(userId)
    await browserAPI.storage.local.set({ [storageKey]: { urls, ids } })
    
    console.log(`Synced ${urls.length} article(s) from backend`)
  } catch (error) {
    console.error('Error syncing articles:', error)
  }
}

// Check if current URL is already saved
async function checkIfUrlIsSaved(userId: string, url: string): Promise<boolean> {
  try {
    const saved = await getSavedArticles(userId)
    return saved.urls.includes(url)
  } catch (error) {
    console.error('Error checking if URL is saved:', error)
    return false
  }
}

function Header(): JSX.Element {
  return (
    <div className="header">
      <img src="assets/icon.png" alt="poche" className="logo" />
      <div className="header-right">
        <h1>poche</h1>
        <p className="subtitle">Read it Later</p>
      </div>
    </div>
  )
}

function StatusMessage({ message, type }: StatusMessageProps): JSX.Element | null {
  if (!message) return null
  
  return (
    <div className={`status ${type}`} style={{ opacity: message ? '1' : '0' }}>
      {message}
    </div>
  )
}

function LoadingSection(): JSX.Element {
  return (
    <div className="section loading-section">
      <div className="loading-spinner"></div>
    </div>
  )
}

function AuthModeSwitch({ mode, onModeChange }: { mode: AuthMode, onModeChange: (mode: AuthMode) => void }): JSX.Element {
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

function LoginSection({ onSignIn, onSignUp, onError, isLoading }: LoginSectionProps): JSX.Element {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    if (!email || !password) {
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

  const handleForgotPassword = (): void => {
    // TODO: Implement forgot password functionality
    console.log('Forgot password clicked')
  }

  const handleModeChange = (newMode: AuthMode): void => {
    setMode(newMode)
    setConfirmPassword('')
  }

  return (
    <div className="section">
      <AuthModeSwitch mode={mode} onModeChange={handleModeChange} />
      
      <form className="form" onSubmit={handleSubmit}>
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

        {mode === 'signin' && (
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={handleForgotPassword}
            disabled={isLoading}
          >
            Forgot password?
          </button>
        )}
        
        <button type="submit" className="btn btn-primary btn-full" disabled={isLoading}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
      </form>
    </div>
  )
}

function MainSection({ 
  userEmail, 
  onLogout, 
  onSaveArticle, 
  saveButtonDisabled, 
  saveButtonText, 
  tags, 
  onTagsChange 
}: MainSectionProps): JSX.Element {
  return (
    <div className="section">
      <TagsInput tags={tags} onTagsChange={onTagsChange} />

      <button
        className="btn btn-primary btn-large"
        onClick={onSaveArticle}
        disabled={saveButtonDisabled}
      >
        {saveButtonText}
      </button>

      <div className="user-info">
        <p>Logged in as <strong>{userEmail}</strong></p>
        <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
      </div>
    </div>
  )
}

type TagsInputProps = {
  tags: string[]
  onTagsChange: (tags: string[]) => void
}

function TagsInput({ tags, onTagsChange }: TagsInputProps): JSX.Element {
  return (
    <div className="form-group">
      <div className="tags-input-container">
        <div className="tag-icon">
          <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.0498 7.0498H7.0598M10.5118 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V10.5118C3 11.2455 3 11.6124 3.08289 11.9577C3.15638 12.2638 3.27759 12.5564 3.44208 12.8249C3.6276 13.1276 3.88703 13.387 4.40589 13.9059L9.10589 18.6059C10.2939 19.7939 10.888 20.388 11.5729 20.6105C12.1755 20.8063 12.8245 20.8063 13.4271 20.6105C14.112 20.388 14.7061 19.7939 15.8941 18.6059L18.6059 15.8941C19.7939 14.7061 20.388 14.112 20.6105 13.4271C20.8063 12.8245 20.8063 12.1755 20.6105 11.5729C20.388 10.888 19.7939 10.2939 18.6059 9.10589L13.9059 4.40589C13.387 3.88703 13.1276 3.6276 12.8249 3.44208C12.5564 3.27759 12.2638 3.15638 11.9577 3.08289C11.6124 3 11.2455 3 10.5118 3ZM7.5498 7.0498C7.5498 7.32595 7.32595 7.5498 7.0498 7.5498C6.77366 7.5498 6.5498 7.32595 6.5498 7.0498C6.5498 6.77366 6.77366 6.5498 7.0498 6.5498C7.32595 6.5498 7.5498 6.77366 7.5498 7.0498Z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {tags.length > 0 && (
          <div className="tag-list">
            {tags.map((tag: string) => (
              <div 
                key={tag} 
                className="tag" 
                style={{ 
                  backgroundColor: tagToColor(tag, 0.2), 
                  color: tagToColor(tag, 1.0) 
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        <input
            type="text"
            id="tagsInput"
            name="tags"
            placeholder={tags.length > 0 ? "" : "e.g. tech, news, sports"}
            autoComplete="off"
            onBlur={(e) => {
              if ((e.target as HTMLInputElement).value.trim() !== '') {
                onTagsChange([...tags, (e.target as HTMLInputElement).value.trim()]);
              }
              (e.target as HTMLInputElement).value = '';
            }}
            onKeyDown={(e) => {
              if ((e.target as HTMLInputElement).value.trim() !== '' && (e.key === 'Enter' || e.key === ',' || e.key === ' ')) {
                onTagsChange([...tags, (e.target as HTMLInputElement).value.trim()]);
                (e.target as HTMLInputElement).value = '';
                e.preventDefault()
              } else if (e.key === 'Backspace' && (e.target as HTMLInputElement).value === '') {
                onTagsChange(tags.slice(0, -1));
              }
            }}
          />
      </div>
    </div>
  )
}

function App(): JSX.Element {
  const [session, setSession] = useState<api.Session | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusType, setStatusType] = useState<StatusType>('info')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [saveButtonDisabled, setSaveButtonDisabled] = useState<boolean>(false)
  const [saveButtonText, setSaveButtonText] = useState<string>('Save Article')
  const [tags, setTags] = useState<string[]>([])

  // Update save button state based on current URL
  const updateSaveButtonState = async (): Promise<void> => {
    if (!session?.user) return

    try {
      // Sync articles from backend
      await syncSavedArticlesFromBackend(session.user.id)
      
      // Get current tab URL
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]
      
      if (!tab || !tab.url) {
        setSaveButtonDisabled(true)
        setSaveButtonText('Save Article')
        return
      }
      
      // Check if we can save from this page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('moz-extension://') || tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://') || tab.url.startsWith('opera://')) {
        setSaveButtonDisabled(true)
        setSaveButtonText('Cannot Save This Page')
        return
      }
      
      // Check if URL is already saved
      const isSaved = await checkIfUrlIsSaved(session.user.id, tab.url)
      
      if (isSaved) {
        setSaveButtonDisabled(true)
        setSaveButtonText('Already Saved')
      } else {
        setSaveButtonDisabled(false)
        setSaveButtonText('Save Article')
      }
    } catch (error) {
      console.error('Error updating save button state:', error)
      setSaveButtonDisabled(false)
      setSaveButtonText('Save Article')
    }
  }

  const showStatus = (message: string, type: StatusType = 'info'): void => {
    setStatusMessage(message)
    setStatusType(type)
    
    // Auto-hide after 2.5 seconds
      setTimeout(() => {
        setStatusMessage('')
      }, 2500)
  }

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const currentSession = await api.getSession()
      
      if (currentSession?.user) {
        setSession(currentSession)
        await updateSaveButtonState()
      } else {
        setSession(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setSession(null)
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      showStatus('Signing in...', 'info')
      setIsLoading(true)
      
      const sessionData = await api.signIn(email, password)
      
      setSession(sessionData)
        showStatus('Signed in successfully!', 'success')
        await updateSaveButtonState()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      showStatus(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string): Promise<void> => {
    try {
      showStatus('Creating account...', 'info')
      setIsLoading(true)
      
      const sessionData = await api.signUp(email, password)
      
      setSession(sessionData)
      showStatus('Account created and signed in!', 'success')
      await updateSaveButtonState()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      showStatus(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCurrentArticle = async (): Promise<void> => {
    if (!session?.user) {
      showStatus('Not authenticated. Please log in.', 'error')
      return
    }

    try {
      setSaveButtonDisabled(true)
      showStatus('Saving article...', 'info')
      
      // Get current tab URL
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]
      
      if (!tab || !tab.url) {
        throw new Error('Could not get current tab URL')
      }
      
      // Check if we can save from this page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('moz-extension://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot save articles from browser internal pages.')
      }
      
      // Process tags
      const tagsString = tags.length > 0 ? tags.join(',') : undefined
      
      // Save article - backend will fetch and extract content!
      const article = await api.saveArticle(tab.url, tagsString)
      
      // Save to local storage for quick "already saved" checks
      await saveArticleToStorage(session.user.id, article.id, tab.url)
      
      // Clear tags and update button state
      setTags([])
      await updateSaveButtonState()
      
      showStatus('Article saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving article:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save article'
      showStatus(`Error: ${errorMessage}`, 'error')
      await updateSaveButtonState()
    }
  }

  const handleLogout = async (): Promise<void> => {
    try {
      await api.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
    setSession(null)
    setTags([])
    showStatus('Logged out successfully', 'success')
  }

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Update save button state when session changes
  useEffect(() => {
    if (session?.user) {
      updateSaveButtonState()
    }
  }, [session])

  return (
    <>
      <Header />
      <StatusMessage message={statusMessage} type={statusType} />
      {isCheckingAuth ? (
        <LoadingSection />
      ) : session?.user ? (
        <MainSection
          userEmail={session.user.email || ''}
          onLogout={handleLogout}
          onSaveArticle={saveCurrentArticle}
          saveButtonDisabled={saveButtonDisabled}
          saveButtonText={saveButtonText}
          tags={tags}
          onTagsChange={setTags}
        />
      ) : (
        <LoginSection
          onSignIn={signIn}
          onSignUp={signUp}
          onError={(message) => showStatus(message, 'error')}
          isLoading={isLoading}
        />
      )}
    </>
  )
}

// Initialize React app
const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}
const root = createRoot(container)
root.render(<App />)
