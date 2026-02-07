import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { BUILDINGS } from '../../data/buildings'

export default function BuildingInfo() {
  const selectedBuildingId = useStore((s) => s.selectedBuilding)
  const buildings = useStore((s) => s.buildings)
  const closeInfo = useStore((s) => s.closeInfo)
  const activateTradeBoost = useStore((s) => s.activateTradeBoost)
  const tradeBoostActive = useStore((s) => s.tradeBoostActive)

  const building = buildings.find((b) => b.id === selectedBuildingId)
  const def = building ? BUILDINGS[building.type] : null

  return (
    <AnimatePresence>
      {building && def && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 z-50 panel rounded-xl p-4 w-72"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medieval text-lg text-amber-400">{def.name}</h3>
            <button
              onClick={closeInfo}
              className="text-zinc-500 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>

          <p className="text-sm text-zinc-400 mb-3">{def.description}</p>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className={building.status === 'active' ? 'text-green-400' : 'text-amber-400'}>
                {building.status === 'building'
                  ? `Building... ${building.timer}s`
                  : 'Active'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Level</span>
              <span>{building.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Position</span>
              <span>({building.gridX}, {building.gridY})</span>
            </div>
            {def.produces && Object.keys(def.produces).length > 0 && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Produces</span>
                <span>
                  {Object.entries(def.produces)
                    .map(([r, a]) => `${a} ${r}/s`)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>

          {def.special === 'trade_boost' && building.status === 'active' && (
            <button
              onClick={activateTradeBoost}
              disabled={tradeBoostActive}
              className={`mt-3 w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                tradeBoostActive
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-amber-700 hover:bg-amber-600 text-white cursor-pointer'
              }`}
            >
              {tradeBoostActive ? 'Boost Active' : 'Activate Trade Boost (2x for 30s)'}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
