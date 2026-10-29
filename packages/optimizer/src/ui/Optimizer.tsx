import { useId, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { optimizeModel } from '../optimizer'
import type { OptimizationResult } from '../optimizer'

const pageStyle: CSSProperties = {
  maxWidth: 760,
  margin: '40px auto',
  padding: 24,
  fontFamily: 'system-ui, sans-serif',
  color: '#172033',
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(2)} ${units[unitIndex]}`
}

const Optimizer = () => {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<OptimizationResult | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    const modelFiles = files.filter((file) => /\.(gltf|glb)$/i.test(file.name))
    const [modelFile] = modelFiles

    setResult(null)
    setErrorMessage(null)
    if (modelFiles.length !== 1 || !modelFile) {
      setErrorMessage('Select exactly one .gltf or .glb model file.')
      return
    }

    setIsOptimizing(true)
    try {
      setResult(await optimizeModel(modelFile, files))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'The model could not be optimized.',
      )
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const url = URL.createObjectURL(
      new Blob([result.output], { type: 'model/gltf-binary' }),
    )
    const link = window.document.createElement('a')
    link.href = url
    link.download = result.outputFileName
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <main style={pageStyle}>
      <h1>3D Model Optimizer</h1>
      <p>
        Compress a glTF or GLB model for storage and delivery. For .gltf models,
        select the referenced .bin and texture files at the same time.
      </p>
      <p style={{ color: '#536078', fontSize: 14 }}>
        The optimized GLB uses EXT_meshopt_compression and requires a viewer
        with Meshopt decoder support.
      </p>

      <label htmlFor={inputId} style={{ display: 'block', fontWeight: 600 }}>
        Choose model and resources
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type='file'
        accept='.gltf,.glb,model/gltf+json,model/gltf-binary'
        multiple
        onChange={handleUpload}
        aria-describedby={`${inputId}-help`}
        style={{ display: 'block', margin: '12px 0' }}
      />
      <p id={`${inputId}-help`} style={{ color: '#536078', fontSize: 14 }}>
        Upload one .gltf or .glb file. You can multi-select its external resource
        files when using .gltf.
      </p>

      {isOptimizing ? <p role='status'>Optimizing model…</p> : null}
      {errorMessage ? (
        <p role='alert' style={{ color: '#b42318' }}>
          {errorMessage}
        </p>
      ) : null}

      {result ? (
        <section aria-live='polite'>
          <h2>Optimization results</h2>
          <p>
            {result.savedBytes >= 0 ? 'Reduced' : 'Increased'} by{' '}
            {formatBytes(Math.abs(result.savedBytes))} (
            {Math.abs(result.reductionPercentage).toFixed(1)}%)
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th scope='col' style={{ textAlign: 'left', padding: 8 }}>
                  Metric
                </th>
                <th scope='col' style={{ textAlign: 'right', padding: 8 }}>
                  Before
                </th>
                <th scope='col' style={{ textAlign: 'right', padding: 8 }}>
                  After
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['File size', 'fileSizeBytes', formatBytes],
                  ['Triangles', 'triangles', (value: number) => value.toLocaleString()],
                  ['Vertices', 'vertices', (value: number) => value.toLocaleString()],
                  ['Meshes', 'meshes', (value: number) => value.toLocaleString()],
                  ['Primitives', 'primitives', (value: number) => value.toLocaleString()],
                  ['Materials', 'materials', (value: number) => value.toLocaleString()],
                  ['Textures', 'textures', (value: number) => value.toLocaleString()],
                ] as const
              ).map(([label, key, format]) => (
                <tr key={key}>
                  <th scope='row' style={{ textAlign: 'left', padding: 8 }}>
                    {label}
                  </th>
                  <td style={{ textAlign: 'right', padding: 8 }}>
                    {format(result.before[key])}
                  </td>
                  <td style={{ textAlign: 'right', padding: 8 }}>
                    {format(result.after[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type='button' onClick={handleDownload} style={{ marginTop: 16 }}>
            Download optimized GLB
          </button>
        </section>
      ) : null}
    </main>
  )
}

export { Optimizer }
