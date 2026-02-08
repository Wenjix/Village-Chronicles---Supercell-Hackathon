import { create } from 'zustand'
import { BUILDINGS, canAfford } from '../data/buildings'
import { getRandomChronicle, getMoodChronicle } from '../data/chronicles'
import { PLOT_SIZE, createEmptyGrid, isValidCell } from '../utils/gridUtils'
import { playBuildStart, playBuildComplete, playUpgrade, playRefusal, playNegotiateSuccess, playRandomEvent } from '../utils/sounds'
import { MOODS, rollMoodShift, rollRefusal, getBuildDecrement, getVillageHappiness, rollRandomEvent, RANDOM_EVENTS } from '../data/moods'
import { NODE_TYPES, getRandomNodeType, GUARANTEED_NODE_TYPES } from '../data/nodes'

let nextBuildingId = 1
let nextEventId = 1
let nextNodeId = 1

const useStore = create((set, get) => ({
  // Resources
  resources: { wood: 0, stone: 0, metal: 0, water: 0, gears: 0, steam: 0, crystals: 0, blueprints: 0 },

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
  threatMeter: 0,

  // Unlocked plots (8x8 chunks)
  unlockedPlots: [{ x: 0, y: 0 }],

  // Object-based grid: { "x,y": id or "node-id" }
  grid: createEmptyGrid(),

  // Chronicle events
  events: [],

  // NPC villagers
  villagers: [
    {
      id: 1, name: 'Barnaby Cogsworth', role: 'Engineer', x: 2, y: 2,
      homeX: 2, homeY: 2,
      mood: 'happy', personality: 'diligent', moodTimer: 30,
      assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
      targetX: null, targetY: null, walkProgress: 0,
      negotiationCount: 0, restTimer: 0,
      health: 100, maxHealth: 100, isMilitia: false,
    },
    {
      id: 2, name: 'Elara Steamwright', role: 'Alchemist', x: 5, y: 3,
      homeX: 5, homeY: 3,
      mood: 'happy', personality: 'cheerful', moodTimer: 25,
      assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
      targetX: null, targetY: null, walkProgress: 0,
      negotiationCount: 0, restTimer: 0,
      health: 100, maxHealth: 100, isMilitia: false,
    },
    {
      id: 3, name: 'Thaddeus Ironclaw', role: 'Merchant', x: 4, y: 6,
      homeX: 4, homeY: 6,
      mood: 'happy', personality: 'hothead', moodTimer: 20,
      assignedBuildingId: null, assignedNodeId: null, feudTarget: null, rallyTargetId: null,
      targetX: null, targetY: null, walkProgress: 0,
      negotiationCount: 0, restTimer: 0,
      health: 100, maxHealth: 100, isMilitia: false,
    },
  ],

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
          const node = newNodes.find(n => n.id === updated.assignedNodeId)
          if (node && node.remainingAmount > 0) {
            if (!updated._harvestTimer || updated._harvestTimer <= 0) {
              const typeDef = NODE_TYPES[node.type]
              const harvestAmount = typeDef.amountPerHarvest
              const actualHarvest = Math.min(harvestAmount, node.remainingAmount)
              
              node.remainingAmount -= actualHarvest
              newResources[typeDef.resource] += actualHarvest
              popups.push({ resource: typeDef.resource, amount: actualHarvest, nodeId: node.id })
              
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

      const newGrid = { ...s.grid }
      Object.keys(newGrid).forEach(key => {
        const val = newGrid[key]
        if (typeof val === 'string' && val.startsWith('node-')) {
          const id = parseInt(val.split('-')[1])
          const node = newNodes.find(n => n.id === id)
          if (!node || node.remainingAmount <= 0) delete newGrid[key]
        }
      })
      newNodes = newNodes.filter(n => n.remainingAmount > 0)

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
      newBuildings.forEach((b) => {
        if (b.status === 'active') {
          const def = BUILDINGS[b.type]
          if (def.produces && Object.keys(def.produces).length > 0) {
            Object.entries(def.produces).forEach(([resource, amount]) => {
              const gain = amount * multiplier * (b.level || 1)
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

      // --- Combat & Threat (Phase 4) ---
      let activeBuildings = newBuildings.filter(b => b.status === 'active')
      const steamProduction = activeBuildings.reduce((acc, b) => acc + (BUILDINGS[b.type].produces?.steam || 0), 0)
      let threatMeter = Math.min(100, s.threatMeter + steamProduction * 0.05 + 0.1)
      let newEnemies = [...s.enemies]

      if (threatMeter >= 100) {
        threatMeter = 0
        const chronicle = "ALARM! Raiders have been spotted approaching from the wastes!"
        newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
        const distPlot = s.unlockedPlots[Math.floor(Math.random()*s.unlockedPlots.length)]
        const ex = distPlot.x * PLOT_SIZE + (Math.random() > 0.5 ? PLOT_SIZE : 0)
        const ey = distPlot.y * PLOT_SIZE + (Math.random() > 0.5 ? PLOT_SIZE : 0)
        newEnemies.push({
          id: Date.now(), x: ex, y: ey, targetX: 4, targetY: 4, health: 50, maxHealth: 50, type: 'raider', speed: 0.05
        })
      }

      // Watchtower slow: enemies in range of a watchtower move at half speed
      const watchtowers = activeBuildings.filter(b => BUILDINGS[b.type].special === 'vision')

      newEnemies = newEnemies.map(e => {
        const dx = e.targetX - e.x, dy = e.targetY - e.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        if (dist > 0.2) {
          let speed = e.speed
          // Check watchtower slow
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
             if (e.health <= 0) {
                popups.push({ resource: 'crystals', amount: 5, nodeId: 'enemy-' + e.id })
                newResources.crystals += 5
             }
          }
        })
      })

      // Enemies attack nearest building when they arrive (dist <= 0.2 to target)
      newEnemies.forEach(e => {
        const dx = e.targetX - e.x, dy = e.targetY - e.y
        const distToTarget = Math.sqrt(dx*dx + dy*dy)
        if (distToTarget <= 0.2) {
          // Find nearest active building within 1.5 range
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
            if (closestBldg.health <= 0) {
              closestBldg.health = 0
              closestBldg.status = 'destroyed'
              const def = BUILDINGS[closestBldg.type]
              const chronicle = `Devastation! The ${def?.name || closestBldg.type} has been reduced to rubble by raiders!`
              newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
              // Free the grid cell
              const key = `${closestBldg.gridX},${closestBldg.gridY}`
              delete newGrid[key]
              // Unassign worker
              if (closestBldg.assignedVillager) {
                const worker = newVillagers.find(v => v.id === closestBldg.assignedVillager)
                if (worker) {
                  worker.assignedBuildingId = null
                  worker.targetX = worker.homeX
                  worker.targetY = worker.homeY
                  worker.walkProgress = 0
                }
              }
              // Retarget enemy to next nearest building
              let nextBldg = null
              let nextDist = Infinity
              newBuildings.forEach(b => {
                if (b.id === closestBldg.id || (b.status !== 'active' && b.status !== 'building')) return
                const bd = Math.sqrt(Math.pow(e.x - b.gridX, 2) + Math.pow(e.y - b.gridY, 2))
                if (bd < nextDist) { nextDist = bd; nextBldg = b }
              })
              if (nextBldg) {
                e.targetX = nextBldg.gridX
                e.targetY = nextBldg.gridY
              }
            }
          }
        }
      })

      // Enemies fight back: damage ANY villager within 1.5 range
      newEnemies.forEach(e => {
        newVillagers.forEach(v => {
          const dist = Math.sqrt(Math.pow(e.x - v.x, 2) + Math.pow(e.y - v.y, 2))
          if (dist <= 1.5) {
            v.health -= 1
            // Non-militia flee
            if (!v.isMilitia && !v.assignedBuildingId && !v.assignedNodeId) {
              v.targetX = v.homeX
              v.targetY = v.homeY
              v.walkProgress = 0
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
              e.health -= 2
              inCombat = true
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
            mood: 'happy'
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
          } else if (eventKey === 'morale_boost') {
            newVillagers.forEach((v) => { v.mood = 'happy'; v.feudTarget = null; v.moodTimer = 30 })
            const chronicle = getMoodChronicle('random_event', { event: evt.label })
            if (chronicle) newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            playRandomEvent()
          } else if (evt.duration > 0) {
            activeRandomEvent = eventKey
            randomEventTimer = evt.duration
            const chronicle = getMoodChronicle('random_event', { event: evt.label })
            if (chronicle) newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            playRandomEvent()
          }
        }
      }

      return {
        buildings: standingBuildings,
        villagers: aliveVillagers,
        resources: newResources,
        events: newEvents,
        nodes: newNodes,
        grid: newGrid,
        enemies: newEnemies,
        threatMeter,
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
      health: 50,
      maxHealth: 50,
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
}))

export default useStore
