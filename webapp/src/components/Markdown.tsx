import { useMemo, useCallback, ReactNode, useState } from 'react'
import './Markdown.css'
import { 
  Token, 
  InlineToken, 
  tokenize, 
  parseInline, 
  isValidImageUrl, 
  resolveUrl 
} from '@poche/shared'

// Types for the markdown component
export interface MarkdownProps {
  children: string
  baseUrl?: string
  className?: string
}

// Image component with error handling
function MarkdownImage({ src, alt }: { src: string; alt?: string }) {
  const [hasError, setHasError] = useState(false)
  const [isTooSmall, setIsTooSmall] = useState(false)
  
  if (!isValidImageUrl(src)) {
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
  const resolveUrlWithBase = useCallback((href: string): string | null => {
    return resolveUrl(href, baseUrl)
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
          const url = resolveUrlWithBase(token.href || '')
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
  }, [resolveUrlWithBase])
  
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
