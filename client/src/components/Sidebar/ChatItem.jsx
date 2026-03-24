import React, { useState } from 'react';

// Double tick component for read receipts
function MessageStatus({ status, isMe }) {
  if (!isMe) return null;

  // Single tick for sent, double tick for delivered/read
  const isRead = status === 'read';
  const isDelivered = status === 'delivered' || status === 'read';

  return (
    <span className={`chat-item-tick ${isRead ? 'read' : ''}`}>
      {isDelivered ? (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <path d="M11.07.57L5.43 6.21 3.24 4.02 2 5.26l3.43 3.43 6.9-6.9L11.07.57zM14.59.57l-5.64 5.64-.77-.77-1.24 1.24 2.01 2.01 6.9-6.9L14.59.57z"/>
        </svg>
      ) : (
        <svg width="12" height="11" viewBox="0 0 12 11" fill="currentColor">
          <path d="M10.07.57L4.43 6.21 2.24 4.02 1 5.26l3.43 3.43 6.9-6.9L10.07.57z"/>
        </svg>
      )}
    </span>
  );
}

export default function ChatItem({ conversation, colorIndex, isActive, onClick, currentUserId, onArchive, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  // Pick the non-self participant (loose compare to avoid string/uuid mismatch); fallback to first participant
  const participants = conversation.conversation_participants || [];
  const other = participants.find((p) => `${p.user_id}` !== `${currentUserId}`) || participants[0];

  const name         = other?.profiles?.name || other?.profiles?.email || 'Unknown';
  const avatarUrl    = other?.profiles?.avatar_url;
  const isOnline     = other?.profiles?.is_online || false;
  const lastMsg      = conversation.messages?.[0];

  // Format last message with reactions
  let lastMessage = lastMsg?.text || 'No messages yet';
  if (lastMsg?.message_reactions && lastMsg.message_reactions.length > 0) {
    const reaction = lastMsg.message_reactions[0].reaction;
    lastMessage = `Reacted ${reaction} to: ${lastMessage.substring(0, 20)}`;
  }

  const lastMsgIsMe  = lastMsg && `${lastMsg.sender_id}` === `${currentUserId}`;
  const lastMsgStatus = lastMsg?.status || 'sent';
  const time         = conversation.last_message_at
    ? new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const initials     = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Mock data - in production, these would come from the conversation object
  const unreadCount = conversation.unread_count || 0;
  const isPinned = conversation.is_pinned || false;
  const isMuted = conversation.is_muted || false;

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleArchive = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onArchive?.(conversation.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm('Delete this chat? This will remove it from your chat list.')) {
      onDelete?.(conversation.id);
    }
  };

  return (
    <div className={`chat-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="avatar-wrapper">
        <div
          className={`avatar avatar-colors-${colorIndex}`}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!avatarUrl && initials}
        </div>
        {isOnline && <span className="online-dot" />}
      </div>
      <div className="chat-info">
        <div className="chat-info-top">
          <span className="chat-name">{name}</span>
          <div className="chat-time-row">
            <span className="chat-time">{time}</span>
            {isPinned && (
              <svg viewBox="0 0 16 16" fill="currentColor" className="pin-icon" width="14" height="14">
                <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/>
              </svg>
            )}
          </div>
        </div>
        <div className="chat-info-bottom">
          <span className="chat-last-message">
            {isMuted && (
              <svg viewBox="0 0 16 16" fill="currentColor" className="muted-icon" width="14" height="14">
                <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zM9.5 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zm3 1.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5z"/>
                <path d="M1.146 1.146a.5.5 0 0 1 .708 0l13 13a.5.5 0 0 1-.708.708l-13-13a.5.5 0 0 1 0-.708z"/>
              </svg>
            )}
            {lastMessage}
          </span>
          {lastMsg && <MessageStatus status={lastMsgStatus} isMe={lastMsgIsMe} />}
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>

      {/* Three dots menu */}
      <div className="chat-item-menu" style={{ position: 'relative' }}>
        <button
          className="chat-item-menu-btn"
          onClick={handleMenuClick}
          title="Menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <circle cx="12" cy="5" r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="chat-item-menu-backdrop"
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
            />
            <div className="chat-item-dropdown">
              <button className="chat-item-dropdown-item" onClick={handleArchive}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"/>
                  <rect x="1" y="3" width="22" height="5"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                Archive chat
              </button>
              <button className="chat-item-dropdown-item danger" onClick={handleDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete chat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}