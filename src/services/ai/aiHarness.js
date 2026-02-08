import { MockProvider } from './providers/mockProvider.js'
import { MistralProvider } from './providers/mistralProvider.js'

/**
 * AI Harness — provider-agnostic interface for all LLM calls.
 *
 * Provider is auto-detected from env vars:
 *   VITE_AI_PROVIDER = 'mistral' | 'mock' (default: auto)
 *   VITE_MISTRAL_MODEL = model name (default: mistral-small-latest)
 *
 * Server-side requirements for mistral mode:
 *   MISTRAL_API_KEY = your key (server env only)
 *   MISTRAL_MODEL   = optional server default model
 *
 * To add a new provider:
 *   1. Create src/services/ai/providers/yourProvider.js extending BaseLLMProvider
 *   2. Add a case in createProvider() below
 *   3. Set VITE_AI_PROVIDER=yourprovider in .env
 */
export class AIHarness {
  constructor() {
    this.provider = this.createProvider()
    this.providerName = this.provider.constructor.name
  }

  createProvider() {
    const explicit = import.meta.env.VITE_AI_PROVIDER
    const model = import.meta.env.VITE_MISTRAL_MODEL

    // Explicit provider selection
    if (explicit === 'mock') return new MockProvider()
    if (explicit === 'mistral') {
      return new MistralProvider(model)
    }

    // Default to mistral proxy; individual calls already fall back to mock on error.
    return new MistralProvider(model)
  }

  /**
   * Build NPC context from a villager object + game state.
   * Call this before passing to chat/generateGreeting.
   */
  buildNpcContext(villager, { villagers = [], villageHappiness = 50, conversationHistory = [] } = {}) {
    const feudTargetName = villager.feudTarget
      ? villagers.find((v) => v.id === villager.feudTarget)?.name || null
      : null

    return {
      name: villager.name,
      role: villager.role,
      mood: villager.mood,
      personality: villager.personality,
      feudTarget: villager.feudTarget,
      feudTargetName,
      villageHappiness,
      conversationHistory,
    }
  }

  /** Send a player message, get NPC response + mood effect */
  async chat(npcContext, playerMessage) {
    try {
      return await this.provider.chat(npcContext, playerMessage)
    } catch (err) {
      console.error('[AIHarness] chat error, falling back to mock:', err)
      const mock = new MockProvider()
      return mock.chat(npcContext, playerMessage)
    }
  }

  /** Generate NPC greeting when chat opens */
  async generateGreeting(npcContext) {
    try {
      return await this.provider.generateGreeting(npcContext)
    } catch (err) {
      console.error('[AIHarness] greeting error, falling back to mock:', err)
      const mock = new MockProvider()
      return mock.generateGreeting(npcContext)
    }
  }

  /** Generate chronicle entry */
  async generateChronicle(context) {
    try {
      return await this.provider.generateChronicle(context)
    } catch (err) {
      console.error('[AIHarness] chronicle error, falling back to mock:', err)
      const mock = new MockProvider()
      return mock.generateChronicle(context)
    }
  }

  /** Generate refusal line */
  async generateRefusalLine(npcContext) {
    try {
      return await this.provider.generateRefusalLine(npcContext)
    } catch (err) {
      console.error('[AIHarness] refusal error, falling back to mock:', err)
      const mock = new MockProvider()
      return mock.generateRefusalLine(npcContext)
    }
  }

  /** Generate wanderer backstory for interview (Phase 3) */
  async generateWandererBackstory(wanderer) {
    try {
      return await this.provider.generateWandererBackstory(wanderer)
    } catch (err) {
      console.error('[AIHarness] wanderer error, falling back to mock:', err)
      const mock = new MockProvider()
      return mock.generateWandererBackstory(wanderer)
    }
  }

  // --- Legacy compat (used by store/other code) ---
  async generateDialogue(npcName, mood = 'happy', feudTarget = null) {
    return this.generateGreeting({ name: npcName, mood, feudTarget })
  }

  async generateNegotiationResponse(npcName, mood = 'happy', feudTarget = null) {
    const result = await this.chat({ name: npcName, mood }, "I'd like to negotiate with you.")
    return result.response
  }
}

export const aiHarness = new AIHarness()
