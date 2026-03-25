import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { uploadService } from '../../services/uploadService';
import AudioRecorder from './AudioRecorder';

export default function MessageInput({ onSend, onTyping, disabled = false }) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimer = useRef(null);
  const emojiPickerRef = useRef(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSend = () => {
    if (disabled || uploading) return;
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
    onTyping?.(false);
    setShowEmojiPicker(false);
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

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const toggleEmojiPicker = () => {
    if (disabled) return;
    setShowEmojiPicker((prev) => !prev);
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = uploadService.validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadService.uploadMedia(file, setUploadProgress);
      onSend(text.trim() || '', result.url, result.mediaType);
      setText('');
      setUploadProgress(0);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleRecordingComplete = async (blob, filename) => {
    setIsRecording(false);
    setUploading(true);
    setUploadProgress(0);
    try {
      // Create a File object from the blob for upload
      const audioFile = new File([blob], filename, { type: 'audio/webm' });
      const result = await uploadService.uploadMedia(audioFile, setUploadProgress);
      onSend('', result.url, 'audio/webm');
      setText('');
      setUploadProgress(0);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload voice message');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {isRecording && (
        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          disabled={disabled || uploading}
        />
      )}
      <div className={`message-input-area${disabled ? ' disabled' : ''}`}>
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '16px',
            marginBottom: '10px',
            zIndex: 100,
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width={350}
            height={400}
            searchPlaceHolder="Search emoji"
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
            theme="light"
          />
        </div>
      )}

      <div className="input-box-wrapper">
        {/* Emoji */}
        <button
          type="button"
          className={`input-action-btn ${showEmojiPicker ? 'active' : ''}`}
          title="Emoji"
          disabled={disabled || uploading}
          onClick={toggleEmojiPicker}
          style={showEmojiPicker ? { color: '#00a884' } : {}}
        >
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
          disabled={disabled || uploading}
        />
        {/* Attach */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          style={{ display: 'none' }}
        />
        <button
          className={`input-action-btn ${uploading ? 'uploading' : ''}`}
          title={uploading ? `Uploading ${uploadProgress}%` : 'Attach file'}
          disabled={disabled || uploading}
          onClick={triggerFileInput}
        >
          {uploading ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          )}
        </button>
      </div>

      {text.trim() ? (
        <button className="send-btn" onClick={handleSend} title="Send" disabled={disabled || uploading}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      ) : (
        <button
          className="send-btn"
          title={isRecording ? 'Stop recording' : 'Voice message'}
          disabled={disabled || uploading}
          onClick={() => setIsRecording(!isRecording)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
          </svg>
        </button>
      )}
    </div>
    </>
  );
}

