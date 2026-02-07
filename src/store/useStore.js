import { create } from 'zustand'
import { BUILDINGS, canAfford } from '../data/buildings'
import { getRandomChronicle, getMoodChronicle } from '../data/chronicles'
import { GRID_SIZE, createEmptyGrid } from '../utils/gridUtils'
import { playBuildStart, playBuildComplete, playUpgrade, playRefusal, playNegotiateSuccess, playRandomEvent } from '../utils/sounds'
import { MOODS, rollMoodShift, rollRefusal, getBuildDecrement, getVillageHappiness, rollRandomEvent, RANDOM_EVENTS } from '../data/moods'

let nextBuildingId = 1
let nextEventId = 1

const useStore = create((set, get) => ({
  // Resources
  resources: { gears: 100, steam: 0, crystals: 0, blueprints: 0 },

  // Population — grows with active buildings
  population: 3,

  // Buildings placed on grid
  buildings: [],

  // 8x8 grid — null or building id
  grid: createEmptyGrid(),

  // Chronicle events
  events: [],

  // NPC villagers (expanded with mood & personality)
  villagers: [
    {
      id: 1, name: 'Barnaby Cogsworth', role: 'Engineer', x: 2, y: 2,
      homeX: 2, homeY: 2,
      mood: 'happy', personality: 'diligent', moodTimer: 30,
      assignedBuildingId: null, feudTarget: null,
      targetX: null, targetY: null, walkProgress: 0,
      negotiationCount: 0,
    },
    {
      id: 2, name: 'Elara Steamwright', role: 'Alchemist', x: 5, y: 3,
      homeX: 5, homeY: 3,
      mood: 'happy', personality: 'cheerful', moodTimer: 25,
      assignedBuildingId: null, feudTarget: null,
      targetX: null, targetY: null, walkProgress: 0,
      negotiationCount: 0,
    },
    {
      id: 3, name: 'Thaddeus Ironclaw', role: 'Merchant', x: 4, y: 6,
      homeX: 4, homeY: 6,
      mood: 'happy', personality: 'hothead', moodTimer: 20,
      assignedBuildingId: null, feudTarget: null,
      targetX: null, targetY: null, walkProgress: 0,
      negotiationCount: 0,
    },
  ],

  // Random event state
  activeRandomEvent: null,
  randomEventTimer: 0,

  // Village happiness (0-100)
  villageHappiness: 100,

  // UI state
  selectedCell: null,
  selectedBuilding: null,
  chatTarget: null,
  showBuildMenu: false,
  tradeBoostActive: false,
  tradeBoostTimer: 0,
  resourcePopups: [],

  // Place a building — now creates as 'proposed' status
  placeBuilding: (type, gridX, gridY) => {
    const state = get()
    const def = BUILDINGS[type]
    if (!def) return false
    if (!canAfford(state.resources, type)) return false
    if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) return false
    if (state.grid[gridY][gridX] !== null) return false

    const id = nextBuildingId++
    const building = {
      id,
      type,
      gridX,
      gridY,
      status: 'proposed',
      timer: def.buildTime,
      level: 1,
      assignedVillager: null,
    }

    set((s) => {
      const newGrid = s.grid.map((row) => [...row])
      newGrid[gridY][gridX] = id

      const chronicle = getMoodChronicle('proposed', { building: def.name })
      const newEvents = chronicle
        ? [...s.events, { id: nextEventId++, text: chronicle, timestamp: Date.now(), buildingType: type }]
        : [...s.events]

      return {
        buildings: [...s.buildings, building],
        grid: newGrid,
        resources: {
          gears: s.resources.gears - (def.cost.gears || 0),
          steam: s.resources.steam - (def.cost.steam || 0),
          crystals: s.resources.crystals - (def.cost.crystals || 0),
          blueprints: s.resources.blueprints,
        },
        events: newEvents,
        showBuildMenu: false,
        selectedCell: null,
        selectedBuilding: id,
      }
    })
    playBuildStart()
    return true
  },

  // Assign a villager to a proposed building
  assignVillager: (buildingId, villagerId) => {
    const state = get()
    const building = state.buildings.find((b) => b.id === buildingId)
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!building || building.status !== 'proposed') return { success: false, reason: 'not_proposed' }
    if (!villager) return { success: false, reason: 'no_villager' }
    if (villager.assignedBuildingId) return { success: false, reason: 'already_busy' }

    // Check for refusal (mercy rule: auto-succeed after 3 negotiations)
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

    // Assign — villager walks to adjacent cell then construction starts
    // Pick an adjacent cell (prefer south, then east, west, north) that isn't occupied
    const adjacentOffsets = [
      { dx: 0, dy: 1 },  // south (in front)
      { dx: 1, dy: 0 },  // east
      { dx: -1, dy: 0 }, // west
      { dx: 0, dy: -1 }, // north
    ]
    let workX = building.gridX
    let workY = building.gridY + 1 // default: south
    for (const off of adjacentOffsets) {
      const nx = building.gridX + off.dx
      const ny = building.gridY + off.dy
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && state.grid[ny][nx] === null) {
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

  // Negotiate with a villager to improve their mood
  negotiateWithVillager: (villagerId) => {
    const state = get()
    const villager = state.villagers.find((v) => v.id === villagerId)
    if (!villager) return false

    // Negotiation improves mood toward happy
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

  // Game tick — called every second
  tick: () => {
    set((s) => {
      let newEvents = [...s.events]
      const newResources = { ...s.resources }
      const popups = []

      // --- Mood drift for villagers ---
      const newVillagers = s.villagers.map((v) => {
        let updated = { ...v }

        // Mood timer countdown
        updated.moodTimer -= 1
        if (updated.moodTimer <= 0) {
          const newMood = rollMoodShift(updated.personality)
          // If rolling feuding, pick a random feud target
          if (newMood === 'feuding' && s.villagers.length > 1) {
            const others = s.villagers.filter((o) => o.id !== v.id)
            updated.feudTarget = others[Math.floor(Math.random() * others.length)].id
          } else if (newMood !== 'feuding') {
            updated.feudTarget = null
          }
          updated.mood = newMood
          updated.moodTimer = 20 + Math.floor(Math.random() * 20) // 20-40 ticks
        }

        // Walk progress toward target (building or home)
        if (updated.targetX !== null && updated.targetY !== null && updated.walkProgress < 1) {
          const speed = MOODS[updated.mood]?.buildSpeed || 1.0
          updated.walkProgress = Math.min(1, updated.walkProgress + 0.1 * speed)

          // If walking home (no building assignment) and arrived, snap to home
          if (updated.walkProgress >= 1 && !updated.assignedBuildingId) {
            updated.x = updated.targetX
            updated.y = updated.targetY
            updated.targetX = null
            updated.targetY = null
          }
        }

        return updated
      })

      // --- Building logic ---
      const newBuildings = s.buildings.map((b) => {
        // Check if assigned villager has arrived (walkProgress >= 1) → start building
        if (b.status === 'assigned' && b.assignedVillager) {
          const worker = newVillagers.find((v) => v.id === b.assignedVillager)
          if (worker && worker.walkProgress >= 1) {
            // Snap worker to their target (adjacent cell, NOT on the building)
            worker.x = worker.targetX
            worker.y = worker.targetY
            worker.targetX = null
            worker.targetY = null
            return { ...b, status: 'building' }
          }
          return b
        }

        if (b.status === 'building') {
          // Use mood-based build speed
          const worker = newVillagers.find((v) => v.id === b.assignedVillager)
          const decrement = worker ? getBuildDecrement(worker.mood) : 1
          const newTimer = b.timer - decrement
          if (newTimer <= 0) {
            // Building completed
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

            // Check milestones
            const activeCount = s.buildings.filter((x) => x.status === 'active').length + 1
            if (activeCount === 5) {
              const m = getRandomChronicle('milestone_5')
              if (m) newEvents = [...newEvents, { id: nextEventId++, text: m, timestamp: Date.now() }]
            } else if (activeCount === 10) {
              const m = getRandomChronicle('milestone_10')
              if (m) newEvents = [...newEvents, { id: nextEventId++, text: m, timestamp: Date.now() }]
            }

            // Free up the worker — send them walking back home
            if (worker) {
              worker.assignedBuildingId = null
              worker.targetX = worker.homeX
              worker.targetY = worker.homeY
              worker.walkProgress = 0
            }

            playBuildComplete()

            if (def?.special === 'trade_boost') {
              return { ...b, status: 'active', timer: 0, assignedVillager: null, boostReady: true }
            }
            return { ...b, status: 'active', timer: 0, assignedVillager: null }
          }
          return { ...b, timer: newTimer }
        }
        return b
      })

      // --- Produce resources from active buildings ---
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
      if (blueprintTick) {
        newResources.blueprints = (newResources.blueprints || 0) + 1
      }

      // Population = base 3 villagers + 2 per active building
      const activeCount = newBuildings.filter((b) => b.status === 'active').length
      const population = 3 + activeCount * 2

      // Trade boost timer
      let tradeBoostActive = s.tradeBoostActive
      let tradeBoostTimer = s.tradeBoostTimer
      if (tradeBoostActive) {
        tradeBoostTimer -= 1
        if (tradeBoostTimer <= 0) {
          tradeBoostActive = false
          tradeBoostTimer = 0
        }
      }

      // Random event timer
      let activeRandomEvent = s.activeRandomEvent
      let randomEventTimer = s.randomEventTimer
      if (activeRandomEvent) {
        randomEventTimer -= 1
        if (randomEventTimer <= 0) {
          activeRandomEvent = null
          randomEventTimer = 0
        }
      }

      // Roll for new random events (only when none active, ~every tick with low chance)
      if (!activeRandomEvent) {
        const eventKey = rollRandomEvent(happiness)
        if (eventKey) {
          const evt = RANDOM_EVENTS[eventKey]
          // Handle feud outbreak
          if (eventKey === 'feud_outbreak' && newVillagers.length >= 2) {
            const shuffled = [...newVillagers].sort(() => Math.random() - 0.5)
            shuffled[0].mood = 'feuding'
            shuffled[0].feudTarget = shuffled[1].id
            shuffled[1].mood = 'feuding'
            shuffled[1].feudTarget = shuffled[0].id
            shuffled[0].moodTimer = 30
            shuffled[1].moodTimer = 30
            const chronicle = getMoodChronicle('feud', {
              villager: shuffled[0].name,
              target: shuffled[1].name,
            })
            if (chronicle) {
              newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            }
            playRandomEvent()
          } else if (eventKey === 'morale_boost') {
            // Boost all moods to happy
            newVillagers.forEach((v) => {
              v.mood = 'happy'
              v.feudTarget = null
              v.moodTimer = 30
            })
            const chronicle = getMoodChronicle('random_event', { event: evt.label })
            if (chronicle) {
              newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            }
            playRandomEvent()
          } else if (evt.duration > 0) {
            activeRandomEvent = eventKey
            randomEventTimer = evt.duration
            const chronicle = getMoodChronicle('random_event', { event: evt.label })
            if (chronicle) {
              newEvents = [...newEvents, { id: nextEventId++, text: chronicle, timestamp: Date.now() }]
            }
            playRandomEvent()
          }
        }
      }

      return {
        buildings: newBuildings,
        villagers: newVillagers,
        resources: newResources,
        events: newEvents,
        tradeBoostActive,
        tradeBoostTimer,
        resourcePopups: popups,
        population,
        villageHappiness: happiness,
        activeRandomEvent,
        randomEventTimer,
      }
    })
  },

  // Activate trade boost from airship dock
  activateTradeBoost: () => {
    set({ tradeBoostActive: true, tradeBoostTimer: 30 })
    const chronicle = getRandomChronicle('trade_boost')
    if (chronicle) {
      set((s) => ({
        events: [
          ...s.events,
          { id: nextEventId++, text: chronicle, timestamp: Date.now() },
        ],
      }))
    }
  },

  // Upgrade a building (costs blueprints, increases level)
  upgradeBuilding: (buildingId) => {
    const state = get()
    const building = state.buildings.find((b) => b.id === buildingId)
    if (!building || building.status !== 'active') return false
    const cost = building.level * 3
    if (state.resources.blueprints < cost) return false

    set((s) => ({
      buildings: s.buildings.map((b) =>
        b.id === buildingId ? { ...b, level: b.level + 1 } : b
      ),
      resources: { ...s.resources, blueprints: s.resources.blueprints - cost },
    }))
    playUpgrade()
    return true
  },

  // UI actions
  selectCell: (x, y) => set({ selectedCell: { x, y }, showBuildMenu: true, selectedBuilding: null }),
  selectBuilding: (id) => set({ selectedBuilding: id, showBuildMenu: false, selectedCell: null }),
  closeBuildMenu: () => set({ showBuildMenu: false, selectedCell: null }),
  closeInfo: () => set({ selectedBuilding: null }),
  openChat: (villagerId) => set({ chatTarget: villagerId }),
  closeChat: () => set({ chatTarget: null }),
}))

export default useStore
