import React from 'react'
import { Html } from '@react-three/drei'
import { CELL_SIZE } from '../../utils/gridUtils'
import { NODE_TYPES } from '../../data/nodes'

export default function ResourceNode({ node }) {
  const { gridX, gridY, type, remainingAmount } = node
  const typeDef = NODE_TYPES[type]
  
  // Position based on grid
  const x = (gridX - 3.5) * CELL_SIZE
  const z = (gridY - 3.5) * CELL_SIZE

  const isOutpost = type === 'OUTPOST'
  const maxHealth = typeDef.maxAmount

  return (
    <group position={[x, 0, z]}>
      {/* Node Placeholder */}
      <mesh position={[0, 0.4, 0]}>
        {type === 'WOOD' && <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />}
        {type === 'STONE' && <dodecahedronGeometry args={[0.4]} />}
        {type === 'METAL' && <boxGeometry args={[0.5, 0.5, 0.5]} />}
        {type === 'WATER' && <torusGeometry args={[0.3, 0.1, 8, 16]} rotation={[Math.PI/2, 0, 0]} />}
        {isOutpost && (
          <group>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color="#450a0a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <cylinderGeometry args={[0.05, 0.4, 0.4, 4]} />
              <meshStandardMaterial color="#ef4444" />
            </mesh>
          </group>
        )}
        {!isOutpost && (
          <meshStandardMaterial 
            color={typeDef.color} 
            metalness={type === 'METAL' ? 0.8 : 0.2} 
            roughness={type === 'WOOD' ? 0.8 : 0.4} 
            emissive={type === 'WATER' ? typeDef.color : 'black'}
            emissiveIntensity={0.5}
          />
        )}
      </mesh>
      
      {/* Health Bar for Outposts */}
      {isOutpost && remainingAmount < maxHealth && (
        <Html position={[0, 1.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-1.5 bg-black/70 rounded-full overflow-hidden border border-red-900/50">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${(remainingAmount / maxHealth) * 100}%` }}
              />
            </div>
            <span className="text-[8px] font-black text-red-400 mt-1 uppercase tracking-tighter bg-black/40 px-1">Outpost Health</span>
          </div>
        </Html>
      )}

      {/* Ground indicator */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshStandardMaterial color={typeDef.color} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}
