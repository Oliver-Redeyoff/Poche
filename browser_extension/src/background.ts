// Background service worker for the extension
import { supabase } from './lib/supabase'

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : (browser as typeof chrome)

// Type definitions
interface MessageRequest {
  action: 'saveArticle' | 'refreshSession'
}

interface MessageResponse {
  success: boolean
}

// Listen for extension installation
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('Poche extension installed')
  // Start session refresh on install
  refreshSession()
})

// Handle messages from content scripts and popup
browserAPI.runtime.onMessage.addListener((
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
): boolean => {
  if (request.action === 'saveArticle') {
    // Forward to popup or handle here
    sendResponse({ success: true })
  } else if (request.action === 'refreshSession') {
    // Allow popup to trigger session refresh
    refreshSession().then(() => {
      sendResponse({ success: true })
    })
    return true // Keep channel open for async response
  }
  return true
})

// Refresh session periodically to keep it alive
async function refreshSession(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Check if session is expired or about to expire
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      
      // If token expires in less than 5 minutes, refresh it
      if (expiresAt && (expiresAt - now) < 300) {
        // Refresh the session if it exists
        const { data, error } = await supabase.auth.refreshSession(session)
        
        if (error) {
          console.error('Error refreshing session:', error)
          // If refresh fails with token_expired, the refresh token is expired
          // This happens if browser was closed for too long
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('token_expired') ||
              error.message?.includes('Invalid Refresh Token')) {
            console.log('Refresh token expired - user will need to sign in again')
            // Don't clear session here - let popup handle it gracefully
          }
        } else if (data.session) {
          console.log('Session refreshed successfully')
        }
      } else {
        console.log('Session still valid, no refresh needed')
      }
    }
  } catch (error) {
    console.error('Error in refreshSession:', error)
  }
}

// Refresh session when service worker starts (service workers can be terminated and restarted)
refreshSession()

// Set up alarm-based refresh (more reliable than setInterval in service workers)
// Chrome/Edge alarms persist even when service worker is terminated
if (browserAPI.alarms) {
  // Create alarm to refresh session every 30 minutes
  browserAPI.alarms.create('refreshSession', {
    periodInMinutes: 30
  })
  
  // Listen for alarm and refresh session
  browserAPI.alarms.onAlarm.addListener((alarm: chrome.alarms.Alarm) => {
    if (alarm.name === 'refreshSession') {
      refreshSession()
    }
  })
} else {
  // Fallback for browsers without alarms API
  // Refresh session every 30 minutes (tokens typically expire after 1 hour)
  setInterval(refreshSession, 30 * 60 * 1000) // 30 minutes
}

