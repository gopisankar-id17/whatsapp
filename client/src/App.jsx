// client/src/App.jsx  (FULL UPDATED FILE)

import React, { useState, useEffect } from 'react';
import { useAuth }   from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import Sidebar       from './components/Sidebar/Sidebar';
import ChatWindow    from './components/Chat/ChatWindow';
import WelcomeScreen from './components/Chat/WelcomeScreen';
import Login         from './components/Auth/Login';
import CallUI        from './components/Call/CallUI';
import { chatService } from './services/chatService';
import './styles/global.css';

function App() {
  const { isAuthenticated, profile, loading } = useAuth();
  const { on, off, joinRoom, leaveRoom, sendMessage, sendTyping, markRead, addReaction, removeReaction, isConnected, socketId, ping } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [archivedChats, setArchivedChats] = useState([]);
  const [selectedChat,  setSelectedChat]  = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [loadingChats,  setLoadingChats]  = useState(false);
  const [loadingMsgs,   setLoadingMsgs]   = useState(false);
  const [typingUser,    setTypingUser]    = useState(null);

  // ── Load conversations when authenticated ───────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    } else {
      setConversations([]);
      setSelectedChat(null);
      setMessages([]);
    }
  }, [isAuthenticated]);

  // ── Rejoin room when socket reconnects ─────────────────────────────────
  useEffect(() => {
    if (isConnected && selectedChat?.id) {
      joinRoom(selectedChat.id);
    }
  }, [isConnected, selectedChat?.id, joinRoom]);

  // ── Socket listeners ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !isConnected) return;

    const handleMessage = (message) => {
      console.log('[Frontend] Received message:', message);
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
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
          setTypingUser((cur) => (cur?.userId === userId ? null : cur));
        }, 3000);
      } else {
        setTypingUser((cur) => (cur?.userId === userId ? null : cur));
      }
    };

    const handleConversationUpdated = ({ conversationId, lastMessage, lastMessageAt, unreadCount }) => {
      console.log('[Frontend] Conversation updated:', { conversationId, lastMessage, unreadCount });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                last_message_at: lastMessageAt,
                messages: [lastMessage],
                unread_count: unreadCount !== undefined ? unreadCount : c.unread_count
              }
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
      if (selectedChat && conversationId === selectedChat.id) {
        setMessages((prev) =>
          prev.map((m) => (messageIds.includes(m.id) ? { ...m, status: 'read' } : m))
        );
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          if (c.messages?.length > 0) {
            return { ...c, messages: c.messages.map((m) => messageIds.includes(m.id) ? { ...m, status: 'read' } : m) };
          }
          return c;
        })
      );
    };

    const handleReactionAdded = ({ messageId, userId, userName, reaction }) => {
      if (selectedChat) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            const existing = m.message_reactions || [];
            return {
              ...m,
              message_reactions: [...existing, { message_id: messageId, user_id: userId, reaction, profiles: { name: userName } }],
            };
          })
        );
      }
    };

    const handleReactionRemoved = ({ messageId, userId, reaction }) => {
      if (selectedChat) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              message_reactions: (m.message_reactions || []).filter(
                (r) => !(r.user_id === userId && r.reaction === reaction)
              ),
            };
          })
        );
      }
    };

    const handleLinkPreviewsAdded = ({ messageId, linkPreviews }) => {
      if (selectedChat) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              link_previews: linkPreviews,
            };
          })
        );
      }
    };

    // ── Conversation invitation events ───────────────────────────────
    const handleConversationInvitation = ({ conversation, from, message }) => {
      console.log('[Frontend] Received conversation invitation:', { conversation, from, message });

      // Add the new conversation to the list
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversation.id);
        if (existing) return prev;
        return [conversation, ...prev];
      });

      // Show notification to user (you can enhance this with a toast/notification system)
      console.log(`💬 New conversation invitation from ${from.name}: ${message}`);
    };

    const handleConversationAccepted = ({ conversationId, acceptedBy, message }) => {
      console.log('[Frontend] Conversation accepted:', { conversationId, acceptedBy, message });

      // Update the conversation status
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                conversation_participants: c.conversation_participants?.map((p) =>
                  p.user_id === acceptedBy.id ? { ...p, status: 'accepted' } : p
                )
              }
            : c
        )
      );

      if (selectedChat?.id === conversationId) {
        setSelectedChat((prev) =>
          prev ? { 
            ...prev, 
            conversation_participants: prev.conversation_participants?.map((p) => 
              p.user_id === acceptedBy.id ? { ...p, status: 'accepted' } : p
            ) 
          } : prev
        );
      }

      // Show success notification
      console.log(`✅ ${acceptedBy.name} accepted your conversation invitation`);
    };

    const handleConversationDeclined = ({ conversationId, declinedBy, message }) => {
      console.log('[Frontend] Conversation declined:', { conversationId, declinedBy, message });

      // Remove the conversation from the list since it was declined
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // Clear selected chat if it was the declined one
      if (selectedChat?.id === conversationId) {
        setSelectedChat(null);
        setMessages([]);
      }

      // Show notification
      console.log(`❌ ${declinedBy.name} declined your conversation invitation`);
    };

    const handleConversationCreatedByMe = ({ conversation, message }) => {
      console.log('[Frontend] My conversation created:', { conversation, message });

      // Add the conversation to my list immediately (for sender)
      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversation.id);
        if (existing) return prev;
        return [conversation, ...prev];
      });

      // Auto-select the conversation so user can start typing immediately
      setSelectedChat(conversation);
      setMessages([]);
      joinRoom(conversation.id);

      console.log(`✅ ${message}`);
    };

    on('receive_message',        handleMessage);
    on('conversation_updated',   handleConversationUpdated);
    on('user_status',            handleUserStatus);
    on('messages_read',          handleMessagesRead);
    on('user_typing',            handleUserTyping);
    on('profile_updated',        handleProfileUpdated);
    on('reaction_added',         handleReactionAdded);
    on('reaction_removed',       handleReactionRemoved);
    on('link_previews_added',    handleLinkPreviewsAdded);
    on('conversation_invitation', handleConversationInvitation);
    on('conversation_accepted',  handleConversationAccepted);
    on('conversation_declined',  handleConversationDeclined);
    on('conversation_created_by_me', handleConversationCreatedByMe);

    return () => {
      off('receive_message',       handleMessage);
      off('conversation_updated',  handleConversationUpdated);
      off('user_status',           handleUserStatus);
      off('messages_read',         handleMessagesRead);
      off('user_typing',           handleUserTyping);
      off('profile_updated',       handleProfileUpdated);
      off('reaction_added',        handleReactionAdded);
      off('reaction_removed',      handleReactionRemoved);
      off('link_previews_added',   handleLinkPreviewsAdded);
      off('conversation_invitation', handleConversationInvitation);
      off('conversation_accepted',   handleConversationAccepted);
      off('conversation_declined',   handleConversationDeclined);
      off('conversation_created_by_me', handleConversationCreatedByMe);
    };
  }, [isAuthenticated, isConnected, socketId, on, off, selectedChat, profile?.id]);

  // ── Fetch conversations ─────────────────────────────────────────────────
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

  // ── Select a chat ───────────────────────────────────────────────────────
  const handleSelectChat = async (conv) => {
    if (!conv?.id) return;
    if (selectedChat?.id === conv.id) return;
    if (selectedChat) leaveRoom(selectedChat.id);
    setSelectedChat(conv);
    setMessages([]);
    setTypingUser(null);
    joinRoom(conv.id);

    // Mark conversation as read and reset unread count
    try {
      await chatService.markConversationAsRead(conv.id);
      setConversations((prev) =>
        prev.map((c) => c.id === conv.id ? { ...c, unread_count: 0 } : c)
      );
    } catch (err) {
      console.error('Failed to mark conversation as read:', err);
    }

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

  // ── Start a new conversation ────────────────────────────────────────────
  const handleStartConversation = async (user) => {
    if (!user?.id) return;
    try {
      setLoadingChats(true);
      // Just call the API - the real-time socket events will handle UI updates
      await chatService.createConversation(user.id);
      // The handleConversationCreatedByMe socket event will:
      // 1. Add conversation to the list
      // 2. Auto-select the conversation
      // 3. Join the room
      console.log(`[Frontend] Invitation sent to ${user.name}`);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  // ── Send a message ──────────────────────────────────────────────────────
  const handleSendMessage = async (text, mediaUrl = '', mediaType = '') => {
    if (!selectedChat) return;
    if (!text?.trim() && !mediaUrl) return;
    const tempId  = `temp-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender_id:  profile?.id,
      text:       text?.trim() || '',
      media_url:  mediaUrl || '',
      media_type: mediaType || '',
      created_at: new Date().toISOString(),
      status:     'sending',
    };
    setMessages((prev) => [...prev, tempMsg]);
    try {
      sendMessage && sendMessage(selectedChat.id, text?.trim() || '', mediaUrl, mediaType);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // ── Invite actions ──────────────────────────────────────────────────────
  const handleAcceptInvite = async (conversationId) => {
    try {
      await chatService.acceptInvite(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, conversation_participants: c.conversation_participants?.map((p) => p.user_id === profile?.id ? { ...p, status: 'accepted' } : p) }
            : c
        )
      );
      if (selectedChat?.id === conversationId) {
        setSelectedChat((prev) =>
          prev ? { ...prev, conversation_participants: prev.conversation_participants?.map((p) => p.user_id === profile?.id ? { ...p, status: 'accepted' } : p) } : prev
        );
      }
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleDeclineInvite = async (conversationId) => {
    try {
      await chatService.declineInvite(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedChat?.id === conversationId) { setSelectedChat(null); setMessages([]); }
    } catch (err) {
      console.error('Failed to decline invite:', err);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!conversationId) return;
    try {
      await chatService.deleteConversation(conversationId);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedChat?.id === conversationId) { setSelectedChat(null); setMessages([]); }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // ── Archive conversation ───────────────────────────────────────────────────
  const handleArchiveConversation = (conversationId) => {
    if (!conversationId) return;
    const chatToArchive = conversations.find((c) => c.id === conversationId);
    if (chatToArchive) {
      setArchivedChats((prev) => [chatToArchive, ...prev]);
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (selectedChat?.id === conversationId) { setSelectedChat(null); setMessages([]); }
    }
  };

  // ── Unarchive conversation ─────────────────────────────────────────────────
  const handleUnarchiveConversation = (conversationId) => {
    if (!conversationId) return;
    const chatToUnarchive = archivedChats.find((c) => c.id === conversationId);
    if (chatToUnarchive) {
      setConversations((prev) => [chatToUnarchive, ...prev]);
      setArchivedChats((prev) => prev.filter((c) => c.id !== conversationId));
    }
  };

  // ── Clear messages (keep conversation) ─────────────────────────────────────
  const handleClearMessages = async (conversationId) => {
    if (!conversationId) return;
    if (!window.confirm('Clear all messages in this chat? The conversation will remain.')) return;
    try {
      // Clear messages locally (backend would need clearMessages endpoint)
      setMessages([]);
    } catch (err) {
      console.error('Failed to clear messages:', err);
    }
  };

  // ── Mark messages read ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedChat || !messages.length || !profile?.id) return;
    const unreadIds = messages
      .filter((m) => m.sender_id !== profile.id && m.status !== 'read')
      .map((m) => m.id);
    if (!unreadIds.length) return;
    setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, status: 'read' } : m)));
    markRead(selectedChat.id, unreadIds);
  }, [selectedChat, messages, profile?.id, markRead]);

  // ── Filter conversations by search ─────────────────────────────────────
  const filteredConversations = conversations.filter((c) => {
    const other = c.conversation_participants?.find((p) => p.user_id !== profile?.id);
    return other?.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // ── Loading / auth screens ──────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', fontSize: '16px', color: '#667781' }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  // ── Main app ────────────────────────────────────────────────────────────
  return (
    <CallProvider>
      {/* Global call overlay — renders on top of everything when a call is active */}
      <CallUI />

      <div className="app-container">
        <Sidebar
          conversations={filteredConversations}
          archivedChats={archivedChats}
          selectedChat={selectedChat}
          onSelectChat={handleSelectChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          loading={loadingChats}
          currentUserId={profile?.id}
          onStartConversation={handleStartConversation}
          onArchiveChat={handleArchiveConversation}
          onUnarchiveChat={handleUnarchiveConversation}
          onDeleteChat={handleDeleteConversation}
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
              onTyping={(isTyping) => { if (selectedChat) sendTyping(selectedChat.id, isTyping); }}
              onAcceptInvite={handleAcceptInvite}
              onDeclineInvite={handleDeclineInvite}
              onDeleteConversation={handleDeleteConversation}
              onClearMessages={handleClearMessages}
              onAddReaction={addReaction}
              onRemoveReaction={removeReaction}
            />
          ) : (
            <WelcomeScreen />
          )}
        </main>
      </div>
    </CallProvider>
  );
}

export default App;