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
    <div className="relative pl-8 pr-3 py-4 border-b border-black/10">
      {/* Visual dots */}
      <div className="absolute left-2.5 top-5 w-2 h-2 rounded-full bg-black/10" />
      <div className="absolute left-[13px] top-7 bottom-0 w-px bg-black/5" />

      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-black/40 font-typewriter uppercase font-bold">
          [{time}]
        </span>
        {def && (
          <span 
            className="w-2 h-2 rounded-full shadow-sm" 
            style={{ backgroundColor: def.color }} 
          />
        )}
      </div>
      <div className="font-typewriter text-[13px] text-[#3d2b1f] leading-relaxed">
        {event.text}
      </div>
    </div>
  )
}

export default function Chronicle() {
  const events = useStore((s) => s.events)
  const scrollRef = useRef(null)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events, isOpen])

  return (
    <>
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : 350 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ zIndex: 100 }}
        className="fixed top-20 right-0 bottom-10 w-80 parchment flex flex-col shadow-2xl rounded-l-xl border-l-4 border-brass-dim/20"
      >
        {/* Header - Fixed height */}
        <div className="p-8 border-b border-black/10 flex justify-between items-center bg-black/5">
          <div>
            <h2 className="font-uncial text-2xl text-[#2d1b0f] leading-none">The Chronicle</h2>
            <p className="text-[10px] font-bold font-typewriter text-black/40 mt-2 uppercase tracking-widest">Village Record</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-black/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Entries Container - Scrollable */}
        <div className="flex-1 overflow-hidden relative">
          <div 
            ref={scrollRef} 
            className="absolute inset-0 overflow-y-auto scrollbar-steampunk px-2"
          >
            {events.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-black/30 font-typewriter italic">
                  The ink is dry... Thy settlement awaits its first deeds.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {events.map((e) => (
                  <ChronicleEntry key={e.id} event={e} />
                ))}
              </div>
            )}
          </div>
          
          {/* Decorative Gradients */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#e9d5a1]/50 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#e9d5a1] to-transparent pointer-events-none" />
        </div>
      </motion.div>

      {/* Toggle Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, x: 100 }}
          animate={{ scale: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => setIsOpen(true)}
          style={{ zIndex: 101 }}
          className="fixed bottom-10 right-10 btn-brass w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl border-4 border-brass-bright"
        >
          📜
        </motion.button>
      )}
    </>
  )
}
