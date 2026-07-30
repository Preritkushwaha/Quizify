import { useEffect, useCallback } from 'react'
import socketService from '../services/socket'

// Custom socket hook
export function useSocket() {
  useEffect(() => {
    // Connect to socket when hook is mounted
    socketService.connect()

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount, keep connection alive
      // socketService.disconnect()
    }
  }, [])

  const emit = useCallback((event, data) => {
    socketService.socket?.emit(event, data)
  }, [])

  const on = useCallback((event, callback) => {
    socketService.on(event, callback)
    return () => socketService.off(event, callback)
  }, [])

  return {
    socket: socketService.socket,
    connected: socketService.isConnected(),
    emit,
    on,
    joinQuiz: socketService.joinQuiz.bind(socketService),
    startQuiz: socketService.startQuiz.bind(socketService),
    nextQuestion: socketService.nextQuestion.bind(socketService),
    submitAnswer: socketService.submitAnswer.bind(socketService),
    endQuiz: socketService.endQuiz.bind(socketService),
    reportCheating: socketService.reportCheating.bind(socketService),
  }
}

