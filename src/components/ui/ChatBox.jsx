import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { aiHarness } from '../../services/ai/aiHarness'
import { MOODS } from '../../data/moods'
import { getDialogueOptions } from '../../data/dialogueOptions'
import { playNegotiateSuccess, playRefusal } from '../../utils/sounds'

export default function ChatBox() {
  const chatTarget = useStore((s) => s.chatTarget)
  const villagers = useStore((s) => s.villagers)
  const buildings = useStore((s) => s.buildings)
  const villageHappiness = useStore((s) => s.villageHappiness)
  const closeChat = useStore((s) => s.closeChat)
  const negotiateWithVillager = useStore((s) => s.negotiateWithVillager)
  const assignVillager = useStore((s) => s.assignVillager)

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [inputText, setInputText] = useState('')
  const [showOptions, setShowOptions] = useState(true)
  const scrollRef = useRef(null)
  const conversationHistory = useRef([])

  const villager = villagers.find((v) => v.id === chatTarget)
  const moodDef = villager ? MOODS[villager.mood] : null
  const proposedBuildings = buildings.filter((b) => b.status === 'proposed')
  const dialogueOptions = villager ? getDialogueOptions(villager.mood) : []

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Reset on new chat target
  useEffect(() => {
    if (villager) {
      setMessages([])
      setInputText('')
      setShowOptions(true)
      conversationHistory.current = []
      generateGreeting()
    }
  }, [chatTarget])

  function buildContext() {
    return aiHarness.buildNpcContext(villager, {
      villagers,
      villageHappiness,
      conversationHistory: conversationHistory.current,
    })
  }

  async function generateGreeting() {
    setLoading(true)
    try {
      const ctx = buildContext()
      const text = await aiHarness.generateGreeting(ctx)
      conversationHistory.current = [{ from: 'npc', text }]
      setMessages([{ from: 'npc', text }])
    } catch {
      setMessages([{ from: 'npc', text: 'Greetings, traveler.' }])
    }
    setLoading(false)
  }

  async function handlePlayerMessage(text) {
    if (!villager || !text.trim()) return

    // Add player message to chat
    const playerMsg = { from: 'player', text: text.trim() }
    setMessages((prev) => [...prev, playerMsg])
    conversationHistory.current.push(playerMsg)
    setInputText('')
    setShowOptions(false)
    setLoading(true)

    try {
      const ctx = buildContext()
      const result = await aiHarness.chat(ctx, text.trim())
      const npcResponse = result.response || result.text || 'Hmm...'
      const moodEffect = result.moodEffect || 'none'

      // Apply mood effect
      if (moodEffect === 'improve' && villager.mood !== 'happy') {
        negotiateWithVillager(villager.id)
        playNegotiateSuccess()
        setMessages((prev) => [
          ...prev,
          { from: 'npc', text: npcResponse },
          { from: 'system', text: `${villager.name}'s mood improves!` },
        ])
      } else if (moodEffect === 'worsen') {
        // Worsen mood (go opposite direction of negotiation)
        playRefusal()
        setMessages((prev) => [
          ...prev,
          { from: 'npc', text: npcResponse },
          { from: 'system', text: `${villager.name} seems more upset...` },
        ])
      } else {
        setMessages((prev) => [...prev, { from: 'npc', text: npcResponse }])
      }

      conversationHistory.current.push({ from: 'npc', text: npcResponse })
    } catch {
      setMessages((prev) => [...prev, { from: 'npc', text: "Hmm... I lost my train of thought." }])
    }

    setLoading(false)
    setShowOptions(true)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePlayerMessage(inputText)
    }
  }

  async function handleAssign(buildingId) {
    if (!villager) return
    const result = assignVillager(buildingId, villager.id)
    if (result.success) {
      setMessages((prev) => [
        ...prev,
        { from: 'system', text: `${villager.name} accepts the assignment and heads to the building site!` },
      ])
    } else if (result.reason === 'refused') {
      setLoading(true)
      const ctx = buildContext()
      const text = await aiHarness.generateRefusalLine(ctx)
      setMessages((prev) => [
        ...prev,
        { from: 'npc', text },
        { from: 'system', text: `${villager.name} refused! Try talking to them to improve their mood.` },
      ])
      conversationHistory.current.push({ from: 'npc', text })
      setLoading(false)
    } else if (result.reason === 'already_busy') {
      setMessages((prev) => [
        ...prev,
        { from: 'system', text: `${villager.name} is already working on another building.` },
      ])
    }
  }

  return (
    <AnimatePresence>
      {villager && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed z-50 panel p-4 sm:bottom-4 sm:left-1/2 sm:-translate-x-1/2 sm:rounded-xl sm:w-[90vw] sm:max-w-md bottom-0 left-0 right-0 rounded-t-2xl"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div>
                <h3 className="font-medieval text-amber-400">{villager.name}</h3>
                <span className="text-xs text-zinc-500">{villager.role}</span>
              </div>
              {moodDef && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: moodDef.color + '30', color: moodDef.color }}
                >
                  {moodDef.emoji} {moodDef.label}
                </span>
              )}
            </div>
            <button
              onClick={closeChat}
              className="text-zinc-500 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="max-h-48 overflow-y-auto space-y-2 mb-3">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm rounded-lg p-2 ${
                  msg.from === 'system'
                    ? 'text-amber-300 bg-amber-900/30 italic'
                    : msg.from === 'player'
                    ? 'text-blue-200 bg-blue-900/30 ml-8'
                    : 'text-zinc-300 font-medieval bg-zinc-900/50'
                }`}
              >
                {msg.from === 'npc'
                  ? `"${msg.text}"`
                  : msg.from === 'player'
                  ? `You: ${msg.text}`
                  : msg.text}
              </motion.div>
            ))}
            {loading && (
              <span className="text-xs text-zinc-600 italic">
                {villager.name} is thinking...
              </span>
            )}
          </div>

          {/* Premade dialogue options */}
          {showOptions && !loading && (
            <div className="space-y-1 mb-2">
              {dialogueOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handlePlayerMessage(opt.message)}
                  className="w-full text-left px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer border border-zinc-700/50 hover:border-zinc-600"
                >
                  <span className="text-amber-400 font-semibold">{opt.label}</span>
                  <span className="text-zinc-500 ml-1">— "{opt.message.slice(0, 50)}..."</span>
                </button>
              ))}
            </div>
          )}

          {/* Free text input */}
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Type your own message..."
              className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-amber-600 disabled:opacity-50"
            />
            <button
              onClick={() => handlePlayerMessage(inputText)}
              disabled={loading || !inputText.trim()}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-700 disabled:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          {/* Building assignment section */}
          {proposedBuildings.length > 0 && !villager.assignedBuildingId && (
            <div className="border-t border-zinc-700 pt-2">
              <p className="text-xs text-zinc-500 mb-1">Assign to building:</p>
              <div className="flex flex-wrap gap-1">
                {proposedBuildings.map((b) => {
                  const def = { clockwork_forge: 'Forge', steam_mill: 'Mill', crystal_refinery: 'Refinery', airship_dock: 'Dock', inventors_workshop: 'Workshop' }
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleAssign(b.id)}
                      disabled={loading}
                      className="px-2 py-1 bg-blue-800 hover:bg-blue-700 disabled:bg-zinc-700 rounded text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {def[b.type] || b.type} ({b.gridX},{b.gridY})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {villager.assignedBuildingId && (
            <div className="border-t border-zinc-700 pt-2">
              <p className="text-xs text-amber-400">Currently assigned to a building project.</p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
