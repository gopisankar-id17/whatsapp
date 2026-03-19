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

export default function MessageBubble({ message }) {
  const isMe = message.sender === 'me';
  return (
    <div className={`message-row ${isMe ? 'me' : 'them'}`}>
      <div className="message-bubble">
        <p className="message-text">{message.text}</p>
        <div className="message-meta">
          <span className="message-time">{message.time}</span>
          {isMe && <DoubleTick read={message.read} />}
        </div>
      </div>
    </div>
  );
}