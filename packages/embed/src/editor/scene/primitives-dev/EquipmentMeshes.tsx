import type { MeshLambertMaterialParameters } from 'three'
import type { LayoutItem } from '../../items'
import { GlbModel } from './GlbModel'
import { PrimitiveModel } from './PrimitiveModel'

/** Renders the equipment item */
export function EquipmentMeshes({
  item,
  ghost,
  materialProps,
}: {
  item: LayoutItem
  ghost: boolean
  materialProps: MeshLambertMaterialParameters
}) {
  const equipment = item.item
  const modelUrl = equipment.models[0]?.url ?? ''

  if (modelUrl === '') {
    return <PrimitiveModel ghost item={item} materialProps={materialProps} />
  }

  return (
    <GlbModel
      models={equipment.models}
      equipment={equipment}
      isRoot={true}
      ghost={ghost}
    />
  )
}
