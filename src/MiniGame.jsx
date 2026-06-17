import { useEffect, useRef, useState } from 'react'

const CANVAS_W = 480
const CANVAS_H = 520
const PADDLE_W = 80
const PADDLE_H = 12
const BALL_R = 8
const BRICK_W = 110
const BRICK_H = 40
const BRICK_PAD = 30
const BRICK_OFFSET_TOP = 110
// 3 × 110 + 2 × 30 = 390 → center in 480
const BRICK_OFFSET_LEFT = (CANVAS_W - 3 * BRICK_W - 2 * BRICK_PAD) / 2

function makeBricks() {
  const colors = ['#ff004d', '#ffec27', '#00e436']
  return colors.map((color, c) => ({
    x: BRICK_OFFSET_LEFT + c * (BRICK_W + BRICK_PAD),
    y: BRICK_OFFSET_TOP,
    alive: true,
    color,
    points: 100,
  }))
}

export default function MiniGame({ onWin }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const onWinRef = useRef(onWin)
  const [status, setStatus] = useState('playing') // playing | dead
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)

  useEffect(() => { onWinRef.current = onWin }, [onWin])

  function initState() {
    return {
      paddle: { x: CANVAS_W / 2 - PADDLE_W / 2, y: CANVAS_H - 36 },
      ball: { x: CANVAS_W / 2, y: CANVAS_H - 60, vx: 3, vy: -4 },
      bricks: makeBricks(),
      score: 0,
      lives: 3,
      status: 'playing',
      mouseX: CANVAS_W / 2,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    stateRef.current = initState()

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      stateRef.current.mouseX = (e.clientX - rect.left) * (CANVAS_W / rect.width)
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      stateRef.current.mouseX = (touch.clientX - rect.left) * (CANVAS_W / rect.width)
    }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })

    function draw() {
      const s = stateRef.current
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // Grid lines
      ctx.strokeStyle = '#1a1a3a'
      ctx.lineWidth = 1
      for (let x = 0; x < CANVAS_W; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
      }
      for (let y = 0; y < CANVAS_H; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
      }

      // Bricks
      s.bricks.forEach((b) => {
        if (!b.alive) return
        ctx.fillStyle = b.color
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.strokeRect(b.x, b.y, BRICK_W, BRICK_H)
        // shine
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillRect(b.x + 3, b.y + 3, BRICK_W - 6, 4)
      })

      // Paddle
      ctx.fillStyle = '#29adff'
      ctx.fillRect(s.paddle.x, s.paddle.y, PADDLE_W, PADDLE_H)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(s.paddle.x + 4, s.paddle.y + 3, PADDLE_W - 8, 4)

      // Ball
      ctx.beginPath()
      ctx.arc(s.ball.x, s.ball.y, BALL_R, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#aaaaff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Border
      ctx.strokeStyle = '#29adff'
      ctx.lineWidth = 3
      ctx.strokeRect(1.5, 1.5, CANVAS_W - 3, CANVAS_H - 3)
    }

    function update() {
      const s = stateRef.current
      if (s.status !== 'playing') return

      // Move paddle
      s.paddle.x = Math.max(0, Math.min(CANVAS_W - PADDLE_W, s.mouseX - PADDLE_W / 2))

      // Move ball
      s.ball.x += s.ball.vx
      s.ball.y += s.ball.vy

      // Wall bounces
      if (s.ball.x - BALL_R <= 0) { s.ball.x = BALL_R; s.ball.vx *= -1 }
      if (s.ball.x + BALL_R >= CANVAS_W) { s.ball.x = CANVAS_W - BALL_R; s.ball.vx *= -1 }
      if (s.ball.y - BALL_R <= 0) { s.ball.y = BALL_R; s.ball.vy *= -1 }

      // Paddle collision
      if (
        s.ball.y + BALL_R >= s.paddle.y &&
        s.ball.y + BALL_R <= s.paddle.y + PADDLE_H + 4 &&
        s.ball.x >= s.paddle.x - BALL_R &&
        s.ball.x <= s.paddle.x + PADDLE_W + BALL_R
      ) {
        const hitPos = (s.ball.x - s.paddle.x) / PADDLE_W // 0-1
        const angle = (hitPos - 0.5) * 2.4 // radians, -1.2 to 1.2
        const speed = Math.sqrt(s.ball.vx ** 2 + s.ball.vy ** 2)
        s.ball.vx = Math.sin(angle) * speed
        s.ball.vy = -Math.abs(Math.cos(angle) * speed)
        s.ball.y = s.paddle.y - BALL_R - 1
      }

      // Brick collisions
      for (const b of s.bricks) {
        if (!b.alive) continue
        if (
          s.ball.x + BALL_R > b.x &&
          s.ball.x - BALL_R < b.x + BRICK_W &&
          s.ball.y + BALL_R > b.y &&
          s.ball.y - BALL_R < b.y + BRICK_H
        ) {
          b.alive = false
          s.score += b.points
          setScore(s.score)

          const overlapLeft = s.ball.x + BALL_R - b.x
          const overlapRight = b.x + BRICK_W - (s.ball.x - BALL_R)
          const overlapTop = s.ball.y + BALL_R - b.y
          const overlapBottom = b.y + BRICK_H - (s.ball.y - BALL_R)
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
          if (minOverlap === overlapTop || minOverlap === overlapBottom) {
            s.ball.vy *= -1
          } else {
            s.ball.vx *= -1
          }
          break
        }
      }

      if (s.bricks.every((b) => !b.alive)) {
        s.status = 'won'
        cancelAnimationFrame(animRef.current)
        onWinRef.current()
        return
      }

      // Ball out of bottom
      if (s.ball.y - BALL_R > CANVAS_H) {
        s.lives -= 1
        setLives(s.lives)
        if (s.lives <= 0) {
          s.status = 'dead'
          setStatus('dead')
        } else {
          s.ball.x = CANVAS_W / 2
          s.ball.y = CANVAS_H - 100
          s.ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1)
          s.ball.vy = -4
        }
      }
    }

    function loop() {
      update()
      draw()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animRef.current)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  const restart = () => {
    stateRef.current = initState()
    setStatus('playing')
    setScore(0)
    setLives(3)
  }

  return (
    <div className="game-screen">
      <div className="scanlines" />
      <div className="game-ui">
        <div className="game-hud">
          <span className="hud-item">SCORE: <span className="hud-val">{score}</span></span>
          <span className="hud-item title-small">BREAKOUT</span>
          <span className="hud-item">LIVES: <span className="hud-val">{'♥ '.repeat(lives).trim()}</span></span>
        </div>
        <div className="canvas-wrap">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="game-canvas"
          />
          {status === 'dead' && (
            <div className="game-overlay">
              <p className="overlay-title red">GAME OVER</p>
              <p className="overlay-sub">SCORE: {score}</p>
              <button className="btn btn-yes" onClick={restart}>▶ TRY AGAIN</button>
            </div>
          )}
        </div>
        <p className="game-tip">{'ontouchstart' in window ? 'TOUCH SCREEN TO CONTROL PADDLE' : 'MOVE MOUSE TO CONTROL PADDLE'}</p>
      </div>
    </div>
  )
}
