// client/src/components/Call/CallButton.jsx  (FULL FILE)
// Place this button inside your ChatWindow header

import { useCall } from "../../context/CallContext";

// targetUser must have: { id, name, avatar_url }
// Get it from conversation.conversation_participants filtered by currentUserId
const CallButton = ({ targetUser }) => {
  const { startCall, callState } = useCall();

  const busy = callState !== "idle";

  return (
    <button
      onClick={() => !busy && startCall(targetUser)}
      disabled={busy}
      title={busy ? "Already in a call" : "Start audio call"}
      style={{
        background:    "none",
        border:        "none",
        cursor:        busy ? "not-allowed" : "pointer",
        color:         busy ? "#444c53" : "#aebac1",
        padding:       8,
        borderRadius:  "50%",
        display:       "flex",
        alignItems:    "center",
        justifyContent:"center",
        transition:    "color .2s",
      }}
    >
      {/* Phone SVG — no external icon library needed */}
      <svg viewBox="0 0 24 24" width="21" height="21" fill="currentColor">
        <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36
          1.02-.24 1.12.37 2.32.57 3.58.57.55 0 1 .45 1
          1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1
          1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57
          3.57.11.35.03.74-.24 1.01L6.6 10.8z"/>
      </svg>
    </button>
  );
};

export default CallButton;