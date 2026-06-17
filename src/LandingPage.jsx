import { useState, useRef, useEffect, useLayoutEffect } from 'react'

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0

export default function LandingPage({ onYes }) {
  const [isFixed, setIsFixed] = useState(false)
  const btnRef = useRef(null)
  const s = useRef({
    x: 0, y: 0,
    vx: 0, vy: 0,
    w: 0, h: 0,
    ox: 0, oy: 0,
    mx: -1000, my: -1000,
    t0: null,
  })

  // Desktop only: capture natural position before paint, then go fixed
  useLayoutEffect(() => {
    if (isMobile) return
    const btn = btnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    s.current.x = rect.left
    s.current.y = rect.top
    s.current.w = rect.width
    s.current.h = rect.height
    s.current.ox = rect.left + rect.width / 2
    s.current.oy = rect.top + rect.height / 2
    setIsFixed(true)
  }, [])

  // Desktop only: floating/fleeing animation
  useEffect(() => {
    if (!isFixed || isMobile) return
    const st = s.current

    const onMouseMove = (e) => {
      st.mx = e.clientX
      st.my = e.clientY
    }
    window.addEventListener('mousemove', onMouseMove)

    let animId
    const tick = (ts) => {
      if (st.t0 === null) st.t0 = ts
      const t = (ts - st.t0) / 1000

      const vw = window.innerWidth
      const vh = window.innerHeight
      const PAD = 40
      const FLEE_RADIUS = 180

      const bcx = st.x + st.w / 2
      const bcy = st.y + st.h / 2
      const dist = Math.hypot(bcx - st.mx, bcy - st.my)

      let ax = 0, ay = 0

      if (dist < FLEE_RADIUS) {
        const dx = bcx - st.mx || 0.1
        const dy = bcy - st.my || 0.1
        const len = Math.hypot(dx, dy)
        const force = ((FLEE_RADIUS - dist) / FLEE_RADIUS) ** 1.5 * 28
        ax = (dx / len) * force
        ay = (dy / len) * force
      } else {
        const radius = 18
        const speed = 0.4
        const tx = st.ox + Math.cos(t * speed) * radius
        const ty = st.oy + Math.sin(t * speed) * radius
        ax = (tx - st.w / 2 - st.x) * 0.008
        ay = (ty - st.h / 2 - st.y) * 0.008
      }

      const WALL_ZONE = 120
      const wallF = (d) => d < WALL_ZONE ? ((1 - d / WALL_ZONE) ** 2) * 60 : 0
      ax += wallF(st.x - PAD)
      ax -= wallF(vw - PAD - st.w - st.x)
      ay += wallF(st.y - PAD)
      ay -= wallF(vh - PAD - st.h - st.y)

      st.vx = (st.vx + ax) * 0.87
      st.vy = (st.vy + ay) * 0.87

      let nx = st.x + st.vx
      let ny = st.y + st.vy
      if (nx < PAD)              { nx = PAD;              if (st.vx < 0) st.vx = 0 }
      if (nx + st.w > vw - PAD) { nx = vw - PAD - st.w; if (st.vx > 0) st.vx = 0 }
      if (ny < PAD)              { ny = PAD;              if (st.vy < 0) st.vy = 0 }
      if (ny + st.h > vh - PAD) { ny = vh - PAD - st.h; if (st.vy > 0) st.vy = 0 }
      st.x = nx
      st.y = ny

      if (btnRef.current) {
        btnRef.current.style.left = st.x + 'px'
        btnRef.current.style.top = st.y + 'px'
      }

      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animId)
    }
  }, [isFixed])

  const handleNoClick = () => {
    const st = s.current
    const vw = window.innerWidth
    const vh = window.innerHeight
    const PAD = 40

    // Mobile first tap: capture button size before going fixed
    if (isMobile && !isFixed) {
      const rect = btnRef.current.getBoundingClientRect()
      st.w = rect.width
      st.h = rect.height
    }

    let nx, ny, tries = 0
    do {
      nx = PAD + Math.random() * (vw - st.w - PAD * 2)
      ny = PAD + Math.random() * (vh - st.h - PAD * 2)
      tries++
    } while (tries < 20 && Math.hypot(nx + st.w / 2 - st.mx, ny + st.h / 2 - st.my) < 250)

    st.x = nx
    st.y = ny
    st.vx = 0
    st.vy = 0

    if (btnRef.current) {
      btnRef.current.style.left = nx + 'px'
      btnRef.current.style.top = ny + 'px'
    }

    if (isMobile && !isFixed) setIsFixed(true)
  }

  const { w, h } = s.current

  return (
    <div className="landing">
      <div className="scanlines" />
      <div className="landing-content">
        <div className="pixel-border">
          <p className="press-blink">PRESS YES TO CONTINUE</p>
          <h1 className="title">PRESS START</h1>
          <div className="subtitle-box">
            <p className="subtitle">An Improvised Musical?</p>
          </div>
          <div className="question-box">
            <p className="question">WILL YOU ATTEND</p>
            <p className="question accent">PRESS START?</p>
          </div>
          <div className="buttons">
            <button className="btn btn-yes" onClick={onYes}>
              YES
            </button>

            {/* Placeholder keeps layout stable once No goes fixed */}
            {isFixed && (
              <div style={{ width: w, height: h, flexShrink: 0 }} />
            )}

            <button
              ref={btnRef}
              className="btn btn-no"
              style={
                isFixed
                  ? {
                      position: 'fixed',
                      left: s.current.x,
                      top: s.current.y,
                      zIndex: 180,
                      transition: 'none',
                    }
                  : {}
              }
              onClick={handleNoClick}
            >
              NO
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
