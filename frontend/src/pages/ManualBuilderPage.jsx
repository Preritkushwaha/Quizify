import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import toast from 'react-hot-toast'
import { quizAPI } from '../services/api'

const ManualBuilderPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const quizType = searchParams.get('type') || 'standard'
  const { user } = useAuth()
  const [quizTitle, setQuizTitle] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  })
  const [loading, setLoading] = useState(false)

  const addQuestion = () => {
    if (!currentQuestion.text.trim()) {
      toast.error('Please enter a question')
      return
    }

    if (!currentQuestion.options.every(o => o.trim())) {
      toast.error('Please fill all options')
      return
    }

    setQuestions([...questions, { ...currentQuestion, id: Date.now() }])
    setCurrentQuestion({ text: '', options: ['', '', '', ''], correctAnswer: 0 })
    toast.success('Question added!')
  }

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id))
    toast.success('Question removed')
  }

  const saveQuiz = async () => {
    if (!quizTitle.trim()) {
      toast.error('Please enter a quiz title')
      return
    }

    if (questions.length === 0) {
      toast.error('Add at least one question')
      return
    }

    setLoading(true)
    try {
      console.log('🚀 Starting manual quiz creation...');
      const quizData = {
        title: quizTitle,
        type: quizType,
        questions: questions.map(q => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer
        }))
      }

      const response = await quizAPI.create(quizData)
      console.log('✅ Manual quiz created:', response);
      
      if (!response || !response.quiz || !response.quiz._id) {
        console.error('❌ Invalid response structure:', response);
        toast.error('Invalid response from server. Please try again.');
        setLoading(false);
        return;
      }
      
      const quizId = response.quiz._id;
      console.log('📍 Navigating to admin dashboard with quizId:', quizId);
      
      toast.success('Quiz created successfully! Redirecting to dashboard...');
      
      // Add a small delay to ensure the toast is visible
      setTimeout(() => {
        navigate(`/quiz-admin-dashboard/${quizId}`)
      }, 500)
    } catch (error) {
      console.error('❌ Error creating quiz:', error)
      console.error('Error details:', error.message, error.error);
      toast.error(error.message || 'Failed to create quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />

      <div className="max-w-4xl mx-auto p-6 mt-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium mb-8 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Custom Quiz</h1>

          {/* Quiz Title */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              placeholder="Enter quiz title"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition"
            />
          </div>

          {/* Questions List */}
          {questions.length > 0 && (
            <div className="mb-8 p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Questions Added: {questions.length}
              </h2>
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-start p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {idx + 1}. {q.text}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Correct: {String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}
                      </p>
                    </div>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="ml-4 text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Question Form */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Question</h2>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Question Text
              </label>
              <input
                type="text"
                value={currentQuestion.text}
                onChange={(e) =>
                  setCurrentQuestion({ ...currentQuestion, text: e.target.value })
                }
                placeholder="Enter your question"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 outline-none transition"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Options
              </label>
              <div className="space-y-2">
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-purple-600 text-white rounded flex items-center justify-center font-semibold text-sm">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOpts = [...currentQuestion.options]
                        newOpts[idx] = e.target.value
                        setCurrentQuestion({ ...currentQuestion, options: newOpts })
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-600 outline-none transition"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Correct Answer
              </label>
              <select
                value={currentQuestion.correctAnswer}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    correctAnswer: parseInt(e.target.value)
                  })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-600 outline-none transition"
              >
                {currentQuestion.options.map((_, idx) => (
                  <option key={idx} value={idx}>
                    {String.fromCharCode(65 + idx)}. {currentQuestion.options[idx] || `Option ${String.fromCharCode(65 + idx)}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={addQuestion}
              className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={saveQuiz}
            disabled={loading || questions.length === 0}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManualBuilderPage
