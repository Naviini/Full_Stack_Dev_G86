import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function InviteMembersModal({ projectId, isOpen, onClose, onMemberAdded }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'editor',
    message: '',
  });
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetchInvitations();
    }
  }, [isOpen, projectId]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/invitations/project/${projectId}/invitations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvitations(response.data);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/invitations/project/${projectId}/invite`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Invitation sent successfully!');
      setFormData({ email: '', role: 'editor', message: '' });
      
      if (onMemberAdded) {
        onMemberAdded();
      }
      
      // Refresh invitations list
      fetchInvitations();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/invitations/invitations/${invitationId}/resend`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Invitation resent successfully!');
      fetchInvitations();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      try {
        await axios.post(
          `${API_BASE_URL}/invitations/invitations/${invitationId}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Invitation cancelled!');
        fetchInvitations();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to cancel invitation');
      }
    }
  };

  if (!isOpen) return null;

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Invite Team Members</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700 font-semibold">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700 font-semibold">Success</p>
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Invite Form */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Invitation</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="member@example.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors"
                >
                  <option value="viewer">Viewer (View only)</option>
                  <option value="editor">Editor (Can edit tasks)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Viewers can only view the project. Editors can create and edit tasks. Admins have full project access.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Add a personal message to the invitation..."
                  rows="3"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-600 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                {loading ? 'Sending...' : '✉️ Send Invitation'}
              </button>
            </form>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pending Invitations</h3>
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{invitation.invitedEmail}</p>
                      <p className="text-sm text-gray-600">
                        Role: <span className="font-semibold capitalize">{invitation.role}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Sent by {invitation.inviter?.name} on{' '}
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        ⏱️ Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResendInvitation(invitation._id)}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => handleCancelInvitation(invitation._id)}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Invitations (Current Members) */}
          {acceptedInvitations.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Accepted Members</h3>
              <div className="space-y-3">
                {acceptedInvitations.map((invitation) => (
                  <div
                    key={invitation._id}
                    className="bg-green-50 border-2 border-green-200 rounded-lg p-4"
                  >
                    <p className="font-semibold text-gray-900">
                      {invitation.invitedUser?.name || invitation.invitedEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      Email: {invitation.invitedEmail}
                    </p>
                    <p className="text-sm text-gray-600">
                      Role: <span className="font-semibold capitalize">{invitation.role}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ✓ Accepted on {new Date(invitation.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invitations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No invitations yet</p>
              <p className="text-gray-400 text-sm">Start by inviting team members above</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
