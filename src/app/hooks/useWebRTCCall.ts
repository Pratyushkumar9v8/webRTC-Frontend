import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { ICE_SERVERS, SOCKET_URL, API_URL } from "../lib/config";
import { getAuthUser } from "../lib/auth";

export type Message = {
  id: string | number;
  sender: string;
  avatar: string | null;
  text: string;
  time: string;
  isMe: boolean;
};

type RemoteStream = {
  id: string;
  stream: MediaStream;
  name?: string;
};

type SignalDescription = {
  from: string;
  roomId: string;
  description: RTCSessionDescriptionInit;
};

type SignalCandidate = {
  from: string;
  roomId: string;
  candidate: RTCIceCandidateInit;
};

const getMediaErrorMessage = (error: unknown) => {
  if (!(error instanceof DOMException)) {
    return error instanceof Error ? error.message : "Unable to start media devices";
  }

  if (error.name === "NotAllowedError") {
    return "Camera or microphone permission was blocked. Allow access and try again.";
  }

  if (error.name === "NotFoundError") {
    return "No camera or microphone was found on this device.";
  }

  return error.message || "Unable to start media devices";
};

export function useWebRTCCall(roomId: string, onLeave: () => void, initialMessages: Message[] = []) {
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("Connecting...");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteMediaStates, setRemoteMediaStates] = useState<Record<string, { camOn: boolean, micOn: boolean }>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);

  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  const participantCount = useMemo(() => remoteStreams.length + (localStream ? 1 : 0), [localStream, remoteStreams.length]);

  useEffect(() => {
    let cancelled = false;

    const closePeer = (peerId: string) => {
      const peer = peersRef.current.get(peerId);
      peer?.close();
      peersRef.current.delete(peerId);
      pendingCandidatesRef.current.delete(peerId);
      setRemoteStreams((streams) => streams.filter(({ id }) => id !== peerId));
    };

    const flushPendingCandidates = async (peerId: string, peer: RTCPeerConnection) => {
      const candidates = pendingCandidatesRef.current.get(peerId) ?? [];
      pendingCandidatesRef.current.delete(peerId);

      for (const candidate of candidates) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          setStatus("A network candidate could not be added.");
        }
      }
    };

    const getPeer = (peerId: string) => {
      const existingPeer = peersRef.current.get(peerId);
      if (existingPeer) {
        return existingPeer;
      }

      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      peersRef.current.set(peerId, peer);

      localStreamRef.current?.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current!);
      });

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) {
          return;
        }

        setRemoteStreams((streams) => {
          const nextStreams = streams.filter(({ id }) => id !== peerId);
          return [...nextStreams, { id: peerId, stream }];
        });
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("ice-candidate", {
            roomId,
            to: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "connected") {
          setStatus(`Connected to room ${roomId}`);
        }

        if (peer.connectionState === "disconnected") {
          setStatus("Connection is unstable. Trying to reconnect...");
        }

        if (["closed", "failed"].includes(peer.connectionState)) {
          closePeer(peerId);
        }
      };

      return peer;
    };

    const callPeer = async (peerId: string) => {
      const peer = getPeer(peerId);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socketRef.current?.emit("offer", { roomId, to: peerId, description: offer });
    };

    const start = async () => {
      try {
        let media: MediaStream | null = null;
        try {
          media = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        } catch (mediaError) {
          console.error("Media error", mediaError);
          setStatus(getMediaErrorMessage(mediaError));
          // Continue to connect to socket even without media
        }

        if (cancelled) {
          media?.getTracks().forEach((track) => track.stop());
          return;
        }

        if (media) {
          localStreamRef.current = media;
          setLocalStream(media);
        }

        const socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          withCredentials: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setStatus(`Connected to room ${roomId}`);
          const authUser = getAuthUser();
          socket.on("room:ended", () => {
            onLeaveRef.current();
          });

          // Fetch chat history
          fetch(`${API_URL}/api/v1/chat/${roomId}`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data)) {
                const historyMessages = data.map((msg: any) => ({
                  id: msg.id,
                  sender: msg.sender_name || "Guest",
                  avatar: msg.avatar_url || null,
                  text: msg.message,
                  time: new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
                  isMe: msg.user_id === authUser?.id
                }));
                setMessages(historyMessages);
              }
            })
            .catch(err => console.error("Failed to fetch chat history", err));

          socket.emit("room:join", { 
              roomId, 
              userId: authUser?.id?.toString(),
              name: authUser?.name || "Guest"
          }, ({ participants }: { participants: { socketId: string; name?: string }[] }) => {
            const initialNames: Record<string, string> = {};
            participants.forEach((p) => {
              initialNames[p.socketId] = p.name || "Guest";
              void callPeer(p.socketId);
            });
            setParticipantNames(prev => ({ ...prev, ...initialNames }));
          });
        });

        socket.on("connect_error", (error) => {
          setStatus(`Socket connection failed: ${error.message}`);
        });

        socket.on("disconnect", () => {
          setStatus("Disconnected from the call server");
        });

        socket.on("participant:joined", ({ socketId, name }: { socketId: string, name?: string }) => {
          setParticipantNames(prev => ({ ...prev, [socketId]: name || "Guest" }));
          setStatus(`${name || "A participant"} joined`);
          // Broadcast our current media state to the new participant
          socket.emit("media:state", { roomId, camOn, micOn });
        });

        socket.on("participant:left", ({ socketId }: { socketId: string }) => {
          closePeer(socketId);
          setStatus("A participant left");
          setRemoteMediaStates(prev => {
            const next = { ...prev };
            delete next[socketId];
            return next;
          });
        });

        socket.on("media:state", ({ socketId, camOn: remoteCamOn, micOn: remoteMicOn }: { socketId: string, camOn: boolean, micOn: boolean }) => {
            setRemoteMediaStates(prev => ({
                ...prev,
                [socketId]: { camOn: remoteCamOn, micOn: remoteMicOn }
            }));
        });

        socket.on("offer", async ({ from, description }: SignalDescription) => {
          try {
            const peer = getPeer(from);
            await peer.setRemoteDescription(new RTCSessionDescription(description));
            await flushPendingCandidates(from, peer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit("answer", { roomId, to: from, description: answer });
          } catch {
            setStatus("Unable to answer the incoming call.");
          }
        });

        socket.on("answer", async ({ from, description }: SignalDescription) => {
          try {
            const peer = peersRef.current.get(from);
            if (!peer || peer.signalingState === "stable") {
              return;
            }

            await peer.setRemoteDescription(new RTCSessionDescription(description));
            await flushPendingCandidates(from, peer);
          } catch {
            setStatus("Unable to connect to the participant.");
          }
        });

        socket.on("ice-candidate", async ({ from, candidate }: SignalCandidate) => {
          try {
            const peer = peersRef.current.get(from);
            if (!peer?.remoteDescription) {
              const queued = pendingCandidatesRef.current.get(from) ?? [];
              pendingCandidatesRef.current.set(from, [...queued, candidate]);
              return;
            }

            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            setStatus("A network candidate could not be added.");
          }
        });

        socket.on("message:received", (msg: { id: string; sender: string; text: string; time: string }) => {
          const formattedTime = new Date(msg.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
          setMessages((prev) => [...prev, { ...msg, time: formattedTime, avatar: null, isMe: false }]);
        });
      } catch (error) {
        setStatus(getMediaErrorMessage(error));
      }
    };

    void start();

    return () => {
      cancelled = true;
      socketRef.current?.emit("room:leave");
      socketRef.current?.disconnect();
      socketRef.current = null;

      peersRef.current.forEach((peer) => peer.close());
      peersRef.current.clear();
      pendingCandidatesRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      
      setLocalStream(null);
      setRemoteStreams([]);
    };
  }, [roomId]);

  const toggleMic = useCallback(() => {
    const nextEnabled = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });
    setMicOn(nextEnabled);
    if (socketRef.current) {
        socketRef.current.emit("media:state", { roomId, camOn, micOn: nextEnabled });
    }
  }, [micOn, camOn, roomId]);

  const toggleCamera = useCallback(() => {
    const nextEnabled = !camOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      // Don't disable screen share tracks
      if (track.label !== "screen") {
        track.enabled = nextEnabled;
      }
    });
    setCamOn(nextEnabled);
    if (socketRef.current) {
        socketRef.current.emit("media:state", { roomId, camOn: nextEnabled, micOn });
    }
  }, [camOn, micOn, roomId]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen sharing
      localStreamRef.current?.getVideoTracks().forEach(track => {
        if (track.label === "screen" || track.kind === "video") track.stop();
      });
      // Revert to camera
      try {
          const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
          localStreamRef.current = media;
          setLocalStream(media);
          const videoTrack = media.getVideoTracks()[0];
          peersRef.current.forEach(peer => {
              const sender = peer.getSenders().find(s => s.track?.kind === "video");
              if (sender && videoTrack) sender.replaceTrack(videoTrack);
          });
      } catch (e) {
          console.error("Failed to revert to camera", e);
      }
      setIsScreenSharing(false);
      setCamOn(true);
    } else {
      // Start screen sharing
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
            toggleScreenShare();
        };

        if (localStreamRef.current) {
            const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
            if (oldVideoTrack) oldVideoTrack.stop();
            localStreamRef.current.removeTrack(oldVideoTrack);
            localStreamRef.current.addTrack(screenTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }

        peersRef.current.forEach(peer => {
            const sender = peer.getSenders().find(s => s.track?.kind === "video");
            if (sender && screenTrack) sender.replaceTrack(screenTrack);
        });
        
        setIsScreenSharing(true);
        setCamOn(true);
      } catch (e) {
        console.error("Screen share failed", e);
      }
    }
  }, [isScreenSharing, micOn]);

  const startRecording = useCallback(() => {
    if (!localStreamRef.current) return;
    recordedChunksRef.current = [];
    
    // Create a combined stream for recording (local + all remotes)
    // Note: A true composite recording requires canvas drawing. We will record local stream + remote audio for simplicity.
    const audioContext = new AudioContext();
    const dest = audioContext.createMediaStreamDestination();
    
    localStreamRef.current.getAudioTracks().forEach(track => {
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(dest);
    });

    remoteStreams.forEach(rs => {
        rs.stream.getAudioTracks().forEach(track => {
            const source = audioContext.createMediaStreamSource(new MediaStream([track]));
            source.connect(dest);
        });
    });

    const combinedStream = new MediaStream([
        ...localStreamRef.current.getVideoTracks(),
        ...dest.stream.getAudioTracks()
    ]);

    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    try {
        mediaRecorderRef.current = new MediaRecorder(combinedStream, options);
    } catch (e) {
        mediaRecorderRef.current = new MediaRecorder(combinedStream);
    }

    mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `recording-${roomId}-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    };

    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
  }, [roomId, remoteStreams]);

  const stopRecording = useCallback(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
  }, []);

    const sendMessage = useCallback((text: string) => {
    if (!text.trim() || !socketRef.current) return;
    const authUser = getAuthUser();
    const name = authUser?.name || "Guest";
    const userId = authUser?.id?.toString();
    const newMsg: Message = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
      sender: "You",
      avatar: null,
      text,
      time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      isMe: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    socketRef.current.emit("message:send", { roomId, text, senderName: name, userId });
  }, [roomId]);

  const endCallForAll = useCallback(() => {
    if (socketRef.current) {
        socketRef.current.emit("room:end", { roomId });
    }
  }, [roomId]);

  const leaveCall = useCallback(() => {
    onLeaveRef.current();
  }, []);

  return {
    localStream,
    remoteStreams: remoteStreams.map(rs => ({ 
      ...rs, 
      name: participantNames[rs.id] || "Guest",
      camOn: remoteMediaStates[rs.id]?.camOn ?? true,
      micOn: remoteMediaStates[rs.id]?.micOn ?? true,
    })),
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
  };
}
