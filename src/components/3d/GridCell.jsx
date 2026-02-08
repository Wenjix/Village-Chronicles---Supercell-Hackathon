import { useState, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { gridToWorld, CELL_SIZE } from '../../utils/gridUtils'
import useStore from '../../store/useStore'
import grassUrl from '../../models/grass/ground_grass.glb'
import cliffBlockUrl from '../../models/grass/cliff_block_rock.glb'
import riverOpenUrl from '../../models/ground/ground_riverOpen.glb'

export default function GridCell({ x, y, occupied }) {
  const [hovered, setHovered] = useState(false)
  const selectCell = useStore((s) => s.selectCell)
  const grid = useStore((s) => s.grid)
  const hasWaterNode = useStore((s) => {
    const key = `${x},${y}`
    const cell = s.grid[key]
    if (typeof cell !== 'string' || !cell.startsWith('node-')) return false
    const nodeId = parseInt(cell.split('-')[1], 10)
    const node = s.nodes.find((n) => n.id === nodeId)
    return node?.type === 'WATER'
  })
  const [wx, , wz] = gridToWorld(x, y)

  const key = `${x},${y}`
  const isNode = typeof grid[key] === 'string' && grid[key].startsWith('node-')
  const clickable = !occupied || isNode

  const grassSource = useGLTF(grassUrl)
  const cliffSource = useGLTF(cliffBlockUrl)
  const riverOpenSource = useGLTF(riverOpenUrl)
  const groundSource = hasWaterNode ? riverOpenSource : grassSource

  const grass = useMemo(() => {
    const cloned = groundSource.scene.clone(true)
    cloned.traverse((child) => {
      if (!child.isMesh) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((mat) => {
        if (!mat) return
        // Ensure embedded textures use correct color space
        if (mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace
        }
      })
      child.receiveShadow = true
    })

    // Scale to fit one cell
    const bounds = new THREE.Box3().setFromObject(cloned)
    const size = new THREE.Vector3()
    bounds.getSize(size)
    const maxHorizontal = Math.max(size.x, size.z) || 1
    const scale = (CELL_SIZE) / maxHorizontal
    const yOffset = -bounds.min.y * scale

    return { object: cloned, scale, yOffset }
  }, [groundSource, hasWaterNode])

  const foundation = useMemo(() => {
    const cloned = cliffSource.scene.clone(true)
    cloned.traverse((child) => {
      if (!child.isMesh) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((mat) => {
        if (!mat) return
        if (mat.map) {
          mat.map.colorSpace = THREE.SRGBColorSpace
        }
      })
      child.castShadow = true
      child.receiveShadow = true
    })

    const bounds = new THREE.Box3().setFromObject(cloned)
    const size = new THREE.Vector3()
    bounds.getSize(size)
    const maxHorizontal = Math.max(size.x, size.z) || 1
    const scale = CELL_SIZE / maxHorizontal
    // Keep cliff top just under y=0 so gameplay objects stay above it.
    const yOffset = -bounds.max.y * scale - 0.02

    return { object: cloned, scale, yOffset }
  }, [cliffSource])

  return (
    <group position={[wx, 0, wz]}>
      {/* Cliff foundation for vertical depth under each plot tile */}
      <primitive
        object={foundation.object}
        scale={foundation.scale}
        position={[0, foundation.yOffset, 0]}
      />

      {/* Grass base */}
      <primitive object={grass.object} scale={grass.scale} position={[0, grass.yOffset, 0]} />

      {/* Hover overlay */}
      <mesh
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation()
          if (clickable) selectCell(x, y)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (clickable) {
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <planeGeometry args={[CELL_SIZE, CELL_SIZE]} />
        <meshStandardMaterial
          color={hovered && clickable ? '#2563eb' : '#000000'}
          transparent
          opacity={hovered && clickable ? 0.4 : 0}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
