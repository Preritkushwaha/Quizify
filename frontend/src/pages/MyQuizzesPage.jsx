import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { quizAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Trash2, Play, Copy, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const MyQuizzesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCodes, setShowCodes] = useState({});

  useEffect(() => {
    fetchMyQuizzes();
  }, [user]);

  const fetchMyQuizzes = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await quizAPI.getUserQuizzes();
      setQuizzes(response.quizzes || []);
      if (!response.quizzes || response.quizzes.length === 0) {
        setError('No quizzes created yet. Create your first quiz!');
      }
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to load your quizzes');
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayQuiz = (quizId) => {
    navigate(`/quiz-admin-dashboard/${quizId}`);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Quiz ID copied to clipboard!');
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await quizAPI.delete(quizId);
        setQuizzes(quizzes.filter(q => q._id !== quizId));
        toast.success('Quiz deleted successfully');
      } catch (err) {
        console.error('Error deleting quiz:', err);
        toast.error('Failed to delete quiz');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">My Quizzes</h1>
            <p className="text-xl text-gray-600">
              {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} created
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your quizzes...</p>
              </div>
            </div>
          ) : error && quizzes.length === 0 ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 text-center mb-8">
              <p className="text-blue-800 text-lg mb-6">{error}</p>
              <button
                onClick={() => navigate('/manual-builder')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Create First Quiz
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group border-2 border-transparent hover:border-purple-500"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
                    <h3 className="text-xl font-bold truncate">{quiz.title}</h3>
                    <p className="text-purple-100 text-sm mt-1">
                      {quiz.questions?.length || 0} questions
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Quiz Details */}
                    <div className="space-y-3 mb-6">
                      {quiz.description && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Description</p>
                          <p className="text-gray-700 line-clamp-2">{quiz.description}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Difficulty</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                          quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                          quiz.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {quiz.difficulty}
                        </span>
                      </div>

                      {quiz.category && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Category</p>
                          <p className="text-gray-700">{quiz.category}</p>
                        </div>
                      )}
                    </div>

                    {/* Share Code Section */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-600 mb-2">Share ID</p>
                      <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2 flex-1">
                          {showCodes[quiz._id] ? (
                            <code className="font-bold text-gray-900 tracking-wider">{quiz.shareCode || 'QZ' + Math.random().toString(36).substr(2, 6).toUpperCase()}</code>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400">••••••</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowCodes({
                            ...showCodes,
                            [quiz._id]: !showCodes[quiz._id]
                          })}
                          className="text-gray-500 hover:text-gray-700 transition"
                        >
                          {showCodes[quiz._id] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <button
                          onClick={() => handleCopyCode(quiz.shareCode || 'QZ' + Math.random().toString(36).substr(2, 6).toUpperCase())}
                          className="ml-2 text-purple-600 hover:text-purple-700 transition"
                        >
                          <Copy size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Type Badge */}
                    {quiz.isAIGenerated && (
                      <div className="mb-6">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          ✨ AI Generated
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handlePlayQuiz(quiz._id)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
                      >
                        <Play size={18} />
                        Play
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Button */}
          {quizzes.length > 0 && (
            <div className="mt-12 text-center">
              <button
                onClick={() => navigate('/manual-builder')}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-2xl transition-all text-lg"
              >
                + Create New Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyQuizzesPage;
