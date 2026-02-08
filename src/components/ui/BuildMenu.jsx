import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { BUILDINGS, BUILDING_TYPES, canAfford } from '../../data/buildings'

const BUILDING_LIST = Object.entries(BUILDINGS).map(([key, val]) => ({
  type: key,
  ...val,
}))

const RESOURCE_COLORS = {
  gears: 'bg-amber-900/40 text-amber-400 border-amber-700/40',
  steam: 'bg-zinc-800/40 text-zinc-300 border-zinc-600/40',
  crystals: 'bg-purple-900/40 text-purple-400 border-purple-700/40',
}

function CostDisplay({ cost }) {
  const parts = []
  if (cost.gears) parts.push({ label: `⚙️ ${cost.gears}`, resource: 'gears' })
  if (cost.steam) parts.push({ label: `💨 ${cost.steam}`, resource: 'steam' })
  if (cost.crystals) parts.push({ label: `💎 ${cost.crystals}`, resource: 'crystals' })
  if (parts.length === 0) return <span className="text-green-400 text-sm">Free</span>
  return (
    <div className="flex gap-1">
      {parts.map((p) => (
        <span
          key={p.resource}
          className={`text-[11px] px-1.5 py-0.5 rounded border ${RESOURCE_COLORS[p.resource]}`}
        >
          {p.label}
        </span>
      ))}
    </div>
  )
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
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          style={{ zIndex: 110 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:w-[32rem] brass-bezel p-6 shadow-2xl bg-black/90 sm:rounded-none"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-brass-dim/30">
            <div>
              <h2 className="font-uncial text-xl text-amber-400">
                Architectural Ledger
              </h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                Sector Coordinates: [{selectedCell.x}, {selectedCell.y}]
              </p>
            </div>
            <button onClick={closeBuildMenu} className="close-btn-brass">✕</button>
          </div>

          <div className="flex flex-col gap-3">
            {BUILDING_LIST.map((b) => {
              const affordable = canAfford(resources, b.type)
              return (
                <motion.button
                  key={b.type}
                  whileHover={{ x: affordable ? 5 : 0 }}
                  disabled={!affordable}
                  onClick={() => placeBuilding(b.type, selectedCell.x, selectedCell.y)}
                  className={`group flex items-center justify-between p-4 border transition-all cursor-pointer relative overflow-hidden ${
                    affordable
                      ? 'border-brass-dim/20 bg-black/20 hover:bg-black/40 hover:border-amber-500'
                      : 'border-zinc-800 opacity-40 cursor-not-allowed grayscale'
                  }`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Icon/Color square */}
                    <div
                      className="w-10 h-10 rounded border border-white/5 flex items-center justify-center text-xl shadow-inner bg-black/40"
                      style={{ color: b.color }}
                    >
                      {b.type === 'clockwork_forge' ? '⚒️' : 
                       b.type === 'steam_mill' ? '💨' :
                       b.type === 'crystal_refinery' ? '💎' :
                       b.type === 'airship_dock' ? '⚓' : '⚙️'}
                    </div>
                    
                    <div className="flex flex-col items-start">
                      <span className="font-medieval text-sm text-amber-100 group-hover:text-amber-400 transition-colors">{b.name}</span>
                      <span className="text-[10px] text-zinc-500 italic max-w-[180px] line-clamp-1">{b.description}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 relative z-10">
                    <CostDisplay cost={b.cost} />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                      CONSTRUCTION: {b.buildTime}s
                    </span>
                  </div>
                  
                  {/* Hover glow */}
                  {affordable && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </motion.button>
              )
            })}
          </div>
          
          <div className="mt-6 text-center">
             <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em]">Imperial Settlement Authority • Blueprints V4.2</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
