import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LeftNavBar({ activeTab, onTabChange, onProfileClick, totalUnreadCount = 0 }) {
  const { profile } = useAuth();

  const tabs = [
    {
      id: 'chats',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z"/>
        </svg>
      ),
      label: 'Chats',
      badge: totalUnreadCount > 0 ? totalUnreadCount : null,
    },
    {
      id: 'calls',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M20.5 15.8c-1.2 0-2.3-.2-3.4-.6-.3-.1-.7 0-1 .2l-2.1 2.1c-2.8-1.4-5.1-3.8-6.5-6.5l2.1-2.1c.3-.3.4-.7.2-1-.4-1.1-.6-2.2-.6-3.4 0-.6-.4-1-1-1H4.1c-.6 0-1 .4-1 1C3.1 13.1 10.9 20.9 20.5 20.9c.6 0 1-.4 1-1v-4.1c0-.6-.4-1-1-1z"/>
        </svg>
      ),
      label: 'Calls',
    },
    {
      id: 'status',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
          <circle cx="12" cy="12" r="5" fill="currentColor"/>
        </svg>
      ),
      label: 'Status',
      hasIndicator: true,
    },
    {
      id: 'communities',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v13.5a1.5 1.5 0 0 1-1.5 1.5h-13a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5h13zm-13-1.5A3 3 0 0 0 .5 5.25v13.5a3 3 0 0 0 3 3h13a3 3 0 0 0 3-3V5.25a3 3 0 0 0-3-3h-13z"/>
          <path d="M15 9.75a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 .75-.75zm0 3a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 .75-.75z"/>
          <circle cx="7.5" cy="9.75" r="1" fill="currentColor"/>
          <circle cx="7.5" cy="12.75" r="1" fill="currentColor"/>
        </svg>
      ),
      label: 'Communities',
      hasIndicator: true,
    },
  ];

  return (
    <div className="left-navbar">
      {/* Profile Avatar at top */}
      <button
        className="nav-profile-btn"
        onClick={onProfileClick}
        title="Profile"
      >
        <div className="nav-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" />
          ) : (
            <span>{profile?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </div>
      </button>

      {/* Navigation Items */}
      <div className="nav-items">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            title={tab.label}
          >
            <div className="nav-icon-wrapper">
              {tab.icon}
              {tab.badge && <span className="nav-badge">{tab.badge}</span>}
              {tab.hasIndicator && <span className="nav-indicator"></span>}
            </div>
          </button>
        ))}
      </div>

      {/* Bottom icons */}
      <div className="nav-bottom">
        <button className="nav-item" title="Gallery">
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
          </svg>
        </button>
        <button className="nav-item nav-ai" title="Meta AI">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <circle cx="12" cy="12" r="9" stroke="url(#aiGradient)" strokeWidth="2"/>
            <defs>
              <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0099ff"/>
                <stop offset="50%" stopColor="#a033ff"/>
                <stop offset="100%" stopColor="#ff5280"/>
              </linearGradient>
            </defs>
          </svg>
        </button>
      </div>
    </div>
  );
}
