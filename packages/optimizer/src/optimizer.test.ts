import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { optimizeModel } from './optimizer'

const createFixtureFile = async (): Promise<File> => {
  const rootFixturePath = resolve(
    process.cwd(),
    'packages',
    'optimizer',
    'src',
    'models',
    'SheenChair.glb'
  )
  const packageFixturePath = resolve(
    process.cwd(),
    'src',
    'models',
    'SheenChair.glb'
  )
  const fixture = await readFile(
    existsSync(rootFixturePath) ? rootFixturePath : packageFixturePath
  )
  const buffer = new ArrayBuffer(fixture.byteLength)
  new Uint8Array(buffer).set(fixture)
  return new File([buffer], 'SheenChair.glb', { type: 'model/gltf-binary' })
}

describe('optimizeModel', () => {
  it('compresses a GLB and reports model statistics', async () => {
    const file = await createFixtureFile()
    const result = await optimizeModel(file)

    expect(result.before.fileSizeBytes).toBe(file.size)
    expect(result.after.fileSizeBytes).toBe(result.output.byteLength)
    expect(result.after.fileSizeBytes).toBeLessThan(result.before.fileSizeBytes)
    expect(result.before.triangles).toBeGreaterThan(0)
    expect(result.after.triangles).toBe(result.before.triangles)
    expect(result.before.vertices).toBeGreaterThan(0)
    expect(result.outputFileName).toBe('SheenChair.optimized.glb')
    expect(Array.from(result.output.subarray(0, 4))).toEqual([
      0x67, 0x6c, 0x54, 0x46,
    ])
  })

  it('reports a missing external resource for a glTF JSON upload', async () => {
    const file = new File(
      [
        JSON.stringify({
          asset: { version: '2.0' },
          buffers: [{ uri: 'model.bin', byteLength: 0 }],
        }),
      ],
      'model.gltf',
      { type: 'model/gltf+json' }
    )

    await expect(optimizeModel(file)).rejects.toThrow(
      'Missing glTF resource "model.bin"'
    )
  })
})
