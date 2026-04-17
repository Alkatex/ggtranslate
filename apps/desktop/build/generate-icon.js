const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const size = 512
const canvas = createCanvas(size, size)
const ctx = canvas.getContext('2d')

// Fond noir gaming
ctx.fillStyle = '#06080f'
ctx.beginPath()
ctx.roundRect(0, 0, size, size, 80)
ctx.fill()

// Cercle gradient cyan
const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 200)
gradient.addColorStop(0, 'rgba(6,182,212,0.3)')
gradient.addColorStop(1, 'rgba(6,182,212,0)')
ctx.fillStyle = gradient
ctx.beginPath()
ctx.arc(256, 256, 200, 0, Math.PI * 2)
ctx.fill()

// Manette stylisée
ctx.strokeStyle = '#06b6d4'
ctx.lineWidth = 12
ctx.lineCap = 'round'
ctx.lineJoin = 'round'

// Corps manette
ctx.beginPath()
ctx.moveTo(140, 220)
ctx.bezierCurveTo(100, 200, 90, 160, 110, 140)
ctx.lineTo(180, 130)
ctx.lineTo(210, 110)
ctx.lineTo(302, 110)
ctx.lineTo(332, 130)
ctx.lineTo(400, 140)
ctx.bezierCurveTo(420, 160, 412, 200, 372, 220)
ctx.bezierCurveTo(380, 280, 360, 340, 320, 360)
ctx.bezierCurveTo(300, 375, 276, 380, 256, 380)
ctx.bezierCurveTo(236, 380, 212, 375, 192, 360)
ctx.bezierCurveTo(152, 340, 132, 280, 140, 220)
ctx.stroke()

// Croix directionnelle
ctx.fillStyle = '#06b6d4'
ctx.fillRect(148, 230, 50, 16)
ctx.fillRect(164, 214, 16, 50)

// Boutons
const buttons = [
  { x: 330, y: 230, color: '#22c55e' },
  { x: 356, y: 210, color: '#06b6d4' },
  { x: 356, y: 250, color: '#ef4444' },
  { x: 382, y: 230, color: '#f59e0b' },
]
buttons.forEach(b => {
  ctx.fillStyle = b.color
  ctx.beginPath()
  ctx.arc(b.x, b.y, 10, 0, Math.PI * 2)
  ctx.fill()
})

// Texte GG
ctx.fillStyle = '#06b6d4'
ctx.font = 'bold 72px Arial'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('GG', 256, 300)

// Bordure cyan
ctx.strokeStyle = '#06b6d4'
ctx.lineWidth = 6
ctx.beginPath()
ctx.roundRect(3, 3, size - 6, size - 6, 78)
ctx.stroke()

// Sauvegarder
const buffer = canvas.toBuffer('image/png')
fs.writeFileSync(path.join(__dirname, 'icon.png'), buffer)
console.log('✅ Icône générée : build/icon.png')