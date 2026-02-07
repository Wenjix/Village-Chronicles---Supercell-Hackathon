import { MockProvider } from './providers/mockProvider'

export class AIHarness {
  constructor(providerName = 'mock') {
    this.provider = this.createProvider(providerName)
  }

  createProvider(name) {
    switch (name) {
      case 'mock':
      default:
        return new MockProvider()
    }
  }

  async generateChronicle(context) {
    return this.provider.generateChronicle(context)
  }

  async generateDialogue(npcName) {
    return this.provider.generateDialogue(npcName)
  }
}

export const aiHarness = new AIHarness()
