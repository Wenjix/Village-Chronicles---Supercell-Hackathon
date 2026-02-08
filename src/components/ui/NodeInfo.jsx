import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { NODE_TYPES } from '../../data/nodes'
import { MOODS } from '../../data/moods'

export default function NodeInfo() {
  const selectedNodeId = useStore((s) => s.selectedNode)
  const nodes = useStore((s) => s.nodes)
  const villagers = useStore((s) => s.villagers)
  const closeInfo = useStore((s) => s.closeInfo)
  const assignVillagerToNode = useStore((s) => s.assignVillagerToNode)
  
  const node = nodes.find((n) => n.id === selectedNodeId)
  const typeDef = node ? NODE_TYPES[node.type] : null

  const isOutpost = node?.type === 'OUTPOST'

  const assignedWorkers = node
    ? villagers.filter((v) => v.assignedNodeId === node.id)
    : []

  // Outposts require militia members; resource nodes accept any villager not resting or already on this node
  const availableWorkers = villagers.filter((v) => {
    if (v.restTimer > 0) return false
    if (v.assignedNodeId === node?.id) return false
    if (isOutpost) return v.isMilitia
    return true
  })
  const allWorkersBusy = availableWorkers.length === 0

  function handleAssign(villagerId) {
    if (!node) return
    assignVillagerToNode(node.id, villagerId)
  }

  return (
    <AnimatePresence>
      {node && typeDef && (
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
                style={{ color: typeDef.color, boxShadow: `inset 0 0 10px ${typeDef.color}20` }}
              >
                {node.type === 'WOOD' ? '🌲' : 
                 node.type === 'STONE' ? '🪨' :
                 node.type === 'METAL' ? '⛓️' :
                 node.type === 'WATER' ? '💧' : '💎'}
              </div>
              <div>
                <h3 className="font-uncial text-xl text-amber-400">{typeDef.name}</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{node.type === 'OUTPOST' ? 'Enemy Encampment' : 'Natural Resource Node'}</p>
              </div>
            </div>
            <button onClick={closeInfo} className="close-btn-brass">✕</button>
          </div>

          <div className="bg-[#12121a] border border-white/5 p-4 mb-6 rounded-sm relative overflow-hidden">
             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
               backgroundImage: 'radial-gradient(circle, #4a9eff 1px, transparent 1px)',
               backgroundSize: '15px 15px'
             }} />
             
             <p className="text-xs text-zinc-400 leading-relaxed relative z-10 italic">
               {node.type === 'OUTPOST'
                 ? 'A fortified raider encampment. Assign 3 or more villagers to launch an assault and plunder its riches.'
                 : `A raw deposit of ${node.type.toLowerCase()}. It requires manual harvesting to extract its riches.`}
             </p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[10px] font-bold uppercase tracking-wider mb-6">
            {isOutpost ? (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Raiders Assigned</span>
                  <span className="text-red-400">{assignedWorkers.length} / 3 required</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Reward</span>
                  <span className="text-blue-400 font-black">Crystals &amp; Blueprints</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Strength</span>
                  <span className="text-zinc-300">{node.remainingAmount} HP</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Coordinates</span>
                  <span className="text-zinc-300">X:{node.gridX} Y:{node.gridY}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Remaining</span>
                  <span className="text-amber-400">{node.remainingAmount} / {typeDef.maxAmount}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Resource</span>
                  <span className="text-blue-400 font-black">{typeDef.resource}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Yield</span>
                  <span className="text-zinc-300">{typeDef.amountPerHarvest} per harvest</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-600">Coordinates</span>
                  <span className="text-zinc-300">X:{node.gridX} Y:{node.gridY}</span>
                </div>
              </>
            )}
          </div>

          {/* Assigned workers */}
          {assignedWorkers.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-tighter mb-2" style={{ color: isOutpost ? '#ef4444' : '#60a5fa' }}>
                {isOutpost ? 'Assault Personnel' : 'Harvesting Personnel'}
              </p>
              {assignedWorkers.map((w) => (
                <div key={w.id} className="p-2 bg-blue-900/10 border border-blue-500/20 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{MOODS[w.mood]?.emoji}</span>
                    <span className="text-sm text-blue-100 font-medieval">{w.name}</span>
                  </div>
                  <span className="text-[10px] font-black uppercase" style={{ color: MOODS[w.mood]?.color }}>
                    {MOODS[w.mood]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Assignment list — outposts allow multiple, resource nodes allow one */}
          {(isOutpost || assignedWorkers.length === 0) && (
            <div className="mb-6">
               <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3">
                 {isOutpost ? 'Assign Raiders (Militia Only):' : 'Assign Harvester:'}
               </p>
               {allWorkersBusy ? (
                 <p className="text-xs text-red-500 font-bold italic">
                   {isOutpost ? 'No militia members available — draft hotheads via chat first' : 'Critical: No Available Personnel'}
                 </p>
               ) : (
                 <div className="space-y-2">
                   {availableWorkers.map((v) => (
                     <button
                       key={v.id}
                       onClick={() => handleAssign(v.id)}
                       className={`w-full flex items-center justify-between px-3 py-2 bg-zinc-900 border transition-all text-left group ${
                         isOutpost ? 'border-red-900/30 hover:border-red-500' : 'border-zinc-800 hover:border-blue-500'
                       }`}
                     >
                       <span className={`text-xs font-medieval text-zinc-300 ${isOutpost ? 'group-hover:text-red-200' : 'group-hover:text-blue-200'}`}>{v.name}</span>
                       <span className="text-[10px] font-black uppercase" style={{ color: MOODS[v.mood]?.color }}>
                         {MOODS[v.mood]?.label}
                       </span>
                     </button>
                   ))}
                 </div>
               )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
