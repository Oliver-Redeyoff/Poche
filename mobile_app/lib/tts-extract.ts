import { tokenize, parseInline, Token } from '@poche/shared'

export interface TtsSegment {
  index: number      // position in flat array
  text: string       // plain text to speak
  tokenIndex: number // corresponding token index in tokens[]
}

function inlineToText(content: string): string {
  return parseInline(content)
    .filter(t => t.type !== 'image')
    .map(t => t.content)
    .join('')
    .trim()
}

export function extractTtsSegments(tokens: Token[]): TtsSegment[] {
  const segments: TtsSegment[] = []

  tokens.forEach((token, tokenIndex) => {
    switch (token.type) {
      case 'paragraph':
      case 'heading': {
        const text = inlineToText(token.content)
        if (text) {
          segments.push({ index: segments.length, text, tokenIndex })
        }
        break
      }
      case 'list': {
        if (token.items && token.items.length > 0) {
          const text = token.items
            .map(item => inlineToText(item))
            .filter(Boolean)
            .join('. ')
          if (text) {
            segments.push({ index: segments.length, text, tokenIndex })
          }
        }
        break
      }
      case 'blockquote': {
        const innerTokens = tokenize(token.content)
        innerTokens.forEach(inner => {
          if (inner.type === 'paragraph' || inner.type === 'heading') {
            const text = inlineToText(inner.content)
            if (text) {
              segments.push({ index: segments.length, text, tokenIndex })
            }
          }
        })
        break
      }
      // skip: code_block, image, hr, table
    }
  })

  return segments
}
