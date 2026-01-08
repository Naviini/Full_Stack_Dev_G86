import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import socketService from '../services/socketService';

const WebSocketStatus = () => {
  const { user, tabId } = useContext(AuthContext);
  const [connected, setConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    if (socket) {
      const handleConnect = () => {
        setConnected(true);
        setSocketId(socket.id);
      };

      const handleDisconnect = () => {
        setConnected(false);
        setSocketId(null);
      };

      if (socket.connected) {
        setConnected(true);
        setSocketId(socket.id);
      }

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);

      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, []);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg text-xs max-w-xs shadow-lg">
      <div className="font-bold mb-2">📊 Connection Status</div>
      <div className="mb-1">
        <span className="font-semibold">User:</span> {user.name || user.email}
      </div>
      <div className="mb-1">
        <span className="font-semibold">Tab ID:</span> {tabId.substring(0, 12)}...
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="font-semibold">WebSocket:</span>
        <span className={`px-2 py-1 rounded ${connected ? 'bg-green-600' : 'bg-red-600'}`}>
          {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      {socketId && (
        <div className="mt-1 text-xs text-gray-300">
          Socket: {socketId.substring(0, 8)}...
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;
