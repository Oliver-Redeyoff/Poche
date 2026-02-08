// Shared utilities for Poche applications

import type { ArticleStatus } from './types'

/**
 * Derives the reading status from the reading progress percentage.
 * 
 * @param readingProgress - Reading progress 0-100
 * @returns 'new' if 0, 'finished' if 100, 'reading' otherwise
 */
export function getArticleStatus(readingProgress: number): ArticleStatus {
  if (readingProgress === 0) return 'new'
  if (readingProgress === 100) return 'finished'
  return 'reading'
}

const uniqueColors = [
  [230, 25, 75],
  [60, 180, 75],
  [0, 130, 200],
  [245, 130, 48],
  [145, 30, 180],
  [240, 50, 230],
  [250, 140, 212],
  [0, 128, 128],
  [170, 110, 40],
  [158, 0, 0],
  [128, 128, 0],
] as const

/**
 * Generates a consistent color for a tag based on its name.
 * The same tag will always produce the same color.
 * 
 * @param tag - The tag name to generate a color for
 * @param opacity - Optional opacity value between 0 and 1 (default: 1.0)
 * @returns An rgba color string
 */
export function tagToColor(tag: string, opacity: number = 1.0): string {
  // Hash the tag to a number
  const hash = tag.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  // Select a color from uniqueColors array based on hash
  const colorIndex = hash % uniqueColors.length
  const [r, g, b] = uniqueColors[colorIndex]
  
  // Return rgba color with opacity
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

