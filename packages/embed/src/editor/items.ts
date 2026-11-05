import { z } from 'zod'

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
  /** Content Identifiers used with IPFS cloud object storage. */
  cid?: string
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

const getAssetUrl = (localModelName?: string, cid?: string): string => {
  if (process.env.CI) {
    if (cid) {
      return new URL(`https://clumsy-coral-beaver.myfilebase.com/ipfs/${cid}`)
        .href
    }
  }

  return new URL(
    `./static/assets/${localModelName}.glb`,
    window.location.origin
  ).href
}

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
        id: 13,
        url: getAssetUrl(
          'CarConcept-lossless',
          'QmQFYMrRRrcpePRwp1CdhUb27CEmrm2XHpC2T75JAHGpGb'
        ),
        size: 10000,
      },
      {
        id: 14,
        url: getAssetUrl(
          'CarConcept-medium-lossy',
          'QmPhuJKj43WhJuGW1QhqR6F5ijMy2Tz6AcZos8LqcLEepv'
        ),
        size: 3500,
      },
      {
        id: 15,
        url: getAssetUrl(
          'CarConcept-lowest',
          'Qmcf5BVGwEvx3DTforZSkQDP1btXn8CcUnrM6u9zR9FGya'
        ),
        size: 2300,
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
        url: getAssetUrl(
          'CommercialRefrigerator',
          'QmYNSW7jutWivHmAyiktHfzYL2wgA8YBQGBSHSkvTHKms5'
        ),
        size: 8500,
      },
      {
        id: 12,
        url: getAssetUrl(
          'CommercialRefrigerator-medium',
          'QmWaJTu9yVrU2wbjxWRb3it79PdvoxRpmFP2CX5GVhzDA9'
        ),
        size: 2500,
      },
      {
        id: 11,
        url: getAssetUrl(
          'CommercialRefrigerator-lowest',
          'Qmap12dcSYwoTwoWQaNNSzmhif9FvJTKVSoJK7MvJZtHze'
        ),
        size: 860,
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
  {
    id: 8,
    name: 'potOfCoals',
    nameKey: 'potOfCoals',
    sku: 'MDL-POC',
    width: 0.5,
    depth: 0.5,
    height: 0.5,
    color: '#d9c89a',
    price: 250,
    models: [
      {
        id: 9,
        url: getAssetUrl(
          'PotOfCoals-lossless-instanced',
          'QmQHoHZBBgW7b93Xapc9QWj7nKbUUnyb3oVv7EEJWc8Do2'
        ),
        size: 2487,
      },
      {
        id: 8,
        // url: getAssetUrl('PotOfCoals'),
        url: getAssetUrl(
          'PotOfCoals-instanced',
          'QmUF1wGRwLmjiTcrUkypT2xMQsMav84boHieCH4FZKEWGL'
        ),
        size: 397,
      },
      {
        id: 10,
        url: getAssetUrl(
          'PotOfCoals-placeholder',
          'QmRhum9bbXa4kG5hEVyQBtouAHv8kZRiMntBb71FA2zkKM'
        ),
        size: 71,
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
  | 'potOfCoals'

/** Returns catalog metadata by stable name. */
export function getEquipment(name: EquipmentName): ItemType {
  const equipment = EQUIPMENT.find(
    (item) => item.name === name || item.nameKey === name
  )
  if (!equipment) throw new Error(`Unknown equipment type: ${name}`)
  return equipment
}

/** Layout Items - Zod Schema */
export const LayoutItemScheme = z.object({
  id: z.string(),
  item: z.number(),
  x: z.number(),
  z: z.number(),
  rotation: z.number(),
})

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
