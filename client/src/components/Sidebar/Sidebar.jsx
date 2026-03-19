import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import SearchBar from './SearchBar';
import ChatList from './ChatList';
import { chatService } from '../../services/chatService';
import { uploadService } from '../../services/uploadService';

export default function Sidebar({
  conversations,
  selectedChat,
  onSelectChat,
  searchQuery,
  onSearchChange,
  loading,
  currentUserId,
  onStartConversation,
}) {
  const { logout, profile, updateProfile: setProfileCtx } = useAuth();
  const { emit } = useSocket();
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', about: '', avatar_url: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Current user avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {!profile?.avatar_url && (profile?.name?.charAt(0).toUpperCase() || 'U')}
          </div>
          <span className="sidebar-header-title">WhatsApp</span>
        </div>

        <div className="sidebar-header-actions">
          {/* New chat icon */}
          <button className="icon-btn" title="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

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
                  borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: 160,
                  overflow: 'hidden',
                  marginTop: 4,
                }}>
                  <button
                    onClick={() => { setShowMenu(false); setShowProfile(true); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); }}
                    style={menuItemStyle}
                    onMouseEnter={e => e.target.style.background = '#f5f6f6'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    Settings
                  </button>
                  <div style={{ borderTop: '1px solid #e9edef' }} />
                  <button
                    onClick={() => { setShowMenu(false); handleLogout(); }}
                    style={{ ...menuItemStyle, color: '#dc3545' }}
                    onMouseEnter={e => e.target.style.background = '#fff5f5'}
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

      {/* User info bar */}
      <div style={{
        padding: '8px 16px',
        background: '#f0f2f5',
        borderBottom: '1px solid #e9edef',
        fontSize: 13,
        color: '#667781',
      }}>
        Signed in as <strong style={{ color: '#111b21' }}>{profile?.name || 'User'}</strong>
      </div>

      <SearchBar value={searchQuery} onChange={onSearchChange} />

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
                  onStartConversation(u);
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
      ) : (
        <ChatList
          conversations={conversations}
          selectedChat={selectedChat}
          onSelectChat={onSelectChat}
          currentUserId={currentUserId}
        />
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
    </aside>
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