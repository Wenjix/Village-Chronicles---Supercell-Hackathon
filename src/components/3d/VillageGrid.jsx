import * as THREE from 'three'
import { GRID_SIZE, CELL_SIZE } from '../../utils/gridUtils'
import GridCell from './GridCell'
import useStore from '../../store/useStore'

const gridTotalSize = GRID_SIZE * CELL_SIZE
const borderGeo = new THREE.EdgesGeometry(
  new THREE.BoxGeometry(gridTotalSize, 0.01, gridTotalSize)
)

export default function VillageGrid() {
  const grid = useStore((s) => s.grid)
  const cells = []

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      cells.push(
        <GridCell key={`${x}-${y}`} x={x} y={y} occupied={grid[y][x] !== null} />
      )
    }
  }

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[gridTotalSize + 4, gridTotalSize + 4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.9} />
      </mesh>

      {/* Grid border */}
      <lineSegments position={[0, 0.02, 0]} geometry={borderGeo}>
        <lineBasicMaterial color="#334155" />
      </lineSegments>

      {cells}
    </group>
  )
}
