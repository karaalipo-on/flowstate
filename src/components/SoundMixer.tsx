import React, { useState, useEffect } from 'react';
import { 
  CloudRain, 
  Wind, 
  Waves, 
  Disc, 
  FlameKindling, 
  VolumeX, 
  Brain, 
  Coffee, 
  Bird, 
  Trees, 
  Droplet
} from 'lucide-react';
import { SoundGeneratorType } from '../types';
import { audioSynthesizer } from '../utils/audioSynthesizer';

interface SoundMixerItem {
  id: string;
  name: string;
  iconName: string;
  type: SoundGeneratorType;
  volume: number;
  isPlaying: boolean;
  activeFile?: string;
  files?: string[];
}

export default function SoundMixer() {
  const [sounds, setSounds] = useState<SoundMixerItem[]>([
    { id: '1', name: 'Alpha Focus (8Hz)', iconName: 'disc', type: 'binaural', volume: 0.25, isPlaying: false },
    { id: '2', name: 'Theta Meditation (6Hz)', iconName: 'brain-theta', type: 'theta', volume: 0.3, isPlaying: false },
    { id: '3', name: 'Delta Brainwaves (2.5Hz)', iconName: 'brain-delta', type: 'delta', volume: 0.3, isPlaying: false },
    { 
      id: '4', 
      name: 'Cafe Ambience', 
      iconName: 'coffee', 
      type: 'cafe', 
      volume: 0.35, 
      isPlaying: false, 
      activeFile: 'cafe-ambience'
    },
    { 
      id: '5', 
      name: 'Ocean Shore Waves', 
      iconName: 'waves', 
      type: 'waves', 
      volume: 0.3, 
      isPlaying: false, 
      activeFile: 'gentle-ocean-shore-waves'
    },
    { 
      id: '6', 
      name: 'Soft Wind', 
      iconName: 'wind', 
      type: 'wind', 
      volume: 0.25, 
      isPlaying: false, 
      activeFile: 'soft-wind'
    },
    { 
      id: '7', 
      name: 'Relaxing Rain', 
      iconName: 'cloud-rain', 
      type: 'rain', 
      volume: 0.4, 
      isPlaying: false, 
      activeFile: 'relaxing-rain'
    },
    { 
      id: '8', 
      name: 'Birds Chirping', 
      iconName: 'bird', 
      type: 'birds', 
      volume: 0.3, 
      isPlaying: false, 
      activeFile: 'birds-chirping'
    },
    { 
      id: '9', 
      name: 'Forest Ambience', 
      iconName: 'trees', 
      type: 'forest', 
      volume: 0.35, 
      isPlaying: false, 
      activeFile: 'forest-ambience'
    },
    { 
      id: '10', 
      name: 'Flowing Water', 
      iconName: 'droplet', 
      type: 'water', 
      volume: 0.35, 
      isPlaying: false, 
      activeFile: 'flowing-water'
    },
  ]);

  const [mixerActive, setMixerActive] = useState(false);

  useEffect(() => {
    const handleActivateDefault = () => {
      setSounds((prev) => {
        const isRainPlaying = prev.some(s => s.type === 'rain' && s.isPlaying);
        if (isRainPlaying) return prev;
        
        // Start rainfall generator
        audioSynthesizer.startSound('rain', 'relaxing-rain');
        return prev.map(s => s.type === 'rain' ? { ...s, isPlaying: true } : s);
      });
      setMixerActive(true);
    };

    window.addEventListener('activate-default-sound', handleActivateDefault);

    return () => {
      window.removeEventListener('activate-default-sound', handleActivateDefault);
    };
  }, []);

  const renderIcon = (iconName: string, active: boolean) => {
    const cls = `transition-all duration-300 ${active ? 'text-accent scale-110' : 'text-zinc-500'}`;
    switch (iconName) {
      case 'cloud-rain': return <CloudRain className={cls} size={18} />;
      case 'wind': return <Wind className={cls} size={18} />;
      case 'waves': return <Waves className={cls} size={18} />;
      case 'disc': return <Disc className={`${cls} ${active ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} size={18} />;
      case 'brain-theta': return <Brain className={`${cls} ${active ? 'animate-pulse' : ''}`} size={18} />;
      case 'brain-delta': return <Brain className={`${cls} ${active ? 'animate-[pulse_2s_infinite]' : ''}`} size={18} />;
      case 'coffee': return <Coffee className={`${cls} ${active ? 'animate-bounce' : ''}`} size={18} />;
      case 'bird': return <Bird className={`${cls} ${active ? 'animate-bounce' : ''}`} size={18} />;
      case 'trees': return <Trees className={`${cls} ${active ? 'animate-pulse' : ''}`} size={18} />;
      case 'droplet': return <Droplet className={`${cls} ${active ? 'animate-pulse' : ''}`} size={18} />;
      default: return <VolumeX className={cls} size={18} />;
    }
  };

  const handleToggleSound = async (type: SoundGeneratorType) => {
    const soundList = sounds.map((s) => {
      if (s.type === type) {
        const nextState = !s.isPlaying;
        if (nextState) {
          audioSynthesizer.startSound(type, s.activeFile);
        } else {
          audioSynthesizer.stopSound(type);
        }
        return { ...s, isPlaying: nextState };
      }
      return s;
    });

    setSounds(soundList);
    const isAnyPlaying = soundList.some(s => s.isPlaying);
    setMixerActive(isAnyPlaying);
  };

  const handleSubFileChange = async (type: SoundGeneratorType, subFile: string) => {
    setSounds((prev) => {
      return prev.map((s) => {
        if (s.type === type) {
          if (s.isPlaying) {
            audioSynthesizer.startSound(type, subFile);
          }
          return { ...s, activeFile: subFile };
        }
        return s;
      });
    });
  };

  const handleVolumeChange = (type: SoundGeneratorType, val: number) => {
    console.log(`[SoundMixer] User dragging slider for [${type}]. New volume input value: [${val}]`);
    
    // Proactively verify and resume AudioContext status to ensure uninterrupted state
    audioSynthesizer.resumeContext()
      .then((active) => {
        if (!active) {
          console.warn(`[SoundMixer] Ambient generation is standing by: Could not ensure context is fully active`);
        }
      })
      .catch((err) => {
        console.error(`[SoundMixer] Error resuming context on volume action:`, err);
      });

    const updated = sounds.map((s) => {
      if (s.type === type) {
        audioSynthesizer.setVolume(type, val);
        return { ...s, volume: val };
      }
      return s;
    });
    setSounds(updated);
  };

  const handleAllSilence = () => {
    audioSynthesizer.stopAll();
    setSounds(sounds.map((s) => ({ ...s, isPlaying: false })));
    setMixerActive(false);
  };

  return (
    <div 
      id="ambient_sound_mixer_wrapper" 
      className={`bg-theme-panel backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] w-full flex flex-col transition-all duration-500 border ${
        mixerActive 
          ? 'border-accent/35 shadow-accent/[0.08] scale-[1.015]' 
          : 'border-theme-border shadow-accent/[0.03]'
      }`}
    >
      {/* Header section */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FlameKindling size={16} className={mixerActive ? "text-accent animate-pulse" : "text-zinc-500"} />
          <h3 className="text-xs uppercase font-bold tracking-widest font-mono text-zinc-300">
            Ambient Generator
          </h3>
        </div>
        {mixerActive && (
          <button
            onClick={handleAllSilence}
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-900/50 hover:text-white transition cursor-pointer"
          >
            <VolumeX size={11} />
            <span>MUTE LIST</span>
          </button>
        )}
      </div>

      {/* System controllers stack */}
      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
        {sounds.map((sound) => (
          <div
            key={sound.id}
            className={`flex flex-col gap-2 p-3 rounded-xl transition duration-300 border ${
              sound.isPlaying 
                ? 'bg-accent/5 border-accent/25 shadow-[0_0_12px_rgba(var(--accent-glow),0.02)]' 
                : 'bg-transparent border-transparent hover:bg-white/2 hover:border-white/5'
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => handleToggleSound(sound.type)}
                className="flex items-center gap-3 text-left flex-1 cursor-pointer select-none"
              >
                <div className={`p-2.5 rounded-xl border transition duration-300 ${
                  sound.isPlaying 
                    ? 'bg-accent/10 border-accent/20' 
                    : 'bg-zinc-800/20 border-white/5'
                }`}>
                  {renderIcon(sound.iconName, sound.isPlaying)}
                </div>
                <div className="flex flex-col select-none">
                  <span className={`text-xs font-semibold tracking-wide ${
                    sound.isPlaying ? 'text-[#fafafa]' : 'text-zinc-400'
                  }`}>
                    {sound.name}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 tracking-wider">
                    {sound.isPlaying ? 'PROCEDURAL: RUNNING' : 'STANDING BY'}
                  </span>
                </div>
              </button>

              {sound.isPlaying ? (
                <div className="flex items-center gap-2 w-24">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={sound.volume}
                    onChange={(e) => handleVolumeChange(sound.type, parseFloat(e.target.value))}
                    className="w-full accent-accent h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-zinc-500 w-5 text-right font-bold">
                    {Math.round(sound.volume * 100)}%
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => handleToggleSound(sound.type)}
                  className="text-[10px] font-mono font-bold text-zinc-500 hover:text-white px-2 py-1 rounded border border-zinc-700/50 hover:bg-zinc-800/40 select-none cursor-pointer"
                >
                  PLAY
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
