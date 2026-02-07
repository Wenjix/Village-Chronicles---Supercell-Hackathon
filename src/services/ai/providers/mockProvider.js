import { BaseLLMProvider } from './baseLLMProvider.js'

const NPC_DIALOGUES = {
  'Barnaby Cogsworth': {
    happy: [
      "Aye, another gear turns! This settlement grows like a well-oiled machine.",
      "Have ye seen the new forge? Finest bronze work this side of the Ironclad Mountains.",
      "A fine day for engineering! The pistons are singing, friend!",
    ],
    tired: [
      "These old bones need rest... but the gears won't turn themselves.",
      "I've been at the workbench for three days straight. Just... five more minutes.",
      "Yawn... pass me that wrench, would you? No, the other one...",
    ],
    grumpy: [
      "Don't talk to me about efficiency. I INVENTED efficiency around here.",
      "Another broken coupling? Who designed this rubbish? Oh wait, it was me.",
      "If one more pipe bursts, I swear I'll dismantle this whole settlement.",
    ],
    lazy: [
      "The gears can wait. Have you tried just... sitting? It's revolutionary.",
      "I calculated that working less actually improves long-term output. Trust the math.",
      "The forge needs stoking? Hmm, sounds like a tomorrow problem.",
    ],
    feuding: [
      "Don't get me started on that so-called 'alchemist.' Crystals! Bah! Gears are what matter!",
      "I refuse to work alongside anyone who doesn't respect proper metallurgy.",
      "Tell the others I'll be in my workshop. ALONE. And they can keep their opinions to themselves.",
    ],
  },
  'Elara Steamwright': {
    happy: [
      "The crystals sing to me... each one a tiny universe of frozen light.",
      "I've nearly perfected the aether distillation process. Just need more time... and fewer explosions.",
      "The leylines are strong today! I can feel the aether humming beneath our feet.",
    ],
    tired: [
      "Three nights of distillation... the crystals blur before my eyes.",
      "I need rest, but the aether waits for no one. Perhaps just a short nap...",
      "My calculations are getting fuzzy. Is that a crystal or a paperweight?",
    ],
    grumpy: [
      "Whoever calibrated these instruments last should be ashamed. ASHAMED.",
      "The aether resonance is all wrong and nobody seems to care but me.",
      "I asked for pure quartz, not this... this GRAVEL. How am I supposed to work?",
    ],
    lazy: [
      "The crystals will grow on their own, you know. Nature is the best alchemist.",
      "I've automated most of my process. The rest can wait until inspiration strikes.",
      "Mmm, let the aether do its thing. I'll be reading if anyone needs me.",
    ],
    feuding: [
      "Barnaby thinks his GEARS are more important than my crystals? Ha! Let him try alchemy with a hammer!",
      "I won't share my refined aether with anyone who doesn't appreciate the arcane arts.",
      "Some people in this village have no respect for the delicate sciences.",
    ],
  },
  'Thaddeus Ironclaw': {
    happy: [
      "Business is booming! The airship routes bring goods from seven kingdoms.",
      "Gears, steam, crystals — all have value. But knowledge? That's priceless, friend.",
      "I've seen settlements rise and fall. This one? It has the spark of greatness.",
    ],
    tired: [
      "Counting ledgers until dawn... the numbers swim before me.",
      "Trade never sleeps, but I wish it would. Just for one night.",
      "These trade routes are exhausting. Do you know how many invoices I've signed today?",
    ],
    grumpy: [
      "The margins are terrible this quarter. TERRIBLE. And nobody listens to my warnings.",
      "If I see one more unfavorable exchange rate, I'm closing the docks myself.",
      "Everyone wants to spend, nobody wants to budget. This is how settlements fail.",
    ],
    lazy: [
      "The market will sort itself out. Supply, demand, all that. Let it breathe.",
      "Why rush a deal? The best trades come to those who wait. And wait. And wait...",
      "I've delegated everything today. That's called management, friend.",
    ],
    feuding: [
      "I won't broker another deal until certain individuals apologize for their remarks about my pricing.",
      "Trade requires trust, and trust has been VIOLATED in this settlement.",
      "My services are not available to those who question my merchant's honor.",
    ],
  },
}

