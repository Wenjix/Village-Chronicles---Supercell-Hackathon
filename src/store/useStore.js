import { create } from 'zustand'
import { BUILDINGS, canAfford } from '../data/buildings'
import { getRandomChronicle } from '../data/chronicles'
import { GRID_SIZE, createEmptyGrid } from '../utils/gridUtils'
import { playBuildStart, playBuildComplete, playUpgrade } from '../utils/sounds'

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

  // NPC villagers (stubbed)
  villagers: [
    { id: 1, name: 'Barnaby Cogsworth', role: 'Engineer', x: 2, y: 2 },
    { id: 2, name: 'Elara Steamwright', role: 'Alchemist', x: 5, y: 3 },
    { id: 3, name: 'Thaddeus Ironclaw', role: 'Merchant', x: 4, y: 6 },
  ],

  // UI state
  selectedCell: null,
  selectedBuilding: null,
  chatTarget: null,
  showBuildMenu: false,
  tradeBoostActive: false,
  tradeBoostTimer: 0,
  resourcePopups: [],

  // Place a building
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
      status: 'building',
      timer: def.buildTime,
      level: 1,
    }

    set((s) => {
      const newGrid = s.grid.map((row) => [...row])
      newGrid[gridY][gridX] = id
      return {
        buildings: [...s.buildings, building],
        grid: newGrid,
        resources: {
          gears: s.resources.gears - (def.cost.gears || 0),
          steam: s.resources.steam - (def.cost.steam || 0),
          crystals: s.resources.crystals - (def.cost.crystals || 0),
        },
        showBuildMenu: false,
        selectedCell: null,
      }
    })
    playBuildStart()
    return true
  },

  // Game tick — called every second
  tick: () => {
    set((s) => {
      let newEvents = [...s.events]
      const newResources = { ...s.resources }
      const popups = []

      const newBuildings = s.buildings.map((b) => {
        if (b.status === 'building') {
          const newTimer = b.timer - 1
          if (newTimer <= 0) {
            // Building completed
            const chronicle = getRandomChronicle(b.type)
            if (chronicle) {
              newEvents = [
                ...newEvents,
                {
                  id: nextEventId++,
                  text: chronicle,
                  timestamp: Date.now(),
                  buildingType: b.type,
                },
              ]
            }

            // Check milestones
            const activeCount =
              s.buildings.filter((x) => x.status === 'active').length + 1
            if (activeCount === 5) {
              const m = getRandomChronicle('milestone_5')
              if (m) {
                newEvents = [
                  ...newEvents,
                  { id: nextEventId++, text: m, timestamp: Date.now() },
                ]
              }
            } else if (activeCount === 10) {
              const m = getRandomChronicle('milestone_10')
              if (m) {
                newEvents = [
                  ...newEvents,
                  { id: nextEventId++, text: m, timestamp: Date.now() },
                ]
              }
            }

            playBuildComplete()

            // Activate airship dock boost
            if (BUILDINGS[b.type].special === 'trade_boost') {
              return { ...b, status: 'active', timer: 0, boostReady: true }
            }

            return { ...b, status: 'active', timer: 0 }
          }
          return { ...b, timer: newTimer }
        }
        return b
      })

      // Produce resources from active buildings
      const multiplier = s.tradeBoostActive ? 2 : 1
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
          // Workshop produces 1 blueprint every 10 ticks
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

      return {
        buildings: newBuildings,
        resources: newResources,
        events: newEvents,
        tradeBoostActive,
        tradeBoostTimer,
        resourcePopups: popups,
        population,
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
    const cost = building.level * 3 // 3, 6, 9... blueprints per level
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
