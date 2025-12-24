import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"
import Settings from "../components/settings"
import { Session } from "@supabase/supabase-js"

export default function SettingsScreen() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])
  
  if (!session || !session.user) {
    return null // Auth is handled in _layout.tsx
  }
  
  return <Settings session={session} />
}
