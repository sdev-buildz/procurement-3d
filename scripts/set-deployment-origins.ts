import { appendFileSync, readFileSync } from 'node:fs'

const requiredEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} must be set.`)
  }
  return value
}

const getOrigin = (value: string): URL => {
  const url = new URL(value)
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error(`Expected an HTTP(S) origin, received: ${value}`)
  }
  return url
}

const readWorkerName = (path: string): string => {
  const config = readFileSync(path, 'utf8')
  const workerName = config.match(/^\s*"name"\s*:\s*"([^"]+)"/m)?.[1]
  if (!workerName) {
    throw new Error(`Could not find a Worker name in ${path}.`)
  }
  return workerName
}

const hostOrigin = getOrigin(requiredEnv('ORIGIN'))
const webClientOrigin = getOrigin(requiredEnv('WEB_CLIENT_ORIGIN'))
const embedClientOrigin = getOrigin(requiredEnv('EMBED_CLIENT_ORIGIN'))
const hostWorkerName = readWorkerName('packages/procurement/wrangler.jsonc')
const embedWorkerName = readWorkerName('packages/embed/wrangler.jsonc')

let hostName = hostWorkerName
let embedName = embedWorkerName
if (requiredEnv('EVENT_NAME') === 'pull_request') {
  const pullRequestNumber = requiredEnv('PR_NUMBER')
  if (!/^\d+$/.test(pullRequestNumber)) {
    throw new Error(
      `Expected a numeric PR_NUMBER, received: ${pullRequestNumber}`
    )
  }

  const previewPrefix = `preview-${pullRequestNumber}-`
  const withPreviewName = (url: URL, configuredName: string): void => {
    const [currentName, ...domain] = url.hostname.split('.')
    if (currentName !== configuredName || domain.length === 0) {
      throw new Error(
        `Expected a ${configuredName} Workers URL, received: ${url.origin}`
      )
    }
    url.hostname = `${previewPrefix}${configuredName}.${domain.join('.')}`
  }

  hostName = `${previewPrefix}${hostWorkerName}`
  embedName = `${previewPrefix}${embedWorkerName}`
  withPreviewName(hostOrigin, hostWorkerName)
  withPreviewName(webClientOrigin, hostWorkerName)
  withPreviewName(embedClientOrigin, embedWorkerName)
}

const output = [
  `origin=${hostOrigin.origin}`,
  `web_client_origin=${webClientOrigin.origin}`,
  `embed_client_origin=${embedClientOrigin.origin}`,
  `host_name=${hostName}`,
  `embed_name=${embedName}`,
].join('\n')
appendFileSync(requiredEnv('GITHUB_OUTPUT'), `${output}\n`)
