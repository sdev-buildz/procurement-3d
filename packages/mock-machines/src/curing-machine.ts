/**
 * A mock curing machine.
 * Yields mock curing packets for the digital twin.
 */
export type CuringTelemetry = {
  machineId: string
  timestamp: string
  cycleTimeMs: number
  cycleTimeVariationPercent: number
  alert: string
  rootCause: string
  oeePercent: number
  machineHealthPercent: number
  temperatureC: number
  pressureBar: number
  packetLossPercent: number
  connectionState: 'connected' | 'degraded' | 'reconnecting'
}

/**
 * Configuration options for the mock curing machine.
 */
export type CuringMachineOptions = {
  machineId?: string
  intervalMs?: number
  packetLossChance?: number
  signal?: AbortSignal
}

/**
 * Produces realistic, slowly changing curing telemetry.
 * Occasional packets are retained as packet-loss/degradation events instead of
 * silently stopping the stream, making data reliability visible in the twin.
 * @yields {CuringTelemetry} The next mock curing telemetry packet.
 */
export async function* mockCuringMachine({
  machineId = 'CURING-01',
  intervalMs = 1500,
  packetLossChance = 0.08,
  signal,
}: CuringMachineOptions = {}): AsyncGenerator<CuringTelemetry> {
  let cycleTimeMs = 420_000
  let temperatureC = 171
  let pressureBar = 18.2
  let packetLossPercent = 0.4
  let tick = 0

  while (!signal?.aborted) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs))
    if (signal?.aborted) return
    tick += 1

    cycleTimeMs += (Math.random() - 0.48) * 4_500
    temperatureC += (Math.random() - 0.5) * 1.2
    pressureBar += (Math.random() - 0.5) * 0.22

    const lossEvent = Math.random() < packetLossChance
    packetLossPercent = lossEvent
      ? Math.min(12, packetLossPercent + 1.8 + Math.random() * 2)
      : Math.max(0.1, packetLossPercent - 0.35)

    const highVariation = tick % 13 === 0
    const overPressure = tick % 17 === 0
    const alert = lossEvent
      ? 'Data quality warning'
      : overPressure
        ? 'Pressure deviation'
        : highVariation
          ? 'Cycle-time drift'
          : 'Normal'

    const rootCause = lossEvent
      ? 'PLC packet loss / MQTT retry'
      : overPressure
        ? 'Steam valve hysteresis'
        : highVariation
          ? 'Mould temperature imbalance'
          : 'No active fault'

    const oeePercent = Math.max(
      68,
      Math.min(96, 91 - packetLossPercent * 0.55 - (highVariation ? 3 : 0))
    )
    const machineHealthPercent = Math.max(
      72,
      Math.min(99, 97 - packetLossPercent * 0.8 - (overPressure ? 4 : 0))
    )

    yield {
      machineId,
      timestamp: new Date().toISOString(),
      cycleTimeMs: Math.round(cycleTimeMs),
      cycleTimeVariationPercent: Number(
        (highVariation
          ? 5.8 + Math.random() * 2.2
          : 1.2 + Math.random() * 1.8
        ).toFixed(1)
      ),
      alert,
      rootCause,
      oeePercent: Number(oeePercent.toFixed(1)),
      machineHealthPercent: Number(machineHealthPercent.toFixed(1)),
      temperatureC: Number(temperatureC.toFixed(1)),
      pressureBar: Number(pressureBar.toFixed(2)),
      packetLossPercent: Number(packetLossPercent.toFixed(1)),
      connectionState: lossEvent
        ? 'degraded'
        : tick % 29 === 0
          ? 'reconnecting'
          : 'connected',
    }
  }
}
