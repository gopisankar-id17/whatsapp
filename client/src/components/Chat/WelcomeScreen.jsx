import React from 'react';
import logo from '../../assets/logo.jpg';

export default function WelcomeScreen() {
  return (
    <div className="welcome-screen">
      <img src={logo} alt="WhatsApp Logo" className="welcome-logo" style={{ width: '240px', height: '240px', objectFit: 'contain' }} />

      <h1 className="welcome-title">Download WhatsApp for Windows</h1>

      <p className="welcome-subtitle">
        Make calls, share your screen and get a faster experience when you download
        the Windows app.
      </p>

      <button
        style={{
          background: '#008069',
          color: '#fff',
          border: 'none',
          borderRadius: '24px',
          padding: '10px 24px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          marginTop: '8px',
        }}
      >
        Get from Microsoft Store
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: 'rgba(0,0,0,0.45)',
        fontSize: '14px',
        marginTop: '50px',
      }}>
        <svg width="16" height="16" viewBox="0 0 18 18" fill="currentColor">
          <path d="M15 9H13V6H10V9H8V6H5V9H3V6C3 4.34 4.34 3 6 3H12C13.66 3 15 4.34 15 6V9ZM15 12V15C15 16.66 13.66 18 12 18H6C4.34 18 3 16.66 3 15V12H5V15H8V12H10V15H13V12H15Z"/>
        </svg>
        <span>Your personal messages are end-to-end encrypted</span>
      </div>
    </div>
  );
}
