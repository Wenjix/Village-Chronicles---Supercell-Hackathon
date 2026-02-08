import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { RANDOM_EVENTS } from '../../data/moods'

const GAUGE_TINTS = {
  gears: 'border-amber-800/30 bg-amber-950/20',
  steam: 'border-zinc-700/30 bg-zinc-900/20',
  crystals: 'border-purple-800/30 bg-purple-950/20',
  blueprints: 'border-blue-800/30 bg-blue-950/20',
}

function ResourceDisplay({ label, value, icon, glowClass, prevValue, gaugeClass }) {
  const [diff, setDiff] = useState(null)

  useEffect(() => {
    if (prevValue !== null && value !== prevValue) {
      const change = value - prevValue
      if (change > 0) {
        setDiff(`+${change}`)
        const t = setTimeout(() => setDiff(null), 1000)
        return () => clearTimeout(t)
      }
    }
  }, [value, prevValue])

  return (
    <div className={`resource-gauge ${gaugeClass} flex items-center gap-1 sm:gap-2 relative`}>
      <span className="text-sm sm:text-lg">{icon}</span>
      <div className="flex flex-col">
        <span className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider hidden sm:block">{label}</span>
        <span className={`text-sm sm:text-lg font-bold ${glowClass}`}>{Math.floor(value)}</span>
      </div>
      <AnimatePresence>
        {diff && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -20 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={`absolute -top-3 right-0 text-sm font-bold ${glowClass}`}
          >
            {diff}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

function getHappinessEmoji(happiness) {
  if (happiness >= 80) return '😊'
  if (happiness >= 60) return '😐'
  if (happiness >= 40) return '😟'
  if (happiness >= 20) return '😠'
  return '😡'
}

function getHappinessColor(happiness) {
  if (happiness >= 80) return 'text-green-400'
  if (happiness >= 60) return 'text-yellow-400'
  if (happiness >= 40) return 'text-orange-400'
  return 'text-red-400'
}

export default function TopBar() {
  const resources = useStore((s) => s.resources)
  const buildings = useStore((s) => s.buildings)
  const population = useStore((s) => s.population)
  const maxPopulation = useStore((s) => s.maxPopulation)
  const tradeBoostActive = useStore((s) => s.tradeBoostActive)
  const tradeBoostTimer = useStore((s) => s.tradeBoostTimer)
  const villageHappiness = useStore((s) => s.villageHappiness)
  const threatMeter = useStore((s) => s.threatMeter)
  const activeRandomEvent = useStore((s) => s.activeRandomEvent)
  const randomEventTimer = useStore((s) => s.randomEventTimer)
  const [prev, setPrev] = useState(resources)

  useEffect(() => {
    const t = setTimeout(() => setPrev(resources), 100)
    return () => clearTimeout(t)
  }, [resources])

  const activeBuildings = buildings.filter((b) => b.status === 'active').length
  const evt = activeRandomEvent ? RANDOM_EVENTS[activeRandomEvent] : null

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{ zIndex: 120 }}
      className="fixed top-0 left-0 right-0 px-6 py-2 flex items-center justify-between pointer-events-none"
    >
      {/* Decorative Brass Bar */}
      <div className="absolute inset-0 h-16 bg-black/80 border-b-4 border-brass-dim/50 shadow-2xl pointer-events-auto" />
      
      {/* Left: Title & Population */}
      <div className="relative flex items-center gap-6 pointer-events-auto">
        <div className="flex flex-col">
          <span className="font-uncial text-2xl text-amber-400 drop-shadow-md leading-tight">
            Village Chronicles
          </span>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-amber-600/80 font-bold">
            <span className="flex items-center gap-1">👥 {population}/{maxPopulation} citizens</span>
            <span>•</span>
            <span className="flex items-center gap-1">{activeBuildings} structures</span>
          </div>
        </div>
      </div>

      {/* Center: Resource Dashboard */}
      <div className="relative flex items-center gap-0.5 bg-black/40 rounded-lg p-1 border border-brass-dim/30 shadow-inner">
        {/* Raw Resources */}
        <ResourceDisplay label="Wood" value={resources.wood} prevValue={prev.wood || 0} icon="🪵" glowClass="text-amber-600" gaugeClass="border-amber-900/40 bg-amber-950/30" />
        <div className="w-px h-8 bg-brass-dim/20 self-center" />
        <ResourceDisplay label="Stone" value={resources.stone} prevValue={prev.stone || 0} icon="🪨" glowClass="text-stone-400" gaugeClass="border-stone-700/40 bg-stone-900/30" />
        <div className="w-px h-8 bg-brass-dim/20 self-center" />
        <ResourceDisplay label="Metal" value={resources.metal} prevValue={prev.metal || 0} icon="🔩" glowClass="text-slate-300" gaugeClass="border-slate-700/40 bg-slate-900/30" />
        <div className="w-px h-8 bg-brass-dim/20 self-center" />
        <ResourceDisplay label="Water" value={resources.water} prevValue={prev.water || 0} icon="💧" glowClass="text-cyan-400" gaugeClass="border-cyan-700/40 bg-cyan-900/30" />

        {/* Divider between raw and refined */}
        <div className="w-0.5 h-10 bg-brass-dim/40 self-center mx-1" />

        {/* Refined Resources */}
        <ResourceDisplay label="Gears" value={resources.gears} prevValue={prev.gears} icon="⚙️" glowClass="resource-glow-gears text-amber-400" gaugeClass="border-amber-900/40 bg-amber-950/30" />
        <div className="w-px h-8 bg-brass-dim/20 self-center" />
        <ResourceDisplay label="Steam" value={resources.steam} prevValue={prev.steam} icon="💨" glowClass="resource-glow-steam text-zinc-300" gaugeClass="border-zinc-700/40 bg-zinc-900/30" />
        <div className="w-px h-8 bg-brass-dim/20 self-center" />
        <ResourceDisplay label="Crystals" value={resources.crystals} prevValue={prev.crystals} icon="💎" glowClass="resource-glow-crystals text-purple-400" gaugeClass="border-purple-800/40 bg-purple-950/30" />
        {resources.blueprints > 0 && (
          <>
            <div className="w-px h-8 bg-brass-dim/20 self-center" />
            <ResourceDisplay label="Blueprints" value={resources.blueprints} prevValue={prev.blueprints || 0} icon="📜" glowClass="text-blue-400" gaugeClass="border-blue-800/40 bg-blue-950/30" />
          </>
        )}
      </div>

      {/* Right: Happiness & Events */}
      <div className="relative flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-red-500 font-bold">Steam Pressure (Threat)</span>
          <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
            <motion.div 
              className="h-full bg-red-500"
              initial={{ width: 0 }}
              animate={{ width: `${threatMeter}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Village Harmony</span>
          <div className={`flex items-center gap-2 font-medieval text-lg ${getHappinessColor(villageHappiness)}`}>
            {getHappinessEmoji(villageHappiness)} {villageHappiness}%
          </div>
        </div>

        {(tradeBoostActive || evt) && (
          <div className="flex flex-col gap-1">
            {tradeBoostActive && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-amber-900/80 border border-amber-500 text-amber-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-lg flex items-center gap-2"
              >
                <span className="animate-pulse">⚡</span> PRODUCTION SURGE {tradeBoostTimer}s
              </motion.div>
            )}
            {evt && (
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-cyan-900/80 border border-cyan-500 text-cyan-200 px-2 py-0.5 rounded text-[10px] font-bold shadow-lg flex items-center gap-2"
              >
                <span>{evt.emoji}</span> {evt.label.toUpperCase()} {randomEventTimer}s
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Subtle bottom detail */}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-brass-dim to-transparent opacity-50" />
    </motion.div>
  )
}
