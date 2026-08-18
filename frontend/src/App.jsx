import React, { Suspense, useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ManualBuilderPage from './pages/ManualBuilderPage'
import QuizPlayPage from './pages/QuizPlayPage'
import MyQuizzesPage from './pages/MyQuizzesPage'
import AdminDashboardTestPage from './pages/AdminDashboardTestPage'
import QuizAdminDashboard from './components/QuizAdminDashboard'
import QuizParticipantWaitingRoom from './components/QuizParticipantWaitingRoom'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import HomePage from './pages/HomePage'
import QuickJoinPage from './pages/QuickJoinPage'
import { useAuth } from './hooks/useAuth'

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (event) => {
      console.error('Error:', event.error)
      setHasError(true)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-6">Please refresh the page or try again later.</p>
          <button
            onClick={() => {
              setHasError(false)
              window.location.reload()
            }}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return children
}

const App = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
          <Route path="/join/:shareCode" element={<QuickJoinPage />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={user ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/manual-builder" element={user ? <ManualBuilderPage /> : <Navigate to="/login" />} />
          <Route path="/my-quizzes" element={user ? <MyQuizzesPage /> : <Navigate to="/login" />} />
          <Route path="/admin-test" element={user ? <AdminDashboardTestPage /> : <Navigate to="/login" />} />
          <Route path="/quiz-admin-dashboard/:quizId" element={user ? <QuizAdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/quiz-waiting/:quizId" element={<QuizParticipantWaitingRoom />} />
          <Route path="/quiz-waiting-share/:shareCode" element={<QuizParticipantWaitingRoom />} />
          <Route path="/quiz-play/:quizId" element={<QuizPlayPage />} />
          <Route path="/battle/:battleId" element={<QuizPlayPage />} />
          <Route path="/challenge/:challengeId" element={<QuizPlayPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App

