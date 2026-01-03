import * as FileSystem from 'expo-file-system/legacy'
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
