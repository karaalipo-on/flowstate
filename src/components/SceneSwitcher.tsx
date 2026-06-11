import React, { useState, useEffect } from 'react';
import { Palette, Plus, Trash2, Video, Sparkles, Image, Check } from 'lucide-react';
import { Scene } from '../types';
import { SCENES } from '../data/scenes';

interface SceneSwitcherProps {
  activeScene: Scene;
  onSceneSelect: (scene: Scene) => void;
  colorTheme: 'night' | 'warm' | 'cozy' | 'summer' | 'fall' | 'glass' | 'none';
  onColorThemeSelect: (theme: 'night' | 'warm' | 'cozy' | 'summer' | 'fall' | 'glass' | 'none') => void;
}

export default function SceneSwitcher({ 
  activeScene, 
  onSceneSelect,
  colorTheme,
  onColorThemeSelect
}: SceneSwitcherProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Custom scenes state with persistent localStorage
  const [customScenes, setCustomScenes] = useState<Scene[]>(() => {
    try {
      const stored = localStorage.getItem('flowstate_custom_scenes');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Save changes to storage
  useEffect(() => {
    localStorage.setItem('flowstate_custom_scenes', JSON.stringify(customScenes));
  }, [customScenes]);

  // Form input states
  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneUrl, setNewSceneUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const THEMES = [
    { id: 'night', label: 'Night ✦', desc: 'Celestial indigo & violet', grad: 'from-indigo-500/85 to-purple-600/85', border: 'border-indigo-500/30' },
    { id: 'warm', label: 'Warm ✦', desc: 'Amber twilight glow', grad: 'from-amber-500/85 to-orange-500/85', border: 'border-amber-500/30' },
    { id: 'cozy', label: 'Cozy ✦', desc: 'Woodland fire & rose', grad: 'from-rose-500/85 to-red-500/85', border: 'border-rose-500/30' },
    { id: 'summer', label: 'Summer ✦', desc: 'Emerald salt water breeze', grad: 'from-teal-500/85 to-emerald-400/85', border: 'border-teal-500/30' },
    { id: 'fall', label: 'Fall ✦', desc: 'Autumn maple terracotta', grad: 'from-orange-500/85 to-red-600/85', border: 'border-orange-500/30' },
    { id: 'glass', label: 'Glass ✦', desc: 'White frosted glassmorphism', grad: 'from-white to-slate-300', border: 'border-white/35' },
  ] as const;

  const handleCreateCustomScene = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newSceneName.trim()) {
      setErrorMessage('Please enter a display name for the space.');
      return;
    }
    if (!newSceneUrl.trim()) {
      setErrorMessage('Please enter a valid image or video link URL.');
      return;
    }

    let trimmedUrl = newSceneUrl.trim();
    const urlLower = trimmedUrl.toLowerCase();
    
    // Automatically convert common Unsplash sharing / details links to direct high-res images
    if (urlLower.includes('unsplash.com/photos/')) {
      const parts = trimmedUrl.split('/');
      const photoIndex = parts.indexOf('photos');
      if (photoIndex !== -1 && parts[photoIndex + 1]) {
        let id = parts[photoIndex + 1];
        if (id.includes('?')) {
          id = id.split('?')[0];
        }
        trimmedUrl = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1920&q=80`;
      }
    }

    const updatedUrlLower = trimmedUrl.toLowerCase();

    // Auto-detect if direct video or picture
    const isDirectVideo = updatedUrlLower.includes('.mp4') || 
                          updatedUrlLower.includes('.webm') || 
                          updatedUrlLower.includes('.m4v') ||
                          updatedUrlLower.includes('video/preview');
                          
    const finalType = isDirectVideo ? 'video' : 'ai-image';

    // Set fallback thumbnail
    const finalThumb = isDirectVideo 
      ? 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=150&auto=format&fit=crop&q=60'
      : trimmedUrl;

    const newScene: Scene = {
      id: `custom-${Date.now()}`,
      name: newSceneName.trim(),
      category: 'aesthetic',
      type: finalType,
      url: trimmedUrl,
      credit: 'User Loaded Backdrop',
      thumbnailUrl: finalThumb
    };

    const updated = [newScene, ...customScenes];
    setCustomScenes(updated);
    
    // Select the newly loaded custom room immediately!
    onSceneSelect(newScene);

    // Reset input fields
    setNewSceneName('');
    setNewSceneUrl('');
    setShowAddForm(false);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Auto-reset confirmation state after 4 seconds of inactivity
  useEffect(() => {
    if (!confirmDeleteId) return;
    const timer = setTimeout(() => {
      setConfirmDeleteId(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [confirmDeleteId]);

  const handleDeleteCustomScene = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting the deleted scene
    
    if (confirmDeleteId !== idToDelete) {
      setConfirmDeleteId(idToDelete);
      return;
    }

    // Secondary click: actually delete
    const updated = customScenes.filter(s => s.id !== idToDelete);
    setCustomScenes(updated);
    setConfirmDeleteId(null);
    
    // If the currently active scene was deleted, fallback to the default list first item
    if (activeScene.id === idToDelete) {
      onSceneSelect(SCENES[0]);
    }
  };

  // Combine default fallback scenes list with custom ones
  const allAvailableScenes = [...customScenes, ...SCENES];

  return (
    <div id="scene_switcher_widget_wrapper" className="bg-theme-panel border border-theme-border backdrop-blur-xl rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] shadow-accent/[0.05] w-full flex flex-col gap-6 transition-all duration-500">
      
      {/* 2. Unified Card Header */}
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Palette size={15} className="text-accent" />
          <h3 className="text-xs uppercase font-bold tracking-widest font-mono text-zinc-300">
            Atmosphere Workspace
          </h3>
        </div>
      </div>

      {/* 3. Integrated Color Theme Selection Deck */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
            🎨 Active Color Theme
          </span>
          {colorTheme !== 'none' && (
            <button
              onClick={() => onColorThemeSelect('none')}
              className="text-[9px] font-mono font-bold uppercase text-accent hover:text-white cursor-pointer transition select-none flex items-center gap-1 hover:underline"
              title="Reset color theme back to default neutral focus style"
            >
              Reset to Default
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {THEMES.map((t) => {
            const isSelected = colorTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onColorThemeSelect(t.id)}
                className={`relative group text-left rounded-xl p-2.5 overflow-hidden border transition-all duration-300 select-none cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'border-accent shadow-md bg-accent/5 ring-1 ring-accent scale-102 font-black' 
                    : 'border-white/5 hover:border-white/15 bg-black/15'
                }`}
                title={t.desc}
              >
                {/* Micro mini linear gradient block */}
                <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${t.grad} mb-2`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`text-[10px] font-semibold tracking-wide ${
                      isSelected ? 'text-accent' : 'text-zinc-200'
                    }`}>
                      {t.label}
                    </span>
                    <span className="block text-[8px] font-mono text-zinc-500 lowercase leading-tight mt-0.5">
                      {t.desc}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="bg-accent/20 p-0.5 rounded-full text-accent">
                      <Check size={8} strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Backdrop Custom Spaces Deck */}
      <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
            ✦ Stored Custom Spaces
          </span>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider rounded border flex items-center gap-1 cursor-pointer transition select-none uppercase ${
              showAddForm
                ? 'bg-zinc-800 border-zinc-700 text-zinc-355'
                : 'bg-accent/10 border-accent/20 text-accent hover:bg-accent/20'
            }`}
          >
            <Plus size={10} />
            <span>Load Space</span>
          </button>
        </div>

        {/* Slide-down dynamic custom URL backdrop space loader */}
        {showAddForm && (
          <div className="p-3.5 rounded-xl bg-black/45 border border-white/5 flex flex-col gap-3 transition">
            <div className="text-[9px] font-mono font-bold text-accent uppercase tracking-wider">
              ✦ Custom Atmosphere Assembler
            </div>

            <form onSubmit={handleCreateCustomScene} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Display Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Stream Window Cabin"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-white/10 rounded-lg text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-accent/40"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Image / Direct MP4 URL</label>
                <input
                  type="url"
                  required
                  placeholder="Paste direct wallpaper, direct mp4, or web.gif link"
                  value={newSceneUrl}
                  onChange={(e) => setNewSceneUrl(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-zinc-950 border border-white/10 rounded-lg text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-accent/40"
                />
                <span className="text-[8px] font-mono text-zinc-500 lowercase mt-0.5">
                  * Auto-detects direct video/image links (including Unsplash photo references).
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white font-mono text-[10px] font-bold uppercase transition select-none cursor-pointer"
              >
                Assemble Space
              </button>
            </form>

            {errorMessage && (
              <p className="text-[9px] font-mono text-red-400 font-bold tracking-wide">
                ✦ {errorMessage}
              </p>
            )}
          </div>
        )}

        {/* List of Custom Sceneries */}
        <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {allAvailableScenes.map((scene) => {
            const isActive = scene.id === activeScene.id;
            const isUserCustom = scene.id.startsWith('custom-') || scene.id.startsWith('custom');
            return (
              <div
                key={scene.id}
                onClick={() => onSceneSelect(scene)}
                className={`group relative text-left rounded-xl overflow-hidden cursor-pointer border transition-all duration-300 aspect-[16/10] ${
                  isActive 
                    ? 'border-accent shadow-md ring-1 ring-accent' 
                    : 'border-white/5 hover:border-white/15'
                }`}
              >
                {/* Overlay Thumbnail backdrop image */}
                <img
                  src={scene.thumbnailUrl}
                  alt={scene.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:scale-105 transition-all duration-500 pointer-events-none"
                />

                {/* Tint filter overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-transparent to-transparent z-10 pointer-events-none" />

                {/* Details */}
                <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-col pointer-events-none select-none">
                  <span className={`text-[9px] font-semibold tracking-wider leading-tight line-clamp-1 transition duration-300 ${
                    isActive ? 'text-accent font-extrabold' : 'text-zinc-200 group-hover:text-white'
                  }`}>
                    {scene.name}
                  </span>
                  <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                    {isUserCustom ? 'User Personal Space' : 'Stable Fallback'}
                  </span>
                </div>

                {/* Delete button option for custom scenes */}
                {isUserCustom && (
                  <button
                    onClick={(e) => handleDeleteCustomScene(scene.id, e)}
                    className={`absolute top-2 left-2 z-40 p-1 rounded-md border transition-all duration-300 flex items-center gap-1 select-none cursor-pointer ${
                      confirmDeleteId === scene.id
                        ? 'bg-red-600/90 border-red-500 text-white scale-105 opacity-100'
                        : 'bg-black/60 border-white/5 text-zinc-400 hover:text-red-400 opacity-90 sm:opacity-0 group-hover:opacity-100'
                    }`}
                    title={confirmDeleteId === scene.id ? "Click again to confirm delete" : "Remove custom space"}
                  >
                    <Trash2 size={10} />
                    {confirmDeleteId === scene.id && (
                      <span className="text-[8px] font-mono font-black tracking-wider uppercase pr-0.5">Delete?</span>
                    )}
                  </button>
                )}

                {/* Decorative indicator / Type indicator tag */}
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1 pointer-events-none">
                  {scene.type === 'ai-image' ? (
                    <Sparkles size={9} className={`${isActive ? 'text-accent' : 'text-zinc-400'}`} />
                  ) : (
                    <Video size={9} className={`${isActive ? 'text-accent animate-pulse' : 'text-zinc-500'}`} />
                  )}
                  
                  {isActive && (
                    <div className="bg-accent/60 p-1 rounded-full">
                      <div className="flex gap-0.5 items-center justify-center">
                        <span className="w-0.5 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="w-0.5 h-1.2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {allAvailableScenes.length <= 1 && (
          <div className="py-5 text-center bg-black/20 rounded-xl border border-dashed border-white/5 flex flex-col items-center justify-center gap-1">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wide">
              No custom spaces added yet
            </span>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[8px] font-mono text-accent hover:underline uppercase tracking-widest font-bold"
            >
              ✦ LOAD NEW URL BACKDROP
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
