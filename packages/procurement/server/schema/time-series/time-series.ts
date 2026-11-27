/**
 * @packageDocumentation
 * @module TimeSeries
 * Exposes a graphql subscription to emit time series data from the machines.
 */
import {
  mockCuringMachine,
  type CuringTelemetry,
} from '@packages/mock-machines'
import { builder } from '../lib/builder'

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
    description: 'Streams mock tyre-curing machine telemetry.',
    subscribe: async function* () {
      yield* mockCuringMachine()
    },
    resolve: (value) => value,
  })
)
