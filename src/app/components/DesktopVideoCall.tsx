import { useState, useEffect, useRef } from "react";
import {
  Camera, PhoneOff, Mic, MicOff, Send, MessageSquare,
  Users, UserPlus, Subtitles, Hand,
  MonitorUp, Smile, VideoOff, ArrowRight
} from "lucide-react";
import { getAuthUser } from "../lib/auth";
import defaultImg from "../../assets/image.png";
import { StreamVideo } from "./StreamVideo";


const participantFallbacks = [defaultImg, defaultImg, defaultImg, defaultImg];

import { Message } from "../hooks/useWebRTCCall";

const glass = { background: "rgba(7,8,15,0.65)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.07)" };
const surfacePanel = { background: "rgba(13,17,23,0.98)", borderLeft: "1px solid rgba(255,255,255,0.05)" };

type VideoCallProps = {
  roomId: string;
  localStream: MediaStream | null;
  remoteStreams: { id: string; stream: MediaStream; name?: string; camOn?: boolean; micOn?: boolean }[];
  participantCount: number;
  status: string;
  micOn: boolean;
  camOn: boolean;
  toggleMic: () => void;
  toggleCamera: () => void;
  leaveCall: () => void;
  messages: Message[];
  sendMessage: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  isScreenSharing: boolean;
  toggleScreenShare: () => void;
  endCallForAll: () => void;
};


function CtrlBtn({ children, label, danger = false, onClick }: { children: React.ReactNode; label: string; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      title={label}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 group"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all group-hover:brightness-125"
        style={danger
          ? { background: "#EF4444" }
          : { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.08)" }
        }
      >
        {children}
      </div>
      <span className="absolute -top-7 text-[10px] px-2 py-1 rounded bg-[#0D1117] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ color: "rgba(255,255,255,0.8)" }}>
        {label}
      </span>
    </button>
  );
}

