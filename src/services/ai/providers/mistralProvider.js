import { BaseLLMProvider } from './baseLLMProvider.js'

const MISTRAL_PROXY_URL = '/api/mistral-chat'
const DEFAULT_MODEL = 'mistral-small-latest'

export class MistralProvider extends BaseLLMProvider {
  constructor(model = DEFAULT_MODEL, proxyUrl = MISTRAL_PROXY_URL) {
    super()
    this.model = model
    this.proxyUrl = proxyUrl
  }

  async _call(messages) {
    const res = await fetch(this.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: 200,
        temperature: 0.85,
      }),
    })

    if (!res.ok) {
      let errText = res.statusText
      try {
        const errJson = await res.json()
        errText = errJson?.error || errText
      } catch {
        // no-op
      }
      throw new Error(`Mistral proxy error ${res.status}: ${errText}`)
    }

    const data = await res.json()
    return data?.content?.trim?.() || ''
  }

  async chat(npcContext, playerMessage) {
    const systemPrompt = this.buildSystemPrompt(npcContext)

    const messages = [
      { role: 'system', content: systemPrompt },
    ]

    // Include conversation history for continuity
    for (const msg of (npcContext.conversationHistory || [])) {
      messages.push({
        role: msg.from === 'player' ? 'user' : 'assistant',
        content: msg.text,
      })
    }

    messages.push({ role: 'user', content: playerMessage })

    const raw = await this._call(messages)
    return this.parseMoodTag(raw)
  }

  async generateGreeting(npcContext) {
    const systemPrompt = this.buildSystemPrompt(npcContext)
    const raw = await this._call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Greet the village leader who just approached you. Stay in character. Keep it to 1-2 sentences.' },
    ])
    // Strip mood tag from greeting if present
    return this.parseMoodTag(raw).text
  }

  async generateChronicle(chronicleContext) {
    const raw = await this._call([
      {
        role: 'system',
        content: `You are the "Chronicler," the sentient record-keeper of a steampunk village. Write a single dramatic, slightly whimsical historical entry (1-2 sentences max) about the event described. Tone: mix of playfulness and grand saga. Reference gears, steam, crystals, and steampunk elements.`,
      },
      {
        role: 'user',
        content: `Write a chronicle entry for: ${JSON.stringify(chronicleContext)}`,
      },
    ])
    return raw
  }

  async generateRefusalLine(npcContext) {
    const systemPrompt = this.buildSystemPrompt(npcContext)
    const raw = await this._call([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'The village leader wants to assign you to build something. Refuse the task in character, based on your current mood. 1-2 sentences max.' },
    ])
    return this.parseMoodTag(raw).text
  }
}
