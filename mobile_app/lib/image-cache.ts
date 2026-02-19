import * as FileSystem from 'expo-file-system/legacy'
import { Image as ExpoImage } from 'expo-image'
import { Article } from '@poche/shared'

// Markdown image regex: ![alt text](url) or ![alt text](url "title")
const MARKDOWN_IMAGE_REGEX = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gi

/**
 * Normalize an image URL (handle protocol-relative URLs)
 */
function normalizeImageUrl(imageUrl: string): string | null {
  // Handle protocol-relative URLs
  if (imageUrl.startsWith('//')) {
    return 'https:' + imageUrl
  }
  
  // Skip relative paths that aren't file:// URIs (need article URL to resolve)
  if (imageUrl.startsWith('/') && !imageUrl.startsWith('file://')) {
    return null
  }
  
  // Skip data URIs
  if (imageUrl.startsWith('data:')) {
    return null
  }
  
  return imageUrl
}

/**
 * Extract the first image URL from markdown content
 * Returns the URL or null if no valid image found
 */
export function extractFirstImageUrl(markdownContent: string | null): string | null {
  if (!markdownContent) return null
  
  // Reset regex state
  MARKDOWN_IMAGE_REGEX.lastIndex = 0
  
  let match
  while ((match = MARKDOWN_IMAGE_REGEX.exec(markdownContent)) !== null) {
    if (match[1]) {
      const normalized = normalizeImageUrl(match[1])
      if (normalized) {
        return normalized
      }
    }
  }
  
  return null
}

/**
 * Extract all image URLs from markdown content
 * Matches markdown image syntax: ![alt](url) or ![alt](url "title")
 */
export function extractImageUrls(markdownContent: string | null): string[] {
  if (!markdownContent) return []
  
  const imageUrls: string[] = []
  
  // Reset regex state
  MARKDOWN_IMAGE_REGEX.lastIndex = 0
  
  let match
  while ((match = MARKDOWN_IMAGE_REGEX.exec(markdownContent)) !== null) {
    if (match[1]) {
      const normalized = normalizeImageUrl(match[1])
      // For caching, only include remote URLs (http/https)
      if (normalized && (normalized.startsWith('http://') || normalized.startsWith('https://'))) {
        imageUrls.push(normalized)
      }
    }
  }
  
  return [...new Set(imageUrls)] // Remove duplicates
}

/**
 * Generate a local file path for a cached image
 */
function getImageCachePath(userId: string, articleId: number, imageUrl: string): string {
  // Create a hash-like filename from the URL
  const urlHash = imageUrl
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 100) // Limit length
  
  // Get file extension from URL or default to jpg
  const extension = imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)?.[1] || 'jpg'
  
  // Use FileSystem.cacheDirectory for the cache directory path
  const cacheDir = FileSystem.cacheDirectory
  return `${cacheDir}poche_images/${userId}/${articleId}/${urlHash}.${extension}`
}

function getArticleHostname(articleUrl: string): string | null {
  try {
    const { hostname } = new URL(articleUrl)
    return hostname || null
  } catch {
    return null
  }
}

