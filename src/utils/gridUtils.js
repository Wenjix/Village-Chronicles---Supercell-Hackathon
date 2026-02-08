export const PLOT_SIZE = 8
export const CELL_SIZE = 1.2
export const GRID_SIZE = PLOT_SIZE // Legacy support

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
