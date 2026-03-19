import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import SearchBar from './SearchBar';
import ChatList from './ChatList';

export default function Sidebar({ conversations, selectedChat, onSelectChat, searchQuery, onSearchChange, loading, currentUserId }) {
  const { logout, profile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Current user avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#fff', flexShrink: 0,
          }}>
            {profile?.name?.charAt(0).toUpperCase() || 'U'}
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
                    onClick={() => { setShowMenu(false); }}
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