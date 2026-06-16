import { useEffect, useState } from 'react'

const RSVP_URL = 'https://theannoyance.thundertix.com/events/267051' // Replace with actual RSVP link

export default function QuestComplete() {
  const [show, setShow] = useState(false)
  const [starField, setStarField] = useState([])

  useEffect(() => {
    const stars = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2,
    }))
    setStarField(stars)
    const t = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="complete-screen">
      <div className="scanlines" />

      {starField.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      <div className={`complete-content ${show ? 'show' : ''}`}>
        <div className="trophy">🏆</div>
        <p className="quest-label">― QUEST COMPLETE ―</p>
        <h1 className="complete-title">ACHIEVEMENT<br />UNLOCKED!</h1>
        <div className="achievement-box">
          <span className="achievement-icon">🎮</span>
          <div>
            <p className="achievement-name">PRESS START ATTENDEE</p>
            <p className="achievement-desc">You defeated the NO button and conquered BREAKOUT</p>
          </div>
        </div>
        <p className="reward-text">YOUR REWARD: AN OFFICIAL RSVP</p>
        <a
          href={RSVP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-rsvp"
        >
          ▶ RSVP TO PRESS START
        </a>
        <p className="exp-text">+500 XP &nbsp;|&nbsp; RANK UP: CONFIRMED ATTENDEE</p>
      </div>
    </div>
  )
}
