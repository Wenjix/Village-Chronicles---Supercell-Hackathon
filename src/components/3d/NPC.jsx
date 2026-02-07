import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { gridToWorld } from '../../utils/gridUtils'
import useStore from '../../store/useStore'
import { MOODS } from '../../data/moods'

export default function NPC({ villager }) {
  const ref = useRef()
  const openChat = useStore((s) => s.openChat)
  const villagers = useStore((s) => s.villagers)

  const moodDef = MOODS[villager.mood] || MOODS.happy
  const isFeudingWithSomeone = villager.mood === 'feuding'
  const isLazy = villager.mood === 'lazy'

  // Compute start and target positions for walk interpolation
  const startPos = useMemo(() => gridToWorld(villager.x, villager.y), [villager.x, villager.y])
  const targetPos = useMemo(
    () =>
      villager.targetX !== null && villager.targetY !== null
        ? gridToWorld(villager.targetX, villager.targetY)
        : null,
    [villager.targetX, villager.targetY]
  )

  useFrame((state) => {
    if (!ref.current) return

    // Walk interpolation
    let wx, wz
    if (targetPos && villager.walkProgress < 1) {
      const t = villager.walkProgress
      wx = startPos[0] + (targetPos[0] - startPos[0]) * t
      wz = startPos[2] + (targetPos[2] - startPos[2]) * t
    } else if (targetPos && villager.walkProgress >= 1) {
      wx = targetPos[0]
      wz = targetPos[2]
    } else {
      wx = startPos[0]
      wz = startPos[2]
    }

    ref.current.position.x = wx
    ref.current.position.z = wz

    // Bob animation — slower for lazy NPCs
    const bobSpeed = isLazy ? 0.8 : 1.5
    const bobAmount = isLazy ? 0.03 : 0.05
    ref.current.position.y = 0.35 + Math.sin(state.clock.elapsedTime * bobSpeed + villager.id) * bobAmount
  })

  // Initial position
  const [wx, , wz] = startPos

  // Get feud target name for tooltip
  const feudTargetName = isFeudingWithSomeone && villager.feudTarget
    ? villagers.find((v) => v.id === villager.feudTarget)?.name
    : null

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
      {/* Feud red ring on ground */}
      {isFeudingWithSomeone && (
        <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Body capsule — colored by mood */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
        <meshStandardMaterial color={moodDef.color} metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.2} roughness={0.7} />
      </mesh>

      {/* Mood emoji overlay */}
      <Html position={[0, 0.55, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-lg select-none" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
          {moodDef.emoji}
        </div>
        {feudTargetName && (
          <div className="text-[9px] text-red-400 whitespace-nowrap text-center mt-0.5">
            vs {feudTargetName}
          </div>
        )}
      </Html>
    </group>
  )
}
