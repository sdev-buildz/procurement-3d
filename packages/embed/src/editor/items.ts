/** Fixed dimensions and snapping interval for the electrical room, in meters. */
export const ROOM = {
  /** Total room width along the X axis. */
  width: 20,
  /** Total room depth along the Z axis. */
  depth: 12,
  /** width or height of grid cells (squares). */
  cellSize: 0.5,
} as const

/** 3D Model */
export type ModelType = {
  id: number
  /** link to GLTF/GLB model file in local or S3. */
  url: string
  /** Size in bytes */
  size: number
}

/** The items which can be placed in the 3D scene. */
export type ItemType = {
  id: number
  name: string
  sku: string

  // Bounding box details
  width: number
  depth: number
  height: number

  /** Prize of the item in USD. */
  price: number
  /** Accent color for the model and UI. */
  color: string
  /** Translation key for the equipment label. */
  nameKey: string

  /**
   * The 3D models of this item sorted in descending order of their sizes.
   * Different sizes are to enable Lazy Loading, and LOD (Level Of Detail).
   */
  models: ModelType[]
}

const getAssetUrl = (modelFileName: string): string =>
  new URL(`./static/assets/${modelFileName}.glb`, window.location.origin).href

/** Catalog metadata used by the scene, palette, inspector, and BOM. */
export const EQUIPMENT: ItemType[] = [
  {
    id: 1,
    name: 'drive',
    /** Translation key for this equipment label. */
    nameKey: 'drive',
    /** Procurement identifier. */
    sku: 'DRV-240',
    /** Footprint width in meters. */
    width: 0.8,
    /** Footprint depth in meters. */
    depth: 0.8,
    /** Rendered height in meters. */
    height: 1.7,
    /** Accent color for the model and UI. */
    color: '#41c9a2',
    /** Price per unit in USD. */
    price: 2480,
    models: [{ id: 1, url: '', size: 0 }],
  },
  {
    id: 2,
    name: 'cabinet',
    /** Translation key for this equipment label. */
    nameKey: 'cabinet',
    /** Procurement identifier. */
    sku: 'CAB-600',
    /** Footprint width in meters. */
    width: 1.2,
    /** Footprint depth in meters. */
    depth: 0.8,
    /** Rendered height in meters. */
    height: 2.2,
    /** Accent color for the model and UI. */
    color: '#7199f8',
    /** Price per unit in USD. */
    price: 1890,
    models: [{ id: 2, url: '', size: 0 }],
  },
  {
    id: 3,
    name: 'panel',
    /** Translation key for this equipment label. */
    nameKey: 'panel',
    /** Procurement identifier. */
    sku: 'PNL-120',
    /** Footprint width in meters. */
    width: 0.8,
    /** Footprint depth in meters. */
    depth: 0.5,
    /** Rendered height in meters. */
    height: 1.2,
    /** Accent color for the model and UI. */
    color: '#f0b65a',
    /** Price per unit in USD. */
    price: 960,
    models: [{ id: 3, url: '', size: 0 }],
  },
  {
    id: 4,
    name: 'carConcept',
    nameKey: 'carConcept',
    sku: 'MDL-CAR',
    width: 2.8,
    depth: 1.4,
    height: 1.4,
    color: '#d98d8d',
    price: 3200,
    models: [
      {
        id: 4,
        // url: getAssetUrl('CarConcept'),
        url: getAssetUrl('output'),
        size: 0,
      },
    ],
  },
  {
    id: 5,
    name: 'commercialRefrigerator',
    nameKey: 'commercialRefrigerator',
    sku: 'MDL-RFG',
    width: 1.2,
    depth: 0.8,
    height: 2.0,
    color: '#8fc5d8',
    price: 2100,
    models: [
      {
        id: 5,
        url: getAssetUrl('CommercialRefrigerator'),
        size: 0,
      },
    ],
  },
  {
    id: 6,
    name: 'sheenChair',
    nameKey: 'sheenChair',
    sku: 'MDL-CHR',
    width: 0.9,
    depth: 0.9,
    height: 1.1,
    color: '#d7a6cf',
    price: 780,
    models: [{ id: 6, url: getAssetUrl('SheenChair'), size: 0 }],
  },
  {
    id: 7,
    name: 'diffuseTransmissionTeacup',
    nameKey: 'diffuseTransmissionTeacup',
    sku: 'MDL-TCP',
    width: 0.5,
    depth: 0.5,
    height: 0.5,
    color: '#d9c89a',
    price: 420,
    models: [
      {
        id: 7,
        url: getAssetUrl('DiffuseTransmissionTeacup'),
        size: 0,
      },
    ],
  },
]

/** Supported equipment categories in the room. */
export type EquipmentName =
  | 'drive'
  | 'cabinet'
  | 'panel'
  | 'carConcept'
  | 'commercialRefrigerator'
  | 'sheenChair'
  | 'diffuseTransmissionTeacup'

/** Returns catalog metadata by stable name. */
export function getEquipment(name: EquipmentName): ItemType {
  const equipment = EQUIPMENT.find(
    (item) => item.name === name || item.nameKey === name
  )
  if (!equipment) throw new Error(`Unknown equipment type: ${name}`)
  return equipment
}

/** One placed piece of equipment and its transform and wire connections. */
export type LayoutItem = {
  /** Stable identifier used by selection and connections. */
  id: string
  item: ItemType
  /** Center position in meters along the room X axis. */
  x: number
  /** Center position in meters along the room Z axis. */
  z: number
  /** Y-axis rotation in quarter turns, represented as degrees. */
  rotation: number
  /** IDs of other equipment connected by visible wires. */
  connections?: string[]
}
