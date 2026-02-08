import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { BUILDINGS, BUILDING_TYPES, canAfford } from '../../data/buildings'

const BUILDING_LIST = Object.entries(BUILDINGS).map(([key, val]) => ({
  type: key,
  ...val,
}))

const RESOURCE_STYLES = {
  wood: { icon: '🪵', classes: 'bg-amber-900/40 text-amber-600 border-amber-800/40' },
  stone: { icon: '🪨', classes: 'bg-stone-800/40 text-stone-400 border-stone-700/40' },
  metal: { icon: '🔩', classes: 'bg-slate-800/40 text-slate-300 border-slate-600/40' },
  water: { icon: '💧', classes: 'bg-cyan-900/40 text-cyan-400 border-cyan-700/40' },
  gears: { icon: '⚙️', classes: 'bg-amber-900/40 text-amber-400 border-amber-700/40' },
  steam: { icon: '💨', classes: 'bg-zinc-800/40 text-zinc-300 border-zinc-600/40' },
  crystals: { icon: '💎', classes: 'bg-purple-900/40 text-purple-400 border-purple-700/40' },
  blueprints: { icon: '📜', classes: 'bg-blue-900/40 text-blue-400 border-blue-700/40' },
}

function CostDisplay({ cost }) {
  const parts = Object.entries(cost)
    .filter(([, amount]) => amount > 0)
    .map(([resource, amount]) => ({
      resource,
      label: `${RESOURCE_STYLES[resource]?.icon || ''} ${amount}`,
    }))
  if (parts.length === 0) return <span className="text-green-400 text-sm">Free</span>
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {parts.map((p) => (
        <span
          key={p.resource}
          className={`text-[11px] px-1.5 py-0.5 rounded border ${RESOURCE_STYLES[p.resource]?.classes || ''}`}
        >
          {p.label}
        </span>
      ))}
    </div>
  )
}

function DeficitDisplay({ cost, resources }) {
  const deficit = Object.entries(cost)
    .filter(([resource, amount]) => (resources[resource] || 0) < amount)
    .map(([resource, amount]) => ({
      resource,
      need: amount - (resources[resource] || 0),
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex flex-wrap gap-1 mt-1"
    >
      <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Requires:</span>
      {deficit.map((d) => (
        <span
          key={d.resource}
          className="text-[11px] px-1.5 py-0.5 rounded border border-red-800/60 bg-red-950/40 text-red-300 font-bold"
        >
          {RESOURCE_STYLES[d.resource]?.icon || ''} {d.need} more {d.resource}
        </span>
      ))}
    </motion.div>
  )
}

export default function BuildMenu() {
  const show = useStore((s) => s.showBuildMenu)
  const selectedCell = useStore((s) => s.selectedCell)
  const resources = useStore((s) => s.resources)
  const buildings = useStore((s) => s.buildings)
  const placeBuilding = useStore((s) => s.placeBuilding)
  const closeBuildMenu = useStore((s) => s.closeBuildMenu)
  const [deficitType, setDeficitType] = useState(null)

  const wonderAlreadyBuilt = buildings.some((b) => b.type === 'aether_conduit')

  return (
    <AnimatePresence>
      {show && selectedCell && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          style={{ zIndex: 110 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-10 sm:left-1/2 sm:-translate-x-1/2 sm:w-[32rem] brass-bezel p-6 shadow-2xl bg-black/90 sm:rounded-none"
          data-tutorial="build-menu"
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
              const isWonderLocked = b.type === 'aether_conduit' && wonderAlreadyBuilt
              const showDeficit = deficitType === b.type
              return (
                <div key={b.type} data-tutorial={`build-item-${b.type}`}>
                  <motion.button
                    whileHover={{ x: (affordable && !isWonderLocked) ? 5 : 0 }}
                    disabled={isWonderLocked}
                    onClick={() => {
                      if (isWonderLocked) return
                      if (affordable) {
                        placeBuilding(b.type, selectedCell.x, selectedCell.y)
                        setDeficitType(null)
                      } else {
                        setDeficitType(showDeficit ? null : b.type)
                      }
                    }}
                    className={`group w-full flex items-center justify-between p-4 border transition-all cursor-pointer relative overflow-hidden ${
                      isWonderLocked
                        ? 'border-zinc-800/60 bg-black/10 opacity-50 cursor-not-allowed'
                        : affordable
                          ? 'border-brass-dim/20 bg-black/20 hover:bg-black/40 hover:border-amber-500'
                          : 'border-zinc-800/60 bg-black/10 hover:border-red-900/50 hover:bg-red-950/10'
                    }`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      {/* Icon/Color square */}
                      <div
                        className={`w-10 h-10 rounded border border-white/5 flex items-center justify-center text-xl shadow-inner bg-black/40 ${!affordable ? 'grayscale opacity-50' : ''}`}
                        style={{ color: b.color }}
                      >
                        {b.type === 'clockwork_forge' ? '⚒️' :
                         b.type === 'steam_mill' ? '💨' :
                         b.type === 'crystal_refinery' ? '💎' :
                         b.type === 'airship_dock' ? '⚓' :
                         b.type === 'explorers_guild' ? '🧭' :
                         b.type === 'cottage' ? '🏠' :
                         b.type === 'tesla_tower' ? '⚡' :
                         b.type === 'watchtower' ? '🔭' :
                         b.type === 'aether_foundry' ? '🔮' :
                         b.type === 'sky_fortress' ? '🏰' :
                         b.type === 'grand_clocktower' ? '🕰️' :
                         b.type === 'mansion' ? '🏛️' :
                         b.type === 'aether_conduit' ? '🌀' : '⚙️'}
                      </div>

                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-medieval text-sm transition-colors ${isWonderLocked ? 'text-zinc-500' : affordable ? 'text-amber-100 group-hover:text-amber-400' : 'text-zinc-400'}`}>{b.name}</span>
                          {b.tier === 3 && <span className="text-[8px] px-1 py-0.5 rounded bg-purple-900/50 text-purple-300 border border-purple-700/40 font-bold uppercase">T3</span>}
                          {b.type === 'aether_conduit' && <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/40 font-bold uppercase">Wonder</span>}
                        </div>
                        <span className="text-[10px] text-zinc-500 italic max-w-[180px] line-clamp-1">{isWonderLocked ? 'Already Built' : b.description}</span>
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
                  <AnimatePresence>
                    {showDeficit && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-x border-b border-red-900/40 bg-red-950/20 px-4 py-2"
                      >
                        <DeficitDisplay cost={b.cost} resources={resources} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
