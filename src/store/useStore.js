import { create } from 'zustand'
import { BUILDINGS, canAfford } from '../data/buildings'
import { getRandomChronicle } from '../data/chronicles'
import { GRID_SIZE, createEmptyGrid } from '../utils/gridUtils'

let nextBuildingId = 1
let nextEventId = 1

const useStore = create((set, get) => ({
  // Resources
  resources: { gears: 100, steam: 0, crystals: 0 },

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
      newBuildings.forEach((b) => {
        if (b.status === 'active') {
          const def = BUILDINGS[b.type]
          if (def.produces) {
            Object.entries(def.produces).forEach(([resource, amount]) => {
              const gain = amount * multiplier
              newResources[resource] = (newResources[resource] || 0) + gain
              popups.push({ resource, amount: gain, buildingId: b.id })
            })
          }
        }
      })

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

  // UI actions
  selectCell: (x, y) => set({ selectedCell: { x, y }, showBuildMenu: true, selectedBuilding: null }),
  selectBuilding: (id) => set({ selectedBuilding: id, showBuildMenu: false, selectedCell: null }),
  closeBuildMenu: () => set({ showBuildMenu: false, selectedCell: null }),
  closeInfo: () => set({ selectedBuilding: null }),
  openChat: (villagerId) => set({ chatTarget: villagerId }),
  closeChat: () => set({ chatTarget: null }),
}))

export default useStore
