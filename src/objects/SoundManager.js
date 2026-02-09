/**
 * Dog-themed programmatic sound system using Web Audio API.
 * Enhanced synthesis with multi-harmonic voices, formant shaping,
 * glottal pulse modeling, and layered noise for realistic dog sounds.
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

  init(preCreatedCtx) {
    try {
      // Use a pre-created AudioContext (from SplashScene gesture) if available,
      // so it's already in 'running' state instead of 'suspended'.
      this.ctx = preCreatedCtx || new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available');
      return;
    }

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 1;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.generateAllBuffers();
    this.loadAudioFiles();
    this.initialized = true;

    // Resume AudioContext on first user gesture (click/touch/key)
    if (this.ctx.state === 'suspended') {
      const resumeOnGesture = () => {
        this.ensureContext();
        document.removeEventListener('pointerdown', resumeOnGesture);
        document.removeEventListener('keydown', resumeOnGesture);
      };
      document.addEventListener('pointerdown', resumeOnGesture);
      document.addEventListener('keydown', resumeOnGesture);
    }
  }

  /** Fetch and decode an audio file into the buffers map */
  loadAudioFile(key, url) {
    return fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(data => this.ctx.decodeAudioData(data))
      .then(buffer => {
        this.buffers.set(key, buffer);
        return buffer;
      })
      .catch(err => console.warn(`Audio load failed for "${key}":`, err));
  }

  loadAudioFiles() {
    const base = import.meta.env.BASE_URL;
    this.musicLoading = {
      menu: this.loadAudioFile('menuMusic', `${base}assets/sounds/Menu-Puzzle-Bobble.m4a`),
      game: this.loadAudioFile('gameMusic', `${base}assets/sounds/Puzzle-Bobble-original-theme-music.m4a`),
    };
    this.loadAudioFile('buttonClick', `${base}assets/sounds/dog-bark-1.mp3`);
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        // Context just resumed after user gesture — start deferred music if any
        if (this.deferredMusicType) {
          const type = this.deferredMusicType;
          this.deferredMusicType = null;
          this.startMusic(type);
        }
      });
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

  // --- Synthesis primitives ---

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

  /** Seeded pseudo-random for deterministic noise (avoids different sound each play) */
  seededRand(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s / 2147483647) * 2 - 1;
    };
  }

  /** Glottal pulse waveform — models vocal cord vibration, richer than sine */
  glottal(phase) {
    // Rosenberg glottal pulse approximation
    const p = phase % 1;
    if (p < 0.4) {
      const x = p / 0.4;
      return 3 * x * x - 2 * x * x * x;
    }
    if (p < 0.6) {
      const x = (p - 0.4) / 0.2;
      return (1 - x) * (1 - x);
    }
    return 0;
  }

  /** Multi-harmonic voice with formant emphasis */
  voice(t, f0, formants) {
    const TWO_PI = 2 * Math.PI;
    const phase = (f0 * t) % 1;
    let glot = this.glottal(phase);

    // Add harmonics shaped by formant peaks
    let sample = 0;
    for (let h = 1; h <= 12; h++) {
      const hFreq = f0 * h;
      let amp = 1 / h; // natural harmonic rolloff
      // Boost harmonics near formant centers
      for (const [fCenter, fBW, fGain] of formants) {
        const dist = Math.abs(hFreq - fCenter) / fBW;
        amp += fGain * Math.exp(-dist * dist * 0.5);
      }
      sample += Math.sin(TWO_PI * hFreq * t) * amp;
    }

    // Mix glottal pulse with harmonic content
    return (glot * 0.4 + sample * 0.6);
  }

  /** Shaped noise burst — breathy/turbulent air component */
  breathNoise(t, rand, centerFreq, bandwidth) {
    const raw = rand();
    // Crude bandpass: weight by proximity to center freq using time-varying sine
    const resonance = Math.sin(2 * Math.PI * centerFreq * t);
    const second = Math.sin(2 * Math.PI * (centerFreq * 1.3) * t);
    return raw * 0.5 + resonance * raw * 0.3 + second * raw * 0.2;
  }

  /** Smooth attack-hold-decay envelope */
  ahd(phase, attack, hold) {
    if (phase < attack) return phase / attack;
    if (phase < attack + hold) return 1;
    return Math.exp(-(phase - attack - hold) * 8);
  }

  // --- Sound generators ---

  genShoot() {
    // Playful "Woof!" — sharp glottal bark with chest resonance
    const dur = 0.15;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(42);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // F0 drops during bark (vocal effort release)
      const f0 = 320 - p * 80 + Math.sin(t * 60) * 25;
      // Dog bark formants: ~500Hz, ~1200Hz, ~2800Hz
      const vocal = this.voice(t, f0, [
        [500, 150, 1.8], [1200, 200, 1.2], [2800, 400, 0.6]
      ]);
      const breath = this.breathNoise(t, rand, 1800, 600);
      // Sharp attack, quick decay
      const env = p < 0.08 ? p / 0.08 :
                  p < 0.25 ? 1 :
                  Math.exp(-(p - 0.25) * 6);
      const breathEnv = p < 0.05 ? p / 0.05 : Math.exp(-p * 8);
      return (vocal * 0.7 + breath * 0.3 * breathEnv) * env * 0.38;
    });
  }

  genPop() {
    // Quick high yip — small-dog yelp with pop transient
    const dur = 0.1;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(101);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // Higher pitch, quick pitch fall
      const f0 = 650 + (1 - p) * 200;
      const vocal = this.voice(t, f0, [
        [800, 120, 2.0], [1800, 250, 1.5], [3200, 400, 0.8]
      ]);
      // Pop transient at start
      const pop = Math.exp(-t * 200) * Math.sin(2 * Math.PI * 1200 * t);
      const breath = this.breathNoise(t, rand, 2500, 800);
      const env = p < 0.1 ? p / 0.1 : Math.exp(-(p - 0.1) * 10);
      return (vocal * 0.5 + pop * 0.3 + breath * 0.2 * Math.exp(-p * 12)) * env * 0.4;
    });
  }

  genBounce() {
    // Questioning "wuf?" — pitch rises at end
    const dur = 0.08;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(77);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // Rising inflection at end
      const f0 = 380 + p * p * 180;
      const vocal = this.voice(t, f0, [
        [550, 140, 1.6], [1300, 200, 1.0], [2600, 350, 0.5]
      ]);
      const breath = this.breathNoise(t, rand, 1600, 500);
      const env = p < 0.15 ? p / 0.15 : Math.exp(-(p - 0.15) * 8);
      return (vocal * 0.75 + breath * 0.25 * Math.exp(-p * 10)) * env * 0.3;
    });
  }

  genAttach() {
    // Snuffle/sniff — mostly turbulent airflow with nasal resonance
    const dur = 0.09;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(55);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      const breath = this.breathNoise(t, rand, 1400, 800);
      // Nasal resonance hum
      const nasal = Math.sin(2 * Math.PI * 220 * t) * 0.3 +
                    Math.sin(2 * Math.PI * 440 * t) * 0.15;
      // Two-phase: inhale then exhale
      let env;
      if (p < 0.4) {
        env = Math.sin(p / 0.4 * Math.PI) * 0.8;
      } else {
        env = Math.sin((p - 0.4) / 0.6 * Math.PI);
      }
      return (breath * 0.65 + nasal * 0.35) * env * 0.3;
    });
  }

  genMatch3() {
    // Happy triple bark: "Arf! Arf! Arf!" — ascending pitch
    const barkDur = 0.09;
    const gap = 0.03;
    const dur = (barkDur + gap) * 3;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(200);
    return this.fillBuffer(buf, (t) => {
      const period = barkDur + gap;
      const barkIdx = Math.floor(t / period);
      if (barkIdx >= 3) return 0;
      const barkT = t - barkIdx * period;
      if (barkT > barkDur) return 0; // in gap
      const bp = barkT / barkDur;

      // Each bark higher in pitch (excitement building)
      const f0 = 380 + barkIdx * 70 - bp * 50;
      const vocal = this.voice(barkT, f0, [
        [520 + barkIdx * 40, 140, 1.8],
        [1300 + barkIdx * 80, 200, 1.2],
        [2900, 400, 0.6]
      ]);
      const breath = this.breathNoise(barkT, rand, 2000, 600);
      const env = bp < 0.1 ? bp / 0.1 :
                  bp < 0.3 ? 1 :
                  Math.exp(-(bp - 0.3) * 7);
      return (vocal * 0.75 + breath * 0.25 * Math.exp(-bp * 8)) * env * 0.34;
    });
  }

  genMatch4Plus() {
    // Excited barks then mini howl: "Arf! Arf! Arf! Arf! Aroooo!"
    const barkDur = 0.07;
    const gap = 0.02;
    const barkSection = (barkDur + gap) * 4;
    const howlDur = 0.25;
    const dur = barkSection + howlDur;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(303);
    return this.fillBuffer(buf, (t) => {
      if (t < barkSection) {
        const period = barkDur + gap;
        const barkIdx = Math.min(Math.floor(t / period), 3);
        const barkT = t - barkIdx * period;
        if (barkT > barkDur) return 0;
        const bp = barkT / barkDur;
        const f0 = 400 + barkIdx * 80 - bp * 40;
        const vocal = this.voice(barkT, f0, [
          [550 + barkIdx * 50, 130, 2.0],
          [1400 + barkIdx * 60, 200, 1.3],
          [3000, 400, 0.7]
        ]);
        const breath = this.breathNoise(barkT, rand, 2200, 700);
        const env = bp < 0.1 ? bp / 0.1 :
                    bp < 0.25 ? 1 :
                    Math.exp(-(bp - 0.25) * 8);
        return (vocal * 0.7 + breath * 0.3 * Math.exp(-bp * 10)) * env * 0.32;
      }
      // Howl section — sustained pitch with vibrato
      const ht = t - barkSection;
      const hp = ht / howlDur;
      const vibrato = Math.sin(2 * Math.PI * 6 * ht) * 35;
      const f0 = 550 + vibrato + (1 - hp) * 60;
      const vocal = this.voice(ht, f0, [
        [600, 180, 2.2], [1100, 250, 1.5], [2400, 350, 0.8]
      ]);
      // Howl envelope: swell in, sustain, fade
      const env = hp < 0.15 ? hp / 0.15 :
                  hp < 0.7 ? 1 :
                  (1 - hp) / 0.3;
      return vocal * env * 0.28;
    });
  }

  genFloatingBonus() {
    // Rapid excited yipping — small dog going nuts
    const dur = 0.25;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(404);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // Yips get faster as excitement builds
      const yipRate = 12 + p * 15;
      const yipPhase = (Math.sin(2 * Math.PI * yipRate * t) + 1) * 0.5;
      const yipEnv = yipPhase > 0.6 ? (yipPhase - 0.6) / 0.4 : 0;

      const f0 = 600 + p * 150 + Math.sin(t * 80) * 50;
      const vocal = this.voice(t, f0, [
        [750, 120, 2.0], [1600, 200, 1.4], [3200, 350, 0.7]
      ]);
      const breath = this.breathNoise(t, rand, 2800, 800);
      const overallEnv = 1 - p * 0.4;
      return (vocal * 0.7 + breath * 0.3) * yipEnv * overallEnv * 0.35;
    });
  }

  genButtonClick() {
    // Tiny cheerful yip — like a toy poodle chirp
    const dur = 0.055;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(500);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      const f0 = 800 + (1 - p) * 200;
      const vocal = this.voice(t, f0, [
        [900, 100, 2.0], [2000, 200, 1.2], [3500, 300, 0.6]
      ]);
      const click = Math.exp(-t * 300) * Math.sin(2 * Math.PI * 1500 * t);
      const env = p < 0.15 ? p / 0.15 : Math.exp(-(p - 0.15) * 14);
      return (vocal * 0.5 + click * 0.5) * env * 0.26;
    });
  }

  genButtonHover() {
    // Soft curious sniff — gentle nasal inhalation
    const dur = 0.04;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(600);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      const breath = this.breathNoise(t, rand, 1800, 600);
      const nasal = Math.sin(2 * Math.PI * 500 * t) * 0.25 +
                    Math.sin(2 * Math.PI * 1100 * t) * 0.15;
      const env = Math.sin(p * Math.PI); // smooth arc
      return (breath * 0.6 + nasal * 0.4) * env * 0.2;
    });
  }

  genLevelComplete() {
    // Celebration: rapid barks building to triumphant howl
    const barkSection = 0.35;
    const howlSection = 0.45;
    const dur = barkSection + howlSection;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(700);
    return this.fillBuffer(buf, (t) => {
      if (t < barkSection) {
        const bp = t / barkSection;
        // Accelerating barks
        const barkRate = 8 + bp * 12;
        const barkPhase = (t * barkRate) % 1;
        const barkEnv = barkPhase < 0.15 ? barkPhase / 0.15 :
                        barkPhase < 0.4 ? 1 :
                        Math.exp(-(barkPhase - 0.4) * 5);

        const f0 = 420 + bp * 120;
        const vocal = this.voice(t, f0, [
          [580, 150, 1.8], [1350, 200, 1.3], [2900, 400, 0.7]
        ]);
        const breath = this.breathNoise(t, rand, 2200, 700);
        return (vocal * 0.7 + breath * 0.3) * barkEnv * (0.6 + bp * 0.4) * 0.3;
      }
      // Victory howl — long sustained with rich vibrato
      const ht = t - barkSection;
      const hp = ht / howlSection;
      const vibDepth = 25 + hp * 15;
      const vibrato = Math.sin(2 * Math.PI * 5.5 * ht) * vibDepth;
      const f0 = 480 + hp * 80 + vibrato;
      const vocal = this.voice(ht, f0, [
        [550, 200, 2.5], [1050, 280, 1.8], [2200, 400, 1.0]
      ]);
      // Swell envelope
      const env = hp < 0.1 ? hp / 0.1 :
                  hp < 0.75 ? 1 :
                  (1 - hp) / 0.25;
      return vocal * env * 0.32;
    });
  }

  genGameOver() {
    // Sad whimper — descending pitch with trembling vibrato, ends in sigh
    const dur = 0.65;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(800);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // Three descending whimper pulses then a sigh
      if (p < 0.7) {
        const whimperIdx = Math.floor(p / 0.23);
        const wp = (p - whimperIdx * 0.23) / 0.23;

        // Each whimper lower in pitch
        const baseF0 = 550 - whimperIdx * 70;
        const vibrato = Math.sin(2 * Math.PI * 8 * t) * (20 + whimperIdx * 10);
        const f0 = baseF0 - wp * 60 + vibrato;

        const vocal = this.voice(t, f0, [
          [600 - whimperIdx * 40, 180, 2.2],
          [1100, 250, 1.0],
          [2200, 350, 0.5]
        ]);
        const breath = this.breathNoise(t, rand, 1200, 500);
        // Whimper envelope: soft attack, wavering sustain, fade
        const env = wp < 0.1 ? wp / 0.1 :
                    Math.exp(-(wp - 0.1) * 3) * (0.7 + 0.3 * Math.sin(wp * 20));
        return (vocal * 0.8 + breath * 0.2) * env * 0.28;
      }
      // Final sigh — breathy exhale
      const sp = (p - 0.7) / 0.3;
      const breath = this.breathNoise(t, rand, 800, 600);
      const nasal = Math.sin(2 * Math.PI * 250 * t) * 0.3;
      const env = (1 - sp) * (1 - sp);
      return (breath * 0.7 + nasal * 0.3) * env * 0.2;
    });
  }

  genWarning() {
    // Alert double-bark: urgent "WOOF! WOOF!" — deeper, forceful
    const barkDur = 0.1;
    const gap = 0.06;
    const dur = barkDur * 2 + gap;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(900);
    return this.fillBuffer(buf, (t) => {
      const period = barkDur + gap;
      const barkIdx = Math.floor(t / period);
      if (barkIdx >= 2) return 0;
      const barkT = t - barkIdx * period;
      if (barkT > barkDur) return 0;
      const bp = barkT / barkDur;

      // Deep, forceful bark
      const f0 = 280 + barkIdx * 40 - bp * 60;
      const vocal = this.voice(barkT, f0, [
        [450, 160, 2.0], [1000, 220, 1.5], [2400, 350, 0.8]
      ]);
      const breath = this.breathNoise(barkT, rand, 1600, 700);
      // Punchy envelope
      const env = bp < 0.06 ? bp / 0.06 :
                  bp < 0.2 ? 1 :
                  Math.exp(-(bp - 0.2) * 6);
      return (vocal * 0.7 + breath * 0.3 * Math.exp(-bp * 6)) * env * 0.32;
    });
  }

  genNewRow() {
    // Low growl with rumble — threatening, subsonic chest vibration
    const dur = 0.22;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(950);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // Low growl fundamental with irregular modulation
      const f0 = 100 + Math.sin(t * 25) * 15 + Math.sin(t * 7) * 8;
      const vocal = this.voice(t, f0, [
        [250, 120, 2.0], [600, 180, 1.5], [1200, 250, 0.8]
      ]);
      // Chest rumble — subharmonic
      const rumble = Math.sin(2 * Math.PI * 50 * t) * 0.3 +
                     Math.sin(2 * Math.PI * 75 * t) * 0.2;
      const breath = this.breathNoise(t, rand, 800, 500);
      // Swell then bark at end
      let env;
      if (p < 0.7) {
        env = p < 0.15 ? p / 0.15 : 0.8 + 0.2 * Math.sin(p * 30);
      } else {
        // Snap bark at end
        const bp = (p - 0.7) / 0.3;
        env = 1.2 * Math.exp(-bp * 5);
      }
      return (vocal * 0.5 + rumble * 0.25 + breath * 0.25) * env * 0.4;
    });
  }

  genCelebrate() {
    // Happy panting barks: "Hah! Hah! Hah! Hah!" — breathy, joyful
    const pantDur = 0.06;
    const gap = 0.02;
    const numPants = 5;
    const dur = (pantDur + gap) * numPants;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(1100);
    return this.fillBuffer(buf, (t) => {
      const period = pantDur + gap;
      const pantIdx = Math.floor(t / period);
      if (pantIdx >= numPants) return 0;
      const pantT = t - pantIdx * period;
      if (pantT > pantDur) return 0;
      const pp = pantT / pantDur;

      // Alternating inhale/exhale pitch
      const isExhale = pantIdx % 2 === 0;
      const f0 = isExhale ? 580 + pantIdx * 30 : 520 + pantIdx * 30;
      const vocal = this.voice(pantT, f0, [
        [700, 130, 1.5], [1500, 200, 1.0], [2800, 350, 0.5]
      ]);
      // Heavy breath component for panting
      const breath = this.breathNoise(pantT, rand, 2000, 800);
      const env = Math.sin(pp * Math.PI); // smooth pulse
      const breathWeight = isExhale ? 0.5 : 0.65;
      return (vocal * (1 - breathWeight) + breath * breathWeight) * env * 0.28;
    });
  }

  genWorry() {
    // Anxious whine — wavering pitch, unsteady vibrato, nasal
    const dur = 0.4;
    const buf = this.createBuffer(dur);
    const rand = this.seededRand(1200);
    return this.fillBuffer(buf, (t) => {
      const p = t / dur;
      // Unsteady vibrato that gets faster (more anxious)
      const vibRate = 5 + p * 4;
      const vibDepth = 40 + p * 25;
      const vibrato = Math.sin(2 * Math.PI * vibRate * t) * vibDepth;
      // Pitch wanders up and down anxiously
      const f0 = 420 + Math.sin(p * Math.PI * 2) * 50 + vibrato;
      const vocal = this.voice(t, f0, [
        [500, 160, 2.0], [1200, 220, 1.5], [2500, 300, 0.7]
      ]);
      const breath = this.breathNoise(t, rand, 1400, 500);
      // Wavering envelope
      const env = (1 - p * 0.4) * (0.8 + 0.2 * Math.sin(p * 25));
      return (vocal * 0.82 + breath * 0.18) * env * 0.27;
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

    // If AudioContext is suspended (no user gesture yet), defer until it resumes
    if (this.ctx.state === 'suspended') {
      this.deferredMusicType = type;
      return;
    }

    this.stopMusic();

    const bufferKey = type === 'menu' ? 'menuMusic' : 'gameMusic';

    // Use loaded audio file if already available
    if (this.buffers.has(bufferKey)) {
      this._playMusicBuffer(this.buffers.get(bufferKey));
      return;
    }

    // If file is still loading, wait silently then play
    const loading = this.musicLoading && this.musicLoading[type];
    if (loading) {
      this.pendingMusicType = type;
      loading.then(buffer => {
        if (buffer && this.pendingMusicType === type) {
          this._playMusicBuffer(buffer);
          this.pendingMusicType = null;
        }
      });
    }
  }

  _playMusicBuffer(buffer) {
    this.musicSource = this.ctx.createBufferSource();
    this.musicSource.buffer = buffer;
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGain);
    this.musicSource.start(0);
  }

  stopMusic() {
    this.pendingMusicType = null;
    this.deferredMusicType = null;
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
