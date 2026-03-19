import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const socketRef                  = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef               = useRef({});

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Connect with Supabase token
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
    });

    return () => {
      socketRef.current?.disconnect();
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
  const on = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
  }, []);

  // ── Remove listener ────────────────────────────────────────
  const off = useCallback((event, callback) => {
    socketRef.current?.off(event, callback);
  }, []);

  // ── Join a conversation room ───────────────────────────────
  const joinRoom = useCallback((conversationId) => {
    emit('join_room', conversationId);
  }, [emit]);

  // ── Leave a conversation room ──────────────────────────────
  const leaveRoom = useCallback((conversationId) => {
    emit('leave_room', conversationId);
  }, [emit]);

  // ── Send a message via socket ──────────────────────────────
  const sendMessage = useCallback((conversationId, text, mediaUrl = '', mediaType = '') => {
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

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      emit,
      on,
      off,
      joinRoom,
      leaveRoom,
      sendMessage,
      sendTyping,
      markRead,
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