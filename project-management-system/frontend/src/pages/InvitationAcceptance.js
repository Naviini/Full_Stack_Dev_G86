import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationsAPI } from '../services/api';
import Navbar from '../components/Navbar';

export default function InvitationAcceptance() {
  const { invitationId, token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState(null);

  useEffect(() => {
    acceptInvitation();
  }, [invitationId, token]);

  const acceptInvitation = async () => {
    try {
      setLoading(true);
      
      // Call the accept invitation API
      const response = await invitationsAPI.acceptInvitation(invitationId);
      
      setInvitation(response.data);
      setMessage('✅ Invitation accepted successfully! You are now a member of the project.');
      
      // Redirect to project after 2 seconds
      setTimeout(() => {
        if (response.data?.project?._id) {
          navigate(`/projects/${response.data.project._id}`);
        } else {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.response?.data?.message || 'Failed to accept invitation. The invitation may have expired or is invalid.');
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              {loading ? (
                <div className="animate-spin">
                  <span className="text-4xl">⏳</span>
                </div>
              ) : error ? (
                <span className="text-4xl">❌</span>
              ) : (
                <span className="text-4xl">✅</span>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {loading ? 'Processing Invitation...' : error ? 'Invitation Failed' : 'Welcome!'}
          </h1>

          {loading && (
            <p className="text-gray-600 text-lg">
              Accepting your invitation to the project...
            </p>
          )}

          {message && !loading && (
            <div className="space-y-4">
              <p className="text-gray-600 text-lg">{message}</p>
              {invitation && (
                <div className="bg-indigo-50 rounded-lg p-4 text-left">
                  <p className="text-sm text-gray-700">
                    <strong>Project:</strong> {invitation.project?.name || 'Project'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Role:</strong> {invitation.role}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500">
                Redirecting to project in 2 seconds...
              </p>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Go to Dashboard
              </button>
              <p className="text-sm text-gray-500">
                Please contact the project owner to resend the invitation.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
