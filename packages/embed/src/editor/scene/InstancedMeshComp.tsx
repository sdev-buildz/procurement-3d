import { useGLTF } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { KTX2Loader } from 'three-stdlib'
import { typedObjectEntries } from 'ts-strict-utils'
import { type ItemType, type LayoutItem } from '../items'

type ArgsType = { nodeName: string; mesh: THREE.Mesh; material: THREE.Material }

/**
 *  Parses the GLTF/GLB model into its' meshes and render instanced meshes.
 */
export function InstancedMeshGroup({
  itemsToInstance,
  itemType,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  itemsToInstance: LayoutItem[]
  itemType: ItemType
  onPointerDown?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerUp?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerCancel?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
}) {
  const gl = useThree((state) => state.gl)

  // 1. Destructure the exact nodes and materials from your file
  const { scene, nodes, materials } = useGLTF(
    itemType.models[0]!.url,
    true,
    true,
    (loader) => {
      const ktx2Loader = new KTX2Loader()
      ktx2Loader.setTranscoderPath('https://jsdelivr.net')
      ktx2Loader.detectSupport(gl)
      loader.setKTX2Loader(ktx2Loader)
    }
    // getEquipment('potOfCoals').models[0]!.url
  )

  const modelScale = useMemo(() => {
    scene.updateWorldMatrix(true, true)
    const bounds = new THREE.Box3().setFromObject(scene)
    const size = bounds.getSize(new THREE.Vector3())
    const dimensions = [
      itemType.width / Math.max(size.x, 0.001),
      itemType.height / Math.max(size.y, 0.001),
      itemType.depth / Math.max(size.z, 0.001),
    ]

    return dimensions.every((dimension) => Number.isFinite(dimension))
      ? Math.min(...dimensions)
      : 5
  }, [scene, itemType.width, itemType.height, itemType.depth])

  const argsArr = useRef<Array<ArgsType>>([])

  useEffect(() => {
    if (!nodes || !materials) return
    typedObjectEntries(nodes).forEach(([nodeName, node]) => {
      argsArr.current.push({
        nodeName,
        mesh: node as THREE.Mesh,
        material: materials[nodeName] ?? new THREE.MeshBasicMaterial(),
      })
    })
  }, [nodes, materials])

  return (
    <group>
      {(() =>
        argsArr.current.map((args, idx) => {
          return (
            <InstancedMeshComp
              key={`${itemType.id} ${args.nodeName}`}
              args={args}
              items={itemsToInstance}
              modelScale={modelScale}
              modelMatrix={args.mesh.matrixWorld}
              {...(onPointerDown
                ? {
                    onPointerDown: (item, event) => onPointerDown(item, event),
                  }
                : {})}
              {...(onPointerMove
                ? {
                    onPointerMove: (item, event) => onPointerMove(item, event),
                  }
                : {})}
              {...(onPointerUp
                ? {
                    onPointerUp: (item, event) => onPointerUp(item, event),
                  }
                : {})}
              {...(onPointerCancel
                ? {
                    onPointerCancel: (item, event) =>
                      onPointerCancel(item, event),
                  }
                : {})}
            />
          )
        }))()}
    </group>
  )
}

const InstancedMeshComp = ({
  items: itemsToInstance,
  modelScale,
  modelMatrix,
  args,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  items: LayoutItem[]
  modelScale: number
  modelMatrix: THREE.Matrix4
  args: ArgsType
  onPointerDown?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerMove?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerUp?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
  onPointerCancel?: (item: LayoutItem, event: ThreeEvent<PointerEvent>) => void
}) => {
  const count = itemsToInstance.length
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  useEffect(() => {
    const dummy = new THREE.Object3D()

    for (let j = 0; j < count; j += 1) {
      const item = itemsToInstance[j]!
      // Generate identical positions/rotations for both parts so they stay grouped
      // const x = (Math.random() - 0.5) * 15

      dummy.position.set(item.x, 0, item.z)
      dummy.scale.setScalar(modelScale)

      dummy.updateMatrix()

      const instanceMatrix = dummy.matrix.clone().multiply(modelMatrix)
      meshRef.current.setMatrixAt(j, instanceMatrix)
    }

    meshRef.current.computeBoundingBox()
    meshRef.current.computeBoundingSphere()
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [count, itemsToInstance, modelMatrix, modelScale])

  return (
    <instancedMesh
      ref={meshRef}
      args={[args.mesh.geometry, args.material, count]}
      {...(onPointerDown
        ? {
            onPointerDown: (event) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerDown(itemsToInstance[event.instanceId]!, event)
            },
          }
        : {})}
      {...(onPointerMove
        ? {
            onPointerMove: (event) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerMove(itemsToInstance[event.instanceId]!, event)
            },
          }
        : {})}
      {...(onPointerUp
        ? {
            onPointerUp: (event) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerUp(itemsToInstance[event.instanceId]!, event)
            },
          }
        : {})}
      {...(onPointerCancel
        ? {
            onPointerCancel: (event) => {
              event.stopPropagation()
              if (typeof event.instanceId !== 'number') return
              onPointerCancel(itemsToInstance[event.instanceId]!, event)
            },
          }
        : {})}
    />
  )
}
