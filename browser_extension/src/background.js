// Background service worker for the extension

// Cross-browser API compatibility
const browserAPI = typeof chrome !== 'undefined' ? chrome : browser

// Listen for extension installation
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('Poche extension installed')
})

// Handle messages from content scripts and popup
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveArticle') {
    // Forward to popup or handle here
    sendResponse({ success: true })
  }
  return true
})

