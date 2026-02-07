import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { BUILDINGS, BUILDING_TYPES, canAfford } from '../../data/buildings'

const BUILDING_LIST = Object.entries(BUILDINGS).map(([key, val]) => ({
  type: key,
  ...val,
}))

function CostDisplay({ cost }) {
  const parts = []
  if (cost.gears) parts.push(`⚙️ ${cost.gears}`)
  if (cost.steam) parts.push(`💨 ${cost.steam}`)
  if (cost.crystals) parts.push(`💎 ${cost.crystals}`)
  if (parts.length === 0) return <span className="text-green-400 text-sm">Free</span>
  return <span className="text-sm text-zinc-400">{parts.join('  ')}</span>
}

export default function BuildMenu() {
  const show = useStore((s) => s.showBuildMenu)
  const selectedCell = useStore((s) => s.selectedCell)
  const resources = useStore((s) => s.resources)
  const placeBuilding = useStore((s) => s.placeBuilding)
  const closeBuildMenu = useStore((s) => s.closeBuildMenu)

  return (
    <AnimatePresence>
      {show && selectedCell && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 panel rounded-xl p-4 w-[90vw] max-w-lg"
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-medieval text-lg text-amber-400">
              Build at ({selectedCell.x}, {selectedCell.y})
            </h2>
            <button
              onClick={closeBuildMenu}
              className="text-zinc-500 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {BUILDING_LIST.map((b) => {
              const affordable = canAfford(resources, b.type)
              return (
                <motion.button
                  key={b.type}
                  whileHover={{ scale: affordable ? 1.02 : 1 }}
                  whileTap={{ scale: affordable ? 0.98 : 1 }}
                  disabled={!affordable}
                  onClick={() => placeBuilding(b.type, selectedCell.x, selectedCell.y)}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    affordable
                      ? 'border-amber-800/50 hover:border-amber-600 hover:bg-amber-950/30 cursor-pointer'
                      : 'border-zinc-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm">{b.name}</span>
                    <span className="text-xs text-zinc-500">{b.description}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <CostDisplay cost={b.cost} />
                    <span className="text-xs text-zinc-600">{b.buildTime}s build</span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
