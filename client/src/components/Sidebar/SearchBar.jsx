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
          placeholder="Search or start new chat"
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}