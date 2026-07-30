import React, { createContext, useState, useEffect, useContext } from 'react'
import { 
  auth, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from '../services/firebase'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            try {
              // Get ID token
              const token = await firebaseUser.getIdToken()
              localStorage.setItem('firebaseToken', token)

              // Login to backend
              const response = await authAPI.login({
                firebaseUid: firebaseUser.uid,
              })

              localStorage.setItem('token', response.token)
              setUser(response.user)
            } catch (error) {
              console.error('Auth error:', error)
              // Don't show toast on initial load
              setUser(null)
            }
          } else {
            setUser(null)
            localStorage.removeItem('token')
            localStorage.removeItem('firebaseToken')
          }
        } finally {
          setLoading(false)
        }
      })

      return unsubscribe
    } catch (error) {
      console.error('Auth setup error:', error)
      setLoading(false)
      return () => {}
    }
  }, [])

  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Register in backend
      await authAPI.register({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userData,
      })

      toast.success('Account created successfully!')
      return firebaseUser
    } catch (error) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed')
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success('Logged in successfully!')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('firebaseToken')
      toast.success('Logged out successfully!')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      setUser(response.user)
      toast.success('Profile updated successfully!')
      return response.user
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}