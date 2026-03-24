// client/src/context/CallContext.jsx  (FULL FILE)

import { createContext, useContext, useRef, useState, useEffect } from "react";
import { useSocket } from "./SocketContext";
import { useAuth }   from "./AuthContext";

const CallContext = createContext();
export const useCall = () => useContext(CallContext);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export const CallProvider = ({ children }) => {
  const { socket }    = useSocket();
  const { profile }   = useAuth();

  // callState: "idle" | "calling" | "incoming" | "ongoing"
  const [callState,    setCallState]    = useState("idle");
  const [callWith,     setCallWith]     = useState(null);   // other user's info
  const [incomingCall, setIncomingCall] = useState(null);   // { from, offer, callerInfo }

  const localStreamRef = useRef(null);
  const peerConnRef    = useRef(null);
  const remoteAudioRef = useRef(null);   // <audio> element ref

  // ── Cleanup all call state ───────────────────────────────────────────────
  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnRef.current?.close();
    peerConnRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    setCallState("idle");
    setCallWith(null);
    setIncomingCall(null);
  };

  // ── Get microphone stream ────────────────────────────────────────────────
  const getLocalStream = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    return stream;
  };

  // ── Create RTCPeerConnection ─────────────────────────────────────────────
  const createPC = (targetUserId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("call:ice-candidate", { to: targetUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        cleanup();
      }
    };

    peerConnRef.current = pc;
    return pc;
  };

  // ── Start a call (caller side) ───────────────────────────────────────────
  const startCall = async (targetUser) => {
    if (callState !== "idle" || !socket) return;
    setCallState("calling");
    setCallWith(targetUser);

    try {
      const stream = await getLocalStream();
      const pc     = createPC(targetUser.id);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:offer", { to: targetUser.id, offer });
    } catch (err) {
      console.error("startCall error:", err);
      cleanup();
    }
  };

  // ── Accept incoming call (callee side) ───────────────────────────────────
  const acceptCall = async () => {
    if (!incomingCall || !socket) return;
    const { from, offer, callerInfo } = incomingCall;

    setCallState("ongoing");
    setCallWith(callerInfo);

    try {
      const stream = await getLocalStream();
      const pc     = createPC(from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", { to: from, answer });
    } catch (err) {
      console.error("acceptCall error:", err);
      cleanup();
    }
  };

  // ── Reject incoming call ─────────────────────────────────────────────────
  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit("call:reject", { to: incomingCall.from });
    cleanup();
  };

  // ── End ongoing/outgoing call ────────────────────────────────────────────
  const endCall = () => {
    const targetId = callWith?.id || incomingCall?.from;
    if (targetId && socket) socket.emit("call:end", { to: targetId });
    cleanup();
  };

  // ── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", ({ from, offer, callerInfo }) => {
      setIncomingCall({ from, offer, callerInfo });
      setCallState("incoming");
    });

    socket.on("call:answered", async ({ answer }) => {
      try {
        await peerConnRef.current?.setRemoteDescription(new RTCSessionDescription(answer));
        setCallState("ongoing");
      } catch (err) {
        console.error("call:answered error:", err);
      }
    });

    socket.on("call:ice-candidate", async ({ candidate }) => {
      try {
        await peerConnRef.current?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        // ignore benign ICE errors
      }
    });

    socket.on("call:rejected", cleanup);
    socket.on("call:ended",    cleanup);

    return () => {
      socket.off("call:incoming");
      socket.off("call:answered");
      socket.off("call:ice-candidate");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, [socket]);

  return (
    <CallContext.Provider value={{
      callState,
      callWith,
      incomingCall,
      startCall,
      acceptCall,
      rejectCall,
      endCall,
      remoteAudioRef,
    }}>
      {children}
    </CallContext.Provider>
  );
};