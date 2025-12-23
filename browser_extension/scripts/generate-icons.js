// Simple script to generate placeholder PNG icons
// This creates simple colored square icons as placeholders

const fs = require('fs')
const path = require('path')

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Try to use canvas, fallback to simple colored squares
let createPNGIcon
try {
  const { createCanvas } = require('canvas')
  
  createPNGIcon = (size, color = '#0a7ea4') => {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')
    
    // Draw background
    ctx.fillStyle = color
    ctx.fillRect(0, 0, size, size)
    
    // Draw "P" letter
    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.floor(size * 0.5)}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('P', size / 2, size / 2)
    
    return canvas.toBuffer('image/png')
  }
} catch (error) {
  // Fallback: create simple colored PNG using base64
  console.log('Canvas not available, using simple placeholder...')
  
  // Simple 1x1 pixel PNG with color (scaled)
  // This is a minimal PNG for a solid color
  createPNGIcon = (size, color = '#0a7ea4') => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    
    // Create a minimal PNG (this is a simplified approach)
    // For a proper implementation, we'd use a PNG encoder
    // For now, create a simple data URI approach or use a library
    
    // Actually, let's create a very simple approach - create SVG and note it needs conversion
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${Math.floor(size * 0.4)}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">P</text>
</svg>`
    return Buffer.from(svg)
  }
}

// Generate icons
const sizes = [16, 48, 128]
sizes.forEach(size => {
  try {
    const buffer = createPNGIcon(size)
    const filename = path.join(iconsDir, `icon${size}.png`)
    fs.writeFileSync(filename, buffer)
    console.log(`✅ Created ${filename}`)
  } catch (error) {
    console.error(`❌ Error creating icon${size}.png:`, error.message)
    // Create a simple text file as fallback
    const filename = path.join(iconsDir, `icon${size}.png.txt`)
    fs.writeFileSync(filename, `Placeholder icon ${size}x${size}\nReplace this with an actual PNG file.`)
    console.log(`   Created placeholder file: ${filename}`)
  }
})

console.log('\n✅ Icon generation complete!')
console.log('Note: If canvas package is not installed, run: npm install')

