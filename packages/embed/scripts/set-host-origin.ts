import { readFile, writeFile } from 'node:fs/promises'

const hostOrigin = process.env.HOST_ORIGIN?.trim()
if (!hostOrigin) {
  throw new Error('HOST_ORIGIN must be set to deploy the embed app.')
}

const url = new URL(hostOrigin)
if (
  !['http:', 'https:'].includes(url.protocol) ||
  url.pathname !== '/' ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
) {
  throw new Error('HOST_ORIGIN must be an HTTP(S) origin without a path.')
}

const headersPath = new URL('../dist/_headers', import.meta.url)
const headers = await readFile(headersPath, 'utf8')
const directive = /(^\s*Content-Security-Policy:\s*frame-ancestors\s+)'[^']*'/m
if (!directive.test(headers)) {
  throw new Error(`Could not find frame-ancestors in ${headersPath}.`)
}

const updatedHeaders = headers.replace(
  directive,
  (_match, prefix: string) => `${prefix}'${url.origin}'`
)
await writeFile(headersPath, updatedHeaders)
