import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      })

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket.id)
        this.connected = true
      })

      this.socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        this.connected = false
      })

      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error)
      })
    }
    
    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected
  }

  // Quiz Room Events
  joinQuiz(data) {
    this.socket?.emit('join-quiz', data)
  }

  startQuiz(quizId) {
    this.socket?.emit('start-quiz', { quizId })
  }

  nextQuestion(quizId, questionIndex) {
    this.socket?.emit('next-question', { quizId, questionIndex })
  }

  submitAnswer(data) {
    this.socket?.emit('submit-answer', data)
  }

  reportCheating(data) {
    this.socket?.emit('report-cheating', data)
  }

  endQuiz(quizId) {
    this.socket?.emit('end-quiz', { quizId })
  }

  // Event Listeners
  on(event, callback) {
    this.socket?.on(event, callback)
  }

  off(event, callback) {
    this.socket?.off(event, callback)
  }

  // Specific listeners
  onJoinSuccess(callback) {
    this.on('join-success', callback)
  }

  onParticipantsUpdate(callback) {
    this.on('participants-update', callback)
  }

  onQuizStarted(callback) {
    this.on('quiz-started', callback)
  }

  onQuestionUpdate(callback) {
    this.on('question-update', callback)
  }

  onScoreboardUpdate(callback) {
    this.on('scoreboard-update', callback)
  }

  onCheatingAlert(callback) {
    this.on('cheating-alert', callback)
  }

  onQuizEnded(callback) {
    this.on('quiz-ended', callback)
  }
}

export default new SocketService()