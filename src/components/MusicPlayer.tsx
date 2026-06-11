import React, { useState, useEffect } from 'react';

function convertSpotifyUrlToEmbed(url: string): string {
  if (!url) return '';
  const m = url.match(/spotify\.com\/(playlist|album|track|artist)\/([a-zA-Z0-9]+)/);
  if (m) {
    const type = m[1];
    const id = m[2];
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  }
  return url;
}

function convertYoutubeUrlToEmbed(url: string): string {
  if (!url) return '';
  const originParam = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
  if (url.includes('list=')) {
    const m = url.match(/[&?]list=([^&]+)/);
    if (m) {
      return `https://www.youtube.com/embed/videoseries?list=${m[1]}&autoplay=0&enablejsapi=1${originParam}`;
    }
  }
  if (url.includes('watch?v=')) {
    const m = url.match(/[&?]v=([^&]+)/);
    if (m) {
      return `https://www.youtube.com/embed/${m[1]}?autoplay=0&playlist=${m[1]}&loop=1&enablejsapi=1${originParam}`;
    }
  }
  if (url.includes('youtu.be/')) {
    const parts = url.split('/');
    let id = parts[parts.length - 1];
    if (id.includes('?')) {
      id = id.split('?')[0];
    }
    return `https://www.youtube.com/embed/${id}?autoplay=0&playlist=${id}&loop=1&enablejsapi=1${originParam}`;
  }
  if (url.includes('/embed/')) {
    const base = url.includes('?') ? `${url}&enablejsapi=1` : `${url}?enablejsapi=1`;
    return `${base}${originParam}`;
  }
  return '';
}

export default function MusicPlayer() {
  const [playlistInput, setPlaylistInput] = useState(() => {
    try {
      return localStorage.getItem('flowstate_custom_playlist_input') || '';
    } catch {
      return '';
    }
  });

  const [activeEmbedUrl, setActiveEmbedUrl] = useState(() => {
    try {
      return localStorage.getItem('flowstate_custom_playlist_active_url') || '';
    } catch {
      return '';
    }
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(() => {
    try {
      const stored = localStorage.getItem('flowstate_media_player_volume');
      return stored ? parseFloat(stored) : 0.5;
    } catch {
      return 0.5;
    }
  });

  // Sync volume state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flowstate_media_player_volume', volume.toString());
    } catch {}
  }, [volume]);

  // Adjust volume of player dynamically
  useEffect(() => {
    const iframe = document.getElementById('media_widget_iframe') as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      try {
        const payload = {
          event: "command",
          func: "setVolume",
          args: [Math.round(volume * 100)]
        };
        // Send stringified version
        iframe.contentWindow.postMessage(JSON.stringify(payload), "*");
        // Also send raw object for compatibility
        iframe.contentWindow.postMessage(payload, "*");
      } catch (err) {
        console.warn("Could not post volume play control command to iframe:", err);
      }
    }
  }, [volume, activeEmbedUrl]);

  const restoreVolumeConfig = () => {
    const iframe = document.getElementById('media_widget_iframe') as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      try {
        const payload = {
          event: "command",
          func: "setVolume",
          args: [Math.round(volume * 100)]
        };
        iframe.contentWindow.postMessage(JSON.stringify(payload), "*");
        iframe.contentWindow.postMessage(payload, "*");
      } catch (err) {}
    }
  };

  const handleIframeLoad = () => {
    // Send standard initial volume config
    restoreVolumeConfig();
    
    // YouTube iframe API needs time to bind listener hooks post-render
    const timings = [200, 800, 1800, 3000];
    timings.forEach((delay) => {
      setTimeout(() => {
        restoreVolumeConfig();
      }, delay);
    });
  };

  const getEmbedHeight = () => {
    if (!activeEmbedUrl) return 'h-0';
    return 'h-[160px]';
  };

  const handleLoadMusic = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const input = playlistInput.trim();

    if (!input) {
      setErrorMessage('Please enter or paste a valid link first.');
      return;
    }

    let parsedUrl = '';
    if (input.includes('spotify.com')) {
      parsedUrl = convertSpotifyUrlToEmbed(input);
    } else if (input.includes('youtube.com') || input.includes('youtu.be')) {
      parsedUrl = convertYoutubeUrlToEmbed(input);
    } else if (input.includes('/embed/')) {
      parsedUrl = input;
    }

    if (!parsedUrl) {
      setErrorMessage('Please enter a valid Spotify or YouTube URL.');
      return;
    }

    try {
      localStorage.setItem('flowstate_custom_playlist_input', input);
      localStorage.setItem('flowstate_custom_playlist_active_url', parsedUrl);
    } catch (e) {
      console.warn("Storage write blocked:", e);
    }

    setActiveEmbedUrl(parsedUrl);
  };

  return (
    <div id="media_players_widget" className="p-4 rounded-2xl bg-zinc-950/45 border border-white/5 backdrop-blur-3xl flex flex-col gap-3.5">
      
      {/* Interactive Embed Iframe */}
      {activeEmbedUrl && (
        <div className="flex flex-col gap-2">
          <div className={`w-full ${getEmbedHeight()} rounded-xl overflow-hidden bg-black/60 border border-white/5 relative z-10 transition-all duration-300`}>
            <iframe
              id="media_widget_iframe"
              src={activeEmbedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full h-full object-cover rounded-xl"
              title="Music Player Widget"
              onLoad={handleIframeLoad}
            />
          </div>

          {/* Custom Volume Controls */}
          <div className="flex flex-col gap-1.5 bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 my-0.5">
            <div className="flex items-center justify-between gap-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 tracking-wider">
                🔊 Media Volume
              </span>
              <span className="text-[10px] font-mono font-bold text-accent">
                {Math.round(volume * 100)}%
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs select-none">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-accent h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                title="Adjust music volume separately from computer sound"
              />
              <span className="text-xs select-none">🔊</span>
            </div>
            
            <p className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest text-center mt-0.5 leading-normal">
              {activeEmbedUrl.toLowerCase().includes('spotify')
                ? 'ℹ️ Spotify volume controls are native to standard Spotify overlay'
                : '🚀 Dynamic YouTube background hardware control active'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveEmbedUrl('');
              try {
                localStorage.removeItem('flowstate_custom_playlist_active_url');
              } catch (err) {}
            }}
            className="w-full py-2 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-sans text-[10px] uppercase font-bold tracking-wider transition-all select-none cursor-pointer text-center"
          >
            CLOSE MEDIA PLAYER
          </button>
        </div>
      )}

      {/* Styled Form matches requested screenshot mockup exactly */}
      <form onSubmit={handleLoadMusic} className="flex flex-col gap-3.5">
        <input
          type="text"
          placeholder="Paste URL..."
          value={playlistInput}
          onChange={(e) => setPlaylistInput(e.target.value)}
          className="w-full px-4.5 py-3 text-xs font-mono bg-[#111112] border border-white/10 rounded-xl text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-white/20 transition-all"
        />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-sans font-bold text-xs uppercase tracking-wider transition-all select-none cursor-pointer text-center"
        >
          LOAD MUSIC
        </button>
      </form>

      {/* Clean helper explanation label */}
      <p className="text-[10px] font-sans text-zinc-500 italic leading-relaxed text-center px-1">
        Paste a Spotify playlist link or a YouTube video/playlist link to load it into your workspace.
      </p>

      {errorMessage && (
        <p className="text-[9px] font-mono text-red-400 text-center leading-none">
          ⚠️ {errorMessage}
        </p>
      )}

    </div>
  );
}
