import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export default function ProjectMembersManager({ projectId, members, owner, onMembersUpdate }) {
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (members && members.length > 0) {
      setMembersList(members);
    }
  }, [members]);

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(
        `${API_BASE_URL}/invitations/project/${projectId}/members/${userId}/remove`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Member removed successfully');
      setMembersList(membersList.filter(m => m.user._id !== userId));
      
      if (onMembersUpdate) {
        onMembersUpdate();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    setLoading(true);
    setError('');

    try {
      await axios.put(
        `${API_BASE_URL}/invitations/project/${projectId}/members/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Member role updated successfully');
      setMembersList(
        membersList.map(m =>
          m.user._id === userId ? { ...m, role: newRole } : m
        )
      );

      if (onMembersUpdate) {
        onMembersUpdate();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const isCurrentUserOwner = owner._id === currentUser.id;
  const isCurrentUserAdmin = membersList.some(
    m => m.user._id === currentUser.id && m.role === 'admin'
  );

  const canManageMembers = isCurrentUserOwner || isCurrentUserAdmin;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Team Members</h3>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {membersList.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No team members yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {membersList.map((member) => {
            const isOwner = owner._id === member.user._id;
            const isCurrentMember = currentUser.id === member.user._id;

            return (
              <div
                key={member.user._id}
                className={`p-4 rounded-lg border-2 ${
                  isOwner
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200'
                } flex justify-between items-center`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {member.user.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                        {member.user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900">
                        {member.user.name}
                        {isOwner && (
                          <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded">
                            Owner
                          </span>
                        )}
                        {isCurrentMember && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">{member.user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isOwner && canManageMembers && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.user._id, e.target.value)}
                        disabled={loading || isCurrentMember}
                        className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-indigo-600 capitalize font-semibold disabled:opacity-50"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>

                      <button
                        onClick={() => handleRemoveMember(member.user._id)}
                        disabled={loading || isCurrentMember}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </>
                  )}

                  {(isOwner || !canManageMembers) && (
                    <span
                      className={`px-3 py-2 rounded-lg font-semibold capitalize ${
                        member.role === 'admin'
                          ? 'bg-red-100 text-red-800'
                          : member.role === 'editor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {member.role}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-6 pt-4 border-t border-gray-200">
        <strong>Role Permissions:</strong>
        <br />
        • <strong>Viewer:</strong> Can view project and tasks only
        <br />
        • <strong>Editor:</strong> Can create and edit tasks
        <br />
        • <strong>Admin:</strong> Full project access including member management
      </p>
    </div>
  );
}
