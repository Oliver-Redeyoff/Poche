// Content script runs in the context of web pages
// This script extracts article content using Readability

// Cross-browser API compatibility
const browserAPI = typeof chrome !== 'undefined' ? chrome : browser

// Import Readability - webpack will bundle it
let Readability
try {
  const readabilityModule = require('@mozilla/readability')
  Readability = readabilityModule.Readability || readabilityModule.default || readabilityModule
} catch (error) {
  console.error('Failed to load Readability:', error)
  Readability = null
}

// Ensure the message listener is set up immediately
(function() {
  'use strict'
  
  // Listen for messages from popup or background
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
      // Simple ping to check if content script is ready
      sendResponse({ success: true, ready: true, readabilityLoaded: !!Readability })
      return true
    }
    
    if (request.action === 'parseArticle') {
      // Handle response - wrap in try/catch since it's synchronous
      try {
        if (!Readability) {
          throw new Error('Readability library not loaded')
        }
        const article = parseCurrentPage()
        sendResponse({ success: true, article })
      } catch (error) {
        console.error('Error parsing article:', error)
        sendResponse({ success: false, error: error.message })
      }
      return true // Keep channel open for async response
    }
    // Return false if we don't handle the message
    return false
  })
  
  // Log that content script is ready
  if (Readability) {
    console.log('Poche content script loaded and ready')
  } else {
    console.error('Poche content script loaded but Readability failed to initialize')
  }
})()

function parseCurrentPage() {
  // Clone the document to avoid modifying the original
  const documentClone = document.cloneNode(true)
  
  // Create a new document from the clone
  const reader = new Readability(documentClone, {
    debug: false,
    maxElemsToParse: 10000,
    nbTopCandidates: 5,
    charThreshold: 500,
  })
  
  const article = reader.parse()
  
  if (!article) {
    throw new Error('Could not parse article content')
  }
  
  return {
    title: article.title || document.title,
    content: article.textContent || article.content,
    htmlContent: article.content,
    excerpt: article.excerpt || '',
    byline: article.byline || '',
    siteName: article.siteName || new URL(window.location.href).hostname,
    url: window.location.href,
    length: article.length || 0,
  }
}

