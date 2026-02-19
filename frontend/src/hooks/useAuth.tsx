import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import axios from 'axios'

interface User {
  id: number
  name: string
  email: string
  avatar?: string
  company_name?: string
  current_organization_id?: number
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => void
  logout: () => void
  currentOrgId: number | null
  switchOrganization: (orgId: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentOrgId, setCurrentOrgId] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedOrgId = localStorage.getItem('current_organization_id')

    if (savedOrgId) {
      setCurrentOrgId(parseInt(savedOrgId))
      axios.defaults.headers.common['X-Organization-ID'] = savedOrgId
    }

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/user')
      const userData = response.data
      setUser(userData)

      // Set organization ID from user data if available
      if (userData.current_organization_id) {
        setCurrentOrgId(userData.current_organization_id)
        localStorage.setItem('current_organization_id', String(userData.current_organization_id))
        axios.defaults.headers.common['X-Organization-ID'] = String(userData.current_organization_id)
      }
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('current_organization_id')
      delete axios.defaults.headers.common['Authorization']
      delete axios.defaults.headers.common['X-Organization-ID']
    } finally {
      setIsLoading(false)
    }
  }

  const login = (token: string) => {
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    fetchUser()
  }

  const logout = async () => {
    try {
      await axios.post('/api/logout')
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('current_organization_id')
      delete axios.defaults.headers.common['Authorization']
      delete axios.defaults.headers.common['X-Organization-ID']
      setUser(null)
      setCurrentOrgId(null)
    }
  }

  const switchOrganization = (orgId: number) => {
    setCurrentOrgId(orgId)
    localStorage.setItem('current_organization_id', String(orgId))
    axios.defaults.headers.common['X-Organization-ID'] = String(orgId)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, currentOrgId, switchOrganization }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
