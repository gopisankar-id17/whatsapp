import React from 'react';

export default function ReplyPreview({ message, onCancel, senderName }) {
  if (!message) return null;

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '(No text)';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="reply-preview-container">
      <div className="reply-preview">
        <div className="reply-preview-content">
          <div className="reply-preview-sender">{senderName || 'Someone'}</div>
          <div className="reply-preview-text">
            {message.media_type ? (
              <span className="reply-preview-media-indicator">
                📎 {message.media_type.startsWith('image/') ? 'Image' : message.media_type.startsWith('video/') ? 'Video' : 'File'}
              </span>
            ) : (
              truncateText(message.text)
            )}
          </div>
        </div>
      </div>
      {onCancel && (
        <button className="reply-cancel-btn" onClick={onCancel} title="Cancel reply">
          ✕
        </button>
      )}
    </div>
  );
}
