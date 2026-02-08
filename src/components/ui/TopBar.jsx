import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { RANDOM_EVENTS } from '../../data/moods'
import panelTextureUrl from '../../UITextures/panel-003.png'
import panelBorderUrl from '../../UITextures/panel-transparent-border-002.png'
import { isMusicMuted, toggleMusicMuted } from '../../utils/sounds'

function ResourceChip({ label, value, icon, glowClass, prevValue, borderClass, isRare = false }) {
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
    <div
      className={`relative flex items-center gap-3 px-4 py-2 border-b-2 border-r-2 ${borderClass} bg-black/40 min-w-[100px] shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] transition-all hover:bg-black/60`}
    >
      <span className="text-2xl leading-none shrink-0 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">{icon}</span>
      <div className="flex flex-col min-w-0 leading-tight">
        <span className={`text-[11px] uppercase tracking-[0.15em] font-medieval truncate drop-shadow-sm font-bold ${isRare ? 'text-amber-400' : 'text-zinc-500'}`}>
          {label}
        </span>
        <span className={`text-xl font-typewriter tabular-nums leading-none ${glowClass} drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]`}>
          {Math.floor(value)}
        </span>
      </div>
      <AnimatePresence>
        {diff && (
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -30 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className={`absolute -top-6 right-2 text-sm font-typewriter font-black ${glowClass} drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]`}
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

function StatusSlot({ active, className, children }) {
  return (
    <div className="relative h-6 w-[140px]">
      <AnimatePresence>
        {active && (
          <motion.div
            key="active"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 px-2.5 py-1 rounded-sm border text-[10px] font-black shadow-xl flex items-center gap-2 whitespace-nowrap overflow-hidden text-ellipsis ${className}`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TopBar() {
  const resources = useStore((s) => s.resources)
  const buildings = useStore((s) => s.buildings)
  const population = useStore((s) => s.population)
  const maxPopulation = useStore((s) => s.maxPopulation)
  const tradeBoostActive = useStore((s) => s.tradeBoostActive)
  const tradeBoostTimer = useStore((s) => s.tradeBoostTimer)
  const villageHappiness = useStore((s) => s.villageHappiness)
  const activeRandomEvent = useStore((s) => s.activeRandomEvent)
  const randomEventTimer = useStore((s) => s.randomEventTimer)
  const [prev, setPrev] = useState(resources)
  const [musicMuted, setMusicMuted] = useState(isMusicMuted())

  useEffect(() => {
    const t = setTimeout(() => setPrev(resources), 100)
    return () => clearTimeout(t)
  }, [resources])

  const activeBuildings = buildings.filter((b) => b.status === 'active').length
  const evt = activeRandomEvent ? RANDOM_EVENTS[activeRandomEvent] : null

  function handleToggleMusic() {
    setMusicMuted(toggleMusicMuted())
  }

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{ zIndex: 120 }}
      className="fixed top-0 left-0 right-0 px-4 py-2 pointer-events-none"
    >
      <div className="relative pointer-events-auto flex items-center gap-8 h-[80px]">
        {/* Left: Title & Pop */}
        <div className="flex flex-col shrink-0 pl-4">
          <span className="font-uncial text-2xl text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-none tracking-tight">
            Village Chronicles
          </span>
          <div className="mt-1.5 flex items-center gap-2.5 text-[11px] uppercase tracking-[0.2em] text-amber-600 font-black">
            <span>👥 {population}/{maxPopulation}</span>
            <span className="opacity-40">|</span>
            <span>{activeBuildings} active</span>
          </div>
        </div>

        {/* Center: Resources - unified group */}
        <div
          className="relative flex-1 min-w-0 brass-bezel px-4 py-1.5 overflow-hidden flex items-center justify-center"
          data-tutorial="topbar-resources"
        >
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-black/40" />
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: `url(${panelBorderUrl})`, backgroundSize: '100% 100%' }} />
          
          <div className="relative flex items-center gap-2 justify-center">
            {/* Basic resources */}
            <ResourceChip label="Wood" value={resources.wood} prevValue={prev.wood || 0} icon="🪵" glowClass="text-amber-500" borderClass="border-amber-900/40" />
            <ResourceChip label="Stone" value={resources.stone} prevValue={prev.stone || 0} icon="🪨" glowClass="text-stone-300" borderClass="border-stone-800/40" />
            <ResourceChip label="Metal" value={resources.metal} prevValue={prev.metal || 0} icon="🔩" glowClass="text-zinc-300" borderClass="border-zinc-700/40" />
            <ResourceChip label="Water" value={resources.water} prevValue={prev.water || 0} icon="💧" glowClass="text-cyan-300" borderClass="border-cyan-900/40" />
            
            {/* Refined resources */}
            <ResourceChip label="Gears" value={resources.gears} prevValue={prev.gears || 0} icon="⚙️" glowClass="resource-glow-gears text-amber-300" borderClass="border-amber-800/50" isRare />
            <ResourceChip label="Steam" value={resources.steam} prevValue={prev.steam || 0} icon="💨" glowClass="resource-glow-steam text-zinc-100" borderClass="border-zinc-700/50" isRare />
            <ResourceChip label="Crystals" value={resources.crystals} prevValue={prev.crystals || 0} icon="💎" glowClass="resource-glow-crystals text-violet-300" borderClass="border-violet-800/50" isRare />
            <ResourceChip label="Prints" value={resources.blueprints} prevValue={prev.blueprints || 0} icon="📜" glowClass="text-sky-300" borderClass="border-sky-900/50" isRare />
          </div>
        </div>

        {/* Right: Happiness & Status */}
        <div className="flex items-center gap-6 shrink-0 pr-4">
          <div className="flex flex-col items-end">
            <span className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold font-medieval">Harmony</span>
            <div className={`flex items-center gap-2 font-medieval text-2xl leading-none drop-shadow-md ${getHappinessColor(villageHappiness)}`}>
              {getHappinessEmoji(villageHappiness)} {villageHappiness}%
            </div>
          </div>

          <div className="flex flex-col gap-1 items-end min-w-[150px]">
            <button
              onClick={handleToggleMusic}
              className={`px-2.5 py-1 rounded-sm border text-[10px] font-black uppercase tracking-wider transition-all ${
                musicMuted
                  ? 'bg-zinc-900/80 border-zinc-600 text-zinc-300 hover:border-zinc-400'
                  : 'bg-emerald-900/60 border-emerald-500 text-emerald-200 hover:border-emerald-300'
              }`}
              title={musicMuted ? 'Unmute Music' : 'Mute Music'}
            >
              {musicMuted ? '🔇 Music Off' : '🔊 Music On'}
            </button>
            <StatusSlot active={tradeBoostActive} className="bg-amber-900/80 border-amber-500 text-amber-100 shadow-[0_0_15px_rgba(181,137,28,0.4)]">
              <span className="animate-pulse shrink-0">⚡</span>
              <span className="truncate font-medieval tracking-widest text-xs">SURGE {tradeBoostTimer}s</span>
            </StatusSlot>
            <StatusSlot active={!!evt} className="bg-cyan-900/80 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <span className="shrink-0">{evt?.emoji || '•'}</span>
              <span className="truncate font-medieval tracking-widest text-xs">{evt ? `${evt.label.toUpperCase()} ${randomEventTimer}s` : ''}</span>
            </StatusSlot>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
