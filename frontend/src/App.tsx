import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import AIAssistant from './pages/AIAssistant'
import Clients from './pages/Clients'
import Invoices from './pages/Invoices'
import Analytics from './pages/Analytics'
import Organizations from './pages/Organizations'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import GoogleCallback from './pages/GoogleCallback'
import './App.css'

function App() {
  const { user, isLoading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes - accessible without auth */}
      <Route path="/auth/google/callback" element={<GoogleCallback />} />

      {/* Auth routes */}
      {!user ? (
        <>
          <Route path="*" element={
            showRegister ? (
              <Register onLoginClick={() => setShowRegister(false)} />
            ) : (
              <Login onRegisterClick={() => setShowRegister(true)} />
            )
          } />
        </>
      ) : (
        /* Protected routes */
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        } />
      )}
    </Routes>
  )
}

export default App
