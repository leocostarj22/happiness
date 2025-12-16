// Simple audio synthesizer using Web Audio API

let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playBeep = (frequency: number = 440, duration: number = 0.1, type: OscillatorType = 'sine', volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.error('Audio resume failed', e));
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    
    // Envelope
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.error('Audio playback failed', e);
  }
};

export const playVoteSound = () => {
  // Short high-pitched blip
  playBeep(1200, 0.05, 'sine', 0.2);
};

export const playCountdownBeep = () => {
  // Sharp, short beep for countdown
  playBeep(880, 0.1, 'sine', 0.2); 
};

export const playTimeUpSound = () => {
  // descending tone
  playBeep(880, 0.1, 'square', 0.2);
  setTimeout(() => playBeep(440, 0.4, 'square', 0.2), 100);
};

export const playSuccessSound = () => {
  // ascending major arpeggio
  playBeep(440, 0.1, 'sine', 0.2);
  setTimeout(() => playBeep(554, 0.1, 'sine', 0.2), 100); // C#
  setTimeout(() => playBeep(659, 0.2, 'sine', 0.2), 200); // E
};

export const playFailureSound = () => {
  // descending minor third
  playBeep(440, 0.2, 'sawtooth', 0.1);
  setTimeout(() => playBeep(369, 0.4, 'sawtooth', 0.1), 200); // F#
};