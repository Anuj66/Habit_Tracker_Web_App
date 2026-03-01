import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import HabitList from './components/HabitList'
import ProgressView from './components/ProgressView'
import NotificationSettings from './components/NotificationSettings'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import VerifyEmailPage from './components/VerifyEmailPage'
import RequestResetPage from './components/RequestResetPage'
import ResetPasswordPage from './components/ResetPasswordPage'
import ToastProvider from './components/ToastProvider'
import { getCurrentUser } from './api'

const AuthContext = React.createContext(null)

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    getCurrentUser()
      .then((res) => {
        if (isMounted) {
          setUser(res.data.user)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>{children}</AuthContext.Provider>
  )
}

const useAuth = () => React.useContext(AuthContext)

const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage useAuthHook={useAuth} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<RequestResetPage />} />
            <Route path="/reset-password/confirm" element={<ResetPasswordPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout useAuthHook={useAuth} />
                </RequireAuth>
              }
            >
              <Route index element={<HabitList />} />
              <Route path="progress" element={<ProgressView />} />
              <Route path="settings" element={<NotificationSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
