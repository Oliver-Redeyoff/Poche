// Markdown parsing utilities shared between webapp and mobile app

// Token types for the parser
export type TokenType = 
  | 'heading'
  | 'paragraph'
  | 'code_block'
  | 'blockquote'
  | 'list'
  | 'hr'
  | 'table'
  | 'image'

export interface Token {
  type: TokenType
  content: string
  level?: number // For headings (1-6)
  ordered?: boolean // For lists
  items?: string[] // For lists
  rows?: string[][] // For tables
  hasHeader?: boolean // For tables
  src?: string // For images
  alt?: string // For images
  language?: string // For code blocks
}

// Inline element types
export type InlineType = 'text' | 'strong' | 'em' | 'code' | 'link' | 'image' | 'strikethrough'

export interface InlineToken {
  type: InlineType
  content: string
  href?: string
  src?: string
  alt?: string
  children?: InlineToken[]
}

// Parse markdown into block tokens
export function tokenize(markdown: string): Token[] {
  const tokens: Token[] = []
  const lines = markdown.split('\n')
  let i = 0
  
  while (i < lines.length) {
    const line = lines[i]
    
    // Empty line - skip
    if (line.trim() === '') {
      i++
      continue
    }
    
    // Horizontal rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(line.trim())) {
      tokens.push({ type: 'hr', content: '' })
      i++
      continue
    }
    
    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      tokens.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2].trim()
      })
      i++
      continue
    }
    
    // Code block (fenced)
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      tokens.push({
        type: 'code_block',
        content: codeLines.join('\n'),
        language
      })
      i++ // Skip closing ```
      continue
    }
    
    // Indented code block (4 spaces or 1 tab)
    if (line.match(/^(\s{4}|\t)/)) {
      const codeLines: string[] = []
      while (i < lines.length && (lines[i].match(/^(\s{4}|\t)/) || lines[i].trim() === '')) {
        codeLines.push(lines[i].replace(/^(\s{4}|\t)/, ''))
        i++
      }
      tokens.push({
        type: 'code_block',
        content: codeLines.join('\n').trim()
      })
      continue
    }
    
    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() !== '' && quoteLines.length > 0 && !lines[i].match(/^[#\-*\d]/)))) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      tokens.push({
        type: 'blockquote',
        content: quoteLines.join('\n').trim()
      })
      continue
    }
    
    // Unordered list
    if (line.match(/^[\s]*[-*+]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[\s]*[-*+]\s+/)) {
        items.push(lines[i].replace(/^[\s]*[-*+]\s+/, '').trim())
        i++
      }
      tokens.push({
        type: 'list',
        ordered: false,
        items,
        content: ''
      })
      continue
    }
    
    // Ordered list
    if (line.match(/^[\s]*\d+\.\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[\s]*\d+\.\s+/)) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s+/, '').trim())
        i++
      }
      tokens.push({
        type: 'list',
        ordered: true,
        items,
        content: ''
      })
      continue
    }
    
    // Table
    if (line.includes('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i])
        i++
      }
      
      const rows: string[][] = []
      let hasHeader = false
      
      for (let j = 0; j < tableLines.length; j++) {
        const row = tableLines[j]
        // Skip separator row
        if (row.match(/^\|?[\s\-:|]+\|?$/)) {
          hasHeader = j === 1
          continue
        }
        const cells = row.split('|')
          .map(cell => cell.trim())
          .filter((cell, idx, arr) => idx > 0 && idx < arr.length - 1 || (idx === 0 && cell) || (idx === arr.length - 1 && cell))
        if (cells.length > 0) {
          rows.push(cells)
        }
      }
      
      if (rows.length > 0) {
        tokens.push({
          type: 'table',
          rows,
          hasHeader,
          content: ''
        })
      }
      continue
    }
    
    // Standalone image (on its own line)
    const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageMatch) {
      tokens.push({
        type: 'image',
        alt: imageMatch[1],
        src: imageMatch[2],
        content: ''
      })
      i++
      continue
    }
    
    // Paragraph - collect consecutive lines
    const paragraphLines: string[] = []
    while (i < lines.length && 
           lines[i].trim() !== '' && 
           !lines[i].match(/^#{1,6}\s+/) &&
           !lines[i].trim().startsWith('```') &&
           !lines[i].trim().startsWith('>') &&
           !lines[i].match(/^[\s]*[-*+]\s+/) &&
           !lines[i].match(/^[\s]*\d+\.\s+/) &&
           !lines[i].match(/^(\*{3,}|-{3,}|_{3,})$/)) {
      paragraphLines.push(lines[i])
      i++
    }
    
    if (paragraphLines.length > 0) {
      tokens.push({
        type: 'paragraph',
        content: paragraphLines.join(' ').trim()
      })
    }
  }
  
  return tokens
}

