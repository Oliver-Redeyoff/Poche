import { useState, useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
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

interface ParsedArticle {
  title?: string | null
  content?: string | null
  excerpt?: string | null
  length?: number | null
  siteName?: string | null
  url?: string | null
  publishedTime?: string | null
  byline?: string | null
}

interface PingResponse {
  success?: boolean
  ready?: boolean
  readabilityLoaded?: boolean
}

interface ParseResponse {
  success: boolean
  article?: ParsedArticle
  error?: string
}

type StatusType = 'info' | 'success' | 'error'

interface StatusMessageProps {
  message: string
  type: StatusType
}

interface LoginSectionProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
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
    
    // Add URL and ID if not already present
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

// Sync saved articles from Supabase on login
async function syncSavedArticlesFromSupabase(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, url')
      .eq('user_id', userId)
      .not('url', 'is', null)
    
    if (error) {
      console.error('Error syncing articles from Supabase:', error)
      return
    }
    
    // Always replace the stored list, even if empty (handles deletions)
    const urls = data && data.length > 0 
      ? data.map((article: { url: string | null }) => article.url).filter(Boolean) as string[]
      : []
    const ids = data && data.length > 0
      ? data.map((article: { id: number }) => article.id).filter(Boolean) as number[]
      : []
    
    const storageKey = getSavedArticlesStorageKey(userId)
    await browserAPI.storage.local.set({ [storageKey]: { urls, ids } })
    
    console.log(`Synced ${urls.length} article(s) from Supabase`)
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

function LoginSection({ onSignIn, onSignUp, isLoading }: LoginSectionProps): JSX.Element {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    if (!email || !password) {
      return
    }
    await onSignIn(email, password)
  }

  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault()
    if (!email || !password) {
      return
    }
    await onSignUp(email, password)
  }

  return (
    <div className="section">
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="button-group" style={{ marginTop: '8px' }}>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            Sign In
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleSignUp} disabled={isLoading}>
            Sign Up
          </button>
        </div>
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
            <path d="M7.0498 7.0498H7.0598M10.5118 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V10.5118C3 11.2455 3 11.6124 3.08289 11.9577C3.15638 12.2638 3.27759 12.5564 3.44208 12.8249C3.6276 13.1276 3.88703 13.387 4.40589 13.9059L9.10589 18.6059C10.2939 19.7939 10.888 20.388 11.5729 20.6105C12.1755 20.8063 12.8245 20.8063 13.4271 20.6105C14.112 20.388 14.7061 19.7939 15.8941 18.6059L18.6059 15.8941C19.7939 14.7061 20.388 14.112 20.6105 13.4271C20.8063 12.8245 20.8063 12.1755 20.6105 11.5729C20.388 10.888 19.7939 10.2939 18.6059 9.10589L13.9059 4.40589C13.387 3.88703 13.1276 3.6276 12.8249 3.44208C12.5564 3.27759 12.2638 3.15638 11.9577 3.08289C11.6124 3 11.2455 3 10.5118 3ZM7.5498 7.0498C7.5498 7.32595 7.32595 7.5498 7.0498 7.5498C6.77366 7.5498 6.5498 7.32595 6.5498 7.0498C6.5498 6.77366 6.77366 6.5498 7.0498 6.5498C7.32595 6.5498 7.5498 6.77366 7.5498 7.0498Z" stroke-linecap="round" stroke-linejoin="round"/>
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                onTagsChange([...tags, (e.target as HTMLInputElement).value]);
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
  const [session, setSession] = useState<Session | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusType, setStatusType] = useState<StatusType>('info')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [saveButtonDisabled, setSaveButtonDisabled] = useState<boolean>(false)
  const [saveButtonText, setSaveButtonText] = useState<string>('Save Article')
  const [tags, setTags] = useState<string[]>([])
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Update save button state based on current URL
  const updateSaveButtonState = async (): Promise<void> => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession || !currentSession.user) {
        return
      }
      
      // Sync articles from Supabase to ensure we have the latest list (including deletions)
      await syncSavedArticlesFromSupabase(currentSession.user.id)
      
      // Get current tab URL
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]
      
      if (!tab || !tab.url) {
        setSaveButtonDisabled(true)
        setSaveButtonText('Save Article')
        return
      }
      
      // Check if we can save from this page (not browser internal pages)
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('moz-extension://') || tab.url.startsWith('about:') ||
          tab.url.startsWith('edge://') || tab.url.startsWith('opera://')) {
        setSaveButtonDisabled(true)
        setSaveButtonText('Cannot Save This Page')
        return
      }
      
      // Check if URL is already saved
      const isSaved = await checkIfUrlIsSaved(currentSession.user.id, tab.url)
      
      if (isSaved) {
        setSaveButtonDisabled(true)
        setSaveButtonText('Already Saved')
      } else {
        setSaveButtonDisabled(false)
        setSaveButtonText('Save Article')
      }
    } catch (error) {
      console.error('Error updating save button state:', error)
      // On error, enable the button to allow manual save
      setSaveButtonDisabled(false)
      setSaveButtonText('Save Article')
    }
  }

  const showStatus = (message: string, type: StatusType = 'info'): void => {
    setStatusMessage(message)
    setStatusType(type)
    
    // Auto-hide after 2.5 seconds for success/info
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        setStatusMessage('')
      }, 2500)
    }
  }

  const checkAuthStatus = async (): Promise<void> => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession && currentSession.user) {
        // Try to refresh the session to ensure it's still valid
        try {
          const { error: refreshError } = await supabase.auth.refreshSession(currentSession)
          
          if (refreshError) {
            // Refresh token expired - user needs to sign in again
            if (refreshError.message?.includes('refresh_token_not_found') || 
                refreshError.message?.includes('token_expired') ||
                refreshError.message?.includes('Invalid Refresh Token')) {
              console.log('Session expired - user needs to sign in again')
              setSession(null)
              return
            }
          }
          
          // Session is valid
          setSession(currentSession)
          // Sync saved articles and update button state
          await syncSavedArticlesFromSupabase(currentSession.user.id)
          await updateSaveButtonState()
        } catch (error) {
          // If refresh fails, check if we still have a valid session
          const { data: { session: validSession } } = await supabase.auth.getSession()
          if (validSession && validSession.user) {
            setSession(validSession)
            await syncSavedArticlesFromSupabase(validSession.user.id)
            await updateSaveButtonState()
          } else {
            setSession(null)
          }
        }
      } else {
        setSession(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setSession(null)
    }
  }

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      showStatus('Signing in...', 'info')
      setIsLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.session && data.user) {
        setSession(data.session)
        showStatus('Signed in successfully!', 'success')
        // Sync saved articles and update button state
        await syncSavedArticlesFromSupabase(data.user.id)
        await updateSaveButtonState()
      }
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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      if (data.session && data.user) {
        setSession(data.session)
        showStatus('Account created and signed in!', 'success')
        // Sync saved articles and update button state
        await syncSavedArticlesFromSupabase(data.user.id)
        await updateSaveButtonState()
      } else {
        showStatus('Please check your email to verify your account', 'info')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      showStatus(errorMessage, 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const saveCurrentArticle = async (): Promise<void> => {
    try {
      showStatus('Parsing article...', 'info')
      setSaveButtonDisabled(true)
      
      // Get current tab
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]
      
      if (!tab) {
        throw new Error('Could not get current tab')
      }
      
      // Check if we can inject scripts on this page
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
          tab.url.startsWith('moz-extension://') || tab.url.startsWith('about:'))) {
        throw new Error('Cannot save articles from browser internal pages. Please navigate to a regular webpage.')
      }
      
      // First, try to ping the content script (it should be injected via manifest)
      let pingResponse: PingResponse | undefined
      let needsInjection = false
      
      try {
        pingResponse = await Promise.race([
          browserAPI.tabs.sendMessage(tab.id!, { action: 'ping' }) as Promise<PingResponse>,
          new Promise<PingResponse>((_, reject) => 
            setTimeout(() => reject(new Error('Ping timeout')), 2000)
          )
        ])
        
        if (!pingResponse || !pingResponse.ready) {
          needsInjection = true
        } else if (!pingResponse.readabilityLoaded) {
          throw new Error('Readability library failed to load in content script')
        }
      } catch (pingError) {
        // Content script not available, need to inject it
        needsInjection = true
      }
      
      // If content script is not available, inject it manually
      if (needsInjection) {
        try {
          if (browserAPI.scripting && browserAPI.scripting.executeScript) {
            // Chrome/Edge (Manifest V3)
            await browserAPI.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ['content.js']
            })
          } else if (browserAPI.tabs && (browserAPI.tabs as any).executeScript) {
            // Firefox (Manifest V2 fallback)
            await (browserAPI.tabs as any).executeScript(tab.id!, { file: 'content.js' })
          } else {
            throw new Error('Script injection API not available. Make sure the extension has scripting permission.')
          }
          
          // Wait for script to initialize
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Verify it's ready now
          try {
            pingResponse = await Promise.race([
              browserAPI.tabs.sendMessage(tab.id!, { action: 'ping' }) as Promise<PingResponse>,
              new Promise<PingResponse>((_, reject) => 
                setTimeout(() => reject(new Error('Ping timeout after injection')), 3000)
              )
            ])
            
            if (!pingResponse || !pingResponse.ready) {
              throw new Error('Content script injected but not responding')
            }
            
            if (!pingResponse.readabilityLoaded) {
              throw new Error('Readability library failed to load in content script')
            }
          } catch (verifyError) {
            const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
            throw new Error(`Content script injected but not ready: ${errorMessage}`)
          }
        } catch (injectError) {
          const errorMessage = injectError instanceof Error ? injectError.message : 'Unknown error'
          throw new Error(`Cannot inject content script: ${errorMessage}`)
        }
      }
      
      // Now send the actual parse request
      let response: ParseResponse
      try {
        response = await Promise.race([
          browserAPI.tabs.sendMessage(tab.id!, { action: 'parseArticle' }) as Promise<ParseResponse>,
          new Promise<ParseResponse>((_, reject) => 
            setTimeout(() => reject(new Error('Parse timeout after 10 seconds')), 10000)
          )
        ])
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Failed to parse article: ${errorMessage}`)
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to parse article')
      }
      
      const article = response.article
      if (!article) {
        throw new Error('No article data received')
      }
      
      // Get current user session
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (!currentSession || !currentSession.user) {
        throw new Error('Not authenticated. Please log in.')
      }
      
      showStatus('Saving article...', 'info')
      
      // Process tags: split by comma, trim whitespace, filter empty strings, join with commas
      let tagsString: string | null = null
      if (tags.length > 0) {
        tagsString = tags.join(',')
      }

      // if (tags && tags.trim()) {
      //   const tagArray = tags
      //     .split(',')
      //     .map(tag => tag.trim())
      //     .filter(tag => tag.length > 0)
        
      //   if (tagArray.length > 0) {
      //     tagsString = tagArray.join(',')
      //   }
      // }
      
      // Save to Supabase
      const { data, error: supabaseError } = await supabase
        .from('articles')
        .insert({
          user_id: currentSession.user.id,
          excerpt: article.excerpt || null,
          length: article.length || null,
          siteName: article.siteName || null,
          title: article.title || null,
          url: article.url || null,
          content: article.content || null,
          tags: tagsString || null,
        })
        .select()
        .single()
      
      if (supabaseError) {
        const errorMsg = supabaseError.message || supabaseError.details || supabaseError.hint || 'Database error'
        throw new Error(`Failed to save to database: ${errorMsg}`)
      }
      
      // Save article URL and ID to local storage
      if (data && data.id && article.url) {
        await saveArticleToStorage(currentSession.user.id, data.id, article.url)
      }
      
      // Update button state after saving
      await updateSaveButtonState()
      
      // Clear tags input after successful save
      setTags([])
      
      showStatus('Article saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving article:', error)
      
      // Extract error message properly
      let errorMessage = 'Failed to save article'
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error
        } else if (error instanceof Error) {
          errorMessage = error.message
        } else {
          errorMessage = String(error)
        }
      }
      
      showStatus(`Error saving article: ${errorMessage}`, 'error')
      // On error, update button state to allow retry
      await updateSaveButtonState()
    }
  }

  const handleLogout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setSession(null)
    setTags([])
    showStatus('Logged out successfully', 'success')
  }

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, newSession: Session | null) => {
      if (event === 'SIGNED_IN' && newSession) {
        setSession(newSession)
        syncSavedArticlesFromSupabase(newSession.user.id)
        updateSaveButtonState()
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setTags([])
      } else if (event === 'TOKEN_REFRESHED' && newSession) {
        // Session was refreshed, ensure UI is updated
        if (newSession.user) {
          setSession(newSession)
          updateSaveButtonState()
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Refresh session when popup opens to keep it alive
  useEffect(() => {
    const refreshSessionOnOpen = async (): Promise<void> => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          // Check if session is about to expire (within 5 minutes)
          const expiresAt = currentSession.expires_at
          const now = Math.floor(Date.now() / 1000)
          
          if (expiresAt && (expiresAt - now) < 300) {
            // Refresh the session to extend its lifetime
            const { error } = await supabase.auth.refreshSession(currentSession)
            if (error) {
              console.error('Error refreshing session on popup open:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing session on popup open:', error)
      }
    }

    refreshSessionOnOpen()

    // Set up periodic refresh while popup is open (every 30 minutes)
    refreshIntervalRef.current = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          await supabase.auth.refreshSession(currentSession)
          console.log('Session refreshed periodically')
        }
      } catch (error) {
        console.error('Error in periodic refresh:', error)
      }
    }, 30 * 60 * 1000) // 30 minutes

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
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
      {session?.user ? (
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

