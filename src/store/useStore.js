import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BUILDINGS, canAfford } from '../data/buildings'
import { getRandomChronicle, getMoodChronicle } from '../data/chronicles'
import { PLOT_SIZE, createEmptyGrid, isValidCell } from '../utils/gridUtils'
import { playBuildStart, playBuildComplete, playUpgrade, playRefusal, playNegotiateSuccess, playRandomEvent, playHarvestWork, playCombatClash } from '../utils/sounds'
import { MOODS, rollMoodShift, rollRefusal, getBuildDecrement, getVillageHappiness, rollRandomEvent, RANDOM_EVENTS } from '../data/moods'
import { NODE_TYPES, getRandomNodeType, GUARANTEED_NODE_TYPES } from '../data/nodes'
import { normalizeCharacterModelUrl, pickCharacterModel } from '../data/characterModels'

let nextBuildingId = 1
let nextEventId = 1
let nextNodeId = 1

// Default initial state (used for new games and reset)
const INITIAL_VILLAGERS = [
  {
    id: 1, name: 'Barnaby Cogsworth', role: 'Engineer', x: 2, y: 2,
    homeX: 2, homeY: 2,
    mood: 'happy', personality: 'diligent', moodTimer: 30,
    modelUrl: normalizeCharacterModelUrl('/src/models/characters/male/character-male-a.glb'),
    assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
    targetX: null, targetY: null, walkProgress: 0,
    negotiationCount: 0, restTimer: 0,
    health: 100, maxHealth: 100, isMilitia: false,
  },
  {
    id: 2, name: 'Elara Steamwright', role: 'Alchemist', x: 5, y: 3,
    homeX: 5, homeY: 3,
    mood: 'happy', personality: 'cheerful', moodTimer: 25,
    modelUrl: normalizeCharacterModelUrl('/src/models/characters/female/character-female-b.glb'),
    assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
    targetX: null, targetY: null, walkProgress: 0,
    negotiationCount: 0, restTimer: 0,
    health: 100, maxHealth: 100, isMilitia: false,
  },
  {
    id: 3, name: 'Thaddeus Ironclaw', role: 'Merchant', x: 4, y: 6,
    homeX: 4, homeY: 6,
    mood: 'happy', personality: 'hothead', moodTimer: 20,
    modelUrl: normalizeCharacterModelUrl('/src/models/characters/male/character-male-b.glb'),
    assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
    targetX: null, targetY: null, walkProgress: 0,
    negotiationCount: 0, restTimer: 0,
    health: 100, maxHealth: 100, isMilitia: false,
  },
]

const INITIAL_STATE = {
  resources: { wood: 0, stone: 0, metal: 0, water: 0, gears: 0, steam: 0, crystals: 0, blueprints: 0 },
  population: 3,
  maxPopulation: 3,
  wandererTimer: 60,
  pendingWanderer: null,
  buildings: [],
  nodes: [],
  enemies: [],
  gameTick: 0,
  unlockedPlots: [{ x: 0, y: 0 }],
  grid: createEmptyGrid(),
  events: [],
  villagers: INITIAL_VILLAGERS,
  gameOver: false,
  activeRandomEvent: null,
  randomEventTimer: 0,
  villageHappiness: 100,
  tradeBoostActive: false,
  tradeBoostTimer: 0,
}

// Restore ID counters from saved state so new items don't collide
function restoreIdCounters(state) {
  const maxBId = state.buildings.reduce((m, b) => Math.max(m, b.id || 0), 0)
  const maxEId = state.events.reduce((m, e) => Math.max(m, e.id || 0), 0)
  const maxNId = state.nodes.reduce((m, n) => Math.max(m, n.id || 0), 0)
  nextBuildingId = maxBId + 1
  nextEventId = maxEId + 1
  nextNodeId = maxNId + 1
}

