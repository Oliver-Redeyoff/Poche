import * as FileSystem from 'expo-file-system/legacy'
import { Article } from '../shared/types'

/**
 * Extract all image URLs from HTML content
 */
export function extractImageUrls(htmlContent: string | null): string[] {
  if (!htmlContent) return []
  
  const imageUrls: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  
  while ((match = imgRegex.exec(htmlContent)) !== null) {
    if (match[1]) {
      let imageUrl = match[1]
      
      // Handle relative URLs (convert to absolute if needed)
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl
      } else if (imageUrl.startsWith('/') && !imageUrl.startsWith('file://')) {
        // Skip relative paths that aren't file:// URIs
        // These would need the article URL to resolve properly
        continue
      }
      
      // Skip data URIs and already local files
      if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('file://')) {
        imageUrls.push(imageUrl)
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
 * Process article content to cache images and replace URLs with local paths
 */
export async function processArticleImages(
  article: Article,
  userId: string
): Promise<Article> {
  if (!article.content) {
    return article
  }
  
  // Check if article already has processed images (contains file:// URIs)
  if (article.content.includes('file://')) {
    return article // Already processed
  }
  
  const imageUrls = extractImageUrls(article.content)
  
  if (imageUrls.length === 0) {
    return article // No images to process
  }
  
  let processedContent = article.content
  const imageUrlMap = new Map<string, string>() // Map original URL to local path
  
  // Download and cache each image
  for (const imageUrl of imageUrls) {
    try {
      const localPath = getImageCachePath(userId, article.id, imageUrl)
      const success = await downloadImage(imageUrl, localPath)
      
      if (success) {
        imageUrlMap.set(imageUrl, localPath)
      }
    } catch (error) {
      console.error(`Error processing image ${imageUrl}:`, error)
      // Continue with other images even if one fails
    }
  }
  
  // Replace all image URLs in HTML with local file URIs
  for (const [originalUrl, localPath] of imageUrlMap.entries()) {
    // Escape special regex characters in the URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Replace all occurrences of this URL in img src attributes
    const regex = new RegExp(`(<img[^>]+src=["'])${escapedUrl}(["'][^>]*>)`, 'gi')
    processedContent = processedContent.replace(regex, `$1file://${localPath}$2`)
  }
  
  return {
    ...article,
    content: processedContent,
  }
}

/**
 * Process multiple articles to cache their images
 */
export async function processArticlesImages(
  articles: Article[],
  userId: string
): Promise<Article[]> {
  const processedArticles: Article[] = []
  
  for (const article of articles) {
    try {
      const processed = await processArticleImages(article, userId)
      processedArticles.push(processed)
    } catch (error) {
      console.error(`Error processing images for article ${article.id}:`, error)
      // Add original article if processing fails
      processedArticles.push(article)
    }
  }
  
  return processedArticles
}

