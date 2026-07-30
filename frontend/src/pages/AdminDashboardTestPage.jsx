import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const AdminDashboardTestPage = () => {
  const navigate = useNavigate();

  const testQuizzes = [
    { id: '6923581df060510e05764f5f', title: 'DSA Quiz' },
    { id: '69235850f060510e05764f61', title: 'Javascript interview based questions Quiz' },
    { id: '69235b0a0f644e915297231e', title: 'Javascript interview questions Quiz' },
    { id: '69235ba0ec89a9b605c3bd20', title: 'Javascript interview questions Quiz' },
    { id: '692367082af46847df1a7964', title: 'What is AI Quiz' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="pt-20 pb-12 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard Test</h1>
          <p className="text-gray-600 mb-6">Click on a quiz to open its admin dashboard:</p>
          
          <div className="space-y-3">
            {testQuizzes.map((quiz) => (
              <button
                key={quiz.id}
                onClick={() => navigate(`/quiz-admin-dashboard/${quiz.id}`)}
                className="w-full p-4 bg-white rounded-lg shadow hover:shadow-lg transition text-left"
              >
                <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{quiz.id}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardTestPage;
