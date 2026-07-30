import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogIn, Sparkles, ChevronDown, LogOut, Settings } from 'lucide-react';
import EditProfileModal from './modals/EditProfileModal';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="text-white" size={24} />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Quizify
              </span>
            </div>

            {/* Nav Buttons */}
            <div className="flex items-center gap-4">

              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/my-quizzes')}
                    className="px-4 py-2.5 text-gray-700 hover:text-purple-600 font-medium transition-colors rounded-lg hover:bg-purple-50"
                  >
                    My Quizzes
                  </button>

                  {/* Profile Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowProfileMenu(!showProfileMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="text-white" size={16} />
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => {
                            setShowEditModal(true);
                            setShowProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 font-medium transition flex items-center gap-2 border-b border-gray-200"
                        >
                          <Settings size={18} />
                          Edit Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 font-medium transition flex items-center gap-2"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-6 py-2.5 border-2 border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors"
                >
                  <LogIn size={20} />
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
};

export default Navbar;