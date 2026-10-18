import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ready, setReady] = useState(false)
  const [recovering, setRecovering] = useState(false)

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await api.getProfile())
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let active = true
    api.getUser().then((u) => {
      if (!active) return
      setUser(u)
      setReady(true)
    })
    const off = api.onAuthChange((u, event) => {
      setUser(u)
      setReady(true)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => {
      active = false
      off()
    }
  }, [])

  useEffect(() => {
    if (user) refreshProfile()
    else setProfile(null)
  }, [user, refreshProfile])

  const value = useMemo(
    () => ({ user, profile, ready, recovering, setRecovering, refreshProfile, setProfile }),
    [user, profile, ready, recovering, refreshProfile],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
