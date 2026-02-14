import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown'

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
  readbilityLibrary: 'readability' | 'defuddle' | 'none';
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
      readbilityLibrary: 'none',
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
      readbilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['nytimes.com'],
    config: { 
      readbilityLibrary: 'none',
      selector: '#story',
    },
  },
  { 
    domains: ['theguardian.com'],
    config: { 
      readbilityLibrary: 'none',
      selector: '#maincontent',
    },
  },
  { 
    domains: ['washingtonpost.com'],
    config: { 
      readbilityLibrary: 'none',
      selector: '#main-content',
    },
  },
  { 
    domains: ['reuters.com'],
    config: { 
      readbilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['arstechnica.com'],
    config: { 
      readbilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['wired.com'],
    config: { 
      readbilityLibrary: 'none',
      selector: 'article',
    },
  },
  { 
    domains: ['theverge.com'],
    config: { 
      readbilityLibrary: 'none',
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
    const result: Record<string, string | null | undefined> = {
      title: null,
      content: null,
      excerpt: null,
      author: null,
      siteName: null,
    }

    // Fetch the page using JSDOM with desktop-like settings
    const dom = await JSDOM.fromURL(url, {
      // Use a desktop Chrome user agent to get full-quality content
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      pretendToBeVisual: true,
    });

    const doc = dom.window.document;

    // Apply domain-specific processing
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

      // Apply desired readability library
      if (domainConfig.readbilityLibrary === 'readability') {
        const readability = new Readability(doc);
        const readabilityResult = readability.parse();
        result.title = readabilityResult?.title;
        result.content = readabilityResult?.content;
        result.excerpt = readabilityResult?.excerpt;
        result.author = readabilityResult?.byline;
        result.siteName = readabilityResult?.siteName;
      } else if (domainConfig.readbilityLibrary === "none") {
        result.content = doc.body.innerHTML;
      }
    } else {
      // If no domain config is found, use the default readability library
      const readability = new Readability(doc);
      const readabilityResult = readability.parse();
      result.title = readabilityResult?.title;
      result.content = readabilityResult?.content;
      result.excerpt = readabilityResult?.excerpt;
      result.author = readabilityResult?.byline;
      result.siteName = readabilityResult?.siteName;
    }

    if (!result || !result.content) {
      throw new Error('Could not extract article content');
    }

    console.log(result.content);
    result.content = NodeHtmlMarkdown.translate(result.content ?? "");
    console.log(result.content);

    if (!result || !result.content) {
      throw new Error('Could not extract article content');
    }

    return {
      title: result.title || null,
      content: result.content,
      excerpt: result.excerpt || null,
      author: result.byline || null,
      siteName: result.siteName || new URL(url).hostname,
      wordCount: result.textContent ? result.textContent.split(' ').length : null,
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

