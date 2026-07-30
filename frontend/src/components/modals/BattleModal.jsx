import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Zap, Play, X, ArrowLeft, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI, battleAPI } from '../../services/api';

const BattleModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState(''); // '' | 'create' | 'join'
  const [battleId, setBattleId] = useState('');
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

  const handleCreateBattle = async () => {
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
      console.log('🚀 Creating battle for quiz:', selectedQuiz._id);
      const response = await battleAPI.create({
        quizId: selectedQuiz._id,
      });
      
      console.log('✅ Battle created:', response);
      toast.success('Battle created! Code: ' + response.battle.battleCode);
      
      // Copy battle code to clipboard
      navigator.clipboard.writeText(response.battle.battleCode);
      toast.success('Battle code copied to clipboard!');
      
      console.log('📋 Navigating to battle:', response.battle.id);
      onClose();
      // Navigate after closing modal
      setTimeout(() => {
        navigate(`/battle/${response.battle.id}`);
      }, 300);
    } catch (err) {
      console.error('❌ Error creating battle:', err);
      toast.error(err.message || 'Failed to create battle');
      setLoading(false);
    }
  };

  const handleJoinBattle = async () => {
    if (!battleId.trim()) {
      toast.error('Please enter a valid battle code');
      return;
    }

    setLoading(true);
    try {
      const response = await battleAPI.join(battleId.trim());
      toast.success('Joined battle successfully!');
      navigate(`/battle/${response.battle._id}`);
      onClose();
    } catch (err) {
      console.error('Error joining battle:', err);
      toast.error(err.message || 'Failed to join battle');
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Real-Time Battle</h2>
        
        {mode === '' ? (
          // Main selection screen
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full p-6 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:shadow-2xl transition-all text-left group disabled:opacity-50"
              disabled={!user}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Create Battle</h3>
                  <p className="text-white text-opacity-90 text-sm">
                    Select from your quizzes and start a battle
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-red-500 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 group-hover:scale-110 transition-all">
                  <Play className="text-gray-700 group-hover:text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Join Battle</h3>
                  <p className="text-gray-600 text-sm">
                    Enter a battle code to join an existing battle
                  </p>
                </div>
              </div>
            </button>

            {!user && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Login required to create battles. You can join battles without logging in!
                </p>
              </div>
            )}
          </div>
        ) : mode === 'create' ? (
          // Create battle - quiz selection
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Quiz</h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin text-red-600" size={32} />
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => navigate('/manual-builder')}
                  className="mt-3 w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                  Create a New Quiz
                </button>
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
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 bg-white hover:border-red-400'
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
                          <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateBattle}
                  disabled={!selectedQuiz || loading}
                  className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? 'Creating...' : 'Create Battle'}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You haven't created any quizzes yet.</p>
                <button
                  onClick={() => navigate('/manual-builder')}
                  className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                >
                  Create Your First Quiz
                </button>
              </div>
            )}
          </div>
        ) : (
          // Join battle - ID input
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Battle Code
            </label>
            <input
              type="text"
              placeholder="Enter battle code (e.g., BT123456)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none mb-4 transition"
              value={battleId}
              onChange={(e) => setBattleId(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <button
              onClick={handleJoinBattle}
              disabled={!battleId.trim() || loading}
              className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Joining...
                </>
              ) : (
                'Join Battle'
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              You can join battles without logging in
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BattleModal;