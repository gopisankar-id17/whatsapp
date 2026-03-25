import React from 'react';
import ChatItem from './ChatItem';

export default function ChatList({ conversations, selectedChat, onSelectChat, currentUserId, onArchive, onDelete }) {
  if (conversations.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--wa-text-muted)', fontSize: '14px' }}>
        No conversations found
      </div>
    );
  }
  return (
    <div className="chat-list">
      {conversations.map((conv, idx) => (
        <ChatItem
          key={conv.id}
          conversation={conv}
          colorIndex={idx % 7}
          isActive={selectedChat?.id === conv.id}
          onClick={() => onSelectChat(conv)}
          currentUserId={currentUserId}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}