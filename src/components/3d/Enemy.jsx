import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF, useTexture, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { CELL_SIZE } from '../../utils/gridUtils'
import useStore from '../../store/useStore'
import orcModelUrl from '../../models/characters/orc/character-orc.glb'
import orcTextureUrl from '../../models/characters/orc/variation-a.png'

export default function Enemy({ enemy }) {
  const ref = useRef()
  const modelRef = useRef()
  const lastServerRef = useRef({
    x: enemy.x,
    y: enemy.y,
    targetX: enemy.targetX,
    targetY: enemy.targetY,
    speed: enemy.speed || 0.05,
    time: performance.now(),
  })
  const selectEnemy = useStore((s) => s.selectEnemy)

  const { scene, animations } = useGLTF(orcModelUrl)
  const orcTexture = useTexture(orcTextureUrl)
  const activeActionRef = useRef(null)

  const { orcModel, clonedAnimations } = useMemo(() => {
    orcTexture.colorSpace = THREE.SRGBColorSpace
    orcTexture.flipY = false
    orcTexture.needsUpdate = true

    const clone = SkeletonUtils.clone(scene)

    clone.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map((mat) => {
            const clonedMat = mat.clone()
            clonedMat.map = orcTexture
            clonedMat.color.set('#ffffff')
            if (clonedMat.emissive) clonedMat.emissive.set('#000000')
            clonedMat.needsUpdate = true
            return clonedMat
          })
        } else if (obj.material) {
          const clonedMat = obj.material.clone()
          clonedMat.map = orcTexture
          clonedMat.color.set('#ffffff')
          if (clonedMat.emissive) clonedMat.emissive.set('#000000')
          clonedMat.needsUpdate = true
          obj.material = clonedMat
        }
      }
    })

    // Normalize height to match villager scale
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const targetHeight = 0.65
    const scale = size.y > 0 ? targetHeight / size.y : 1
    clone.scale.setScalar(scale)

    const scaledBox = new THREE.Box3().setFromObject(clone)
    clone.position.y = -scaledBox.min.y

    // Clone animations so they bind to the cloned skeleton
    const clonedAnims = animations.map((clip) => clip.clone())

    return { orcModel: clone, clonedAnimations: clonedAnims }
  }, [scene, orcTexture, animations])

  const { actions } = useAnimations(clonedAnimations, modelRef)

  // Resolve which animation clip to play
  const resolvedClipName = useMemo(() => {
    if (!actions) return null
    const actionNames = Object.keys(actions)
    if (!actionNames.length) return null
    // Prefer walk/run, fall back to first available
    for (const name of ['walk', 'Walk', 'run', 'Run', 'sprint', 'Sprint']) {
      if (actions[name]) return name
    }
    const walkish = actionNames.find((n) => n.toLowerCase().includes('walk') || n.toLowerCase().includes('run'))
    if (walkish) return walkish
    return actionNames[0]
  }, [actions])

  // Play animation via useEffect (proper side effect)
  useEffect(() => {
    if (!actions || !resolvedClipName) return
    const nextAction = actions[resolvedClipName]
    if (!nextAction) return
    if (activeActionRef.current === nextAction) return

    nextAction.reset().fadeIn(0.2).play()
    if (activeActionRef.current) {
      activeActionRef.current.fadeOut(0.2)
    }
    activeActionRef.current = nextAction
  }, [actions, resolvedClipName])

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (!actions) return
      Object.values(actions).forEach((action) => action?.stop())
      activeActionRef.current = null
    },
    [actions]
  )

  const PLOT_SIZE = 8
  const offset = ((PLOT_SIZE - 1) * CELL_SIZE) / 2

  useFrame(() => {
    if (ref.current) {
      const server = lastServerRef.current
      const serverChanged =
        enemy.x !== server.x ||
        enemy.y !== server.y ||
        enemy.targetX !== server.targetX ||
        enemy.targetY !== server.targetY ||
        enemy.speed !== server.speed

      if (serverChanged) {
        server.x = enemy.x
        server.y = enemy.y
        server.targetX = enemy.targetX
        server.targetY = enemy.targetY
        server.speed = enemy.speed || 0.05
        server.time = performance.now()
      }

      const elapsedSec = (performance.now() - server.time) / 1000
      const dx = server.targetX - server.x
      const dy = server.targetY - server.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const travel = Math.min(dist, elapsedSec * server.speed)

      const predictedX = dist > 0.0001 ? server.x + (dx / dist) * travel : server.x
      const predictedY = dist > 0.0001 ? server.y + (dy / dist) * travel : server.y

      ref.current.position.x = predictedX * CELL_SIZE - offset
      ref.current.position.z = predictedY * CELL_SIZE - offset
      ref.current.position.y = 0

      // Face movement direction
      if (dist > 0.0001 && modelRef.current) {
        const angle = Math.atan2(dx, dy)
        modelRef.current.rotation.y = angle
      }
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
      <group ref={modelRef}>
        <primitive object={orcModel} />
      </group>

      {/* Health Bar */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.4 * (enemy.health / enemy.maxHealth), 0.05, 0.01]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Label */}
      <Html position={[0, 1.0, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-black/60 px-1.5 py-0.5 rounded whitespace-nowrap">
          Raider
        </div>
      </Html>
    </group>
  )
}

useGLTF.preload(orcModelUrl)
useTexture.preload(orcTextureUrl)
