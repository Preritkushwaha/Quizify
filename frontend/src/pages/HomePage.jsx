import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Wand2, Loader, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { quizAPI } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast.error('Please enter a quiz topic');
      return;
    }

    setLoading(true);
    try {
      const response = await quizAPI.generateAI({
        topic: aiTopic,
        difficulty: aiDifficulty,
        numberOfQuestions: 10
      });
      
      if (!response || !response.quiz || !response.quiz._id) {
        toast.error('Invalid response from server. Please try again.');
        setLoading(false);
        return;
      }
      
      toast.success('AI Quiz generated successfully!');
      setTimeout(() => {
        navigate(`/quiz-admin-dashboard/${response.quiz._id}`);
      }, 500);
    } catch (err) {
      toast.error(err.message || 'Failed to generate AI quiz.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
               <Sparkles size={28} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Generate AI Quiz</h1>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Topic *
              </label>
              <input
                type="text"
                placeholder="e.g., World War II, Biology, React Hooks"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition"
                disabled={loading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <button
              onClick={handleAIGenerate}
              disabled={!aiTopic.trim() || loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  Generate Quiz Instantly
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
