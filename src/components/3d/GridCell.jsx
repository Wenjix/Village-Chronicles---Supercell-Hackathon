import { useState } from 'react'
import { gridToWorld, CELL_SIZE } from '../../utils/gridUtils'
import useStore from '../../store/useStore'

export default function GridCell({ x, y, occupied }) {
  const [hovered, setHovered] = useState(false)
  const selectCell = useStore((s) => s.selectCell)
  const grid = useStore((s) => s.grid)
  const [wx, , wz] = gridToWorld(x, y)

  const key = `${x},${y}`
  const isNode = typeof grid[key] === 'string' && grid[key].startsWith('node-')
  const clickable = !occupied || isNode

  return (
    <mesh
      position={[wx, 0.01, wz]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e) => {
        e.stopPropagation()
        if (clickable) selectCell(x, y)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        if (clickable) {
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      <planeGeometry args={[CELL_SIZE * 0.95, CELL_SIZE * 0.95]} />
      <meshStandardMaterial
        color={hovered && clickable ? '#2563eb' : '#1e293b'}
        transparent
        opacity={hovered && clickable ? 0.5 : 0.15}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  )
}
