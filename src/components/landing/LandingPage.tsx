import React, { useState, useEffect } from 'react';
import { Music, LogIn, ChevronDown } from 'lucide-react';
import DustParticles from './DustParticles';
import VideoReel from './VideoReel';
import LandingChatbot from './LandingChatbot';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const reels = [
    { index: 0 },
    { index: 1 },
    { index: 2 },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-950">
      {/* Cinematic piano background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
          filter: 'sepia(0.8) brightness(0.45) contrast(1.1) saturate(0.9)',
          transform: 'scale(1.05)',
        }}
      />

      {/* Cinematic vignette overlay */}
      <div className="absolute inset-0 z-1" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Dark translucent overlay */}
      <div className="absolute inset-0 z-2 bg-gradient-to-r from-black/75 via-black/50 to-black/40" />

      {/* Animated dust particles */}
      <DustParticles />

      {/* Top navigation */}
      <nav className={`relative z-20 flex items-center justify-between px-6 md:px-12 py-5 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-700/80 backdrop-blur-sm border border-amber-600/40 flex items-center justify-center">
            <Music className="w-5 h-5 text-amber-200" />
          </div>
          <span className="text-amber-100 font-serif text-xl tracking-wide">LCE Lessons</span>
        </div>
        <button
          onClick={onEnterApp}
          className="flex items-center gap-2 px-5 py-2 bg-amber-700/80 hover:bg-amber-600/90 backdrop-blur-sm border border-amber-600/40 text-amber-100 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </button>
      </nav>

      {/* Hero content */}
      <div className={`relative z-20 flex flex-col lg:flex-row min-h-[calc(100vh-80px)] px-6 md:px-12 pb-12 gap-12 lg:gap-16 transition-all duration-1000 delay-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>

        {/* Left — text content */}
        <div className="flex-1 flex flex-col justify-center py-8 lg:py-0 max-w-2xl">
          <div className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <span className="inline-block text-amber-400 text-sm font-light tracking-[0.3em] uppercase mb-4 border-b border-amber-700/50 pb-1">
              Piano Instruction
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-white font-serif text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Music is the
            <br />
            <span className="text-amber-300 italic">language</span>
            <br />
            of the soul.
          </h1>

          {/* Biography */}
          <div className="animate-fadeInUp" style={{ animationDelay: '0.35s' }}>
            <p className="text-stone-300 text-lg leading-relaxed mb-6 font-light max-w-xl">
              Welcome to LCE Lessons — where passionate, patient, and personalized piano instruction
              meets every student at their level. With over a decade of teaching experience, I believe
              every person has the capacity to make beautiful music.
            </p>
          </div>

          {/* Lesson info */}
          <div className="animate-fadeInUp mb-8" style={{ animationDelay: '0.45s' }}>
            <div className="border-l-2 border-amber-700/60 pl-4 space-y-2 text-stone-400 text-sm">
              <p>Private &amp; group lessons for all ages and skill levels</p>
              <p>30 · 45 · 60 minute sessions available</p>
              <p>In-studio and virtual lessons offered</p>
              <p>Recitals twice a year — spring &amp; fall</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-4 animate-fadeInUp" style={{ animationDelay: '0.55s' }}>
            <button
              onClick={onEnterApp}
              className="px-8 py-3.5 bg-amber-700 hover:bg-amber-600 text-white font-medium rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-900/40 text-sm tracking-wide"
            >
              Schedule a Trial Lesson
            </button>
            <button
              onClick={onEnterApp}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/20 text-white rounded-full transition-all duration-200 text-sm tracking-wide"
            >
              Learn More
            </button>
          </div>

          {/* Scroll hint */}
          <div className="mt-12 hidden lg:flex items-center gap-2 text-stone-500 text-xs animate-fadeInUp" style={{ animationDelay: '0.7s' }}>
            <ChevronDown className="w-4 h-4 animate-bounce" />
            <span className="tracking-widest uppercase">Scroll to explore</span>
          </div>
        </div>

        {/* Right — video reels */}
        <div className="flex lg:flex-col items-center justify-center gap-5 lg:py-8 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
          <div className="flex lg:flex-col gap-5 lg:gap-4 items-center">
            {reels.map(r => (
              <VideoReel key={r.index} index={r.index} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 z-20 bg-gradient-to-t from-stone-950/80 to-transparent pointer-events-none" />

      {/* Chatbot */}
      <LandingChatbot />
    </div>
  );
};

export default LandingPage;
