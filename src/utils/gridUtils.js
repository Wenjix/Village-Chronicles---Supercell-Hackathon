export const PLOT_SIZE = 8
export const CELL_SIZE = 1.2
export const GRID_SIZE = PLOT_SIZE // Legacy support

export function getUnlockedPlotWorldBounds(unlockedPlots = [{ x: 0, y: 0 }]) {
  const plots = unlockedPlots.length > 0 ? unlockedPlots : [{ x: 0, y: 0 }]
  const offset = ((PLOT_SIZE - 1) * CELL_SIZE) / 2
  const halfCell = CELL_SIZE / 2

  const minPlotX = Math.min(...plots.map((p) => p.x))
  const maxPlotX = Math.max(...plots.map((p) => p.x))
  const minPlotY = Math.min(...plots.map((p) => p.y))
  const maxPlotY = Math.max(...plots.map((p) => p.y))

  const minCellX = minPlotX * PLOT_SIZE
  const maxCellX = maxPlotX * PLOT_SIZE + (PLOT_SIZE - 1)
  const minCellY = minPlotY * PLOT_SIZE
  const maxCellY = maxPlotY * PLOT_SIZE + (PLOT_SIZE - 1)

  const minX = minCellX * CELL_SIZE - offset - halfCell
  const maxX = maxCellX * CELL_SIZE - offset + halfCell
  const minZ = minCellY * CELL_SIZE - offset - halfCell
  const maxZ = maxCellY * CELL_SIZE - offset + halfCell

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
  }
}

export function gridToWorld(gridX, gridY) {
  // Center plot (0,0) around (0,0,0) in world space
  // Plot (0,0) covers cells 0 to PLOT_SIZE-1
  // World center of plot (0,0) is ((PLOT_SIZE-1)/2 * CELL_SIZE)
  const offset = ((PLOT_SIZE - 1) * CELL_SIZE) / 2
  return [
    gridX * CELL_SIZE - offset,
    0,
    gridY * CELL_SIZE - offset,
  ]
}

export function worldToGrid(worldX, worldZ) {
  const offset = ((PLOT_SIZE - 1) * CELL_SIZE) / 2
  return [
    Math.round((worldX + offset) / CELL_SIZE),
    Math.round((worldZ + offset) / CELL_SIZE),
  ]
}

export function isValidCell(x, y, unlockedPlots) {
  const px = Math.floor(x / PLOT_SIZE)
  const py = Math.floor(y / PLOT_SIZE)
  return unlockedPlots.some(p => p.x === px && p.y === py)
}

export function createEmptyGrid() {
  // We'll move to an object-based grid in the store for better sparse support
  return {}
}
