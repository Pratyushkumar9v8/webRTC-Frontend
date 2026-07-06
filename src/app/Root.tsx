import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Video, Home, Clock, LogOut, User, Zap } from "lucide-react";
import { API_URL } from "./lib/config";
import { clearAuthUser, getAuthUser, getInitials } from "./lib/auth";

const NAV = [
  { path: "/home", icon: Home, label: "Home" },
  { path: "/call", icon: Video, label: "Meeting" },
  { path: "/history", icon: Clock, label: "History" },
];

const BG = "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), #07080F";


export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuth = location.pathname === "/";
  const isVideoCall = location.pathname.startsWith("/call");
  const authUser = getAuthUser();

  useEffect(() => {
    if (!authUser && location.pathname !== "/") {
      navigate("/");
    } else if (authUser && location.pathname === "/") {
      navigate("/home");
    }
  }, [authUser, location.pathname, navigate]);

  const signOut = () => {
    clearAuthUser();
    fetch(`${API_URL}/api/v1/users/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    navigate("/");
  };

  if (!authUser && location.pathname !== "/") {
    return null;
  }
  if (authUser && location.pathname === "/") {
    return null;
  }

  if (isAuth) {
    return (
      <div className="size-full min-h-screen" style={{ background: BG }}>
        <Outlet />
      </div>
    );
  }


  return (
    <div className="flex size-full min-h-screen" style={{ background: BG }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-[64px] shrink-0 py-5 items-center gap-2"
        style={{ borderRight: "1px solid rgba(255,255,255,0.05)", background: "rgba(13,17,23,0.9)" }}
      >
        {/* Logo mark */}
        <button
          onClick={() => navigate("/home")}
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}
        >
          <Zap size={16} className="text-white" fill="white" />
        </button>

        {/* Nav icons */}
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              title={label}
              onClick={() => navigate(path)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all group"
              style={active
                ? { background: "rgba(99,102,241,0.2)", color: "#818CF8" }
                : { color: "rgba(255,255,255,0.3)" }}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "#6366F1" }} />
              )}
              <Icon size={17} />
              {/* Tooltip */}
              <span className="absolute left-14 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                style={{ background: "#1C2333", color: "#EEF1F8", border: "1px solid rgba(255,255,255,0.08)" }}>
                {label}
              </span>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center mb-1 overflow-hidden"
          title={authUser?.name || "Profile"}
          style={{ background: "rgba(99,102,241,0.2)", border: "1.5px solid rgba(99,102,241,0.35)" }}>
          {authUser?.avatarUrl ? (
            <img src={authUser.avatarUrl} alt={authUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : authUser ? (
            <span className="text-[11px] font-semibold" style={{ color: "#C7D2FE" }}>{getInitials(authUser.name || authUser.email)}</span>
          ) : (
            <User size={13} style={{ color: "#818CF8" }} />
          )}
        </div>

        {/* Sign out */}
        <button
          title="Sign out"
          onClick={signOut}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          <LogOut size={15} />
          <span className="absolute left-14 px-2 py-1 rounded-md text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
            style={{ background: "#1C2333", color: "#EEF1F8", border: "1px solid rgba(255,255,255,0.08)" }}>
            Sign out
          </span>
        </button>
      </aside>

      {/* Main */}
      <main className={`flex-1 flex flex-col ${isVideoCall ? "overflow-hidden h-[100dvh]" : "overflow-auto pb-16 md:pb-0"}`}>
        <Outlet />
      </main>

      {/* Mobile bottom bar */}
      {!isVideoCall && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 h-14"
          style={{ background: "rgba(7,8,15,0.95)", borderTop: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)" }}
        >
          {NAV.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <button key={path} onClick={() => navigate(path)}
                className="flex flex-col items-center gap-1 px-5 py-1 rounded-xl transition-all"
                style={{ color: active ? "#818CF8" : "rgba(255,255,255,0.35)" }}>
                <Icon size={17} />
                <span className="text-[10px]">{label}</span>
              </button>
            );
          })}
          <button onClick={signOut}
            className="flex flex-col items-center gap-1 px-5 py-1 rounded-xl"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <LogOut size={17} />
            <span className="text-[10px]">Out</span>
          </button>
        </nav>
      )}
    </div>
  );
}
