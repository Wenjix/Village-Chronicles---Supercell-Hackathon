import { useEffect } from 'react'
import GameScene from './components/3d/GameScene'
import TopBar from './components/ui/TopBar'
import Chronicle from './components/ui/Chronicle'
import ChatBox from './components/ui/ChatBox'
import BuildMenu from './components/ui/BuildMenu'
import BuildingInfo from './components/ui/BuildingInfo'
import NodeInfo from './components/ui/NodeInfo'
import EnemyInfo from './components/ui/EnemyInfo'
import PlotNavigator from './components/ui/PlotNavigator'
import WandererInterview from './components/ui/WandererInterview'
import Tutorial from './components/ui/Tutorial'
import useStore from './store/useStore'

export default function App() {
  const tick = useStore((s) => s.tick)
  const spawnNodes = useStore((s) => s.spawnNodes)
  const gameOver = useStore((s) => s.gameOver)

  useEffect(() => {
    spawnNodes(0, 0, 5)
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick, spawnNodes])

  return (
    <div className="w-full h-full relative">
      <GameScene />
      <TopBar />
      <Chronicle />
      <BuildMenu />
      <BuildingInfo />
      <NodeInfo />
      <EnemyInfo />
      <PlotNavigator />
      <WandererInterview />
      <ChatBox />
      <Tutorial />
      {gameOver && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="font-uncial text-5xl text-red-500 mb-4 drop-shadow-lg">
              Village Fallen
            </h1>
            <p className="text-amber-300/80 text-lg mb-8 max-w-md mx-auto">
              The raiders have overwhelmed your settlement. All citizens have perished and the village lies in ruin.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-amber-900/80 border-2 border-amber-500 text-amber-200 rounded font-bold text-lg hover:bg-amber-800/80 transition-colors shadow-lg"
            >
              Start Anew
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
