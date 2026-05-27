import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Settings, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { TimerMode, TimerSettings } from '../types';

interface TimerProps {
  onTimerComplete?: (mode: TimerMode) => void;
}

export default function Timer({ onTimerComplete }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>('work');
  const [settings, setSettings] = useState<TimerSettings>({
    work: 25,
    short: 5,
    long: 15,
    autoStartBreaks: true,
    autoStartPomodoros: false,
  });

  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync time left when mode or mode configuration settings change
  useEffect(() => {
    setTimeLeft(settings[mode] * 60);
    setIsRunning(false);
  }, [mode, settings]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    // Play a gentle haptic sound click
    playBeep(440, 0.05);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings[mode] * 60);
    playBeep(330, 0.08);
  };

  const playBeep = (frequency = 523.25, duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // safe fallback
    }
  };

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Play premium chime combination
    if (soundEnabled) {
      playBeep(523.25, 0.15); // C5
      setTimeout(() => playBeep(659.25, 0.15), 150); // E5
      setTimeout(() => playBeep(783.99, 0.3), 300); // G5
    }

    if (onTimerComplete) {
      onTimerComplete(mode);
    }

    // Advance session modes
    if (mode === 'work') {
      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);
      // Run short break or long break (every 4 loops)
      const nextMode = nextCount % 4 === 0 ? 'long' : 'short';
      setMode(nextMode);
      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      setMode('work');
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    }
  };

  const handleSettingChange = (key: keyof TimerSettings, value: number | boolean) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === mode && typeof value === 'number') {
        setTimeLeft(value * 60);
      }
      return updated;
    });
  };

  // String formatting functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const modeLabels: Record<TimerMode, string> = {
    work: 'Deep focus',
    short: 'Short Rest',
    long: 'Unwind break',
  };

  const totalPossibleSeconds = settings[mode] * 60;
  const percentageCompleted = ((totalPossibleSeconds - timeLeft) / totalPossibleSeconds) * 100;

  // Render Component UI
  return (
    <div id="pomodoro_timer_wrapper" className="relative bg-theme-panel border border-theme-border backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.22)] shadow-accent/[0.06] flex flex-col items-center w-full max-w-sm transition-all duration-500">
      
      {/* Header section */}
      <div className="flex justify-between items-center w-full mb-6">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs uppercase tracking-widest font-semibold text-zinc-400 font-mono">
            {modeLabels[mode]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
            title={soundEnabled ? "Mute chime" : "Enable chime"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              showSettings ? 'bg-accent text-white' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {showSettings ? (
        <div className="w-full flex flex-col gap-4 py-2 font-mono text-xs">
          <h3 className="font-semibold text-zinc-300 border-b border-white/5 pb-2 uppercase tracking-wider">Configure intervals</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">FOCUS</span>
              <input
                type="number"
                min="1"
                max="180"
                value={settings.work}
                onChange={(e) => handleSettingChange('work', Math.max(1, parseInt(e.target.value) || 25))}
                className="w-full bg-black/40 text-center border border-white/10 rounded-lg p-1.5 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">SHORT</span>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.short}
                onChange={(e) => handleSettingChange('short', Math.max(1, parseInt(e.target.value) || 5))}
                className="w-full bg-black/40 text-center border border-white/10 rounded-lg p-1.5 focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block mb-1">LONG</span>
              <input
                type="number"
                min="1"
                max="120"
                value={settings.long}
                onChange={(e) => handleSettingChange('long', Math.max(1, parseInt(e.target.value) || 15))}
                className="w-full bg-black/40 text-center border border-white/10 rounded-lg p-1.5 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2 border-t border-white/5 pt-3">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-zinc-400">Trigger Auto Breaks</span>
              <input
                type="checkbox"
                checked={settings.autoStartBreaks}
                onChange={(e) => handleSettingChange('autoStartBreaks', e.target.checked)}
                className="accent-accent"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-zinc-400">Trigger Auto Focus loops</span>
              <input
                type="checkbox"
                checked={settings.autoStartPomodoros}
                onChange={(e) => handleSettingChange('autoStartPomodoros', e.target.checked)}
                className="accent-accent"
              />
            </label>
          </div>

          <button
            onClick={() => setShowSettings(false)}
            className="w-full mt-2 bg-zinc-800 hover:bg-zinc-700 py-2 rounded-xl text-zinc-200 transition font-sans font-medium cursor-pointer"
          >
            Collapse Settings
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center w-full">
          {/* Circular progress container */}
          <div className="relative w-56 h-56 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="95"
                className="stroke-zinc-800/60 fill-none"
                strokeWidth="7"
              />
              <circle
                cx="112"
                cy="112"
                r="95"
                className="stroke-accent fill-none transition-all duration-300"
                strokeWidth="7"
                strokeDasharray={2 * Math.PI * 95}
                strokeDashoffset={2 * Math.PI * 95 * (1 - percentageCompleted / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Content overlay in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="text-4xl font-light font-mono text-white tracking-widest">
                {formatTime(timeLeft)}
              </span>
              <div className="flex items-center gap-1.5 mt-2 text-zinc-500 font-mono text-[10px]">
                <CheckCircle2 size={11} className="text-accent" />
                <span>POUND: {pomodoroCount} COMPLETED</span>
              </div>
            </div>
          </div>

          {/* Quick preset modes tab buttons */}
          <div className="flex justify-center gap-1.5 w-full bg-black/25 p-1 rounded-2xl mb-6">
            <button
              onClick={() => setMode('work')}
              className={`flex-1 text-center py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-xl transition cursor-pointer ${
                mode === 'work' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Interval
            </button>
            <button
              onClick={() => setMode('short')}
              className={`flex-1 text-center py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-xl transition cursor-pointer ${
                mode === 'short' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Short
            </button>
            <button
              onClick={() => setMode('long')}
              className={`flex-1 text-center py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-xl transition cursor-pointer ${
                mode === 'long' ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Long
            </button>
          </div>

          {/* Core play/pause control action panel */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={resetTimer}
              className="p-3 bg-white/5 border border-white/5 rounded-full text-zinc-400 hover:text-white hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Reset timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={toggleTimer}
              className={`p-5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-accent hover:bg-accent-hover text-white'
              }`}
              title={isRunning ? "Pause" : "Start Focus Cycle"}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>

            <button
              onClick={handleTimerComplete}
              className="p-3 bg-white/5 border border-white/5 rounded-full text-zinc-400 hover:text-white hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Skip this interval"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
