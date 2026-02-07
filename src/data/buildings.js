export const BUILDING_TYPES = {
  CLOCKWORK_FORGE: 'clockwork_forge',
  STEAM_MILL: 'steam_mill',
  CRYSTAL_REFINERY: 'crystal_refinery',
  AIRSHIP_DOCK: 'airship_dock',
  INVENTORS_WORKSHOP: 'inventors_workshop',
}

export const BUILDINGS = {
  [BUILDING_TYPES.CLOCKWORK_FORGE]: {
    name: 'Clockwork Forge',
    description: 'A rumbling forge that hammers out precision gears day and night.',
    cost: { gears: 0, steam: 0, crystals: 0 },
    buildTime: 10,
    produces: { gears: 5 },
    color: '#b87333',
    emissive: '#8b4513',
  },
  [BUILDING_TYPES.STEAM_MILL]: {
    name: 'Steam Mill',
    description: 'Pressurized chambers that harness raw steam power.',
    cost: { gears: 50, steam: 0, crystals: 0 },
    buildTime: 15,
    produces: { steam: 3 },
    color: '#9ca3af',
    emissive: '#6b7280',
  },
  [BUILDING_TYPES.CRYSTAL_REFINERY]: {
    name: 'Crystal Refinery',
    description: 'An arcane distillery that purifies raw aether into crystals.',
    cost: { gears: 100, steam: 50, crystals: 0 },
    buildTime: 30,
    produces: { crystals: 1 },
    color: '#a855f7',
    emissive: '#7c3aed',
  },
  [BUILDING_TYPES.AIRSHIP_DOCK]: {
    name: 'Airship Dock',
    description: 'A landing platform for trade zeppelins. Doubles output for 30s.',
    cost: { gears: 80, steam: 40, crystals: 20 },
    buildTime: 45,
    produces: {},
    special: 'trade_boost',
    boostDuration: 30,
    color: '#78716c',
    emissive: '#57534e',
  },
  [BUILDING_TYPES.INVENTORS_WORKSHOP]: {
    name: "Inventor's Workshop",
    description: 'A mad genius labors here, unlocking new blueprints.',
    cost: { gears: 150, steam: 75, crystals: 30 },
    buildTime: 60,
    produces: {},
    special: 'blueprints',
    color: '#2563eb',
    emissive: '#1d4ed8',
  },
}

export function canAfford(resources, buildingType) {
  const cost = BUILDINGS[buildingType].cost
  return (
    resources.gears >= (cost.gears || 0) &&
    resources.steam >= (cost.steam || 0) &&
    resources.crystals >= (cost.crystals || 0)
  )
}
