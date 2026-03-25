import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3002';

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef                  = useRef(null);
  const joinedRoomsRef             = useRef(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(0); // Track socket instance changes


  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketId(0);
      }
      return;
    }

    // Connect with Supabase token
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Frontend] Socket connected:', socket.id);
      setIsConnected(true);
      setSocketId(prev => prev + 1); // Trigger re-registration of listeners
      // Re-join any rooms we had joined before a disconnect
      joinedRoomsRef.current.forEach((roomId) => {
        console.log('[Frontend] Re-joining room:', roomId);
        socket.emit('join_room', roomId);
      });
    });

    socket.on('pong', (data) => {
      console.log('[Frontend] Pong received from server:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, isAuthenticated]);

  // ── Emit an event ──────────────────────────────────────────
  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  // ── Listen to an event ─────────────────────────────────────
  // Include socketId in dependency to trigger re-registration when socket reconnects
  const on = useCallback((event, callback) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event, callback);
    }
  }, [socketId]);

  // ── Remove listener ────────────────────────────────────────
  const off = useCallback((event, callback) => {
    const socket = socketRef.current;
    if (socket) {
      socket.off(event, callback);
    }
  }, [socketId]);

  // ── Join a conversation room ───────────────────────────────
  const joinRoom = useCallback((conversationId) => {
    if (!conversationId) return;
    console.log('[Frontend] Joining room:', conversationId);
    joinedRoomsRef.current.add(conversationId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', conversationId);
    }
  }, []);

  // ── Leave a conversation room ──────────────────────────────
  const leaveRoom = useCallback((conversationId) => {
    if (!conversationId) return;
    joinedRoomsRef.current.delete(conversationId);
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', conversationId);
    }
  }, []);

  // ── Test ping ──────────────────────────────────────────────
  const ping = useCallback(() => {
    console.log('[Frontend] Sending ping to server');
    emit('ping', { message: 'Hello from client!', timestamp: new Date().toISOString() });
  }, [emit]);

  // ── Send a message via socket ──────────────────────────────
  const sendMessage = useCallback((conversationId, text, mediaUrl = '', mediaType = '') => {
    console.log('[Frontend] Sending message to:', conversationId, { text, mediaUrl, mediaType });
    emit('send_message', { conversationId, text, mediaUrl, mediaType });
  }, [emit]);

  // ── Typing indicator ───────────────────────────────────────
  const sendTyping = useCallback((conversationId, isTyping) => {
    emit('user_typing', { conversationId, isTyping });
  }, [emit]);

  // ── Mark messages as read ──────────────────────────────────
  const markRead = useCallback((conversationId, messageIds) => {
    emit('message_read', { conversationId, messageIds });
  }, [emit]);

  // ── Add reaction to a message ────────────────────────────────
  const addReaction = useCallback((messageId, conversationId, reaction) => {
    emit('add_reaction', { messageId, conversationId, reaction });
  }, [emit]);

  // ── Remove reaction from a message ───────────────────────────
  const removeReaction = useCallback((messageId, conversationId, reaction) => {
    emit('remove_reaction', { messageId, conversationId, reaction });
  }, [emit]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      socketId, // Expose this so components can re-register listeners
      emit,
      on,
      off,
      joinRoom,
      leaveRoom,
      sendMessage,
      sendTyping,
      markRead,
      addReaction,
      removeReaction,
      ping, // Add ping test function
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
