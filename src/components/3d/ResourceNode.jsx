import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Html, useFBX, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CELL_SIZE } from '../../utils/gridUtils'
import { NODE_TYPES } from '../../data/nodes'
import useStore from '../../store/useStore'

// Tree models
import treeUrl from '../../models/trees/tree.fbx'
import treeHighUrl from '../../models/trees/tree-high.fbx'
import treeCrookedUrl from '../../models/trees/tree-crooked.fbx'
import treeHighCrookedUrl from '../../models/trees/tree-high-crooked.fbx'
import treeHighRoundUrl from '../../models/trees/tree-high-round.fbx'

// Rock models
import rockLargeUrl from '../../models/rocks/rock-large.fbx'
import rockSmallUrl from '../../models/rocks/rock-small.fbx'
import rockWideUrl from '../../models/rocks/rock-wide.fbx'

import colormapUrl from '../../models/colormap.png'

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

// Simple deterministic hash from grid coords to pick a variant
function pickVariant(gridX, gridY, count) {
  const hash = ((gridX * 73856093) ^ (gridY * 19349663)) >>> 0
  return hash % count
}

function applyColormap(object, texture) {
  object.traverse((child) => {
    if (!child.isMesh) return

    if (child.geometry?.attributes?.uv1 && !child.geometry.attributes.uv) {
      child.geometry.setAttribute('uv', child.geometry.attributes.uv1)
    }

    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material]
    const patchedMaterials = sourceMaterials.map((sourceMat) => {
      const material = sourceMat instanceof THREE.Material
        ? sourceMat.clone()
        : new THREE.MeshStandardMaterial()
      material.map = texture
      material.color = new THREE.Color('#ffffff')
      if ('alphaTest' in material) material.alphaTest = 0
      if ('transparent' in material) material.transparent = false
      if ('side' in material) material.side = THREE.DoubleSide
      if ('metalness' in material) material.metalness = 0
      if ('roughness' in material) material.roughness = 1
      material.needsUpdate = true
      return material
    })

    child.material = Array.isArray(child.material) ? patchedMaterials : patchedMaterials[0]
    child.castShadow = true
    child.receiveShadow = true
  })
}

function applyMetallic(object) {
  object.traverse((child) => {
    if (!child.isMesh) return
    child.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#7a8a9e'),
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
    })
    child.castShadow = true
    child.receiveShadow = true
  })
}

function scaleToFit(object, targetSize) {
  const bounds = new THREE.Box3().setFromObject(object)
  const size = new THREE.Vector3()
  bounds.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = targetSize / maxDim
  const yOffset = -bounds.min.y * scale
  return { scale, yOffset }
}

function createWaterTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  // Base water tone
  ctx.fillStyle = '#0ea5e9'
  ctx.fillRect(0, 0, size, size)

  // Subtle wave bands
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#7dd3fc'
  for (let y = -size; y < size * 2; y += 16) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.quadraticCurveTo(size * 0.5, y + 6, size, y)
    ctx.lineTo(size, y + 8)
    ctx.quadraticCurveTo(size * 0.5, y + 14, 0, y + 8)
    ctx.closePath()
    ctx.fill()
  }

  // Sparkle noise
  ctx.globalAlpha = 0.12
  ctx.fillStyle = '#e0f2fe'
  for (let i = 0; i < 120; i += 1) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = Math.random() * 1.8 + 0.3
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)
  texture.needsUpdate = true
  return texture
}

