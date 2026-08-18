import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { PlayCircle, StopCircle, Users, Clock, Trophy, Copy, Check, ArrowLeft, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI } from '../services/api';
import Navbar from './Navbar';

const QuizAdminDashboard = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();

  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareCodeCopied, setShareCodeCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerPerQuestion, setTimerPerQuestion] = useState(30);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [show1v1Questions, setShow1v1Questions] = useState(false);

  console.log('🔍 QuizAdminDashboard rendering - quizId:', quizId, 'user:', user?.email);

  // Load quiz data
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        console.log('📍 Loading quiz:', quizId);
        const response = await quizAPI.getQuiz(quizId);
        console.log('✅ Quiz loaded:', response);
        
        if (response?.quiz) {
          setQuiz(response.quiz);
          setQuizStatus(response.quiz.status || 'waiting');
          setError(null);
        } else {
          setError('Quiz not found');
        }
        setLoading(false);
      } catch (err) {
        console.error('❌ Error loading quiz:', err);
        setError(err?.message || 'Failed to load quiz');
        setLoading(false);
      }
    };

    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  // Socket events for participants
  useEffect(() => {
    if (!socket?.socket || !quizId) return;

    console.log('[ADMIN] Setting up socket listeners for quiz:', quizId);

    const handleParticipantJoined = (data) => {
      console.log('👤 Participant joined:', data);
      setParticipants(prev => [...prev, data]);
      toast.success(`${data.userName} joined the quiz!`);
    };

    const handleParticipantsUpdate = (data) => {
      console.log('👥 Participants updated:', data);
      // data contains: { participants: [...], count: N, quizStatus: 'waiting' }
      if (data.participants) {
        setParticipants(data.participants);
      }
      if (data.quizStatus) {
        setQuizStatus(data.quizStatus);
      }
    };

    const handleAnswerSubmitted = (data) => {
      console.log('📝 Answer submitted:', data);
      setParticipants(prev => 
        prev.map(p => 
          p.userId === data.userId 
            ? { ...p, score: data.score, answersCount: data.answersCount }
            : p
        )
      );
    };

    const handleQuizStarted = () => {
      console.log('▶️ Quiz started');
      setQuizStatus('active');
    };

    const handleQuizEnded = () => {
      console.log('⏹️ Quiz ended');
      setQuizStatus('completed');
    };

    // Admin joins the quiz room to receive broadcasts
    console.log('[ADMIN] Joining quiz room:', quizId);
    socket.socket.emit('admin-join-quiz', { quizId, adminUserId: user?.id });

    socket.socket.on('participant-joined', handleParticipantJoined);
    socket.socket.on('participants-update', handleParticipantsUpdate);
    socket.socket.on('answer-submitted', handleAnswerSubmitted);
    socket.socket.on('quiz-started', handleQuizStarted);
    socket.socket.on('quiz-ended', handleQuizEnded);

    return () => {
      socket.socket.off('participant-joined', handleParticipantJoined);
      socket.socket.off('participants-update', handleParticipantsUpdate);
      socket.socket.off('answer-submitted', handleAnswerSubmitted);
      socket.socket.off('quiz-started', handleQuizStarted);
      socket.socket.off('quiz-ended', handleQuizEnded);
    };
  }, [socket?.socket, quizId, user?.uid]);

  // Timer for active quiz
  useEffect(() => {
    let interval;
    if (quizStatus === 'active' && quiz) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStatus, quiz]);

  // Watch admin scores
  useEffect(() => {
    if (socket?.socket && quizStatus === 'active') {
      socket.socket.emit('admin-watch-scores', { quizId });
    }
  }, [socket?.socket, quizStatus, quizId]);

  const handleStartQuiz = async () => {
    if (participants.length === 0) {
      toast.error('No participants have joined yet');
      return;
    }

    setIsStarting(true);
    try {
      await quizAPI.startQuiz(quizId);
      setQuizStatus('active');
      if (socket?.socket) {
        socket.socket.emit('start-quiz', { quizId, userId: user?.id });
      }
      toast.success('Quiz started!');
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error(`Failed to start quiz: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndQuiz = async () => {
    setIsEnding(true);
    try {
      await quizAPI.endQuiz(quizId);
      setQuizStatus('completed');
      if (socket?.socket) {
        socket.socket.emit('end-quiz', { quizId, userId: user?.id });
      }
      toast.success('Quiz ended!');
    } catch (error) {
      console.error('Error ending quiz:', error);
      toast.error('Failed to end quiz');
    } finally {
      setIsEnding(false);
    }
  };

  const copyShareCode = () => {
    if (quiz?.shareCode) {
      navigator.clipboard.writeText(quiz.shareCode);
      setShareCodeCopied(true);
      toast.success('Quiz code copied!');
      setTimeout(() => setShareCodeCopied(false), 2000);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-semibold mb-2">Loading quiz...</p>
            <p className="text-xs text-gray-500">Quiz ID: {quizId}</p>
            <p className="text-xs text-gray-500 mt-1">User: {user?.email || 'Loading...'}</p>
            <p className="text-xs text-gray-400 mt-4">This may take a few seconds...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!quiz || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-semibold">Error</p>
                <p className="text-xs text-red-700 mt-2">{error}</p>
              </div>
            )}
            <p className="text-lg text-gray-600 mb-2">Quiz not found</p>
            <p className="text-sm text-gray-500 mb-2">Quiz ID: {quizId}</p>
            <p className="text-sm text-gray-500 mb-6">The quiz doesn't exist or has been deleted.</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/my-quizzes')}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                View My Quizzes
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="pt-20 pb-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Debug Info (remove in production) */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            <p><strong>Quiz ID:</strong> {quizId}</p>
            <p><strong>Quiz Status:</strong> {quizStatus}</p>
            <p><strong>Participants:</strong> {participants.length}</p>
            <p><strong>Has Quiz Data:</strong> {quiz ? 'Yes' : 'No'}</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/my-quizzes')}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-4"
            >
              <ArrowLeft size={20} />
              Back to My Quizzes
            </button>
            
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
                  <p className="text-gray-600">{quiz.description}</p>
                  <div className="mt-4 flex gap-4">
                    <span className="text-sm text-gray-500">
                      <strong>Questions:</strong> {quiz.questions?.length || 0}
                    </span>
                    <span className="text-sm text-gray-500">
                      <strong>Difficulty:</strong> {quiz.difficulty}
                    </span>
                  </div>
                </div>
                
                <div className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap ${
                  quizStatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                  quizStatus === 'active' ? 'bg-green-100 text-green-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {quizStatus === 'waiting' ? '⏳ Waiting' : 
                   quizStatus === 'active' ? '▶️ Active' : 
                   '✓ Completed'}
                </div>
              </div>

              {/* Share Code Section */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Invite Participants</h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Share this direct link with your participants. They only need to enter their name to join!</p>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-indigo-50 p-4 rounded-lg font-mono text-sm text-indigo-900 break-all border-2 border-indigo-100">
                      {window.location.origin}/join/{quiz.shareCode}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/join/${quiz.shareCode}`);
                        toast.success('Invite link copied!');
                      }}
                      className="px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 whitespace-nowrap font-semibold shadow-md transition"
                    >
                      <Copy size={20} />
                      Copy Link
                    </button>
                  </div>
                  {quiz?.type === '1v1' && quizStatus === 'waiting' && (
                    <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center justify-between">
                      <p className="text-sm text-gray-600">Want to participate in your own challenge?</p>
                      <button
                        onClick={() => window.open(`/join/${quiz.shareCode}`, '_blank')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow transition"
                      >
                        Join as Participant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls and Timer Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Timer Settings */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock size={20} />
                  Timer Settings
                </h3>
                <button
                  onClick={() => setShowTimerSettings(!showTimerSettings)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <Settings size={18} />
                </button>
              </div>

              {showTimerSettings && quizStatus === 'waiting' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Time per question (seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={timerPerQuestion}
                      onChange={(e) => setTimerPerQuestion(parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Set the time limit for each question. Changes apply when quiz starts.
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-3xl font-bold text-indigo-600">{timerPerQuestion}s</p>
                  <p className="text-xs text-gray-500 mt-2">per question</p>
                  {quizStatus !== 'waiting' && (
                    <p className="text-xs text-gray-400 mt-2">
                      Cannot change after quiz starts
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quiz Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quiz Controls</h3>
              <div className="space-y-3">
                {quizStatus === 'waiting' ? (
                  <button
                    onClick={handleStartQuiz}
                    disabled={isStarting || participants.length === 0}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                  >
                    <PlayCircle size={20} />
                    Start Quiz
                  </button>
                ) : quizStatus === 'active' ? (
                  <button
                    onClick={handleEndQuiz}
                    disabled={isEnding}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
                  >
                    <StopCircle size={20} />
                    End Quiz
                  </button>
                ) : (
                  <button disabled className="w-full py-3 bg-gray-400 text-white rounded-lg font-medium">
                    ✓ Quiz Completed
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Participants
              </h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-indigo-600 mb-2">{participants.length}</p>
                <p className="text-sm text-gray-500">joined the quiz</p>
              </div>
            </div>
          </div>

          {/* Quiz Preview */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Questions Preview</h2>
              {quiz?.type === '1v1' && quizStatus !== 'completed' && (
                <button
                  onClick={() => setShow1v1Questions(!show1v1Questions)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium transition"
                >
                  {show1v1Questions ? 'Hide Questions' : 'Show Questions'}
                </button>
              )}
            </div>
            
            {quiz?.type === '1v1' && quizStatus !== 'completed' && !show1v1Questions ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Questions are hidden for 1v1 challenges to prevent cheating.</p>
                <p className="text-sm text-gray-400 mt-2">Click 'Show Questions' if you need to preview them.</p>
              </div>
            ) : quiz.questions && quiz.questions.length > 0 ? (
              <div className="space-y-4">
                {quiz.questions.map((q, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border-2 border-gray-100">
                    <p className="font-semibold text-gray-900 mb-3">
                      {index + 1}. {q.text}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg text-sm border-2 ${
                            optIndex === q.correctAnswer
                              ? 'bg-green-100 border-green-300 text-green-900 font-semibold'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="font-bold mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                          {opt}
                          {optIndex === q.correctAnswer && <span className="ml-2">✅</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No questions found.</p>
            )}
          </div>

          {/* Participants List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Participants & Results</h2>
            
            {participants.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No participants yet</p>
                <p className="text-gray-400 text-sm mt-2">Share the code above to invite participants</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Rank</th>
                      <th className="text-left py-4 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Score</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Questions Answered</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .map((participant, idx) => (
                        <tr
                          key={participant.userId || idx}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="py-4 px-4">
                            {idx === 0 ? (
                              <Trophy size={24} className="text-yellow-500" />
                            ) : (
                              <span className="text-lg font-semibold text-gray-700">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            {participant.userName}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-xl font-bold text-indigo-600">
                              {participant.score || 0}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center text-gray-600">
                            {participant.answersCount || 0}/{quiz.questions?.length || 0}
                          </td>
                          <td className="py-4 px-4 text-center">
                            {quizStatus === 'waiting' ? (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Waiting
                              </span>
                            ) : quizStatus === 'active' ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                In Progress
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                Completed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAdminDashboard;
