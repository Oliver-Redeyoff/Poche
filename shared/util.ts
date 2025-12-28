export function tagToColor(tag: string): string {
  // Hash the tag to a number
  const hash = tag.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  // Map the hash to a color
  return `#${hash.toString(16).padStart(6, '0')}`
}