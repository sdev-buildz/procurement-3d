import { connect, type MqttClient } from 'mqtt'
import { mockCuringMachine } from './curing-machine'

const topic = 'machines/curing/telemetry'

const waitForConnection = (client: MqttClient) =>
  new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      client.off('error', onError)
      resolve()
    }
    const onError = (error: Error) => {
      client.off('connect', onConnect)
      reject(error)
    }

    client.once('connect', onConnect)
    client.once('error', onError)
  })

/**
 * Starts the mock curing machine and publishes PLC tags over MQTT.
 */
export async function startMachines(signal?: AbortSignal): Promise<void> {
  const client = connect(process.env.MQTT_URL ?? 'mqtt://localhost:1883')
  client.on('error', (error) => console.error('MQTT client error:', error))

  try {
    await waitForConnection(client)

    for await (const telemetry of mockCuringMachine(signal ? { signal } : {})) {
      await new Promise<void>((resolve, reject) => {
        client.publish(topic, JSON.stringify(telemetry), { qos: 1 }, (error) =>
          error ? reject(error) : resolve()
        )
      })
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      client.end(false, {}, (error) => (error ? reject(error) : resolve()))
    })
  }
}

const shutdown = new AbortController()
process.once('SIGINT', () => shutdown.abort())
process.once('SIGTERM', () => shutdown.abort())

startMachines(shutdown.signal).catch((error: unknown) => {
  console.error('Failed to publish curing telemetry:', error)
  process.exitCode = 1
})
