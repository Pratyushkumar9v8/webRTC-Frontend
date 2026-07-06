import { useEffect, useRef } from "react";

type StreamVideoProps = {
  stream: MediaStream | null;
  fallbackSrc: string;
  label: string;
  muted?: boolean;
  className?: string;
};

export function StreamVideo({ stream, fallbackSrc, label, muted = false, className }: StreamVideoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  if (!stream) {
    return <img src={fallbackSrc} alt={label} className={className} />;
  }

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      playsInline
      muted={muted}
      aria-label={label}
    />
  );
}
