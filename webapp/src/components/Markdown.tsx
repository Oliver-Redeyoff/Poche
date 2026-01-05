import { useMemo, useCallback, ReactNode, useState } from 'react'
import './Markdown.css'

// Types for the markdown component
export interface MarkdownProps {
  children: string
  baseUrl?: string
  className?: string
}

// Token types for the parser
type TokenType = 
  | 'heading'
  | 'paragraph'
  | 'code_block'
  | 'blockquote'
  | 'list'
  | 'hr'
  | 'table'
  | 'image'

interface Token {
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
type InlineType = 'text' | 'strong' | 'em' | 'code' | 'link' | 'image' | 'strikethrough'

interface InlineToken {
  type: InlineType
  content: string
  href?: string
  src?: string
  alt?: string
  children?: InlineToken[]
}

// Parse markdown into block tokens
function tokenize(markdown: string): Token[] {
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
function parseInline(text: string): InlineToken[] {
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

// Image component with error handling
function MarkdownImage({ src, alt }: { src: string; alt?: string }) {
  const [hasError, setHasError] = useState(false)
  const [isTooSmall, setIsTooSmall] = useState(false)
  
  // Skip invalid URLs
  if (!src || src.trim() === '' || src === '#' || src.startsWith('data:image/gif;base64,R0lGOD')) {
    return null
  }
  
  if (hasError || isTooSmall) {
    return null
  }
  
  return (
    <figure className="markdown-image">
      <img
        src={src}
        alt={alt || ''}
        onLoad={(e) => {
          const img = e.target as HTMLImageElement
          if (img.naturalWidth < 50 || img.naturalHeight < 50) {
            setIsTooSmall(true)
          }
        }}
        onError={() => setHasError(true)}
      />
      {alt && <figcaption>{alt}</figcaption>}
    </figure>
  )
}

// The Markdown component
export function Markdown({ children, baseUrl, className }: MarkdownProps) {
  // Parse markdown content
  const tokens = useMemo(() => tokenize(children), [children])
  
  // Resolve relative URLs
  const resolveUrl = useCallback((href: string): string | null => {
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
  }, [baseUrl])
  
  // Render inline tokens to React elements
  const renderInline = useCallback((tokens: InlineToken[], parentKey: string): ReactNode[] => {
    return tokens.map((token, index) => {
      const key = `${parentKey}-${index}`
      
      switch (token.type) {
        case 'text':
          return <span key={key}>{token.content}</span>
          
        case 'strong':
          return (
            <strong key={key}>
              {token.children ? renderInline(token.children, key) : token.content}
            </strong>
          )
          
        case 'em':
          return (
            <em key={key}>
              {token.children ? renderInline(token.children, key) : token.content}
            </em>
          )
          
        case 'strikethrough':
          return (
            <del key={key}>
              {token.children ? renderInline(token.children, key) : token.content}
            </del>
          )
          
        case 'code':
          return (
            <code key={key} className="inline-code">
              {token.content}
            </code>
          )
          
        case 'link': {
          const url = resolveUrl(token.href || '')
          return (
            <a 
              key={key} 
              href={url || token.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {token.children ? renderInline(token.children, key) : token.content}
            </a>
          )
        }
          
        case 'image':
          return token.src ? (
            <MarkdownImage key={key} src={token.src} alt={token.alt} />
          ) : null
          
        default:
          return null
      }
    })
  }, [resolveUrl])
  
  // Render a block token
  const renderBlock = useCallback((token: Token, index: number): ReactNode => {
    const key = `block-${index}`
    
    switch (token.type) {
      case 'heading': {
        const HeadingTag = `h${token.level || 1}` as keyof JSX.IntrinsicElements
        return (
          <HeadingTag key={key}>
            {renderInline(parseInline(token.content), key)}
          </HeadingTag>
        )
      }
        
      case 'paragraph':
        return (
          <p key={key}>
            {renderInline(parseInline(token.content), key)}
          </p>
        )
        
      case 'code_block':
        return (
          <pre key={key} className="code-block">
            <code className={token.language ? `language-${token.language}` : ''}>
              {token.content}
            </code>
          </pre>
        )
        
      case 'blockquote': {
        const quoteTokens = tokenize(token.content)
        return (
          <blockquote key={key}>
            {quoteTokens.map((t, i) => renderBlock(t, i))}
          </blockquote>
        )
      }
        
      case 'list': {
        const ListTag = token.ordered ? 'ol' : 'ul'
        return (
          <ListTag key={key}>
            {token.items?.map((item, i) => (
              <li key={`${key}-item-${i}`}>
                {renderInline(parseInline(item), `${key}-item-${i}`)}
              </li>
            ))}
          </ListTag>
        )
      }
        
      case 'hr':
        return <hr key={key} />
        
      case 'table':
        return (
          <div key={key} className="table-wrapper">
            <table>
              {token.hasHeader && token.rows && token.rows.length > 0 && (
                <thead>
                  <tr>
                    {token.rows[0].map((cell, cellIndex) => (
                      <th key={`${key}-th-${cellIndex}`}>
                        {renderInline(parseInline(cell), `${key}-th-${cellIndex}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {token.rows?.slice(token.hasHeader ? 1 : 0).map((row, rowIndex) => (
                  <tr key={`${key}-tr-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${key}-td-${rowIndex}-${cellIndex}`}>
                        {renderInline(parseInline(cell), `${key}-td-${rowIndex}-${cellIndex}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        
      case 'image':
        return token.src ? (
          <MarkdownImage key={key} src={token.src} alt={token.alt} />
        ) : null
        
      default:
        return null
    }
  }, [renderInline])
  
  return (
    <div className={`markdown-content ${className || ''}`}>
      {tokens.map((token, index) => renderBlock(token, index))}
    </div>
  )
}

export default Markdown

