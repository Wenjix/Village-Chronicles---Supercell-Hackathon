import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import VillageGrid from './VillageGrid'
import Building from './Building'
import NPC from './NPC'
import Enemy from './Enemy'
import useStore from '../../store/useStore'

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

  return (
    <>
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
        <NPC key={v.id} villager={v} />
      ))}

      <Suspense fallback={null}>
        {enemies.map((e) => (
          <Enemy key={e.id} enemy={e} />
        ))}
      </Suspense>

      <CameraController controlsRef={controlsRef} />
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
        far: 200,
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Scene controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 6}
        minDistance={5}
        maxDistance={50}
        enablePan={true}
      />
      <fog attach="fog" args={['#1a1a2e', 15, 80]} />
    </Canvas>
  )
}
