import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { BUILDINGS, BUILDING_TYPES } from '../../data/buildings'
import { gridToWorld } from '../../utils/gridUtils'
import useStore from '../../store/useStore'

const RESOURCE_ICONS = { wood: '🪵', stone: '🪨', metal: '🔩', water: '💧', gears: '⚙', steam: '☁', crystals: '◆', blueprints: '📜' }
const RESOURCE_COLORS = { wood: '#b45309', stone: '#78716c', metal: '#94a3b8', water: '#22d3ee', gears: '#b5891c', steam: '#d4d4d8', crystals: '#a855f7', blueprints: '#60a5fa' }

function ResourcePopup({ resource, amount }) {
  const ref = useRef()
  const [visible, setVisible] = useState(true)
  const progress = useRef(0)

  useFrame((_, delta) => {
    if (!ref.current || !visible) return
    progress.current += delta
    ref.current.position.y += delta * 1.2
    if (progress.current > 1) setVisible(false)
  })

  if (!visible) return null

  return (
    <group ref={ref} position={[0, 1.3, 0]}>
      <Html center style={{ pointerEvents: 'none' }}>
        <span
          className="animate-float-up font-bold text-sm whitespace-nowrap resource-popup-badge"
          style={{ color: RESOURCE_COLORS[resource] || '#fff' }}
        >
          +{amount} {RESOURCE_ICONS[resource] || resource}
        </span>
      </Html>
    </group>
  )
}

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

function ExplorersGuild({ active }) {
  return (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.6, 6]} />
        <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.45, 0.4, 6]} />
        <meshStandardMaterial color="#065f46" />
      </mesh>
      {active && <RotatingGear position={[0, 0.9, 0]} size={0.15} />}
    </group>
  )
}

function Cottage({ active }) {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.6]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.2} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.64, 0]} rotation={[0, Math.PI/4, 0]}>
        <coneGeometry args={[0.5, 0.4, 4]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
    </group>
  )
}

function TeslaTower({ active }) {
  const ringRef = useRef()
  useFrame((state) => {
    if (ringRef.current && active) {
      ringRef.current.rotation.y = state.clock.elapsedTime * 5
      ringRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 10) * 0.05
    }
  })
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 0.8, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.8, 0]}>
        <torusGeometry args={[0.2, 0.05, 8, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={active ? 1 : 0} />
      </mesh>
      {active && <pointLight position={[0, 0.8, 0]} color="#38bdf8" intensity={2} distance={4} />}
    </group>
  )
}

function Watchtower({ active }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 1.2, 4]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color="#451a03" />
      </mesh>
      {active && <pointLight position={[0, 1.4, 0]} color="#fbbf24" intensity={0.5} distance={5} />}
    </group>
  )
}

function AetherFoundry({ active }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.9, 10]} />
        <meshStandardMaterial color="#6d28d9" metalness={0.55} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <octahedronGeometry args={[0.24]} />
        <meshStandardMaterial color="#c084fc" emissive={active ? '#9333ea' : '#000000'} emissiveIntensity={active ? 0.9 : 0} />
      </mesh>
      {active && <pointLight position={[0, 1.0, 0]} color="#c084fc" intensity={1.6} distance={3.5} />}
    </group>
  )
}

function SkyFortress({ active }) {
  return (
    <group>
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.8, 0.7, 0.8]} />
        <meshStandardMaterial color="#475569" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <torusGeometry args={[0.28, 0.06, 8, 20]} />
        <meshStandardMaterial color="#94a3b8" emissive={active ? '#38bdf8' : '#000000'} emissiveIntensity={active ? 0.8 : 0} />
      </mesh>
      {active && <pointLight position={[0, 0.95, 0]} color="#38bdf8" intensity={1.2} distance={3.5} />}
    </group>
  )
}

function GrandClocktower({ active }) {
  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 1.4, 8]} />
        <meshStandardMaterial color="#b45309" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.18, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.25} />
      </mesh>
      {active && <RotatingGear position={[0, 1.45, 0]} size={0.14} />}
    </group>
  )
}

function Mansion({ active }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.95, 0.7, 0.95]} />
        <meshStandardMaterial color="#9f1239" metalness={0.2} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.7, 0.5, 4]} />
        <meshStandardMaterial color="#be123c" metalness={0.2} roughness={0.7} />
      </mesh>
      {active && (
        <pointLight position={[0, 0.8, 0]} color="#fb7185" intensity={0.4} distance={2.5} />
      )}
    </group>
  )
}

function AetherConduit({ active }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.42, 0.8, 12]} />
        <meshStandardMaterial color="#7dd3fc" metalness={0.65} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.05, 0]}>
        <sphereGeometry args={[0.24, 20, 20]} />
        <meshStandardMaterial
          color="#e0f2fe"
          emissive={active ? '#7dd3fc' : '#000000'}
          emissiveIntensity={active ? 1.2 : 0}
          metalness={0.15}
          roughness={0.15}
        />
      </mesh>
      {active && <pointLight position={[0, 1.05, 0]} color="#7dd3fc" intensity={2.2} distance={4.5} />}
    </group>
  )
}

function UnknownStructure({ active, color = '#64748b' }) {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.55} />
      </mesh>
      {active && <pointLight position={[0, 0.8, 0]} color={color} intensity={0.4} distance={2.5} />}
    </group>
  )
}

