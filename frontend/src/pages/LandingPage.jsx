import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogIn, Play, Sparkles, Trophy, Users, Zap, BookOpen, Pencil, List } from 'lucide-react';
import Navbar from '../components/Navbar';
import JoinQuizModal from '../components/modals/JoinQuizModal';
import CreateQuizModal from '../components/modals/CreateQuizModal';
import Challenge1v1Modal from '../components/modals/Challenge1v1Modal';
import BattleModal from '../components/modals/BattleModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateQuizModal, setShowCreateQuizModal] = useState(false);
  const [show1v1Modal, setShow1v1Modal] = useState(false);
  const [showBattleModal, setShowBattleModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                AI-Powered Quiz Platform
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Create Amazing Quizzes
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                in Seconds
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Generate AI-powered quizzes instantly, compete with friends in real-time battles, 
              and track your progress with advanced analytics.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowCreateQuizModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-2xl transition-all text-lg flex items-center gap-2"
              >
                <Sparkles size={24} />
                Get Started Free
              </button>
              
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-8 py-4 bg-white text-gray-800 font-semibold rounded-xl hover:shadow-xl transition-all text-lg border-2 border-gray-200 flex items-center gap-2"
              >
                <Play size={24} />
                Join a Quiz
              </button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-24">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg">
              Everything you need to create, share, and compete
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Create Quiz Feature */}
              <div 
                onClick={() => setShowCreateQuizModal(true)}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-purple-500 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Create Quiz</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Build quizzes manually or use AI to generate questions instantly
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    AI Generate
                  </span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    Manual Build
                  </span>
                </div>
              </div>

              {/* 1v1 Challenge Feature */}
              <div 
                onClick={() => setShow1v1Modal(true)}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-blue-500 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">1v1 Challenge</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Challenge a friend to a head-to-head quiz battle
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    Create Challenge
                  </span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                    Join Challenge
                  </span>
                </div>
              </div>

              {/* Real-Time Battle Feature */}
              <div 
                onClick={() => setShowBattleModal(true)}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-red-500 group"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Real-Time Battle</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Compete with multiple players in live quiz battles
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                    Create Battle
                  </span>
                  <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                    Join Battle
                  </span>
                </div>
              </div>

              {/* AI-Powered Feature - REPLACED WITH MY QUIZZES */}
              <div 
                onClick={() => user ? navigate('/my-quizzes') : setShowCreateQuizModal(true)}
                className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all text-white cursor-pointer group"
              >
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <List className="text-white" size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">My Quizzes</h3>
                <p className="text-white text-opacity-90 text-sm mb-4">
                  View all your created quizzes and share them with friends
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                    View All
                  </span>
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium">
                    Share
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-24 bg-white rounded-3xl shadow-xl p-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  10,000+
                </div>
                <div className="text-gray-600 font-medium">Quizzes Generated</div>
              </div>
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  50,000+
                </div>
                <div className="text-gray-600 font-medium">Players Worldwide</div>
              </div>
              <div>
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  99.9%
                </div>
                <div className="text-gray-600 font-medium">Uptime</div>
              </div>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Sparkles className="text-purple-600 mb-4" size={32} />
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Generation</h3>
              <p className="text-gray-600">Create quizzes instantly with advanced AI technology</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Users className="text-blue-600 mb-4" size={32} />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Multiplayer</h3>
              <p className="text-gray-600">Real-time competition with friends and players worldwide</p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <Trophy className="text-yellow-600 mb-4" size={32} />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Anti-Cheating</h3>
              <p className="text-gray-600">Fair play with intelligent cheating detection system</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold">Quizify</span>
          </div>
          <p className="text-gray-400">AI-Powered Quiz Platform for Education and Fun</p>
          <p className="text-gray-500 text-sm mt-4">© 2024 Quizify. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      {showJoinModal && <JoinQuizModal onClose={() => setShowJoinModal(false)} />}
      {showCreateQuizModal && <CreateQuizModal onClose={() => setShowCreateQuizModal(false)} />}
      {show1v1Modal && <Challenge1v1Modal onClose={() => setShow1v1Modal(false)} />}
      {showBattleModal && <BattleModal onClose={() => setShowBattleModal(false)} />}
    </div>
  );
};

export default LandingPage;