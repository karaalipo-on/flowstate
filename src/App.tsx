import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2, CheckSquare, PenTool, Maximize2, Minimize2, Laptop, EyeOff, Eye, ExternalLink, Music } from 'lucide-react';
import { Scene, TimerMode } from './types';
import { SCENES } from './data/scenes';
import { audioSynthesizer } from './utils/audioSynthesizer';
import BackgroundMedia from './components/BackgroundMedia';
import Timer from './components/Timer';
import SoundMixer from './components/SoundMixer';
import TodoList from './components/TodoList';
import SceneSwitcher from './components/SceneSwitcher';
import ZenNotes from './components/ZenNotes';
import MusicPlayer from './components/MusicPlayer';
import StatisticBoard from './components/StatisticBoard';

export default function App() {
  const [activeScene, setActiveScene] = useState<Scene>(() => {
    try {
      const storedActiveId = localStorage.getItem('flowstate_active_scene_id');
      if (storedActiveId) {
        const storedCustom = localStorage.getItem('flowstate_custom_scenes');
        const customList: Scene[] = storedCustom ? JSON.parse(storedCustom) : [];
        const allScenes = [...customList, ...SCENES];
        const match = allScenes.find(s => s.id === storedActiveId);
        if (match) return match;
      }
    } catch (e) {
      console.warn("Failed to load active scene from storage:", e);
    }
    return SCENES[0];
  });
  const [activeMobileTab, setActiveMobileTab] = useState<'timer' | 'sounds' | 'music' | 'tasks' | 'notes'>('timer');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEngineWarmed, setAudioEngineWarmed] = useState(false);
  const [showWorkspaceOverlay, setShowWorkspaceOverlay] = useState(true);

  // Core Theme State supporting Warm, Cozy, Summer, Fall, Night, Glass, and Neutral options
  const [colorTheme, setColorTheme] = useState<'night' | 'warm' | 'cozy' | 'summer' | 'fall' | 'glass' | 'none'>(() => {
    try {
      const stored = localStorage.getItem('flowstate_color_theme');
      return (stored === 'night' || stored === 'warm' || stored === 'cozy' || stored === 'summer' || stored === 'fall' || stored === 'glass' || stored === 'none')
        ? stored as any
        : 'none';
    } catch (e) {
      return 'none';
    }
  });

  const [audioToast, setAudioToast] = useState<string | null>(null);

  // Sync selected custom or fallback scene to local storage
  useEffect(() => {
    if (activeScene && activeScene.id) {
      localStorage.setItem('flowstate_active_scene_id', activeScene.id);
    }
  }, [activeScene]);

  // Sync active Theme selection to local storage
  useEffect(() => {
    localStorage.setItem('flowstate_color_theme', colorTheme);
  }, [colorTheme]);

  // Sync to trace window fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Warm up Web Audio Engine on first interaction to allow immediate procedural sounds
  const handleWarmAudioEngine = async () => {
    const warmed = await audioSynthesizer.resumeContext();
    if (warmed) {
      setAudioEngineWarmed(true);
      setAudioToast(
        "Synthesizer Engine Active! 🎙️ Calming 'Autumn Rainfall' has loaded as your default focus backdrop. Customize elements or adjust levels in the 'AMBIENT GENERATOR' panel."
      );
      
      // Auto-dim the toast after 10 seconds of guidance
      setTimeout(() => {
        setAudioToast(null);
      }, 10000);

      // Dispatch a custom event to let the SoundMixer component know to toggle the default focus sound on!
      window.dispatchEvent(new CustomEvent('activate-default-sound'));

      // Play a beautiful, rich synthesizer confirmation chime (perfect dual harmony notes A4 and C#5)
      try {
        const ctx = audioSynthesizer.getContext();
        if (ctx) {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime); // Note A4
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(554.37, ctx.currentTime + 0.12); // Note C#5 (melodic shift)
          
          gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05); // audible yet pleasant
          gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.8);
          
          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc1.start();
          osc2.start();
          
          osc1.stop(ctx.currentTime + 0.8);
          osc2.stop(ctx.currentTime + 0.8);
        }
      } catch (e) {
        // safe fallback
      }
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle rejected:", err);
    }
  };

  // Callback when focus timer completes
  const handleTimerCompleteProgress = (mode: TimerMode, durationMinutes: number) => {
    console.log(`Focus stage ended in state: ${mode} for duration ${durationMinutes}m`);
    if (mode === 'work') {
      try {
        const stored = localStorage.getItem('zenspace_focus_sessions') || '[]';
        const sessionsList = JSON.parse(stored);
        sessionsList.push({
          timestamp: Date.now(),
          durationMinutes: durationMinutes || 25
        });
        localStorage.setItem('zenspace_focus_sessions', JSON.stringify(sessionsList));
        window.dispatchEvent(new CustomEvent('zenspace_tasks_updated')); // refresh stats
      } catch (e) {
        console.warn("Could not save focus session to stats history:", e);
      }
    }
  };

  return (
    <div className={`relative min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-accent/30 selection:text-white overflow-x-hidden theme-${colorTheme} transition-colors duration-500`}>
      
      {/* 1. Immersive Video/Image Backdrop layer */}
      <BackgroundMedia currentScene={activeScene} colorTheme={colorTheme} />

      {/* 1b. Interactive Informational Toast alerting active synthesizer details */}
      {audioToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-55 w-full max-w-lg px-4 transition-all duration-300">
          <div className="bg-theme-panel border border-accent/25 backdrop-blur-2xl p-4 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-start gap-4">
            <div className="bg-white/10 p-2 rounded-lg text-accent self-center shrink-0">
              <Volume2 size={16} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Synthesizer Engine Online</p>
              <p className="text-[10px] text-zinc-300 leading-normal mt-0.5">
                {audioToast}
              </p>
            </div>
            <button
              onClick={() => setAudioToast(null)}
              className="text-[10px] font-mono text-accent hover:text-white font-bold px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition shrink-0 cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Navigation header */}
      <header className="z-30 w-full bg-gradient-to-b from-black/80 to-transparent pt-4 pb-14 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex flex-col items-center md:items-start select-none">
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
              <span className="bg-gradient-to-r from-grad-start to-grad-end bg-clip-text text-transparent">FLOWSTATE</span>
              <Sparkles size={14} className="text-accent animate-pulse" />
            </h1>
            <p className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase mt-0.5">
              PERSONAL FOCUS WORKSPACE
            </p>
          </div>

          {/* Settings / Controls */}
          <div className="flex items-center gap-2 self-center">
            
            {/* Quick clean visual overlay toggle button */}
            <button
              onClick={() => setShowWorkspaceOverlay(!showWorkspaceOverlay)}
              className="p-2 rounded-xl bg-black/40 border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer select-none text-xs flex items-center gap-1.5"
              title={showWorkspaceOverlay ? "Hide all menus" : "Show all menus"}
            >
              {showWorkspaceOverlay ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold tracking-wider">
                {showWorkspaceOverlay ? 'Immersion' : 'Panels'}
              </span>
            </button>

            {/* Standard Fullscreen toggler */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-black/40 border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Open in a New Tab Link */}
            <a
              href={window.location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-accent/15 border border-accent/20 text-accent hover:text-white hover:bg-accent/25 transition select-none text-xs flex items-center gap-1.5 cursor-pointer"
              title="Open in a New Tab directly"
              id="open_new_tab_btn"
            >
              <ExternalLink size={14} />
              <span className="hidden sm:inline font-mono text-[10px] uppercase font-bold tracking-wider">
                New Tab
              </span>
            </a>
            
            {/* Audio engine warm up banner if context is locked by browser */}
            {!audioEngineWarmed && (
              <button
                onClick={handleWarmAudioEngine}
                className="px-3 py-1.5 text-[9px] font-mono font-bold tracking-wider border border-accent/35 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 hover:text-white transition cursor-pointer animate-pulse"
                title="Unlock browser audio to enable background synth player and hear calming tones"
              >
                HEAR FOCUS SOUNDS 🎧
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 3. Main Workspace content layout */}
      <main className={`flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 pb-28 md:pb-8 transition-opacity duration-700 ${
        showWorkspaceOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="max-w-7xl mx-auto w-full">
          
          {/* A. DESKTOP VIEW - Beautiful Bento grid layout */}
          <div className="hidden md:grid grid-cols-12 gap-6 items-start">
            
            {/* Col 1 - Environment switchers (Scenes/Sounds) & Collapsible Statistics */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 font-sans">
              <SceneSwitcher 
                activeScene={activeScene} 
                onSceneSelect={setActiveScene} 
                colorTheme={colorTheme}
                onColorThemeSelect={setColorTheme}
              />
              <SoundMixer />
              <StatisticBoard />
            </div>

            {/* Col 2 - Primary Pomodoro Timer Focus & Wide Scratch Pad */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col gap-6 items-center w-full">
              <Timer onTimerComplete={handleTimerCompleteProgress} />
              <ZenNotes />
            </div>

            {/* Col 3 - Productivity checklists & Music */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 flex flex-col gap-6 font-sans">
              <TodoList />
              <MusicPlayer />
            </div>

          </div>

          {/* B. MOBILE VIEW - Touch tab focused single page overlay layout */}
          <div className="md:hidden flex flex-col items-center w-full max-w-sm mx-auto">
            {/* Active mobile display view */}
            <div className="w-full mb-6">
              {activeMobileTab === 'timer' && (
                <div className="flex flex-col gap-6 items-center">
                  <Timer onTimerComplete={handleTimerCompleteProgress} />
                  {/* Inline quick scene switch indicator for mobile */}
                  <div className="text-center font-mono text-[9px] text-zinc-500 uppercase tracking-widest bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
                    Workspace: {activeScene.name} • credit: {activeScene.credit}
                  </div>
                </div>
              )}
              {activeMobileTab === 'sounds' && (
                <div className="flex flex-col gap-4">
                  <SceneSwitcher 
                    activeScene={activeScene} 
                    onSceneSelect={setActiveScene} 
                    colorTheme={colorTheme}
                    onColorThemeSelect={setColorTheme}
                  />
                  <SoundMixer />
                </div>
              )}
              {activeMobileTab === 'tasks' && <TodoList />}
              {activeMobileTab === 'notes' && <ZenNotes />}
              {activeMobileTab === 'music' && <MusicPlayer />}
            </div>
          </div>

        </div>
      </main>

      {/* 4. Sticky Mobile Tab navigations bar at base */}
      <footer className={`md:hidden fixed bottom-5 left-4 right-4 z-40 transition-transform duration-500 ${
        showWorkspaceOverlay ? 'translate-y-0' : 'translate-y-24'
      }`}>
        <div className="bg-zinc-950/70 border border-white/10 backdrop-blur-2xl px-3 py-2.5 rounded-2xl flex justify-around items-center shadow-2xl">
          <button
            onClick={() => setActiveMobileTab('timer')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
              activeMobileTab === 'timer' ? 'text-accent scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Laptop size={18} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Focus</span>
          </button>
          
          <button
            onClick={() => setActiveMobileTab('sounds')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
              activeMobileTab === 'sounds' ? 'text-accent scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Volume2 size={18} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Sounds</span>
          </button>

          <button
            onClick={() => setActiveMobileTab('music')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
              activeMobileTab === 'music' ? 'text-accent scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Music size={18} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Music</span>
          </button>
          
          <button
            onClick={() => setActiveMobileTab('tasks')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
              activeMobileTab === 'tasks' ? 'text-accent scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CheckSquare size={18} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Tasks</span>
          </button>
          
          <button
            onClick={() => setActiveMobileTab('notes')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
              activeMobileTab === 'notes' ? 'text-accent scale-105' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <PenTool size={18} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider">Scratch</span>
          </button>
        </div>
      </footer>

      {/* Background ambient credits watermark in bottom corner for high fidelity details */}
      <div className="hidden md:block fixed bottom-4 right-4 z-30 font-mono text-[9px] text-zinc-500 uppercase tracking-widest bg-black/25 px-2.5 py-1 rounded border border-white/5 pointer-events-none select-none">
        SCENE CRED: {activeScene.credit}
      </div>
    </div>
  );
}
