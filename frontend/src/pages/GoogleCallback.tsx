import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, user, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const handleCallback = async () => {
      const token = searchParams.get('token')
      const errorMsg = searchParams.get('error')

      if (errorMsg) {
        setError('Google authentication failed')
        toast.error('Google login failed')
        return
      }

      if (!token) {
        setError('Token not found in URL')
        return
      }

      // Login and wait for user data
      login(token)
    }

    handleCallback()
  }, [searchParams, login])

  // Navigate when user data is loaded
  useEffect(() => {
    if (user && !isLoading) {
      toast.success(`Welcome, ${user.name}!`)
      navigate('/dashboard', { replace: true })
    }
  }, [user, isLoading, navigate])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Login Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Loading your profile...</h2>
        <p className="text-gray-600">Please wait while we fetch your information</p>
      </div>
    </div>
  )
}
