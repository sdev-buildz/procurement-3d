/**
 * @packageDocumentation
 * @module TimeSeries
 * Exposes a graphql subscription to emit time series data from the machines.
 */
import {
  mockCuringMachine,
  type CuringTelemetry,
} from '@packages/mock-machines'
import { Client, type Notification } from 'pg'
import { builder } from '../lib/builder'

async function* subscribeToPostgres(): AsyncGenerator<CuringTelemetry> {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5434/fs-template',
  })
  await client.connect()

  const events: CuringTelemetry[] = []
  let wake: (() => void) | undefined
  let subscriptionError: Error | undefined

  const notify = (notification: Notification) => {
    if (notification.channel !== 'curing_telemetry' || !notification.payload) {
      return
    }

    try {
      events.push(JSON.parse(notification.payload) as CuringTelemetry)
    } catch (error) {
      subscriptionError = new Error(
        `Invalid curing telemetry notification: ${String(error)}`
      )
    }
    wake?.()
    wake = undefined
  }
  const onError = (error: Error) => {
    subscriptionError = error
    wake?.()
    wake = undefined
  }
  const onEnd = () => {
    subscriptionError ??= new Error(
      'PostgreSQL subscription connection closed unexpectedly'
    )
    wake?.()
    wake = undefined
  }

  client.on('notification', notify)
  client.on('error', onError)
  client.on('end', onEnd)

  try {
    await client.query('LISTEN curing_telemetry')

    while (true) {
      const event = events.shift()
      if (event) {
        yield event
        continue
      }
      if (subscriptionError) throw subscriptionError

      await new Promise<void>((resolve) => {
        wake = resolve
        if (events.length || subscriptionError) {
          wake = undefined
          resolve()
        }
      })
    }
  } finally {
    client.off('notification', notify)
    client.off('error', onError)
    client.off('end', onEnd)
    await client.end()
  }
}

const CuringTelemetryRef = builder
  .objectRef<CuringTelemetry>('CuringTelemetry')
  .implement({
    fields: (t) => ({
      machineId: t.exposeString('machineId'),
      timestamp: t.exposeString('timestamp'),
      cycleTimeMs: t.exposeInt('cycleTimeMs'),
      cycleTimeVariationPercent: t.exposeFloat('cycleTimeVariationPercent'),
      alert: t.exposeString('alert'),
      rootCause: t.exposeString('rootCause'),
      oeePercent: t.exposeFloat('oeePercent'),
      machineHealthPercent: t.exposeFloat('machineHealthPercent'),
      temperatureC: t.exposeFloat('temperatureC'),
      pressureBar: t.exposeFloat('pressureBar'),
      packetLossPercent: t.exposeFloat('packetLossPercent'),
      connectionState: t.exposeString('connectionState'),
    }),
  })

builder.subscriptionField('curingTelemetry', (t) =>
  t.field({
    type: CuringTelemetryRef,
    description: 'Streams tyre-curing machine telemetry.',
    subscribe: async function* () {
      if (process.env['use-go'] === 'true') {
        yield* subscribeToPostgres()
        return
      }

      yield* mockCuringMachine()
    },
    resolve: (value) => value,
  })
)
