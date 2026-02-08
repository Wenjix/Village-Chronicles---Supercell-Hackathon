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
  const draftMilitia = useStore((s) => s.draftMilitia)
  const markTutorialMessageSent = useStore((s) => s.markTutorialMessageSent)

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
  const isHothead = villager?.personality === 'hothead'
  const isMilitia = villager?.isMilitia

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
    markTutorialMessageSent()

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
        { from: 'system', text: `${villager.name} is already busy.` },
      ])
    } else if (result.reason === 'resting') {
      setMessages((prev) => [
        ...prev,
        { from: 'system', text: `${villager.name} is resting.`, type: 'warning' },
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
          {/* Header */}
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
                  <span className="text-[10px] font-bold uppercase" style={{ color: moodDef?.color }}>
                    {moodDef?.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={closeChat} className="close-btn-brass mt-1">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-hidden flex flex-col bg-[#2a2a3a] p-1">
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-steampunk"
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'player' ? 'justify-end' : 'justify-start'}`}>
                  <div className={
                    msg.from === 'system' ? "w-full text-center py-2 text-[10px] uppercase text-amber-600/60 italic" :
                    msg.from === 'player' ? "max-w-[85%] bg-blue-900/40 border border-blue-500/30 text-blue-100 px-4 py-2 rounded-sm text-sm" :
                    "max-w-[85%] bg-[#e2d1a4] text-[#3d2b1f] px-4 py-3 rounded-sm shadow-md text-xs font-serif"
                  }>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && <div className="text-[10px] text-zinc-500 italic animate-pulse px-4">TRANSMITTING...</div>}
            </div>
          </div>

          {/* Input & Actions */}
          <div className="p-4 bg-black/60 border-t border-brass-dim/30 space-y-4" data-tutorial="chat-input">
            {showOptions && !loading && !isResting && (
              <div className="grid grid-cols-1 gap-2">
                {dialogueOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handlePlayerMessage(opt.message, opt.action || 'talk')}
                    className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 border border-zinc-800 hover:border-brass-dim transition-all text-left"
                  >
                    <span className="text-xs text-zinc-300 italic">"{opt.message}"</span>
                    {opt.action === 'bribe' && <span className="text-[10px] text-zinc-500">25⚙️</span>}
                  </button>
                ))}
              </div>
            )}

            {isHothead && !isResting && (
              <button
                onClick={() => draftMilitia(villager.id)}
                className={`w-full py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${isMilitia ? 'bg-red-950/40 border-red-500 text-red-200' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
              >
                {isMilitia ? '🛡️ DISCHARGE MILITIA' : '⚔️ DRAFT INTO MILITIA'}
              </button>
            )}

            {!isResting && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="TYPE MESSAGE..."
                  className="flex-1 bg-black border border-brass-dim/40 px-3 py-2 text-xs text-amber-100 outline-none"
                />
                <button
                  onClick={() => handlePlayerMessage(inputText, 'talk')}
                  className="btn-brass px-4 text-[10px] font-black"
                >
                  SEND
                </button>
              </div>
            )}

            {proposedBuildings.length > 0 && !villager.assignedBuildingId && !isResting && (
              <div className="pt-2 border-t border-zinc-800 flex flex-wrap gap-2">
                {proposedBuildings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleAssign(b.id)}
                    className="btn-blue px-3 py-1 text-[10px] font-black"
                  >
                    DEPLOY [{b.gridX},{b.gridY}]
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}