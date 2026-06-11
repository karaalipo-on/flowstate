import React, { useState, useEffect } from 'react';
import { Scene } from '../types';

interface BackgroundMediaProps {
  currentScene: Scene;
  colorTheme: 'night' | 'warm' | 'cozy' | 'summer' | 'fall' | 'glass' | 'none';
}

export default function BackgroundMedia({ currentScene, colorTheme }: BackgroundMediaProps) {
  const [videoLoading, setVideoLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset loading states when the background scene changes
  useEffect(() => {
    setVideoLoading(true);
    setHasError(false);
  }, [currentScene]);

  const finalVideoUrl = currentScene.videoUrl || currentScene.url;

  // Custom detector for space backgrounds to specifically verify and refine neutral presets
  const isSpaceScene = currentScene.id === 'default-space' || 
    currentScene.name.toLowerCase().includes('space') || 
    (currentScene.credit && currentScene.credit.toLowerCase().includes('space'));

  return (
    <div className="fixed inset-0 w-full h-full -z-20 bg-[var(--bg)] overflow-hidden pointer-events-none select-none transition-colors duration-500">
      {/* Absolute dark overlay - lighter opacity configuration to make the background significantly clearer */}
      <div className={`absolute inset-0 z-10 transition-all duration-500 pointer-events-none ${
        colorTheme === 'none' && isSpaceScene
          ? 'bg-gradient-to-t from-black/55 via-transparent to-black/40'
          : 'bg-gradient-to-t from-black/70 via-black/15 to-black/55'
      }`} />
      
      {/* Decorative Radial atmosphere ambient glow - completely removed for the neutral setting to discard color theme tints */}
      {colorTheme !== 'none' && (
        <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_40%,var(--accent-glow),transparent_50%)] pointer-events-none" />
      )}

      {/* Image / High-Performance Ambient Wallpaper Renderer */}
      {currentScene.type === 'ai-image' && currentScene.url && !hasError && (
        <img
          key={currentScene.id}
          src={currentScene.url}
          alt={currentScene.name}
          referrerPolicy="no-referrer"
          onLoad={() => setVideoLoading(false)}
          onError={() => {
            setHasError(true);
            setVideoLoading(false);
          }}
          className={`w-full h-full object-cover animate-breathe-slow transition-opacity duration-1000 ${
            videoLoading ? 'opacity-0' : 'opacity-[0.88]'
          }`}
          style={{ filter: 'blur(2px)' }}
        />
      )}

      {/* Direct MP4/Video Player fallback */}
      {currentScene.type !== 'ai-image' && finalVideoUrl && !hasError && (
        <video
          key={currentScene.id}
          autoPlay
          loop
          muted
          playsInline
          referrerPolicy="no-referrer"
          id={`bg_video_${currentScene.id}`}
          onCanPlay={() => setVideoLoading(false)}
          onError={() => {
            setHasError(true);
            setVideoLoading(false);
          }}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoading ? 'opacity-0' : 'opacity-[0.88]'
          }`}
          style={{ filter: 'blur(2px)' }}
        >
          <source src={finalVideoUrl} type="video/mp4" />
        </video>
      )}

      {/* Elegant minimalist fallback indicator if video fails or is loading */}
      {(videoLoading || hasError) && (
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-2.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 pointer-events-none select-none animate-pulse">
          {videoLoading ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full border-2 border-t-accent border-r-transparent border-b-accent border-l-transparent animate-spin" />
              <span className="text-[9px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">
                Aligning Space...
              </span>
            </>
          ) : (
            <span className="text-[8px] font-mono tracking-wider font-semibold text-amber-500 uppercase">
              ✦ link offline • showing fallback theme
            </span>
          )}
        </div>
      )}
    </div>
  );
}
