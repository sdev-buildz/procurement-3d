/**
 * @packageDocumentation
 * {@inheritDoc seed}
 */
import { seed1 } from './seed-logics.ts/seed1'

async function main() {
  await seed1()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
