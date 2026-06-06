import React, { useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface VideoReelProps {
  src?: string;
  poster?: string;
  index: number;
}

const VideoReel: React.FC<VideoReelProps> = ({ src, poster, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Placeholder reels using abstract gradient videos / public demo sources
  const placeholderColors = [
    'from-amber-900 via-yellow-800 to-amber-950',
    'from-stone-800 via-amber-900 to-stone-900',
    'from-yellow-900 via-orange-900 to-amber-950',
  ];

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-fadeInUp"
      style={{ animationDelay: `${0.3 + index * 0.2}s`, aspectRatio: '9/16', width: '100%', maxWidth: 220 }}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-b ${placeholderColors[index % 3]} flex flex-col items-center justify-center`}>
          <div className="text-amber-200/40 text-center px-4">
            <div className="text-5xl mb-3">♪</div>
            <p className="text-xs font-light tracking-widest uppercase">Lesson Video {index + 1}</p>
          </div>
        </div>
      )}
      {/* Reel overlay — gradient bottom */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
      {/* Side action bar */}
      <div className="absolute right-2 bottom-8 flex flex-col gap-3 items-center">
        <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
      {/* Muted badge */}
      <div className="absolute left-2 top-2">
        <VolumeX className="w-3 h-3 text-white/50" />
      </div>
    </div>
  );
};

export default VideoReel;
