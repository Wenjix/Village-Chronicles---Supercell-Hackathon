/**
 * Base class for all LLM providers.
 * Implement this interface to add a new provider (OpenAI, Claude, etc.)
 *
 * Every method receives an `npcContext` object:
 * {
 *   name, role, mood, personality, feudTarget, feudTargetName,
 *   villageHappiness, conversationHistory: [{ from: 'player'|'npc', text }]
 * }
 */
export class BaseLLMProvider {
  /**
   * Send a player message and get an NPC response.
   * @returns {{ response: string, moodEffect: 'improve'|'worsen'|'none' }}
   */
  async chat(npcContext, playerMessage) {
    throw new Error('chat() not implemented')
  }

  /**
   * Generate a greeting when the chat first opens.
   * @returns {string}
   */
  async generateGreeting(npcContext) {
    throw new Error('generateGreeting() not implemented')
  }

  /**
   * Generate a chronicle entry for a game event.
   * @returns {string}
   */
  async generateChronicle(chronicleContext) {
    throw new Error('generateChronicle() not implemented')
  }

  /**
   * Generate a refusal line when a villager rejects work.
   * @returns {string}
   */
  async generateRefusalLine(npcContext) {
    throw new Error('generateRefusalLine() not implemented')
  }

  /**
   * Build the NPC system prompt from context.
   * Shared across providers so the personality stays consistent.
   */
  buildSystemPrompt(ctx) {
    const feudLine = ctx.feudTarget
      ? `You are currently in a bitter feud with ${ctx.feudTargetName || 'another villager'}. This colors everything you say.`
      : ''

    return `You are ${ctx.name}, the village ${ctx.role} in a steampunk fantasy settlement called "Village Chronicles."

PERSONALITY: ${ctx.personality}
CURRENT MOOD: ${ctx.mood}
VILLAGE HAPPINESS: ${ctx.villageHappiness ?? 50}/100
${feudLine}

VOICE RULES:
- Stay in character at ALL times. You are a steampunk fantasy villager, not an AI.
- Speak in 1-3 sentences max. Be concise and flavorful.
- Your mood deeply affects your tone: happy=warm/enthusiastic, tired=drowsy/short, grumpy=irritable/snappy, lazy=dismissive/yawning, feuding=hostile/bitter.
- Reference gears, steam, crystals, aether, and other steampunk elements naturally.
- Never break character. Never mention being an AI or language model.

MOOD RESPONSE RULES:
After your in-character dialogue, you MUST include a mood tag on a NEW line in this exact format:
[MOOD:improve] — if the player was kind, persuasive, funny, or empathetic
[MOOD:worsen] — if the player was rude, demanding, or insulting
[MOOD:none] — if the message was neutral or just conversational

The mood tag must be the LAST line of your response. Do not explain it in character.`
  }

  /**
   * Parse the mood tag from an LLM response.
   * Returns { text, moodEffect }
   */
  parseMoodTag(raw) {
    const moodMatch = raw.match(/\[MOOD:(improve|worsen|none)\]\s*$/)
    const moodEffect = moodMatch ? moodMatch[1] : 'none'
    const text = raw.replace(/\n?\[MOOD:(?:improve|worsen|none)\]\s*$/, '').trim()
    return { text, moodEffect }
  }
}
