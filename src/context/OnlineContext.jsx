import { createContext, useContext, useEffect, useState } from 'react'

const OnlineContext = createContext(true)

export function OnlineProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return <OnlineContext.Provider value={online}>{children}</OnlineContext.Provider>
}

export const useOnline = () => useContext(OnlineContext)
