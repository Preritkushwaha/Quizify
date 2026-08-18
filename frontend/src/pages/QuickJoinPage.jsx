import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Play } from 'lucide-react';

const QuickJoinPage = () => {
  const { shareCode } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const response = await quizAPI.getByShareCode(shareCode);
        if (response && response.quiz) {
          setQuiz(response.quiz);
        } else {
          setError('Quiz not found. Please check the link.');
        }
      } catch (err) {
        console.error('Error fetching quiz by share code:', err);
        setError('Quiz not found or link has expired.');
      } finally {
        setLoading(false);
      }
    };
    if (shareCode) {
      fetchQuiz();
    }
  }, [shareCode]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    setJoining(true);
    // Save the guest name to sessionStorage so the waiting room can use it
    sessionStorage.setItem('guestQuizName', name.trim());
    
    // Redirect to the waiting room
    navigate(`/quiz-waiting-share/${shareCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Quiz</h1>
          <p className="text-gray-600 font-medium">{quiz.title}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold">
              {quiz.questions?.length || 0} Questions
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold">
              {quiz.difficulty}
            </span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name to join..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-600 focus:ring-2 focus:ring-purple-200 outline-none transition"
              autoFocus
              maxLength={30}
              required
            />
          </div>

          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {joining ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Join Now
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuickJoinPage;
