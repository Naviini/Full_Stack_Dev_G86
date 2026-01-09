import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { DarkModeContext } from '../context/DarkModeContext';
import { chatAPI, projectsAPI } from '../services/api';
import socketService from '../services/socketService';

const formatTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function Chat() {
  const { projectId: routeProjectId } = useParams();
  const { user, token } = useContext(AuthContext);
  const { isDarkMode } = useContext(DarkModeContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(routeProjectId || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editText, setEditText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const joinedProjectRef = useRef(null);

  const uniqueMessages = (list) => {
    const seen = new Set();
    return list.filter((m) => {
      const key = m?._id || m?.id || m?.createdAt;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Ensure socket connection
  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }
  }, [token]);

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await projectsAPI.getAll();
        setProjects(res.data || []);
        if (!selectedProjectId && res.data?.length) {
          setSelectedProjectId(routeProjectId || res.data[0]._id);
        }
      } catch (err) {
        setError('Failed to load projects');
      }
    };
    loadProjects();
  }, [routeProjectId]);

  // Join room, fetch messages when project changes
  useEffect(() => {
    if (!selectedProjectId) return;
    setLoading(true);
    const fetchMessages = async () => {
      try {
        const res = await chatAPI.getMessages(selectedProjectId);
        setMessages(uniqueMessages(res.data || []));
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load chat');
      } finally {
        setLoading(false);
      }
    };

    // leave previous room
    if (joinedProjectRef.current && joinedProjectRef.current !== selectedProjectId) {
      socketService.leaveProject(joinedProjectRef.current);
    }
    socketService.joinProject(selectedProjectId);
    joinedProjectRef.current = selectedProjectId;
    fetchMessages();
  }, [selectedProjectId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    const handleChatMessage = (msg) => {
      if (msg.project !== selectedProjectId) return;
      setMessages((prev) => uniqueMessages([...prev, msg]));
    };

    const handleChatUpdated = (msg) => {
      if (msg.project !== selectedProjectId) return;
      setMessages((prev) =>
        prev.map((m) => (m._id === msg._id ? { ...m, ...msg } : m))
      );
    };

    const handleChatDeleted = (msg) => {
      if (msg.project !== selectedProjectId) return;
      setMessages((prev) =>
        prev.map((m) =>
          m._id === msg._id ? { ...m, deletedAt: msg.deletedAt, text: 'This message was deleted' } : m
        )
      );
    };

    const handleTyping = (payload) => {
      if (payload?.isTyping && payload.projectId === selectedProjectId) {
        setTypingUsers((prev) => ({
          ...prev,
          [payload.userId]: { name: payload.userName, at: Date.now() },
        }));
      } else if (!payload?.isTyping && payload?.userId) {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          delete copy[payload.userId];
          return copy;
        });
      }
    };

    const handleRead = ({ messageIds, userId, readAt, projectId }) => {
      if (!messageIds || !userId || projectId !== selectedProjectId) return;
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, readBy: [...(m.readBy || []), { user: userId, readAt }] }
            : m
        )
      );
    };

    socketService.onChatMessage(handleChatMessage);
    socketService.onChatUpdated(handleChatUpdated);
    socketService.onChatDeleted(handleChatDeleted);
    socketService.onTyping(handleTyping);
    socketService.onRead(handleRead);

    return () => {
      socketService.off('chat:message', handleChatMessage);
      socketService.off('chat:updated', handleChatUpdated);
      socketService.off('chat:deleted', handleChatDeleted);
      socketService.off('chat:typing', handleTyping);
      socketService.off('chat:read', handleRead);
    };
  }, [selectedProjectId]);

  // Clear stale typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const filtered = Object.fromEntries(
          Object.entries(prev).filter(([, value]) => now - value.at < 3000)
        );
        return filtered;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !selectedProjectId) return;
    setInput('');
    try {
      const res = await chatAPI.sendMessage(selectedProjectId, { text: content });
      const msg = res.data;
      setMessages((prev) => uniqueMessages([...prev, msg]));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const startEdit = (msg) => {
    setEditingId(msg._id);
    setEditText(msg.text);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editingId || !selectedProjectId || !editText.trim()) return;
    try {
      const res = await chatAPI.updateMessage(selectedProjectId, editingId, { text: editText.trim() });
      const msg = res.data;
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, ...msg } : m)));
      setEditingId('');
      setEditText('');
      socketService.emitChatUpdate(selectedProjectId, msg._id, msg.text);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDelete = async (id) => {
    if (!id || !selectedProjectId) return;
    try {
      const res = await chatAPI.deleteMessage(selectedProjectId, id);
      const msg = res.data;
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, ...msg } : m)));
      socketService.emitChatDelete(selectedProjectId, id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  // Typing indicator emission
  useEffect(() => {
    if (!selectedProjectId) return;
    socketService.emitTyping(selectedProjectId, input.length > 0);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketService.emitTyping(selectedProjectId, false);
    }, 1200);
    return () => clearTimeout(typingTimeout.current);
  }, [input, selectedProjectId]);

  // Mark messages as read when visible
  useEffect(() => {
    if (!selectedProjectId || !user) return;
    const unread = messages
      .filter((m) => !(m.readBy || []).some((r) => r.user === user.id || r.user === user._id))
      .map((m) => m._id);
    if (unread.length > 0) {
      chatAPI.markRead(selectedProjectId, unread).catch(() => {});
      socketService.emitRead(selectedProjectId, unread);
    }
  }, [messages, selectedProjectId, user]);

  const onlineCount = Math.max(1, Math.floor(Math.random() * 5) + 3);
  const currentProject = useMemo(
    () => projects.find((p) => p._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-500 mb-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
              ← Back to dashboard
            </p>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Project Chat</h1>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              Only members of this project can participate.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={`rounded-lg px-3 py-2 text-sm border ${
                isDarkMode
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-white text-gray-800 border-gray-200'
              }`}
            >
              <option value="" disabled>Select project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <div
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'
              }`}
            >
              {onlineCount} online
            </div>
          </div>
        </div>

        {error && (
          <div className={`${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-700'} px-4 py-3 rounded-xl mb-4`}>
            {error}
          </div>
        )}

        <div className={`${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg flex flex-col h-[70vh]`}>
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} flex items-center justify-between`}>
            <div>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{currentProject?.name || 'Select a project'}</p>
              <p className="text-xs text-gray-400">Messages are synced in real-time</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading && <p className="text-sm text-gray-500">Loading messages...</p>}
            {messages.map((msg) => {
              const isMine = msg.sender?._id === user?.id || msg.sender === user?.id || msg.sender?._id === user?._id;
              const readCount = (msg.readBy || []).length;
              const isDeleted = !!msg.deletedAt;
              return (
                <div
                  key={msg._id}
                  className={`flex flex-col gap-1 max-w-3xl ${
                    isMine ? 'ml-auto items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isDarkMode ? 'bg-[#FF6523]/20 text-[#FF6523]' : 'bg-[#FF6523]/10 text-[#FF6523]'
                      }`}
                    >
                      {(msg.sender?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <p className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      {msg.sender?.name || 'User'}
                    </p>
                    <span className="text-[11px] text-gray-400">{formatTime(msg.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`rounded-xl px-4 py-3 text-sm ${
                        isMine
                          ? 'bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white shadow'
                          : isDarkMode
                            ? 'bg-gray-800 text-gray-100 border border-gray-700'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                      } ${isDeleted ? 'opacity-70 italic' : ''}`}
                    >
                      {editingId === msg._id && !isDeleted ? (
                        <form onSubmit={submitEdit} className="flex gap-2 items-center">
                          <input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="bg-white/20 border border-white/30 rounded px-2 py-1 text-sm text-white"
                            autoFocus
                          />
                          <button type="submit" className="text-xs font-semibold">Save</button>
                          <button type="button" onClick={() => { setEditingId(''); setEditText(''); }} className="text-xs">Cancel</button>
                        </form>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                    {isMine && !isDeleted && editingId !== msg._id && (
                      <div className="flex gap-2 text-xs text-gray-400">
                        <button onClick={() => startEdit(msg)} className="hover:text-[#FF6523]">Edit</button>
                        <button onClick={() => handleDelete(msg._id)} className="hover:text-red-500">Delete</button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    {msg.editedAt && !isDeleted && <span>(edited)</span>}
                    {isDeleted && <span>Deleted</span>}
                    {readCount > 1 && <span>Seen by {readCount} members</span>}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 pb-2 text-xs text-gray-400 min-h-[20px]">
            {Object.values(typingUsers).length > 0 && (
              <span>{Object.values(typingUsers).map((t) => t.name || 'Someone').join(', ')} is typing...</span>
            )}
          </div>

          <form onSubmit={handleSend} className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={selectedProjectId ? 'Type a message and press Enter...' : 'Select a project to start chatting'}
                disabled={!selectedProjectId}
                className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6523] ${
                  isDarkMode
                    ? 'bg-gray-800 text-white placeholder-gray-500 border border-gray-700'
                    : 'bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-200'
                } ${!selectedProjectId ? 'opacity-70 cursor-not-allowed' : ''}`}
              />
              <button
                type="submit"
                disabled={!selectedProjectId || !input.trim()}
                className={`px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6523] to-[#9C4CE0] text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

