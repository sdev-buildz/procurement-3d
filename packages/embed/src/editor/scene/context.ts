import { createContext } from 'react'

/** Room Scene React context. */
export const RoomContext = createContext<{
  lodBound: number
  setLodBound: (n: number) => void
}>({ lodBound: 0, setLodBound: () => {} })
