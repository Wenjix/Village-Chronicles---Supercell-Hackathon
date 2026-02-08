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
  const unassignVillager = useStore((s) => s.unassignVillager)
  const openChat = useStore((s) => s.openChat)
  const tradeBoostActive = useStore((s) => s.tradeBoostActive)
  const blueprints = useStore((s) => s.resources.blueprints)
  const getAvailablePlots = useStore((s) => s.getAvailablePlots)
  const unlockPlot = useStore((s) => s.unlockPlot)
  const steam = useStore((s) => s.resources.steam)

  const building = buildings.find((b) => b.id === selectedBuildingId)
  const def = building ? BUILDINGS[building.type] : null
  const upgradeCost = building ? building.level * 3 : 0
  const canUpgrade = blueprints >= upgradeCost && building?.status === 'active'

  const assignedWorker = building?.assignedVillager
    ? villagers.find((v) => v.id === building.assignedVillager)
    : null
  const sortedWorkers = [...villagers]
    .filter((v) => v.restTimer <= 0)
    .sort((a, b) => {
      const aFree = !a.assignedBuildingId && !a.assignedNodeId ? 0 : 1
      const bFree = !b.assignedBuildingId && !b.assignedNodeId ? 0 : 1
      return aFree - bFree
    })
  const allWorkersBusy = sortedWorkers.length === 0

  const availablePlots = def?.special === 'explorer' ? getAvailablePlots() : []
  const canAffordSurvey = steam >= 50 && blueprints >= 5

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
          className="fixed bottom-0 left-0 right-0 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:w-96 max-h-[72vh] sm:max-h-[82vh] overflow-y-auto scrollbar-steampunk brass-bezel p-4 sm:p-6 shadow-2xl bg-black/90 sm:rounded-none"
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
                 def.type === 'airship_dock' ? '⚓' : 
                 def.type === 'explorers_guild' ? '🧭' :
                 def.type === 'cottage' ? '🏠' :
                 def.type === 'tesla_tower' ? '⚡' :
                 def.type === 'watchtower' ? '🔭' : '⚙️'}
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
                <div className="flex items-center gap-3">
                   <div className="text-right">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold">Mental State</p>
                      <p className="text-[10px] font-black uppercase" style={{ color: MOODS[assignedWorker.mood]?.color }}>
                        {MOODS[assignedWorker.mood]?.label}
                      </p>
                   </div>
                   <button
                     onClick={() => unassignVillager(assignedWorker.id)}
                     className="px-2 py-1 text-[9px] font-black uppercase tracking-wider border border-red-900/40 bg-red-950/30 text-red-400 hover:border-red-500 hover:text-red-300 transition-all rounded-sm"
                   >
                     Recall
                   </button>
                </div>
             </div>
          ) : building.status === 'proposed' && (
            <div className="mb-6" data-tutorial="building-assign">
               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">Authorize Personnel:</p>
               {allWorkersBusy ? (
                 <p className="text-xs text-red-500 font-bold italic">Critical: No Available Personnel</p>
               ) : (
                 <div className="space-y-2">
                   {sortedWorkers.map((v) => {
                     const assignedBuilding = v.assignedBuildingId ? buildings.find(b => b.id === v.assignedBuildingId) : null
                     const assignedNode = v.assignedNodeId ? true : null
                     const isBusy = !!(assignedBuilding || assignedNode)
                     const taskLabel = assignedBuilding
                       ? BUILDINGS[assignedBuilding.type]?.name || 'Building'
                       : assignedNode ? 'Harvesting' : null

                     return (
                       <button
                         key={v.id}
                         onClick={() => handleAssign(v.id)}
                         className={`w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border transition-all text-left group ${
                           isBusy ? 'border-zinc-800/50 hover:border-amber-600' : 'border-zinc-800 hover:border-blue-500'
                         }`}
                       >
                         <div className="flex items-center gap-2 min-w-0">
                           <span className={`text-xs font-medieval truncate ${isBusy ? 'text-zinc-500 group-hover:text-amber-300' : 'text-zinc-300 group-hover:text-blue-200'}`}>
                             {v.name}
                           </span>
                           {taskLabel && (
                             <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-900/30 border border-amber-800/40 text-amber-500 uppercase font-black tracking-tighter shrink-0">
                               {taskLabel}
                             </span>
                           )}
                         </div>
                          <span className="text-[10px] font-black uppercase shrink-0 ml-2" style={{ color: MOODS[v.mood]?.color }}>
                            {MOODS[v.mood]?.label}
                          </span>
                          <span className="text-[9px] text-zinc-500 uppercase tracking-tight ml-2 shrink-0">
                            {Math.round((MOODS[v.mood]?.refusalChance || 0) * 100)}% refuse
                          </span>
                        </button>
                      )
                    })}
                 </div>
               )}
            </div>
          )}

          {def.special === 'explorer' && building.status === 'active' && (
            <div className="mb-6">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3 text-emerald-500/80">Available Survey Sites (50 Steam, 5 Blueprints):</p>
              <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {availablePlots.map((p) => (
                  <button
                    key={`${p.x},${p.y}`}
                    onClick={() => unlockPlot(p.x, p.y)}
                    disabled={!canAffordSurvey}
                    className="w-full flex items-center justify-between px-3 py-2 bg-emerald-950/20 border border-emerald-900/30 hover:border-emerald-500 transition-all text-left group disabled:opacity-50 disabled:grayscale"
                  >
                    <span className="text-xs font-medieval text-emerald-100 group-hover:text-emerald-300">Plot [{p.x}, {p.y}]</span>
                    <span className="text-[10px] font-black uppercase text-emerald-600">Reclaim Land</span>
                  </button>
                ))}
              </div>
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
