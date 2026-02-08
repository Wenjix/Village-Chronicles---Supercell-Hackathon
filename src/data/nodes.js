export const NODE_TYPES = {
  WOOD: {
    name: 'Ancient Timbers',
    resource: 'wood',
    amountPerHarvest: 8,
    maxAmount: 120,
    color: '#713f12', // brown
  },
  STONE: {
    name: 'Obsidian Outcrop',
    resource: 'stone',
    amountPerHarvest: 5,
    maxAmount: 150,
    color: '#475569', // grey
  },
  METAL: {
    name: 'Iron Vein',
    resource: 'metal',
    amountPerHarvest: 3,
    maxAmount: 80,
    color: '#94a3b8', // metallic
  },
  WATER: {
    name: 'Steam Vent',
    resource: 'water',
    amountPerHarvest: 10,
    maxAmount: 200,
    color: '#0ea5e9', // blue
  },
  OUTPOST: {
    name: 'Raider Outpost',
    resource: 'crystals',
    amountPerHarvest: 0, // Handled by pillage logic
    maxAmount: 500,
    color: '#ef4444',
  }
};

const HARVESTABLE_TYPES = Object.keys(NODE_TYPES).filter(t => t !== 'OUTPOST');

export const getRandomNodeType = () => {
  return HARVESTABLE_TYPES[Math.floor(Math.random() * HARVESTABLE_TYPES.length)];
};

// Guaranteed types for starting plot: one of each raw resource
export const GUARANTEED_NODE_TYPES = ['WOOD', 'STONE', 'METAL', 'WATER'];
