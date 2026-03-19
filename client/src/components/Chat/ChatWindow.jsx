import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

export default function ChatWindow({ conversation, messages, onSendMessage, currentUserId, typingUser, onTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const other = conversation.conversation_participants?.find(
    (p) => p.user_id !== currentUserId
  );
  const otherName = other?.profiles?.name || conversation.name || 'Unknown';
  const otherAvatar = other?.profiles?.avatar_url;
  const otherOnline = other?.profiles?.is_online;

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div
          className={`avatar avatar-colors-0`}
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
        <div className="date-divider">
          <span>Today</span>
        </div>
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={onSendMessage} onTyping={onTyping} />
    </div>
  );
}