import { supabase } from './lib/supabase.js'

// Cross-browser API compatibility
const browserAPI = typeof chrome !== 'undefined' ? chrome : browser

// DOM elements
const loginForm = document.getElementById('loginForm')
const articleForm = document.getElementById('articleForm')
const loginSection = document.getElementById('loginSection')
const mainSection = document.getElementById('mainSection')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const loginButton = document.getElementById('loginButton')
const signupButton = document.getElementById('signupButton')
const saveButton = document.getElementById('saveButton')
const statusMessage = document.getElementById('statusMessage')
const userEmail = document.getElementById('userEmail')
const logoutButton = document.getElementById('logoutButton')

// Check authentication status on load
checkAuthStatus()

// Login form handler
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = emailInput.value
  const password = passwordInput.value
  
  if (!email || !password) {
    showStatus('Please enter email and password', 'error')
    return
  }
  
  await signIn(email, password)
})

// Sign up handler
signupButton?.addEventListener('click', async (e) => {
  e.preventDefault()
  const email = emailInput.value
  const password = passwordInput.value
  
  if (!email || !password) {
    showStatus('Please enter email and password', 'error')
    return
  }
  
  await signUp(email, password)
})

// Save article handler
saveButton?.addEventListener('click', async () => {
  await saveCurrentArticle()
})

// Logout handler
logoutButton?.addEventListener('click', async () => {
  await supabase.auth.signOut()
  checkAuthStatus()
  showStatus('Logged out successfully', 'success')
})

async function checkAuthStatus() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session && session.user) {
      // Try to refresh the session to ensure it's still valid
      // This handles cases where browser was closed for a long time
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession(session)
        
        if (refreshError) {
          // Refresh token expired - user needs to sign in again
          if (refreshError.message?.includes('refresh_token_not_found') || 
              refreshError.message?.includes('token_expired') ||
              refreshError.message?.includes('Invalid Refresh Token')) {
            console.log('Session expired - user needs to sign in again')
            showLoginSection()
            return
          }
        }
        
        // Session is valid
        showMainSection(session.user.email)
      } catch (error) {
        // If refresh fails, check if we still have a valid session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession && currentSession.user) {
          showMainSection(currentSession.user.email)
        } else {
          showLoginSection()
        }
      }
    } else {
      showLoginSection()
    }
  } catch (error) {
    console.error('Error checking auth status:', error)
    showLoginSection()
  }
}

async function signIn(email, password) {
  try {
    showStatus('Signing in...', 'info')
    loginButton.disabled = true
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    if (data.session) {
      showMainSection(data.user.email)
      showStatus('Signed in successfully!', 'success')
    }
  } catch (error) {
    showStatus(error.message || 'Sign in failed', 'error')
  } finally {
    loginButton.disabled = false
  }
}

async function signUp(email, password) {
  try {
    showStatus('Creating account...', 'info')
    signupButton.disabled = true
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    if (data.session) {
      showMainSection(data.user.email)
      showStatus('Account created and signed in!', 'success')
    } else {
      showStatus('Please check your email to verify your account', 'info')
    }
  } catch (error) {
    showStatus(error.message || 'Sign up failed', 'error')
  } finally {
    signupButton.disabled = false
  }
}

