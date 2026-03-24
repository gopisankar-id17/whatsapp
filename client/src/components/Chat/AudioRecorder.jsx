import React, { useState, useRef, useEffect } from 'react';

export default function AudioRecorder({ onRecordingComplete, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioPlaybackRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer for recording duration
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const sendRecording = () => {
    if (recordedBlob) {
      onRecordingComplete?.(recordedBlob, `voice-message-${Date.now()}.webm`);
      setRecordedBlob(null);
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    setRecordingTime(0);
  };

  const playRecording = () => {
    if (recordedBlob && audioPlaybackRef.current) {
      const url = URL.createObjectURL(recordedBlob);
      audioPlaybackRef.current.src = url;
      audioPlaybackRef.current.play();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording && !recordedBlob) {
    return null;
  }

  return (
    <div className="audio-recorder-container">
      {isRecording ? (
        <div className="recording-state">
          <div className="recording-indicator">
            <div className="recording-dot" />
            <span>Recording: {formatTime(recordingTime)}</span>
          </div>
          <div className="recording-controls">
            <button
              className="recorder-btn cancel"
              onClick={cancelRecording}
              title="Cancel recording"
              disabled={disabled}
            >
              ✕
            </button>
            <button
              className="recorder-btn stop"
              onClick={stopRecording}
              title="Stop recording"
              disabled={disabled}
            >
              ⏹
            </button>
          </div>
        </div>
      ) : recordedBlob ? (
        <div className="playback-state">
          <div className="playback-info">
            <span className="duration">{formatTime(recordingTime)}</span>
            <button
              className="play-btn"
              onClick={playRecording}
              title="Play recording"
              disabled={disabled}
            >
              ▶
            </button>
          </div>
          <div className="playback-controls">
            <button
              className="recorder-btn cancel"
              onClick={cancelRecording}
              title="Delete recording"
              disabled={disabled}
            >
              🗑
            </button>
            <button
              className="recorder-btn send"
              onClick={sendRecording}
              title="Send recording"
              disabled={disabled}
            >
              ✓
            </button>
          </div>
        </div>
      ) : null}
      <audio ref={audioPlaybackRef} />
    </div>
  );
}
