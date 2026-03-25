import React, { useState } from 'react';
import ReactionPicker from './ReactionPicker';

export default function MessageReactions({ reactions, messageId, conversationId, currentUserId, onAddReaction, onRemoveReaction }) {
  const [showPicker, setShowPicker] = useState(false);

  if (!reactions || reactions.length === 0) return null;

  // Group reactions by type
  const groupedReactions = {};
  reactions.forEach((r) => {
    if (!groupedReactions[r.reaction]) {
      groupedReactions[r.reaction] = [];
    }
    groupedReactions[r.reaction].push(r);
  });

  const handleReactionClick = (reaction) => {
    const hasReacted = groupedReactions[reaction]?.some(r => r.user_id === currentUserId);
    if (hasReacted) {
      onRemoveReaction?.(messageId, conversationId, reaction);
    } else {
      onAddReaction?.(messageId, conversationId, reaction);
    }
  };

  return (
    <div className="message-reactions-container">
      <div className="message-reactions">
        {Object.entries(groupedReactions).map(([reaction, reactionsList]) => (
          <button
            key={reaction}
            className={`reaction-pill ${reactionsList.some(r => r.user_id === currentUserId) ? 'reacted' : ''}`}
            onClick={() => handleReactionClick(reaction)}
            title={reactionsList.map(r => r.profiles?.name || 'Unknown').join(', ')}
          >
            <span className="reaction-emoji">{reaction}</span>
            <span className="reaction-count">{reactionsList.length > 1 ? reactionsList.length : ''}</span>
          </button>
        ))}
        <button
          className="reaction-add-btn"
          onClick={() => setShowPicker(!showPicker)}
          title="Add reaction"
        >
          ➕
        </button>
      </div>
      {showPicker && (
        <ReactionPicker
          onReactionSelect={(emoji) => {
            onAddReaction?.(messageId, conversationId, emoji);
            setShowPicker(false);
          }}
          messageId={messageId}
        />
      )}
    </div>
  );
}
