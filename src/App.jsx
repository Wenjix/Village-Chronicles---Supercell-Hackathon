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
import ResumeModal from './components/ui/ResumeModal'
import useStore from './store/useStore'
import { startBackgroundMusic } from './utils/sounds'

export default function App() {
  const tick = useStore((s) => s.tick)
  const gameOver = useStore((s) => s.gameOver)
  const startNewGame = useStore((s) => s.startNewGame)
  const hasHydrated = useStore((s) => s._hasHydrated)
  const gameStarted = useStore((s) => s._gameStarted)
  const saveLoaded = useStore((s) => s._saveLoaded)

  // Wait for hydration, then auto-start if no save exists (new player)
  useEffect(() => {
    if (!hasHydrated) return
    if (!saveLoaded && !gameStarted) {
      // New player — startNewGame spawns initial nodes
      useStore.getState().startNewGame()
    }
  }, [hasHydrated, saveLoaded, gameStarted])

  // Tick loop only runs once game is started
  useEffect(() => {
    if (!gameStarted) return
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [gameStarted, tick])

  useEffect(() => {
    if (!gameStarted) return
    void startBackgroundMusic()
  }, [gameStarted])

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
      <ResumeModal />
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
              onClick={startNewGame}
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
