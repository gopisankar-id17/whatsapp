import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import LeftNavBar from './LeftNavBar';
import FilterTabs from './FilterTabs';
import SearchBar from './SearchBar';
import ChatList from './ChatList';
import { chatService } from '../../services/chatService';
import { uploadService } from '../../services/uploadService';

export default function Sidebar({
  conversations,
  archivedChats = [],
  selectedChat,
  onSelectChat,
  searchQuery,
  onSearchChange,
  loading,
  currentUserId,
  onStartConversation,
  onArchiveChat,
  onUnarchiveChat,
  onDeleteChat,
}) {
  const { logout, profile, updateProfile: setProfileCtx } = useAuth();
  const { emit } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', about: '', avatar_url: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null); // For user profile modal
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('whatsapp-theme');
    return saved === 'dark';
  });
  const [activeNavTab, setActiveNavTab] = useState('chats');
  const [activeFilter, setActiveFilter] = useState('all');

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('whatsapp-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  useEffect(() => {
    setProfileForm({
      name: profile?.name || '',
      about: profile?.about || '',
      avatar_url: profile?.avatar_url || '',
    });
  }, [profile]);

  useEffect(() => {
    let timer;
    const run = async () => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSearchResults([]);
        setSearchError('');
        return;
      }
      setSearching(true);
      setSearchError('');
      try {
        const { data } = await chatService.searchUsers(searchQuery.trim());
        setSearchResults(data.users || []);
      } catch (err) {
        setSearchError('Search failed');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    timer = setTimeout(run, 250); // debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="sidebar-container">
      <LeftNavBar
        activeTab={activeNavTab}
        onTabChange={setActiveNavTab}
        onProfileClick={() => setShowProfile(true)}
        totalUnreadCount={conversations.reduce((total, c) => total + (c.unread_count || 0), 0)}
      />
      <aside className="sidebar">
      {/* Simple Header with WhatsApp branding */}
      <div className="sidebar-header-simple">
        <h2 className="whatsapp-title">WhatsApp</h2>
        <div className="sidebar-header-actions">
          {/* Menu with logout */}
          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              title="Menu"
              onClick={() => setShowMenu(!showMenu)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowMenu(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: '#fff',
                  borderRadius: 3,
                  boxShadow: '0 2px 5px 0 rgba(11,20,26,.26), 0 2px 10px 0 rgba(11,20,26,.16)',
                  zIndex: 100,
                  minWidth: 200,
                  overflow: 'hidden',
                  marginTop: 4,
                  paddingTop: 8,
                  paddingBottom: 8,
                }}>
                  <button
                    onClick={() => { setShowMenu(false); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    New group
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Starred messages
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Settings
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowProfile(true); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <SearchBar value={searchQuery} onChange={onSearchChange} />

      {/* Filter Tabs */}
      {!searchQuery && (
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          unreadCount={conversations.reduce((total, c) => total + (c.unread_count || 0), 0)}
          favouriteCount={conversations.filter(c => c.is_favourite).length}
        />
      )}

      {/* Search results dropdown */}
      {searchQuery && searchQuery.trim().length >= 2 && (
        <div style={{ padding: '0 8px' }}>
          <div style={{
            background: '#fff',
            border: '1px solid #e9edef',
            borderRadius: 8,
            boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
            maxHeight: 240,
            overflowY: 'auto',
            marginBottom: 8,
          }}>
            {searching && (
              <div style={resultItem}>Searching...</div>
            )}
            {!searching && searchResults.length === 0 && !searchError && (
              <div style={resultItem}>No users found</div>
            )}
            {searchError && <div style={{ ...resultItem, color: '#dc3545' }}>{searchError}</div>}
            {!searching && searchResults.map((u) => (
              <button
                key={u.id}
                style={resultButton}
                onClick={() => {
                  setSelectedUser(u);
                  onSearchChange('');
                  setSearchResults([]);
                }}
              >
                <div style={avatarCircle}>{u.name?.[0]?.toUpperCase() || 'U'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, color: '#111b21' }}>{u.name || 'Unknown'}</span>
                  {u.email && <span style={{ fontSize: 12, color: '#667781' }}>{u.email}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 20, textAlign: 'center', color: '#667781', fontSize: 14 }}>
          Loading chats...
        </div>
      ) : showArchived ? (
        /* Archived Chats Panel */
        <>
          <div className="archived-header">
            <button className="back-btn" onClick={() => setShowArchived(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <span>Archived</span>
          </div>
          {archivedChats.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--wa-text-muted)', fontSize: '14px' }}>
              No archived chats
            </div>
          ) : (
            <div className="chat-list">
              {archivedChats.map((conv, idx) => (
                <ArchivedChatItem
                  key={conv.id}
                  conversation={conv}
                  colorIndex={idx % 7}
                  currentUserId={currentUserId}
                  onUnarchive={onUnarchiveChat}
                  onDelete={onDeleteChat}
                  onSelect={() => {
                    onSelectChat(conv);
                    setShowArchived(false);
                  }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Archived Section */}
          {archivedChats.length > 0 && (
            <div className="archived-section" onClick={() => setShowArchived(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/>
                <rect x="1" y="3" width="22" height="5"/>
                <line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              Archived
              <span className="archived-count">{archivedChats.length}</span>
            </div>
          )}
          <ChatList
            conversations={conversations}
            selectedChat={selectedChat}
            onSelectChat={onSelectChat}
            currentUserId={currentUserId}
            onArchive={onArchiveChat}
            onDelete={onDeleteChat}
          />
        </>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <>
          <div className="modal-backdrop" onClick={() => setShowProfile(false)} />
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit profile</h3>
              <button className="icon-btn" style={{ color: '#667781' }} onClick={() => setShowProfile(false)}>
                ✕
              </button>
            </div>

            <div className="profile-avatar-block">
              <div className="profile-avatar" style={{ backgroundImage: profileForm.avatar_url ? `url(${profileForm.avatar_url})` : 'none' }}>
                {!profileForm.avatar_url && (profileForm.name?.[0]?.toUpperCase() || 'U')}
              </div>
              <div>
                <label className="outline-btn" style={{ cursor: 'pointer' }}>
                  Change photo
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const { valid, error } = uploadService.validateFile(file);
                      if (!valid) {
                        setUploadError(error);
                        return;
                      }
                      setUploadError('');
                      setUploading(true);
                      setUploadProgress(0);
                      try {
                        const { url } = await uploadService.uploadMedia(file, setUploadProgress);
                        setProfileForm((f) => ({ ...f, avatar_url: url }));
                      } catch (err) {
                        setUploadError('Upload failed');
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                </label>
                {uploading && <div className="upload-progress">Uploading... {uploadProgress}%</div>}
                {uploadError && <div className="error-text">{uploadError}</div>}
              </div>
            </div>

            <div className="modal-body">
              <label className="field-label">Name</label>
              <input
                className="field-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                maxLength={50}
              />
              <label className="field-label">About</label>
              <input
                className="field-input"
                value={profileForm.about}
                onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                maxLength={120}
                placeholder="Hey there! I am using WhatsApp."
              />
            </div>

            <div className="modal-footer">
              <button className="outline-btn" onClick={() => setShowProfile(false)}>Cancel</button>
              <button
                className="primary-btn"
                disabled={savingProfile}
                onClick={async () => {
                  if (!profileForm.name.trim()) return;
                  setSavingProfile(true);
                  try {
                    const { data } = await chatService.updateProfile(
                      profileForm.name.trim(),
                      profileForm.about.trim(),
                      profileForm.avatar_url
                    );
                    if (data?.profile) {
                      setProfileCtx(data.profile);
                      emit('profile_updated', {
                        name: data.profile.name,
                        avatar_url: data.profile.avatar_url,
                      });
                    }
                    setShowProfile(false);
                  } catch (err) {
                    setUploadError('Save failed');
                  } finally {
                    setSavingProfile(false);
                  }
                }}
              >
                {savingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* User Profile Modal (for sending invitations) */}
      {selectedUser && (
        <>
          <div className="modal-backdrop" onClick={() => setSelectedUser(null)} />
          <div className="modal-card">
            <div className="modal-header">
              <h3>User Profile</h3>
              <button className="icon-btn" style={{ color: '#667781' }} onClick={() => setSelectedUser(null)}>
                ✕
              </button>
            </div>

            <div className="profile-avatar-block" style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div className="profile-avatar" style={{
                backgroundImage: selectedUser.avatar_url ? `url(${selectedUser.avatar_url})` : 'none',
                margin: '0 auto'
              }}>
                {!selectedUser.avatar_url && (selectedUser.name?.[0]?.toUpperCase() || 'U')}
              </div>
              <h4 style={{ margin: '12px 0 4px', fontSize: '18px', color: '#111b21' }}>
                {selectedUser.name || 'Unknown User'}
              </h4>
              {selectedUser.email && (
                <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#667781' }}>
                  {selectedUser.email}
                </p>
              )}
              <p style={{ margin: '0', fontSize: '14px', color: '#667781' }}>
                {selectedUser.is_online ? '🟢 Online' : `Last seen: ${new Date(selectedUser.last_seen || Date.now()).toLocaleDateString()}`}
              </p>
            </div>

            <div className="modal-footer">
              <button className="outline-btn" onClick={() => setSelectedUser(null)}>
                Cancel
              </button>
              <button
                className="primary-btn"
                disabled={sendingInvitation}
                onClick={async () => {
                  setSendingInvitation(true);
                  try {
                    await onStartConversation(selectedUser);
                    setSelectedUser(null);
                  } catch (err) {
                    console.error('Failed to send invitation:', err);
                    // You can add error handling here
                  } finally {
                    setSendingInvitation(false);
                  }
                }}
              >
                {sendingInvitation ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
    </div>
  );
}

const menuItemStyle = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 14,
  color: '#111b21',
  fontFamily: 'inherit',
  transition: 'background 0.15s',
};

const resultItem = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 14,
  color: '#667781',
};

const resultButton = {
  display: 'flex',
  gap: 10,
  alignItems: 'center',
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
};

const avatarCircle = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#e9edef',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  color: '#008069',
  flexShrink: 0,
};

// Archived Chat Item component
function ArchivedChatItem({ conversation, colorIndex, currentUserId, onUnarchive, onDelete, onSelect }) {
  const [showMenu, setShowMenu] = useState(false);

  const participants = conversation.conversation_participants || [];
  const other = participants.find((p) => `${p.user_id}` !== `${currentUserId}`) || participants[0];

  const name = other?.profiles?.name || other?.profiles?.email || 'Unknown';
  const avatarUrl = other?.profiles?.avatar_url;
  const lastMessage = conversation.messages?.[0]?.text || 'No messages yet';
  const time = conversation.last_message_at
    ? new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleUnarchive = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onUnarchive?.(conversation.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm('Delete this chat? This will remove it permanently.')) {
      onDelete?.(conversation.id);
    }
  };

  return (
    <div className="chat-item" onClick={onSelect}>
      <div className="avatar-wrapper">
        <div
          className={`avatar avatar-colors-${colorIndex}`}
          style={avatarUrl ? { backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          {!avatarUrl && initials}
        </div>
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
              <button className="chat-item-dropdown-item" onClick={handleUnarchive}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"/>
                  <rect x="1" y="3" width="22" height="5"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                Unarchive chat
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