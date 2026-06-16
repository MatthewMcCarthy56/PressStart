import { useState } from 'react'
import LandingPage from './LandingPage'
import MiniGame from './MiniGame'
import QuestComplete from './QuestComplete'
import './App.css'

export default function App() {
  const [screen, setScreen] = useState('landing')

  return (
    <div className="app">
      {screen === 'landing' && <LandingPage onYes={() => setScreen('game')} />}
      {screen === 'game' && <MiniGame onWin={() => setScreen('complete')} />}
      {screen === 'complete' && <QuestComplete />}
    </div>
  )
}
