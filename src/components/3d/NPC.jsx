import { useEffect, useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF, useTexture, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { gridToWorld } from '../../utils/gridUtils'
import useStore from '../../store/useStore'
import { MOODS } from '../../data/moods'
import { CHARACTER_MODEL_PATHS, DEFAULT_CHARACTER_MODEL, normalizeCharacterModelUrl } from '../../data/characterModels'
import characterColormapUrl from '../../models/characters/colormap.png'

export default function NPC({ villager }) {
  const ref = useRef()
  const modelRef = useRef()
  const activeActionRef = useRef(null)
  const renderPosInitializedRef = useRef(false)
  const renderPosRef = useRef(new THREE.Vector3())
  const desiredPosRef = useRef(new THREE.Vector3())
  const smoothWalkProgressRef = useRef(0)
  const walkSegmentKeyRef = useRef('')
  const pursuitServerRef = useRef({
    prevX: villager.x,
    prevY: villager.y,
    currX: villager.x,
    currY: villager.y,
    prevTime: performance.now(),
    currTime: performance.now(),
  })
  const openChat = useStore((s) => s.openChat)
  const villagers = useStore((s) => s.villagers)
  const enemies = useStore((s) => s.enemies)
  const buildings = useStore((s) => s.buildings)
  const nodes = useStore((s) => s.nodes)
  const modelUrl = normalizeCharacterModelUrl(villager.modelUrl || DEFAULT_CHARACTER_MODEL)
  const { scene, animations } = useGLTF(modelUrl)
  const characterColormap = useTexture(characterColormapUrl)
  const { actions } = useAnimations(animations, modelRef)

  const characterModel = useMemo(() => {
    characterColormap.colorSpace = THREE.SRGBColorSpace
    characterColormap.flipY = false
    characterColormap.needsUpdate = true

    const clone = SkeletonUtils.clone(scene)

    const applyColormap = (material) => {
      if (!material) return
      material.map = characterColormap
      material.color.set('#ffffff')
      if (material.emissive) material.emissive.set('#000000')
      material.needsUpdate = true
    }

    clone.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true
        obj.receiveShadow = true
        if (Array.isArray(obj.material)) {
          obj.material = obj.material.map((mat) => {
            const clonedMat = mat.clone()
            applyColormap(clonedMat)
            return clonedMat
          })
        } else if (obj.material) {
          const clonedMat = obj.material.clone()
          applyColormap(clonedMat)
          obj.material = clonedMat
        }
      }
    })

    // Normalize all character variants to a consistent on-grid height.
    const initialBox = new THREE.Box3().setFromObject(clone)
    const initialSize = new THREE.Vector3()
    initialBox.getSize(initialSize)
    const targetHeight = 0.6
    const scale = initialSize.y > 0 ? targetHeight / initialSize.y : 1
    clone.scale.setScalar(scale)

    const scaledBox = new THREE.Box3().setFromObject(clone)
    clone.position.y = -scaledBox.min.y

    return clone
  }, [scene, characterColormap])

  const moodDef = MOODS[villager.mood] || MOODS.happy
  const isFeudingWithSomeone = villager.mood === 'feuding'

  // Compute start and target positions for walk interpolation
  const startPos = useMemo(() => gridToWorld(villager.x, villager.y), [villager.x, villager.y])
  const targetPos = useMemo(
    () =>
      villager.targetX !== null && villager.targetY !== null
        ? gridToWorld(villager.targetX, villager.targetY)
        : null,
    [villager.targetX, villager.targetY]
  )
  const hasWorkAssignment = !!(villager.assignedBuildingId || villager.assignedNodeId)
  const isMoving = !!(targetPos && villager.walkProgress < 1)
  const isPursuing = !!(villager.isMilitia && !hasWorkAssignment && !targetPos && enemies.length > 0)
  const isWorking = !!(hasWorkAssignment && !isMoving && !isPursuing)
  const isAttacking = useMemo(() => {
    if (!villager.isMilitia || enemies.length === 0) return false
    return enemies.some((e) => {
      const dx = e.x - villager.x
      const dy = e.y - villager.y
      return Math.sqrt(dx * dx + dy * dy) <= 1.6
    })
  }, [villager.isMilitia, villager.x, villager.y, enemies])
  const assignedBuilding = useMemo(
    () => (villager.assignedBuildingId ? buildings.find((b) => b.id === villager.assignedBuildingId) : null),
    [villager.assignedBuildingId, buildings]
  )
  const assignedNode = useMemo(
    () => (villager.assignedNodeId ? nodes.find((n) => n.id === villager.assignedNodeId) : null),
    [villager.assignedNodeId, nodes]
  )
  const nearestEnemy = useMemo(() => {
    if (!enemies.length) return null
    let nearest = null
    let nearestDist = Infinity
    enemies.forEach((e) => {
      const dx = e.x - villager.x
      const dy = e.y - villager.y
      const dist = dx * dx + dy * dy
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = e
      }
    })
    return nearest
  }, [enemies, villager.x, villager.y])

  const resolvedClipName = useMemo(() => {
    if (!actions) return null
    const actionNames = Object.keys(actions)
    if (!actionNames.length) return null

    const findClip = (preferredNames, fallbackContains = []) => {
      for (const name of preferredNames) {
        if (actions[name]) return name
      }
      for (const fragment of fallbackContains) {
        const found = actionNames.find((name) => name.toLowerCase().includes(fragment))
        if (found) return found
      }
      return null
    }

    if (isAttacking) {
      return findClip(['attack-melee-right', 'attack-melee-left', 'attack-kick-right', 'attack-kick-left'], ['attack'])
    }
    if (isWorking) {
      return findClip(['interact-right', 'interact-left', 'pick-up'], ['interact', 'pick'])
    }
    if (isMoving || isPursuing) {
      return findClip(['walk', 'sprint'], ['walk', 'sprint'])
    }
    return findClip(['idle', 'static'], ['idle', 'static'])
  }, [actions, isAttacking, isWorking, isMoving, isPursuing])

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

  useEffect(
    () => () => {
      if (!actions) return
      Object.values(actions).forEach((action) => action?.stop())
      activeActionRef.current = null
    },
    [actions]
  )

  useEffect(() => {
    const segmentKey = `${villager.x},${villager.y}->${villager.targetX},${villager.targetY}`
    const isNewSegment = walkSegmentKeyRef.current !== segmentKey
    if (isNewSegment || villager.walkProgress < smoothWalkProgressRef.current) {
      smoothWalkProgressRef.current = villager.walkProgress
      walkSegmentKeyRef.current = segmentKey
      return
    }
    smoothWalkProgressRef.current = Math.max(smoothWalkProgressRef.current, villager.walkProgress)
    walkSegmentKeyRef.current = segmentKey
  }, [villager.x, villager.y, villager.targetX, villager.targetY, villager.walkProgress])

  useEffect(() => {
    const [ix, , iz] = gridToWorld(villager.x, villager.y)
    renderPosRef.current.set(ix, 0.02, iz)
    renderPosInitializedRef.current = true
    smoothWalkProgressRef.current = villager.walkProgress || 0
    if (ref.current) ref.current.position.copy(renderPosRef.current)
  }, [villager.id])

  useEffect(() => {
    const server = pursuitServerRef.current
    if (server.currX === villager.x && server.currY === villager.y) return
    server.prevX = server.currX
    server.prevY = server.currY
    server.prevTime = server.currTime
    server.currX = villager.x
    server.currY = villager.y
    server.currTime = performance.now()
  }, [villager.x, villager.y])

  useFrame((_, delta) => {
    if (!ref.current) return
    if (!renderPosInitializedRef.current) {
      renderPosRef.current.copy(ref.current.position)
      renderPosInitializedRef.current = true
    }

    // Walk interpolation
    let wx, wz
    if (isPursuing) {
      const server = pursuitServerRef.current
      const dtSec = Math.max(0.001, (server.currTime - server.prevTime) / 1000)
      const vx = (server.currX - server.prevX) / dtSec
      const vy = (server.currY - server.prevY) / dtSec
      const elapsedSec = Math.max(0, (performance.now() - server.currTime) / 1000)
      const predictHorizon = Math.min(1, elapsedSec)
      const predictedX = server.currX + vx * predictHorizon
      const predictedY = server.currY + vy * predictHorizon
      const [px, , pz] = gridToWorld(predictedX, predictedY)
      wx = px
      wz = pz
    } else if (targetPos && villager.walkProgress < 1) {
      const moveSpeed = MOODS[villager.mood]?.buildSpeed || 1
      smoothWalkProgressRef.current = Math.max(smoothWalkProgressRef.current, villager.walkProgress)
      smoothWalkProgressRef.current = Math.min(1, smoothWalkProgressRef.current + delta * 0.1 * moveSpeed)
      const t = smoothWalkProgressRef.current
      wx = startPos[0] + (targetPos[0] - startPos[0]) * t
      wz = startPos[2] + (targetPos[2] - startPos[2]) * t
    } else if (targetPos && villager.walkProgress >= 1) {
      wx = targetPos[0]
      wz = targetPos[2]
    } else {
      wx = startPos[0]
      wz = startPos[2]
    }

    desiredPosRef.current.set(wx, 0.02, wz)

    // Militia pursuit is dead-reckoned client-side, so use faster follow to reduce visible lag
    const lerpSpeed = isPursuing ? 20 : 8
    const moveAlpha = 1 - Math.exp(-delta * lerpSpeed)
    renderPosRef.current.lerp(desiredPosRef.current, moveAlpha)
    ref.current.position.copy(renderPosRef.current)

    if (modelRef.current) {
      let lookX = null
      let lookZ = null

      if (isMoving) {
        lookX = desiredPosRef.current.x
        lookZ = desiredPosRef.current.z
      } else if (isPursuing) {
        if (nearestEnemy) {
          const [ex, , ez] = gridToWorld(nearestEnemy.x, nearestEnemy.y)
          lookX = ex
          lookZ = ez
        } else {
          lookX = desiredPosRef.current.x
          lookZ = desiredPosRef.current.z
        }
      } else if (isAttacking && nearestEnemy) {
        const [ex, , ez] = gridToWorld(nearestEnemy.x, nearestEnemy.y)
        lookX = ex
        lookZ = ez
      } else if (isWorking) {
        if (assignedBuilding) {
          const [bx, , bz] = gridToWorld(assignedBuilding.gridX, assignedBuilding.gridY)
          lookX = bx
          lookZ = bz
        } else if (assignedNode) {
          const [nx, , nz] = gridToWorld(assignedNode.gridX, assignedNode.gridY)
          lookX = nx
          lookZ = nz
        }
      }

      if (lookX !== null && lookZ !== null) {
        const dx = lookX - ref.current.position.x
        const dz = lookZ - ref.current.position.z
        const lenSq = dx * dx + dz * dz
        if (lenSq > 0.0001) {
          const targetYaw = Math.atan2(dx, dz)
          const currentYaw = modelRef.current.rotation.y
          const yawDelta = Math.atan2(Math.sin(targetYaw - currentYaw), Math.cos(targetYaw - currentYaw))
          const rotAlpha = 1 - Math.exp(-delta * 12)
          modelRef.current.rotation.y = currentYaw + yawDelta * rotAlpha
        }
      }
    }
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
      position={[wx, 0.02, wz]}
      onClick={(e) => {
        e.stopPropagation()
        openChat(villager.id)
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
    >
      {/* Feud red ring on ground */}
      {isFeudingWithSomeone && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} transparent opacity={0.7} />
        </mesh>
      )}

      <group ref={modelRef}>
        <primitive object={characterModel} />
      </group>

      {/* Mood emoji overlay */}
      <Html position={[0, 0.78, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="flex flex-col items-center">
          <div className="text-lg select-none" style={{ textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
            {moodDef.emoji}
          </div>
          <div className="npc-label mt-0.5 uppercase tracking-tighter font-bold">
            {villager.name}
          </div>
          {feudTargetName && (
            <div className="text-[9px] text-red-400 whitespace-nowrap text-center mt-0.5 bg-black/60 px-1 rounded">
              vs {feudTargetName}
            </div>
          )}
          {/* Health bar for damaged villagers */}
          {villager.health < villager.maxHealth && (
            <div className="w-12 h-1 bg-black/70 rounded-full overflow-hidden border border-red-900/50 mt-0.5">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(villager.health / villager.maxHealth) * 100}%`,
                  backgroundColor: villager.health / villager.maxHealth > 0.5 ? '#22c55e' : villager.health / villager.maxHealth > 0.25 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

CHARACTER_MODEL_PATHS.forEach((url) => useGLTF.preload(url))
