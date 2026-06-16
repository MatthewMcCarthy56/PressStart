import { useState, useRef, useLayoutEffect } from 'react'

export default function LandingPage({ onYes }) {
  const [noPos, setNoPos] = useState(null) // null = in flow, {x,y,w,h} = fixed
  const btnRef = useRef(null)

  // Capture the button's natural position then lock it as fixed — runs before paint so no flash
  useLayoutEffect(() => {
    if (btnRef.current && !noPos) {
      const rect = btnRef.current.getBoundingClientRect()
      setNoPos({ x: rect.left, y: rect.top, w: rect.width, h: rect.height })
    }
  }, [])

  const handleMouseEnter = (e) => {
    const { w, h } = noPos
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 40
    const mx = e.clientX
    const my = e.clientY

    let newX, newY, attempts = 0
    do {
      newX = margin + Math.random() * (vw - w - margin * 2)
      newY = margin + Math.random() * (vh - h - margin * 2)
      attempts++
    } while (
      attempts < 15 &&
      Math.hypot(newX + w / 2 - mx, newY + h / 2 - my) < 200
    )

    setNoPos((prev) => ({ ...prev, x: newX, y: newY }))
  }

  return (
    <div className="landing">
      <div className="scanlines" />
      <div className="landing-content">
        <div className="pixel-border">
          <p className="press-blink">PRESS START TO CONTINUE</p>
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
              ▶ YES
            </button>

            {/* Placeholder keeps layout stable once No goes fixed */}
            {noPos && (
              <div style={{ width: noPos.w, height: noPos.h, flexShrink: 0 }} />
            )}

            <button
              ref={btnRef}
              className="btn btn-no"
              style={
                noPos
                  ? {
                      position: 'fixed',
                      left: noPos.x,
                      top: noPos.y,
                      transition: 'left 0.15s ease, top 0.15s ease',
                      zIndex: 50,
                    }
                  : {}
              }
              onMouseEnter={noPos ? handleMouseEnter : undefined}
            >
              NO
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