export function getFaviconUrl(articleUrl: string | null): string | null {
  if (!articleUrl) {
    return null
  }

  const hostname = getArticleHostname(articleUrl)
  if (!hostname) {
    return null
  }

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`
}

function getFaviconCachePath(userId: string, articleId: number, articleUrl: string): string | null {
  const hostname = getArticleHostname(articleUrl)
  if (!hostname) {
    return null
  }

  const cacheDir = FileSystem.documentDirectory
  if (!cacheDir) {
    return null
  }

  const hostnameHash = hostname.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 100)
  return `${cacheDir}poche_favicons/${userId}/${articleId}/${hostnameHash}.png`
}

function base64ToBytes(base64: string): Uint8Array | null {
  try {
    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    }

    const bufferCtor = (globalThis as any).Buffer
    if (bufferCtor) {
      return new Uint8Array(bufferCtor.from(base64, 'base64'))
    }
  } catch (error) {
    console.error('Error decoding base64:', error)
  }

  return null
}

function thumbHashBytesToAverageRGBA(hash: Uint8Array): { r: number; g: number; b: number; a: number } | null {
  if (hash.length < 6) {
    return null
  }

  const header = hash[0] | (hash[1] << 8) | (hash[2] << 16)
  const l = (header & 63) / 63
  const p = ((header >> 6) & 63) / 31.5 - 1
  const q = ((header >> 12) & 63) / 31.5 - 1
  const hasAlpha = header >> 23
  const a = hasAlpha ? (hash[5] & 15) / 15 : 1
  const b = l - (2 / 3) * p
  const r = (3 * l - b + q) / 2
  const g = r - q

  return {
    r: Math.max(0, Math.min(1, r)),
    g: Math.max(0, Math.min(1, g)),
    b: Math.max(0, Math.min(1, b)),
    a,
  }
}

async function getAverageImageColor(imageSource: string): Promise<string | null> {
  try {
    const thumbhash = await ExpoImage.generateThumbhashAsync(imageSource)
    if (!thumbhash) {
      return null
    }

    const bytes = base64ToBytes(thumbhash)
    if (!bytes) {
      return null
    }

    const rgba = thumbHashBytesToAverageRGBA(bytes)
    if (!rgba) {
      return null
    }

    const r = Math.round(rgba.r * 255)
    const g = Math.round(rgba.g * 255)
    const b = Math.round(rgba.b * 255)
    return `rgb(${r}, ${g}, ${b})`
  } catch (error) {
    console.error(`Error extracting average image color:`, error)
    return null
  }
}

/**
 * Check if a cached version of an image exists and return the path
 * Returns the cached file:// path if exists, otherwise returns the original URL
 */
export async function getCachedImagePath(
  userId: string | null,
  articleId: number | null,
  imageUrl: string
): Promise<string> {
  // If no user or article ID, return original URL
  if (!userId || !articleId) {
    return imageUrl
  }
  
  // Only cache http/https URLs
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl
  }
  
  try {
    const localPath = getImageCachePath(userId, articleId, imageUrl)
    const fileInfo = await FileSystem.getInfoAsync(localPath)
    
    if (fileInfo.exists) {
      return localPath // Already includes file:// from cacheDirectory
    }
  } catch (error) {
    console.error(`Error checking cached image:`, error)
  }
  
  return imageUrl
}

/**
 * Download an image and save it to local storage
 */
async function downloadImage(imageUrl: string, localPath: string): Promise<boolean> {
  try {
    // Ensure directory exists
    const dirPath = localPath.substring(0, localPath.lastIndexOf('/'))
    const dirInfo = await FileSystem.getInfoAsync(dirPath)
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true })
    }
    
    // Check if image already exists
    const fileInfo = await FileSystem.getInfoAsync(localPath)
    if (fileInfo.exists) {
      return true // Already cached
    }
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath)
    
    if (downloadResult.status === 200) {
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error downloading image ${imageUrl}:`, error)
    return false
  }
}

/**
 * Process article to cache images (downloads images but does NOT modify markdown content)
 * The cached images are looked up at render time using getCachedImagePath
 */
export async function processArticleImages(
  article: Article,
  userId: string
): Promise<Article> {
  if (!article.content) {
    return article
  }
  
  const imageUrls = extractImageUrls(article.content)
  
  if (imageUrls.length === 0) {
    return article // No images to process
  }
  
  // Download and cache each image (but don't modify content)
  for (const imageUrl of imageUrls) {
    try {
      const localPath = getImageCachePath(userId, article.id, imageUrl)
      await downloadImage(imageUrl, localPath)
    } catch (error) {
      console.error(`Error processing image ${imageUrl}:`, error)
      // Continue with other images even if one fails
    }
  }
  
  // Return article unchanged - cached images are looked up at render time
  return article
}

/**
 * Process multiple articles to cache their images
 */
export async function processArticlesImages(
  articles: Article[],
  userId: string
): Promise<Article[]> {
  for (const article of articles) {
    try {
      await processArticleImages(article, userId)
    } catch (error) {
      console.error(`Error processing images for article ${article.id}:`, error)
    }
  }
  
  // Return articles unchanged
  return articles
}

/**
 * Download and cache article favicon locally for offline use.
 * Returns the local file path when available; otherwise null.
 */
export async function cacheArticleFavicon(
  article: Article,
  userId: string
): Promise<string | null> {
  if (!article.url) {
    return null
  }

  const faviconUrl = getFaviconUrl(article.url)
  const localPath = getFaviconCachePath(userId, article.id, article.url)

  if (!faviconUrl || !localPath) {
    return null
  }

  try {
    const fileInfo = await FileSystem.getInfoAsync(localPath)
    if (fileInfo.exists) {
      return localPath
    }

    const downloaded = await downloadImage(faviconUrl, localPath)
    return downloaded ? localPath : null
  } catch (error) {
    console.error(`Error caching favicon for article ${article.id}:`, error)
    return null
  }
}

/**
 * Cache favicons for multiple articles and return updated article objects.
 */
export async function processArticlesFavicons(
  articles: Article[],
  userId: string
): Promise<Article[]> {
  const updatedArticles: Article[] = []

  for (const article of articles) {
    try {
      const faviconLocalPath = await cacheArticleFavicon(article, userId)
      const colorSource = faviconLocalPath || article.faviconLocalPath || null
      const faviconBackgroundColor = article.faviconBackgroundColor
        ?? (colorSource ? await getAverageImageColor(colorSource) : null)

      updatedArticles.push({
        ...article,
        faviconLocalPath: faviconLocalPath ?? article.faviconLocalPath ?? null,
        faviconBackgroundColor,
      })
    } catch (error) {
      console.error(`Error processing favicon for article ${article.id}:`, error)
      updatedArticles.push(article)
    }
  }

  return updatedArticles
}
