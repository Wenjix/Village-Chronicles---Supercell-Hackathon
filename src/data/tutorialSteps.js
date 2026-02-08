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
    description: 'All three villagers are harvesting! Watch the top bar as resources accumulate. You need at least 20 Wood, 15 Stone, and 10 Metal.',
    type: 'action',
    highlightTarget: 'topbar-resources',
    completionCheck: (state) =>
      state.resources.wood >= 20 &&
      state.resources.stone >= 15 &&
      state.resources.metal >= 10,
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
    nextStep: 'complete',
  },
  complete: {
    id: 'complete',
    title: 'Well Done, Overseer!',
    description: 'You have mastered the basics: harvesting, building, and assigning workers. Your settlement awaits your command.\n\nExplore new buildings, manage villager moods, and expand your territory!',
    type: 'modal',
    nextStep: null,
  },
}
