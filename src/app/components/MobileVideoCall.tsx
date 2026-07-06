import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft, Video, Phone, MoreVertical, PhoneOff, Mic,
  MicOff, Send, X, MessageSquare, Camera, Hand, MonitorUp, VideoOff
} from "lucide-react";
import defaultImg from "../../assets/image.png";
import { StreamVideo } from "./StreamVideo";

const participantFallbacks = [defaultImg, defaultImg, defaultImg, defaultImg];


import { Message } from "../hooks/useWebRTCCall";

const PHONE_STYLE = {
  width: "375px",
  height: "760px",
  background: "#07080F",
  border: "1.5px solid rgba(99,102,241,0.2)",
  boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)",
};

const glass = { background: "rgba(7,8,15,0.7)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.06)" };

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

export function MobileVideoCall({
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
  const [msgText, setMsgText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [pip, setPip] = useState(true);
  const [timeStr, setTimeStr] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMsgCount = useRef(messages.length);

  const [pinnedId, setPinnedId] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length > prevMsgCount.current) {
      if (!showChat) {
        const newMessages = messages.slice(prevMsgCount.current);
        // Only count messages that aren't from "You"
        const unread = newMessages.filter(m => !m.isMe).length;
        if (unread > 0) setUnreadCount(c => c + unread);
      }
    }
    prevMsgCount.current = messages.length;
  }, [messages, showChat]);

  useEffect(() => {
    if (showChat) setUnreadCount(0);
  }, [showChat]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showChat || window.innerWidth >= 768) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showChat]);

  const handleSend = () => {
    if (msgText.trim()) {
      sendMessage(msgText.trim());
      setMsgText("");
    }
  };

  const remoteParticipants = remoteStreams.map((remoteStream, index) => ({
    id: remoteStream.id,
    stream: remoteStream.stream,
    img: participantFallbacks[index % participantFallbacks.length],
    name: remoteStream.name || `Guest ${index + 1}`,
    muted: !remoteStream.micOn,
    camOff: !remoteStream.camOn,
  }));

  const pinnedParticipant = pinnedId ? remoteParticipants.find(p => p.id === pinnedId) : null;

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="relative flex items-center justify-center w-full h-[100dvh] p-0 md:p-6 md:gap-6 overflow-hidden bg-[#07080F]">
      {/* ── Phone 1: Video call ── */}
      <div className="relative overflow-hidden flex flex-col shrink-0 w-full h-full md:w-[375px] md:h-[760px] md:rounded-[32px]" 
        style={{ 
          background: "#07080F",
          border: "1.5px solid rgba(99,102,241,0.2)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)"
        }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-xs font-medium" style={{ color: "#EEF1F8" }}>{fmt(seconds)}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-px items-end h-3">
              {[2,3,4,4,3].map((h,i) => (
                <div key={i} className="w-[3px] rounded-sm" style={{ height: `${h*2.5}px`, background: i < 4 ? "#EEF1F8" : "rgba(255,255,255,0.25)" }} />
              ))}
            </div>
            <svg width="15" height="10" viewBox="0 0 24 15" fill="none">
              <rect x="1" y="1" width="22" height="13" rx="2" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" />
              <rect x="3" y="3" width="15" height="9" rx="1" fill="white" />
              <rect x="23" y="5" width="2" height="5" rx="1" fill="white" fillOpacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={leaveCall} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/5">
              <ChevronLeft size={17} color="white" />
            </button>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#EEF1F8" }}>Room {roomId}</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-medium" style={{ color: "#F87171" }}>{fmt(seconds)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <span className="text-[9px] font-medium" style={{ color: "#818CF8" }}>{participantCount}</span>
            </div>
            <button onClick={() => setShowChat(true)} className="relative w-8 h-8 rounded-xl flex md:hidden items-center justify-center hover:bg-white/5">
              <MessageSquare size={15} color="white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#07080F]">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Video Grid or Pinned View */}
        <div className="flex-1 mx-3 mt-1 mb-3 flex flex-col gap-2 overflow-hidden animate-fade-in relative z-0">
          {remoteParticipants.length === 0 ? (
            <div className="relative rounded-2xl overflow-hidden flex items-center justify-center bg-black/35 w-full h-full border-[1.5px] border-white/10">
              <div className="rounded-2xl px-4 py-3 text-center" style={glass}>
                <p className="text-xs font-semibold text-[#EEF1F8]">Waiting for someone to join</p>
                <p className="text-[10px] mt-1 text-[#7E8BA3]">Share Room {roomId}.</p>
              </div>
            </div>
          ) : pinnedParticipant ? (
            /* Pinned Mode */
            <>
              <div 
                className="flex-1 relative rounded-2xl overflow-hidden cursor-pointer bg-[#11131A] flex items-center justify-center"
                onClick={() => setPinnedId(null)}
                style={{ border: "1.5px solid rgba(99,102,241,0.3)" }}
              >
                {pinnedParticipant.camOff ? (
                  <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center">
                    <img src={pinnedParticipant.img as string} alt={pinnedParticipant.name} className="w-20 h-20 rounded-full object-cover" />
                  </div>
                ) : (
                  <StreamVideo stream={pinnedParticipant.stream} fallbackSrc={pinnedParticipant.img as string} label={pinnedParticipant.name} className="absolute inset-0 w-full h-full object-contain bg-black" />
                )}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg" style={glass}>
                  <span className="text-xs font-medium" style={{ color: "#EEF1F8" }}>{pinnedParticipant.name}</span>
                </div>
              </div>
              <div className="h-24 shrink-0 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                {remoteParticipants.filter(p => p.id !== pinnedId).map(p => (
                  <div key={p.id}
                    onClick={() => setPinnedId(p.id)}
                    className="relative h-full aspect-[3/4] rounded-xl overflow-hidden shrink-0 cursor-pointer bg-[#11131A] flex items-center justify-center"
                    style={{ border: "1.5px solid rgba(255,255,255,0.1)" }}>
                    {p.camOff ? (
                      <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center">
                        <img src={p.img as string} alt={p.name} className="w-8 h-8 rounded-full object-cover" />
                      </div>
                    ) : (
                      <StreamVideo stream={p.stream} fallbackSrc={p.img as string} label={p.name} className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
                      <span className="text-[10px] block truncate" style={{ color: "rgba(255,255,255,0.9)" }}>{p.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Grid Mode */
            <div className={`w-full h-full grid gap-2 overflow-y-auto hide-scrollbar ${
              remoteParticipants.length <= 1 ? "grid-cols-1 grid-rows-1" :
              remoteParticipants.length === 2 ? "grid-cols-1 grid-rows-2" :
              remoteParticipants.length <= 4 ? "grid-cols-2 grid-rows-2" :
              remoteParticipants.length <= 6 ? "grid-cols-2 grid-rows-3" :
              "grid-cols-2 auto-rows-[33%]"
            }`}>
              {remoteParticipants.map((p) => (
                <div key={p.id} className="relative rounded-2xl overflow-hidden w-full h-full bg-[#11131A] cursor-pointer min-h-[140px] flex items-center justify-center"
                  onClick={() => setPinnedId(p.id)}
                  style={{ border: "1.5px solid rgba(255,255,255,0.08)" }}>
                  {p.camOff ? (
                    <div className="w-full h-full bg-[#1A1D24] flex items-center justify-center">
                      <img src={p.img as string} alt={p.name} className="w-16 h-16 rounded-full object-cover" />
                    </div>
                  ) : (
                    <StreamVideo stream={p.stream} fallbackSrc={p.img as string} label={p.name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 h-12" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }} />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1.5">
                    <span className="block truncate text-[11px] font-medium text-white/90 drop-shadow-md">{p.name}</span>
                    <div className="flex items-center gap-1">
                      {p.camOff && <VideoOff size={10} style={{ color: "#EF4444" }} />}
                      {p.muted && <MicOff size={10} style={{ color: "#EF4444" }} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-3 px-5 pointer-events-none">
          <div className="flex items-center justify-center gap-3 pointer-events-auto">
            <button className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:brightness-110"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", opacity: 0.4, cursor: "not-allowed" }}
            title="Raise Hand (coming soon)">
            <Hand size={17} color="white" />
          </button>
          <button onClick={toggleCamera} className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:brightness-110"
            style={{ background: camOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.15)", border: `1px solid ${camOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.3)"}` }}>
            <Camera size={17} color={camOn ? "white" : "#EF4444"} />
          </button>
          <button onClick={leaveCall} className="w-14 h-11 rounded-2xl flex items-center justify-center hover:brightness-110 transition-all"
            style={{ background: "#EF4444" }}>
            <PhoneOff size={19} color="white" />
          </button>
          <button onClick={toggleMic}
            className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:brightness-110"
            style={{ background: micOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.15)", border: `1px solid ${micOn ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.3)"}` }}>
            {micOn ? <Mic size={17} color="white" /> : <MicOff size={17} color="#EF4444" />}
          </button>
          <button onClick={() => alert("Screen sharing is not supported on mobile browsers. Please use the desktop version for this feature.")} className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:brightness-110"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)" }}
            title="Share Screen">
            <MonitorUp size={17} color="white" />
          </button>
          </div>
        </div>

        {/* PiP self view */}
        {pip && (
          <div className="absolute top-[158px] right-4 w-[80px] h-[108px] rounded-2xl overflow-hidden z-20"
            style={{ border: "1.5px solid rgba(99,102,241,0.35)", boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
            <StreamVideo stream={localStream} fallbackSrc={defaultImg} label="Your video" muted className="w-full h-full object-cover" />
            <button onClick={() => setPip(false)}
              className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.7)" }}>
              <X size={8} color="white" />
            </button>
          </div>
        )}
      </div>

      {/* ── Phone 2: Chat ── */}
      <div className={`absolute md:relative top-0 right-0 w-full h-full md:w-[375px] md:h-[760px] md:rounded-[32px] flex flex-col shrink-0 z-50 md:z-auto transition-all duration-300 md:transition-none ${showChat ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none"} md:translate-x-0 md:opacity-100 md:pointer-events-auto`} 
        style={{ 
          background: "#07080F",
          border: "1.5px solid rgba(99,102,241,0.2)",
          boxShadow: "-24px 0 60px rgba(0,0,0,0.8)"
        }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1 shrink-0">
          <span className="text-xs font-medium" style={{ color: "#EEF1F8" }}>{timeStr || "12:00"}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-px items-end h-3">
              {[2,3,4,4,3].map((h,i) => (
                <div key={i} className="w-[3px] rounded-sm" style={{ height: `${h*2.5}px`, background: "#EEF1F8" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowChat(false)} className="w-8 h-8 rounded-xl flex md:hidden items-center justify-center hover:bg-white/5">
              <ChevronLeft size={17} color="white" />
            </button>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#EEF1F8" }}>Room {roomId}</p>
              <p className="text-[9px]" style={{ color: "#7E8BA3" }}>{status}</p>
            </div>
          </div>
          <div className="flex items-center gap-3" style={{ opacity: 0.4, cursor: "not-allowed" }} title="Coming soon">
            <Video size={16} style={{ color: "#7E8BA3" }} />
            <Phone size={16} style={{ color: "#7E8BA3" }} />
            <MoreVertical size={16} style={{ color: "#7E8BA3" }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-2 gap-1 shrink-0 mb-1"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button className="px-3 pb-2 text-xs transition-all"
            style={{ color: "#818CF8", borderBottom: "2px solid #6366F1" }}>
            Chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-0">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "items-start gap-2.5"}`}>
              {!msg.isMe && (
                msg.avatar ? (
                  <img src={msg.avatar} alt={msg.sender} className="w-6 h-6 rounded-full object-cover shrink-0 mt-3.5" />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-3.5 text-[9px] font-semibold text-white"
                    style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.35)" }}>
                    {msg.sender[0]?.toUpperCase() || "G"}
                  </div>
                )
              )}
              <div className={`flex flex-col ${msg.isMe ? "items-end" : ""}`} style={{ maxWidth: "72%" }}>
                <span className="text-[10px] mb-1" style={{ color: "#7E8BA3" }}>{msg.sender}</span>
                <div className="px-3 py-2 rounded-2xl animate-fade-in"
                  style={msg.isMe
                    ? { background: "rgba(99,102,241,0.2)", borderBottomRightRadius: "4px", border: "1px solid rgba(99,102,241,0.2)" }
                    : { background: "rgba(255,255,255,0.05)", borderBottomLeftRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }
                  }>
                  <p className="text-xs leading-relaxed" style={{ color: "#EEF1F8" }}>{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px]" style={{ color: "#404B63" }}>{msg.time}</span>
                  {msg.isMe && (
                    <svg width="12" height="7" viewBox="0 0 14 8" fill="none">
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
        <div className="px-4 pb-8 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <input
              type="text"
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Send a message…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-[#404B63]"
              style={{ color: "#EEF1F8" }}
            />
            <button
              onClick={handleSend}
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-all hover:brightness-110 active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              <Send size={11} color="white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
