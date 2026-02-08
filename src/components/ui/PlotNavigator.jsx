import { motion } from 'framer-motion'
import useStore from '../../store/useStore'

export default function PlotNavigator() {
  const unlockedPlots = useStore((s) => s.unlockedPlots)
  const cameraTarget = useStore((s) => s.cameraTarget)
  const focusPlot = useStore((s) => s.focusPlot)

  if (unlockedPlots.length <= 1) return null

  // Find which plot is currently focused
  const PLOT_SIZE = 8
  const CELL_SIZE = 1.2
  const offset = ((PLOT_SIZE - 1) * CELL_SIZE) / 2
  const focusedPx = Math.round((cameraTarget.x + offset) / CELL_SIZE / PLOT_SIZE - 0.5 + 0.5 / PLOT_SIZE)
  const focusedPy = Math.round((cameraTarget.z + offset) / CELL_SIZE / PLOT_SIZE - 0.5 + 0.5 / PLOT_SIZE)

  // Compute bounding box of plots for layout
  const minX = Math.min(...unlockedPlots.map(p => p.x))
  const maxX = Math.max(...unlockedPlots.map(p => p.x))
  const minY = Math.min(...unlockedPlots.map(p => p.y))
  const maxY = Math.max(...unlockedPlots.map(p => p.y))

  const cols = maxX - minX + 1
  const rows = maxY - minY + 1
  const cellPx = 32

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="fixed bottom-4 left-4 z-[110] pointer-events-auto"
    >
      <div className="bg-black/80 border-2 border-brass-dim/50 rounded-lg p-2 shadow-xl">
        <div className="text-[9px] uppercase tracking-widest text-amber-600/80 font-bold mb-1 text-center">
          Territories
        </div>
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
          }}
        >
          {Array.from({ length: rows }, (_, ry) =>
            Array.from({ length: cols }, (_, cx) => {
              const px = minX + cx
              const py = minY + ry
              const isUnlocked = unlockedPlots.some(p => p.x === px && p.y === py)
              const isFocused = px === focusedPx && py === focusedPy

              if (!isUnlocked) {
                return <div key={`${px},${py}`} className="w-full h-full" />
              }

              return (
                <button
                  key={`${px},${py}`}
                  onClick={() => focusPlot(px, py)}
                  className={`w-full h-full rounded border text-[10px] font-bold transition-all duration-200 cursor-pointer
                    ${isFocused
                      ? 'bg-amber-700/60 border-amber-400 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                      : 'bg-zinc-800/60 border-zinc-600/50 text-zinc-400 hover:bg-zinc-700/60 hover:border-amber-600/50 hover:text-amber-300'
                    }`}
                  title={`Plot (${px}, ${py})`}
                >
                  {px},{py}
                </button>
              )
            })
          )}
        </div>
      </div>
    </motion.div>
  )
}
