import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { NodeHtmlMarkdown } from 'node-html-markdown'

export interface ExtractedArticle {
  title: string | null;
  content: string | null;
  excerpt: string | null;
  author: string | null;
  siteName: string | null;
  wordCount: number | null;
}


/**
 * Domain-specific configuration for article extraction.
 * - selector: CSS selector to narrow the DOM to the article container
 * - removeSelectors: CSS selectors for elements to strip before Readability runs
 */
interface DomainConfig {
  readabilityLibrary: 'readability' | 'defuddle' | 'none';
  selector: string;
  removeSelectors?: string[];
}

interface DomainConfigEntry {
  domains: string[];
  config: DomainConfig;
}

const DOMAIN_CONFIGS: DomainConfigEntry[] = [
  {
    domains: ['bbc.co.uk', 'bbc.com'],
    config: {
      readabilityLibrary: 'none',
      selector: 'article',
      removeSelectors: [
        '[data-block="byline"]',
        '[data-block="metadata"]',
        '[data-block="links"]',
        '[data-block="topicList"]',
        '[data-block="promoList"]',
        '[data-block="share"]',
      ],
    },
  },
  { 
    domains: ['medium.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['nytimes.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: '#story',
    },
  },
  { 
    domains: ['theguardian.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: '#maincontent',
    },
  },
  { 
    domains: ['washingtonpost.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: '#main-content',
    },
  },
  { 
    domains: ['reuters.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['arstechnica.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['wired.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['theverge.com'],
    config: { 
      readabilityLibrary: 'none',
      selector: 'article',
    },
  },
];

/**
 * Look up domain-specific extraction config for a given URL.
 * Matches against the hostname (with "www." stripped), including subdomains.
 */
function getDomainConfig(url: string): DomainConfig | null {
  const hostname = new URL(url).hostname.replace(/^www\./, '');
  for (const { domains, config } of DOMAIN_CONFIGS) {
    for (const domain of domains) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return config;
      }
    }
  }
  return null;
}

/**
 * Extract article content from a URL using Readability
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

    const doc = dom.window.document;

    // Apply domain-specific preprocessing
    const domainConfig = getDomainConfig(url);
    if (domainConfig) {
      // Narrow DOM to known article container
      const target = doc.querySelector(domainConfig.selector);
      if (target) {
        doc.body.innerHTML = '';
        doc.body.appendChild(target);
      }

      // Strip known clutter elements before Readability scores the DOM
      if (domainConfig.removeSelectors) {
        for (const removeSelector of domainConfig.removeSelectors) {
          const elements = doc.querySelectorAll(removeSelector);
          for (const el of elements) {
            el.remove();
          }
        }
      }
    }

    let title: string | null = null;
    let htmlContent: string | null = null;
    let excerpt: string | null = null;
    let author: string | null = null;
    let siteName: string | null = null;
    let textContent: string | null = null;

    const useReadability = !domainConfig || domainConfig.readabilityLibrary === 'readability';

    if (useReadability) {
      const readability = new Readability(doc);
      const readabilityResult = readability.parse();
      title = readabilityResult?.title || null;
      htmlContent = readabilityResult?.content || null;
      excerpt = readabilityResult?.excerpt || null;
      author = readabilityResult?.byline || null;
      siteName = readabilityResult?.siteName || null;
      textContent = readabilityResult?.textContent || null;
    } else {
      // Use raw DOM content (after selector narrowing and clutter removal)
      htmlContent = doc.body.innerHTML;
      textContent = doc.body.textContent;
    }

    if (!htmlContent) {
      throw new Error('Could not extract article content');
    }

    const content = NodeHtmlMarkdown.translate(htmlContent);

    return {
      title,
      content,
      excerpt,
      author,
      siteName: siteName || new URL(url).hostname,
      wordCount: textContent ? textContent.split(/\s+/).filter(Boolean).length : null,
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

