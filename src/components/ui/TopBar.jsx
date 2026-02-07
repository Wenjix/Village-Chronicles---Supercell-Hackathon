import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'

function ResourceDisplay({ label, value, icon, glowClass, prevValue }) {
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
    <div className="flex items-center gap-1 sm:gap-2 relative">
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

export default function TopBar() {
  const resources = useStore((s) => s.resources)
  const buildings = useStore((s) => s.buildings)
  const population = useStore((s) => s.population)
  const tradeBoostActive = useStore((s) => s.tradeBoostActive)
  const tradeBoostTimer = useStore((s) => s.tradeBoostTimer)
  const [prev, setPrev] = useState(resources)

  useEffect(() => {
    const t = setTimeout(() => setPrev(resources), 100)
    return () => clearTimeout(t)
  }, [resources])

  const activeBuildings = buildings.filter((b) => b.status === 'active').length

  return (
    <motion.div
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-40 panel px-4 py-2 flex items-center justify-between"
    >
      <div className="flex items-center gap-1">
        <span className="font-medieval text-xl text-amber-400 hidden sm:inline">
          Village Chronicles
        </span>
        <span className="font-medieval text-xl text-amber-400 sm:hidden">VC</span>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <ResourceDisplay
          label="Gears"
          value={resources.gears}
          prevValue={prev.gears}
          icon="⚙️"
          glowClass="resource-glow-gears text-amber-400"
        />
        <ResourceDisplay
          label="Steam"
          value={resources.steam}
          prevValue={prev.steam}
          icon="💨"
          glowClass="resource-glow-steam text-zinc-300"
        />
        <ResourceDisplay
          label="Crystals"
          value={resources.crystals}
          prevValue={prev.crystals}
          icon="💎"
          glowClass="resource-glow-crystals text-purple-400"
        />
        {resources.blueprints > 0 && (
          <ResourceDisplay
            label="Blueprints"
            value={resources.blueprints}
            prevValue={prev.blueprints || 0}
            icon="📜"
            glowClass="text-blue-400"
          />
        )}
      </div>

      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <span>👥 {population}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{activeBuildings} buildings</span>
        {tradeBoostActive && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-amber-300 font-bold"
          >
            2x BOOST {tradeBoostTimer}s
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}
