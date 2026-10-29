/** Fixed dimensions and snapping interval for the electrical room, in meters. */
export const ROOM = {
  /** Total room width along the X axis. */
  width: 20,
  /** Total room depth along the Z axis. */
  depth: 12,
  /** Distance between adjacent floor-grid cells. */
  cellSize: 0.5,
} as const

/** Catalog metadata used by the scene, palette, inspector, and BOM. */
export const EQUIPMENT = {
  drive: {
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
  },
  cabinet: {
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
  },
  panel: {
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
  },
  carConcept: {
    nameKey: 'carConcept',
    sku: 'MDL-CAR',
    width: 2.8,
    depth: 1.4,
    height: 1.4,
    color: '#d98d8d',
    price: 3200,
    model: '../../models/CarConcept.glb',
  },
  commercialRefrigerator: {
    nameKey: 'commercialRefrigerator',
    sku: 'MDL-RFG',
    width: 1.2,
    depth: 0.8,
    height: 2.0,
    color: '#8fc5d8',
    price: 2100,
    model: '../../models/CommercialRefrigerator.glb',
  },
  sheenChair: {
    nameKey: 'sheenChair',
    sku: 'MDL-CHR',
    width: 0.9,
    depth: 0.9,
    height: 1.1,
    color: '#d7a6cf',
    price: 780,
    model: '../../models/SheenChair.glb',
  },
  diffuseTransmissionTeacup: {
    nameKey: 'diffuseTransmissionTeacup',
    sku: 'MDL-TCP',
    width: 0.5,
    depth: 0.5,
    height: 0.5,
    color: '#d9c89a',
    price: 420,
    model: '../../models/DiffuseTransmissionTeacup.glb',
  },
} as const

/** Supported equipment categories in the room. */
export type EquipmentType = keyof typeof EQUIPMENT

/** One placed piece of equipment and its transform and wire connections. */
export type LayoutItem = {
  /** Stable identifier used by selection and connections. */
  id: string
  /** Catalog key for this equipment. */
  type: EquipmentType
  /** Center position in meters along the room X axis. */
  x: number
  /** Center position in meters along the room Z axis. */
  z: number
  /** Y-axis rotation in quarter turns, represented as degrees. */
  rotation: number
  /** IDs of other equipment connected by visible wires. */
  connections?: string[]
}

/** A pair of equipment whose footprint boundary clearance violates the spacing rule. */
export type RuleViolation = {
  /** First item in the violating pair. */
  first: LayoutItem
  /** Second item in the violating pair. */
  second: LayoutItem
  /** Shortest distance between the item footprint boundaries, in meters. */
  distance: number
}

/** Aggregated quantity and unit price for one BOM row. */
export type BillOfMaterialsRow = {
  /** Catalog key for the row. */
  type: EquipmentType
  /** Number of matching pieces in the current layout. */
  quantity: number
  /** Price for one piece in USD. */
  unitPrice: number
}
