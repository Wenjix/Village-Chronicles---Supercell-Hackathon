// Helper: check if a villager is assigned to a node of a given type
function hasHarvesterForType(state, nodeType) {
  return state.villagers.some((v) => {
    if (!v.assignedNodeId) return false
    const node = state.nodes.find((n) => n.id === v.assignedNodeId)
    return node && node.type === nodeType
  })
}

export const TUTORIAL_STEPS = {
  welcome: {
    id: 'welcome',
    title: 'Welcome to Village Chronicles',
    description: 'You are the overseer of a fledgling steampunk settlement. Your villagers need resources, buildings, and your guidance to thrive.\n\nLet us walk you through the basics.',
    type: 'modal',
    nextStep: 'harvest_wood',
  },
  harvest_wood: {
    id: 'harvest_wood',
    title: 'Harvest Wood',
    description: 'Click a Wood node (🌲) on the grid, then assign a villager to harvest it.',
    type: 'action',
    highlightTarget: null,
    completionCheck: (state) => hasHarvesterForType(state, 'WOOD'),
    nextStep: 'harvest_stone',
  },
  harvest_stone: {
    id: 'harvest_stone',
    title: 'Harvest Stone',
    description: 'Now click a Stone node (🪨) and assign another villager to gather stone.',
    type: 'action',
    highlightTarget: null,
    completionCheck: (state) => hasHarvesterForType(state, 'STONE'),
    nextStep: 'harvest_metal',
  },
  harvest_metal: {
    id: 'harvest_metal',
    title: 'Harvest Metal',
    description: 'Finally, click a Metal node (⛓️) and assign your last villager to mine metal.',
    type: 'action',
    highlightTarget: null,
    completionCheck: (state) => hasHarvesterForType(state, 'METAL'),
    nextStep: 'wait_resources',
  },
  wait_resources: {
    id: 'wait_resources',
    title: 'Gather Resources',
    description: 'All three villagers are harvesting! Watch the top bar as resources accumulate. You need at least 40 Wood, 30 Stone, and 20 Metal to build your first Forge.',
    type: 'action',
    highlightTarget: 'topbar-resources',
    completionCheck: (state) =>
      state.resources.wood >= 40 &&
      state.resources.stone >= 30 &&
      state.resources.metal >= 20,
    nextStep: 'place_building',
  },
  place_building: {
    id: 'place_building',
    title: 'Place a Building',
    description: 'Click an empty cell on the grid to open the build menu, then select the Clockwork Forge.',
    type: 'action',
    highlightTarget: null,
    completionCheck: (state) => state.buildings.some((b) => b.type === 'clockwork_forge'),
    nextStep: 'assign_builder',
  },
  assign_builder: {
    id: 'assign_builder',
    title: 'Assign a Builder',
    description: 'Your forge needs a worker! Assign a villager to begin construction.',
    type: 'action',
    highlightTarget: 'building-assign',
    completionCheck: (state) => {
      const forge = state.buildings.find((b) => b.type === 'clockwork_forge')
      return forge && forge.status !== 'proposed'
    },
    nextStep: 'talk_villager',
  },
  talk_villager: {
    id: 'talk_villager',
    title: 'Talk to a Villager',
    description: 'Click on a villager in the 3D scene to open their chat panel. Villagers have moods and personalities — talking to them can make them happier (or angrier!).',
    type: 'action',
    highlightTarget: null,
    completionCheck: (state) => state.chatTarget != null,
    nextStep: 'send_message',
  },
  send_message: {
    id: 'send_message',
    title: 'Send a Message',
    description: 'Choose a canned dialogue option, or type your own message and hit Send. Your words affect their mood — be encouraging!',
    type: 'action',
    highlightTarget: 'chat-input',
    completionCheck: (state) => state._tutorialMessageSent === true,
    nextStep: 'draft_militia',
  },
  draft_militia: {
    id: 'draft_militia',
    title: 'Draft a Militia Member',
    description: 'Danger lurks beyond the village! Click on any villager and use the "Draft Into Militia" button in their chat panel. Militia members will automatically pursue nearby enemies.',
    type: 'action',
    highlightTarget: null,
    completionCheck: (state) => state.villagers.some((v) => v.isMilitia),
    nextStep: 'tips_overview',
  },
  tips_overview: {
    id: 'tips_overview',
    title: 'Overseer\'s Handbook',
    description: 'Before you go — here are the key systems to master:\n\n🏠 Housing — Build Cottages (+4 pop) or Mansions (+10 pop) to attract wanderers and grow your village.\n\n🧭 Exploration — Build an Explorer\'s Guild, then use the plot navigator arrows to unlock new land with resources and outposts.\n\n⚡ Defense — Watchtowers slow enemies, Tesla Towers zap them. Raiders get tougher over time!\n\n😠 Moods — Happy villagers build faster. Grumpy ones may refuse work. Talk to them, bribe them, or let them rest.\n\n📜 Blueprints — Build an Inventor\'s Workshop to generate Blueprints, needed for all Tier 3 buildings.\n\n🌀 The Aether Conduit — The ultimate goal. Produces every resource. Only one can be built.',
    type: 'modal',
    nextStep: 'complete',
  },
  complete: {
    id: 'complete',
    title: 'Well Done, Overseer!',
    description: 'You have mastered the basics. Your settlement awaits your command.\n\nGood luck out there!',
    type: 'modal',
    nextStep: null,
  },
}
