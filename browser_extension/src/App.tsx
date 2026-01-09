import { useRef, useState, useEffect } from 'react'
import './App.css'
import * as api from './lib/api'
import { syncSavedArticlesFromBackend, checkIfUrlIsSaved, saveArticleToStorage } from './lib/storage'
import type { StatusType } from './lib/types'
import { Header, StatusMessage, LoadingSpinner, LoginSection, MainSection } from './components'

// Declare browser for Firefox compatibility
declare const browser: typeof chrome

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : browser

export function App(): JSX.Element {
  const [session, setSession] = useState<api.Session | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [saveButtonDisabled, setSaveButtonDisabled] = useState<boolean>(false)
  const [saveButtonText, setSaveButtonText] = useState<string>('Save Article')
  const [tags, setTags] = useState<string[]>([])

  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showStatusMessage, setShowStatusMessage] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [statusType, setStatusType] = useState<StatusType>('info')

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
    setShowStatusMessage(true)

    // Cancel old timeout and set new one to auto-hide after 2.5 seconds
    clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      setShowStatusMessage(false)
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

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      showStatus('Sending reset link...', 'info')
      setIsLoading(true)
      
      await api.forgotPassword(email)
      
      showStatus('Check your email for a reset link!', 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email'
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
    <div className="app">
      <Header />
      <StatusMessage show={showStatusMessage} message={statusMessage} type={statusType} />
      {isCheckingAuth ? (
        <LoadingSpinner />
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
          onForgotPassword={forgotPassword}
          onError={(message) => showStatus(message, 'error')}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}

