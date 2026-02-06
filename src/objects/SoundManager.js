/**
 * Dog-themed programmatic sound system using Web Audio API.
 * All sounds are synthesized dog sounds — no audio files needed.
 */
export class SoundManager {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.sfxVolume = 0.7;
    this.musicVolume = 0.4;
    this.muted = localStorage.getItem('pb_muted') === 'true';
    this.musicGain = null;
    this.musicSource = null;
    this.initialized = false;
  }

  /**
   * Initialize AudioContext and pre-generate all sound buffers.
   * Must be called after a user gesture (Phaser handles this).
   */
  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available');
      return;
    }

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    // SFX gain
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Music gain
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.generateAllBuffers();
    this.initialized = true;
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  generateAllBuffers() {
    this.buffers.set('shoot', this.genShoot());
    this.buffers.set('pop', this.genPop());
    this.buffers.set('bounce', this.genBounce());
    this.buffers.set('attach', this.genAttach());
    this.buffers.set('match3', this.genMatch3());
    this.buffers.set('match4plus', this.genMatch4Plus());
    this.buffers.set('floatingBonus', this.genFloatingBonus());
    this.buffers.set('buttonClick', this.genButtonClick());
    this.buffers.set('buttonHover', this.genButtonHover());
    this.buffers.set('levelComplete', this.genLevelComplete());
    this.buffers.set('gameOver', this.genGameOver());
    this.buffers.set('warning', this.genWarning());
    this.buffers.set('newRow', this.genNewRow());
    this.buffers.set('celebrate', this.genCelebrate());
    this.buffers.set('worry', this.genWorry());
  }

  // --- Buffer generation helpers ---

  createBuffer(duration) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    return this.ctx.createBuffer(1, length, sampleRate);
  }

  fillBuffer(buffer, fn) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    for (let i = 0; i < data.length; i++) {
      data[i] = fn(i / sr, i, data.length);
    }
    return buffer;
  }

  // --- Individual sound generators ---

  genShoot() {
    // Short sharp bark: "Woof!"
    const dur = 0.12;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      // Bark has 2 components: low growl + sharp attack
      const barkFreq = 350 + Math.sin(t * 80) * 60;
      const env = phase < 0.3 ? phase / 0.3 : Math.exp(-(phase - 0.3) * 12);
      const bark = Math.sin(2 * Math.PI * barkFreq * t);
      const noise = (Math.random() * 2 - 1) * 0.2;
      return (bark * 0.8 + noise) * env * 0.35;
    });
  }

  genPop() {
    // Playful yip: quick high-pitched bark
    const dur = 0.09;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const yipFreq = 800 + Math.sin(t * 120) * 150;
      const env = phase < 0.2 ? phase / 0.2 : Math.exp(-(phase - 0.2) * 15);
      const yip = Math.sin(2 * Math.PI * yipFreq * t);
      const breathNoise = (Math.random() * 2 - 1) * 0.15;
      return (yip * 0.85 + breathNoise) * env * 0.38;
    });
  }

  genBounce() {
    // Soft questioning woof: "wuf?"
    const dur = 0.06;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const freq = 450 + phase * 80; // Slight pitch rise (questioning)
      const env = phase < 0.3 ? phase / 0.3 : Math.exp(-(phase - 0.3) * 10);
      const woof = Math.sin(2 * Math.PI * freq * t);
      return woof * env * 0.28;
    });
  }

  genAttach() {
    // Snuffle/sniff sound
    const dur = 0.07;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const env = Math.exp(-t * 30);
      const sniff = (Math.random() * 2 - 1) * 0.7; // Breathy noise
      const tone = Math.sin(2 * Math.PI * 220 * t) * 0.3;
      return (sniff + tone) * env * 0.32;
    });
  }

  genMatch3() {
    // Happy bark sequence: "Arf! Arf! Arf!"
    const barkDur = 0.07;
    const dur = barkDur * 3 + 0.05;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const barkIdx = Math.floor(t / barkDur);
      if (barkIdx >= 3) return 0;
      const barkT = t - barkIdx * barkDur;
      const phase = barkT / barkDur;
      const freq = 420 + barkIdx * 60 + Math.sin(barkT * 90) * 50;
      const env = phase < 0.25 ? phase / 0.25 : Math.exp(-(phase - 0.25) * 12);
      const bark = Math.sin(2 * Math.PI * freq * t);
      const growl = (Math.random() * 2 - 1) * 0.15;
      return (bark * 0.85 + growl) * env * 0.32;
    });
  }

  genMatch4Plus() {
    // Excited barking sequence with howl finish
    const barkDur = 0.06;
    const dur = barkDur * 4 + 0.15;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      if (t < barkDur * 4) {
        const barkIdx = Math.min(Math.floor(t / barkDur), 3);
        const barkT = t - barkIdx * barkDur;
        const phase = barkT / barkDur;
        const freq = 450 + barkIdx * 80 + Math.sin(barkT * 110) * 70;
        const env = phase < 0.2 ? phase / 0.2 : Math.exp(-(phase - 0.2) * 14);
        const bark = Math.sin(2 * Math.PI * freq * t);
        return bark * env * 0.33;
      }
      // Happy howl tail: "Arooooo!"
      const howlT = t - barkDur * 4;
      const phase = howlT / 0.15;
      const howlFreq = 600 - phase * 150;
      const env = 1 - phase;
      const howl = Math.sin(2 * Math.PI * howlFreq * t);
      const vibrato = Math.sin(2 * Math.PI * 8 * howlT) * 30;
      return Math.sin(2 * Math.PI * (howlFreq + vibrato) * t) * env * 0.25;
    });
  }

  genFloatingBonus() {
    // Excited repeated barking as bubbles drop
    const dur = 0.18;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      // Multiple rapid yips getting faster
      const yipRate = 18 + phase * 10;
      const yipPhase = Math.sin(2 * Math.PI * yipRate * t);
      const freq = 700 + yipPhase * 200;
      const env = 1 - phase * 0.7;
      const excitedBark = Math.sin(2 * Math.PI * freq * t);
      const panting = (Math.random() * 2 - 1) * 0.2;
      return (excitedBark * 0.8 + panting) * env * 0.35;
    });
  }

  genButtonClick() {
    // Quick happy yip
    const dur = 0.04;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const freq = 900;
      const env = phase < 0.3 ? phase / 0.3 : Math.exp(-(phase - 0.3) * 18);
      const yip = Math.sin(2 * Math.PI * freq * t);
      return yip * env * 0.24;
    });
  }

  genButtonHover() {
    // Curious sniff
    const dur = 0.03;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const env = 1 - phase;
      const sniff = (Math.random() * 2 - 1) * 0.8;
      const tone = Math.sin(2 * Math.PI * 600 * t) * 0.2;
      return (sniff + tone) * env * 0.18;
    });
  }

  genLevelComplete() {
    // Triumphant celebration barking sequence
    const dur = 0.6;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      if (phase < 0.5) {
        // Rapid excited barking
        const barkPhase = Math.floor(t / 0.08);
        const barkT = t - barkPhase * 0.08;
        const barkLocal = barkT / 0.08;
        const freq = 500 + barkPhase * 50 + Math.sin(barkT * 100) * 60;
        const env = barkLocal < 0.3 ? barkLocal / 0.3 : Math.exp(-(barkLocal - 0.3) * 12);
        const bark = Math.sin(2 * Math.PI * freq * t);
        return bark * env * 0.3;
      } else {
        // Victory howl
        const howlT = t - 0.5;
        const howlPhase = howlT / 0.1;
        const howlFreq = 550 + Math.sin(howlT * 12) * 80;
        const env = 1 - howlPhase;
        return Math.sin(2 * Math.PI * howlFreq * t) * env * 0.28;
      }
    });
  }

  genGameOver() {
    // Sad whimper/whine descending
    const dur = 0.5;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const whineFreq = 600 - phase * 250; // Descending whine
      const vibrato = Math.sin(2 * Math.PI * 6 * t) * 20;
      const env = 1 - phase * 0.6;
      const whine = Math.sin(2 * Math.PI * (whineFreq + vibrato) * t);
      const breath = (Math.random() * 2 - 1) * 0.1 * (1 - phase);
      return (whine * 0.85 + breath) * env * 0.28;
    });
  }

  genWarning() {
    // Alert barking: rapid "Woof! Woof!"
    const dur = 0.25;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const barkIdx = Math.floor(t / 0.12);
      const barkT = t - barkIdx * 0.12;
      const phase = barkT / 0.12;
      const freq = 480 + barkIdx * 60;
      const env = phase < 0.25 ? phase / 0.25 : Math.exp(-(phase - 0.25) * 10);
      const bark = Math.sin(2 * Math.PI * freq * t);
      const urgency = (Math.random() * 2 - 1) * 0.15;
      return (bark * 0.85 + urgency) * env * 0.26;
    });
  }

  genNewRow() {
    // Deep growl with urgency
    const dur = 0.18;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const growlFreq = 120 + Math.sin(t * 30) * 20;
      const env = Math.exp(-t * 15);
      const growl = Math.sin(2 * Math.PI * growlFreq * t) * 0.6;
      const rumble = (Math.random() * 2 - 1) * 0.4 * Math.exp(-t * 25);
      const bark = Math.sin(2 * Math.PI * 350 * t) * 0.3 * (phase > 0.6 ? 1 : 0);
      return (growl + rumble + bark) * env * 0.45;
    });
  }

  genCelebrate() {
    // Happy panting barks: "Hah! Hah! Hah!"
    const dur = 0.22;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const pantIdx = Math.floor(t / 0.055);
      const pantT = t - pantIdx * 0.055;
      const phase = pantT / 0.055;
      const freq = 650 + pantIdx * 100 + Math.sin(pantT * 80) * 50;
      const env = phase < 0.35 ? phase / 0.35 : Math.exp(-(phase - 0.35) * 10);
      const pant = Math.sin(2 * Math.PI * freq * t);
      const breath = (Math.random() * 2 - 1) * 0.2;
      return (pant * 0.8 + breath) * env * 0.26;
    });
  }

  genWorry() {
    // Anxious whine with vibrato
    const dur = 0.35;
    const buf = this.createBuffer(dur);
    return this.fillBuffer(buf, (t) => {
      const phase = t / dur;
      const whineFreq = 450 + Math.sin(2 * Math.PI * 7 * t) * 60;
      const env = 1 - phase * 0.5;
      const whine = Math.sin(2 * Math.PI * whineFreq * t);
      const nervousBreath = (Math.random() * 2 - 1) * 0.12;
      return (whine * 0.88 + nervousBreath) * env * 0.27;
    });
  }

  // --- Playback ---

  playSFX(key) {
    if (!this.initialized || !this.ctx) return;
    this.ensureContext();

    const buffer = this.buffers.get(key);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.sfxGain);
    source.start(0);
  }

  playCombo(comboCount) {
    if (!this.initialized || !this.ctx) return;
    this.ensureContext();

    // Pitch-shift the celebrate sound based on combo count
    const buffer = this.buffers.get('celebrate');
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (comboCount - 1) * 0.15;
    source.connect(this.sfxGain);
    source.start(0);
  }

  // --- Music ---

  startMusic(type) {
    if (!this.initialized || !this.ctx) return;
    this.ensureContext();
    this.stopMusic();

    // Dog-themed music: playful melody with occasional barks
    const chords = type === 'menu'
      ? [[261.63, 329.63, 392.00], [293.66, 369.99, 440.00], [329.63, 415.30, 493.88], [293.66, 369.99, 440.00]]
      : [[261.63, 329.63, 392.00], [349.23, 440.00, 523.25], [293.66, 369.99, 440.00], [392.00, 493.88, 587.33]];

    const chordDur = 2.0;
    const totalDur = chords.length * chordDur;
    const sr = this.ctx.sampleRate;
    const length = Math.floor(sr * totalDur);
    const buf = this.ctx.createBuffer(1, length, sr);
    const data = buf.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sr;
      const chordIdx = Math.floor(t / chordDur) % chords.length;
      const chord = chords[chordIdx];
      let sample = 0;

      // Base melody
      for (const freq of chord) {
        sample += Math.sin(2 * Math.PI * freq * t) * 0.08;
      }

      // Fade between chords
      const chordT = (t % chordDur) / chordDur;
      const env = chordT < 0.05 ? chordT / 0.05 : chordT > 0.95 ? (1 - chordT) / 0.05 : 1;

      // Add occasional dog bark rhythms at specific beats
      const beatPhase = (t % chordDur) / chordDur;
      if (beatPhase > 0.48 && beatPhase < 0.52) {
        // Quick bark accent on half-beat
        const barkEnv = Math.exp(-(beatPhase - 0.48) * 200);
        const barkFreq = type === 'menu' ? 550 : 500;
        const bark = Math.sin(2 * Math.PI * barkFreq * t) * barkEnv * 0.12;
        sample += bark;
      }

      // Tail wag rhythm (subtle percussion)
      const wagRate = type === 'menu' ? 4 : 6;
      const wagPhase = Math.sin(2 * Math.PI * wagRate * t);
      if (wagPhase > 0.9) {
        const wagNoise = (Math.random() * 2 - 1) * 0.03;
        sample += wagNoise;
      }

      data[i] = sample * env;
    }

    this.musicSource = this.ctx.createBufferSource();
    this.musicSource.buffer = buf;
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGain);
    this.musicSource.start(0);
  }

  stopMusic() {
    if (this.musicSource) {
      try { this.musicSource.stop(); } catch (e) { /* already stopped */ }
      this.musicSource = null;
    }
  }

  // --- Mute toggle ---

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('pb_muted', this.muted.toString());
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 1;
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }
}
