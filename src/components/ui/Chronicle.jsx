import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { BUILDINGS } from '../../data/buildings'

function ChronicleEntry({ event }) {
  const def = event.buildingType ? BUILDINGS[event.buildingType] : null
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="border-l-2 border-amber-800/50 pl-3 py-2"
    >
      <div className="flex items-center gap-2 mb-1">
        {def && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: def.color }}
          />
        )}
        <span className="text-xs text-zinc-600">{time}</span>
      </div>
      <p className="font-medieval text-sm text-zinc-300 leading-relaxed">
        {event.text}
      </p>
    </motion.div>
  )
}

export default function Chronicle() {
  const events = useStore((s) => s.events)
  const scrollRef = useRef(null)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events])

  return (
    <>
      {/* Desktop sidebar */}
      <motion.div
        initial={{ x: 300 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="fixed top-14 right-0 bottom-0 z-30 w-80 panel border-l border-zinc-800/50 hidden md:flex flex-col"
      >
        <div className="p-3 border-b border-zinc-800/50">
          <h2 className="font-medieval text-lg text-amber-400">The Chronicle</h2>
          <p className="text-xs text-zinc-600">A record of thy settlement's history</p>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-zinc-600 font-medieval italic">
              The chronicle awaits its first entry. Place a building to begin thy
              settlement's story...
            </p>
          ) : (
            events.map((e) => <ChronicleEntry key={e.id} event={e} />)
          )}
        </div>
      </motion.div>

      {/* Mobile drawer toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-16 right-2 z-50 md:hidden panel rounded-lg p-2 text-amber-400"
      >
        📜 {events.length}
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {collapsed && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-14 right-0 bottom-0 z-40 w-[85vw] max-w-sm panel border-l border-zinc-800/50 flex flex-col md:hidden"
          >
            <div className="p-3 border-b border-zinc-800/50 flex justify-between items-center">
              <h2 className="font-medieval text-lg text-amber-400">The Chronicle</h2>
              <button
                onClick={() => setCollapsed(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {events.map((e) => (
                <ChronicleEntry key={e.id} event={e} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