const CHAT_RESPONSES = {
  happy: [
    "Ha! That's the spirit! I like your thinking, friend.",
    "Couldn't agree more. Let's keep this settlement thriving!",
    "You always know just what to say. Onward and upward!",
  ],
  tired: [
    "Mmm... that's nice. Can we talk about this after a nap?",
    "I hear you, friend. Just... let me rest my eyes for a moment.",
    "Words, words... I appreciate it, truly. Just... so tired.",
  ],
  grumpy: [
    "Hmph. Easy for you to say. You're not the one doing the real work around here.",
    "Is that supposed to make me feel better? Because it doesn't.",
    "I'll think about it. No promises. Now leave me be.",
  ],
  lazy: [
    "That's nice and all, but I'm quite comfortable right here.",
    "Interesting thought. I'll consider it. Eventually. Maybe.",
    "You make a good point. Still not moving though.",
  ],
  feuding: [
    "Fine words, but they don't change what THEY did.",
    "I appreciate the effort, but this isn't something a few kind words can fix.",
    "Until that situation is resolved, I have nothing more to say.",
  ],
}

const REFUSAL_LINES = {
  happy: ["Actually, I'm a bit busy right now, sorry!"],
  tired: [
    "I can barely keep my eyes open. Please, not now...",
    "Zzz... huh? Work? I really can't right now.",
  ],
  grumpy: [
    "Absolutely not. Find someone else.",
    "Do I LOOK like I'm in the mood for that? No.",
  ],
  lazy: [
    "Mmmm... nah. Maybe later. Or tomorrow. Probably tomorrow.",
    "That sounds like a lot of effort. Hard pass.",
  ],
  feuding: [
    "I'm not lifting a finger until this dispute is settled!",
    "Not a chance. Not while THEY'RE still around.",
    "Forget it. I have bigger problems to deal with right now.",
  ],
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class MockProvider extends BaseLLMProvider {
  async chat(npcContext, playerMessage) {
    // Simple keyword-based mood detection
    const lower = playerMessage.toLowerCase()
    const kind = /please|thank|sorry|help|appreciate|great|friend|well done|good job/.test(lower)
    const rude = /idiot|stupid|lazy|useless|shut up|hate|worst|terrible|demand|now!/.test(lower)

    let moodEffect = 'none'
    if (kind && npcContext.mood !== 'happy') moodEffect = 'improve'
    if (rude) moodEffect = 'worsen'

    const lines = CHAT_RESPONSES[npcContext.mood] || CHAT_RESPONSES.happy
    return { response: pick(lines), moodEffect }
  }

  async generateGreeting(npcContext) {
    const npcDialogues = NPC_DIALOGUES[npcContext.name]
    if (!npcDialogues) {
      return "Greetings, traveler. Fine day for building, wouldn't you say?"
    }
    const moodLines = npcDialogues[npcContext.mood] || npcDialogues.happy
    return pick(moodLines)
  }

  async generateChronicle(context) {
    return `The chronicler records: the settlement continues to grow. ${context.buildingCount} structures now dot the landscape.`
  }

  async generateRefusalLine(npcContext) {
    const lines = REFUSAL_LINES[npcContext.mood] || REFUSAL_LINES.happy
    return pick(lines)
  }

  // Legacy compat — old methods redirect through new interface
  async generateDialogue(name, mood = 'happy', feudTarget = null) {
    return this.generateGreeting({ name, mood, feudTarget })
  }

  async generateNegotiationResponse(name, mood = 'happy', feudTarget = null) {
    const result = await this.chat({ name, mood }, "I'd like to negotiate with you.")
    return result.response
  }
}
