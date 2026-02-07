import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { BUILDINGS } from '../../data/buildings'
import { MOODS } from '../../data/moods'

export default function BuildingInfo() {
  const selectedBuildingId = useStore((s) => s.selectedBuilding)
  const buildings = useStore((s) => s.buildings)
  const villagers = useStore((s) => s.villagers)
  const closeInfo = useStore((s) => s.closeInfo)
  const activateTradeBoost = useStore((s) => s.activateTradeBoost)
  const upgradeBuilding = useStore((s) => s.upgradeBuilding)
  const assignVillager = useStore((s) => s.assignVillager)
  const openChat = useStore((s) => s.openChat)
  const tradeBoostActive = useStore((s) => s.tradeBoostActive)
  const blueprints = useStore((s) => s.resources.blueprints)

  const building = buildings.find((b) => b.id === selectedBuildingId)
  const def = building ? BUILDINGS[building.type] : null
  const upgradeCost = building ? building.level * 3 : 0
  const canUpgrade = blueprints >= upgradeCost && building?.status === 'active'

  const assignedWorker = building?.assignedVillager
    ? villagers.find((v) => v.id === building.assignedVillager)
    : null
  const availableWorkers = villagers.filter((v) => !v.assignedBuildingId)
  const allWorkersBusy = availableWorkers.length === 0

  function handleAssign(villagerId) {
    if (!building) return
    const result = assignVillager(building.id, villagerId)
    if (result.reason === 'refused') {
      // Open chat with this villager so player can negotiate
      openChat(villagerId)
    }
  }

  function getStatusDisplay() {
    if (!building) return null
    switch (building.status) {
      case 'proposed':
        return <span className="text-cyan-400">Proposed — needs worker</span>
      case 'assigned':
        return <span className="text-blue-400">Worker en route...</span>
      case 'building': {
        const workerMood = assignedWorker?.mood
        const speed = workerMood ? MOODS[workerMood]?.buildSpeed : 1
        return (
          <span className="text-amber-400">
            Building... {Math.ceil(building.timer)}s
            {speed && speed < 1 && (
              <span className="text-red-400 text-xs ml-1">({speed}x speed)</span>
            )}
          </span>
        )
      }
      case 'active':
        return <span className="text-green-400">Active</span>
      default:
        return <span>{building.status}</span>
    }
  }

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
              {getStatusDisplay()}
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
                    .map(([r, a]) => `${a * (building.level || 1)} ${r}/s`)
                    .join(', ')}
                  {building.level > 1 && (
                    <span className="text-blue-400 ml-1">(Lv.{building.level})</span>
                  )}
                </span>
              </div>
            )}
            {assignedWorker && (
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Worker</span>
                <span className="flex items-center gap-1">
                  {assignedWorker.name}
                  <span
                    className="text-xs"
                    style={{ color: MOODS[assignedWorker.mood]?.color }}
                  >
                    {MOODS[assignedWorker.mood]?.emoji}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Proposed: show available workers to assign */}
          {building.status === 'proposed' && (
            <div className="mt-3 border-t border-zinc-700 pt-3">
              <p className="text-xs text-zinc-400 mb-2">Assign a worker:</p>
              {allWorkersBusy ? (
                <p className="text-xs text-red-400">All workers are busy!</p>
              ) : (
                <div className="space-y-1">
                  {availableWorkers.map((v) => {
                    const mood = MOODS[v.mood]
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleAssign(v.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-xs transition-colors cursor-pointer"
                      >
                        <span>{v.name}</span>
                        <span
                          className="px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: mood?.color + '30', color: mood?.color }}
                        >
                          {mood?.emoji} {mood?.label}
                          {mood?.refusalChance > 0 && (
                            <span className="ml-1 opacity-70">
                              ({Math.round(mood.refusalChance * 100)}% refuse)
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {building.status === 'active' && (
            <button
              onClick={() => upgradeBuilding(building.id)}
              disabled={!canUpgrade}
              className={`mt-3 w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                canUpgrade
                  ? 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              Upgrade to Lv.{building.level + 1} ({upgradeCost} blueprints)
            </button>
          )}

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
