import { createContext, useContext, useState } from "react"

const AttendanceUpdateContext = createContext({
  triggerUpdate: () => {},
  lastUpdate: 0,
})

export const useAttendanceUpdate = () => useContext(AttendanceUpdateContext)

export const AttendanceUpdateProvider = ({ children }) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const triggerUpdate = () => setLastUpdate(Date.now())
  return (
    <AttendanceUpdateContext.Provider value={{ triggerUpdate, lastUpdate }}>
      {children}
    </AttendanceUpdateContext.Provider>
  )
}