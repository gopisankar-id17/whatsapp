import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/Chat/ChatWindow';
import WelcomeScreen from './components/Chat/WelcomeScreen';
import Login from './components/Auth/Login';
import { chatService } from './services/chatService';
import './styles/global.css';

function App() {
  const { isAuthenticated, profile, loading } = useAuth();
  const { on, off, joinRoom, leaveRoom, sendMessage, sendTyping, markRead } = useSocket();

  const [conversations, setConversations]   = useState([]);
  const [selectedChat, setSelectedChat]     = useState(null);
  const [messages, setMessages]             = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [loadingChats, setLoadingChats]     = useState(false);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [typingUser, setTypingUser]         = useState(null);

  // ── Load conversations when authenticated ──────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      setConversations([]);
      setSelectedChat(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // ── Socket listeners ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleMessage = (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;

        // Remove matching optimistic temp
        const cleaned = prev.filter(
          (m) => !(m.id?.toString().startsWith('temp-') && m.sender_id === message.sender_id && m.text === message.text)
        );
        const next = [...cleaned, message];
        return next.sort((a, b) => new Date(a.created_at || a.time) - new Date(b.created_at || b.time));
      });
    };

    const handleUserTyping = ({ conversationId, userId, name, isTyping }) => {
      if (!selectedChat || conversationId !== selectedChat.id) return;
      if (userId === profile?.id) return;
      if (isTyping) {
        setTypingUser({ userId, name });
        setTimeout(() => {
          setTypingUser((current) => (current?.userId === userId ? null : current));
        }, 3000);
      } else {
        setTypingUser((current) => (current?.userId === userId ? null : current));
      }
    };

    const handleConversationUpdated = ({ conversationId, lastMessage, lastMessageAt }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, last_message_at: lastMessageAt, messages: [lastMessage] }
            : c
        )
      );
    };

    const handleUserStatus = ({ userId, isOnline, lastSeen }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          conversation_participants: c.conversation_participants?.map((p) =>
            p.user_id === userId
              ? { ...p, profiles: { ...p.profiles, is_online: isOnline, last_seen: lastSeen } }
              : p
          ),
        }))
      );
    };

    const handleProfileUpdated = ({ userId, name, avatar_url }) => {
      setConversations((prev) =>
        prev.map((c) => ({
          ...c,
          conversation_participants: c.conversation_participants?.map((p) =>
            p.user_id === userId
              ? { ...p, profiles: { ...p.profiles, name: name || p.profiles?.name, avatar_url: avatar_url ?? p.profiles?.avatar_url } }
              : p
          ),
        }))
      );
    };

    const handleMessagesRead = ({ conversationId, messageIds }) => {
      // Update open chat messages
      if (selectedChat && conversationId === selectedChat.id) {
        setMessages((prev) =>
          prev.map((m) => (messageIds.includes(m.id) ? { ...m, status: 'read' } : m))
        );
      }
      // Update last message status in conversations list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          if (c.messages && c.messages.length > 0) {
            const updatedMessages = c.messages.map((m) =>
              messageIds.includes(m.id) ? { ...m, status: 'read' } : m
            );
            return { ...c, messages: updatedMessages };
          }
          return c;
        })
      );
    };

    on('receive_message', handleMessage);
    on('conversation_updated', handleConversationUpdated);
    on('user_status', handleUserStatus);
    on('messages_read', handleMessagesRead);
    on('user_typing', handleUserTyping);
    on('profile_updated', handleProfileUpdated);

    return () => {
      off('receive_message', handleMessage);
      off('conversation_updated', handleConversationUpdated);
      off('user_status', handleUserStatus);
      off('messages_read', handleMessagesRead);
      off('user_typing', handleUserTyping);
      off('profile_updated', handleProfileUpdated);
    };
  }, [isAuthenticated, on, off, selectedChat, profile?.id]);

  const fetchConversations = async () => {
    try {
      setLoadingChats(true);
      const { data } = await chatService.getConversations();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSelectChat = async (conv) => {
    if (selectedChat) leaveRoom(selectedChat.id);
    setSelectedChat(conv);
    setMessages([]);
    setTypingUser(null);
    joinRoom(conv.id);
    try {
      setLoadingMsgs(true);
      const { data } = await chatService.getMessages(conv.id);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const handleStartConversation = async (user) => {
    if (!user?.id) return;
    try {
      setLoadingChats(true);
      const { data } = await chatService.createConversation(user.id);
      const conv = data.conversation;

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conv.id);
        if (existing) {
          return [conv, ...prev.filter((c) => c.id !== conv.id)];
        }
        return [conv, ...prev];
      });

      await handleSelectChat(conv);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedChat || !text.trim()) return;

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id: profile?.id,
      text: text.trim(),
      created_at: new Date().toISOString(),
      status: 'sending',
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      // Use socket for low-latency send; server persists and broadcasts
      if (typeof selectedChat.id !== 'undefined') {
        // eslint-disable-next-line no-unused-expressions
        sendMessage && sendMessage(selectedChat.id, text.trim());
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const other = c.conversation_participants?.find(
      (p) => p.user_id !== profile?.id
    );
    return other?.profiles?.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // ── Mark messages as read when viewing ─────────────────────
  useEffect(() => {
    if (!selectedChat || !messages.length || !profile?.id) return;
    const unreadIds = messages
      .filter((m) => m.sender_id !== profile.id && m.status !== 'read')
      .map((m) => m.id);
    if (unreadIds.length === 0) return;

    // Optimistically mark as read locally
    setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, status: 'read' } : m)));
    markRead(selectedChat.id, unreadIds);
  }, [selectedChat, messages, profile?.id, markRead]);

  // Show loading spinner
  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f0f2f5', fontSize: '16px', color: '#667781'
      }}>
        Loading...
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Show main WhatsApp UI
  return (
    <div className="app-container">
      <Sidebar
        conversations={filteredConversations}
        selectedChat={selectedChat}
        onSelectChat={handleSelectChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loadingChats}
        currentUserId={profile?.id}
        onStartConversation={handleStartConversation}
      />
      <main className="chat-area">
        {selectedChat ? (
          <ChatWindow
            conversation={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loadingMsgs}
            currentUserId={profile?.id}
            typingUser={typingUser}
            onTyping={(isTyping) => {
              if (!selectedChat) return;
              sendTyping(selectedChat.id, isTyping);
            }}
          />
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  );
}

export default App;