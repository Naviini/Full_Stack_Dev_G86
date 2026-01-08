import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import socketService from '../services/socketService';

const RealtimeCollaboration = ({ projectId }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [taskUpdates, setTaskUpdates] = useState([]);

  useEffect(() => {
    if (!projectId) return;

    // Join project room
    socketService.joinProject(projectId);

    // Listen for task updates
    const handleTaskUpdate = (data) => {
      setTaskUpdates((prev) => [data, ...prev].slice(0, 10)); // Keep last 10 updates
      console.log('Task updated:', data);
    };

    // Listen for new messages
    const handleNewMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    // Listen for user joined
    const handleUserJoined = (data) => {
      setActiveUsers((prev) => [...new Set([...prev, data.userId])]);
    };

    // Listen for user left
    const handleUserLeft = (data) => {
      setActiveUsers((prev) => prev.filter((id) => id !== data.userId));
    };

    socketService.onTaskUpdate(handleTaskUpdate);
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);

    return () => {
      socketService.leaveProject(projectId);
      socketService.off('task-update-notification', handleTaskUpdate);
      socketService.off('new-message', handleNewMessage);
      socketService.off('user-joined', handleUserJoined);
      socketService.off('user-left', handleUserLeft);
    };
  }, [projectId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketService.sendCollaborationMessage(projectId, newMessage);
      setNewMessage('');
    }
  };

  return (
    <div className="realtime-collaboration p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">Real-time Collaboration</h3>

      {/* Active Users */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Active Users ({activeUsers.length})</h4>
        <div className="flex gap-2">
          {activeUsers.map((userId) => (
            <span
              key={userId}
              className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
            >
              User {userId}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Messages</h4>
        <div className="border rounded p-2 h-48 overflow-y-auto bg-gray-50 mb-2">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className="mb-2 text-sm">
                <strong>User {msg.userId}:</strong> {msg.message}
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>

      {/* Task Updates */}
      <div>
        <h4 className="font-semibold mb-2">Recent Updates</h4>
        <div className="border rounded p-2 h-32 overflow-y-auto bg-gray-50">
          {taskUpdates.length === 0 ? (
            <p className="text-gray-500">No updates yet</p>
          ) : (
            taskUpdates.map((update, idx) => (
              <div key={idx} className="mb-2 text-sm">
                <strong>User {update.updatedBy}</strong> updated task {update.taskId}
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(update.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeCollaboration;
