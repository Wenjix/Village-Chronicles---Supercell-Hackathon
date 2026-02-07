import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BUILDINGS, BUILDING_TYPES } from '../../data/buildings'
import { gridToWorld } from '../../utils/gridUtils'
import useStore from '../../store/useStore'

function RotatingGear({ position, size = 0.3 }) {
  const ref = useRef()
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 2
  })
  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[size, size, 0.08, 8]} />
      <meshStandardMaterial color="#b5891c" metalness={0.8} roughness={0.3} />
    </mesh>
  )
}

function SteamPuff({ position }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.3
      ref.current.scale.setScalar(0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.2)
      ref.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial color="#d4d4d8" transparent opacity={0.4} />
    </mesh>
  )
}

function FloatingAirship({ position }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.15
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.3, 0.15, 0.15]} />
      <meshStandardMaterial color="#a16207" metalness={0.6} roughness={0.4} />
    </mesh>
  )
}

function ClockworkForge({ active }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.7, 0.6, 0.7]} />
        <meshStandardMaterial color="#b87333" metalness={0.7} roughness={0.3} />
      </mesh>
      {active && <RotatingGear position={[0, 0.7, 0]} />}
      <mesh position={[0.25, 0.5, 0.25]}>
        <cylinderGeometry args={[0.06, 0.08, 0.3, 6]} />
        <meshStandardMaterial color="#57534e" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

function SteamMill({ active }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.7, 8]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 6]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
      </mesh>
      {active && (
        <>
          <SteamPuff position={[0, 0.9, 0]} />
          <SteamPuff position={[0.1, 0.95, 0.1]} />
        </>
      )}
    </group>
  )
}

function CrystalRefinery({ active }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current && active) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#581c87" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh ref={ref} position={[0, 0.7, 0]}>
        <octahedronGeometry args={[0.25]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive={active ? '#7c3aed' : '#000'}
          emissiveIntensity={active ? 0.8 : 0}
          transparent
          opacity={0.85}
        />
      </mesh>
      {active && (
        <pointLight position={[0, 0.7, 0]} color="#a855f7" intensity={1.5} distance={3} />
      )}
    </group>
  )
}

function AirshipDock({ active }) {
  return (
    <group>
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.9, 0.15, 0.9]} />
        <meshStandardMaterial color="#78716c" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[-0.3, 0.5, -0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 4]} />
        <meshStandardMaterial color="#a8a29e" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.3, 0.5, 0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.8, 4]} />
        <meshStandardMaterial color="#a8a29e" metalness={0.7} roughness={0.3} />
      </mesh>
      {active && <FloatingAirship position={[0, 1.1, 0]} />}
    </group>
  )
}

function InventorsWorkshop({ active }) {
  const antennaRef = useRef()
  useFrame((state) => {
    if (antennaRef.current && active) {
      antennaRef.current.material.emissiveIntensity =
        0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5
    }
  })
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color="#2563eb" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.55, 0.1, 0.55]} />
        <meshStandardMaterial color="#1e40af" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={antennaRef} position={[0.15, 1.15, 0.15]}>
        <cylinderGeometry args={[0.02, 0.02, 0.5, 4]} />
        <meshStandardMaterial
          color="#facc15"
          emissive="#facc15"
          emissiveIntensity={active ? 0.5 : 0}
        />
      </mesh>
      {active && (
        <pointLight position={[0.15, 1.4, 0.15]} color="#facc15" intensity={0.5} distance={2} />
      )}
    </group>
  )
}

const BUILDING_COMPONENTS = {
  [BUILDING_TYPES.CLOCKWORK_FORGE]: ClockworkForge,
  [BUILDING_TYPES.STEAM_MILL]: SteamMill,
  [BUILDING_TYPES.CRYSTAL_REFINERY]: CrystalRefinery,
  [BUILDING_TYPES.AIRSHIP_DOCK]: AirshipDock,
  [BUILDING_TYPES.INVENTORS_WORKSHOP]: InventorsWorkshop,
}

export default function Building({ building }) {
  const groupRef = useRef()
  const selectBuilding = useStore((s) => s.selectBuilding)
  const [wx, , wz] = gridToWorld(building.gridX, building.gridY)
  const Component = BUILDING_COMPONENTS[building.type]
  const isBuilding = building.status === 'building'
  const active = building.status === 'active'

  // Construction animation: pulse scale
  useFrame((state) => {
    if (!groupRef.current) return
    if (isBuilding) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      groupRef.current.scale.setScalar(pulse)
    } else {
      // Smooth scale to 1
      const s = groupRef.current.scale.x
      if (s < 0.99) {
        groupRef.current.scale.setScalar(s + (1 - s) * 0.08)
      } else {
        groupRef.current.scale.setScalar(1)
      }
    }
  })

  if (!Component) return null

  return (
    <group
      ref={groupRef}
      position={[wx, 0, wz]}
      onClick={(e) => {
        e.stopPropagation()
        selectBuilding(building.id)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      <Component active={active} />
      {isBuilding && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  )
}
