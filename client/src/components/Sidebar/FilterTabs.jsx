import React from 'react';

export default function FilterTabs({ activeFilter, onFilterChange, unreadCount = 0, favouriteCount = 0 }) {
  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'favourites', label: 'Favourites', count: favouriteCount },
  ];

  return (
    <div className="filter-tabs">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
          {filter.count > 0 && <span className="filter-count">{filter.count}</span>}
        </button>
      ))}
    </div>
  );
}
