import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { DesktopVideoCall } from "./DesktopVideoCall";
import { MobileVideoCall } from "./MobileVideoCall";
import { ArrowLeft } from "lucide-react";
import { useWebRTCCall } from "../hooks/useWebRTCCall";
import { API_URL } from "../lib/config";

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8);
}

export function VideoCallPage() {
  const navigate = useNavigate();
  const { roomId: routeRoomId } = useParams();
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [generatedId] = useState(generateRoomId);
  const roomId = routeRoomId || generatedId;

  const call = useWebRTCCall(roomId, () => navigate("/home"), []);

  useEffect(() => {
    if (!routeRoomId) {
      navigate(`/call/${roomId}`, { replace: true });
    }
  }, [navigate, roomId, routeRoomId]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const recordMeeting = async () => {
      try {
        await fetch(`${API_URL}/api/v1/users/add_to_activity`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingCode: roomId }),
        });
      } catch (err) {
        console.error("Error logging meeting to history:", err);
      }
    };
    recordMeeting();
  }, [roomId]);


  const activeMode = isMobile ? "mobile" : viewMode;

  return (
    <div className="relative size-full h-[100dvh] overflow-hidden">
      {/* Top bar removed */}



      {activeMode === "desktop" ? (
        <DesktopVideoCall roomId={roomId} {...call} />
      ) : (
        <MobileVideoCall roomId={roomId} {...call} />
      )}
    </div>
  );
}
