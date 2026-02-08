import React from 'react'
import { CELL_SIZE } from '../../utils/gridUtils'
import { NODE_TYPES } from '../../data/nodes'

export default function ResourceNode({ node }) {
  const { gridX, gridY, type } = node
  const typeDef = NODE_TYPES[type]
  
  // Position based on grid
  const x = (gridX - 3.5) * CELL_SIZE
  const z = (gridY - 3.5) * CELL_SIZE

  return (
    <group position={[x, 0, z]}>
      {/* Node Placeholder */}
      <mesh position={[0, 0.4, 0]}>
        {type === 'WOOD' && <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />}
        {type === 'STONE' && <dodecahedronGeometry args={[0.4]} />}
        {type === 'METAL' && <boxGeometry args={[0.5, 0.5, 0.5]} />}
        {type === 'WATER' && <torusGeometry args={[0.3, 0.1, 8, 16]} rotation={[Math.PI/2, 0, 0]} />}
        <meshStandardMaterial 
          color={typeDef.color} 
          metalness={type === 'METAL' ? 0.8 : 0.2} 
          roughness={type === 'WOOD' ? 0.8 : 0.4} 
          emissive={type === 'WATER' ? typeDef.color : 'black'}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Ground indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial color={typeDef.color} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}