export function DesktopVideoCall({
  roomId,
  localStream,
  remoteStreams,
  participantCount,
  status,
  micOn,
  camOn,
  toggleMic,
  toggleCamera,
  leaveCall,
  messages,
  sendMessage,
  isRecording,
  startRecording,
  stopRecording,
  isScreenSharing,
  toggleScreenShare,
  endCallForAll
}: VideoCallProps) {
  const [panel, setPanel] = useState<"chat" | "people">("chat");
  const [msgText, setMsgText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleSend = () => {
    if (msgText.trim()) {
      sendMessage(msgText.trim());
      setMsgText("");
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const authUser = getAuthUser();

  const remoteParticipants = remoteStreams.map((remoteStream, index) => {
    return {
      id: remoteStream.id,
      stream: remoteStream.stream,
      img: participantFallbacks[index % participantFallbacks.length],
      name: remoteStream.name || `Guest ${index + 1}`,
      muted: !remoteStream.micOn,
      camOff: !remoteStream.camOn,
    };
  });

  const allParticipants = [
    ...remoteParticipants,
    { id: "self", stream: localStream, img: authUser?.avatarUrl || defaultImg, name: "You", muted: !micOn, camOff: !camOn }
  ];

  const pinnedParticipant = pinnedId ? allParticipants.find(p => p.id === pinnedId) : null;
  const sideParticipants = pinnedParticipant ? allParticipants.filter(p => p.id !== pinnedId) : [];

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1 grid-rows-1";
    if (count === 2) return "grid-cols-2 grid-rows-1";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    if (count <= 9) return "grid-cols-3 grid-rows-3";
    if (count <= 12) return "grid-cols-4 grid-rows-3";
    return "grid-cols-4 grid-rows-4"; // 16 max for standard view, can scroll if needed
  };

  return (
    <div className="flex size-full min-h-screen overflow-hidden" style={{ background: "#07080F" }}>
      {/* ── Video area ── */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3" style={glass}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: "#EEF1F8" }}>Room {roomId}</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <Users size={11} style={{ color: "#818CF8" }} />
              <span className="text-xs" style={{ color: "#818CF8" }}>{participantCount}</span>
            </div>
            <span className="hidden lg:inline text-xs" style={{ color: "#7E8BA3" }}>{status}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* REC */}
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all hover:brightness-110 cursor-pointer"
              style={isRecording 
                ? { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              {isRecording ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
              <span className="text-xs font-medium" style={isRecording ? { color: "#F87171" } : { color: "#EEF1F8" }}>
                {isRecording ? `REC ${fmt(seconds)}` : "Record"}
              </span>
            </button>
            {/* Add user */}
            <button onClick={() => { 
                navigator.clipboard.writeText(`${window.location.origin}/call/${roomId}`); 
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all hover:brightness-110"
              style={{ background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)", color: copied ? "#4ADE80" : "#EEF1F8", border: "1px solid rgba(255,255,255,0.08)" }}>
              <UserPlus size={13} /> {copied ? "Copied!" : "Invite"}
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="absolute inset-0 pt-16 pb-4 px-4 w-full h-full flex">
          {pinnedParticipant ? (
            /* Pinned Mode */
            <div className="w-full h-full flex gap-4">
              <div 
                className="flex-1 relative rounded-2xl overflow-hidden cursor-pointer bg-[#11131A] flex items-center justify-center"
                onClick={() => setPinnedId(null)}
                style={{ border: "1.5px solid rgba(99,102,241,0.3)" }}
              >
                {pinnedParticipant.camOff ? (
                  <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center">
                    <img src={pinnedParticipant.img as string} alt={pinnedParticipant.name} className="w-24 h-24 rounded-full object-cover" />
                  </div>
                ) : (
                  <StreamVideo stream={pinnedParticipant.stream} fallbackSrc={pinnedParticipant.img as string} label={pinnedParticipant.name} className="w-full h-full object-contain bg-black" muted={pinnedParticipant.id === "self"} />
                )}
                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg" style={glass}>
                  <span className="text-sm font-medium" style={{ color: "#EEF1F8" }}>{pinnedParticipant.name}</span>
                </div>
              </div>
              <div className="w-[180px] shrink-0 h-full overflow-y-auto flex flex-col gap-3 pr-1 hide-scrollbar">
                {sideParticipants.map((p) => (
                  <div key={p.id}
                    onClick={() => setPinnedId(p.id)}
                    className="relative w-full aspect-video rounded-xl overflow-hidden transition-all cursor-pointer hover:ring-2 ring-[#818CF8] bg-[#11131A] flex items-center justify-center"
                    style={{ border: "1.5px solid rgba(255,255,255,0.1)" }}>
                    {p.camOff ? (
                    <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center">
                      <img src={p.img as string} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                    </div>
                  ) : (
                    <StreamVideo stream={p.stream} fallbackSrc={p.img as string} label={p.name} className="w-full h-full object-cover" muted={p.id === "self"} />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.9)" }}>{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid Mode */
            <div className={`w-full h-full grid gap-4 ${getGridClass(allParticipants.length)}`}>
              {allParticipants.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setPinnedId(p.id)}
                  className="relative rounded-2xl overflow-hidden cursor-pointer hover:ring-2 ring-[#818CF8] bg-[#11131A] transition-all flex items-center justify-center"
                  style={{ border: "1.5px solid rgba(255,255,255,0.08)" }}
                >
                  {p.camOff ? (
                    <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center">
                      <img src={p.img as string} alt={p.name} className="w-16 h-16 rounded-full object-cover" />
                    </div>
                  ) : (
                    <StreamVideo stream={p.stream} fallbackSrc={p.img as string} label={p.name} className="w-full h-full object-cover" muted={p.id === "self"} />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                    style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                    <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>{p.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Control bar */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-end gap-3 px-6 py-3 rounded-2xl" style={glass}>
            <CtrlBtn label={micOn ? "Mute" : "Unmute"} onClick={toggleMic}>
              {micOn
                ? <Mic size={18} color="white" />
                : <MicOff size={18} color="#EF4444" />
              }
            </CtrlBtn>
            <CtrlBtn label="Cam" onClick={toggleCamera}>
              {camOn ? <Camera size={20} color="white" /> : <div className="text-red-500"><VideoOff size={20} /></div>}
            </CtrlBtn>
            <CtrlBtn label={isScreenSharing ? "Stop sharing" : "Share screen"} onClick={toggleScreenShare}>
              {isScreenSharing ? <MonitorUp size={18} color="#EF4444" /> : <MonitorUp size={18} color="white" />}
            </CtrlBtn>
            <div style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">
              <CtrlBtn label="Reactions">
                <Smile size={18} color="white" />
              </CtrlBtn>
            </div>
            <div style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">
              <CtrlBtn label="Raise hand">
                <Hand size={18} color="white" />
              </CtrlBtn>
            </div>
            <div style={{ opacity: 0.4, cursor: 'not-allowed' }} title="Coming soon">
              <CtrlBtn label="Captions">
                <Subtitles size={18} color="white" />
              </CtrlBtn>
            </div>

            {/* Panel Toggle */}
            <CtrlBtn label={showPanel ? "Hide panel" : "Show panel"} onClick={() => setShowPanel(prev => !prev)}>
              <MessageSquare size={18} color={showPanel ? "#818CF8" : "white"} />
            </CtrlBtn>

            {/* Divider */}
            <div className="w-px h-10 self-start mt-0.5 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />

            {/* End call */}
            <CtrlBtn label="Leave" danger onClick={leaveCall}>
              <ArrowRight size={18} color="white" />
            </CtrlBtn>
          </div>
        </div>
      </div>

      {/* ── Side panel ── */}
      {showPanel && (
        <div className="w-[340px] shrink-0 flex flex-col" style={surfacePanel}>
          {/* Panel header tabs */}
        <div className="flex items-center px-4 pt-4 pb-2 gap-1 shrink-0">
          {(["chat", "people"] as const).map((t) => (
            <button key={t} onClick={() => setPanel(t)}
              className="flex items-center gap-2 flex-1 justify-center py-2 rounded-xl text-sm transition-all capitalize"
              style={panel === t
                ? { background: "rgba(99,102,241,0.12)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.2)" }
                : { color: "#7E8BA3" }}>
              {t === "chat" ? <MessageSquare size={14} /> : <Users size={14} />}
              {t === "chat" ? "Chat" : `People (${participantCount})`}
            </button>
          ))}
        </div>

        {panel === "chat" ? (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 px-4 mt-2 mb-3 shrink-0">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
              <span className="text-xs" style={{ color: "#404B63" }}>Messages</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-4 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "items-start gap-2.5"}`}>
                  {!msg.isMe && (
                    msg.avatar ? (
                      <img src={msg.avatar} alt={msg.sender} className="w-7 h-7 rounded-full object-cover shrink-0 mt-4" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-4 text-[10px] font-semibold text-white"
                        style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.35)" }}>
                        {msg.sender[0]?.toUpperCase() || "G"}
                      </div>
                    )
                  )}
                  <div className={`flex flex-col ${msg.isMe ? "items-end" : ""}`} style={{ maxWidth: "78%" }}>
                    <span className="text-xs mb-1" style={{ color: "#7E8BA3" }}>{msg.sender}</span>
                    <div className="px-3 py-2 rounded-2xl"
                      style={msg.isMe
                        ? { background: "rgba(99,102,241,0.2)", borderBottomRightRadius: "4px", border: "1px solid rgba(99,102,241,0.2)" }
                        : { background: "rgba(255,255,255,0.05)", borderBottomLeftRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }
                      }>
                      <p className="text-sm leading-relaxed" style={{ color: "#EEF1F8" }}>{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px]" style={{ color: "#404B63" }}>{msg.time}</span>
                      {msg.isMe && (
                        <svg width="13" height="7" viewBox="0 0 14 8" fill="none">
                          <path d="M1 4L4 7L9 1M5 4L8 7L13 1" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="h-2 shrink-0" />

            {/* Input */}
            <div className="px-4 pb-4 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>

                <input
                  type="text"
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Send a message…"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#404B63]"
                  style={{ color: "#EEF1F8" }}
                />
                <button
                  onClick={handleSend}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
                  <Send size={13} color="white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* People panel */
          <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 min-h-0">
            {[...remoteParticipants, { id: "self", img: authUser?.avatarUrl || defaultImg, name: "You", muted: !micOn, camOff: !camOn }].map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/[0.03]">
                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                  <img src={p.img as string} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <span className="flex-1 text-sm" style={{ color: "#EEF1F8" }}>{p.name}</span>
                <div className="flex items-center gap-2">
                  {p.camOff ? (
                    <VideoOff size={13} style={{ color: "#EF4444" }} title="Camera Off" />
                  ) : (
                    <Camera size={13} style={{ color: "#7E8BA3" }} title="Camera On" />
                  )}
                  {p.muted ? (
                    <MicOff size={13} style={{ color: "#EF4444" }} title="Muted" />
                  ) : (
                    <Mic size={13} style={{ color: "#7E8BA3" }} title="Unmuted" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
