import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Trophy, Play, X, ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { challengeAPI, quizAPI } from '../../services/api';

const Challenge1v1Modal = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState(''); // '' | 'create' | 'join'
  const [challengeId, setChallengeId] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [userQuizzes, setUserQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch user's quizzes when create mode is accessed
  useEffect(() => {
    if (mode === 'create' && user) {
      fetchUserQuizzes();
    }
  }, [mode, user]);

  const fetchUserQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await quizAPI.getUserQuizzes();
      setUserQuizzes(response.quizzes || []);
      if (!response.quizzes || response.quizzes.length === 0) {
        setError('No quizzes found. Create a quiz first!');
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load your quizzes');
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) {
      navigate('/login');
      onClose();
      return;
    }

    if (!selectedQuiz) {
      toast.error('Please select a quiz');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Creating challenge for quiz:', selectedQuiz._id);
      const response = await challengeAPI.create({
        quizId: selectedQuiz._id,
      });
      
      console.log('✅ Challenge created:', response);
      toast.success('Challenge created! Code: ' + response.challenge.challengeCode);
      
      // Copy challenge code to clipboard
      navigator.clipboard.writeText(response.challenge.challengeCode);
      toast.success('Challenge code copied to clipboard!');
      
      console.log('📋 Navigating to challenge:', response.challenge.id);
      onClose();
      // Navigate after closing modal
      setTimeout(() => {
        navigate(`/challenge/${response.challenge.id}`);
      }, 300);
    } catch (err) {
      console.error('❌ Error creating challenge:', err);
      toast.error(err.message || 'Failed to create challenge');
      setLoading(false);
    }
  };

  const handleJoinChallenge = async () => {
    if (!challengeId.trim()) {
      toast.error('Please enter a valid challenge code');
      return;
    }

    setLoading(true);
    try {
      const response = await challengeAPI.join(challengeId.trim());
      toast.success('Joined challenge successfully!');
      navigate(`/challenge/${response.challenge._id}`);
      onClose();
    } catch (err) {
      console.error('Error joining challenge:', err);
      toast.error(err.message || 'Failed to join challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">1v1 Challenge</h2>

        {mode === '' ? (
          // Main selection screen
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-2xl transition-all text-left group disabled:opacity-50"
              disabled={!user}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Trophy size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Create Challenge</h3>
                  <p className="text-white text-opacity-90 text-sm">
                    Select a quiz and challenge a friend
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                  <Play className="text-gray-700 group-hover:text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Join Challenge</h3>
                  <p className="text-gray-600 text-sm">
                    Enter a challenge code to accept a challenge
                  </p>
                </div>
              </div>
            </button>

            {!user && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Login required to create challenges. You can join without logging in!
                </p>
              </div>
            )}
          </div>
        ) : mode === 'create' ? (
          // Create challenge - quiz selection
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Quiz</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin text-blue-600" size={32} />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ) : userQuizzes.length > 0 ? (
              <>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {userQuizzes.map((quiz) => (
                    <button
                      key={quiz._id}
                      onClick={() => setSelectedQuiz(quiz)}
                      className={`w-full p-4 rounded-lg border-2 transition text-left ${
                        selectedQuiz?._id === quiz._id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{quiz.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {quiz.questions?.length || 0} questions
                          </p>
                        </div>
                        {selectedQuiz?._id === quiz._id && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateChallenge}
                  disabled={!selectedQuiz || loading}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? 'Creating...' : 'Create Challenge'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No quizzes found</p>
              </div>
            )}
          </div>
        ) : (
          // Join challenge - ID input
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Challenge Code
            </label>
            <input
              type="text"
              placeholder="Enter challenge code (e.g., CH123456)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 transition"
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <button
              onClick={handleJoinChallenge}
              disabled={!challengeId.trim() || loading}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Joining...
                </>
              ) : (
                'Join Challenge'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Challenge1v1Modal;