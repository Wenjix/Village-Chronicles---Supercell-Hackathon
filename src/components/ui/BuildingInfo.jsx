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
      openChat(villagerId)
    }
  }

  function getStatusBadge() {
    if (!building) return null
    switch (building.status) {
      case 'proposed':
        return <span className="glow-badge text-cyan-400">Proposed</span>
      case 'assigned':
        return <span className="glow-badge text-blue-400">En route</span>
      case 'building': {
        const workerMood = assignedWorker?.mood
        const speed = workerMood ? MOODS[workerMood]?.buildSpeed : 1
        return (
          <span className="glow-badge text-amber-400">
            Building... {Math.ceil(building.timer)}s
            {speed && speed < 1 && (
              <span className="text-red-400 text-[10px] ml-1">({speed}x)</span>
            )}
          </span>
        )
      }
      case 'active':
        return <span className="glow-badge-static text-green-400">Active</span>
      default:
        return <span>{building.status}</span>
    }
  }

  return (
    <AnimatePresence>
      {building && def && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{ zIndex: 110 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 brass-bezel p-6 shadow-2xl bg-black/90 sm:rounded-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-brass-dim/30">
            <div className="flex items-center gap-4">
               <div
                className="w-12 h-12 flex items-center justify-center text-2xl bg-black/40 border border-white/5 rounded"
                style={{ color: def.color, boxShadow: `inset 0 0 10px ${def.color}20` }}
              >
                {def.type === 'clockwork_forge' ? '⚒️' : 
                 def.type === 'steam_mill' ? '💨' :
                 def.type === 'crystal_refinery' ? '💎' :
                 def.type === 'airship_dock' ? '⚓' : '⚙️'}
              </div>
              <div>
                <h3 className="font-uncial text-xl text-amber-400">{def.name}</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Structural Analysis V.1</p>
              </div>
            </div>
            <button onClick={closeInfo} className="close-btn-brass">✕</button>
          </div>

          <div className="bg-[#12121a] border border-white/5 p-4 mb-6 rounded-sm relative overflow-hidden">
             {/* Schematic lines effect */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
               backgroundImage: 'linear-gradient(#4a9eff 1px, transparent 1px), linear-gradient(90deg, #4a9eff 1px, transparent 1px)',
               backgroundSize: '20px 20px'
             }} />
             
             <p className="text-xs text-zinc-400 leading-relaxed relative z-10 italic">
               "{def.description}"
             </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-wider mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Current Status</span>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${building.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                 <span className={building.status === 'active' ? 'text-green-400' : 'text-amber-400'}>{building.status}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Operational Level</span>
              <span className="text-blue-400">LVL {building.level}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Coordinates</span>
              <span className="text-zinc-300">X:{building.gridX} Y:{building.gridY}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-zinc-600">Net Production</span>
              <span className="text-amber-200">
                {Object.entries(def.produces || {})
                  .map(([r, a]) => `${a * (building.level || 1)} ${r}/TIC`)
                  .join(', ')}
              </span>
            </div>
          </div>

          {assignedWorker ? (
             <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-sm mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <span className="text-xl">{MOODS[assignedWorker.mood]?.emoji}</span>
                   <div>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-tighter">Assigned Overseer</p>
                      <p className="text-sm text-blue-100 font-medieval">{assignedWorker.name}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[9px] text-zinc-500 uppercase font-bold">Mental State</p>
                   <p className="text-[10px] font-black uppercase" style={{ color: MOODS[assignedWorker.mood]?.color }}>
                     {MOODS[assignedWorker.mood]?.label}
                   </p>
                </div>
             </div>
          ) : building.status === 'proposed' && (
            <div className="mb-6">
               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">Authorize Personnel:</p>
               {allWorkersBusy ? (
                 <p className="text-xs text-red-500 font-bold italic">Critical: No Available Personnel</p>
               ) : (
                 <div className="space-y-2">
                   {availableWorkers.map((v) => (
                     <button
                       key={v.id}
                       onClick={() => handleAssign(v.id)}
                       className="w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-blue-500 transition-all text-left group"
                     >
                       <span className="text-xs font-medieval text-zinc-300 group-hover:text-blue-200">{v.name}</span>
                       <span className="text-[10px] font-black uppercase" style={{ color: MOODS[v.mood]?.color }}>
                         {MOODS[v.mood]?.label}
                       </span>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          )}

          <div className="flex gap-2">
            {building.status === 'active' && (
              <button
                onClick={() => upgradeBuilding(building.id)}
                disabled={!canUpgrade}
                className="btn-brass flex-1 py-3 text-[10px] uppercase font-black"
              >
                UPGRADE SYSTEM ({upgradeCost} BLUEPRINTS)
              </button>
            )}

            {def.special === 'trade_boost' && building.status === 'active' && (
              <button
                onClick={activateTradeBoost}
                disabled={tradeBoostActive}
                className="btn-blue flex-1 py-3 text-[10px] uppercase font-black"
              >
                {tradeBoostActive ? 'BOOST ONLINE' : 'OVERLOAD SYSTEMS (2X)'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
