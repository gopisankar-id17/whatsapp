export default function ChatItem({ conversation, colorIndex, isActive, onClick, currentUserId }) {
  // Get the other participant (not current user)
  const other = conversation.conversation_participants?.find(
    p => p.user_id !== currentUserId
  );
  
  const name         = other?.profiles?.name || 'Unknown';
  const avatarUrl    = other?.profiles?.avatar_url;
  const isOnline     = other?.profiles?.is_online || false;
  const lastMessage  = conversation.messages?.[0]?.text || 'No messages yet';
  const time         = conversation.last_message_at
    ? new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const initials     = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
          <span className="chat-time">{time}</span>
        </div>
        <div className="chat-info-bottom">
          <span className="chat-last-message">{lastMessage}</span>
        </div>
      </div>
    </div>
  );
}