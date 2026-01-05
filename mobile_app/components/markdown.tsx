import React, { useMemo, useState, useCallback, ReactNode } from 'react'
import { Text, View, StyleSheet, Linking, TextStyle, ViewStyle, StyleProp } from 'react-native'
import { Image } from 'expo-image'
import { 
  Token, 
  InlineToken, 
  tokenize, 
  parseInline, 
  isValidImageUrl, 
  resolveUrl 
} from '@poche/shared'

// Types for the markdown component
export interface MarkdownStyles {
  body?: TextStyle
  paragraph?: TextStyle
  heading1?: TextStyle
  heading2?: TextStyle
  heading3?: TextStyle
  heading4?: TextStyle
  heading5?: TextStyle
  heading6?: TextStyle
  link?: TextStyle
  strong?: TextStyle
  em?: TextStyle
  blockquote?: ViewStyle
  blockquoteText?: TextStyle
  bullet_list?: ViewStyle
  ordered_list?: ViewStyle
  list_item?: ViewStyle
  list_item_text?: TextStyle
  list_bullet?: TextStyle
  code_inline?: TextStyle
  code_block?: ViewStyle
  code_block_text?: TextStyle
  fence?: ViewStyle
  fence_text?: TextStyle
  image?: ViewStyle
  imageContainer?: ViewStyle
  hr?: ViewStyle
  table?: ViewStyle
  tableRow?: ViewStyle
  tableHeader?: ViewStyle
  tableHeaderCell?: ViewStyle
  tableHeaderCellText?: TextStyle
  tableCell?: ViewStyle
  tableCellText?: TextStyle
  strikethrough?: TextStyle
}

export interface MarkdownProps {
  children: string
  style?: MarkdownStyles
  baseUrl?: string
  onLinkPress?: (url: string) => void
  renderImage?: (props: { src: string; alt?: string; nodeKey: string }) => ReactNode
  minImageWidth?: number
  minImageHeight?: number
}

// Default image component
function DefaultImage({ 
  src, 
  alt, 
  nodeKey,
  minWidth = 50,
  minHeight = 50,
  style
}: { 
  src: string
  alt?: string
  nodeKey: string
  minWidth?: number
  minHeight?: number
  style?: ViewStyle
}) {
  const [hasError, setHasError] = useState(false)
  const [isTooSmall, setIsTooSmall] = useState(false)
  
  if (!isValidImageUrl(src)) {
    return null
  }
  
  if (hasError || isTooSmall) {
    return null
  }
  
  return (
    <View style={[{ marginVertical: 16, width: '100%' }, style]}>
      <Image
        source={{ uri: src }}
        style={{
          width: '100%',
          aspectRatio: 16 / 9,
        }}
        contentFit="contain"
        transition={200}
        onLoad={(event) => {
          const { width, height } = event.source
          if (width < minWidth || height < minHeight) {
            setIsTooSmall(true)
          }
        }}
        onError={() => setHasError(true)}
      />
    </View>
  )
}

