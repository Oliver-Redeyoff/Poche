// Content script runs in the context of web pages
// This script extracts article content using Defuddle

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : (browser as typeof chrome)

// Type definitions for Defuddle
interface DefuddleResult {
  title: string
  content: string
  description: string
  domain: string
  favicon: string
  image: string
  published: string
  site: string
  author: string
  wordCount: number
  parseTime: number
}

interface DefuddleOptions {
  debug?: boolean
  markdown?: boolean
  url?: string
}

interface DefuddleClass {
  new (doc: Document, options?: DefuddleOptions): DefuddleInstance
}

interface DefuddleInstance {
  parse(): DefuddleResult
}

interface DefuddleModule {
  default?: DefuddleClass
  Defuddle?: DefuddleClass
}

interface MessageRequest {
  action: 'ping' | 'parseArticle'
}

interface PingResponse {
  success: boolean
  ready: boolean
  defuddleLoaded: boolean
}

interface ParseResponse {
  success: boolean
  article?: {
    title: string | null
    content: string | null
    excerpt: string | null
    author: string | null
    siteName: string
    url: string
    wordCount: number | null
  }
  error?: string
}

// Import Defuddle - webpack will bundle it
let Defuddle: DefuddleClass | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const defuddleModule = require('defuddle') as DefuddleModule
  Defuddle = defuddleModule.default || defuddleModule.Defuddle || (defuddleModule as unknown as DefuddleClass)
} catch (error) {
  console.error('Failed to load Defuddle:', error)
  Defuddle = null
}

// Decode HTML entities to their actual characters
function decodeHtmlEntities(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') {
    return text || null
  }
  
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

function parseCurrentPage(): {
  title: string | null
  content: string | null
  excerpt: string | null
  author: string | null
  siteName: string
  url: string
  wordCount: number | null
} {
  if (!Defuddle) {
    throw new Error('Defuddle library not loaded')
  }

  // Clone the document to avoid modifying the original
  const documentClone = document.cloneNode(true) as Document
  
  // Create a new Defuddle instance (outputs HTML in browser environment)
  const defuddle = new Defuddle(documentClone, {
    debug: false,
    url: window.location.href,
  })
  
  const result = defuddle.parse()
  
  if (!result || !result.content) {
    throw new Error('Could not parse article content')
  }

  console.log('Defuddle result:', result)
  
  return {
    title: decodeHtmlEntities(result.title) || null,
    content: result.content || null,
    excerpt: decodeHtmlEntities(result.description) || null,
    author: decodeHtmlEntities(result.author) || null,
    siteName: result.site || result.domain || new URL(window.location.href).hostname,
    url: window.location.href,
    wordCount: result.wordCount || null,
  }
}

// Ensure the message listener is set up immediately
(function() {
  'use strict'
  
  // Listen for messages from popup or background
  browserAPI.runtime.onMessage.addListener((
    request: MessageRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: PingResponse | ParseResponse) => void
  ): boolean => {
    if (request.action === 'ping') {
      // Simple ping to check if content script is ready
      sendResponse({ success: true, ready: true, defuddleLoaded: !!Defuddle })
      return true
    }
    
    if (request.action === 'parseArticle') {
      // Handle response - wrap in try/catch since it's synchronous
      try {
        if (!Defuddle) {
          throw new Error('Defuddle library not loaded')
        }
        const article = parseCurrentPage()
        sendResponse({ success: true, article })
      } catch (error) {
        console.error('Error parsing article:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        sendResponse({ success: false, error: errorMessage })
      }
      return true // Keep channel open for async response
    }
    // Return false if we don't handle the message
    return false
  })
  
  // Log that content script is ready
  if (Defuddle) {
    console.log('Poche content script loaded and ready (using Defuddle)')
  } else {
    console.error('Poche content script loaded but Defuddle failed to initialize')
  }
})()
