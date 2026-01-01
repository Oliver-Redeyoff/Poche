// Background service worker for the Poche extension
// With Better Auth, session management is handled via cookies
// This background script is minimal - just for extension lifecycle events

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : (browser as typeof chrome)

// Listen for extension installation
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('Poche extension installed')
})

// Listen for extension startup
browserAPI.runtime.onStartup.addListener(() => {
  console.log('Poche extension started')
})

// Handle any future background tasks here
// With Better Auth using cookies, we don't need to manually refresh tokens
