import { createContext, useContext, useState } from "react"

const BreakUpdateContext = createContext({
  triggerBreakUpdate: () => {},
  lastBreakUpdate: 0,
})

export const useBreakUpdate = () => useContext(BreakUpdateContext)

export const BreakUpdateProvider = ({ children }) => {
  const [lastBreakUpdate, setLastBreakUpdate] = useState(Date.now())
  const triggerBreakUpdate = () => setLastBreakUpdate(Date.now())
  return (
    <BreakUpdateContext.Provider value={{ triggerBreakUpdate, lastBreakUpdate }}>
      {children}
    </BreakUpdateContext.Provider>
  )
}