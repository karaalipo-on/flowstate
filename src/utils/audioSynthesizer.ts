import { SoundGeneratorType } from '../types';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  
  // Track active synthesizer or audio nodes for each sound type
  private activeSounds: Map<
    SoundGeneratorType,
    {
      source: AudioNode[];
      gainNode: GainNode;
      intervals?: number[];
      audio?: HTMLAudioElement;
      activeSub?: string;
    }
  > = new Map();

  // Cache decoded audio buffers
  private decodedBuffers: Map<string, AudioBuffer> = new Map();

  // Selected volume states
  private volumes: Record<SoundGeneratorType, number> = {
    'binaural': 0.25,
    'theta': 0.3,
    'delta': 0.3,
    'cafe': 0.35,
    'waves': 0.3,
    'wind': 0.25,
    'rain': 0.4,
    'birds': 0.3,
    'forest': 0.35,
    'water': 0.35,
    'drive': 0.5,
  };

  constructor() {
    // AudioContext is initialized lazily on first user interaction due to browser policies
  }

  private initContext() {
    if (this.ctx) return;
    
    // Create AudioContext with fallback
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported in this browser");
      return;
    }
    
    this.ctx = new AudioContextClass();
    
    // Master controller
    this.masterVolume = this.ctx.createGain();
    this.masterVolume.gain.value = 1.0;
    this.masterVolume.connect(this.ctx.destination);
  }

  /**
   * Safe getter for context
   */
  getContext(): AudioContext | null {
    this.initContext();
    return this.ctx;
  }

  /**
   * Resumes AudioContext if suspended (browser behavior)
   */
  async resumeContext(): Promise<boolean> {
    this.initContext();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    return true;
  }

  /**
   * Helper to create a loopable Pink Noise buffer (needed by Delta wave)
   */
  private createPinkNoiseBuffer(seconds = 2): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not initialized");
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Kellet's refined pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11; // Adjust gain
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * Synchronously triggers AudioContext resume under user click event frame
   */
  private resumeContextSync() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch((e) => console.warn("Could not resume AudioContext:", e));
    }
  }

  /**
   * Starts a specific sound with optional subtype
   */
  startSound(type: SoundGeneratorType, subFile?: string) {
    const isProcedural = 
      type === 'binaural' || 
      type === 'theta' || 
      type === 'delta';
    
    // Synchronously activate context to bypass strict autoplay browser policies
    this.resumeContextSync();
    if (!this.ctx || !this.masterVolume) return;

    // Check if sound is already playing
    if (this.activeSounds.has(type)) {
      this.stopSound(type);
    }

    const sourceNodes: AudioNode[] = [];
    const intervalIds: number[] = [];
    
    // Create isolated control gain node for this sound type
    const soundGain = this.ctx.createGain();
    soundGain.gain.setValueAtTime(0, this.ctx.currentTime);
    soundGain.connect(this.masterVolume);

    // Resolve default active subfile for each category
    const activeSub = subFile || (
      type === 'cafe' ? 'cafe-ambience' :
      type === 'waves' ? 'gentle-ocean-shore-waves' :
      type === 'wind' ? 'soft-wind' :
      type === 'rain' ? 'relaxing-rain' :
      type === 'birds' ? 'birds-chirping' :
      type === 'forest' ? 'forest-ambience' :
      type === 'water' ? 'flowing-water' :
      ''
    );

    // Track active sound state immediately
    this.activeSounds.set(type, {
      source: sourceNodes,
      gainNode: soundGain,
      intervals: intervalIds,
      activeSub
    });

    try {
      if (isProcedural) {
        switch (type) {
          case 'binaural': {
            // Alpha Wave Flow: 220Hz and 228Hz (8Hz Alpha beat) for midscale tenor resonance
            const leftOsc = this.ctx.createOscillator();
            const rightOsc = this.ctx.createOscillator();
            leftOsc.type = 'sine';
            leftOsc.frequency.setValueAtTime(220, this.ctx.currentTime);
            rightOsc.type = 'sine';
            rightOsc.frequency.setValueAtTime(228, this.ctx.currentTime);

            // Subtle harmonic overlay
            const leftReson = this.ctx.createOscillator();
            const rightReson = this.ctx.createOscillator();
            leftReson.type = 'sine';
            leftReson.frequency.setValueAtTime(440, this.ctx.currentTime);
            rightReson.type = 'sine';
            rightReson.frequency.setValueAtTime(448, this.ctx.currentTime);

            const merger = this.ctx.createChannelMerger(2);
            const leftGain = this.ctx.createGain();
            const rightGain = this.ctx.createGain();
            const leftResonGain = this.ctx.createGain();
            const rightResonGain = this.ctx.createGain();

            leftGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            rightGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
            leftResonGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
            rightResonGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(450, this.ctx.currentTime);

            leftOsc.connect(leftGain);
            rightOsc.connect(rightGain);
            leftReson.connect(leftResonGain);
            rightReson.connect(rightResonGain);

            leftGain.connect(merger, 0, 0);
            rightGain.connect(merger, 0, 1);
            leftResonGain.connect(merger, 0, 0);
            rightResonGain.connect(merger, 0, 1);

            merger.connect(lowpass);
            lowpass.connect(soundGain);

            leftOsc.start();
            rightOsc.start();
            leftReson.start();
            rightReson.start();

            sourceNodes.push(leftOsc, rightOsc, leftReson, rightReson, leftGain, rightGain, leftResonGain, rightResonGain, merger, lowpass);
            break;
          }

          case 'theta': {
            // Theta Wave Flow: 140Hz and 146Hz (6Hz Theta beat)
            const leftOsc = this.ctx.createOscillator();
            const rightOsc = this.ctx.createOscillator();
            leftOsc.type = 'sine';
            leftOsc.frequency.setValueAtTime(140, this.ctx.currentTime);
            rightOsc.type = 'sine';
            rightOsc.frequency.setValueAtTime(146, this.ctx.currentTime);

            const merger = this.ctx.createChannelMerger(2);
            const leftGain = this.ctx.createGain();
            const rightGain = this.ctx.createGain();
            leftGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
            rightGain.gain.setValueAtTime(0.45, this.ctx.currentTime);

            const sweepFilter = this.ctx.createBiquadFilter();
            sweepFilter.type = 'lowpass';
            sweepFilter.frequency.setValueAtTime(150, this.ctx.currentTime);
            sweepFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12s cycle
            lfoGain.gain.setValueAtTime(45, this.ctx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(sweepFilter.frequency);

            leftOsc.connect(leftGain);
            rightOsc.connect(rightGain);
            leftGain.connect(merger, 0, 0);
            rightGain.connect(merger, 0, 1);

            merger.connect(sweepFilter);
            sweepFilter.connect(soundGain);

            lfo.start();
            leftOsc.start();
            rightOsc.start();

            sourceNodes.push(leftOsc, rightOsc, leftGain, rightGain, merger, sweepFilter, lfo, lfoGain);
            break;
          }

          case 'delta': {
            // Delta Wave Flow: 75Hz and 77.5Hz (2.5Hz Delta beat)
            const leftOsc = this.ctx.createOscillator();
            const rightOsc = this.ctx.createOscillator();
            leftOsc.type = 'sine';
            leftOsc.frequency.setValueAtTime(75, this.ctx.currentTime);
            rightOsc.type = 'sine';
            rightOsc.frequency.setValueAtTime(77.5, this.ctx.currentTime);

            const merger = this.ctx.createChannelMerger(2);
            const leftGain = this.ctx.createGain();
            const rightGain = this.ctx.createGain();
            leftGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            rightGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

            const subFilter = this.ctx.createBiquadFilter();
            subFilter.type = 'lowpass';
            subFilter.frequency.setValueAtTime(95, this.ctx.currentTime);

            leftOsc.connect(leftGain);
            rightOsc.connect(rightGain);
            leftGain.connect(merger, 0, 0);
            rightGain.connect(merger, 0, 1);

            // Deep Pink Space Rumble
            const pinkBuffer = this.createPinkNoiseBuffer();
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = pinkBuffer;
            noiseSource.loop = true;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(70, this.ctx.currentTime);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(soundGain);

            merger.connect(subFilter);
            subFilter.connect(soundGain);

            leftOsc.start();
            rightOsc.start();
            noiseSource.start();

            sourceNodes.push(leftOsc, rightOsc, leftGain, rightGain, merger, subFilter, noiseSource, noiseFilter, noiseGain);
            break;
          }
        }
        // Fade in procedural waves smoothly
        soundGain.gain.linearRampToValueAtTime(this.volumes[type], this.ctx.currentTime + 0.8);
      } else {
        const url = (activeSub.startsWith('blob:') || activeSub.startsWith('http:') || activeSub.startsWith('https:'))
          ? activeSub
          : `/${activeSub}.mp3`;

        const audio = new Audio(url);
        audio.loop = true;
        audio.volume = 0;

        // Cache HTMLAudioElement reference before playback attempt
        const activeSound = this.activeSounds.get(type);
        if (activeSound) {
          activeSound.audio = audio;
        }

        // Core autoplay policy handler: trigger play immediately in click flow
        audio.play().catch((err) => {
          console.warn(`Native audio autoplay restricted for ${type}:`, err);
        });

        // Direct device fade-in volume management
        let currentVol = 0;
        const targetVol = this.volumes[type];
        const fadeInterval = setInterval(() => {
          currentVol += 0.05;
          if (currentVol >= targetVol) {
            audio.volume = targetVol;
            clearInterval(fadeInterval);
          } else {
            audio.volume = currentVol;
          }
        }, 55);

        intervalIds.push(fadeInterval as any);
      }

    } catch (err) {
      console.error(`Error starting sound ${type}:`, err);
      this.activeSounds.delete(type);
    }
  }

  /**
   * Stops a specific active sound with brief fadeout
   */
  stopSound(type: SoundGeneratorType) {
    const active = this.activeSounds.get(type);
    if (!active) return;

    if (this.ctx) {
      try {
        const fadeTime = 0.4;
        // Fade out Web Audio gain smoothly
        active.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
        active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, this.ctx.currentTime);
        active.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeTime);

        // Pause audio and release resources smoothly
        if (active.audio) {
          const soundAudioObj = active.audio;
          const startVol = soundAudioObj.volume;
          const fadeSteps = 10;
          const stepTime = (fadeTime * 1000) / fadeSteps;
          let currentStep = 0;
          
          const fadeInterval = setInterval(() => {
            currentStep++;
            const ratio = 1 - currentStep / fadeSteps;
            if (ratio <= 0) {
              clearInterval(fadeInterval);
              try {
                soundAudioObj.pause();
                soundAudioObj.src = '';
              } catch (e) {}
            } else {
              try {
                soundAudioObj.volume = Math.max(0, startVol * ratio);
              } catch (e) {}
            }
          }, stepTime);
        }

        // Disconnect and stop sources AFTER transition
        setTimeout(() => {
          active.source.forEach((node) => {
            try {
              if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                node.stop();
              }
              node.disconnect();
            } catch (e) {
              // Node might have stopped already
            }
          });
          active.gainNode.disconnect();
        }, fadeTime * 1000 + 50);

      } catch (err) {
        console.error("Error smoothly stopping sound:", err);
      }
    }

    // Clear any trigger loops
    if (active.intervals && active.intervals.length > 0) {
      active.intervals.forEach((id) => clearInterval(id));
    }

    this.activeSounds.delete(type);
  }

  /**
   * Safe change of volume for specific sound
   */
  setVolume(type: SoundGeneratorType, vol: number) {
    const volume = Math.max(0, Math.min(1, vol));
    const oldVolume = this.volumes[type];
    this.volumes[type] = volume;

    console.log(`[AudioSynthesizer] setVolume called for sound: [${type}]. Value transition: [${oldVolume}] -> [${volume}]. Context state: [${this.ctx?.state || 'no context'}]`);

    // Ensure audio context remains active on volume changes
    if (this.ctx && this.ctx.state === 'suspended') {
      console.log(`[AudioSynthesizer] Audio context is suspended during volume change of [${type}]. Activating/Resuming...`);
      this.ctx.resume().catch((e) => console.warn("[AudioSynthesizer] Failed auto-resuming suspended context during volume modification:", e));
    }

    const active = this.activeSounds.get(type);
    if (active) {
      if (this.ctx) {
        try {
          console.log(`[AudioSynthesizer] Active sound [${type}] found with gainNode. Scheduling gain update. Current node level: [${active.gainNode.gain.value}]`);
          active.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
          active.gainNode.gain.setValueAtTime(active.gainNode.gain.value, this.ctx.currentTime);
          active.gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + 0.1);
          console.log(`[AudioSynthesizer] GainNode gain successfully scheduled towards: [${volume}] for sound [${type}]`);
        } catch (e) {
          console.error(`[AudioSynthesizer] Failed applying gain change via Web Audio API for [${type}]:`, e);
        }
      }
      if (active.audio) {
        try {
          active.audio.volume = volume;
          console.log(`[AudioSynthesizer] Active HTMLAudioElement volume updated to [${volume}] for sound [${type}]`);
        } catch (e) {
          console.error(`[AudioSynthesizer] Failed applying volume change to HTMLAudioElement for [${type}]:`, e);
        }
      }
    } else {
      console.log(`[AudioSynthesizer] Sound type [${type}] is currently inactive. New default volume cached for launch: [${volume}]`);
    }
  }

  getVolume(type: SoundGeneratorType): number {
    return this.volumes[type];
  }

  /**
   * Stop all active sounds
   */
  stopAll() {
    const activeTypes = Array.from(this.activeSounds.keys());
    activeTypes.forEach((type) => this.stopSound(type));
  }
}

// Export singleton instance
export const audioSynthesizer = new AudioSynthesizer();
