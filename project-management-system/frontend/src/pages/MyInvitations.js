import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function MyInvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/invitations/my-invitations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInvitations(response.data);
    } catch (err) {
      setError('Failed to load invitations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      setError('');
      const response = await axios.post(
        `${API_BASE_URL}/invitations/invitations/${invitationId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Invitation accepted! You are now part of the project.');
      setInvitations(
        invitations.map(inv =>
          inv._id === invitationId ? { ...inv, status: 'accepted' } : inv
        )
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleReject = async (invitationId) => {
    if (!window.confirm('Are you sure you want to reject this invitation?')) {
      return;
    }

    try {
      setError('');
      await axios.post(
        `${API_BASE_URL}/invitations/invitations/${invitationId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Invitation rejected');
      setInvitations(
        invitations.map(inv =>
          inv._id === invitationId ? { ...inv, status: 'rejected' } : inv
        )
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading invitations...</p>
        </div>
      </div>
    );
  }

  const filteredInvitations = invitations.filter(inv => inv.status === filterStatus);
  const statusCounts = {
    pending: invitations.filter(inv => inv.status === 'pending').length,
    accepted: invitations.filter(inv => inv.status === 'accepted').length,
    rejected: invitations.filter(inv => inv.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Invitations</h1>
          <p className="text-gray-600 text-lg">
            Manage your project invitations and join new projects
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">Error</p>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-700 font-semibold">Success</p>
            <p className="text-green-600">{success}</p>
          </div>
        )}

        {/* Status Filter Tabs */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-6 py-3 font-bold rounded-lg transition-all ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-yellow-500'
            }`}
          >
            ⏳ Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('accepted')}
            className={`px-6 py-3 font-bold rounded-lg transition-all ${
              filterStatus === 'accepted'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-500'
            }`}
          >
            ✓ Accepted ({statusCounts.accepted})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-6 py-3 font-bold rounded-lg transition-all ${
              filterStatus === 'rejected'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-500'
            }`}
          >
            ✕ Rejected ({statusCounts.rejected})
          </button>
        </div>

        {/* Invitations List */}
        {filteredInvitations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">
              {filterStatus === 'pending' ? '📭' : filterStatus === 'accepted' ? '📫' : '🚫'}
            </div>
            <p className="text-gray-600 text-lg font-semibold">
              {filterStatus === 'pending'
                ? 'No pending invitations'
                : filterStatus === 'accepted'
                ? 'No accepted invitations'
                : 'No rejected invitations'}
            </p>
            {filterStatus === 'pending' && (
              <p className="text-gray-500 mt-2">
                You'll see project invitations here when team leaders invite you
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <div
                key={invitation._id}
                className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                  filterStatus === 'pending'
                    ? 'border-yellow-500'
                    : filterStatus === 'accepted'
                    ? 'border-green-500'
                    : 'border-red-500'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Project Info */}
                  <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {invitation.project?.name}
                    </h3>
                    {invitation.project?.description && (
                      <p className="text-gray-600 mb-4">
                        {invitation.project.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 items-center">
                      <div>
                        <p className="text-sm text-gray-500">From</p>
                        <p className="font-semibold text-gray-900">
                          {invitation.inviter?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {invitation.inviter?.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className={`font-bold px-3 py-1 rounded text-sm capitalize ${
                          invitation.role === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : invitation.role === 'editor'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {invitation.role}
                        </p>
                      </div>

                      {invitation.status === 'pending' && (
                        <div>
                          <p className="text-sm text-gray-500">Expires</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>

                    {invitation.message && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 mb-1">Message from inviter:</p>
                        <p className="text-gray-700">{invitation.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 justify-center">
                    {filterStatus === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAccept(invitation._id)}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => handleReject(invitation._id)}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
                        >
                          ✕ Reject
                        </button>
                      </>
                    )}

                    {filterStatus === 'accepted' && (
                      <button
                        onClick={() => {
                          // Could navigate to project here
                          window.location.href = `/projects/${invitation.project._id}`;
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
                      >
                        Open Project →
                      </button>
                    )}

                    <p className="text-xs text-gray-500 text-center">
                      {invitation.status === 'pending'
                        ? `Sent ${new Date(invitation.createdAt).toLocaleDateString()}`
                        : `${invitation.status === 'accepted' ? 'Accepted' : 'Rejected'} ${new Date(invitation.respondedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
