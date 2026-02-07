const NPC_DIALOGUES = {
  'Barnaby Cogsworth': [
    "Aye, another gear turns! This settlement grows like a well-oiled machine.",
    "Have ye seen the new forge? Finest bronze work this side of the Ironclad Mountains.",
    "Mind the steam pipes, friend. Lost me eyebrows twice this month already.",
  ],
  'Elara Steamwright': [
    "The crystals sing to me... each one a tiny universe of frozen light.",
    "I've nearly perfected the aether distillation process. Just need more time... and fewer explosions.",
    "Between you and me, I think the Inventor is onto something revolutionary.",
  ],
  'Thaddeus Ironclaw': [
    "Business is booming! The airship routes bring goods from seven kingdoms.",
    "Gears, steam, crystals — all have value. But knowledge? That's priceless, friend.",
    "I've seen settlements rise and fall. This one? It has the spark of greatness.",
  ],
}

export class MockProvider {
  async generateChronicle(context) {
    return `The chronicler records: the settlement continues to grow. ${context.buildingCount} structures now dot the landscape.`
  }

  async generateDialogue(npcName) {
    const lines = NPC_DIALOGUES[npcName] || [
      "Greetings, traveler. Fine day for building, wouldn't you say?",
    ]
    return lines[Math.floor(Math.random() * lines.length)]
  }
}
