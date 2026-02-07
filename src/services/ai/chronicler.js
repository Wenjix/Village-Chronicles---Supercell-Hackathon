import { aiHarness } from './aiHarness'

export class Chronicler {
  constructor() {
    this.lastBuildingCount = 0
  }

  async onBuildingComplete(building, totalBuildings) {
    if (totalBuildings > this.lastBuildingCount) {
      this.lastBuildingCount = totalBuildings
    }
  }

  async generateEntry(context) {
    return aiHarness.generateChronicle(context)
  }
}

export const chronicler = new Chronicler()