// The Markdown component
export function Markdown({ 
  children, 
  style = {}, 
  baseUrl,
  onLinkPress,
  renderImage,
  minImageWidth = 50,
  minImageHeight = 50
}: MarkdownProps) {
  
  // Parse markdown content
  const tokens = useMemo(() => tokenize(children), [children])
  
  // Resolve relative URLs
  const resolveUrlWithBase = useCallback((href: string): string | null => {
    return resolveUrl(href, baseUrl)
  }, [baseUrl])
  
  // Handle link press
  const handleLinkPress = useCallback((href: string) => {
    const url = resolveUrlWithBase(href)
    if (url) {
      if (onLinkPress) {
        onLinkPress(url)
      } else {
        Linking.openURL(url)
      }
    }
  }, [resolveUrlWithBase, onLinkPress])
  
  // Render inline tokens to React elements
  const renderInline = useCallback((tokens: InlineToken[], parentKey: string): ReactNode[] => {
    return tokens.map((token, index) => {
      const key = `${parentKey}-${index}`
      
      switch (token.type) {
        case 'text':
          return <Text key={key}>{token.content}</Text>
          
        case 'strong':
          return (
            <Text key={key} style={[defaultStyles.strong, style.strong]}>
              {token.children ? renderInline(token.children, key) : token.content}
            </Text>
          )
          
        case 'em':
          return (
            <Text key={key} style={[defaultStyles.em, style.em]}>
              {token.children ? renderInline(token.children, key) : token.content}
            </Text>
          )
          
        case 'strikethrough':
          return (
            <Text key={key} style={[defaultStyles.strikethrough, style.strikethrough]}>
              {token.children ? renderInline(token.children, key) : token.content}
            </Text>
          )
          
        case 'code':
          return (
            <Text key={key} style={[defaultStyles.code_inline, style.code_inline]}>
              {token.content}
            </Text>
          )
          
        case 'link':
          return (
            <Text 
              key={key} 
              style={[defaultStyles.link, style.link]}
              onPress={() => token.href && handleLinkPress(token.href)}
            >
              {token.children ? renderInline(token.children, key) : token.content}
            </Text>
          )
          
        case 'image':
          if (renderImage && token.src) {
            return renderImage({ src: token.src, alt: token.alt, nodeKey: key })
          }
          return token.src ? (
            <DefaultImage
              key={key}
              src={token.src}
              alt={token.alt}
              nodeKey={key}
              minWidth={minImageWidth}
              minHeight={minImageHeight}
              style={style.image}
            />
          ) : null
          
        default:
          return null
      }
    })
  }, [style, handleLinkPress, renderImage, minImageWidth, minImageHeight])
  
  // Render a block token
  const renderBlock = useCallback((token: Token, index: number): ReactNode => {
    const key = `block-${index}`
    
    switch (token.type) {
      case 'heading':
        const headingStyles: Record<number, StyleProp<TextStyle>> = {
          1: [defaultStyles.heading1, style.heading1],
          2: [defaultStyles.heading2, style.heading2],
          3: [defaultStyles.heading3, style.heading3],
          4: [defaultStyles.heading4, style.heading4],
          5: [defaultStyles.heading5, style.heading5],
          6: [defaultStyles.heading6, style.heading6],
        }
        return (
          <Text key={key} style={headingStyles[token.level || 1]}>
            {renderInline(parseInline(token.content), key)}
          </Text>
        )
        
      case 'paragraph':
        return (
          <Text key={key} style={[defaultStyles.paragraph, style.paragraph]}>
            {renderInline(parseInline(token.content), key)}
          </Text>
        )
        
      case 'code_block':
        return (
          <View key={key} style={[defaultStyles.code_block, style.code_block || style.fence]}>
            <Text style={[defaultStyles.code_block_text, style.code_block_text || style.fence_text]}>
              {token.content}
            </Text>
          </View>
        )
        
      case 'blockquote':
        const quoteTokens = tokenize(token.content)
        return (
          <View key={key} style={[defaultStyles.blockquote, style.blockquote]}>
            {quoteTokens.map((t, i) => renderBlock(t, i))}
          </View>
        )
        
      case 'list':
        return (
          <View 
            key={key} 
            style={token.ordered 
              ? [defaultStyles.ordered_list, style.ordered_list]
              : [defaultStyles.bullet_list, style.bullet_list]
            }
          >
            {token.items?.map((item, i) => (
              <View key={`${key}-item-${i}`} style={[defaultStyles.list_item, style.list_item]}>
                <Text style={[defaultStyles.list_bullet, style.list_bullet]}>
                  {token.ordered ? `${i + 1}.` : '•'}
                </Text>
                <Text style={[defaultStyles.list_item_text, style.list_item_text]}>
                  {renderInline(parseInline(item), `${key}-item-${i}`)}
                </Text>
              </View>
            ))}
          </View>
        )
        
      case 'hr':
        return <View key={key} style={[defaultStyles.hr, style.hr]} />
        
      case 'table':
        return (
          <View key={key} style={[defaultStyles.table, style.table]}>
            {token.rows?.map((row, rowIndex) => {
              const isHeader = token.hasHeader && rowIndex === 0
              return (
                <View 
                  key={`${key}-row-${rowIndex}`} 
                  style={[
                    defaultStyles.tableRow, 
                    style.tableRow,
                    isHeader && [defaultStyles.tableHeader, style.tableHeader]
                  ]}
                >
                  {row.map((cell, cellIndex) => (
                    <View 
                      key={`${key}-cell-${rowIndex}-${cellIndex}`}
                      style={[
                        isHeader 
                          ? [defaultStyles.tableHeaderCell, style.tableHeaderCell]
                          : [defaultStyles.tableCell, style.tableCell],
                        { flex: 1 }
                      ]}
                    >
                      <Text style={isHeader 
                        ? [defaultStyles.tableHeaderCellText, style.tableHeaderCellText]
                        : [defaultStyles.tableCellText, style.tableCellText]
                      }>
                        {renderInline(parseInline(cell), `${key}-cell-${rowIndex}-${cellIndex}`)}
                      </Text>
                    </View>
                  ))}
                </View>
              )
            })}
          </View>
        )
        
      case 'image':
        if (renderImage && token.src) {
          return renderImage({ src: token.src, alt: token.alt, nodeKey: key })
        }
        return token.src ? (
          <DefaultImage
            key={key}
            src={token.src}
            alt={token.alt}
            nodeKey={key}
            minWidth={minImageWidth}
            minHeight={minImageHeight}
            style={style.image}
          />
        ) : null
        
      default:
        return null
    }
  }, [style, renderInline, renderImage, minImageWidth, minImageHeight])
  
  return (
    <View style={[defaultStyles.body, style.body as ViewStyle]}>
      {tokens.map((token, index) => renderBlock(token, index))}
    </View>
  )
}

// Default styles
const defaultStyles = StyleSheet.create({
  body: {
    flex: 1,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginVertical: 8,
    color: '#1a1a1a',
  },
  heading1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    color: '#1a1a1a',
  },
  heading2: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  heading3: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 10,
    color: '#1a1a1a',
  },
  heading4: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  heading5: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#1a1a1a',
  },
  heading6: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
    color: '#666666',
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  code_inline: {
    fontFamily: 'Menlo',
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
  },
  code_block_text: {
    fontFamily: 'Menlo',
    fontSize: 14,
    color: '#1a1a1a',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
    paddingLeft: 16,
    marginVertical: 12,
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    borderRadius: 4,
  },
  bullet_list: {
    marginVertical: 12,
  },
  ordered_list: {
    marginVertical: 12,
  },
  list_item: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingRight: 16,
  },
  list_bullet: {
    width: 24,
    fontSize: 16,
    color: '#666',
  },
  list_item_text: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a',
  },
  hr: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 24,
  },
  table: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginVertical: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableHeaderCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  tableHeaderCellText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#1a1a1a',
  },
  tableCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  tableCellText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
})

export default Markdown
