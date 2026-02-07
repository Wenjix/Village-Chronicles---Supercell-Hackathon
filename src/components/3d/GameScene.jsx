import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import VillageGrid from './VillageGrid'
import Building from './Building'
import NPC from './NPC'
import useStore from '../../store/useStore'

function Scene() {
  const buildings = useStore((s) => s.buildings)
  const villagers = useStore((s) => s.villagers)

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
    </>
  )
}

export default function GameScene() {
  return (
    <Canvas
      camera={{
        position: [8, 10, 8],
        fov: 40,
        near: 0.1,
        far: 100,
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Scene />
      <OrbitControls
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 3}
        minPolarAngle={Math.PI / 6}
        minDistance={5}
        maxDistance={20}
        enablePan={false}
      />
      <fog attach="fog" args={['#1a1a2e', 15, 30]} />
    </Canvas>
  )
}
