"use client";
import React from 'react';
import { useRef, useState, useEffect } from "react";
import type { Room as LiveKitRoom, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from "livekit-client";

type ConvaiConnectResponse = {
  session_id: string;
  character_session_id: string;
  room_url: string;
  room_name: string;
  token: string;
};

// ─── Floating Petal ───────────────────────────────────────────────────────────
function Petal({ style }: { style: React.CSSProperties }) {
  return (
    <div style={{
      position: "absolute",
      background: "linear-gradient(135deg, rgba(218,165,32,0.55), rgba(255,215,0,0.25))",
      borderRadius: "60% 40% 60% 40% / 50% 60% 40% 50%",
      pointerEvents: "none",
      ...style,
    }} />
  );
}

// ─── Girl SVG Avatar ──────────────────────────────────────────────────────────
function GirlAvatar({
  isSpeaking,
  status,
}: {
  isSpeaking: boolean;
  status: string;
}) {
  const [mouthOpen, setMouthOpen] = useState(0);
  const [blinkY, setBlinkY] = useState(1);
  const [eyeDir, setEyeDir] = useState({ x: 0, y: 0 });
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eyeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Defer all setState calls into timeout callbacks to avoid setState-in-effect lint error
  useEffect(() => {
    if (isSpeaking) {
      const animate = () => {
        setMouthOpen(Math.random() * 0.75 + 0.15);
        animRef.current = setTimeout(animate, 70 + Math.random() * 110);
      };
      animRef.current = setTimeout(animate, 0);
    } else {
      if (animRef.current) clearTimeout(animRef.current);
      animRef.current = setTimeout(() => setMouthOpen(0), 0);
    }
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [isSpeaking]);

  useEffect(() => {
    const scheduleBlink = () => {
      blinkRef.current = setTimeout(() => {
        setBlinkY(0.07);
        setTimeout(() => { setBlinkY(1); scheduleBlink(); }, 130);
      }, 2200 + Math.random() * 2500);
    };
    scheduleBlink();
    return () => { if (blinkRef.current) clearTimeout(blinkRef.current); };
  }, []);

  useEffect(() => {
    const moveEyes = () => {
      setEyeDir({ x: (Math.random() - 0.5) * 2.5, y: (Math.random() - 0.5) * 1.5 });
      eyeRef.current = setTimeout(moveEyes, 2000 + Math.random() * 3000);
    };
    eyeRef.current = setTimeout(moveEyes, 0);
    return () => { if (eyeRef.current) clearTimeout(eyeRef.current); };
  }, []);

  const mouthH = mouthOpen * 16;
  const mouthCY = 69 + mouthOpen * 3;
  const connected = status === "connected";

  return (
    <svg viewBox="0 0 130 145" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="skin" cx="48%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#ffe8d6" />
          <stop offset="70%" stopColor="#ffd0b0" />
          <stop offset="100%" stopColor="#f0b090" />
        </radialGradient>
        <linearGradient id="hair" x1="0%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#5c3a00" />
          <stop offset="50%" stopColor="#3d2600" />
          <stop offset="100%" stopColor="#1a1000" />
        </linearGradient>
        <linearGradient id="hairShine" x1="20%" y1="0%" x2="60%" y2="50%">
          <stop offset="0%" stopColor="rgba(255,215,0,0.3)" />
          <stop offset="100%" stopColor="rgba(255,215,0,0)" />
        </linearGradient>
        <radialGradient id="iris" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="40%" stopColor="#b8860b" />
          <stop offset="100%" stopColor="#6b4c00" />
        </radialGradient>
        <radialGradient id="irisSpeak" cx="40%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="40%" stopColor="#daa520" />
          <stop offset="100%" stopColor="#8b6500" />
        </radialGradient>
        <linearGradient id="dress" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8860a" />
          <stop offset="100%" stopColor="#8b6500" />
        </linearGradient>
        <linearGradient id="dressShimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <radialGradient id="gem" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ffe566" />
          <stop offset="100%" stopColor="#b8860b" />
        </radialGradient>
        <filter id="softGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <rect x="52" y="88" width="18" height="20" rx="5" fill="#ffd0b0" />
      <rect x="55" y="90" width="4" height="14" rx="2" fill="rgba(0,0,0,0.07)" />
      <ellipse cx="61" cy="130" rx="38" ry="20" fill="url(#dress)" />
      <rect x="23" y="110" width="76" height="28" rx="10" fill="url(#dress)" />
      <rect x="23" y="110" width="76" height="28" rx="10" fill="url(#dressShimmer)" />
      <path d="M 48 108 Q 61 118 74 108" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M 22 42 Q 12 70 16 105 Q 18 120 28 128 L 34 110 Q 26 95 28 72 Q 28 55 34 40 Z" fill="url(#hair)" />
      <path d="M 100 42 Q 110 70 106 105 Q 104 120 94 128 L 90 110 Q 98 95 94 72 Q 94 55 88 40 Z" fill="url(#hair)" />
      <ellipse cx="61" cy="52" rx="35" ry="40" fill="url(#skin)" />
      <ellipse cx="61" cy="18" rx="36" ry="16" fill="url(#hair)" />
      <rect x="25" y="16" width="72" height="26" rx="6" fill="url(#hair)" />
      <path d="M 26 28 Q 20 50 24 72 Q 26 80 30 82 Q 28 60 30 42 Z" fill="url(#hair)" />
      <path d="M 96 28 Q 102 50 98 72 Q 96 80 92 82 Q 94 60 92 42 Z" fill="url(#hair)" />
      <ellipse cx="50" cy="16" rx="20" ry="10" fill="url(#hairShine)" opacity="0.7" />
      <path d="M 30 32 Q 40 24 55 28 Q 65 30 72 26 Q 82 22 92 28" stroke="url(#hairShine)" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
      <circle cx="26" cy="58" r="3" fill="url(#gem)" filter="url(#softGlow)" />
      <line x1="26" y1="61" x2="26" y2="67" stroke="#b8860b" strokeWidth="1.5" />
      <circle cx="26" cy="69" r="4" fill="url(#gem)" filter="url(#softGlow)" />
      <circle cx="96" cy="58" r="3" fill="url(#gem)" filter="url(#softGlow)" />
      <line x1="96" y1="61" x2="96" y2="67" stroke="#b8860b" strokeWidth="1.5" />
      <circle cx="96" cy="69" r="4" fill="url(#gem)" filter="url(#softGlow)" />
      <path d={connected ? "M 36 37 Q 44 31 52 35" : "M 36 38 Q 44 33 52 36"} stroke="#3d2600" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d={connected ? "M 70 35 Q 78 31 86 37" : "M 70 36 Q 78 33 86 38"} stroke="#3d2600" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx={44 + eyeDir.x * 0.3} cy={48 + eyeDir.y * 0.3} rx="9.5" ry={9 * blinkY} fill="white" />
      <ellipse cx={78 + eyeDir.x * 0.3} cy={48 + eyeDir.y * 0.3} rx="9.5" ry={9 * blinkY} fill="white" />
      <ellipse cx={44 + eyeDir.x} cy={48 + eyeDir.y} rx="6" ry={6 * blinkY} fill={isSpeaking ? "url(#irisSpeak)" : "url(#iris)"} filter={isSpeaking ? "url(#softGlow)" : undefined} />
      <ellipse cx={78 + eyeDir.x} cy={48 + eyeDir.y} rx="6" ry={6 * blinkY} fill={isSpeaking ? "url(#irisSpeak)" : "url(#iris)"} filter={isSpeaking ? "url(#softGlow)" : undefined} />
      <circle cx={44 + eyeDir.x} cy={48 + eyeDir.y} r={2.8 * blinkY} fill="#1a1000" />
      <circle cx={78 + eyeDir.x} cy={48 + eyeDir.y} r={2.8 * blinkY} fill="#1a1000" />
      <circle cx={46 + eyeDir.x} cy={46 + eyeDir.y} r={1.4 * blinkY} fill="white" opacity="0.9" />
      <circle cx={80 + eyeDir.x} cy={46 + eyeDir.y} r={1.4 * blinkY} fill="white" opacity="0.9" />
      <path d={`M 35 ${48 - 9 * blinkY} Q 44 ${44 - 9 * blinkY} 53 ${48 - 9 * blinkY}`} stroke="#1a1000" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={blinkY} />
      <path d={`M 69 ${48 - 9 * blinkY} Q 78 ${44 - 9 * blinkY} 87 ${48 - 9 * blinkY}`} stroke="#1a1000" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity={blinkY} />
      <path d="M 61 55 Q 58 62 59 64 Q 61 66 63 64 Q 64 62 61 55" fill="#d4906a" opacity="0.35" />
      <path d="M 57 63 Q 61 65.5 65 63" stroke="#d4906a" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5" />

      {mouthOpen > 0.06 ? (
        <>
          <ellipse cx="61" cy={mouthCY} rx="9.5" ry={Math.max(1.5, mouthH / 2)} fill="#3d1a00" />
          <path d={`M 51.5 ${mouthCY - mouthH / 2} Q 57 ${mouthCY - mouthH / 2 - 4} 61 ${mouthCY - mouthH / 2 - 3} Q 65 ${mouthCY - mouthH / 2 - 4} 70.5 ${mouthCY - mouthH / 2}`} stroke="#c87020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d={`M 51.5 ${mouthCY + mouthH / 2} Q 61 ${mouthCY + mouthH / 2 + 4} 70.5 ${mouthCY + mouthH / 2}`} stroke="#c87020" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {mouthOpen > 0.3 && <rect x="55" y={mouthCY - mouthH / 2 + 1} width="12" height={Math.min(5, mouthH - 2)} rx="2" fill="white" opacity="0.85" />}
        </>
      ) : (
        <>
          <path d={`M 52 68 Q 57 65.5 61 67 Q 65 65.5 70 68 Q 64 ${connected ? 74 : 72} 61 ${connected ? 74.5 : 72.5} Q 58 ${connected ? 74 : 72} 52 68 Z`} fill="#c87020" opacity="0.85" />
          <path d="M 52 68 Q 57 65.5 61 67 Q 65 65.5 70 68" stroke="#8b5e00" strokeWidth="1" fill="none" />
        </>
      )}

      <ellipse cx="34" cy="62" rx="8" ry="5" fill="#f4a460" opacity="0.28" />
      <ellipse cx="88" cy="62" rx="8" ry="5" fill="#f4a460" opacity="0.28" />
      <ellipse cx="55" cy="36" rx="12" ry="7" fill="rgba(255,255,255,0.08)" />

      {isSpeaking && (
        <>
          <circle cx="20" cy="50" r="2" fill="#ffd700" opacity="0.7" filter="url(#softGlow)" />
          <circle cx="102" cy="45" r="1.5" fill="#ffe566" opacity="0.6" filter="url(#softGlow)" />
          <circle cx="15" cy="70" r="1.5" fill="#daa520" opacity="0.5" />
          <circle cx="107" cy="65" r="2" fill="#ffd700" opacity="0.6" filter="url(#softGlow)" />
        </>
      )}
    </svg>
  );
}

// ─── Sound Wave ───────────────────────────────────────────────────────────────
function SoundWave({ active, color1, color2 }: { active: boolean; color1: string; color2: string }) {
  const bars = [0.3, 0.5, 0.8, 1.0, 0.7, 0.9, 0.6, 1.0, 0.75, 0.5, 0.85, 0.4, 0.65, 0.9, 0.3];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2.5, height: 32 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 3,
          borderRadius: 3,
          background: `linear-gradient(to top, ${color1}, ${color2})`,
          height: active ? `${h * 100}%` : "15%",
          opacity: active ? 0.9 : 0.25,
          animationName: active ? "waveBar" : "none",
          animationDuration: `${0.45 + (i % 5) * 0.12}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          animationDirection: "alternate",
          animationDelay: `${i * 0.04}s`,
          transition: "height 0.3s ease, opacity 0.3s ease",
        }} />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [characterSessionId, setCharacterSessionId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastBotText, setLastBotText] = useState<string>("");
  const [lastUserText, setLastUserText] = useState<string>("");
  const [showLogs, setShowLogs] = useState(false);
  const [float, setFloat] = useState(0);
  const [petals, setPetals] = useState<Array<{ id: number; left: number; delay: number; duration: number; size: number; opacity: number }>>([]);

  const roomRef = useRef<LiveKitRoom | null>(null);
  const localTrackRef = useRef<{ stop: () => void } | null>(null);
  const remoteAudioElements = useRef<HTMLAudioElement[]>([]);
  const floatT = useRef(0);
  const floatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const tick = () => {
      floatT.current += 0.025;
      setFloat(Math.sin(floatT.current) * 7);
      floatTimer.current = setTimeout(tick, 30);
    };
    tick();
    return () => { if (floatTimer.current) clearTimeout(floatTimer.current); };
  }, []);

  useEffect(() => {
    setPetals(Array.from({ length: 18 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 12,
      size: 6 + Math.random() * 10,
      opacity: 0.12 + Math.random() * 0.3,
    })));
  }, []);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs((p) => [...p.slice(-20), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  async function startCall() {
    setErr(null);
    setStatus("connecting");
    setLogs([]);
    setLastBotText("");
    setLastUserText("");

    try {
      addLog("✦ Waking up Huma...");
      const connectResp = await fetch("/api/convai/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_session_id: characterSessionId }),
      });

      const data = await connectResp.json() as ConvaiConnectResponse;
      if (!connectResp.ok) {
        const errData = data as unknown as { error?: { message?: string } };
        throw new Error(errData.error?.message || "Failed to connect");
      }

      const { room_url, room_name, token, character_session_id } = data;
      addLog(`✅ Room: ${room_name}`);
      setCharacterSessionId(character_session_id);

      const livekit = await import("livekit-client");
      const { Room, RoomEvent, Track, createLocalAudioTrack } = livekit;
      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, async (track: RemoteTrack, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
        addLog(`🎧 Audio from ${participant.identity}`);
        if (track.kind === Track.Kind.Audio) {
          try {
            const el = track.attach() as HTMLAudioElement;
            el.autoplay = true;
            el.volume = 1.0;
            el.muted = false;
            el.style.display = "none";
            document.body.appendChild(el);

            try { await room.startAudio(); } catch { /* ignore */ }
            try { await el.play(); } catch { /* ignore */ }

            setIsSpeaking(true);
            el.onplay = () => setIsSpeaking(true);
            el.onended = () => setIsSpeaking(false);
            el.onpause = () => setIsSpeaking(false);
            remoteAudioElements.current.push(el);
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Unknown audio error";
            addLog(`❌ Audio error: ${msg}`);
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) setIsSpeaking(false);
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        const text = new TextDecoder().decode(payload);
        try {
          const d = JSON.parse(text) as { type?: string; data?: { text?: string } };
          if (d.type === "bot-transcription" && d.data?.text) {
            setLastBotText(d.data.text);
            addLog(`💬 Huma: ${d.data.text}`);
          }
          if (d.type === "user-transcription" && d.data?.text) {
            setLastUserText(d.data.text);
            addLog(`🎤 You: ${d.data.text}`);
          }
        } catch { }
      });

      room.on(RoomEvent.Disconnected, () => {
        addLog("🔌 Disconnected");
        setStatus("idle"); setIsListening(false); setIsSpeaking(false);
      });

      await room.connect(room_url, token);
      addLog("✅ Connected!");

      const localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true, noiseSuppression: true,
        autoGainControl: true, sampleRate: 48000, channelCount: 1,
      });
      localTrackRef.current = localAudioTrack;
      await room.localParticipant.publishTrack(localAudioTrack, { dtx: false, source: Track.Source.Microphone });

      addLog("✦ Say hello to Huma! ✨");
      setStatus("connected");
      setIsListening(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`❌ ${msg}`);
      setErr(msg);
      setStatus("error");
      setIsListening(false); setIsSpeaking(false);
      localTrackRef.current?.stop(); localTrackRef.current = null;
      roomRef.current?.disconnect(); roomRef.current = null;
    }
  }

  async function stopCall() {
    addLog("✦ Goodbye...");
    localTrackRef.current?.stop(); localTrackRef.current = null;
    remoteAudioElements.current.forEach((el) => { el.pause(); el.remove(); });
    remoteAudioElements.current = [];
    roomRef.current?.disconnect(); roomRef.current = null;
    setStatus("idle"); setIsListening(false); setIsSpeaking(false);
    setLastBotText(""); setLastUserText("");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #1a1200;
          font-family: 'Cormorant Garamond', Georgia, serif;
          color: #f5ecd0;
          overflow-x: hidden;
        }

        @keyframes petalFall {
          0%   { transform: translateY(-5vh) rotate(0deg) translateX(0px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.5; }
          100% { transform: translateY(105vh) rotate(540deg) translateX(60px); opacity: 0; }
        }

        @keyframes waveBar {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }

        @keyframes ringBreath {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%       { transform: scale(1.05); opacity: 0.3; }
        }

        @keyframes orbitCW  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes orbitCCW { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }

        @keyframes burstOut {
          0%   { transform: scale(1);    opacity: 0.4; }
          100% { transform: scale(1.28); opacity: 0; }
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes starTwinkle {
          0%, 100% { opacity: 0.1;  transform: scale(0.8); }
          50%       { opacity: 0.65; transform: scale(1.2); }
        }

        @keyframes gradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes shimmerMove {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }

        .bubble-in { animation: fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }

        .btn-start {
          background: linear-gradient(135deg, #daa520, #f5c842, #daa520);
          background-size: 200%;
          animation: gradientShift 3s ease infinite;
          border: none;
          color: #1a1200;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.14em;
          padding: 15px 44px;
          border-radius: 50px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s, box-shadow 0.25s;
          text-transform: uppercase;
        }
        .btn-start::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
          background-size: 200%;
          animation: shimmerMove 2.5s linear infinite;
          border-radius: inherit;
        }
        .btn-start:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(218,165,32,0.5); }
        .btn-start:active { transform: translateY(-1px); }
        .btn-start:disabled { opacity: 0.5; cursor: not-allowed; transform: none; animation: none; background: #3a2e00; color: #6b5a00; }

        .btn-end {
          background: transparent;
          border: 2px solid rgba(218,165,32,0.5);
          color: #daa520;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          padding: 13px 40px;
          border-radius: 50px;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.25s;
        }
        .btn-end:hover {
          background: rgba(218,165,32,0.1);
          border-color: rgba(218,165,32,0.9);
          box-shadow: 0 0 24px rgba(218,165,32,0.28);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ── Background ── */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, overflow: "hidden",
        background: "radial-gradient(ellipse at 25% 20%, #2a1f00 0%, #1a1200 55%, #0d0a00 100%)"
      }}>
        <div style={{ position: "absolute", top: "-15%", left: "-5%", width: 700, height: 700, background: "radial-gradient(circle, rgba(184,134,11,0.14) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(139,100,0,0.11) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "35%", left: "55%", width: 400, height: 400, background: "radial-gradient(circle, rgba(218,165,32,0.05) 0%, transparent 65%)", borderRadius: "50%" }} />

        {[...Array(35)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            width: (i % 3) + 1,
            height: (i % 3) + 1,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#ffd700" : "rgba(255,248,220,0.9)",
            opacity: 0.07 + (i % 5) * 0.07,
            animationName: "starTwinkle",
            animationDuration: `${2 + (i % 4)}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${(i * 0.3) % 4}s`,
          }} />
        ))}

        {petals.map((p) => (
          <Petal key={p.id} style={{
            left: `${p.left}%`,
            top: "-5%",
            width: p.size,
            height: p.size * 1.3,
            opacity: p.opacity,
            animation: `petalFall ${p.duration}s linear ${p.delay}s infinite`,
          }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 10.5, letterSpacing: "0.42em", color: "#6b5500", marginBottom: 10, textTransform: "uppercase" }}>
            ✦ Portfolio Assistant ✦
          </div>
          <h1 style={{
            fontSize: "clamp(2.2rem, 6vw, 3.4rem)",
            fontWeight: 300,
            fontStyle: "italic",
            letterSpacing: "0.04em",
            background: "linear-gradient(135deg, #fff8e1 0%, #ffd700 35%, #daa520 65%, #f5e6a0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1.1,
            marginBottom: 6,
          }}>
            Huma Shafique
          </h1>
          <p style={{ color: "#7a6530", fontSize: "1rem", fontStyle: "italic", letterSpacing: "0.08em" }}>
            ask me anything, darling ♡
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: "rgba(16, 12, 0, 0.94)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(218,165,32,0.18)",
          borderRadius: 32,
          padding: "36px 28px 28px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 40px 100px rgba(0,0,0,0.82), 0 0 80px rgba(184,134,11,0.07), inset 0 1px 0 rgba(255,215,0,0.06)",
          position: "relative",
          overflow: "hidden",
        }}>

          <div style={{ position: "absolute", top: 0, left: "5%", right: "5%", height: 1, background: "linear-gradient(90deg, transparent, rgba(218,165,32,0.75), rgba(255,215,0,0.4), transparent)" }} />
          <div style={{ position: "absolute", top: 16, left: 16, width: 20, height: 20, borderTop: "1.5px solid rgba(218,165,32,0.38)", borderLeft: "1.5px solid rgba(218,165,32,0.38)", borderRadius: "4px 0 0 0" }} />
          <div style={{ position: "absolute", top: 16, right: 16, width: 20, height: 20, borderTop: "1.5px solid rgba(218,165,32,0.38)", borderRight: "1.5px solid rgba(218,165,32,0.38)", borderRadius: "0 4px 0 0" }} />
          <div style={{ position: "absolute", bottom: 16, left: 16, width: 20, height: 20, borderBottom: "1.5px solid rgba(218,165,32,0.18)", borderLeft: "1.5px solid rgba(218,165,32,0.18)", borderRadius: "0 0 0 4px" }} />
          <div style={{ position: "absolute", bottom: 16, right: 16, width: 20, height: 20, borderBottom: "1.5px solid rgba(218,165,32,0.18)", borderRight: "1.5px solid rgba(218,165,32,0.18)", borderRadius: "0 0 4px 0" }} />

          {/* ── Avatar ── */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24, position: "relative" }}>
            <div style={{ position: "relative", width: 220, height: 220 }}>

              {isSpeaking && (
                <div style={{
                  position: "absolute", inset: -22, borderRadius: "50%",
                  border: "2px solid rgba(218,165,32,0.48)",
                  animation: "burstOut 1.8s ease-out infinite",
                }} />
              )}

              <div style={{
                position: "absolute", inset: -10, borderRadius: "50%",
                border: "1px dashed rgba(218,165,32,0.32)",
                animationName: "orbitCW",
                animationDuration: isSpeaking ? "2.5s" : "7s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }}>
                <div style={{
                  position: "absolute", top: -5, left: "50%", transform: "translateX(-50%)",
                  width: 9, height: 9, borderRadius: "50%",
                  background: isSpeaking ? "#ffd700" : "rgba(218,165,32,0.5)",
                  boxShadow: `0 0 ${isSpeaking ? "14px" : "6px"} #daa520`,
                  transition: "all 0.5s",
                }} />
              </div>

              <div style={{
                position: "absolute", inset: -26, borderRadius: "50%",
                border: "1px solid rgba(139,100,0,0.18)",
                animationName: "orbitCCW",
                animationDuration: isSpeaking ? "4s" : "11s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }}>
                <div style={{
                  position: "absolute", bottom: -4, left: "50%", transform: "translateX(-50%)",
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#b8860b", boxShadow: "0 0 8px #b8860b",
                }} />
              </div>

              <div style={{
                position: "absolute", inset: -10, borderRadius: "50%",
                animationName: "orbitCW",
                animationDuration: isSpeaking ? "3.5s" : "10s",
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
              }}>
                <div style={{
                  position: "absolute", left: -3, top: "50%", transform: "translateY(-50%)",
                  width: 5, height: 5, borderRadius: "50%",
                  background: "rgba(255,236,150,0.55)", boxShadow: "0 0 6px #ffd700",
                }} />
              </div>

              <div style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #1c1500, #080600)",
                border: `1.5px solid ${isSpeaking ? "rgba(218,165,32,0.68)" : isListening ? "rgba(218,165,32,0.42)" : "rgba(70,55,0,0.38)"}`,
                boxShadow: isSpeaking
                  ? "0 0 42px rgba(218,165,32,0.28), inset 0 0 20px rgba(184,134,11,0.07)"
                  : isListening
                    ? "0 0 22px rgba(218,165,32,0.14)"
                    : "0 0 20px rgba(0,0,0,0.5)",
                animationName: (isListening || isSpeaking) ? "ringBreath" : "none",
                animationDuration: "2.2s",
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
                overflow: "hidden",
                transition: "border-color 0.5s, box-shadow 0.5s",
              }}>
                <div style={{ transform: `translateY(${float}px)`, height: "100%", transition: "none" }}>
                  <GirlAvatar isSpeaking={isSpeaking} status={status} />
                </div>
              </div>
            </div>
          </div>

          {/* Status pill */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 20px", borderRadius: 20,
              background: "rgba(8, 6, 0, 0.88)",
              border: "1px solid rgba(218,165,32,0.13)",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                background: status === "connected" ? "#daa520" : status === "connecting" ? "#f5c842" : status === "error" ? "#cc4400" : "#2e2400",
                boxShadow: status === "connected" ? "0 0 10px #daa520" : status === "connecting" ? "0 0 10px #f5c842" : "none",
                animationName: status === "connecting" ? "ringBreath" : "none",
                animationDuration: "0.8s",
                animationIterationCount: "infinite",
              }} />
              <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 11, color: "#5c4800", letterSpacing: "0.08em" }}>
                {status === "idle" ? "ready when you are" :
                  status === "connecting" ? "waking up..." :
                    status === "error" ? "something went wrong" :
                      isSpeaking ? "huma is speaking ♪" :
                        isListening ? "listening..." : "connected"}
              </span>
            </div>
          </div>

          {/* Sound waves */}
          {status === "connected" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 28, marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <SoundWave active={isListening} color1="#7a5c00" color2="#daa520" />
                <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: "#3d3000", letterSpacing: "0.2em", textTransform: "uppercase" }}>you</span>
              </div>
              <div style={{ fontSize: 14, color: "rgba(218,165,32,0.28)" }}>✦</div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <SoundWave active={isSpeaking} color1="#daa520" color2="#fff8dc" />
                <span style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9, color: "#3d3000", letterSpacing: "0.2em", textTransform: "uppercase" }}>huma</span>
              </div>
            </div>
          )}

          {/* Bot speech bubble */}
          {lastBotText && status === "connected" && (
            <div className="bubble-in" style={{
              marginBottom: 10, padding: "14px 18px",
              background: "linear-gradient(135deg, rgba(218,165,32,0.07), rgba(139,100,0,0.05))",
              border: "1px solid rgba(218,165,32,0.18)",
              borderRadius: 18, borderTopLeftRadius: 6,
            }}>
              <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9.5, color: "#daa520", letterSpacing: "0.15em", marginBottom: 5, textTransform: "uppercase" }}>♡ Huma</div>
              <p style={{ fontSize: "0.97rem", color: "#f5ecd0", lineHeight: 1.6, fontStyle: "italic" }}>{lastBotText}</p>
            </div>
          )}

          {/* User speech bubble */}
          {lastUserText && status === "connected" && (
            <div className="bubble-in" style={{
              marginBottom: 20, padding: "14px 18px",
              background: "rgba(35, 26, 0, 0.3)",
              border: "1px solid rgba(139,100,0,0.22)",
              borderRadius: 18, borderTopRightRadius: 6,
              textAlign: "right",
            }}>
              <div style={{ fontFamily: "'Courier Prime', monospace", fontSize: 9.5, color: "#5c4800", letterSpacing: "0.15em", marginBottom: 5, textTransform: "uppercase" }}>you ♡</div>
              <p style={{ fontSize: "0.97rem", color: "#c8ad70", lineHeight: 1.6 }}>{lastUserText}</p>
            </div>
          )}

          {/* Error */}
          {err && (
            <div style={{ marginBottom: 16, padding: "12px 16px", background: "rgba(80,25,0,0.15)", border: "1px solid rgba(160,70,0,0.35)", borderRadius: 12 }}>
              <p style={{ fontSize: "0.88rem", color: "#e8b870" }}><strong>Error:</strong> {err}</p>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            {status !== "connected" ? (
              <button className="btn-start" onClick={startCall} disabled={status === "connecting"}>
                {status === "connecting" ? "✦ Connecting..." : "✦ Say Hello"}
              </button>
            ) : (
              <button className="btn-end" onClick={stopCall}>✦ End Session</button>
            )}
          </div>

          {/* Language tags */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["🇬🇧 English", "🇸🇦 Arabic", "🇵🇰 Urdu"].map((lang) => (
              <span key={lang} style={{
                fontFamily: "'Courier Prime', monospace", fontSize: 10,
                padding: "4px 12px", borderRadius: 20,
                border: "1px solid rgba(218,165,32,0.16)",
                color: "#5c4800", letterSpacing: "0.05em",
                background: "rgba(35,26,0,0.22)",
              }}>{lang}</span>
            ))}
          </div>

          {/* Log toggle */}
          <div style={{ textAlign: "center" }}>
            <button onClick={() => setShowLogs(!showLogs)} style={{ background: "none", border: "none", fontFamily: "'Courier Prime', monospace", fontSize: 10, color: "rgba(92,72,0,0.38)", cursor: "pointer", letterSpacing: "0.1em" }}>
              {showLogs ? "▲ hide logs" : "▼ debug logs"}
            </button>
          </div>

          {showLogs && logs.length > 0 && (
            <div style={{ marginTop: 10, background: "#060500", borderRadius: 10, padding: "10px 12px", maxHeight: 150, overflowY: "auto", border: "1px solid rgba(40,30,0,0.4)" }}>
              {logs.map((log, i) => (
                <div key={i} style={{ fontFamily: "'Courier Prime', monospace", fontSize: 10.5, color: i === logs.length - 1 ? "#7a6000" : "#2e2400", padding: "2px 0", borderBottom: "1px solid #0d0b00" }}>
                  {log}
                </div>
              ))}
            </div>
          )}

          <div style={{ position: "absolute", bottom: 0, left: "5%", right: "5%", height: 1, background: "linear-gradient(90deg, transparent, rgba(184,134,11,0.38), transparent)" }} />
        </div>

        <p style={{ marginTop: 22, fontFamily: "'Courier Prime', monospace", fontSize: 10, color: "rgba(92,72,0,0.42)", letterSpacing: "0.18em", textAlign: "center" }}>
          CONVAI · LIVEKIT · NEXT.JS
        </p>
      </div>
    </>
  );
}