import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';
import { DarkModeContext } from '../context/DarkModeContext';
import { AuthContext } from '../context/AuthContext';

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useContext(DarkModeContext);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          department: userData.department || '',
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      
      if (user) {
        await usersAPI.update(user.id, formData);
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }

      // In a real app, you'd send this to the backend
      // For now, just show a success message
      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to change password');
    }
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Settings</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manage your profile and preferences</p>
          </div>
          <button
            onClick={handleLogout}
            className={`inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-lg shadow transition-colors ${
              isDarkMode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            🚪 Logout
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className={`mb-6 border-l-4 border-red-500 p-4 rounded ${isDarkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-700'}`}>
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className={`mb-6 border-l-4 border-green-500 p-4 rounded ${isDarkMode ? 'bg-green-900/20 text-green-200' : 'bg-green-50 text-green-700'}`}>
            <p className="font-semibold">Success</p>
            <p>{success}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-t-2xl shadow-lg mb-0 border-b`}>
          <div className="flex gap-4 px-6 py-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'profile'
                  ? isDarkMode ? 'bg-[#FF6523] text-white' : 'bg-indigo-600 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👤 Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'password'
                  ? isDarkMode ? 'bg-[#FF6523] text-white' : 'bg-indigo-600 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔒 Password
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 font-semibold rounded-t-lg transition-colors ${
                activeTab === 'preferences'
                  ? isDarkMode ? 'bg-[#FF6523] text-white' : 'bg-indigo-600 text-white'
                  : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⚙️ Preferences
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} rounded-b-2xl shadow-lg p-8 border-t`}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                      placeholder="Enter your phone"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                      placeholder="Enter your department"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={fetchUserProfile}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-500 mt-1">Min 6 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600"
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Preferences</h2>
              <div className="space-y-6 max-w-2xl">
                {/* Notification Preferences */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border-2`}>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 rounded"
                      />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Email notifications for project updates</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 rounded"
                      />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Email notifications for task assignments</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        className="w-4 h-4 rounded"
                      />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Weekly digest email</span>
                    </label>
                  </div>
                </div>

                {/* Theme Preferences */}
                <div className={`${isDarkMode ? 'bg-gradient-to-br from-[#FF6523]/20 to-[#9C4CE0]/20 border-[#FF6523]/40' : 'bg-gradient-to-br from-[#FF6523]/10 to-[#9C4CE0]/10 border-[#FF6523]/20'} rounded-lg p-6 border-2`}>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>🎨 Dark Mode</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>Enable Dark Mode</p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Switch between light and dark theme</p>
                    </div>
                    <button
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-10 w-16 items-center rounded-full transition-all shadow-lg ${
                        isDarkMode ? 'bg-[#FF6523]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
                          isDarkMode ? 'translate-x-8' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className={`mt-4 p-3 ${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-white/50 text-gray-700'} rounded-lg text-sm`}>
                    {isDarkMode ? '🌙 Dark mode is currently enabled' : '☀️ Light mode is currently enabled'}
                  </div>
                </div>

                {/* Privacy */}
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-lg p-6 border-2`}>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Privacy</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 rounded"
                      />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Make my profile visible to other team members</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-4 h-4 rounded"
                      />
                      <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Allow others to see my activity</span>
                    </label>
                  </div>
                </div>

                <button
                  className={`px-6 py-3 ${isDarkMode ? 'bg-[#FF6523] hover:bg-[#FF6523]/90' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold rounded-lg transition-colors`}
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
