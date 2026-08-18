import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { Users, Clock, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI } from '../services/api';

const QuizParticipantWaitingRoom = () => {
  const { quizId, shareCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socketObj = useSocket();
  const socket = socketObj.socket;

  const [quiz, setQuiz] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [quizStatus, setQuizStatus] = useState('waiting');
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);

  // Load quiz data
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        console.log('[WAITING_ROOM] Loading quiz - quizId:', quizId, 'shareCode:', shareCode);
        let quizData;
        if (shareCode) {
          console.log('[WAITING_ROOM] Fetching quiz by share code:', shareCode);
          const response = await quizAPI.getByShareCode(shareCode);
          quizData = response.quiz;
        } else if (quizId) {
          console.log('[WAITING_ROOM] Fetching quiz by ID:', quizId);
          const response = await quizAPI.getQuiz(quizId);
          quizData = response.quiz;
        }

        if (!quizData) {
          console.error('[WAITING_ROOM] No quiz data received');
          setLoading(false);
          return;
        }

        console.log('[WAITING_ROOM] Quiz loaded:', quizData._id, quizData.title);
        setQuiz(quizData);
        setQuizStatus(quizData.status);
        setLoading(false);

        // Join the quiz via socket
        if (socket && quizData) {
          const guestName = sessionStorage.getItem('guestQuizName');
          const userName = guestName || user?.displayName || user?.email?.split('@')[0];
          
          if (!userName) {
            console.log('[WAITING_ROOM] No username or guest name found, redirecting to quick join');
            toast.error('Please enter your name to join');
            navigate(shareCode ? `/join/${shareCode}` : '/');
            return;
          }

          console.log('[WAITING_ROOM] Emitting join-quiz for quizId:', quizData._id);
          socketObj.emit('join-quiz', {
            quizId: quizData._id,
            userName,
            userId: user?.uid
          });
          setJoined(true);
        } else {
          console.warn('[WAITING_ROOM] Socket not ready or quizData missing');
        }
      } catch (error) {
        console.error('[WAITING_ROOM] Error loading quiz:', error);
        toast.error('Failed to load quiz data');
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, shareCode, socket, user]);

  // Socket events
  useEffect(() => {
    if (!socket) {
      console.warn('[WAITING_ROOM] Socket not available');
      return;
    }

    console.log('[WAITING_ROOM] Setting up socket event listeners');

    const offJoin = socketObj.on('join-success', (data) => {
      console.log('[WAITING_ROOM] Successfully joined quiz:', data);
      toast.success('You have joined the quiz!');
      
      // If quiz is already active when we join, navigate immediately
      if (data.quizStatus === 'active') {
        console.log('[WAITING_ROOM] Quiz already active! Navigating...');
        const navigationId = data.quizId || quizId || quiz?._id;
        console.log('[WAITING_ROOM] Using quiz ID for navigation:', navigationId);
        if (!navigationId) {
          console.error('[WAITING_ROOM] ERROR: No quiz ID available for navigation!');
          toast.error('Cannot start quiz: Missing quiz ID');
          return;
        }
        setTimeout(() => {
          navigate(`/quiz-play/${navigationId}`);
        }, 500);
      }
    });

    const offParticipants = socketObj.on('participants-update', (data) => {
      console.log('[WAITING_ROOM] Participants updated:', data);
      if (data.participants) {
        setParticipants(data.participants);
      }
      if (data.quizStatus) {
        setQuizStatus(data.quizStatus);
        // If quiz becomes active, navigate to quiz play
        if (data.quizStatus === 'active') {
          console.log('[WAITING_ROOM] Quiz status changed to active! Navigating...');
          const navigationId = data.quizId || quizId || quiz?._id;
          console.log('[WAITING_ROOM] Using quiz ID for navigation:', navigationId);
          if (!navigationId) {
            console.error('[WAITING_ROOM] ERROR: No quiz ID available for navigation!');
            toast.error('Cannot start quiz: Missing quiz ID');
            return;
          }
          setTimeout(() => {
            navigate(`/quiz-play/${navigationId}`);
          }, 500);
        }
      }
    });

    const offStart = socketObj.on('quiz-started', (data) => {
      console.log('[WAITING_ROOM] Quiz started!', data);
      setQuizStatus('active');
      // Navigate to quiz play page after a short delay
      const navigationId = data.quizId || quizId || quiz?._id;
      console.log('[WAITING_ROOM] Using quiz ID for navigation:', navigationId);
      if (!navigationId) {
        console.error('[WAITING_ROOM] ERROR: No quiz ID available for navigation!');
        toast.error('Cannot start quiz: Missing quiz ID');
        return;
      }
      setTimeout(() => {
        navigate(`/quiz-play/${navigationId}`);
      }, 1000);
    });

    const offError = socketObj.on('error', (error) => {
      console.error('[WAITING_ROOM] Socket error:', error);
      toast.error(error.message || 'An error occurred');
    });

    return () => {
      offJoin();
      offParticipants();
      offStart();
      offError();
    };
  }, [socket, quizId, quiz]);

  const handleLeaveQuiz = () => {
    navigate('/');
    toast.info('You have left the quiz');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
          <p className="text-gray-600">{quiz.description}</p>
          <div className="mt-4 inline-block px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800">
            ⏳ Waiting for admin to start...
          </div>
        </div>

        {/* Quiz Info Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Questions</p>
            <p className="text-2xl font-bold text-indigo-600">{quiz.questions?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Difficulty</p>
            <p className="text-2xl font-bold text-indigo-600">{quiz.difficulty}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-gray-600 text-sm mb-1">Participants</p>
            <p className="text-2xl font-bold text-indigo-600">{participants.length}</p>
          </div>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Users size={24} className="text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Participants in Waiting Room</h2>
          </div>

          {participants.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-pulse mb-4">
                  <Users size={48} className="text-gray-300 mx-auto" />
                </div>
                <p className="text-gray-600 text-lg">Waiting for other participants to join...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {participants.map((participant, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-4 border-2 border-indigo-200 hover:border-indigo-400 transition"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                      {participant.userName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{participant.userName}</p>
                      <p className="text-xs text-gray-500">Ready</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-900 mb-2">📌 Instructions</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Wait here until the quiz admin starts the quiz</li>
              <li>✓ Once the quiz starts, you'll be able to answer questions</li>
              <li>✓ Each question has a time limit as shown on your screen</li>
              <li>✓ Results will be shown after all participants complete or time runs out</li>
            </ul>
          </div>
        </div>

        {/* Leave Button */}
        <div className="flex gap-4">
          <button
            onClick={handleLeaveQuiz}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            <LogOut size={18} /> Leave Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizParticipantWaitingRoom;
