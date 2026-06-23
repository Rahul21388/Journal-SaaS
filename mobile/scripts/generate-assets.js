// mobile/scripts/generate-assets.js
// Generates placeholder PNG assets for the Expo app.
// Run with: node scripts/generate-assets.js  (from the mobile/ directory)
// Requires: npm install canvas

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const ASSETS_DIR = path.join(__dirname, '..', 'assets')
const BG = '#020617'
const FG = '#ffffff'

const ASSETS = [
  { name: 'icon.png',          width: 1024, height: 1024 },
  { name: 'adaptive-icon.png', width: 1024, height: 1024 },
  { name: 'splash.png',        width: 1284, height: 2778 },
  { name: 'favicon.png',       width: 32,   height: 32   },
]

function drawAsset({ name, width, height }) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, width, height)

  const isSmall = width <= 64
  const isSplash = height > width

  if (isSmall) {
    // favicon — just a white square with "DJ" at tiny size
    ctx.fillStyle = FG
    ctx.font = `bold ${Math.floor(width * 0.45)}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('DJ', width / 2, height / 2)
  } else {
    // Draw a rounded rectangle as a "notebook" shape
    const pad   = Math.floor(width * 0.18)
    const rw    = width  - pad * 2
    const rh    = isSplash ? Math.floor(width * 0.64) : height - pad * 2
    const rx    = pad
    const ry    = Math.floor(height / 2 - rh / 2)
    const r     = Math.floor(rw * 0.12)

    // Card background
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.moveTo(rx + r, ry)
    ctx.lineTo(rx + rw - r, ry)
    ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r)
    ctx.lineTo(rx + rw, ry + rh - r)
    ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r)
    ctx.lineTo(rx + r, ry + rh)
    ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r)
    ctx.lineTo(rx, ry + r)
    ctx.arcTo(rx, ry, rx + r, ry, r)
    ctx.closePath()
    ctx.fill()

    // Spine line on the left
    ctx.fillStyle = '#6366f1'
    ctx.fillRect(rx, ry, Math.floor(rw * 0.055), rh)

    // "DJ" text centred on card
    const fontSize = Math.floor(rw * 0.38)
    ctx.fillStyle = FG
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('DJ', width / 2 + Math.floor(rw * 0.03), height / 2)

    // Subtitle text (skip for small-ish icons)
    if (width >= 512 && !isSplash) {
      ctx.fillStyle = '#6366f1'
      ctx.font = `${Math.floor(fontSize * 0.18)}px sans-serif`
      ctx.fillText('Daily Journal', width / 2 + Math.floor(rw * 0.03), height / 2 + Math.floor(fontSize * 0.55))
    }

    if (isSplash) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = `${Math.floor(width * 0.055)}px sans-serif`
      ctx.fillText('Daily Journal', width / 2, height / 2 + Math.floor(rw * 0.25))
    }
  }

  const out = path.join(ASSETS_DIR, name)
  const buf = canvas.toBuffer('image/png')
  fs.writeFileSync(out, buf)
  console.log(`✓ ${name}  (${width}×${height})  →  ${out}`)
}

fs.mkdirSync(ASSETS_DIR, { recursive: true })
ASSETS.forEach(drawAsset)
console.log('\nAll assets generated.')
