import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { Trophy, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Quizzes Created</p>
              <h3 className="text-2xl font-bold text-gray-900">Wait/Check</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Participants</p>
              <h3 className="text-2xl font-bold text-gray-900">-</h3>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
              <Target size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Average Score</p>
              <h3 className="text-2xl font-bold text-gray-900">-</h3>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
            <button 
                onClick={() => navigate('/my-quizzes')}
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition"
            >
                View My Quizzes
            </button>
            <button 
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg shadow-sm border border-gray-200 hover:border-purple-300 transition"
            >
                Create New Quiz
            </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
