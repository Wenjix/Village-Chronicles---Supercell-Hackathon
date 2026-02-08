import { PLOT_SIZE } from '../../utils/gridUtils'
import GridCell from './GridCell'
import ResourceNode from './ResourceNode'
import useStore from '../../store/useStore'

function Plot({ px, py }) {
  const grid = useStore((s) => s.grid)
  const cells = []

  for (let y = 0; y < PLOT_SIZE; y++) {
    for (let x = 0; x < PLOT_SIZE; x++) {
      const gx = px * PLOT_SIZE + x
      const gy = py * PLOT_SIZE + y
      const key = `${gx},${gy}`
      const isOccupied = grid[key] !== undefined
      cells.push(
        <GridCell key={key} x={gx} y={gy} occupied={isOccupied} />
      )
    }
  }

  return (
    <group>
      {cells}
    </group>
  )
}

export default function VillageGrid() {
  const unlockedPlots = useStore((s) => s.unlockedPlots)
  const nodes = useStore((s) => s.nodes)

  return (
    <group>
      {/* Ground plane (large enough for now) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#0b0f19" metalness={0.1} roughness={1.0} />
      </mesh>

      {unlockedPlots.map((p) => (
        <Plot key={`${p.x},${p.y}`} px={p.x} py={p.y} />
      ))}

      {/* Resource Nodes */}
      {nodes.map((node) => (
        <ResourceNode key={`node-${node.id}`} node={node} />
      ))}
    </group>
  )
}
