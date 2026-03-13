import { useState, useEffect } from "react"
import axios from "axios"

export interface User {
  id: string
  email: string
  full_name: string
  role: "landlord" | "tenant"
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("/api/auth/me")
        setUser(data.user)
      } catch (err) {
        console.error("Failed to fetch user:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}
