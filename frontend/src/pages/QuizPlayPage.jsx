import React, { useState, useEffect } from 'react'
import { useSearchParams, useParams, useNavigate } from 'react-router-dom'
import { Trophy, ArrowLeft, Users } from 'lucide-react'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { quizAPI, battleAPI, challengeAPI } from '../services/api'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/AuthContext'

const QuizPlayPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { battleId, challengeId } = useParams()
  const quizId = searchParams.get('quizId')
  const { user } = useAuth()
  const { joinQuiz, submitAnswer, endQuiz, on } = useSocket()

  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [quizFinished, setQuizFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [participants, setParticipants] = useState([])
  const [scoreboard, setScoreboard] = useState([])
  const [isBattle, setIsBattle] = useState(false)
  const [isChallenge, setIsChallenge] = useState(false)
  const [actualQuizId, setActualQuizId] = useState(null)

  useEffect(() => {
    if (quizId) {
      setIsBattle(false)
      setIsChallenge(false)
      setActualQuizId(quizId)
      loadQuiz()
    } else if (battleId) {
      setIsBattle(true)
      setIsChallenge(false)
      loadQuiz()
    } else if (challengeId) {
      setIsChallenge(true)
      setIsBattle(false)
      loadQuiz()
    }
  }, [quizId, battleId, challengeId])

  // Setup socket AFTER quiz is loaded
  useEffect(() => {
    if (quiz && user) {
      if (isBattle || isChallenge) {
        console.log('🔌 Setting up socket with quizId:', quiz._id)
        joinQuiz({
          quizId: quiz._id,
          username: user.name,
          userId: user._id,
        })

        // Listen for participants update
        const unsubParticipants = on('participants-update', (participants) => {
          console.log('👥 Participants updated:', participants)
          setParticipants(participants)
        })

        // Listen for scoreboard updates
        const unsubScoreboard = on('scoreboard-update', (scoreboard) => {
          console.log('📊 Scoreboard updated:', scoreboard)
          setScoreboard(scoreboard)
        })

        // Listen for quiz ended
        const unsubEnded = on('quiz-ended', (data) => {
          console.log('✅ Quiz ended')
          setQuizFinished(true)
        })

        return () => {
          unsubParticipants?.()
          unsubScoreboard?.()
          unsubEnded?.()
        }
      }
    }
  }, [quiz, user, isBattle, isChallenge, joinQuiz, on])

  const loadQuiz = async () => {
    setLoading(true)
    try {
      let response = null
      
      if (quizId) {
        console.log('📚 Loading regular quiz:', quizId)
        response = await quizAPI.getQuiz(quizId)
        setQuiz(response.quiz)
      } else if (battleId) {
        console.log('🎮 Loading battle:', battleId)
        response = await battleAPI.getById(battleId)
        console.log('✅ Battle data:', response)
        if (response.battle && response.battle.quizId) {
          setQuiz(response.battle.quizId)
        } else {
          throw new Error('Quiz not found in battle data')
        }
      } else if (challengeId) {
        console.log('🏆 Loading challenge:', challengeId)
        response = await challengeAPI.getById(challengeId)
        console.log('✅ Challenge data:', response)
        if (response.challenge && response.challenge.quizId) {
          setQuiz(response.challenge.quizId)
        } else {
          throw new Error('Quiz not found in challenge data')
        }
      }
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast.error(error.message || 'Failed to load quiz. Redirecting home...')
      // Redirect to home after showing error
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (optionIndex) => {
    const newAnswers = [...answers, optionIndex]
    setAnswers(newAnswers)

    // For battles and challenges, emit answer via socket
    if ((isBattle || isChallenge) && quiz) {
      console.log('🎯 Submitting answer for quiz:', quiz._id)
      submitAnswer({
        quizId: quiz._id,
        participantId: user._id,
        questionId: quiz.questions[currentQuestionIndex]._id,
        answer: optionIndex,
        responseTime: 5000, // Can be enhanced with actual timer
        isCorrect: quiz.questions[currentQuestionIndex].correctAnswer === optionIndex,
      })
    }

    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Quiz finished
      const correctCount = quiz.questions.filter((q, idx) => {
        return q.correctAnswer === newAnswers[idx]
      }).length
      setScore(correctCount)
      
      // For multiplayer, wait for all participants or emit end-quiz
      if (isBattle || isChallenge) {
        endQuiz(quiz._id)
      } else {
        setQuizFinished(true)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6 mt-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-gray-600 mb-4">Quiz not found</p>
            <a href="/" className="text-purple-600 hover:text-purple-800 font-medium">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (quizFinished) {
    const totalQuestions = quiz.questions.length
    const percentage = Math.round((score / totalQuestions) * 100)

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Navbar />
        <div className="max-w-2xl mx-auto p-6 mt-20">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Trophy size={64} className="mx-auto mb-4 text-yellow-500" />
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
            <p className="text-2xl text-gray-700 mb-4">
              You scored {score} out of {totalQuestions}
            </p>
            <p className="text-5xl font-bold text-purple-600 mb-8">{percentage}%</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Correct</p>
                <p className="text-2xl font-bold text-green-600">{score}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Wrong</p>
                <p className="text-2xl font-bold text-red-600">{totalQuestions - score}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
              </div>
            </div>

            <a
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const totalQuestions = quiz.questions.length
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />

      <div className="max-w-3xl mx-auto p-6 mt-20">
        {/* Quiz Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
              <p className="text-purple-100">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            <a href="/" className="text-white hover:text-purple-100 transition">
              <ArrowLeft size={24} />
            </a>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-purple-500 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Show participants count for multiplayer */}
          {(isBattle || isChallenge) && participants.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Users size={16} />
              <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Scoreboard for Multiplayer */}
        {(isBattle || isChallenge) && scoreboard.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Live Scoreboard</h3>
            <div className="space-y-2">
              {scoreboard.slice(0, 5).map((player, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-purple-600">#{idx + 1}</span>
                    <span className="text-gray-800">{player.username}</span>
                  </div>
                  <span className="font-bold text-purple-600">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {currentQuestion.text}
          </h2>

          {/* Options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="w-full p-6 text-left border-2 border-gray-300 rounded-xl hover:border-purple-600 hover:bg-purple-50 transition font-semibold text-lg text-gray-700 group"
              >
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-300 text-gray-900 rounded-full font-bold mr-4 group-hover:bg-purple-600 group-hover:text-white transition">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1)
                setAnswers(answers.slice(0, -1))
              }
            }}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <p className="text-gray-600 font-medium">
            {currentQuestionIndex + 1} / {totalQuestions}
          </p>

          <button
            disabled={answers.length <= currentQuestionIndex}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuizPlayPage
