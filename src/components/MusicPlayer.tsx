import React, { useState } from 'react';

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
  if (url.includes('list=')) {
    const m = url.match(/[&?]list=([^&]+)/);
    if (m) {
      return `https://www.youtube.com/embed/videoseries?list=${m[1]}&autoplay=0`;
    }
  }
  if (url.includes('watch?v=')) {
    const m = url.match(/[&?]v=([^&]+)/);
    if (m) {
      return `https://www.youtube.com/embed/${m[1]}?autoplay=0&playlist=${m[1]}&loop=1`;
    }
  }
  if (url.includes('youtu.be/')) {
    const parts = url.split('/');
    let id = parts[parts.length - 1];
    if (id.includes('?')) {
      id = id.split('?')[0];
    }
    return `https://www.youtube.com/embed/${id}?autoplay=0&playlist=${id}&loop=1`;
  }
  if (url.includes('/embed/')) {
    return url;
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
              src={activeEmbedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              allowFullScreen={false}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full h-full object-cover rounded-xl"
              title="Music Player Widget"
            />
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
