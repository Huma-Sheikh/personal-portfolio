"use client";

import { useRef, useState } from "react";

type ConvaiConnectResponse = {
  session_id: string;
  character_session_id: string;
  room_url: string;
  room_name: string;
  token: string;
};

export default function Home() {
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [characterSessionId, setCharacterSessionId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const roomRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);
  const remoteAudioElements = useRef<HTMLAudioElement[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev.slice(-10), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  async function startCall() {
    setErr(null);
    setStatus("connecting");
    setDebugInfo("");
    setLogs([]);

    try {
      addLog("🔄 Requesting connection from server...");
      
      const connectResp = await fetch("/api/convai/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_session_id: characterSessionId }),
      });

      const data = await connectResp.json();

      if (!connectResp.ok) {
        throw new Error(data.error?.message || JSON.stringify(data.error) || "Failed to connect");
      }

      const { room_url, room_name, token, character_session_id } = data as ConvaiConnectResponse;
      
      addLog(`✅ Got room: ${room_name}`);
      setCharacterSessionId(character_session_id);

      const livekit = await import("livekit-client");
      const { Room, RoomEvent, Track, createLocalAudioTrack } = livekit;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // ===== CRITICAL: Track all participant events =====
      room.on(RoomEvent.ParticipantConnected, (participant: any) => {
        addLog(`👤 Participant joined: ${participant.identity}`);
      });

      room.on(RoomEvent.TrackPublished, (publication: any, participant: any) => {
        addLog(`📢 Track published by ${participant.identity}: ${publication.kind} (${publication.source})`);
      });

      room.on(RoomEvent.TrackSubscribed, async (
        track: any,
        publication: any,
        participant: any
      ) => {
        addLog(`🎧 Track subscribed: ${track.kind} from ${participant.identity}`);

        if (track.kind === Track.Kind.Audio) {
          addLog("🔊 AUDIO TRACK RECEIVED - Attaching...");
          
          try {
            const audioElement = track.attach() as HTMLAudioElement;
            audioElement.autoplay = true;
            audioElement.volume = 1.0;
            audioElement.muted = false;
            
            // CRITICAL: Must append to DOM for some browsers
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
            
            addLog("🔊 Audio element created and appended to DOM");

            // Force play
            try {
              await audioElement.play();
              addLog("✅ AUDIO PLAYING!");
              setIsSpeaking(true);
            } catch (playErr: any) {
              addLog(`❌ Autoplay blocked: ${playErr.message}`);
              addLog("⚠️ Click anywhere to enable audio");
              
              // Retry on next user click
              const enableAudio = async () => {
                try {
                  await audioElement.play();
                  addLog("✅ Audio enabled after click");
                  setIsSpeaking(true);
                  document.removeEventListener('click', enableAudio);
                } catch (e) {
                  addLog(`❌ Still can't play: ${e}`);
                }
              };
              document.addEventListener('click', enableAudio);
            }

            audioElement.onplay = () => {
              addLog("▶️ Audio started playing");
              setIsSpeaking(true);
            };

            audioElement.onended = () => {
              addLog("🔇 Audio finished");
              setIsSpeaking(false);
            };

            audioElement.onerror = (e) => {
              addLog(`❌ Audio error: ${e}`);
            };

            remoteAudioElements.current.push(audioElement);
          } catch (attachErr: any) {
            addLog(`❌ Failed to attach audio: ${attachErr.message}`);
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: any, publication: any, participant: any) => {
        addLog(`🔇 Track unsubscribed: ${track.kind}`);
        setIsSpeaking(false);
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant: any) => {
        const text = new TextDecoder().decode(payload);
        addLog(`📦 Data: ${text}`);
      });

      room.on(RoomEvent.Disconnected, (reason?: any) => {
        addLog(`🔌 Disconnected: ${reason || 'unknown'}`);
        setStatus("idle");
        setIsListening(false);
        setIsSpeaking(false);
      });

      room.on(RoomEvent.ConnectionQualityChanged, (quality: any, participant: any) => {
        addLog(`📶 Quality: ${quality} for ${participant.identity}`);
      });

      addLog("🔗 Connecting to LiveKit room...");
      await room.connect(room_url, token);
      addLog("✅ Connected to room!");

      // Log all participants
      room.remoteParticipants.forEach((participant: any) => {
        addLog(`👥 Remote participant: ${participant.identity}`);
      });

      addLog("🎤 Creating microphone track...");
      const localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      
      localTrackRef.current = localAudioTrack;
      
      addLog("📤 Publishing microphone...");
      await room.localParticipant.publishTrack(localAudioTrack);
      addLog("✅ Microphone published - start speaking!");

      setStatus("connected");
      setIsListening(true);
      setDebugInfo("🎤 Say something...");

    } catch (e: any) {
      addLog(`❌ ERROR: ${e.message}`);
      setErr(e?.message || String(e));
      setStatus("error");
      setIsListening(false);
      setIsSpeaking(false);
      
      if (localTrackRef.current) {
        localTrackRef.current.stop();
        localTrackRef.current = null;
      }
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    }
  }

  async function stopCall() {
    try {
      addLog("🛑 Stopping call...");
      
      if (localTrackRef.current) {
        localTrackRef.current.stop();
        localTrackRef.current = null;
      }

      remoteAudioElements.current.forEach(el => {
        el.pause();
        el.remove();
      });
      remoteAudioElements.current = [];

      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    } finally {
      setStatus("idle");
      setDebugInfo("");
      setIsListening(false);
      setIsSpeaking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Vodafone Customer Support
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Real-time AI voice conversation
        </p>

        <div className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
            <div
              className={`w-3 h-3 rounded-full ${
                status === "connected"
                  ? "bg-green-500 animate-pulse"
                  : status === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : status === "error"
                  ? "bg-red-500"
                  : "bg-gray-300"
              }`}
            />
            <span className="text-sm font-medium text-gray-700 capitalize">
              {status === "idle" ? "Ready" : status}
            </span>
          </div>

          {/* Audio indicators */}
          {status === "connected" && (
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border-2 ${isListening ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">🎤</div>
                  <div className="text-xs font-medium text-gray-700">
                    {isListening ? "Listening" : "Muted"}
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg border-2 ${isSpeaking ? 'bg-green-50 border-green-300 animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔊</div>
                  <div className="text-xs font-medium text-gray-700">
                    {isSpeaking ? "AI Speaking" : "Silent"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debug info */}
          {debugInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">{debugInfo}</p>
            </div>
          )}

          {/* Error message */}
          {err && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 break-words">
                <strong>Error:</strong> {err}
              </p>
            </div>
          )}

          {/* Session ID */}
          {characterSessionId && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>Session:</strong> {characterSessionId.slice(0, 30)}...
              </p>
            </div>
          )}

          {/* Live logs */}
          {logs.length > 0 && (
            <div className="p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-xs max-h-60 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))}
            </div>
          )}

          {/* Call controls */}
          <div className="flex gap-3">
            {status !== "connected" ? (
              <button
                onClick={startCall}
                disabled={status === "connecting"}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed shadow-lg"
              >
                {status === "connecting" ? "Connecting..." : "🎤 Start Call"}
              </button>
            ) : (
              <button
                onClick={stopCall}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                🔴 End Call
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠️ Important:
            </h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• If you see "Autoplay blocked", <strong>click anywhere</strong> to enable audio</li>
              <li>• Check the live logs above to see what's happening</li>
              <li>• Look for "🔊 AUDIO TRACK RECEIVED" in logs</li>
              <li>• Make sure your character has "Live API" enabled in Convai dashboard</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}