import { JSDOM } from 'jsdom';
// @ts-ignore - Defuddle types may not be available
import { Defuddle } from 'defuddle/node';

export interface ExtractedArticle {
  title: string | null;
  content: string | null;
  excerpt: string | null;
  author: string | null;
  siteName: string | null;
  wordCount: number | null;
  image: string | null;
  favicon: string | null;
}

/**
 * Parse srcset attribute and return the highest resolution image URL
 */
function getHighestResSrcset(srcset: string): string | null {
  if (!srcset) return null;
  
  const sources = srcset.split(',').map(s => s.trim()).filter(Boolean);
  let bestUrl: string | null = null;
  let bestWidth = 0;
  
  for (const source of sources) {
    const parts = source.split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '';
    
    // Parse width descriptor (e.g., "1200w") or pixel density (e.g., "2x")
    let width = 0;
    if (descriptor.endsWith('w')) {
      width = parseInt(descriptor.slice(0, -1), 10) || 0;
    } else if (descriptor.endsWith('x')) {
      // For pixel density, assume base width of 800 and multiply
      width = 800 * (parseFloat(descriptor.slice(0, -1)) || 1);
    }
    
    if (url && width > bestWidth) {
      bestWidth = width;
      bestUrl = url;
    }
  }
  
  return bestUrl;
}

/**
 * Try to upgrade image URL to highest resolution using common CDN patterns
 */
function upgradeImageUrl(url: string): string {
  if (!url) return url;
  
  try {
    // WordPress/Jetpack: Remove size suffix (e.g., image-300x200.jpg -> image.jpg)
    if (url.match(/-\d+x\d+\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      url = url.replace(/-\d+x\d+\./, '.');
    }
    
    // WordPress resize parameter
    if (url.includes('?resize=') || url.includes('&resize=')) {
      url = url.replace(/[?&]resize=\d+%2C\d+/, '');
    }
    
    // Medium/CDN width parameters
    if (url.includes('cdn-images') || url.includes('miro.medium.com')) {
      // Remove width constraints like /max/800/ or /fit/c/800/600/
      url = url.replace(/\/max\/\d+\//, '/max/2000/');
      url = url.replace(/\/fit\/c\/\d+\/\d+\//, '/');
    }
    
    // Cloudinary transformations - request larger size
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      // Remove existing transformations and request full size
      url = url.replace(/\/upload\/[^/]+\//, '/upload/');
    }
    
    // Imgix - remove width/height params
    if (url.includes('imgix.net') || url.includes('ixlib=')) {
      const urlObj = new URL(url);
      urlObj.searchParams.delete('w');
      urlObj.searchParams.delete('h');
      urlObj.searchParams.delete('fit');
      url = urlObj.toString();
    }
    
    // Guardian images - request larger size
    if (url.includes('guim.co.uk') || url.includes('guardian')) {
      url = url.replace(/\/\d+\.jpg/, '/2000.jpg');
      url = url.replace(/width=\d+/, 'width=2000');
    }
    
    // Generic width/height query params
    const urlObj = new URL(url);
    if (urlObj.searchParams.has('w') && parseInt(urlObj.searchParams.get('w') || '0') < 1000) {
      urlObj.searchParams.set('w', '2000');
    }
    if (urlObj.searchParams.has('width') && parseInt(urlObj.searchParams.get('width') || '0') < 1000) {
      urlObj.searchParams.set('width', '2000');
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Pre-process DOM to upgrade all images to highest resolution
 */
function upgradeImagesToHighRes(document: Document, baseUrl: string): void {
  const images = document.querySelectorAll('img');
  
  for (const img of images) {
    let bestSrc: string | null = null;
    
    // 1. Check srcset for highest resolution
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      bestSrc = getHighestResSrcset(srcset);
    }
    
    // 2. Check data attributes for lazy-loaded high-res images
    const lazyAttrs = [
      'data-src', 'data-lazy-src', 'data-original', 'data-full-src',
      'data-large-src', 'data-hi-res-src', 'data-srcset', 'data-lazy',
      'data-original-src', 'data-zoom-src', 'data-image'
    ];
    
    for (const attr of lazyAttrs) {
      const value = img.getAttribute(attr);
      if (value && value.startsWith('http')) {
        // If it's a srcset in a data attribute
        if (attr === 'data-srcset') {
          const fromSrcset = getHighestResSrcset(value);
          if (fromSrcset) {
            bestSrc = fromSrcset;
            break;
          }
        } else {
          bestSrc = value;
          break;
        }
      }
    }
    
    // 3. If no better source found, try to upgrade current src
    if (!bestSrc) {
      const currentSrc = img.getAttribute('src');
      if (currentSrc) {
        bestSrc = upgradeImageUrl(currentSrc);
      }
    } else {
      // Still try to upgrade the best source we found
      bestSrc = upgradeImageUrl(bestSrc);
    }
    
    // 4. Update the image src if we found a better one
    if (bestSrc && bestSrc !== img.getAttribute('src')) {
      // Make URL absolute if needed
      if (bestSrc.startsWith('//')) {
        bestSrc = 'https:' + bestSrc;
      } else if (bestSrc.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          bestSrc = `${base.protocol}//${base.host}${bestSrc}`;
        } catch {}
      }
      
      img.setAttribute('src', bestSrc);
      // Clear srcset so Defuddle uses our upgraded src
      img.removeAttribute('srcset');
    }
  }
  
  // Also handle picture elements
  const pictures = document.querySelectorAll('picture');
  for (const picture of pictures) {
    const sources = picture.querySelectorAll('source');
    let bestSrc: string | null = null;
    
    // Find the largest source
    for (const source of sources) {
      const srcset = source.getAttribute('srcset');
      if (srcset) {
        const fromSrcset = getHighestResSrcset(srcset);
        if (fromSrcset) {
          bestSrc = fromSrcset;
        }
      }
    }
    
    // Update the img inside the picture
    if (bestSrc) {
      const img = picture.querySelector('img');
      if (img) {
        img.setAttribute('src', upgradeImageUrl(bestSrc));
        img.removeAttribute('srcset');
      }
    }
  }
}

/**
 * Extract article content from a URL using Defuddle
 * Returns markdown content for easy rendering in the mobile app
 */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
  try {
    // Fetch the page using JSDOM with desktop-like settings
    const dom = await JSDOM.fromURL(url, {
      // Use a desktop Chrome user agent to get full-quality content
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      pretendToBeVisual: true,
    });

    // Pre-process DOM to upgrade images to highest resolution
    upgradeImagesToHighRes(dom.window.document, url);

    // Parse with Defuddle, outputting markdown
    const result = await Defuddle(dom, url, {
      markdown: true,
      debug: false,
    });

    if (!result || !result.content) {
      throw new Error('Could not extract article content');
    }

    return {
      title: result.title || null,
      content: result.content || null,
      excerpt: result.description || null,
      author: result.author || null,
      siteName: result.site || new URL(url).hostname,
      wordCount: result.wordCount || null,
      image: result.image || null,
      favicon: result.favicon || null,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract article: ${error.message}`);
    }
    throw new Error('Failed to extract article: Unknown error');
  }
}

/**
 * Decode HTML entities in text
 */
export function decodeHtmlEntities(text: string | null): string | null {
  if (!text) return null;
  
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&rsquo;': "'",
    '&lsquo;': "'",
    '&rdquo;': '"',
    '&ldquo;': '"',
    '&mdash;': '—',
    '&ndash;': '–',
    '&hellip;': '…',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  
  return decoded;
}

