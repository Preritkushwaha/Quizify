import React, { createContext, useState, useContext, useCallback } from 'react'
import socketService from '../services/socket'
import { quizAPI } from '../services/api'
import toast from 'react-hot-toast'

const QuizContext = createContext()

export const useQuiz = () => {
  const context = useContext(QuizContext)
  if (!context) {
    throw new Error('useQuiz must be used within QuizProvider')
  }
  return context
}

export const QuizProvider = ({ children }) => {
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [participants, setParticipants] = useState([])
  const [scoreboard, setScoreboard] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [quizStatus, setQuizStatus] = useState('waiting') // waiting, active, ended
  const [quizDuration, setQuizDuration] = useState(0)
  const [adminDashboardData, setAdminDashboardData] = useState(null)

  const generateAIQuiz = async (prompt, difficulty, mode) => {
    try {
      const response = await quizAPI.generateAI({ prompt, difficulty, mode })
      setCurrentQuiz(response.quiz)
      setIsAdmin(true)
      toast.success('Quiz generated successfully!')
      return response.quiz
    } catch (error) {
      console.error('Generate quiz error:', error)
      throw error
    }
  }

  const createCustomQuiz = async (quizData) => {
    try {
      const response = await quizAPI.create(quizData)
      setCurrentQuiz(response.quiz)
      setIsAdmin(true)
      toast.success('Custom quiz created!')
      return response.quiz
    } catch (error) {
      console.error('Create quiz error:', error)
      throw error
    }
  }

  const loadQuiz = async (quizId) => {
    try {
      const response = await quizAPI.getQuiz(quizId)
      setCurrentQuiz(response.quiz)
      return response.quiz
    } catch (error) {
      console.error('Load quiz error:', error)
      throw error
    }
  }

  const loadQuizByShareCode = async (shareCode) => {
    try {
      const response = await quizAPI.getByShareCode(shareCode)
      setCurrentQuiz(response.quiz)
      return response.quiz
    } catch (error) {
      console.error('Load quiz error:', error)
      throw error
    }
  }

  const joinQuiz = useCallback((quizId, userName, userId) => {
    socketService.connect()
    socketService.emit('join-quiz', { quizId, userName, userId })
  }, [])

  const startQuiz = useCallback((quizId, userId) => {
    socketService.emit('start-quiz', { quizId, userId })
    setQuizStatus('active')
  }, [])

  const endQuiz = useCallback((quizId, userId) => {
    socketService.emit('end-quiz', { quizId, userId })
    setQuizStatus('completed')
  }, [])

  const submitAnswer = useCallback((data) => {
    socketService.emit('submit-answer', data)
  }, [])

  const getAdminDashboard = useCallback((quizId, userId) => {
    return quizAPI.getQuizWithParticipants(quizId)
  }, [])

  const resetQuiz = () => {
    setCurrentQuiz(null)
    setParticipants([])
    setScoreboard([])
    setIsAdmin(false)
    setQuizStatus('waiting')
    setQuizDuration(0)
    setAdminDashboardData(null)
    socketService.disconnect()
  }

  const value = {
    currentQuiz,
    setCurrentQuiz,
    participants,
    setParticipants,
    scoreboard,
    setScoreboard,
    isAdmin,
    setIsAdmin,
    quizStatus,
    setQuizStatus,
    quizDuration,
    setQuizDuration,
    adminDashboardData,
    setAdminDashboardData,
    generateAIQuiz,
    createCustomQuiz,
    loadQuiz,
    loadQuizByShareCode,
    joinQuiz,
    startQuiz,
    submitAnswer,
    endQuiz,
    getAdminDashboard,
    resetQuiz,
  }

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>
}