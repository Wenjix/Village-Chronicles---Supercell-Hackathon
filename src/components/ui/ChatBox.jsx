import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { aiHarness } from '../../services/ai/aiHarness'
import { MOODS } from '../../data/moods'
import { BUILDINGS } from '../../data/buildings'
import { getDialogueOptions } from '../../data/dialogueOptions'
import { playNegotiateSuccess, playRefusal } from '../../utils/sounds'

export default function ChatBox() {
  const chatTarget = useStore((s) => s.chatTarget)
  const villagers = useStore((s) => s.villagers)
  const buildings = useStore((s) => s.buildings)
  const resources = useStore((s) => s.resources)
  const villageHappiness = useStore((s) => s.villageHappiness)
  const closeChat = useStore((s) => s.closeChat)
  const negotiateWithVillager = useStore((s) => s.negotiateWithVillager)
  const worsenVillagerMood = useStore((s) => s.worsenVillagerMood)
  const bribeVillager = useStore((s) => s.bribeVillager)
  const restVillager = useStore((s) => s.restVillager)
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
  const isResting = villager?.restTimer > 0

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

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

  async function handlePlayerMessage(text, action) {
    if (!villager || !text.trim()) return

    // Handle special actions before sending to LLM
    if (action === 'bribe') {
      const result = bribeVillager(villager.id)
      if (!result.success) {
        if (result.reason === 'no_funds') {
          setMessages((prev) => [
            ...prev,
            { from: 'player', text: text.trim() },
            { from: 'system', text: `Not enough gears! You need 25 gears to bribe ${villager.name}.`, type: 'warning' },
          ])
          return
        }
      }
      setMessages((prev) => [
        ...prev,
        { from: 'player', text: text.trim() },
        { from: 'system', text: `You spent 25 gears. ${villager.name}'s mood jumps to ${result.newMood}!`, type: 'cost' },
      ])
      setShowOptions(true)
      // Still send through LLM for flavor response
      setLoading(true)
      try {
        const ctx = buildContext()
        const res = await aiHarness.chat(ctx, text.trim())
        const npcResponse = res.response || res.text || 'Hmm...'
        setMessages((prev) => [...prev, { from: 'npc', text: npcResponse }])
        conversationHistory.current.push({ from: 'player', text: text.trim() }, { from: 'npc', text: npcResponse })
      } catch {
        setMessages((prev) => [...prev, { from: 'npc', text: "Much appreciated! You've got yourself a deal." }])
      }
      setLoading(false)
      return
    }

    if (action === 'rest') {
      const success = restVillager(villager.id)
      if (!success) {
        setMessages((prev) => [
          ...prev,
          { from: 'player', text: text.trim() },
          { from: 'system', text: `${villager.name} can't rest right now.`, type: 'warning' },
        ])
        return
      }
      setMessages((prev) => [
        ...prev,
        { from: 'player', text: text.trim() },
        { from: 'npc', text: "*yawns* Thank you... I could really use the rest. I'll be back soon." },
        { from: 'system', text: `${villager.name} is now resting. They'll return happy in ~15 ticks.`, type: 'info' },
      ])
      setShowOptions(false)
      return
    }

    // Normal talk flow
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

      if (moodEffect === 'improve' && villager.mood !== 'happy') {
        negotiateWithVillager(villager.id)
        playNegotiateSuccess()
        setMessages((prev) => [
          ...prev,
          { from: 'npc', text: npcResponse },
          { from: 'system', text: `${villager.name}'s mood improves!` },
        ])
      } else if (moodEffect === 'worsen') {
        worsenVillagerMood(villager.id)
        setMessages((prev) => [
          ...prev,
          { from: 'npc', text: npcResponse },
          { from: 'system', text: `${villager.name}'s mood worsens!`, type: 'warning' },
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
      handlePlayerMessage(inputText, 'talk')
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
    } else if (result.reason === 'resting') {
      setMessages((prev) => [
        ...prev,
        { from: 'system', text: `${villager.name} is resting and can't take assignments right now. (${villager.restTimer} ticks remaining)`, type: 'warning' },
      ])
    }
  }

  return (
    <AnimatePresence>
      {villager && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          style={{ zIndex: 120 }}
          className="fixed sm:top-24 sm:left-6 sm:w-[24rem] sm:max-h-[calc(100vh-10rem)] flex flex-col bottom-0 left-0 right-0 sm:right-auto sm:bottom-auto rounded-t-lg sm:rounded-none shadow-2xl brass-bezel"
        >
          {/* Header: Telegram Style */}
          <div className="bg-black/40 px-5 py-4 border-b border-brass-dim/30 flex justify-between items-start">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-800 rounded border border-brass-dim/50 flex items-center justify-center text-2xl shadow-inner">
                {moodDef?.emoji || '👤'}
              </div>
              <div>
                <h3 className="font-uncial text-xl text-amber-400 tracking-wide">{villager.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">{villager.role}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span
                    className="text-[10px] font-bold uppercase"
                    style={{ color: moodDef?.color }}
                  >
                    {moodDef?.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={closeChat} className="close-btn-brass mt-1">✕</button>
          </div>

          {/* Messages: Typewriter on paper */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#2a2a3a] p-1">
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-steampunk bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.from === 'player' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.from === 'player' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={
                    msg.from === 'system'
                      ? "w-full text-center py-2 px-4 border-y border-brass-dim/10 text-[10px] font-bold uppercase tracking-widest text-amber-600/60 italic"
                      : msg.from === 'player'
                      ? "max-w-[85%] bg-blue-900/40 border border-blue-500/30 text-blue-100 px-4 py-2 rounded-sm text-sm font-medium shadow-lg"
                      : "max-w-[85%] bg-[#e2d1a4] text-[#3d2b1f] px-4 py-3 rounded-sm shadow-md font-typewriter text-xs relative border-l-4 border-[#b5891c]"
                  }>
                    {msg.from === 'npc' && (
                      <div className="absolute -left-1 top-2 w-2 h-2 bg-[#b5891c] rotate-45" />
                    )}
                    {msg.from === 'npc'
                      ? msg.text
                      : msg.from === 'player'
                      ? msg.text
                      : msg.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="text-[10px] text-zinc-500 italic font-bold uppercase tracking-widest animate-pulse">
                  ••• Receiving Transmission •••
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black/60 border-t border-brass-dim/30 space-y-4">
            {/* Quick Options */}
            {showOptions && !loading && !isResting && (
              <div className="grid grid-cols-1 gap-2">
                {dialogueOptions.map((opt, i) => {
                  const canAffordBribe = opt.action !== 'bribe' || resources.gears >= (opt.cost || 0)
                  return (
                    <button
                      key={i}
                      onClick={() => handlePlayerMessage(opt.message, opt.action || 'talk')}
                      disabled={!canAffordBribe}
                      className="group flex items-center justify-between px-3 py-2 bg-zinc-900/50 border border-zinc-800 hover:border-brass-dim transition-all text-left disabled:opacity-30"
                    >
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-tighter ${opt.action === 'bribe' ? 'text-orange-500' : opt.action === 'rest' ? 'text-blue-500' : 'text-amber-600'}`}>
                          {opt.label}
                        </span>
                        <span className="text-xs text-zinc-300 group-hover:text-white transition-colors line-clamp-1 italic">
                          "{opt.message}"
                        </span>
                      </div>
                      {opt.action === 'bribe' && <span className="text-[10px] text-zinc-500 font-mono">25⚙️</span>}
                    </button>
                  )
                })}
              </div>
            )}

            {isResting && !loading && (
              <div className="text-center py-2 bg-blue-950/20 border border-blue-900/30 text-blue-400 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                💤 OFF-DUTY • {villager.restTimer} TICKS REMAINING
              </div>
            )}

            {/* Manual Input */}
            {!isResting && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="COMPOSE MESSAGE..."
                  className="flex-1 bg-black border border-brass-dim/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-100 placeholder:text-zinc-700 outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  onClick={() => handlePlayerMessage(inputText, 'talk')}
                  disabled={loading || !inputText.trim()}
                  className="btn-brass px-4 text-[10px] uppercase font-black"
                >
                  SEND
                </button>
              </div>
            )}

            {/* Assignments */}
            {proposedBuildings.length > 0 && !villager.assignedBuildingId && !isResting && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Deploy to Sector:</p>
                <div className="flex flex-wrap gap-2">
                  {proposedBuildings.map((b) => {
                    const names = { clockwork_forge: 'FORGE', steam_mill: 'MILL', crystal_refinery: 'REFINERY', airship_dock: 'DOCK', inventors_workshop: 'WORKSHOP' }
                    return (
                      <button
                        key={b.id}
                        onClick={() => handleAssign(b.id)}
                        disabled={loading}
                        className="btn-blue px-3 py-1 text-[10px] font-black"
                      >
                        {names[b.type] || b.type} [{b.gridX},{b.gridY}]
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
