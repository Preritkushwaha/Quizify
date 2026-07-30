import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { quizAPI } from '../services/api';
import ResultsWaitingScreen from '../components/ResultsWaitingScreen';

const EnhancedQuizPlayPage = () => {
  const { quizId, shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  // Quiz and Question State
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizStatus, setQuizStatus] = useState('waiting'); // waiting, active, completed
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Answer State
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);

  // Timer State
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [questionTimeElapsed, setQuestionTimeElapsed] = useState(0);
  const [totalQuizDuration, setTotalQuizDuration] = useState(0);
  const [currentQuestionDuration, setCurrentQuestionDuration] = useState(10);
  const [isEarlyCompleted, setIsEarlyCompleted] = useState(false);
  const [showWaitingScreen, setShowWaitingScreen] = useState(false);

  const totalTimerRef = useRef(null);
  const questionTimerRef = useRef(null);

  // Load Quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        let quizData;
        if (shareCode) {
          const response = await quizAPI.getByShareCode(shareCode);
          quizData = response.quiz;
        } else if (quizId) {
          const response = await quizAPI.getQuiz(quizId);
          quizData = response.quiz;
        }

        setQuiz(quizData);
        setQuestions(quizData.questions || []);
        
        // Calculate total duration
        const totalDuration = quizData.questions.reduce(
          (sum, q) => sum + (q.timer || 10),
          0
        );
        setTotalQuizDuration(totalDuration);
        setCurrentQuestionDuration(quizData.questions[0]?.timer || 10);

        setLoading(false);

        // Join the quiz via socket
        if (socket && quizData) {
          const userName = user?.displayName || user?.email?.split('@')[0] || 'Anonymous';
          socket.emit('join-quiz', {
            quizId: quizData._id,
            userName,
            userId: user?.uid
          });
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        toast.error('Failed to load quiz');
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, shareCode, socket, user]);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('quiz-started', (data) => {
      console.log('Quiz started:', data);
      setQuizStatus('active');
      setCurrentQuestionIndex(0);
      toast.success('Quiz has started!');
    });

    socket.on('waiting-for-quiz-end', (data) => {
      setIsEarlyCompleted(true);
      setShowWaitingScreen(true);
      toast.success('You completed early! Waiting for others...');
    });

    socket.on('quiz-ended', (data) => {
      setQuizStatus('completed');
      setShowWaitingScreen(true);
    });

    socket.on('score-updated', (data) => {
      setScore(data.score);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error(error.message);
    });

    return () => {
      socket.off('quiz-started');
      socket.off('waiting-for-quiz-end');
      socket.off('quiz-ended');
      socket.off('score-updated');
      socket.off('error');
    };
  }, [socket]);

  // Total Quiz Timer
  useEffect(() => {
    if (quizStatus === 'active' && !isEarlyCompleted) {
      totalTimerRef.current = setInterval(() => {
        setTotalTimeElapsed(prev => {
          const newTime = prev + 1;
          // If total time exceeded, mark as auto-completed
          if (newTime >= totalQuizDuration) {
            handleQuizAutoComplete();
            return newTime;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(totalTimerRef.current);
  }, [quizStatus, totalQuizDuration, isEarlyCompleted]);

  // Question Timer
  useEffect(() => {
    if (quizStatus === 'active' && !isEarlyCompleted) {
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeElapsed(prev => {
          const newTime = prev + 1;
          if (newTime >= currentQuestionDuration) {
            handleAutoMoveToNext();
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(questionTimerRef.current);
  }, [quizStatus, currentQuestionDuration, isEarlyCompleted]);

  const handleAutoMoveToNext = () => {
    // Auto move to next question if time runs out
    if (currentQuestionIndex < questions.length - 1) {
      // Store current answer (empty if no answer selected)
      submitCurrentAnswer();
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimeElapsed(0);
      setSelectedAnswer(null);
    }
  };

  const submitCurrentAnswer = () => {
    if (!socket) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const points = isCorrect ? 10 : 0;

    // Update local state
    setAnswers(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect,
      timeSpent: questionTimeElapsed
    }]);

    setScore(prev => prev + points);

    // Emit to server
    socket.emit('submit-answer', {
      quizId: quiz._id,
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      questionId: currentQuestion._id,
      isCorrect,
      timeSpent: questionTimeElapsed
    });
  };

  const handleAnswerSelect = (answerIndex) => {
    if (quizStatus !== 'active') return;
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      submitCurrentAnswer();
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionTimeElapsed(0);
      setSelectedAnswer(null);
      const nextQuestion = questions[currentQuestionIndex + 1];
      setCurrentQuestionDuration(nextQuestion?.timer || 10);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionTimeElapsed(0);
      setSelectedAnswer(null);
    }
  };

  const handleQuizAutoComplete = () => {
    submitCurrentAnswer();
    setIsEarlyCompleted(true);
    
    if (socket && quiz) {
      socket.emit('quiz-completed-early', {
        quizId: quiz._id,
        timeTaken: totalTimeElapsed
      });
    }

    setShowWaitingScreen(true);
  };

  const handleSubmitQuiz = () => {
    submitCurrentAnswer();
    handleQuizAutoComplete();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentageLeft = (questionTimeElapsed / currentQuestionDuration) * 100;
    if (percentageLeft > 66) return 'text-green-600';
    if (percentageLeft > 33) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Quiz not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (quizStatus === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Clock size={48} className="text-indigo-600 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Waiting for admin...</h2>
          <p className="text-gray-600">The quiz admin hasn't started the quiz yet. Please wait.</p>
        </div>
      </div>
    );
  }

  if (showWaitingScreen || quizStatus === 'completed') {
    return <ResultsWaitingScreen quizId={quiz._id} />;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const remainingTime = totalQuizDuration - totalTimeElapsed;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            <div className={`text-center p-3 rounded-lg ${
              remainingTime <= 10 ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <Clock size={20} className={remainingTime <= 10 ? 'text-red-600' : 'text-blue-600'} />
              <p className={`text-xs font-semibold ${remainingTime <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(remainingTime)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex-1">
              {currentQuestion.text}
            </h2>
            <div className={`text-center ml-4 ${getTimeColor()}`}>
              <Clock size={24} />
              <p className="text-2xl font-bold">{formatTime(currentQuestionDuration - questionTimeElapsed)}</p>
              <p className="text-xs">{currentQuestion.timer}s</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={quizStatus !== 'active'}
                className={`w-full p-4 text-left rounded-lg border-2 transition ${
                  selectedAnswer === index
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 bg-gray-50 hover:border-indigo-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-400'
                  }`}>
                    {selectedAnswer === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Score Display */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-gray-700 font-semibold">Current Score:</span>
            <span className="text-2xl font-bold text-indigo-600">{score}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            ← Previous
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmitQuiz}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuizPlayPage;
