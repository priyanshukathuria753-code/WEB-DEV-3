/**
 * Apex Antiqua Audio Engine
 * Uses Web Audio API to procedurally generate rich racing & colosseum sound effects.
 * Completely offline, zero external asset dependencies.
 */

class RacingAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Sound: Gearbox stick shift clunk & mechanical lock
   */
  playGearShift() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // High transient metallic snap
    const oscSnap = this.ctx.createOscillator();
    const gainSnap = this.ctx.createGain();
    oscSnap.type = 'triangle';
    oscSnap.frequency.setValueAtTime(1200, now);
    oscSnap.frequency.exponentialRampToValueAtTime(300, now + 0.06);
    gainSnap.gain.setValueAtTime(0.4, now);
    gainSnap.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    oscSnap.connect(gainSnap);
    gainSnap.connect(this.ctx.destination);
    oscSnap.start(now);
    oscSnap.stop(now + 0.07);

    // Deep mechanical thud / gate clack
    const oscThud = this.ctx.createOscillator();
    const gainThud = this.ctx.createGain();
    oscThud.type = 'sine';
    oscThud.frequency.setValueAtTime(180, now + 0.02);
    oscThud.frequency.exponentialRampToValueAtTime(50, now + 0.12);
    gainThud.gain.setValueAtTime(0.6, now + 0.02);
    gainThud.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    oscThud.connect(gainThud);
    gainThud.connect(this.ctx.destination);
    oscThud.start(now + 0.02);
    oscThud.stop(now + 0.13);

    // Spring friction noise
    this.playNoiseBurst(0.08, 1400, 0.15, now);
  }

  /**
   * Sound: Dual gear stick shift clunks (Staggered mechanical double-lock)
   */
  playDualGearShift() {
    this.playGearShift();
    setTimeout(() => {
      this.playGearShift();
    }, 110);
  }

  /**
   * Sound: Engine throttle rev scaled to rolled gear
   */
  playEngineRev(gear = 3) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 65 + gear * 18;
    const duration = 0.45;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc2.detune.setValueAtTime(14, now);

    // Throttle pitch surge
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + duration);

    osc2.frequency.setValueAtTime(baseFreq * 1.01, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.22, now + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.51, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.2);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  /**
   * Sound: Tire drift squeal & exhaust smoke whoosh
   */
  playDriftSmoke() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 0.22;

    // High pitched tire rubber screech
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.linearRampToValueAtTime(1350, now + 0.08);
    osc.frequency.linearRampToValueAtTime(800, now + duration);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(5.0, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);

    // Friction asphalt rumble
    this.playNoiseBurst(duration, 800, 0.1, now);
  }

  /**
   * Sound: Catastrophic Supercar Crash / Collision
   */
  playCrash() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Heavy low-end impact boom
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(150, now);
    boomOsc.frequency.exponentialRampToValueAtTime(25, now + 0.7);
    boomGain.gain.setValueAtTime(0.8, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    boomOsc.connect(boomGain);
    boomGain.connect(this.ctx.destination);
    boomOsc.start(now);
    boomOsc.stop(now + 0.8);

    // 2. High distorted metal crunch
    const crunchOsc = this.ctx.createOscillator();
    const crunchMod = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    const modGain = this.ctx.createGain();

    crunchOsc.type = 'sawtooth';
    crunchOsc.frequency.setValueAtTime(420, now);
    crunchOsc.frequency.linearRampToValueAtTime(120, now + 0.4);

    crunchMod.type = 'square';
    crunchMod.frequency.setValueAtTime(85, now);
    modGain.gain.setValueAtTime(250, now);
    crunchMod.connect(modGain);
    modGain.connect(crunchOsc.frequency);

    crunchGain.gain.setValueAtTime(0.6, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    crunchOsc.connect(crunchGain);
    crunchGain.connect(this.ctx.destination);

    crunchMod.start(now);
    crunchOsc.start(now);
    crunchMod.stop(now + 0.55);
    crunchOsc.stop(now + 0.55);

    // 3. Shatter & debris noise explosion
    this.playNoiseBurst(0.6, 2200, 0.45, now);

    // 4. Spin-out screech tail
    const screechOsc = this.ctx.createOscillator();
    const screechGain = this.ctx.createGain();
    screechOsc.type = 'sawtooth';
    screechOsc.frequency.setValueAtTime(1400, now + 0.1);
    screechOsc.frequency.exponentialRampToValueAtTime(500, now + 0.6);
    screechGain.gain.setValueAtTime(0.001, now + 0.1);
    screechGain.gain.linearRampToValueAtTime(0.25, now + 0.18);
    screechGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    screechOsc.connect(screechGain);
    screechGain.connect(this.ctx.destination);
    screechOsc.start(now + 0.1);
    screechOsc.stop(now + 0.7);
  }

  /**
   * Sound: Safe Zone ancient bell chime
   */
  playSafeZone() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major chord

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.2 / (idx + 1), now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + 0.7 + idx * 0.05);
    });
  }

  /**
   * Sound: Victory race fanfare
   */
  playVictory() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [
      { f: 440.0, d: 0.15 }, // A4
      { f: 554.37, d: 0.15 }, // C#5
      { f: 659.25, d: 0.18 }, // E5
      { f: 880.0, d: 0.45 }   // A5
    ];

    let t = this.ctx.currentTime;
    notes.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.85;
    });
  }

  /**
   * Helper: Filtered noise burst for explosions & friction
   */
  playNoiseBurst(duration, filterFreq, volume, startTime) {
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, startTime);
    filter.Q.setValueAtTime(2.0, startTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }
}

// Global instance
window.racingAudio = new RacingAudio();
