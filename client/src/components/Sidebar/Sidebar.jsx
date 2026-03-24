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
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('whatsapp-theme');
    return saved === 'dark';
  });

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
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        {/* Current user avatar */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            borderRadius: '50%',
          }}
          onClick={() => setShowProfile(true)}
          aria-label="Open profile"
        >
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: profile?.avatar_url ? `url(${profile.avatar_url}) center/cover` : '#dfe5e7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 500, color: '#fff', flexShrink: 0,
            overflow: 'hidden',
          }}>
            {!profile?.avatar_url && (profile?.name?.charAt(0).toUpperCase() || 'U')}
          </div>
        </button>

        <div className="sidebar-header-actions">
          {/* Dark mode toggle */}
          <button className="theme-toggle-btn" title={darkMode ? "Light mode" : "Dark mode"} onClick={toggleDarkMode}>
            {darkMode ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Communities icon */}
          <button className="icon-btn" title="Communities">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>

          {/* Status icon */}
          <button className="icon-btn" title="Status">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/>
            </svg>
          </button>

          {/* Channels icon */}
          <button className="icon-btn" title="Channels">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11a9 9 0 0 1 9 9"/>
              <path d="M4 4a16 16 0 0 1 16 16"/>
              <circle cx="5" cy="19" r="1" fill="currentColor"/>
            </svg>
          </button>

          {/* New chat icon */}
          <button className="icon-btn" title="New chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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
        <>
          {/* Archived Section */}
          <div className="archived-section">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"/>
              <rect x="1" y="3" width="22" height="5"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            Archived
            <span className="archived-count">0</span>
          </div>
          <ChatList
            conversations={conversations}
            selectedChat={selectedChat}
            onSelectChat={onSelectChat}
            currentUserId={currentUserId}
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