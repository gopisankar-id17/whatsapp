import React from 'react';

export default function LinkPreview({ preview }) {
  if (!preview) return null;

  const { url, title, description, imageUrl, domain } = preview;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-preview"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="link-preview-card">
        {imageUrl && (
          <div className="link-preview-image">
            <img
              src={imageUrl}
              alt={title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        )}
        <div className="link-preview-content">
          <div className="link-preview-domain">{domain}</div>
          <div className="link-preview-title">{title}</div>
          {description && (
            <div className="link-preview-description">
              {description.substring(0, 100)}
              {description.length > 100 ? '...' : ''}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
