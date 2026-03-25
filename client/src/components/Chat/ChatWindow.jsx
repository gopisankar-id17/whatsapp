// client/src/components/Chat/ChatWindow.jsx  (FULL UPDATED FILE)

import React, { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput  from './MessageInput';
import CallButton    from '../Call/CallButton';

export default function ChatWindow({
  conversation,
  messages,
  onSendMessage,
  currentUserId,
  typingUser,
  onTyping,
  loading,
  onAcceptInvite,
  onDeclineInvite,
  onDeleteConversation,
  onClearMessages,
  onAddReaction,
  onRemoveReaction,
}) {
  const bottomRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isLoading = loading && messages.length === 0;
  const [showProfile, setShowProfile] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollBtn) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBtn]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBtn(false);
  };

  // Context menu handler
  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  const other = conversation.conversation_participants?.find(
    (p) => `${p.user_id}` !== `${currentUserId}`
  );
  const otherProfile = other?.profiles;
  const myParticipant = conversation.conversation_participants?.find(
    (p) => `${p.user_id}` === `${currentUserId}`
  );
  const myStatus            = myParticipant?.status || 'accepted';
  const otherStatus         = other?.status         || 'accepted';
  const invitePendingForMe    = myStatus    === 'pending';
  const invitePendingForOther = otherStatus === 'pending';
  // Only disable input if I have a pending invitation (need to accept first)
  // Sender can message immediately even if recipient hasn't accepted yet
  const inputDisabled = loading || invitePendingForMe;

  const otherName     = otherProfile?.name       || conversation.name || 'Unknown';
  const otherAvatar   = otherProfile?.avatar_url;
  const otherOnline   = otherProfile?.is_online;
  const otherLastSeen = otherProfile?.last_seen;

  // Build the target user object for CallButton
  const callTarget = {
    id:         other?.user_id,
    name:       otherName,
    avatar_url: otherAvatar || null,
  };

  return (
    <div className="chat-window">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="chat-header">
        {/* Avatar */}
        <button
          type="button"
          className="avatar-button"
          onClick={() => setShowProfile(true)}
          aria-label="View profile"
        >
          <div
            className="avatar avatar-colors-0"
            style={{
              width: 40, height: 40, fontSize: 13,
              backgroundImage:    otherAvatar ? `url(${otherAvatar})` : undefined,
              backgroundSize:     'cover',
              backgroundPosition: 'center',
            }}
          >
            {!otherAvatar && (otherName?.[0]?.toUpperCase() || 'U')}
          </div>
        </button>

        {/* Name / status */}
        <div className="chat-header-info">
          <div className="chat-header-name">{otherName}</div>
          <div className={`chat-header-status ${typingUser || otherOnline ? 'online' : ''}`}>
            {typingUser
              ? `${typingUser.name || 'Someone'} is typing…`
              : otherOnline
                ? 'online'
                : 'last seen recently'}
          </div>
        </div>


      </div>

      {/* ── Invite Banner ───────────────────────────────────────────────────── */}
      {invitePendingForMe && (
        <div className="invite-banner">
          <div className="invite-text">{otherName} wants to chat with you.</div>
          <div className="invite-actions">
            <button className="outline-btn"  onClick={() => onDeclineInvite?.(conversation.id)}>Decline</button>
            <button className="primary-btn"  onClick={() => onAcceptInvite?.(conversation.id)}>Accept</button>
          </div>
        </div>
      )}
      {invitePendingForOther && (
        <div className="invite-banner">
          <div className="invite-text">Invite sent. Waiting for {otherName} to accept.</div>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {isLoading ? (
          <div className="messages-loading">
            <div className="loading-spinner" />
            <span>Loading messages...</span>
          </div>
        ) : (
          <>
            {/* Encryption Banner */}
            <div className="encryption-banner">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a2 2 0 0 0-2 2v4H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V3a2 2 0 0 0-2-2zm3 6H5V3a3 3 0 1 1 6 0v4z"/>
              </svg>
              Messages are end-to-end encrypted. No one outside of this chat can read them.
            </div>
            <div className="date-divider"><span>Today</span></div>
            {messages.length === 0 ? (
              <div className="messages-loading"><span>No messages yet</span></div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={currentUserId}
                  conversationId={conversation.id}
                  onContextMenu={(e) => handleContextMenu(e, msg)}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                />
              ))
            )}
            {/* Typing Indicator */}
            {typingUser && (
              <div className="typing-indicator">
                <div className="typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollBtn && (
        <button
          className="scroll-to-bottom-btn"
          onClick={scrollToBottom}
          title="Scroll to bottom"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="context-menu-backdrop" onClick={closeContextMenu} />
          <div
            className="message-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button className="context-menu-item" onClick={() => { navigator.clipboard.writeText(contextMenu.message.text); closeContextMenu(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            </button>
            <button className="context-menu-item" onClick={closeContextMenu}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 10 4 15 9 20"/>
                <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
              </svg>
              Reply
            </button>
            <button className="context-menu-item" onClick={closeContextMenu}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11"/>
              </svg>
              Forward
            </button>
            {contextMenu.message.sender_id === currentUserId && (
              <button className="context-menu-item danger" onClick={closeContextMenu}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} disabled={inputDisabled} />

      {/* ── Profile Modal ────────────────────────────────────────────────────── */}
      {showProfile && (
        <>
          <div className="modal-backdrop" onClick={() => setShowProfile(false)} />
          <div className="modal-card">
            <div className="modal-header">
              <h3>Profile</h3>
              <button className="icon-btn" style={{ color: '#667781' }} onClick={() => setShowProfile(false)}>
                ✕
              </button>
            </div>
            <div className="profile-avatar-block">
              <div
                className="profile-avatar"
                style={{ backgroundImage: otherAvatar ? `url(${otherAvatar})` : 'none' }}
              >
                {!otherAvatar && (otherName?.[0]?.toUpperCase() || 'U')}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--wa-text-primary)' }}>{otherName}</div>
                <div style={{ fontSize: 13, color: 'var(--wa-text-muted)', marginTop: 2 }}>
                  {otherOnline
                    ? 'online'
                    : otherLastSeen
                      ? `last seen ${new Date(otherLastSeen).toLocaleString()}`
                      : 'last seen recently'}
                </div>
              </div>
            </div>
            <div className="modal-body">
              <div>
                <div className="field-label">About</div>
                <div style={{ fontSize: 14, color: 'var(--wa-text-secondary)' }}>
                  {otherProfile?.about || 'Hey there! I am using WhatsApp.'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}