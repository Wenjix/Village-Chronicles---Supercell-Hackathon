import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { TUTORIAL_STEPS } from '../../data/tutorialSteps'

function TutorialModal({ step, onAdvance, onSkip }) {
  const isWelcome = step.id === 'welcome'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[950] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative brass-bezel p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Decorative gear */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl opacity-80">⚙️</div>

        <h2 className="font-uncial text-2xl text-amber-400 text-center mt-2 mb-4">
          {step.title}
        </h2>

        <div className="divider-brass mb-4" />

        <p className="text-sm text-parchment-dark leading-relaxed whitespace-pre-line text-center" style={{ color: 'var(--color-parchment-dark)' }}>
          {step.description}
        </p>

        <div className="divider-brass mt-4 mb-6" />

        <div className="flex gap-3 justify-center">
          {isWelcome && (
            <button
              onClick={onSkip}
              className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-500 border border-zinc-700 bg-zinc-900/50 hover:text-zinc-300 hover:border-zinc-500 transition-all"
            >
              Skip Tutorial
            </button>
          )}
          <button
            onClick={onAdvance}
            className="btn-brass px-8 py-2.5"
          >
            {isWelcome ? 'Begin' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function TutorialTooltip({ step, onSkip }) {
  const [pos, setPos] = useState(null)
  const rafRef = useRef(null)

  useEffect(() => {
    function updatePos() {
      if (step.highlightTarget) {
        const el = document.querySelector(`[data-tutorial="${step.highlightTarget}"]`)
        if (el) {
          const rect = el.getBoundingClientRect()
          setPos({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          })
          // Add highlight attribute
          el.setAttribute('data-tutorial-highlight', 'true')
        }
      } else {
        setPos(null)
      }
      rafRef.current = requestAnimationFrame(updatePos)
    }
    rafRef.current = requestAnimationFrame(updatePos)

    return () => {
      cancelAnimationFrame(rafRef.current)
      // Clean up highlight attributes
      document.querySelectorAll('[data-tutorial-highlight]').forEach((el) => {
        el.removeAttribute('data-tutorial-highlight')
      })
    }
  }, [step.highlightTarget])

  // Position tooltip near the highlight target, or center-bottom if no target
  let tooltipStyle = {}
  if (pos) {
    // Place above or below the target depending on screen position
    const viewportH = window.innerHeight
    const below = pos.top + pos.height + 16
    const above = pos.top - 16

    if (below + 120 < viewportH) {
      tooltipStyle = {
        position: 'fixed',
        top: below,
        left: Math.max(16, Math.min(pos.left, window.innerWidth - 340)),
        zIndex: 960,
      }
    } else {
      tooltipStyle = {
        position: 'fixed',
        bottom: viewportH - above,
        left: Math.max(16, Math.min(pos.left, window.innerWidth - 340)),
        zIndex: 960,
      }
    }
  } else {
    if (step.tooltipPosition === 'right') {
      tooltipStyle = {
        position: 'fixed',
        right: 16,
        bottom: 100,
        zIndex: 960,
      }
    } else {
      tooltipStyle = {
        position: 'fixed',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 960,
      }
    }
  }

  return (
    <>
      {/* Highlight ring */}
      <AnimatePresence>
        {pos && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="tutorial-highlight"
            style={{
              position: 'fixed',
              top: pos.top - 4,
              left: pos.left - 4,
              width: pos.width + 8,
              height: pos.height + 8,
              zIndex: 940,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        style={tooltipStyle}
        className="tutorial-tooltip max-w-xs"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-uncial text-base" style={{ color: '#ffd700' }}>
            {step.title}
          </h3>
          <span className="text-amber-600 text-lg leading-none">⚙️</span>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--color-parchment-dark)' }}>
          {step.description}
        </p>
        <button
          onClick={onSkip}
          className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Skip Tutorial
        </button>
      </motion.div>
    </>
  )
}

export default function Tutorial() {
  const tutorial = useStore((s) => s.tutorial)
  const advanceTutorial = useStore((s) => s.advanceTutorial)
  const skipTutorial = useStore((s) => s.skipTutorial)
  const completeTutorial = useStore((s) => s.completeTutorial)

  // Subscribe to full state for completion checks
  const state = useStore()

  const step = tutorial.active ? TUTORIAL_STEPS[tutorial.step] : null

  // Auto-advance when completionCheck passes
  useEffect(() => {
    if (!step || step.type === 'modal' || !step.completionCheck) return
    if (step.completionCheck(state)) {
      advanceTutorial(step.nextStep)
    }
  }, [state, step, advanceTutorial])

  if (!tutorial.active || !step) return null

  function handleAdvance() {
    if (step.nextStep) {
      advanceTutorial(step.nextStep)
    } else {
      completeTutorial()
    }
  }

  function handleSkip() {
    skipTutorial()
  }

  if (step.type === 'modal') {
    return (
      <AnimatePresence>
        <TutorialModal step={step} onAdvance={handleAdvance} onSkip={handleSkip} />
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <TutorialTooltip step={step} onSkip={handleSkip} />
    </AnimatePresence>
  )
}
