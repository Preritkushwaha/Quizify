import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sparkles, Pencil, X, ArrowLeft, Loader, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI } from '../../services/api';

const CreateQuizModal = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState(''); // '' | 'manual' | 'ai'
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleManualBuild = () => {
    if (!user) {
      navigate('/login');
      onClose();
      return;
    }
    navigate('/manual-builder');
    onClose();
  };

  const handleAIGenerateClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/home');
    }
    onClose();
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

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Quiz</h2>

        {mode === '' ? (
          // Main selection screen
          <div className="space-y-4">
            <button
              onClick={() => setMode('ai')}
              className="w-full p-6 bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-2xl transition-all text-left group disabled:opacity-50"
              disabled={!user}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">AI Generate</h3>
                  <p className="text-white text-opacity-90 text-sm">
                    Let AI create quiz questions for you instantly based on any topic
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode('manual')}
              className="w-full p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-xl transition-all text-left group disabled:opacity-50"
              disabled={!user}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 group-hover:scale-110 transition-all">
                  <Pencil className="text-gray-700 group-hover:text-purple-600" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Manual Build</h3>
                  <p className="text-gray-600 text-sm">
                    Create custom questions with full control over content and options
                  </p>
                </div>
              </div>
            </button>

            {!user && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ Login required to create quizzes
                </p>
              </div>
            )}
          </div>
        ) : mode === 'manual' ? (
          // Manual build screen
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                You'll be taken to the quiz builder where you can add questions, options, and correct answers.
              </p>
            </div>

            <button
              onClick={handleManualBuild}
              className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
            >
              Go to Quiz Builder
            </button>
          </div>
        ) : (
          // AI generate screen
          <div className="space-y-4">
            <button
              onClick={() => setMode('')}
              className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-4 transition"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Topic *
              </label>
              <input
                type="text"
                placeholder="e.g., World War II, Biology, Python Programming"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={aiDifficulty}
                onChange={(e) => setAiDifficulty(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                disabled={loading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button
              onClick={handleAIGenerateClick}
              disabled={!aiTopic.trim() || loading}
              className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Quiz with AI
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center">
              AI will generate 10 questions based on the topic and difficulty level
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuizModal;