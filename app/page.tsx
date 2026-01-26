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
  const [detectedLanguage, setDetectedLanguage] = useState<string>("Waiting...");
  
  const roomRef = useRef<any>(null);
  const localTrackRef = useRef<any>(null);
  const remoteAudioElements = useRef<HTMLAudioElement[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  async function startCall() {
    setErr(null);
    setStatus("connecting");
    setDebugInfo("");
    setLogs([]);
    setDetectedLanguage("Waiting...");

    try {
      addLog("🔄 Requesting multilingual connection...");
      
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

      room.on(RoomEvent.ParticipantConnected, (participant: any) => {
        addLog(`👤 Participant joined: ${participant.identity}`);
      });

      room.on(RoomEvent.TrackPublished, (publication: any, participant: any) => {
        addLog(`📢 Track published by ${participant.identity}`);
      });

      room.on(RoomEvent.TrackSubscribed, async (
        track: any,
        publication: any,
        participant: any
      ) => {
        addLog(`🎧 Track subscribed: ${track.kind} from ${participant.identity}`);

        if (track.kind === Track.Kind.Audio) {
          addLog("🔊 AUDIO TRACK - Creating audio element");
          
          try {
            const audioElement = track.attach() as HTMLAudioElement;
            audioElement.autoplay = true;
            audioElement.volume = 1.0;
            audioElement.muted = false;
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
            
            addLog("✅ Audio element attached to DOM");

            try {
              await audioElement.play();
              addLog("▶️ AUDIO PLAYING!");
              setIsSpeaking(true);
            } catch (playErr: any) {
              addLog(`⚠️ Autoplay blocked: ${playErr.message}`);
              addLog("👆 Click anywhere to enable audio");
              
              const enableAudio = async () => {
                try {
                  await audioElement.play();
                  addLog("✅ Audio enabled!");
                  setIsSpeaking(true);
                  document.removeEventListener('click', enableAudio);
                } catch (e: any) {
                  addLog(`❌ Still blocked: ${e.message}`);
                }
              };
              document.addEventListener('click', enableAudio);
            }

            audioElement.onplay = () => {
              setIsSpeaking(true);
            };

            audioElement.onended = () => {
              setIsSpeaking(false);
            };

            audioElement.onpause = () => {
              setIsSpeaking(false);
            };

            audioElement.onerror = (e) => {
              addLog(`❌ Audio error: ${e}`);
              setIsSpeaking(false);
            };

            remoteAudioElements.current.push(audioElement);
          } catch (attachErr: any) {
            addLog(`❌ Failed to attach audio: ${attachErr.message}`);
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: any) => {
        if (track.kind === Track.Kind.Audio) {
          setIsSpeaking(false);
        }
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant: any) => {
        const text = new TextDecoder().decode(payload);
        
        try {
          const data = JSON.parse(text);
          
          // Bot transcription
          if (data.type === "bot-transcription" && data.data?.text) {
            const botText = data.data.text;
            const botLang = data.data.language || "unknown";
            addLog(`🤖 BOT [${botLang}]: ${botText}`);
          }
          
          // User transcription - THIS IS WHERE LANGUAGE IS DETECTED
          if (data.type === "user-transcription" && data.data?.text) {
            const userText = data.data.text;
            const userLang = data.data.language || "unknown";
            
            // Update detected language
            const langMap: any = {
              "ar": "العربية (Arabic)",
              "ar-SA": "العربية السعودية",
              "en": "English",
              "en-US": "English (US)",
              "ur": "اردو (Urdu)",
              "ur-PK": "اردو (پاکستان)"
            };
            
            const displayLang = langMap[userLang] || userLang;
            setDetectedLanguage(displayLang);
            
            addLog(`👤 YOU [${displayLang}]: ${userText}`);
          }
          
        } catch (e) {
          // Not JSON, ignore
        }
      });

      room.on(RoomEvent.Disconnected, (reason?: any) => {
        addLog(`🔌 Disconnected: ${reason || 'unknown'}`);
        setStatus("idle");
        setIsListening(false);
        setIsSpeaking(false);
      });

      addLog("🔗 Connecting to LiveKit room...");
      await room.connect(room_url, token);
      addLog("✅ Connected to room!");
      
      // NOTE: Language is configured in Convai Dashboard, not via LiveKit
      addLog("ℹ️ Using language settings from Convai character dashboard");

      addLog("🎤 Creating microphone track...");
      
      // Optimal audio settings for multilingual recognition
      const localAudioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 1,
      });
      
      localTrackRef.current = localAudioTrack;
      
      addLog("📤 Publishing microphone...");
      await room.localParticipant.publishTrack(localAudioTrack, {
        dtx: false,
        source: Track.Source.Microphone,
      });
      
      addLog("✅ Microphone active!");
      addLog("🗣️ Speak in your configured language");

      setStatus("connected");
      setIsListening(true);
      setDebugInfo("🌍 Language set in Convai Dashboard");

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
      setDetectedLanguage("Waiting...");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          Doha Bank Assistant
        </h1>
        <p className="text-gray-600 text-center mb-6">
          🌍 Multilingual Auto-Detection
        </p>

        <div className="space-y-4">
          {/* Status Indicator */}
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

          {/* Language Detection Display */}
          {status === "connected" && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg">
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  DETECTED LANGUAGE
                </div>
                <div className="text-xl font-bold text-blue-700">
                  {detectedLanguage}
                </div>
              </div>
            </div>
          )}

          {/* Audio Status */}
          {status === "connected" && (
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-lg border-2 transition-all ${isListening ? 'bg-blue-50 border-blue-400 shadow-lg' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">🎤</div>
                  <div className="text-xs font-medium text-gray-700">
                    {isListening ? "Listening" : "Muted"}
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-lg border-2 transition-all ${isSpeaking ? 'bg-green-50 border-green-400 shadow-lg animate-pulse' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔊</div>
                  <div className="text-xs font-medium text-gray-700">
                    {isSpeaking ? "AI Speaking" : "Silent"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 text-center font-medium">{debugInfo}</p>
            </div>
          )}

          {/* Error Display */}
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

          {/* Logs */}
          {logs.length > 0 && (
            <div className="p-3 bg-gray-900 text-green-400 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
              {logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))}
            </div>
          )}

          {/* Call Controls */}
          <div className="flex gap-3">
            {status !== "connected" ? (
              <button
                onClick={startCall}
                disabled={status === "connecting"}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {status === "connecting" ? "Connecting..." : "🎤 Start Call"}
              </button>
            ) : (
              <button
                onClick={stopCall}
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🔴 End Call
              </button>
            )}
          </div>

          {/* Usage Instructions */}
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg">
            <h3 className="text-sm font-bold text-amber-900 mb-3 text-center">
              🌍 Multilingual Voice Assistant
            </h3>
            <ul className="text-xs text-amber-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">1.</span>
                <span><strong>Click "Start Call"</strong> to begin</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">2.</span>
                <span><strong>Speak naturally</strong> in Arabic (العربية), English, or Urdu (اردو)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">3.</span>
                <span><strong>Language auto-detected</strong> - no need to specify</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">4.</span>
                <span><strong>AI responds</strong> in the same language you use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold min-w-[20px]">5.</span>
                <span>Check logs below to see detected language</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}