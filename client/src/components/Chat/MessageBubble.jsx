import React from 'react';

function DoubleTick({ read }) {
  return (
    <span className={`read-tick ${read ? '' : 'unread'}`}>
      <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
        <path d="M11.07.57L5.43 6.21 3.24 4.02 2 5.26l3.43 3.43 6.9-6.9L11.07.57zM14.59.57l-5.64 5.64-.77-.77-1.24 1.24 2.01 2.01 6.9-6.9L14.59.57z"/>
      </svg>
    </span>
  );
}

const formatTime = (ts) => {
  if (!ts) return '';
  const date = new Date(ts);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function MessageBubble({ message, currentUserId, onContextMenu }) {
  const senderId = message.sender_id || message.senderId;
  const isMe = message.sender === 'me' || senderId === currentUserId;
  const isRead = message.status === 'read';
  return (
    <div className={`message-row ${isMe ? 'me' : 'them'}`} onContextMenu={onContextMenu}>
      <div className="message-bubble">
        <span className="message-text">{message.text || ''}</span>
        <span className="message-meta">
          <span className="message-time">{formatTime(message.created_at || message.time)}</span>
          {isMe && <DoubleTick read={isRead} />}
        </span>
      </div>
    </div>
  );
}