import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Play, X, Loader, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI } from '../../services/api';

const JoinQuizModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizId, setQuizId] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [mode, setMode] = useState(''); // '' | 'id' | 'link'

  const handleJoinByID = async () => {
    if (!quizId.trim()) {
      toast.error('Please enter a valid quiz ID or code');
      return;
    }

    setLoading(true);
    try {
      const input = quizId.trim();
      console.log('🔍 Attempting to join with input:', input);
      
      // Detect if input is a share code (short alphanumeric) or quiz ID (24-char hex)
      const isShareCode = input.length <= 10 && /^[A-Z0-9]+$/i.test(input);
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(input);
      
      console.log('📊 Input analysis - Share Code:', isShareCode, '| ObjectId:', isObjectId);
      
      let response;
      if (isShareCode) {
        console.log('📝 Using share code endpoint for:', input);
        response = await quizAPI.getByShareCode(input);
        if (response?.quiz) {
          console.log('📍 Navigating to waiting room via share code');
          navigate(`/quiz-waiting-share/${input}`);
        }
      } else if (isObjectId) {
        console.log('📝 Using quiz ID endpoint for:', input);
        response = await quizAPI.getQuiz(input);
        if (response?.quiz) {
          console.log('📍 Navigating to waiting room via quiz ID');
          navigate(`/quiz-waiting/${input}`);
        }
      } else {
        toast.error('Invalid format: Enter either a share code (e.g., MK6MY0) or quiz ID (24 characters)');
        setLoading(false);
        return;
      }
      
      console.log('✅ Quiz found:', response);
      if (response?.quiz) {
        onClose();
      } else {
        toast.error('Quiz details not found in response');
      }
    } catch (error) {
      console.error('❌ Error joining quiz:', error);
      const errorMsg = error?.message || 'Unknown error';
      toast.error(`Could not find quiz: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByLink = async () => {
    if (!shareLink.trim()) {
      toast.error('Please enter a valid share link or code');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Attempting to join quiz with link:', shareLink);
      // Extract share code from link
      let shareCode = shareLink;
      const match = shareLink.match(/\/share\/([A-Z0-9]+)$/i);
      if (match) {
        shareCode = match[1];
      }

      console.log('📝 Using share code:', shareCode);
      const response = await quizAPI.getByShareCode(shareCode);
      console.log('✅ Quiz found:', response);
      if (response?.quiz) {
        // Navigate to waiting room
        console.log('📍 Navigating to waiting room');
        navigate(`/quiz-waiting-share/${shareCode}`);
        onClose();
      } else {
        toast.error('Quiz details not found in response');
      }
    } catch (error) {
      console.error('❌ Error joining quiz:', error);
      const errorMsg = error?.message || 'Unknown error';
      toast.error(`Could not find quiz: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickJoin = async (method) => {
    if (method === 'id') {
      await handleJoinByID();
    } else if (method === 'link') {
      await handleJoinByLink();
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Join a Quiz</h2>

        {mode === '' ? (
          // Main selection screen
          <div className="space-y-4">
            <p className="text-gray-600 text-sm mb-6">
              Choose how you'd like to join a quiz
            </p>

            <button
              onClick={() => setMode('id')}
              className="w-full p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl hover:shadow-2xl transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Play size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Join by Code or ID</h3>
                  <p className="text-white text-opacity-90 text-sm">
                    Enter a share code (e.g., MK6MY0) or quiz ID to join
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('link')}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-xl transition-all text-left group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 group-hover:scale-110 transition-all">
                  <Play className="text-gray-700 group-hover:text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Join by Share Link</h3>
                  <p className="text-gray-600 text-sm">
                    Paste a quiz share link to join instantly
                  </p>
                </div>
              </div>
            </button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ You can join quizzes with or without creating an account
              </p>
            </div>
          </div>
        ) : mode === 'id' ? (
          // Join by Quiz ID
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Code or Quiz ID
            </label>
            <input
              type="text"
              placeholder="Enter code (e.g., MK6MY0) or ID (e.g., ABC123XYZ)"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-4 transition"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mb-4">
              You can enter either:
              <br />• <strong>Share Code</strong> - Short code from the quiz creator (e.g., MK6MY0)
              <br />• <strong>Quiz ID</strong> - Long ID from the admin dashboard (e.g., 696684cdf791deaa89cf58f1)
            </p>
            <button
              onClick={() => handleQuickJoin('id')}
              disabled={!quizId.trim() || loading}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Joining...
                </>
              ) : (
                'Join Quiz'
              )}
            </button>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Where to find the Quiz ID:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>✓ In the quiz invitation message</li>
                <li>✓ In the quiz details page</li>
                <li>✓ Ask the person who created the quiz</li>
              </ul>
            </div>
          </div>
        ) : (
          // Join by Share Link
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Link
            </label>
            <input
              type="text"
              placeholder="Paste the share link here"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-4 transition"
              value={shareLink}
              onChange={(e) => setShareLink(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mb-4">
              Paste the complete link shared by the quiz creator (starts with https://)
            </p>
            <button
              onClick={() => handleQuickJoin('link')}
              disabled={!shareLink.trim() || loading}
              className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Joining...
                </>
              ) : (
                'Join Quiz'
              )}
            </button>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Share link format:</h4>
              <code className="text-xs text-gray-600 bg-white p-2 rounded block overflow-auto">
                https://quizify.com/quiz/share/ABC123XYZ
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinQuizModal;
