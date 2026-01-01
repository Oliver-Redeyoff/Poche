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
 * Extract article content from a URL using Defuddle
 * Returns markdown content for easy rendering in the mobile app
 */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
  try {
    // Fetch the page using JSDOM
    const dom = await JSDOM.fromURL(url, {
      userAgent: 'Mozilla/5.0 (compatible; PocheBot/1.0; +https://poche.app)',
      pretendToBeVisual: true,
    });

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

