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
  const { on, off, joinRoom, leaveRoom } = useSocket();

  const [conversations, setConversations]   = useState([]);
  const [selectedChat, setSelectedChat]     = useState(null);
  const [messages, setMessages]             = useState([]);
  const [searchQuery, setSearchQuery]       = useState('');
  const [loadingChats, setLoadingChats]     = useState(false);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);

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
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
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

    on('receive_message', handleMessage);
    on('conversation_updated', handleConversationUpdated);
    on('user_status', handleUserStatus);

    return () => {
      off('receive_message', handleMessage);
      off('conversation_updated', handleConversationUpdated);
      off('user_status', handleUserStatus);
    };
  }, [isAuthenticated, on, off]);

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

  const handleSendMessage = async (text) => {
    if (!selectedChat || !text.trim()) return;
    try {
      await chatService.sendMessage(selectedChat.id, text);
    } catch (err) {
      console.error('Failed to send message:', err);
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
      />
      <main className="chat-area">
        {selectedChat ? (
          <ChatWindow
            conversation={selectedChat}
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loadingMsgs}
            currentUserId={profile?.id}
          />
        ) : (
          <WelcomeScreen />
        )}
      </main>
    </div>
  );
}

export default App;