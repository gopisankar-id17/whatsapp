// client/src/components/Call/CallUI.jsx  (FULL FILE)

import { useCall } from "../../context/CallContext";

const CallUI = () => {
  const {
    callState, callWith, incomingCall,
    acceptCall, rejectCall, endCall,
    remoteAudioRef,
  } = useCall();

  if (callState === "idle") return null;

  const person   = callWith || incomingCall?.callerInfo;
  const initials = (person?.name || "?")[0].toUpperCase();

  return (
    <>
      {/* Hidden audio element — plays the remote user's voice */}
      <audio ref={remoteAudioRef} autoPlay />

      <div style={s.overlay}>
        <div style={s.card}>

          {/* Avatar with ripple */}
          <div style={s.rippleWrap}>
            {(callState === "calling" || callState === "incoming") && (
              <>
                <div style={{ ...s.ripple, animationDelay: "0s"   }} className="call-ripple" />
                <div style={{ ...s.ripple, animationDelay: "0.5s" }} className="call-ripple" />
              </>
            )}
            <div style={s.avatar}>
              {person?.avatar_url
                ? <img src={person.avatar_url} alt="avatar" style={s.avatarImg} />
                : <span style={s.initials}>{initials}</span>
              }
            </div>
          </div>

          {/* Name & status */}
          <p style={s.name}>{person?.name || "Unknown"}</p>
          <p style={s.status}>
            {callState === "calling"  && "Calling…"}
            {callState === "incoming" && "Incoming audio call"}
            {callState === "ongoing"  && "● Call in progress"}
          </p>

          {/* Action buttons */}
          <div style={s.btnRow}>
            {callState === "incoming" && (
              <>
                <Btn bg="#00a884" label="Accept"  onClick={acceptCall}><IconPhone /></Btn>
                <Btn bg="#f15c6d" label="Decline" onClick={rejectCall}><IconPhoneOff /></Btn>
              </>
            )}
            {(callState === "calling" || callState === "ongoing") && (
              <Btn bg="#f15c6d" label="End call" onClick={endCall}><IconPhoneOff /></Btn>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes callRipple {
          0%   { transform: scale(1);   opacity: 0.45; }
          100% { transform: scale(2.2); opacity: 0;    }
        }
        .call-ripple { animation: callRipple 1.6s ease-out infinite; }
      `}</style>
    </>
  );
};

// ── Small reusable button ────────────────────────────────────────────────────
const Btn = ({ bg, label, onClick, children }) => (
  <button onClick={onClick} style={{ ...s.btn, background: bg }}>
    {children}
    <span style={{ fontSize: 12, marginTop: 4 }}>{label}</span>
  </button>
);

// ── Inline SVG icons (no lucide needed) ─────────────────────────────────────
const IconPhone = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.27-.27.67-.36
      1.02-.24 1.12.37 2.32.57 3.58.57.55 0 1 .45 1
      1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1
      1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57
      3.57.11.35.03.74-.24 1.01L6.6 10.8z"/>
  </svg>
);
const IconPhoneOff = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="white">
    <path d="M23.36 20.22 3.78.64 2.36 2.06l2.69 2.69A17.99 17.99 0 0 0 3
      10c0 0 4 9 11 11a18.1 18.1 0 0 0 5.27-2.96l2.67
      2.67 1.42-1.49zM20.65 17.06A14.1 14.1 0 0 1 17
      19.26C11.38 17.5 8 11.62 8 10c0-.04.01-.09.01-.13l3.07
      3.07c.31.85.78 1.63 1.38 2.31l1.44-1.44a9.7 9.7 0 0
      1-1.29-1.81L9.93 9.93A9.53 9.53 0 0 1 9 8.14V8h.01L7.28
      6.27A14 14 0 0 0 5 10c0 5.52 4.48 10 10
      10 1.37 0 2.67-.28 3.85-.77l-1.42-1.42-.78.25z"/>
  </svg>
);

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.78)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  card: {
    background: "#1f2c34",
    borderRadius: 22,
    padding: "48px 56px",
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 12, minWidth: 300,
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
  },
  rippleWrap: {
    position: "relative",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  ripple: {
    position: "absolute",
    width: 84, height: 84,
    borderRadius: "50%",
    background: "rgba(0,168,132,0.3)",
  },
  avatar: {
    width: 84, height: 84, borderRadius: "50%",
    overflow: "hidden", border: "3px solid #00a884",
    background: "#2a3942",
    display: "flex", alignItems: "center", justifyContent: "center",
    position: "relative", zIndex: 1,
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  initials:  { fontSize: 32, fontWeight: 700, color: "white" },
  name:      { color: "white",   margin: 0, fontSize: 20, fontWeight: 600 },
  status:    { color: "#8696a0", margin: 0, fontSize: 13 },
  btnRow:    { display: "flex", gap: 28, marginTop: 14 },
  btn: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 2, padding: "14px 28px",
    borderRadius: 14, border: "none",
    cursor: "pointer", color: "white", fontWeight: 500,
    fontSize: 13,
  },
};

export default CallUI;