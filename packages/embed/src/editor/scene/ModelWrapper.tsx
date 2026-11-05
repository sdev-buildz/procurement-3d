import { useLayoutEffect, useState, type ComponentProps } from 'react'
import { NestedInstances } from './NestedInstances'

/**
 *  Nested loaders with instanced models.
 */
export function ModelWrapper(props: ComponentProps<typeof NestedInstances>) {
  const [mounted, setMounted] = useState(false)

  useLayoutEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <></>
  return <NestedInstances {...props} />
}
