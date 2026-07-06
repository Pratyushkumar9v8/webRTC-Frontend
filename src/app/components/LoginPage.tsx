import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
import { API_URL, GOOGLE_CLIENT_ID } from "../lib/config";
import { saveAuthUser } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setAuthError("Google sign-in is not configured.");
      return;
    }

    const handleGoogleCredential = async ({ credential }: { credential?: string }) => {
      if (!credential) {
        setAuthError("Google did not return an identity token.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/v1/users/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: credential }),
        });

        if (!response.ok) {
          throw new Error("Google authentication failed.");
        }

        const { user } = await response.json();
        if (user) {
          saveAuthUser(user);
        }

        navigate("/home");
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Google authentication failed.");
      }
    };

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 380,
        shape: "rectangular",
        text: "continue_with",
      });
    };

    if (window.google) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setAuthError("Unable to load Google sign-in.");
    document.head.appendChild(script);
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Left: brand panel (hidden on small) */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0E1020 0%, #0A0C18 100%)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Glow */}
        <div className="absolute top-[-80px] left-[-80px] w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
            <Zap size={16} fill="white" className="text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight">Neptune</span>
        </div>

        {/* Quote */}
        <div className="relative z-10">
          <p className="text-3xl font-semibold leading-snug mb-6" style={{ color: "#EEF1F8" }}>
            Meetings that<br />
            <span style={{ background: "linear-gradient(90deg, #818CF8, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              actually work.
            </span>
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#7E8BA3" }}>
            Crystal-clear video, real-time collaboration, and a UI designed to get out of your way.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 flex flex-col gap-3">
          {["End-to-end encrypted calls", "Live transcription & captions", "Up to 100 participants"].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(99,102,241,0.2)" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm" style={{ color: "#7E8BA3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)" }}>
              <Zap size={14} fill="white" className="text-white" />
            </div>
            <span className="text-white font-semibold">Neptune</span>
          </div>

          <h2 className="text-white mb-1">Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "#7E8BA3" }}>
            Sign in to your workspace with Google
          </p>

          <div className="mb-4 min-h-[44px]" ref={googleButtonRef} />

          {authError && (
            <div className="rounded-xl px-4 py-3 text-sm mb-4"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", color: "#FCA5A5" }}>
              {authError}
            </div>
          )}

          <div className="rounded-2xl px-4 py-3"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.16)" }}>
            <p className="text-xs leading-relaxed" style={{ color: "#A5B4FC" }}>
              Password login and manual signup are disabled. A verified Google account creates or signs into your Neptune profile automatically.
            </p>
          </div>

          {import.meta.env.DEV && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`${API_URL}/api/v1/users/dev-login`, { method: 'POST', credentials: 'include' });
                  if (res.ok) {
                    const { user } = await res.json();
                    saveAuthUser(user);
                    navigate("/home");
                  } else {
                    setAuthError("Dev login failed.");
                  }
                } catch (e) {
                  setAuthError("Dev login request failed.");
                }
              }}
              className="mt-6 w-full rounded-xl py-3 text-sm font-semibold transition-colors"
              style={{ background: "#374151", color: "white" }}
            >
              Bypass Login (Dev Mode)
            </button>
          )}

          <p className="text-center text-xs mt-6" style={{ color: "#404B63" }}>
            By continuing you agree to our Terms &amp; Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
