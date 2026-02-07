export const GRID_SIZE = 8
export const CELL_SIZE = 1.2
export const GRID_OFFSET = (GRID_SIZE * CELL_SIZE) / 2 - CELL_SIZE / 2

export function gridToWorld(gridX, gridY) {
  return [
    gridX * CELL_SIZE - GRID_OFFSET,
    0,
    gridY * CELL_SIZE - GRID_OFFSET,
  ]
}

export function worldToGrid(worldX, worldZ) {
  return [
    Math.round((worldX + GRID_OFFSET) / CELL_SIZE),
    Math.round((worldZ + GRID_OFFSET) / CELL_SIZE),
  ]
}

export function isValidCell(x, y) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE
}

export function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  )
}
