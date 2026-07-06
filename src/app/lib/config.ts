export const API_URL = import.meta.env.VITE_API_URL || "";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL || window.location.origin;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
