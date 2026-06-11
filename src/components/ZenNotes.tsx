import React, { useState, useEffect } from 'react';
import { PenTool, CheckCircle, Save, Delete, FileText, Type } from 'lucide-react';

const DEFAULT_NOTES = `Welcome to FlowState Focus Workspace!

★ WHAT IT DOES:
- Aesthetic Focus Ambient Player: Immersive background scenes custom-built with widescreen scenic videos and sound triggers.
- AI Scenic Generator: Enter any prompt in the 'Scene Switcher' (e.g. "rainy retro-cyberpunk cafe") to generate custom-designed backgrounds fueled by Gemini, completely fallback-safe!
- Web Audio Synthesizer: Fully-procedural ambient noise machine triggering organic sounds (rain, cafe chat, cozy fireplace click, rustling leaves) without draining internet bandwidth.
- Spotify Widget: Clean music integrations sized to a perfect, distraction-free 160px layout.
- Minimalist Task Master: To-do items for structure.

📌 IMPORTANT LOCAL-STORAGE NOTES:
1. 100% Client-Side Privacy: All task lists, selected background configurations, themes, active scenes, and scratchpad writings are stored directly inside your browser cache (localStorage).
2. Local Limitation: Clearing your browser history, cache, or using a private/incognito window will reset these values back to defaults.
3. No Cloud Tracking: FlowState never uploads any of your work notes, items, or checklists to a remote server. Everything remains securely on your local machine.`;

export default function ZenNotes() {
  const [content, setContent] = useState(DEFAULT_NOTES);
  const [title, setTitle] = useState('FlowState Focus Notes');
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [fontSize, setFontSize] = useState<'text-xs' | 'text-sm' | 'text-base'>('text-sm');

  // Load notes initially from localStorage
  useEffect(() => {
    try {
      const storedContent = localStorage.getItem('zenspace_notes_content');
      const storedTitle = localStorage.getItem('zenspace_notes_title');
      if (storedContent !== null) setContent(storedContent);
      if (storedTitle !== null) setTitle(storedTitle);
    } catch (e) {
      console.warn("Could not retrieve notes storage:", e);
    }
  }, []);

  // Soft auto-saver timer block
  useEffect(() => {
    if (content === '') return;
    
    setSavingState('saving');
    const autoSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem('zenspace_notes_content', content);
        localStorage.setItem('zenspace_notes_title', title);
        setSavingState('saved');
      } catch (e) {
        console.warn("Could not persist workspace notes:", e);
        setSavingState('idle');
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(autoSaveTimer);
  }, [content, title]);

  const handleClearNotes = () => {
    if (window.confirm("Do you want to discard your notes workspace? This is irreversible.")) {
      setContent('');
      setTitle('FlowState Focus Notes');
      localStorage.removeItem('zenspace_notes_content');
      localStorage.removeItem('zenspace_notes_title');
      setSavingState('saved');
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div id="zen_notes_scratchpad_container" className="bg-theme-panel border border-theme-border backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] shadow-accent/[0.05] w-full flex flex-col transition-all duration-500">
      
      {/* Header element */}
      <div className="flex justify-between items-center mb-3.5">
        <div className="flex items-center gap-2">
          <PenTool size={15} className="text-accent" />
          <h3 className="text-xs uppercase font-bold tracking-widest font-mono text-zinc-300">
            Scratch Pad
          </h3>
        </div>

        {/* State Indicators */}
        <div className="flex items-center gap-2.5">
          <span className="text-[8px] font-mono tracking-wider transition-colors duration-300">
            {savingState === 'saving' && <span className="text-amber-400 animate-pulse">● SAVING...</span>}
            {savingState === 'saved' && <span className="text-emerald-400">● SECURED</span>}
            {savingState === 'idle' && <span className="text-zinc-500">STANDBY</span>}
          </span>
          <button
            onClick={handleClearNotes}
            className="text-[9px] font-mono text-zinc-500 hover:text-[#ff4a4a] border border-zinc-700/50 hover:border-rose-950 px-2 py-0.5 rounded transition cursor-pointer bg-zinc-900/20"
            title="Wipe notes"
          >
            DISCARD
          </button>
        </div>
      </div>

      {/* Editor Frame */}
      <div className="flex flex-col gap-2 bg-black/15 border border-white/5 rounded-xl p-3">
        {/* Note title editable block */}
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSavingState('saving');
          }}
          className="bg-transparent text-xs font-bold text-zinc-200 border-b border-white/5 pb-1 focus:outline-none focus:border-accent tracking-wide font-sans placeholder-zinc-500"
          placeholder="Rename document..."
        />

        {/* Text Area */}
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setSavingState('saving');
          }}
          className={`w-full bg-transparent text-zinc-300 focus:outline-none resize-none font-sans overflow-y-auto leading-relaxed h-32 pl-0.5 placeholder-zinc-600 ${fontSize}`}
          placeholder="Write down anything to clear your mind. Thoughts persist across browser updates..."
        />

        {/* Bottom toolbar section */}
        <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-1 select-none">
          {/* Metadata counts */}
          <div className="flex gap-3 text-[9px] text-zinc-500 font-mono">
            <span>{wordCount} WORDS</span>
            <span>{charCount} CHARACTERS</span>
          </div>

          {/* Size modifier options */}
          <div className="flex items-center gap-1.5 bg-black/30 p-0.5 rounded-lg border border-white/5">
            <span className="text-[8px] font-mono text-zinc-500 font-bold px-1 uppercase tracking-wider">
              Font size:
            </span>
            <button
              onClick={() => setFontSize('text-xs')}
              className={`px-1.5 py-0.5 text-[8px] font-bold rounded transiton cursor-pointer uppercase ${
                fontSize === 'text-xs' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Sm
            </button>
            <button
              onClick={() => setFontSize('text-sm')}
              className={`px-1.5 py-0.5 text-[8px] font-bold rounded transiton cursor-pointer uppercase ${
                fontSize === 'text-sm' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Med
            </button>
            <button
              onClick={() => setFontSize('text-base')}
              className={`px-1.5 py-0.5 text-[8px] font-bold rounded transiton cursor-pointer uppercase ${
                fontSize === 'text-base' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Lg
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
