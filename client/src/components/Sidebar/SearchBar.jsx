import React from 'react';

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-container">
      <div className="search-wrapper">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
      {/* Filter button */}
      <button
        type="button"
        style={{
          background: 'none',
          border: 'none',
          padding: 8,
          cursor: 'pointer',
          color: '#54656f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          flexShrink: 0,
        }}
        title="Unread chats filter"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
        </svg>
      </button>
    </div>
  );
}