export default function ResourceNode({ node }) {
  const { gridX, gridY, type, remainingAmount, respawnTimer } = node
  const typeDef = NODE_TYPES[type]
  const isDepleted = remainingAmount <= 0 && respawnTimer > 0
  const resourcePopups = useStore((s) => s.resourcePopups)
  const [popups, setPopups] = useState([])
  const popupKey = useRef(0)

  const x = (gridX - 3.5) * CELL_SIZE
  const z = (gridY - 3.5) * CELL_SIZE

  const isWood = type === 'WOOD'
  const isStone = type === 'STONE'
  const isMetal = type === 'METAL'
  const isOutpost = type === 'OUTPOST'
  const maxHealth = typeDef.maxAmount

  // Load all models (hooks must be unconditional)
  const treeSources = [
    useFBX(treeUrl),
    useFBX(treeHighUrl),
    useFBX(treeCrookedUrl),
    useFBX(treeHighCrookedUrl),
    useFBX(treeHighRoundUrl),
  ]

  const rockSources = [
    useFBX(rockLargeUrl),
    useFBX(rockSmallUrl),
    useFBX(rockWideUrl),
  ]

  const colormap = useTexture(colormapUrl)

  const model = useMemo(() => {
    if (!isWood && !isStone && !isMetal) return null

    let source, targetSize
    if (isWood) {
      const idx = pickVariant(gridX, gridY, treeSources.length)
      source = treeSources[idx]
      targetSize = 1.2
    } else {
      const idx = pickVariant(gridX, gridY, rockSources.length)
      source = rockSources[idx]
      targetSize = isMetal ? 0.7 : 0.8
    }

    const cloned = source.clone(true)

    if (isMetal) {
      applyMetallic(cloned)
    } else {
      const mappedTexture = colormap.clone()
      mappedTexture.colorSpace = THREE.SRGBColorSpace
      mappedTexture.flipY = true
      mappedTexture.wrapS = THREE.RepeatWrapping
      mappedTexture.wrapT = THREE.RepeatWrapping
      mappedTexture.needsUpdate = true
      applyColormap(cloned, mappedTexture)
    }

    const { scale, yOffset } = scaleToFit(cloned, targetSize)

    return { object: cloned, scale, yOffset }
  }, [isWood, isStone, isMetal, gridX, gridY, colormap, ...treeSources, ...rockSources])

  const pondTexture = useMemo(() => (type === 'WATER' ? createWaterTexture() : null), [type])

  useEffect(() => () => pondTexture?.dispose(), [pondTexture])

  useFrame((_, delta) => {
    if (!pondTexture) return
    pondTexture.offset.x = (pondTexture.offset.x + delta * 0.06) % 1
    pondTexture.offset.y = (pondTexture.offset.y + delta * 0.03) % 1
  })

  useEffect(() => {
    const mine = resourcePopups.filter((p) => p.nodeId === node.id)
    if (mine.length > 0) {
      mine.forEach((p) => {
        setPopups((prev) => [
          ...prev.slice(-4),
          { key: popupKey.current++, resource: p.resource, amount: p.amount },
        ])
      })
    }
  }, [resourcePopups, node.id])

  return (
    <group position={[x, 0, z]}>
      <group scale={isDepleted ? 0.5 : 1}>
      {(isWood || isStone || isMetal) && model && (
        <primitive object={model.object} scale={model.scale} position={[0, model.yOffset, 0]} />
      )}

      {!isWood && !isStone && !isMetal && !isOutpost && type !== 'WATER' && (
        <mesh position={[0, 0.4, 0]}>
          <meshStandardMaterial
            color={typeDef.color}
            metalness={0.2}
            roughness={0.4}
          />
        </mesh>
      )}
      </group>

      {isDepleted && (
        <Html position={[0, 0.8, 0]} center style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
              Respawning {respawnTimer}s
            </span>
          </div>
        </Html>
      )}

      {isOutpost && (
        <group>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#450a0a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.05, 0.4, 0.4, 4]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>
        </group>
      )}

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
      {type === 'WATER' ? (
        <>
          {/* Grass-colored square so pond blends with terrain */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
            <planeGeometry args={[1.05, 1.05]} />
            <meshStandardMaterial color="#4d7f3b" roughness={1} metalness={0} />
          </mesh>
          {/* Opaque blue pond surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
            <circleGeometry args={[0.42, 28]} />
            <meshStandardMaterial
              color="#0ea5e9"
              map={pondTexture}
              roughness={0.3}
              metalness={0.05}
              emissive="#0369a1"
              emissiveIntensity={0.15}
            />
          </mesh>
        </>
      ) : (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.6, 16]} />
          <meshStandardMaterial color={typeDef.color} transparent opacity={0.2} />
        </mesh>
      )}

      {popups.map((p) => (
        <ResourcePopup key={p.key} resource={p.resource} amount={p.amount} />
      ))}
    </group>
  )
}
