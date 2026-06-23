const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const assetsDir = path.join(__dirname, '..', 'assets')
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir)

function generateImage(filename, width, height) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.floor(width * 0.2)}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('DJ', width / 2, height / 2)

  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(assetsDir, filename), buffer)
  console.log(`Created ${filename} (${width}x${height})`)
}

generateImage('icon.png', 1024, 1024)
generateImage('adaptive-icon.png', 1024, 1024)
generateImage('splash.png', 1284, 2778)
generateImage('favicon.png', 32, 32)

console.log('All assets generated.')
