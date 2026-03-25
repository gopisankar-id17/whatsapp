import React from 'react';
import ReplyPreview from './ReplyPreview';
import MessageReactions from './MessageReactions';
import LinkPreview from './LinkPreview';

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

function MediaRenderer({ mediaUrl, mediaType }) {
  if (!mediaUrl) return null;

  if (mediaType?.startsWith('image/')) {
    return (
      <img
        src={mediaUrl}
        alt=""
        className="message-media"
        style={{ maxWidth: '100%', borderRadius: '7.5px', marginBottom: '4px' }}
      />
    );
  }

  if (mediaType?.startsWith('video/')) {
    return (
      <video
        src={mediaUrl}
        controls
        className="message-media"
        style={{ maxWidth: '100%', borderRadius: '7.5px', marginBottom: '4px' }}
      />
    );
  }

  if (mediaType?.startsWith('audio/')) {
    return (
      <audio
        src={mediaUrl}
        controls
        className="message-media-audio"
        style={{ width: '100%', marginBottom: '4px' }}
      />
    );
  }

  // Generic file download link
  const fileName = mediaUrl.split('/').pop() || 'File';
  return (
    <a
      href={mediaUrl}
      download
      className="message-file-link"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: '7.5px',
        marginBottom: '4px',
        textDecoration: 'none',
        color: 'var(--wa-text-primary)',
      }}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px' }}>
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span style={{ fontSize: '13px' }}>{fileName}</span>
    </a>
  );
}

export default function MessageBubble({ message, currentUserId, onContextMenu, onAddReaction, onRemoveReaction, conversationId }) {
  const senderId = message.sender_id || message.senderId;
  const isMe = message.sender === 'me' || senderId === currentUserId;
  const isRead = message.status === 'read';

  const repliedMessage = message.replied_to_message;
  const repliedProfile = message.replied_to_message?.profiles;

  return (
    <div className={`message-row ${isMe ? 'me' : 'them'}`} onContextMenu={onContextMenu}>
      <div className="message-bubble">
        {repliedMessage && (
          <ReplyPreview
            message={repliedMessage}
            senderName={repliedProfile?.name}
          />
        )}
        <MediaRenderer mediaUrl={message.media_url} mediaType={message.media_type} />
        {message.text && <span className="message-text">{message.text}</span>}
        {message.link_previews && message.link_previews.length > 0 && (
          <div className="link-previews-container">
            {message.link_previews.map((preview) => (
              <LinkPreview key={preview.url} preview={preview} />
            ))}
          </div>
        )}
        <span className="message-meta">
          <span className="message-time">{formatTime(message.created_at || message.time)}</span>
          {isMe && <DoubleTick read={isRead} />}
        </span>
      </div>
      {message.message_reactions && message.message_reactions.length > 0 && (
        <MessageReactions
          reactions={message.message_reactions}
          messageId={message.id}
          conversationId={conversationId}
          currentUserId={currentUserId}
          onAddReaction={onAddReaction}
          onRemoveReaction={onRemoveReaction}
        />
      )}
    </div>
  );
}