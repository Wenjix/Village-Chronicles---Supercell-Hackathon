import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { aiHarness } from '../../services/ai/aiHarness'

export default function WandererInterview() {
  const pendingWanderer = useStore((s) => s.pendingWanderer)
  const acceptWanderer = useStore((s) => s.acceptWanderer)
  const rejectWanderer = useStore((s) => s.rejectWanderer)
  const [backstory, setBackstory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (pendingWanderer) {
      setLoading(true)
      aiHarness.generateWandererBackstory(pendingWanderer).then(text => {
        setBackstory(text)
        setLoading(false)
      })
    } else {
      setBackstory('')
    }
  }, [pendingWanderer])

  if (!pendingWanderer) return null

  return (
    <AnimatePresence>
      {pendingWanderer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="brass-bezel max-w-lg w-full p-8 bg-zinc-950 relative overflow-hidden"
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ 
              backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")'
            }} />

            <div className="relative z-10">
              <h2 className="font-uncial text-3xl text-amber-400 mb-2 border-b border-brass-dim/30 pb-4 text-center tracking-widest">
                The Newcomer
              </h2>
              
              <div className="my-8 flex flex-col items-center gap-6">
                <div className="w-24 h-24 rounded-full border-4 border-brass-dim/50 bg-zinc-900 flex items-center justify-center text-5xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                  👤
                </div>
                
                <div className="text-center">
                  <p className="text-xl font-medieval text-blue-100 mb-1">{pendingWanderer.name}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded tracking-[0.2em]">
                      Personality: {pendingWanderer.personality}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 p-6 rounded italic text-zinc-300 font-medieval leading-relaxed mb-8 min-h-[100px] flex items-center justify-center">
                {loading ? (
                   <span className="animate-pulse text-zinc-500 uppercase tracking-widest text-[10px]">Analyzing Transmission...</span>
                ) : (
                  `"${backstory}"`
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={acceptWanderer}
                  className="btn-brass py-4 font-black uppercase text-xs tracking-widest hover:scale-105 transition-transform"
                >
                  WELCOME TO THE FOLD
                </button>
                <button
                  onClick={rejectWanderer}
                  className="py-4 border border-zinc-800 text-zinc-500 font-black uppercase text-xs tracking-widest hover:bg-red-950/20 hover:text-red-400 hover:border-red-900/50 transition-all"
                >
                  TURN AWAY
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}