const useStore = create(persist((set, get) => ({
  // Resources
  resources: { wood: 0, stone: 0, metal: 0, water: 0, gears: 0, steam: 0, crystals: 0, blueprints: 0 },

  // Whether persist hydration has completed
  _hasHydrated: false,
  // Whether a save was loaded (set by onRehydrateStorage)
  _saveLoaded: false,
  // Whether the player has chosen to resume or start fresh
  _gameStarted: false,
  // Incremented on resume/new game to force 3D component remounts
  _sessionId: 0,

  // Population and Housing
  population: 3,
  maxPopulation: 3,
  wandererTimer: 60,
  pendingWanderer: null,

  // Buildings placed on grid
  buildings: [],

  // Natural resource nodes
  nodes: [],

  // Enemies (Phase 4)
  enemies: [],
  gameTick: 0,

  // Unlocked plots (8x8 chunks)
  unlockedPlots: [{ x: 0, y: 0 }],

  // Object-based grid: { "x,y": id or "node-id" }
  grid: createEmptyGrid(),

  // Chronicle events
  events: [],

  // NPC villagers
  villagers: INITIAL_VILLAGERS.map(v => ({ ...v })),

  // Game over
  gameOver: false,

  // Random event state
  activeRandomEvent: null,
  randomEventTimer: 0,

  // Village happiness (0-100)
  villageHappiness: 100,

  // Camera
  cameraTarget: { x: 0, y: 0, z: 0 },
  setCameraTarget: (x, z) => set({ cameraTarget: { x, y: 0, z } }),
  focusPlot: (px, py) => {
    const [wx, , wz] = gridToWorld(px * PLOT_SIZE + 3.5, py * PLOT_SIZE + 3.5)
    set({ cameraTarget: { x: wx, y: 0, z: wz } })
  },

  // Tutorial state
  tutorial: {
    active: !localStorage.getItem('tutorial_done'),
    step: 'welcome',
  },
  _tutorialMessageSent: false,
  markTutorialMessageSent: () => set({ _tutorialMessageSent: true }),
  advanceTutorial: (nextStep) => set({ tutorial: { active: true, step: nextStep } }),
  skipTutorial: () => {
    localStorage.setItem('tutorial_done', '1')
    set({ tutorial: { active: false, step: null } })
  },
  completeTutorial: () => {
    localStorage.setItem('tutorial_done', '1')
    set({ tutorial: { active: false, step: null } })
  },

  // UI state
  selectedCell: null,
  selectedBuilding: null,
  selectedNode: null,
  selectedEnemy: null,
  chatTarget: null,
  showBuildMenu: false,
  tradeBoostActive: false,
  tradeBoostTimer: 0,
  resourcePopups: [],

  // Initialize nodes procedurally for a specific plot
  spawnNodes: (plotX, plotY, count = 3) => {
    set((s) => {
      const newNodes = [...s.nodes]
      const newGrid = { ...s.grid }
      const isStartingPlot = plotX === 0 && plotY === 0

      // Build a queue of types to spawn: guaranteed first, then random fill
      const typeQueue = []
      if (isStartingPlot) {
        typeQueue.push(...GUARANTEED_NODE_TYPES)
      } else {
        // Non-starting plots always get at least one outpost
        typeQueue.push('OUTPOST')
      }
      while (typeQueue.length < count) {
        const isOutpostEligible = !isStartingPlot && Math.random() > 0.8
        typeQueue.push(isOutpostEligible ? 'OUTPOST' : getRandomNodeType())
      }

      let spawned = 0
      let attempts = 0
      while (spawned < typeQueue.length && attempts < 100) {
        attempts++
        const rx = plotX * PLOT_SIZE + Math.floor(Math.random() * PLOT_SIZE)
        const ry = plotY * PLOT_SIZE + Math.floor(Math.random() * PLOT_SIZE)

        const key = `${rx},${ry}`
        if (!newGrid[key]) {
          // Don't spawn too close to villagers start (only for plot 0,0)
          if (isStartingPlot) {
             const isTooClose = s.villagers.some(v => Math.abs(v.homeX - rx) <= 1 && Math.abs(v.homeY - ry) <= 1)
             if (isTooClose) continue
          }

          const id = nextNodeId++
          const type = typeQueue[spawned]
          const node = {
            id,
            type,
            gridX: rx,
            gridY: ry,
            remainingAmount: type === 'OUTPOST' ? 500 : NODE_TYPES[type].maxAmount
          }
          newNodes.push(node)
          newGrid[key] = `node-${id}`
          spawned++
        }
      }
      return { nodes: newNodes, grid: newGrid }
    })
  },

  // Unlock a new plot
  unlockPlot: (px, py) => {
    const state = get()
    if (state.unlockedPlots.some(p => p.x === px && p.y === py)) return false
    
    // Check cost: 50 steam, 5 blueprints
    if (state.resources.steam < 50 || state.resources.blueprints < 5) return false

    set((s) => ({
      unlockedPlots: [...s.unlockedPlots, { x: px, y: py }],
      resources: {
        ...s.resources,
        steam: s.resources.steam - 50,
        blueprints: s.resources.blueprints - 5
      }
    }))

    // Procedurally generate nodes for the new plot
    get().spawnNodes(px, py, 4 + Math.floor(Math.random() * 3))

    const chronicle = `Our scouts have surveyed and reclaimed the lands at [${px}, ${py}]. The frontier expands!`
    set((s) => ({
      events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
    }))

    return true
  },

  // Place a building
  placeBuilding: (type, gridX, gridY) => {
    const state = get()
    const def = BUILDINGS[type]
    if (!def) return false
    if (!canAfford(state.resources, type)) return false
    if (!isValidCell(gridX, gridY, state.unlockedPlots)) return false
    
    const key = `${gridX},${gridY}`
    if (state.grid[key]) return false

    const id = nextBuildingId++
    const building = {
      id,
      type,
      gridX,
      gridY,
      status: 'proposed',
      timer: def.buildTime,
      level: 1,
      health: 100,
      maxHealth: 100,
      assignedVillager: null,
    }

    set((s) => {
      const newGrid = { ...s.grid }
      newGrid[key] = id

      const chronicle = getMoodChronicle('proposed', { building: def.name })
      const newEvents = chronicle
        ? [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now(), buildingType: type }]
        : [...s.events]

      const newResources = { ...s.resources }
      Object.entries(def.cost).forEach(([resource, amount]) => {
        newResources[resource] = (newResources[resource] || 0) - amount
      })

      return {
        buildings: [...s.buildings, building],
        grid: newGrid,
        resources: newResources,
        events: newEvents,
        showBuildMenu: false,
        selectedCell: null,
        selectedBuilding: id,
        selectedNode: null,
      }
    })
    playBuildStart()
    return true
  },

  // Unassign a villager from their current task and send them home
  unassignVillager: (villagerId) => {
    const state = get()
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!villager) return false

    set((s) => ({
      // If assigned to a building that was in proposed/assigned state, revert it
      buildings: s.buildings.map((b) =>
        b.assignedVillager === villagerId && (b.status === 'assigned')
          ? { ...b, status: 'proposed', assignedVillager: null }
          : b
      ),
      villagers: s.villagers.map((v) => {
        if (v.id !== villagerId) return v
        // Snap x,y to current interpolated position so they don't teleport
        let currentX = v.x
        let currentY = v.y
        if (v.targetX !== null && v.targetY !== null) {
          const t = Math.min(v.walkProgress, 1)
          currentX = v.x + (v.targetX - v.x) * t
          currentY = v.y + (v.targetY - v.y) * t
        }
        return {
          ...v,
          x: currentX,
          y: currentY,
          assignedBuildingId: null,
          assignedNodeId: null,
          rallyTargetId: null,
          targetX: v.homeX,
          targetY: v.homeY,
          walkProgress: 0,
          _harvestTimer: 0,
        }
      }),
    }))
    return true
  },

  // Assign a villager to a proposed building
  assignVillager: (buildingId, villagerId) => {
    const state = get()
    const building = state.buildings.find((b) => b.id === buildingId)
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!building || building.status !== 'proposed') return { success: false, reason: 'not_proposed' }
    if (!villager) return { success: false, reason: 'no_villager' }
    if (villager.restTimer > 0) return { success: false, reason: 'resting' }

    // Auto-unassign from previous task
    if (villager.assignedBuildingId || villager.assignedNodeId) {
      get().unassignVillager(villagerId)
    }

    // Check for refusal
    if (villager.negotiationCount < 3 && rollRefusal(villager.mood)) {
      playRefusal()
      const def = BUILDINGS[building.type]
      const chronicle = getMoodChronicle('refusal', {
        villager: villager.name,
        building: def?.name || building.type,
        mood: villager.mood,
      })
      if (chronicle) {
        set((s) => ({
          events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
        }))
      }
      return { success: false, reason: 'refused', mood: villager.mood }
    }

    // Assign — pick adjacent empty cell
    const adjacentOffsets = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }
    ]
    let workX = building.gridX
    let workY = building.gridY + 1
    for (const off of adjacentOffsets) {
      const nx = building.gridX + off.dx
      const ny = building.gridY + off.dy
      const key = `${nx},${ny}`
      if (isValidCell(nx, ny, state.unlockedPlots) && !state.grid[key]) {
        workX = nx
        workY = ny
        break
      }
    }

    set((s) => ({
      buildings: s.buildings.map((b) =>
        b.id === buildingId ? { ...b, status: 'assigned', assignedVillager: villagerId } : b
      ),
      villagers: s.villagers.map((v) =>
        v.id === villagerId
          ? {
              ...v,
              assignedBuildingId: buildingId,
              assignedNodeId: null,
              targetX: workX,
              targetY: workY,
              walkProgress: 0,
              negotiationCount: 0,
            }
          : v
      ),
    }))

    const def = BUILDINGS[building.type]
    const chronicle = getMoodChronicle('assigned', {
      villager: villager.name,
      building: def?.name || building.type,
    })
    if (chronicle) {
      set((s) => ({
        events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
      }))
    }

    return { success: true }
  },

  // Assign villager to resource node for harvesting
  assignVillagerToNode: (nodeId, villagerId) => {
    const state = get()
    const node = state.nodes.find((n) => n.id === nodeId)
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!node || node.remainingAmount <= 0) return { success: false, reason: 'node_empty' }
    if (!villager) return { success: false, reason: 'no_villager' }
    if (villager.restTimer > 0) return { success: false, reason: 'resting' }

    // Auto-unassign from previous task
    if (villager.assignedBuildingId || villager.assignedNodeId) {
      get().unassignVillager(villagerId)
    }

    // Check for refusal
    if (villager.negotiationCount < 3 && rollRefusal(villager.mood)) {
      playRefusal()
      const chronicle = getMoodChronicle('refusal', {
        villager: villager.name,
        building: NODE_TYPES[node.type]?.name || node.type,
        mood: villager.mood,
      })
      if (chronicle) {
        set((s) => ({
          events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
        }))
      }
      return { success: false, reason: 'refused', mood: villager.mood }
    }

    // Pick adjacent cell
    const adjacentOffsets = [
      { dx: 0, dy: 1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: -1 }
    ]
    let workX = node.gridX
    let workY = node.gridY + 1
    for (const off of adjacentOffsets) {
      const nx = node.gridX + off.dx
      const ny = node.gridY + off.dy
      const key = `${nx},${ny}`
      if (isValidCell(nx, ny, state.unlockedPlots) && !state.grid[key]) {
        workX = nx
        workY = ny
        break
      }
    }

    set((s) => ({
      villagers: s.villagers.map((v) =>
        v.id === villagerId
          ? {
              ...v,
              assignedNodeId: nodeId,
              assignedBuildingId: null,
              targetX: workX,
              targetY: workY,
              walkProgress: 0,
              negotiationCount: 0,
            }
          : v
      ),
    }))

    const chronicle = getMoodChronicle('assigned_harvesting', {
      villager: villager.name,
      node: NODE_TYPES[node.type].name,
    }) || `${villager.name} sets off to harvest from the ${NODE_TYPES[node.type].name}.`

    set((s) => ({
      events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
    }))

    return { success: true }
  },

  // Negotiate with a villager to improve their mood
  negotiateWithVillager: (villagerId) => {
    const state = get()
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!villager) return false

    const moodImprovement = { grumpy: 'tired', tired: 'happy', lazy: 'tired', feuding: 'grumpy', happy: 'happy' }
    const newMood = moodImprovement[villager.mood] || 'happy'
    const improved = newMood !== villager.mood

    set((s) => ({
      villagers: s.villagers.map((v) =>
        v.id === villagerId
          ? {
              ...v,
              mood: newMood,
              moodTimer: 30,
              negotiationCount: v.negotiationCount + 1,
              feudTarget: newMood !== 'feuding' ? null : v.feudTarget,
            }
          : v
      ),
    }))

    if (improved) {
      playNegotiateSuccess()
      const chronicle = getMoodChronicle('negotiation', {
        villager: villager.name,
        oldMood: villager.mood,
        newMood,
      })
      if (chronicle) {
        set((s) => ({
          events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
        }))
      }
    }

    return improved
  },

  // Worsen a villager's mood
  worsenVillagerMood: (villagerId) => {
    const state = get()
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!villager) return false

    const moodDecline = { happy: 'tired', tired: 'grumpy', grumpy: 'feuding', lazy: 'grumpy', feuding: 'feuding' }
    const newMood = moodDecline[villager.mood] || villager.mood
    const worsened = newMood !== villager.mood

    let feudTarget = villager.feudTarget
    if (newMood === 'feuding' && !feudTarget && state.villagers.length > 1) {
      const others = state.villagers.filter((o) => o.id !== villagerId)
      feudTarget = others[Math.floor(Math.random() * others.length)].id
    }

    set((s) => ({
      villagers: s.villagers.map((v) =>
        v.id === villagerId
          ? { ...v, mood: newMood, moodTimer: 30, feudTarget }
          : v
      ),
    }))

    if (worsened) {
      playRefusal()
      const chronicle = getMoodChronicle('mood_worsen', {
        villager: villager.name,
        oldMood: villager.mood,
        newMood,
      })
      if (chronicle) {
        set((s) => ({
          events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
        }))
      }
    }

    return worsened
  },

  // Bribe a villager
  bribeVillager: (villagerId) => {
    const state = get()
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!villager) return { success: false, reason: 'no_villager' }

    const bribeCost = 25
    if (state.resources.gears < bribeCost) return { success: false, reason: 'no_funds' }

    const moodImprovement = { grumpy: 'tired', tired: 'happy', lazy: 'happy', feuding: 'tired', happy: 'happy' }
    const step1 = moodImprovement[villager.mood] || 'happy'
    const newMood = moodImprovement[step1] || step1

    set((s) => ({
      resources: { ...s.resources, gears: s.resources.gears - bribeCost },
      villagers: s.villagers.map((v) =>
        v.id === villagerId
          ? { ...v, mood: newMood, moodTimer: 40, feudTarget: newMood !== 'feuding' ? null : v.feudTarget }
          : v
      ),
    }))

    playNegotiateSuccess()
    const chronicle = getMoodChronicle('bribe', {
      villager: villager.name,
      cost: bribeCost,
      newMood,
    })
    if (chronicle) {
      set((s) => ({
        events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
      }))
    }

    return { success: true, cost: bribeCost, newMood }
  },

  // Send a villager to rest
  restVillager: (villagerId) => {
    const state = get()
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!villager) return false
    if (villager.assignedBuildingId || villager.assignedNodeId) return false
    if (villager.restTimer > 0) return false

    set((s) => ({
      villagers: s.villagers.map((v) =>
        v.id === villagerId
          ? { ...v, restTimer: 15, mood: 'tired', moodTimer: 50 }
          : v
      ),
    }))

    const chronicle = getMoodChronicle('rest_start', { villager: villager.name })
    if (chronicle) {
      set((s) => ({
        events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
      }))
    }

    return true
  },

  // Game tick
  tick: () => {
    if (get().gameOver) return
    set((s) => {
      let newEvents = [...s.events]
      const newResources = { ...s.resources }
      const popups = []
      let newNodes = [...s.nodes]
      let didHarvestSfx = false
      let didCombatSfx = false

      const newVillagers = s.villagers.map((v) => {
        let updated = { ...v }

        if (updated.restTimer > 0) {
          updated.restTimer -= 1
          if (updated.restTimer <= 0) {
            updated.restTimer = 0
            updated.mood = 'happy'
            updated.moodTimer = 40
            updated.feudTarget = null
            const chronicle = getMoodChronicle('rest_complete', { villager: updated.name })
            if (chronicle) {
              newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            }
          }
        }

        updated.moodTimer -= 1
        if (updated.moodTimer <= 0 && updated.restTimer <= 0) {
          const newMood = rollMoodShift(updated.personality)
          if (newMood === 'feuding' && s.villagers.length > 1) {
            const others = s.villagers.filter((o) => o.id !== v.id)
            updated.feudTarget = others[Math.floor(Math.random() * others.length)].id
          } else if (newMood !== 'feuding') {
            updated.feudTarget = null
          }
          updated.mood = newMood
          updated.moodTimer = 20 + Math.floor(Math.random() * 20)
        }

        if (updated.targetX !== null && updated.targetY !== null && updated.walkProgress < 1) {
          const speed = MOODS[updated.mood]?.buildSpeed || 1.0
          updated.walkProgress = Math.min(1, updated.walkProgress + 0.1 * speed)

          if (updated.walkProgress >= 1 && !updated.assignedBuildingId && !updated.assignedNodeId) {
            updated.x = updated.targetX
            updated.y = updated.targetY
            updated.targetX = null
            updated.targetY = null
          }
        }

        if (updated.assignedNodeId && updated.walkProgress >= 1) {
          // Snap position to work cell on arrival (mirrors building worker logic)
          if (updated.targetX !== null) {
            updated.x = updated.targetX
            updated.y = updated.targetY
            updated.targetX = null
            updated.targetY = null
          }
          const node = newNodes.find(n => n.id === updated.assignedNodeId)
          if (node && node.remainingAmount > 0) {
            if (!updated._harvestTimer || updated._harvestTimer <= 0) {
              const typeDef = NODE_TYPES[node.type]
              const harvestAmount = typeDef.amountPerHarvest
              const actualHarvest = Math.min(harvestAmount, node.remainingAmount)
              
              node.remainingAmount -= actualHarvest
              newResources[typeDef.resource] += actualHarvest
              popups.push({ resource: typeDef.resource, amount: actualHarvest, nodeId: node.id })
              if (actualHarvest > 0) didHarvestSfx = true
              
              updated._harvestTimer = 5
              
              if (node.remainingAmount <= 0) {
                const chronicle = `${updated.name} has exhausted the ${typeDef.name}.`
                newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
                updated.assignedNodeId = null
                updated.targetX = updated.homeX
                updated.targetY = updated.homeY
                updated.walkProgress = 0
              }
            } else {
              updated._harvestTimer -= 1
            }
          } else if (node && node.remainingAmount <= 0) {
             updated.assignedNodeId = null
             updated.targetX = updated.homeX
             updated.targetY = updated.homeY
             updated.walkProgress = 0
          }
        }

        return updated
      })

      // Respawn depleted resource nodes after a cooldown (not outposts)
      const RESPAWN_TICKS = 120 // 2 minutes
      newNodes = newNodes.map(n => {
        if (n.type === 'OUTPOST') return n
        if (n.remainingAmount <= 0 && !n.respawnTimer) {
          return { ...n, respawnTimer: RESPAWN_TICKS }
        }
        if (n.respawnTimer > 0) {
          const timer = n.respawnTimer - 1
          if (timer <= 0) {
            const typeDef = NODE_TYPES[n.type]
            return { ...n, remainingAmount: typeDef.maxAmount, respawnTimer: 0 }
          }
          return { ...n, respawnTimer: timer }
        }
        return n
      })

      const newGrid = { ...s.grid }
      Object.keys(newGrid).forEach(key => {
        const val = newGrid[key]
        if (typeof val === 'string' && val.startsWith('node-')) {
          const id = parseInt(val.split('-')[1])
          const node = newNodes.find(n => n.id === id)
          if (!node) delete newGrid[key]
        }
      })
      // Only permanently remove depleted outposts
      newNodes = newNodes.filter(n => n.type !== 'OUTPOST' || n.remainingAmount > 0)

      const newBuildings = s.buildings.map((b) => {
        if (b.status === 'assigned' && b.assignedVillager) {
          const worker = newVillagers.find((v) => v.id === b.assignedVillager)
          if (worker && worker.walkProgress >= 1) {
            worker.x = worker.targetX
            worker.y = worker.targetY
            worker.targetX = null
            worker.targetY = null
            return { ...b, status: 'building' }
          }
          return b
        }

        if (b.status === 'building') {
          const worker = newVillagers.find((v) => v.id === b.assignedVillager)
          const decrement = worker ? getBuildDecrement(worker.mood) : 1
          const newTimer = b.timer - decrement
          if (newTimer <= 0) {
            const def = BUILDINGS[b.type]
            const workerMood = worker?.mood || 'happy'
            const chronicle = getMoodChronicle('completion_' + workerMood, {
              villager: worker?.name || 'A worker',
              building: def?.name || b.type,
            }) || getRandomChronicle(b.type)
            if (chronicle) {
              newEvents = [
                ...newEvents,
                { id: nextEventId++, text: chronicle, timestamp: Date.now(), buildingType: b.type },
              ]
            }

            // Special wonder completion chronicle
            if (def?.special === 'wonder') {
              newEvents = [
                ...newEvents,
                { id: nextEventId++, text: 'THE AETHER CONDUIT IS COMPLETE! A pillar of light erupts skyward as raw aether flows through the village. Every workshop hums, every forge blazes — the village has achieved its ultimate glory!', timestamp: Date.now(), buildingType: b.type },
              ]
            }

            if (worker) {
              worker.assignedBuildingId = null
              worker.targetX = worker.homeX
              worker.targetY = worker.homeY
              worker.walkProgress = 0
            }

            playBuildComplete()
            return { ...b, status: 'active', timer: 0, assignedVillager: null, boostReady: def?.special === 'trade_boost' }
          }
          return { ...b, timer: newTimer }
        }
        return b
      })

      const happiness = getVillageHappiness(newVillagers)
      const eventMultiplier = s.activeRandomEvent ? (RANDOM_EVENTS[s.activeRandomEvent]?.multiplier || 1) : 1
      const multiplier = (s.tradeBoostActive ? 2 : 1) * eventMultiplier
      let blueprintTick = false

      // Production aura: find active Grand Clocktowers and the plots they're on
      const auraPlots = new Set()
      newBuildings.forEach((b) => {
        if (b.status === 'active' && BUILDINGS[b.type].special === 'production_aura') {
          const plotX = Math.floor(b.gridX / PLOT_SIZE)
          const plotY = Math.floor(b.gridY / PLOT_SIZE)
          auraPlots.add(`${plotX},${plotY}`)
        }
      })

      newBuildings.forEach((b) => {
        if (b.status === 'active') {
          const def = BUILDINGS[b.type]

          // Check if this building benefits from a clocktower aura
          const bPlotX = Math.floor(b.gridX / PLOT_SIZE)
          const bPlotY = Math.floor(b.gridY / PLOT_SIZE)
          const auraMultiplier = auraPlots.has(`${bPlotX},${bPlotY}`) ? 1.5 : 1

          if (def.produces && Object.keys(def.produces).length > 0) {
            Object.entries(def.produces).forEach(([resource, amount]) => {
              const gain = amount * multiplier * auraMultiplier * (b.level || 1)
              newResources[resource] = (newResources[resource] || 0) + gain
              popups.push({ resource, amount: gain, buildingId: b.id })
            })
          }
          if (def.special === 'blueprints') {
            if (!b._bpTimer || b._bpTimer <= 1) {
              blueprintTick = true
              b._bpTimer = 10
              popups.push({ resource: 'blueprints', amount: 1, buildingId: b.id })
            } else {
              b._bpTimer -= 1
            }
          }
          // Wonder blueprint production (1 every 5 ticks)
          if (def.special === 'wonder') {
            if (!b._bpTimer || b._bpTimer <= 1) {
              newResources.blueprints = (newResources.blueprints || 0) + 1
              b._bpTimer = 5
              popups.push({ resource: 'blueprints', amount: 1, buildingId: b.id })
            } else {
              b._bpTimer -= 1
            }
          }
        }
      })
      if (blueprintTick) newResources.blueprints = (newResources.blueprints || 0) + 1

      // Population Cap logic (uses newBuildings/newVillagers before combat filtering)
      const activeHousing = newBuildings.filter(b => b.status === 'active' && BUILDINGS[b.type].special === 'housing')
      const maxPop = 3 + activeHousing.reduce((acc, b) => acc + (BUILDINGS[b.type].capacity || 0), 0)
      const currentPop = newVillagers.length

      // Overcrowding mood penalty: when population exceeds housing cap, villagers get stressed
      if (currentPop > maxPop) {
        newVillagers.forEach((v) => {
          if (v.restTimer > 0) return
          // Drain mood timer 3x faster so moods shift to negative sooner
          v.moodTimer = Math.max(0, v.moodTimer - 2)
          // If already at a neutral/positive mood, nudge toward tired
          if (v.mood === 'happy' && v.moodTimer <= 0) {
            v.mood = 'tired'
            v.moodTimer = 10
          }
        })
        // Fire chronicle once when overcrowding starts
        if (currentPop > maxPop && s.villagers.length <= s.maxPopulation) {
          const chronicle = 'The village grows cramped! Citizens grumble about the lack of housing.'
          newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
        }
      }

      // --- Combat & Random Enemy Spawns (Phase 4) ---
      let activeBuildings = newBuildings.filter(b => b.status === 'active')
      const gameTick = s.gameTick + 1
      let newEnemies = [...s.enemies]

      // Random enemy spawns that scale with game progression
      const progressionMinutes = gameTick / 60
      const spawnChance = Math.min(0.05, 0.005 + progressionMinutes * 0.002)
      const maxSpawnCount = 1 + Math.floor(progressionMinutes / 5)

      // Cap active enemies based on player progression:
      // - No cottage yet: max 2 raiders
      // - Has cottage but only 1 plot: max 4 raiders
      // - Multiple plots: scales with villager count
      const hasHousing = newBuildings.some(b => b.status === 'active' && BUILDINGS[b.type]?.special === 'housing')
      const hasMultiplePlots = s.unlockedPlots.length > 1
      const maxActiveEnemies = !hasHousing ? 2 : !hasMultiplePlots ? 4 : newVillagers.length + 1
      if (Math.random() < spawnChance && newEnemies.length < maxActiveEnemies) {
        const spawnBudget = maxActiveEnemies - newEnemies.length
        const spawnCount = Math.min(1 + Math.floor(Math.random() * maxSpawnCount), spawnBudget)
        const chronicle = spawnCount > 1
          ? `ALARM! A band of ${spawnCount} raiders emerges from the wastes!`
          : "ALARM! A raider has been spotted approaching from the wastes!"
        newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
        for (let i = 0; i < spawnCount; i++) {
          const distPlot = s.unlockedPlots[Math.floor(Math.random()*s.unlockedPlots.length)]
          const ex = distPlot.x * PLOT_SIZE + (Math.random() > 0.5 ? PLOT_SIZE : 0)
          const ey = distPlot.y * PLOT_SIZE + (Math.random() > 0.5 ? PLOT_SIZE : 0)
          // Early raiders are weaker so initial militia skirmishes are less punishing.
          // By ~3 minutes, this ramps back to the previous baseline (~50 HP).
          const enemyHealth = 35 + Math.floor(progressionMinutes * 5)
          newEnemies.push({
            id: Date.now() + i, x: ex, y: ey, targetX: 4, targetY: 4, health: enemyHealth, maxHealth: enemyHealth, type: 'raider', speed: 0.05
          })
        }
      }

      // --- Enemy AI: each enemy picks the nearest target (building or villager) ---
      const attackableBuildings = newBuildings.filter(b => b.status === 'active' || b.status === 'building')
      newEnemies.forEach(e => {
        // Find nearest building
        let bestTarget = null
        let bestDist = Infinity
        attackableBuildings.forEach(b => {
          const bd = Math.sqrt(Math.pow(e.x - b.gridX, 2) + Math.pow(e.y - b.gridY, 2))
          if (bd < bestDist) { bestDist = bd; bestTarget = { x: b.gridX, y: b.gridY } }
        })
        // Find nearest villager — prefer over buildings if closer
        newVillagers.forEach(v => {
          const vx = v.targetX !== null && v.walkProgress >= 1 ? v.targetX : v.x
          const vy = v.targetY !== null && v.walkProgress >= 1 ? v.targetY : v.y
          const vd = Math.sqrt(Math.pow(e.x - vx, 2) + Math.pow(e.y - vy, 2))
          if (vd < bestDist) { bestDist = vd; bestTarget = { x: vx, y: vy } }
        })
        if (bestTarget) {
          e.targetX = bestTarget.x
          e.targetY = bestTarget.y
        }
      })

      // Watchtower slow: enemies in range of a watchtower move at half speed
      const watchtowers = activeBuildings.filter(b => BUILDINGS[b.type].special === 'vision')

      newEnemies = newEnemies.map(e => {
        const dx = e.targetX - e.x, dy = e.targetY - e.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist > 0.2) {
          let speed = e.speed
          for (const wt of watchtowers) {
            const wtDist = Math.sqrt(Math.pow(e.x - wt.gridX, 2) + Math.pow(e.y - wt.gridY, 2))
            if (wtDist <= (BUILDINGS[wt.type].range || 6)) {
              speed *= 0.5
              break
            }
          }
          return { ...e, x: e.x + (dx/dist)*speed, y: e.y + (dy/dist)*speed }
        }
        return e
      })

      // Tesla towers zap enemies
      const teslaTowers = activeBuildings.filter(b => BUILDINGS[b.type].special === 'defense')
      teslaTowers.forEach(t => {
        const def = BUILDINGS[t.type]
        newEnemies.forEach(e => {
          const dist = Math.sqrt(Math.pow(e.x - t.gridX, 2) + Math.pow(e.y - t.gridY, 2))
          if (dist <= (def.range || 3)) {
             e.health -= (def.damage || 5)
             didCombatSfx = true
             if (e.health <= 0) {
                popups.push({ resource: 'crystals', amount: 5, nodeId: 'enemy-' + e.id })
                newResources.crystals += 5
             }
          }
        })
      })

      // Enemies attack buildings within melee range
      newEnemies.forEach(e => {
        let closestBldg = null
        let closestDist = Infinity
        newBuildings.forEach(b => {
          if (b.status !== 'active' && b.status !== 'building') return
          const bd = Math.sqrt(Math.pow(e.x - b.gridX, 2) + Math.pow(e.y - b.gridY, 2))
          if (bd < closestDist && bd <= 1.5) {
            closestDist = bd
            closestBldg = b
          }
        })
        if (closestBldg) {
          closestBldg.health -= 5
          didCombatSfx = true
          if (closestBldg.health <= 0) {
            closestBldg.health = 0
            closestBldg.status = 'destroyed'
            const def = BUILDINGS[closestBldg.type]
            const chronicle = `Devastation! The ${def?.name || closestBldg.type} has been reduced to rubble by raiders!`
            newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            const key = `${closestBldg.gridX},${closestBldg.gridY}`
            delete newGrid[key]
            if (closestBldg.assignedVillager) {
              const worker = newVillagers.find(v => v.id === closestBldg.assignedVillager)
              if (worker) {
                worker.assignedBuildingId = null
                worker.targetX = worker.homeX
                worker.targetY = worker.homeY
                worker.walkProgress = 0
              }
            }
          }
        }
      })

      // Enemies attack villagers within melee range
      newEnemies.forEach(e => {
        newVillagers.forEach(v => {
          const vx = v.targetX !== null && v.walkProgress >= 1 ? v.targetX : v.x
          const vy = v.targetY !== null && v.walkProgress >= 1 ? v.targetY : v.y
          const dist = Math.sqrt(Math.pow(e.x - vx, 2) + Math.pow(e.y - vy, 2))
          if (dist <= 1.5) {
            v.health -= 2
            didCombatSfx = true
            // Non-militia flee when hit
            if (!v.isMilitia && !v.assignedBuildingId && !v.assignedNodeId) {
              const alreadyHome = Math.abs(v.x - v.homeX) < 0.01 && Math.abs(v.y - v.homeY) < 0.01
              const alreadyFleeingHome = v.targetX === v.homeX && v.targetY === v.homeY && v.walkProgress < 1
              if (!alreadyHome && !alreadyFleeingHome) {
                v.targetX = v.homeX
                v.targetY = v.homeY
                v.walkProgress = 0
              }
            }
          }
        })
      })

      // Militia Attack and Pillage logic
      const outposts = newNodes.filter(n => n.type === 'OUTPOST')
      outposts.forEach(outpost => {
        const villagersAtOutpost = newVillagers.filter(v => v.assignedNodeId === outpost.id && v.walkProgress >= 1)
        if (villagersAtOutpost.length >= 3) {
          outpost.remainingAmount -= villagersAtOutpost.length * 2
          didCombatSfx = true
          if (outpost.remainingAmount <= 0) {
            newResources.crystals += 100
            newResources.blueprints += 10
            popups.push({ resource: 'crystals', amount: 100, nodeId: outpost.id })
            popups.push({ resource: 'blueprints', amount: 10, nodeId: outpost.id })
            const chronicle = "Victory! Our brave pioneers have razed a raider outpost and returned with spoils!"
            newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            
            // Make attackers walk back home
            newVillagers.forEach(v => {
              if (v.assignedNodeId === outpost.id) {
                v.assignedNodeId = null
                v.targetX = v.homeX
                v.targetY = v.homeY
                v.walkProgress = 0
              }
            })
          }
        }
      })

      // Militia auto-pursue nearest enemy (or rally target if set)
      newVillagers.forEach(v => {
        if (!v.isMilitia) return
        if (v.assignedBuildingId || v.assignedNodeId) return
        if (newEnemies.length === 0) return

        let target = null
        if (v.rallyTargetId) {
          target = newEnemies.find(e => e.id === v.rallyTargetId) || null
          if (!target) v.rallyTargetId = null
        }
        if (!target) {
          // Find nearest enemy
          let nearest = null
          let nearestDist = Infinity
          newEnemies.forEach(e => {
            const dist = Math.sqrt(Math.pow(e.x - v.x, 2) + Math.pow(e.y - v.y, 2))
            if (dist < nearestDist) { nearestDist = dist; nearest = e }
          })
          target = nearest
        }
        if (target) {
          // Clear walk system state so it doesn't conflict with direct position mutation
          if (v.targetX !== null || v.targetY !== null) {
            v.targetX = null
            v.targetY = null
            v.walkProgress = 1
          }
          const dx = target.x - v.x
          const dy = target.y - v.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist > 1.5) {
            const speed = 0.15
            v.x = v.x + (dx / dist) * speed
            v.y = v.y + (dy / dist) * speed
          }
        }
      })

      // Militia deal damage to nearby enemies
      newVillagers.forEach(v => {
        if (v.isMilitia) {
          let inCombat = false
          newEnemies.forEach(e => {
            const dist = Math.sqrt(Math.pow(e.x - v.x, 2) + Math.pow(e.y - v.y, 2))
            if (dist <= 1.5) {
              e.health -= 4
              inCombat = true
              didCombatSfx = true
            }
          })
          // Passive regen: militia not in combat regen 1 HP/tick
          if (!inCombat && v.health < v.maxHealth) {
            v.health = Math.min(v.maxHealth, v.health + 1)
          }
        }
        // Resting villagers regen 5 HP/tick
        if (v.restTimer > 0 && v.health < v.maxHealth) {
          v.health = Math.min(v.maxHealth, v.health + 5)
        }
      })

      newEnemies = newEnemies.filter(e => e.health > 0)

      // Remove dead villagers
      const deadVillagers = newVillagers.filter(v => v.health <= 0)
      deadVillagers.forEach(v => {
        const chronicle = `${v.name} has fallen in battle!`
        newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
        // Free grid cell if assigned
        if (v.assignedBuildingId) {
          const bldg = newBuildings.find(b => b.id === v.assignedBuildingId)
          if (bldg) bldg.assignedVillager = null
        }
      })

      // Filter out destroyed buildings and dead villagers
      const aliveVillagers = newVillagers.filter(v => v.health > 0)
      const standingBuildings = newBuildings.filter(b => b.status !== 'destroyed')

      // Game over check: all villagers dead
      let gameOver = s.gameOver
      if (aliveVillagers.length === 0 && s.villagers.length > 0) {
        gameOver = true
      }

      // Update active buildings list for resource production recalc
      activeBuildings = standingBuildings.filter(b => b.status === 'active')

      // Wanderer logic
      let wandererTimer = s.wandererTimer - 1
      let pendingWanderer = s.pendingWanderer
      if (wandererTimer <= 0) {
        wandererTimer = 60
        if (currentPop < maxPop && happiness > 50 && !pendingWanderer) {
           pendingWanderer = {
            id: Date.now(),
            name: 'Wanderer ' + (currentPop + 1),
            personality: ['diligent', 'lazy', 'hothead', 'cheerful'][Math.floor(Math.random() * 4)],
            mood: 'happy',
            modelUrl: pickCharacterModel(),
          }
          const chronicle = `A weary traveler named ${pendingWanderer.name} waits at the gates.`
          newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
        }
      }

      let tradeBoostActive = s.tradeBoostActive
      let tradeBoostTimer = s.tradeBoostTimer
      if (tradeBoostActive) {
        tradeBoostTimer -= 1
        if (tradeBoostTimer <= 0) {
          tradeBoostActive = false
          tradeBoostTimer = 0
        }
      }

      let activeRandomEvent = s.activeRandomEvent
      let randomEventTimer = s.randomEventTimer
      if (activeRandomEvent) {
        randomEventTimer -= 1
        if (randomEventTimer <= 0) {
          activeRandomEvent = null
          randomEventTimer = 0
        }
      }

      if (!activeRandomEvent) {
        const eventKey = rollRandomEvent(happiness)
        if (eventKey) {
          const evt = RANDOM_EVENTS[eventKey]
          if (eventKey === 'feud_outbreak' && newVillagers.length >= 2) {
            const shuffled = [...newVillagers].sort(() => Math.random() - 0.5)
            shuffled[0].mood = 'feuding'
            shuffled[0].feudTarget = shuffled[1].id
            shuffled[1].mood = 'feuding'
            shuffled[1].feudTarget = shuffled[0].id
            shuffled[0].moodTimer = 30
            shuffled[1].moodTimer = 30
            const chronicle = getMoodChronicle('feud', { villager: shuffled[0].name, target: shuffled[1].name })
            if (chronicle) newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            playRandomEvent()
            // Cooldown so zero-duration events don't allow immediate re-roll
            activeRandomEvent = eventKey
            randomEventTimer = 30
          } else if (eventKey === 'morale_boost') {
            newVillagers.forEach((v) => { v.mood = 'happy'; v.feudTarget = null; v.moodTimer = 30 })
            const chronicle = getMoodChronicle('random_event', { event: evt.label })
            if (chronicle) newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            playRandomEvent()
            // Cooldown so zero-duration events don't allow immediate re-roll
            activeRandomEvent = eventKey
            randomEventTimer = 30
          } else if (evt.duration > 0) {
            activeRandomEvent = eventKey
            randomEventTimer = evt.duration
            const chronicle = getMoodChronicle('random_event', { event: evt.label })
            if (chronicle) newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            playRandomEvent()
          }
        }
      }

      if (didHarvestSfx) playHarvestWork()
      if (didCombatSfx) playCombatClash()

      return {
        buildings: standingBuildings,
        villagers: aliveVillagers,
        resources: newResources,
        events: newEvents,
        nodes: newNodes,
        grid: newGrid,
        enemies: newEnemies,
        gameTick,
        tradeBoostActive,
        tradeBoostTimer,
        resourcePopups: popups,
        population: aliveVillagers.length,
        maxPopulation: maxPop,
        villageHappiness: happiness,
        activeRandomEvent,
        randomEventTimer,
        wandererTimer,
        pendingWanderer,
        gameOver,
      }
    })
  },

  // Activate trade boost
  activateTradeBoost: () => {
    set({ tradeBoostActive: true, tradeBoostTimer: 30 })
    const chronicle = getRandomChronicle('trade_boost')
    if (chronicle) {
      set((s) => ({
        events: [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now() }],
      }))
    }
  },

  // Upgrade building
  upgradeBuilding: (buildingId) => {
    const state = get()
    const building = state.buildings.find((b) => b.id === buildingId)
    if (!building || building.status !== 'active') return false
    const cost = building.level * 3
    if (state.resources.blueprints < cost) return false

    set((s) => ({
      buildings: s.buildings.map((b) => b.id === buildingId ? { ...b, level: b.level + 1 } : b),
      resources: { ...s.resources, blueprints: s.resources.blueprints - cost },
    }))
    playUpgrade()
    return true
  },

  // Accept a wanderer
  acceptWanderer: () => {
    const state = get()
    if (!state.pendingWanderer) return false
    
    const w = state.pendingWanderer
    const newVillager = {
      ...w,
      role: 'Wanderer',
      x: 0, y: 0,
      homeX: 0, homeY: 0,
      moodTimer: 30,
      assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
      targetX: 2 + Math.floor(Math.random()*4), targetY: 2 + Math.floor(Math.random()*4),
      walkProgress: 0,
      negotiationCount: 0, restTimer: 0,
      health: 100, maxHealth: 100, isMilitia: false,
      modelUrl: w.modelUrl || pickCharacterModel(),
    }
    newVillager.homeX = newVillager.targetX
    newVillager.homeY = newVillager.targetY

    set((s) => ({
      villagers: [...s.villagers, newVillager],
      pendingWanderer: null,
      events: [...s.events, { id: nextEventId++, text: `${w.name} has joined us!`, timestamp: Date.now() }]
    }))
    return true
  },

  rejectWanderer: () => {
    set({ pendingWanderer: null })
  },

  // Unlock plot
  unlockPlot: (px, py) => {
    const state = get()
    if (state.unlockedPlots.some(p => p.x === px && p.y === py)) return false
    if (state.resources.steam < 50 || state.resources.blueprints < 5) return false

    set((s) => ({
      unlockedPlots: [...s.unlockedPlots, { x: px, y: py }],
      resources: { ...s.resources, steam: s.resources.steam - 50, blueprints: s.resources.blueprints - 5 }
    }))
    get().spawnNodes(px, py, 4)
    return true
  },

  getAvailablePlots: () => {
    const state = get()
    const available = []
    const directions = [{dx:1, dy:0}, {dx:-1, dy:0}, {dx:0, dy:1}, {dx:0, dy:-1}]
    state.unlockedPlots.forEach(p => {
      directions.forEach(d => {
        const nx = p.x + d.dx, ny = p.y + d.dy
        if (!state.unlockedPlots.some(up => up.x === nx && up.y === ny) && !available.some(a => a.x === nx && a.y === ny)) {
          available.push({ x: nx, y: ny })
        }
      })
    })
    return available
  },

  // Draft a villager into the militia
  draftMilitia: (villagerId) => {
    const state = get()
    const villager = state.villagers.find(v => v.id === villagerId)
    if (!villager) return false
    const wasMilitia = villager.isMilitia

    // When un-drafting, clear assignments and send home
    if (wasMilitia && (villager.assignedBuildingId || villager.assignedNodeId)) {
      get().unassignVillager(villagerId)
    }

    set((s) => ({
      villagers: s.villagers.map(v => v.id === villagerId ? { ...v, isMilitia: !v.isMilitia } : v)
    }))
    return true
  },

  spawnEnemy: (px, py) => {
    const id = Date.now()
    const enemy = {
      id,
      x: px * PLOT_SIZE,
      y: py * PLOT_SIZE,
      targetX: 4, targetY: 4, // Target village center
      health: 35,
      maxHealth: 35,
      type: 'raider',
      speed: 0.05
    }
    set((s) => ({ enemies: [...s.enemies, enemy] }))
  },

  // Rally all idle militia to attack an enemy's position
  rallyMilitiaTo: (enemyId) => {
    const state = get()
    const enemy = state.enemies.find(e => e.id === enemyId)
    if (!enemy) return 0

    let rallied = 0
    state.villagers.forEach(v => {
      if (!v.isMilitia) return
      // Unassign busy militia first
      if (v.assignedBuildingId || v.assignedNodeId) {
        get().unassignVillager(v.id)
      }
      rallied++
    })
    set((s) => ({
      villagers: s.villagers.map(v => (
        v.isMilitia && !v.assignedBuildingId && !v.assignedNodeId
          ? { ...v, rallyTargetId: enemyId }
          : v
      ))
    }))

    return rallied
  },

  // UI actions
  selectCell: (x, y) => {
    const state = get()
    const key = `${x},${y}`
    const cell = state.grid[key]
    if (typeof cell === 'string' && cell.startsWith('node-')) {
       set({ selectedNode: parseInt(cell.split('-')[1]), selectedBuilding: null, selectedCell: {x, y}, showBuildMenu: false, selectedEnemy: null })
    } else {
       set({ selectedCell: { x, y }, showBuildMenu: true, selectedBuilding: null, selectedNode: null, selectedEnemy: null })
    }
  },
  selectBuilding: (id) => set({ selectedBuilding: id, showBuildMenu: false, selectedCell: null, selectedNode: null, selectedEnemy: null }),
  selectEnemy: (id) => set({ selectedEnemy: id, selectedBuilding: null, selectedNode: null, showBuildMenu: false, selectedCell: null }),
  closeBuildMenu: () => set({ showBuildMenu: false, selectedCell: null }),
  closeInfo: () => set({ selectedBuilding: null, selectedNode: null, selectedEnemy: null }),
  openChat: (villagerId) => set({ chatTarget: villagerId }),
  closeChat: () => set({ chatTarget: null }),

  // Save/Resume actions
  resumeGame: () => {
    const s = get()
    restoreIdCounters(s)

    // Snap all mid-walk villagers to their destination so there are no stale walk states.
    const cleanVillagers = s.villagers.map(v => {
      const updated = { ...v }
      if (updated.targetX !== null && updated.targetY !== null) {
        updated.x = updated.targetX
        updated.y = updated.targetY
        updated.targetX = null
        updated.targetY = null
        updated.walkProgress = 0
      }
      return updated
    })

    // Remove dead enemies; live ones retarget on the next tick
    const cleanEnemies = s.enemies.filter(e => e.health > 0)

    set({ _gameStarted: true, _sessionId: s._sessionId + 1, villagers: cleanVillagers, enemies: cleanEnemies })
  },
  startNewGame: () => {
    nextBuildingId = 1
    nextEventId = 1
    nextNodeId = 1
    set({
      ...INITIAL_STATE,
      villagers: INITIAL_VILLAGERS.map(v => ({ ...v })),
      _gameStarted: true,
      _saveLoaded: false,
      _sessionId: (get()._sessionId || 0) + 1,
      // Reset UI state
      selectedCell: null,
      selectedBuilding: null,
      selectedNode: null,
      selectedEnemy: null,
      chatTarget: null,
      showBuildMenu: false,
      resourcePopups: [],
      cameraTarget: { x: 0, y: 0, z: 0 },
      tutorial: {
        active: !localStorage.getItem('tutorial_done'),
        step: 'welcome',
      },
    })
    // Spawn initial nodes for the fresh game
    get().spawnNodes(0, 0, 5)
  },
}), {
  name: 'village-chronicles-save',
  // Only persist game-relevant state, not transient UI
  partialize: (state) => ({
    resources: state.resources,
    population: state.population,
    maxPopulation: state.maxPopulation,
    wandererTimer: state.wandererTimer,
    pendingWanderer: state.pendingWanderer,
    buildings: state.buildings,
    nodes: state.nodes,
    enemies: state.enemies,
    gameTick: state.gameTick,
    unlockedPlots: state.unlockedPlots,
    grid: state.grid,
    events: state.events,
    villagers: state.villagers,
    gameOver: state.gameOver,
    activeRandomEvent: state.activeRandomEvent,
    randomEventTimer: state.randomEventTimer,
    villageHappiness: state.villageHappiness,
    tradeBoostActive: state.tradeBoostActive,
    tradeBoostTimer: state.tradeBoostTimer,
  }),
  onRehydrateStorage: () => (state) => {
    if (state) {
      if (Array.isArray(state.villagers)) {
        state.villagers = state.villagers.map((v) => ({
          ...v,
          modelUrl: normalizeCharacterModelUrl(v.modelUrl),
        }))
      }
      if (state.pendingWanderer) {
        state.pendingWanderer = {
          ...state.pendingWanderer,
          modelUrl: normalizeCharacterModelUrl(state.pendingWanderer.modelUrl),
        }
      }
      state._hasHydrated = true
      if (state.gameTick > 0) {
        state._saveLoaded = true
      }
    }
  },
}))

export default useStore
