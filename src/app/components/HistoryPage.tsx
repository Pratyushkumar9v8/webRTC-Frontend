import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Video, Search, ChevronRight, Calendar, Filter } from "lucide-react";
import { API_URL } from "../lib/config";

interface CallRecord {
  id: string;
  name: string;
  date: string;
  time: string;
}

const surface = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" };

export function HistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/users/get_all_activity`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch meeting history");
        }
        const data = await response.json();
        const formatted: CallRecord[] = data.map((item: any) => {
          const dateObj = new Date(item.created_at);
          
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);
          
          let dateStr = "";
          if (dateObj.toDateString() === today.toDateString()) {
            dateStr = "Today";
          } else if (dateObj.toDateString() === yesterday.toDateString()) {
            dateStr = "Yesterday";
          } else {
            dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          }
          
          const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          
          return {
            id: item.id.toString(),
            name: `Meeting: ${item.meeting_code}`,
            date: dateStr,
            time: timeStr,
          };
        });
        setHistory(formatted);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = history.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, CallRecord[]>>((acc, item) => {
    (acc[item.date] = acc[item.date] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen p-6 md:p-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="mb-0.5" style={{ color: "#EEF1F8" }}>Call History</h1>
          <p className="text-sm" style={{ color: "#7E8BA3" }}>{history.length} meetings recorded</p>
        </div>
        <button onClick={() => navigate("/call")}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
          <Video size={14} /> New Meeting
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {[
          { icon: <Calendar size={15} style={{ color: "#818CF8" }} />, label: "Total meetings recorded", value: history.length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3" style={surface}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(99,102,241,0.1)" }}>
              {s.icon}
            </div>
            <div>
              <p className="font-semibold text-lg" style={{ color: "#EEF1F8" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "#7E8BA3" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#404B63" }} />
          <input
            type="text"
            placeholder="Search meetings by code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm placeholder:text-[#404B63]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "#EEF1F8", outline: "none" }}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <p className="text-sm animate-pulse" style={{ color: "#7E8BA3" }}>Loading call history…</p>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: "#EF4444" }}>Error: {error}</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20">
          <Filter size={30} className="mx-auto mb-3" style={{ color: "#404B63" }} />
          <p className="text-sm" style={{ color: "#404B63" }}>No meetings found</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, calls]) => (
          <div key={date} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2.5" style={{ color: "#404B63" }}>{date}</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
              {calls.map((call, idx) => {
                return (
                  <button
                    key={call.id}
                    onClick={() => navigate(`/call/${call.name.replace("Meeting: ", "")}`)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-white/[0.02] text-left"
                    style={{
                      background: idx % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.015)",
                      borderBottom: idx < calls.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(99,102,241,0.08)" }}>
                      <Video size={13} style={{ color: "#6366F1" }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#EEF1F8" }}>{call.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#7E8BA3" }}>{call.time}</p>
                    </div>

                    <ChevronRight size={13} style={{ color: "#404B63", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}

    </div>
  );
}