const BUILDING_COMPONENTS = {
  [BUILDING_TYPES.CLOCKWORK_FORGE]: ClockworkForge,
  [BUILDING_TYPES.STEAM_MILL]: SteamMill,
  [BUILDING_TYPES.CRYSTAL_REFINERY]: CrystalRefinery,
  [BUILDING_TYPES.AIRSHIP_DOCK]: AirshipDock,
  [BUILDING_TYPES.INVENTORS_WORKSHOP]: InventorsWorkshop,
  [BUILDING_TYPES.EXPLORERS_GUILD]: ExplorersGuild,
  [BUILDING_TYPES.COTTAGE]: Cottage,
  [BUILDING_TYPES.TESLA_TOWER]: TeslaTower,
  [BUILDING_TYPES.WATCHTOWER]: Watchtower,
  [BUILDING_TYPES.AETHER_FOUNDRY]: AetherFoundry,
  [BUILDING_TYPES.SKY_FORTRESS]: SkyFortress,
  [BUILDING_TYPES.GRAND_CLOCKTOWER]: GrandClocktower,
  [BUILDING_TYPES.MANSION]: Mansion,
  [BUILDING_TYPES.AETHER_CONDUIT]: AetherConduit,
}

export default function Building({ building }) {
  const groupRef = useRef()
  const prevStatus = useRef(building.status)
  const animPhase = useRef('idle')
  const animScale = useRef(
    building.status === 'building' ? 0.5
    : building.status === 'proposed' || building.status === 'assigned' ? 1
    : 1
  )
  const selectBuilding = useStore((s) => s.selectBuilding)
  const resourcePopups = useStore((s) => s.resourcePopups)
  const [popups, setPopups] = useState([])
  const popupKey = useRef(0)
  const [wx, , wz] = gridToWorld(building.gridX, building.gridY)

  // Show resource popup when this building produces
  useEffect(() => {
    const mine = resourcePopups.filter((p) => p.buildingId === building.id)
    if (mine.length > 0) {
      mine.forEach((p) => {
        setPopups((prev) => [
          ...prev.slice(-3),
          { key: popupKey.current++, resource: p.resource, amount: p.amount },
        ])
      })
    }
  }, [resourcePopups])

  const buildingDef = BUILDINGS[building.type]
  const Component = BUILDING_COMPONENTS[building.type]
  const isProposed = building.status === 'proposed'
  const isAssigned = building.status === 'assigned'
  const isBuilding = building.status === 'building'
  const active = building.status === 'active'
  const isGhost = isProposed || isAssigned

  // Detect transitions for pop animation
  if (prevStatus.current === 'building' && building.status === 'active') {
    animPhase.current = 'pop_up'
    animScale.current = 0.5
  }
  if (prevStatus.current === 'assigned' && building.status === 'building') {
    animPhase.current = 'pop_up'
    animScale.current = 0.5
  }
  prevStatus.current = building.status

  // Squash & stretch + ghost pulse animation
  useFrame((state, delta) => {
    if (!groupRef.current) return
    const phase = animPhase.current

    if (isGhost) {
      // Ghost pulsing opacity
      const pulse = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      const targetOpacity = isAssigned ? pulse + 0.15 : pulse
      groupRef.current.traverse((child) => {
        if (child.material) {
          child.material.transparent = true
          child.material.opacity = targetOpacity
        }
      })
      animScale.current = 1
    } else if (isBuilding) {
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      animScale.current = pulse
      // Restore full opacity
      groupRef.current.traverse((child) => {
        if (child.material && child.material.transparent) {
          child.material.opacity = 1
          child.material.transparent = false
        }
      })
    } else if (phase === 'pop_up') {
      animScale.current += delta * 4
      if (animScale.current >= 1.25) {
        animScale.current = 1.25
        animPhase.current = 'pop_down'
      }
      // Restore opacity on transition
      groupRef.current.traverse((child) => {
        if (child.material && child.material.transparent) {
          child.material.opacity = 1
          child.material.transparent = false
        }
      })
    } else if (phase === 'pop_down') {
      animScale.current += (1.0 - animScale.current) * 0.12
      if (Math.abs(animScale.current - 1.0) < 0.005) {
        animScale.current = 1.0
        animPhase.current = 'done'
      }
    } else {
      animScale.current = 1.0
    }

    const s = animScale.current
    if (phase === 'pop_up' || phase === 'pop_down') {
      const yStretch = s * 1.1
      const xzSquash = s * 0.95
      groupRef.current.scale.set(xzSquash, yStretch, xzSquash)
    } else {
      groupRef.current.scale.setScalar(s)
    }
  })

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
      {Component ? (
        <Component active={active} />
      ) : (
        <UnknownStructure active={active} color={buildingDef?.color} />
      )}
      {/* Construction indicator */}
      {isBuilding && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1} />
        </mesh>
      )}
      {/* Proposed indicator */}
      {isProposed && (
        <Html position={[0, 1.2, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="world-badge world-badge-amber">NEEDS WORKER</span>
        </Html>
      )}
      {/* Assigned indicator */}
      {isAssigned && (
        <Html position={[0, 1.2, 0]} center style={{ pointerEvents: 'none' }}>
          <span className="world-badge world-badge-blue">WORKER EN ROUTE</span>
        </Html>
      )}
      {/* Health bar for damaged buildings */}
      {building.health < building.maxHealth && building.status !== 'proposed' && building.status !== 'assigned' && (
        <Html position={[0, 1.5, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-1.5 bg-black/70 rounded-full overflow-hidden border border-red-900/50">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(building.health / building.maxHealth) * 100}%`,
                  backgroundColor: building.health / building.maxHealth > 0.5 ? '#22c55e' : building.health / building.maxHealth > 0.25 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          </div>
        </Html>
      )}
      {popups.map((p) => (
        <ResourcePopup key={p.key} resource={p.resource} amount={p.amount} />
      ))}
    </group>
  )
}
