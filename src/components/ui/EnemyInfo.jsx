import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { MOODS } from '../../data/moods'

export default function EnemyInfo() {
  const selectedEnemyId = useStore((s) => s.selectedEnemy)
  const enemies = useStore((s) => s.enemies)
  const villagers = useStore((s) => s.villagers)
  const closeInfo = useStore((s) => s.closeInfo)
  const rallyMilitiaTo = useStore((s) => s.rallyMilitiaTo)

  const enemy = enemies.find((e) => e.id === selectedEnemyId)
  const militiaCount = villagers.filter((v) => v.isMilitia).length
  const busyMilitia = villagers.filter((v) => v.isMilitia && (v.assignedBuildingId || v.assignedNodeId)).length

  // Auto-close if enemy dies
  if (!enemy && selectedEnemyId) {
    return null
  }

  return (
    <AnimatePresence>
      {enemy && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{ zIndex: 110 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 brass-bezel p-6 shadow-2xl bg-black/90 sm:rounded-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-red-900/40">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center text-2xl bg-red-950/40 border border-red-800/50 rounded shadow-inner">
                💀
              </div>
              <div>
                <h3 className="font-uncial text-xl text-red-400">Raider</h3>
                <p className="text-[10px] font-bold text-red-800 uppercase tracking-widest">Hostile Combatant</p>
              </div>
            </div>
            <button onClick={closeInfo} className="close-btn-brass">✕</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-wider mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Health</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(enemy.health / enemy.maxHealth) * 100}%` }}
                  />
                </div>
                <span className="text-red-400">{enemy.health}/{enemy.maxHealth}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Position</span>
              <span className="text-zinc-300">X:{enemy.x.toFixed(1)} Y:{enemy.y.toFixed(1)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Your Militia</span>
              <span className={militiaCount > 0 ? 'text-amber-400' : 'text-red-400'}>
                {militiaCount} drafted{busyMilitia > 0 ? ` (${busyMilitia} busy)` : ''}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Threat</span>
              <span className="text-red-400">Approaching village</span>
            </div>
          </div>

          <div className="bg-red-950/20 border border-red-900/30 p-3 mb-6 rounded-sm">
            <p className="text-xs text-red-300/80 italic leading-relaxed">
              {militiaCount === 0
                ? 'You have no militia! Draft villagers via the chat panel to defend the village.'
                : 'Rally your militia to intercept this raider. Busy militia will be pulled from their current tasks.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {militiaCount > 0 ? (
              <button
                onClick={() => {
                  const count = rallyMilitiaTo(enemy.id)
                  if (count > 0) closeInfo()
                }}
                className="flex-1 py-3 text-[10px] uppercase font-black tracking-widest border-2 border-red-700 bg-red-950/50 text-red-300 hover:bg-red-900/50 hover:border-red-500 hover:text-red-200 transition-all"
              >
                ⚔️ Rally All Militia ({militiaCount})
              </button>
            ) : (
              <div className="flex-1 py-3 text-[10px] uppercase font-black tracking-widest text-center border border-zinc-800 text-zinc-600">
                No Militia Available
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
