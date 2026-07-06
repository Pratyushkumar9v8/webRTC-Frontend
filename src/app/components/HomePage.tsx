import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Video, Link2, Plus, Users, ArrowRight, Copy, Check, Clock, Shield, Sparkles } from "lucide-react";
import { getAuthUser, getInitials } from "../lib/auth";
import { API_URL } from "../lib/config";

function generateCode() {
  const s = () => Math.random().toString(36).slice(2, 5);
  return `${s()}-${s()}-${s()}`;
}

const surface = { 
  background: "rgba(255, 255, 255, 0.02)", 
  border: "1px solid rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(16px)"
};

export function HomePage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [newCode] = useState(generateCode);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"new" | "join">("new");
  const authUser = getAuthUser();
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);
  const [allMeetingsCount, setAllMeetingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/users/get_all_activity`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setAllMeetingsCount(data.length);
          const formatted = data.slice(0, 3).map((item: any) => {
            const dateObj = new Date(item.created_at);
            
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            
            let dateStr = "";
            if (dateObj.toDateString() === today.toDateString()) {
              dateStr = `Today, ${dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
            } else if (dateObj.toDateString() === yesterday.toDateString()) {
              dateStr = `Yesterday, ${dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
            } else {
              dateStr = `${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
            }

            return {
              id: item.id.toString(),
              name: `Meeting: ${item.meeting_code}`,
              meetingCode: item.meeting_code,
              date: dateStr,
            };
          });
          setRecentMeetings(formatted);
        }
      } catch (err) {
        console.error("Error fetching recent meetings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const copy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/call/${newCode}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startMeeting = () => navigate(`/call/${newCode}`);
  const joinMeeting = () => {
    let normalizedCode = joinCode.trim();
    if (!normalizedCode) return;

    try {
      if (normalizedCode.startsWith("http://") || normalizedCode.startsWith("https://") || normalizedCode.includes("/call/")) {
        const parts = normalizedCode.split("/");
        const lastPart = parts[parts.length - 1];
        if (lastPart) {
          normalizedCode = lastPart;
        }
      }
    } catch (e) {
      // fallback
    }

    if (normalizedCode) {
      navigate(`/call/${normalizedCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
      {/* Greeting */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1" style={{ color: "#EEF1F8" }}>{getGreeting()}{authUser?.name ? `, ${authUser.name.split(" ")[0]}` : ""}</h1>
          <p className="text-sm" style={{ color: "#7E8BA3" }}>Ready to connect? Start or join a meeting below.</p>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:block text-right min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#EEF1F8" }}>{authUser?.name || "Profile"}</p>
            {authUser?.email && <p className="text-xs truncate" style={{ color: "#7E8BA3" }}>{authUser.email}</p>}
          </div>
          <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: "rgba(99,102,241,0.18)", border: "1.5px solid rgba(99,102,241,0.35)" }}>
            {authUser?.avatarUrl ? (
              <img src={authUser.avatarUrl} alt={authUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-sm font-semibold" style={{ color: "#C7D2FE" }}>{getInitials(authUser?.name || authUser?.email)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: action panel */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Tab toggle */}
          <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["new", "join"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-lg text-sm transition-all"
                style={tab === t
                  ? { background: "rgba(99,102,241,0.2)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.25)" }
                  : { color: "#7E8BA3" }}>
                {t === "new" ? "New Meeting" : "Join Meeting"}
              </button>
            ))}
          </div>

          {/* Card */}
          {tab === "new" ? (
            <div className="rounded-2xl p-5 sm:p-6 transition-all" style={surface}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium mb-0.5" style={{ color: "#EEF1F8" }}>Instant Meeting</p>
                  <p className="text-xs" style={{ color: "#7E8BA3" }}>Share the link — anyone with it can join</p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Video size={17} style={{ color: "#818CF8" }} />
                </div>
              </div>

              {/* Link row */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <Link2 size={13} style={{ color: "#404B63", flexShrink: 0 }} />
                <span className="flex-1 text-sm truncate" style={{ color: "#7E8BA3" }}>{window.location.origin}/call/{newCode}</span>
                <button onClick={copy}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all shrink-0"
                  style={copied
                    ? { background: "rgba(34,197,94,0.12)", color: "#22C55E" }
                    : { background: "rgba(99,102,241,0.12)", color: "#818CF8" }}>
                  {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={startMeeting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] shadow-lg shadow-indigo-500/20"
                  style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
                  <Video size={15} /> Start Meeting
                </button>
                <button onClick={startMeeting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7E8BA3" }}>
                  <Clock size={14} /> Schedule
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 sm:p-6 transition-all" style={surface}>
              <p className="text-sm font-semibold mb-0.5" style={{ color: "#EEF1F8" }}>Join with a code</p>
              <p className="text-xs mb-4" style={{ color: "#7E8BA3" }}>Enter the meeting code shared by your host</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. abc-def-ghi"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm placeholder:text-[#404B63] focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#EEF1F8", outline: "none" }}
                />
                <button
                  onClick={joinMeeting}
                  disabled={!joinCode.trim()}
                  className="flex items-center justify-center sm:justify-start gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] shadow-lg shadow-indigo-500/20"
                  style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
                  Join <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Quick-action tiles */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Shield size={16} style={{ color: "#818CF8" }} />, label: "Encrypted", sub: "End-to-end" },
              { icon: <Sparkles size={16} style={{ color: "#818CF8" }} />, label: "Transcripts", sub: "Auto-generated" },
              { icon: <Users size={16} style={{ color: "#818CF8" }} />, label: "10 people", sub: "Max capacity" },
            ].map((tile) => (
              <div key={tile.label} className="rounded-xl p-3 sm:p-4 flex flex-col gap-2 hover:bg-white/[0.02] transition-colors" style={surface}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.1)" }}>
                  {tile.icon}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#EEF1F8" }}>{tile.label}</p>
                  <p className="text-xs" style={{ color: "#7E8BA3" }}>{tile.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: allMeetingsCount.toString(), label: "Total meetings" },
              { value: recentMeetings.length.toString(), label: "Recent logged" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 sm:p-4 text-center hover:bg-white/[0.02] transition-colors" style={surface}>
                <p className="text-xl font-semibold mb-0.5" style={{ color: "#EEF1F8" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "#7E8BA3" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: recent */}
        <div className="lg:col-span-2 rounded-2xl p-5 sm:p-6 flex flex-col h-full max-h-[500px] lg:max-h-none" style={surface}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium" style={{ color: "#EEF1F8" }}>Recent Meetings</p>
            <button onClick={() => navigate("/history")} className="text-xs" style={{ color: "#6366F1" }}>
              View all
            </button>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {loading ? (
              <div className="flex flex-col gap-2 flex-1 justify-center items-center py-10">
                <p className="text-xs animate-pulse" style={{ color: "#7E8BA3" }}>Loading recent meetings…</p>
              </div>
            ) : recentMeetings.length === 0 ? (
              <div className="flex flex-col gap-2 flex-1 justify-center items-center py-10">
                <Video size={20} style={{ color: "#404B63" }} />
                <p className="text-xs" style={{ color: "#404B63" }}>No recent meetings</p>
              </div>
            ) : (
              recentMeetings.map((m) => (
                <button key={m.id} onClick={() => navigate(`/call/${m.meetingCode}`)}
                  className="w-full text-left rounded-xl p-3.5 transition-all hover:bg-white/[0.03] group"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(99,102,241,0.1)" }}>
                      <Video size={13} style={{ color: "#818CF8" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#EEF1F8" }}>{m.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#7E8BA3" }}>{m.date}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <button onClick={startMeeting}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:brightness-110"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818CF8" }}>
            <Plus size={14} /> New instant meeting
          </button>
        </div>
      </div>
    </div>
  );
}
