import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { CELL_SIZE } from '../../utils/gridUtils'
import useStore from '../../store/useStore'

export default function Enemy({ enemy }) {
  const ref = useRef()
  const selectEnemy = useStore((s) => s.selectEnemy)

  // Convert enemy grid-ish coordinates to world
  const PLOT_SIZE = 8
  const offset = ((PLOT_SIZE - 1) * CELL_SIZE) / 2

  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = enemy.x * CELL_SIZE - offset
      ref.current.position.z = enemy.y * CELL_SIZE - offset
      ref.current.position.y = 0.35 + Math.sin(Date.now() * 0.01) * 0.05
    }
  })

  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        selectEnemy(enemy.id)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      {/* Enemy Model (Red Spiky Sphere) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI/4, 0, 0]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI/4]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>

      {/* Health Bar */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4 * (enemy.health / enemy.maxHealth), 0.05, 0.01]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Label */}
      <Html position={[0, 0.7, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
          Raider
        </div>
      </Html>
    </group>
  )
}
