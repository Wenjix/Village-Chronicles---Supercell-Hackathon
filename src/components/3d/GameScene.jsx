import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import VillageGrid from './VillageGrid'
import Building from './Building'
import NPC from './NPC'
import Enemy from './Enemy'
import useStore from '../../store/useStore'
import { CELL_SIZE, PLOT_SIZE, getUnlockedPlotWorldBounds } from '../../utils/gridUtils'
import skyboxPanoramaUrl from '../../assets/HDRI/hdr_high.png'

function SkyDome({ unlockedPlots }) {
  const bounds = getUnlockedPlotWorldBounds(unlockedPlots)
  const halfDiagonal = Math.hypot(bounds.width / 2, bounds.depth / 2)
  const extraClearance = PLOT_SIZE * CELL_SIZE * 1.25
  const radius = Math.max(halfDiagonal + extraClearance, 45)
  const texture = useTexture(skyboxPanoramaUrl)

  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.repeat.x = -1

  return (
    <mesh position={[bounds.centerX, 2, bounds.centerZ]}>
      <sphereGeometry args={[radius, 64, 48]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function CameraController({ controlsRef }) {
  const cameraTarget = useStore((s) => s.cameraTarget)
  const targetVec = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    if (!controlsRef.current) return
    targetVec.current.set(cameraTarget.x, cameraTarget.y, cameraTarget.z)
    controlsRef.current.target.lerp(targetVec.current, 0.08)
    controlsRef.current.update()
  })

  return null
}

function Scene({ controlsRef }) {
  const buildings = useStore((s) => s.buildings)
  const villagers = useStore((s) => s.villagers)
  const enemies = useStore((s) => s.enemies)
  const sessionId = useStore((s) => s._sessionId)
  const unlockedPlots = useStore((s) => s.unlockedPlots)
  const bounds = getUnlockedPlotWorldBounds(unlockedPlots)
  const fogNear = 20
  const fogFar = Math.max(Math.hypot(bounds.width / 2, bounds.depth / 2) + PLOT_SIZE * CELL_SIZE * 2.5, 120)

  return (
    <>
      <SkyDome unlockedPlots={unlockedPlots} />
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[8, 12, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize={1024}
      />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#6366f1" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#f59e0b" />

      <VillageGrid />

      {buildings.map((b) => (
        <Building key={b.id} building={b} />
      ))}

      {villagers.map((v) => (
        <NPC key={`${v.id}-${sessionId}`} villager={v} />
      ))}

      <Suspense fallback={null}>
        {enemies.map((e) => (
          <Enemy key={`${e.id}-${sessionId}`} enemy={e} />
        ))}
      </Suspense>

      <CameraController controlsRef={controlsRef} />
      <fog attach="fog" args={['#1a1a2e', fogNear, fogFar]} />
    </>
  )
}

export default function GameScene() {
  const controlsRef = useRef()

  return (
    <Canvas
      camera={{
        position: [8, 10, 8],
        fov: 40,
        near: 0.1,
        far: 500,
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Scene controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={Math.PI / 6}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
      />
    </Canvas>
  )
}
