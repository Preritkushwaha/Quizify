import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { User, Mail, Plus } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      <div className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {user.name ? user.name.charAt(0).toUpperCase() : <User size={40} />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h2>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Mail size={16} /> {user.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 pt-8">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Gender</label>
                <div className="font-semibold text-gray-900">{user.gender || 'Not specified'}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Age</label>
                <div className="font-semibold text-gray-900">{user.age || 'Not specified'}</div>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Studying In</label>
                <div className="font-semibold text-gray-900">{user.studyingIn || 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
