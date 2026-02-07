import { useEffect } from 'react'
import GameScene from './components/3d/GameScene'
import TopBar from './components/ui/TopBar'
import Chronicle from './components/ui/Chronicle'
import ChatBox from './components/ui/ChatBox'
import BuildMenu from './components/ui/BuildMenu'
import BuildingInfo from './components/ui/BuildingInfo'
import useStore from './store/useStore'

export default function App() {
  const tick = useStore((s) => s.tick)

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <div className="w-full h-full relative">
      <GameScene />
      <TopBar />
      <Chronicle />
      <BuildMenu />
      <BuildingInfo />
      <ChatBox />
    </div>
  )
}
