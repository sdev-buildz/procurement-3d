import { WebIO } from '@gltf-transform/core'
import type { JSONDocument } from '@gltf-transform/core'
import {
  ALL_EXTENSIONS,
  EXTMeshoptCompression,
} from '@gltf-transform/extensions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'

export interface ModelStats {
  fileSizeBytes: number
  triangles: number
  vertices: number
  meshes: number
  primitives: number
  materials: number
  textures: number
}

export interface OptimizationResult {
  before: ModelStats
  after: ModelStats
  savedBytes: number
  reductionPercentage: number
  outputFileName: string
  output: Uint8Array<ArrayBuffer>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeResourcePath = (path: string): string =>
  decodeURIComponent(path)
    .replaceAll('\\', '/')
    .replace(/^\.\/+/, '')

const getTriangleCount = (mode: number, elementCount: number): number => {
  if (mode === 4) return Math.floor(elementCount / 3)
  if (mode === 5 || mode === 6) return Math.max(0, elementCount - 2)
  return 0
}

const getModelStats = (
  document: Awaited<ReturnType<WebIO['readBinary']>>,
  fileSizeBytes: number
): ModelStats => {
  const meshes = document.getRoot().listMeshes()
  const primitives = meshes.flatMap((mesh) => mesh.listPrimitives())

  return {
    fileSizeBytes,
    triangles: primitives.reduce((total, primitive) => {
      const elementCount =
        primitive.getIndices()?.getCount() ??
        primitive.getAttribute('POSITION')?.getCount() ??
        0

      return total + getTriangleCount(primitive.getMode(), elementCount)
    }, 0),
    vertices: primitives.reduce(
      (total, primitive) =>
        total + (primitive.getAttribute('POSITION')?.getCount() ?? 0),
      0
    ),
    meshes: meshes.length,
    primitives: primitives.length,
    materials: document.getRoot().listMaterials().length,
    textures: document.getRoot().listTextures().length,
  }
}

const getExternalResourceFiles = (
  json: JSONDocument['json'],
  modelFile: File,
  companionFiles: readonly File[]
): Map<string, File> => {
  const resourceUris = [
    ...(json.buffers ?? []).flatMap((buffer) =>
      buffer.uri ? [buffer.uri] : []
    ),
    ...(json.images ?? []).flatMap((image) => (image.uri ? [image.uri] : [])),
  ].filter((uri) => !uri.startsWith('data:'))

  const candidates = new Map<string, File[]>()
  for (const file of companionFiles) {
    if (file === modelFile) continue

    const aliases = new Set(
      [file.name, file.webkitRelativePath].filter(Boolean)
    )
    for (const alias of aliases) {
      const normalizedAlias = normalizeResourcePath(alias)
      const matches = candidates.get(normalizedAlias) ?? []
      matches.push(file)
      candidates.set(normalizedAlias, matches)
    }

    const normalizedName = normalizeResourcePath(file.name)
    const nameMatches = candidates.get(normalizedName) ?? []
    if (nameMatches.length === 0) {
      nameMatches.push(file)
      candidates.set(normalizedName, nameMatches)
    }
  }

  const resources = new Map<string, File>()
  for (const uri of resourceUris) {
    const normalizedUri = normalizeResourcePath(uri)
    const basename = normalizedUri.split('/').at(-1)
    const matches =
      candidates.get(normalizedUri) ??
      (basename ? candidates.get(basename) : undefined)

    if (!matches?.length) {
      throw new Error(
        `Missing glTF resource "${uri}". Select the .gltf file together with its referenced .bin and texture files.`
      )
    }
    if (matches.length > 1) {
      throw new Error(
        `More than one uploaded file matches "${uri}". Upload the model with its resource folder structure intact.`
      )
    }

    resources.set(uri, matches[0]!)
  }

  return resources
}

/**
 * Optimizes a glTF or GLB upload and returns a Meshopt-compressed GLB with model statistics.
 */
export const optimizeModel = async (
  modelFile: File,
  companionFiles: readonly File[] = [modelFile]
): Promise<OptimizationResult> => {
  const extension = modelFile.name.split('.').at(-1)?.toLowerCase()
  if (extension !== 'gltf' && extension !== 'glb') {
    throw new Error('Choose a .gltf or .glb model file.')
  }

  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready])

  const io = new WebIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'meshopt.decoder': MeshoptDecoder,
      'meshopt.encoder': MeshoptEncoder,
    })

  let document: Awaited<ReturnType<WebIO['readBinary']>>
  let inputSizeBytes = modelFile.size

  if (extension === 'glb') {
    document = await io.readBinary(
      new Uint8Array(await modelFile.arrayBuffer())
    )
  } else {
    const parsed: unknown = JSON.parse(await modelFile.text())
    if (
      !isRecord(parsed) ||
      !isRecord(parsed['asset']) ||
      typeof parsed['asset']['version'] !== 'string'
    ) {
      throw new Error(
        'The selected .gltf file does not contain valid glTF JSON.'
      )
    }

    const json = parsed as unknown as JSONDocument['json']
    const externalFiles = getExternalResourceFiles(
      json,
      modelFile,
      companionFiles
    )
    const resources = Object.fromEntries(
      await Promise.all(
        [...externalFiles].map(async ([uri, file]) => [
          uri,
          new Uint8Array(await file.arrayBuffer()),
        ])
      )
    )
    const jsonDocument: JSONDocument = { json, resources }

    for (const file of new Set(externalFiles.values())) {
      inputSizeBytes += file.size
    }
    document = await io.readJSON(jsonDocument)
  }

  const before = getModelStats(document, inputSizeBytes)
  document
    .createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({
      method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
    })

  const output = await io.writeBinary(document)
  const after = getModelStats(document, output.byteLength)
  const savedBytes = before.fileSizeBytes - after.fileSizeBytes

  return {
    before,
    after,
    savedBytes,
    reductionPercentage:
      before.fileSizeBytes === 0
        ? 0
        : (savedBytes / before.fileSizeBytes) * 100,
    outputFileName: `${modelFile.name.replace(/\.(gltf|glb)$/i, '')}.optimized.glb`,
    output,
  }
}
