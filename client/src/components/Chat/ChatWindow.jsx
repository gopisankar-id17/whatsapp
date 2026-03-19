import React, { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ conversation, messages, onSendMessage, currentUserId, typingUser, onTyping, loading }) {
  const bottomRef = useRef(null);
  const isLoading = loading && messages.length === 0;
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const other = conversation.conversation_participants?.find(
    (p) => `${p.user_id}` !== `${currentUserId}`
  );
  const otherProfile = other?.profiles;
  const otherName = otherProfile?.name || conversation.name || 'Unknown';
  const otherAvatar = otherProfile?.avatar_url;
  const otherOnline = otherProfile?.is_online;
  const otherLastSeen = otherProfile?.last_seen;

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button
          type="button"
          className="avatar-button"
          onClick={() => setShowProfile(true)}
          aria-label="View profile"
        >
          <div
            className="avatar avatar-colors-0"
            style={{
              width: 40,
              height: 40,
              fontSize: 13,
              backgroundImage: otherAvatar ? `url(${otherAvatar})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!otherAvatar && (otherName?.[0]?.toUpperCase() || 'U')}
          </div>
        </button>
        <div className="chat-header-info">
          <div className="chat-header-name">{otherName}</div>
          <div className={`chat-header-status ${typingUser ? 'online' : otherOnline ? 'online' : ''}`}>
            {typingUser ? `${typingUser.name || 'Someone'} is typing…` : otherOnline ? 'online' : 'last seen recently'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" style={{ color: 'var(--wa-text-muted)' }} title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <button className="icon-btn" style={{ color: 'var(--wa-text-muted)' }} title="Menu">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {isLoading ? (
          <div className="messages-loading">
            <div className="loading-spinner" />
            <span>Loading messages...</span>
          </div>
        ) : (
          <>
            <div className="date-divider">
              <span>Today</span>
            </div>
            {messages.length === 0 ? (
              <div className="messages-loading">
                <span>No messages yet</span>
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
              ))
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} disabled={loading} />

      {/* Recipient Profile */}
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