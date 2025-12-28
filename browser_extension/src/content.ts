// Content script runs in the context of web pages
// This script extracts article content using Readability

// Cross-browser API compatibility
const browserAPI: typeof chrome = typeof chrome !== 'undefined' ? chrome : (browser as typeof chrome)

// Type definitions
interface ReadabilityModule {
  Readability?: typeof Readability
  default?: typeof Readability
  new (doc: Document, options?: ReadabilityOptions): Readability
  parse(): ParsedArticle | null
}

interface ReadabilityOptions {
  debug?: boolean
  maxElemsToParse?: number
  nbTopCandidates?: number
  charThreshold?: number
}

interface ParsedArticle {
  title?: string | null
  content?: string | null
  excerpt?: string | null
  length?: number | null
  siteName?: string | null
  publishedTime?: string | null
  byline?: string | null
}

interface MessageRequest {
  action: 'ping' | 'parseArticle'
}

interface PingResponse {
  success: boolean
  ready: boolean
  readabilityLoaded: boolean
}

interface ParseResponse {
  success: boolean
  article?: {
    title: string | null
    content: string | null
    excerpt: string | null
    publishedTime?: string | null
    byline: string | null
    siteName: string
    url: string
    length: number | null
  }
  error?: string
}

// Import Readability - webpack will bundle it
let Readability: typeof Readability | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const readabilityModule = require('@mozilla/readability') as ReadabilityModule
  Readability = readabilityModule.Readability || readabilityModule.default || (readabilityModule as typeof Readability)
} catch (error) {
  console.error('Failed to load Readability:', error)
  Readability = null
}

// Decode HTML entities to their actual characters
// This handles entities like &rsquo;, &quot;, &amp;, &lt;, &gt;, &nbsp;, etc.
function decodeHtmlEntities(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string') {
    return text || null
  }
  
  // Create a temporary DOM element to decode HTML entities
  // This is the standard browser method for decoding HTML entities
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

function parseCurrentPage(): {
  title: string | null
  content: string | null
  excerpt: string | null
  publishedTime?: string | null
  byline: string | null
  siteName: string
  url: string
  length: number | null
} {
  if (!Readability) {
    throw new Error('Readability library not loaded')
  }

  // Clone the document to avoid modifying the original
  const documentClone = document.cloneNode(true) as Document
  
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

  console.log(article)
  
  return {
    title: decodeHtmlEntities(article.title),
    content: article.content || null,
    excerpt: decodeHtmlEntities(article.excerpt),
    publishedTime: article.publishedTime || null,
    byline: decodeHtmlEntities(article.byline),
    siteName: article.siteName || new URL(window.location.href).hostname,
    url: window.location.href,
    length: article.length || null,
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        sendResponse({ success: false, error: errorMessage })
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