async function saveCurrentArticle() {
  try {
    showStatus('Parsing article...', 'info')
    saveButton.disabled = true
    
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
    let pingResponse
    let needsInjection = false
    
    try {
      pingResponse = await Promise.race([
        browserAPI.tabs.sendMessage(tab.id, { action: 'ping' }),
        new Promise((_, reject) => 
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
            target: { tabId: tab.id },
            files: ['content.js']
          })
        } else if (browserAPI.tabs && browserAPI.tabs.executeScript) {
          // Firefox (Manifest V2 fallback)
          await browserAPI.tabs.executeScript(tab.id, { file: 'content.js' })
        } else {
          throw new Error('Script injection API not available. Make sure the extension has scripting permission.')
        }
        
        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verify it's ready now
        try {
          pingResponse = await Promise.race([
            browserAPI.tabs.sendMessage(tab.id, { action: 'ping' }),
            new Promise((_, reject) => 
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
          throw new Error(`Content script injected but not ready: ${verifyError.message}`)
        }
      } catch (injectError) {
        throw new Error(`Cannot inject content script: ${injectError.message}`)
      }
    }
    
    // Now send the actual parse request
    let response
    try {
      response = await Promise.race([
        browserAPI.tabs.sendMessage(tab.id, { action: 'parseArticle' }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Parse timeout after 10 seconds')), 10000)
        )
      ])
    } catch (error) {
      throw new Error(`Failed to parse article: ${error.message}`)
    }
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to parse article')
    }
    
    const article = response.article
    
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || !session.user) {
      throw new Error('Not authenticated. Please log in.')
    }
    
    showStatus('Saving article...', 'info')
    
    // Save to Supabase
    // Match the actual database schema from database_types.ts:
    // Schema columns: content, created_time, id, published_time, title, user_id
    // - content: text content from article (required in Insert)
    // - created_time: optional in Insert, will use database default if not provided
    // - title: article title (optional)
    // - user_id: current user's ID (required)
    // - published_time: optional, not setting it here
    const { data, error: supabaseError } = await supabase
      .from('articles')
      .insert({
        user_id: session.user.id,
        excerpt: article.excerpt || null,
        length: article.length || null,
        published_time: article.publishedTime || null,
        siteName: article.siteName || null,
        title: article.title || null,
        url: article.url || null,
        content: article.content || null,
      })
      .select()
      .single()
    
    if (supabaseError) {
      const errorMsg = supabaseError.message || supabaseError.details || supabaseError.hint || 'Database error'
      throw new Error(`Failed to save to database: ${errorMsg}`)
    }
    
    showStatus('Article saved successfully!', 'success')
  } catch (error) {
    console.error('Error saving article:', error)
    
    // Extract error message properly
    let errorMessage = 'Failed to save article'
    if (error) {
      if (typeof error === 'string') {
        errorMessage = error
      } else if (error.message) {
        errorMessage = error.message
      } else if (error.error) {
        errorMessage = typeof error.error === 'string' ? error.error : error.error.message || 'Unknown error'
      } else {
        errorMessage = String(error)
      }
    }
    
    showStatus(`Error saving article: ${errorMessage}`, 'error')
  } finally {
    saveButton.disabled = false
  }
}

function showLoginSection() {
  loginSection.style.display = 'flex'
  mainSection.style.display = 'none'
  emailInput.value = ''
  passwordInput.value = ''
}

function showMainSection(email) {
  loginSection.style.display = 'none'
  mainSection.style.display = 'flex'
  if (userEmail) {
    userEmail.textContent = email
  }
}

function showStatus(message, type = 'info') {
  if (!statusMessage) return
  
  statusMessage.textContent = message
  statusMessage.className = `status ${type}`
  statusMessage.style.opacity = "1"
  
  // Auto-hide after 5 seconds for success/info
  setTimeout(() => {
    statusMessage.style.opacity = "0"
  }, 2500)
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session) {
    showMainSection(session.user.email)
  } else if (event === 'SIGNED_OUT') {
    showLoginSection()
  } else if (event === 'TOKEN_REFRESHED' && session) {
    // Session was refreshed, ensure UI is updated
    if (session.user) {
      showMainSection(session.user.email)
    }
  }
})

// Refresh session when popup opens to keep it alive
async function refreshSessionOnOpen() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at
      const now = Math.floor(Date.now() / 1000)
      
      if (expiresAt && (expiresAt - now) < 300) {
        // Refresh the session to extend its lifetime
        const { data, error } = await supabase.auth.refreshSession(session)
        if (error) {
          // If refresh fails, checkAuthStatus will handle it
          console.error('Error refreshing session on popup open:', error)
        }
      }
    }
  } catch (error) {
    console.error('Error refreshing session on popup open:', error)
  }
}

// Refresh session when popup opens (only if needed)
refreshSessionOnOpen()

// Also set up periodic refresh while popup is open (every 30 minutes)
let refreshInterval = null

function startPeriodicRefresh() {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
  
  // Refresh every 30 minutes
  refreshInterval = setInterval(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await supabase.auth.refreshSession(session)
        console.log('Session refreshed periodically')
      }
    } catch (error) {
      console.error('Error in periodic refresh:', error)
    }
  }, 30 * 60 * 1000) // 30 minutes
}

// Start periodic refresh
startPeriodicRefresh()

