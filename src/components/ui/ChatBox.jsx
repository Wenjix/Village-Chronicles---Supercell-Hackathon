import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { aiHarness } from '../../services/ai/aiHarness'

export default function ChatBox() {
  const chatTarget = useStore((s) => s.chatTarget)
  const villagers = useStore((s) => s.villagers)
  const closeChat = useStore((s) => s.closeChat)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const villager = villagers.find((v) => v.id === chatTarget)

  useEffect(() => {
    if (villager) {
      setMessages([])
      generateGreeting(villager.name)
    }
  }, [chatTarget])

  async function generateGreeting(name) {
    setLoading(true)
    const text = await aiHarness.generateDialogue(name)
    setMessages([{ from: 'npc', text }])
    setLoading(false)
  }

  async function handleAsk() {
    if (!villager) return
    setLoading(true)
    const text = await aiHarness.generateDialogue(villager.name)
    setMessages((prev) => [...prev, { from: 'npc', text }])
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {villager && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 panel rounded-xl p-4 w-[90vw] max-w-md"
        >
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="font-medieval text-amber-400">{villager.name}</h3>
              <span className="text-xs text-zinc-500">{villager.role}</span>
            </div>
            <button
              onClick={closeChat}
              className="text-zinc-500 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-zinc-300 font-medieval bg-zinc-900/50 rounded-lg p-2"
              >
                "{msg.text}"
              </motion.div>
            ))}
            {loading && (
              <span className="text-xs text-zinc-600 italic">
                {villager.name} is thinking...
              </span>
            )}
          </div>

          <button
            onClick={handleAsk}
            disabled={loading}
            className="w-full py-2 bg-amber-800 hover:bg-amber-700 disabled:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            Ask something else
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