// Parse inline elements within text
export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = []
  let remaining = text
  
  while (remaining.length > 0) {
    // Image
    const imageMatch = remaining.match(/^!\[([^\]]*)\]\(([^)]+)\)/)
    if (imageMatch) {
      tokens.push({
        type: 'image',
        content: '',
        alt: imageMatch[1],
        src: imageMatch[2]
      })
      remaining = remaining.slice(imageMatch[0].length)
      continue
    }
    
    // Link
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      tokens.push({
        type: 'link',
        content: linkMatch[1],
        href: linkMatch[2],
        children: parseInline(linkMatch[1])
      })
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }
    
    // Bold with **
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      tokens.push({
        type: 'strong',
        content: boldMatch[1],
        children: parseInline(boldMatch[1])
      })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }
    
    // Bold with __
    const boldMatch2 = remaining.match(/^__([^_]+)__/)
    if (boldMatch2) {
      tokens.push({
        type: 'strong',
        content: boldMatch2[1],
        children: parseInline(boldMatch2[1])
      })
      remaining = remaining.slice(boldMatch2[0].length)
      continue
    }
    
    // Strikethrough
    const strikeMatch = remaining.match(/^~~([^~]+)~~/)
    if (strikeMatch) {
      tokens.push({
        type: 'strikethrough',
        content: strikeMatch[1],
        children: parseInline(strikeMatch[1])
      })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }
    
    // Italic with *
    const italicMatch = remaining.match(/^\*([^*]+)\*/)
    if (italicMatch) {
      tokens.push({
        type: 'em',
        content: italicMatch[1],
        children: parseInline(italicMatch[1])
      })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }
    
    // Italic with _
    const italicMatch2 = remaining.match(/^_([^_]+)_/)
    if (italicMatch2) {
      tokens.push({
        type: 'em',
        content: italicMatch2[1],
        children: parseInline(italicMatch2[1])
      })
      remaining = remaining.slice(italicMatch2[0].length)
      continue
    }
    
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      tokens.push({
        type: 'code',
        content: codeMatch[1]
      })
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }
    
    // Plain text - consume until next special character or end
    const textMatch = remaining.match(/^[^*_`\[!~]+/)
    if (textMatch) {
      tokens.push({
        type: 'text',
        content: textMatch[0]
      })
      remaining = remaining.slice(textMatch[0].length)
      continue
    }
    
    // If nothing matched, consume one character
    tokens.push({
      type: 'text',
      content: remaining[0]
    })
    remaining = remaining.slice(1)
  }
  
  return tokens
}

// Utility to check if an image URL is valid
export function isValidImageUrl(src: string | undefined): boolean {
  if (!src || src.trim() === '' || src === '#' || src.startsWith('data:image/gif;base64,R0lGOD')) {
    return false
  }
  return true
}

// Resolve relative URLs to absolute URLs
export function resolveUrl(href: string, baseUrl?: string): string | null {
  if (!href) return null
  
  // Already absolute
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href
  }
  
  // Skip file:// URLs
  if (href.startsWith('file://')) {
    return null
  }
  
  // Protocol-relative URLs
  if (href.startsWith('//')) {
    return `https:${href}`
  }
  
  // Resolve relative URLs
  if (baseUrl) {
    try {
      const base = new URL(baseUrl)
      if (href.startsWith('/')) {
        return `${base.protocol}//${base.host}${href}`
      } else {
        const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1)
        return `${base.protocol}//${base.host}${basePath}${href}`
      }
    } catch {
      return null
    }
  }
  
  return null
}

