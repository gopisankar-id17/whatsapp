import React, { useState, useRef } from 'react';

export default function MessageInput({ onSend, onTyping, disabled = false }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);

  const handleSend = () => {
    if (disabled) return;
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    onTyping?.(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    if (disabled) return;
    setText(e.target.value);
    onTyping?.(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => onTyping?.(false), 1200);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
    }
  };

  const handleBlur = () => {
    if (disabled) return;
    onTyping?.(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  };

  return (
    <div className={`message-input-area${disabled ? ' disabled' : ''}`}>
      <div className="input-box-wrapper">
        {/* Emoji */}
        <button className="input-action-btn" title="Emoji" disabled={disabled}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder="Type a message"
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          disabled={disabled}
        />
        {/* Attach */}
        <button className="input-action-btn" title="Attach" disabled={disabled}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
      </div>

      {text.trim() ? (
        <button className="send-btn" onClick={handleSend} title="Send" disabled={disabled}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      ) : (
        <button className="send-btn" title="Voice message" disabled={disabled}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
        </button>
      )}
    </div>
  );
}