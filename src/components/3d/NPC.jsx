import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { gridToWorld } from '../../utils/gridUtils'
import useStore from '../../store/useStore'

export default function NPC({ villager }) {
  const ref = useRef()
  const openChat = useStore((s) => s.openChat)
  const [wx, , wz] = gridToWorld(villager.x, villager.y)

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * 1.5 + villager.id) * 0.05
    }
  })

  return (
    <group
      ref={ref}
      position={[wx, 0.35, wz]}
      onClick={(e) => {
        e.stopPropagation()
        openChat(villager.id)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      {/* Body capsule */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
        <meshStandardMaterial color="#d97706" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.2} roughness={0.7} />
      </mesh>
    </group>
  )
}
