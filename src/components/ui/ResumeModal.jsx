import { motion } from 'framer-motion'
import useStore from '../../store/useStore'

export default function ResumeModal() {
  const saveLoaded = useStore((s) => s._saveLoaded)
  const gameStarted = useStore((s) => s._gameStarted)
  const resumeGame = useStore((s) => s.resumeGame)
  const startNewGame = useStore((s) => s.startNewGame)

  if (gameStarted || !saveLoaded) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="brass-bezel p-8 bg-black/95 max-w-md w-full mx-4 text-center"
      >
        <h1 className="font-uncial text-3xl text-amber-400 mb-2">
          Village Chronicles
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          A previous settlement was found in the archives.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={resumeGame}
            className="w-full px-6 py-4 bg-amber-900/60 border-2 border-amber-500/80 text-amber-200 font-bold text-lg hover:bg-amber-800/70 hover:border-amber-400 transition-all"
          >
            Resume Settlement
            <span className="block text-xs text-amber-400/60 font-normal mt-1">
              Continue where you left off
            </span>
          </button>

          <button
            onClick={startNewGame}
            className="w-full px-6 py-3 bg-zinc-900/60 border border-zinc-600/50 text-zinc-300 font-bold hover:bg-zinc-800/60 hover:border-zinc-500 transition-all"
          >
            Start Anew
            <span className="block text-xs text-zinc-500 font-normal mt-1">
              Abandon the old village and begin fresh
            </span>
          </button>
        </div>

        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-6">
          Imperial Settlement Authority
        </p>
      </motion.div>
    </div>
  )
}
