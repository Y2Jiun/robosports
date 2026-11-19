/**
 * Web Audio API synthesizer for WRO RoboSports Competition
 * Features:
 * - Intense Electronic Background Music loop (driving bassline, kick drum, arp lead)
 * - Authentic Referee Whistles for Judge Derrick
 * - Ball pickup, pneumatic shoot, and bounce audio
 * - Stadium horns & countdown chimes
 */
import mixueShoutAudio from '../assets/audio/mixue_shout_raw.wav';

class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: NodeJS.Timeout | null = null;
  private isMusicPlaying: boolean = false;
  private musicStep: number = 0;

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isMusicPlaying) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * INTENSE ELECTRONIC BACKGROUND MUSIC
   * 136 BPM driving competition synth loop with kick, bassline, and arpeggios
   */
  public startMusic() {
    if (this.isMuted || this.isMusicPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isMusicPlaying = true;
    this.musicStep = 0;

    // 136 BPM = ~110ms per 16th note
    const stepTimeMs = 110;

    // Bassline notes (Frequencies in Hz: E2, G2, A2, B2)
    const bassline = [
      82.4, 82.4, 0, 82.4,
      98.0, 98.0, 0, 110.0,
      82.4, 82.4, 0, 82.4,
      123.5, 110.0, 98.0, 73.4
    ];

    // Arpeggiated lead notes (E4, G4, B4, D5, E5)
    const arpMelody = [
      329.6, 0, 392.0, 0,
      493.9, 0, 587.3, 0,
      659.3, 587.3, 493.9, 392.0,
      493.9, 0, 329.6, 0
    ];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;
      this.musicStep++;

      // 1. KICK DRUM on beat 0, 4, 8, 12 (four on the floor)
      if (step % 4 === 0) {
        try {
          const kickOsc = this.ctx.createOscillator();
          const kickGain = this.ctx.createGain();
          kickOsc.frequency.setValueAtTime(140, now);
          kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.09);
          kickGain.gain.setValueAtTime(0.25, now);
          kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          kickOsc.connect(kickGain);
          kickGain.connect(this.ctx.destination);
          kickOsc.start(now);
          kickOsc.stop(now + 0.12);
        } catch {}
      }

      // 2. HI-HAT on off-beats
      if (step % 2 === 1) {
        try {
          const hatGain = this.ctx.createGain();
          const bufferSize = this.ctx.sampleRate * 0.03;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

          const noise = this.ctx.createBufferSource();
          noise.buffer = noiseBuffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(7000, now);

          hatGain.gain.setValueAtTime(0.06, now);
          hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          noise.connect(filter);
          filter.connect(hatGain);
          hatGain.connect(this.ctx.destination);

          noise.start(now);
          noise.stop(now + 0.03);
        } catch {}
      }

      // 3. SYNTH BASSLINE
      const bassFreq = bassline[step];
      if (bassFreq > 0) {
        try {
          const bassOsc = this.ctx.createOscillator();
          const bassFilter = this.ctx.createBiquadFilter();
          const bassGain = this.ctx.createGain();

          bassOsc.type = 'sawtooth';
          bassOsc.frequency.setValueAtTime(bassFreq, now);

          bassFilter.type = 'lowpass';
          bassFilter.frequency.setValueAtTime(800, now);
          bassFilter.frequency.exponentialRampToValueAtTime(150, now + 0.1);

          bassGain.gain.setValueAtTime(0.12, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

          bassOsc.connect(bassFilter);
          bassFilter.connect(bassGain);
          bassGain.connect(this.ctx.destination);

          bassOsc.start(now);
          bassOsc.stop(now + 0.1);
        } catch {}
      }

      // 4. ARPEGGIATED SYNTH LEAD
      const arpFreq = arpMelody[step];
      if (arpFreq > 0) {
        try {
          const leadOsc = this.ctx.createOscillator();
          const leadGain = this.ctx.createGain();

          leadOsc.type = 'triangle';
          leadOsc.frequency.setValueAtTime(arpFreq, now);

          leadGain.gain.setValueAtTime(0.08, now);
          leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

          leadOsc.connect(leadGain);
          leadGain.connect(this.ctx.destination);

          leadOsc.start(now);
          leadOsc.stop(now + 0.08);
        } catch {}
      }
    }, stepTimeMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  /**
   * Ball pickup pop sound (special pitch for purple ball)
   */
  public playPickup(isPurple: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const baseFreq = isPurple ? 350 : 540;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /**
   * Robot shooting ball over the ramp
   */
  public playShoot() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playTap(isP1: boolean = true, isOverdrive: boolean = false) {
    this.playPickup(false);
  }

  /**
   * Sound when Golden Key is collected
   */
  public playKeyPickup() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(1046.5, now); // C6
      osc1.frequency.setValueAtTime(1567.98, now + 0.08); // G6

      osc2.frequency.setValueAtTime(2093.0, now); // C7

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {}
  }

  /**
   * Sound when Purple Ball is locked in the Vault Box
   */
  public playLock() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Click 1 (key turn)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.setValueAtTime(1200, now + 0.04);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Click 2 (heavy vault latch slam)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(240, now + 0.09);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.25);
      gain2.gain.setValueAtTime(0.3, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.28);
    } catch {}
  }

  /**
   * Ball bounce on table / wall
   */
  public playBounce() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {}
  }

  /**
   * Sound when 100x Turbo Booster is activated
   */
  public playBooster() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.32);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Judge Derrick's authentic referee whistle!
   */
  public playWhistle(long: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const duration = long ? 0.65 : 0.28;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      lfo.frequency.setValueAtTime(32, now);
      lfoGain.gain.setValueAtTime(55, now);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(2620, now);
      osc2.frequency.setValueAtTime(2950, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.32, now + 0.04);
      gain.gain.setValueAtTime(0.32, now + duration - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      lfo.stop(now + duration);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {}
  }

  /**
   * Countdown beeps
   */
  public playCountdown(isGo: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'sawtooth' : 'sine';
      const freq = isGo ? 1320 : 660;
      const duration = isGo ? 0.35 : 0.15;

      osc.frequency.setValueAtTime(freq, now);
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1760, now + duration);
      }

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch {}
  }

  /**
   * Stadium Goal / Buzzer
   */
  public playStadiumHorn() {
    this.playGoalHorn();
  }

  public playGoalHorn() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(174.61, now);
      osc2.frequency.setValueAtTime(233.08, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
      gain.gain.setValueAtTime(0.3, now + 0.65);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);

      this.playCheer();
    } catch {}
  }

  public playFalseStart() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.setValueAtTime(110, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  public playCheer() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + 1.4);
    } catch {}
  }

  /**
   * Final 10-second countdown tick with escalating pitch
   */
  public playClockTick(secondsLeft: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 600 + Math.max(0, 10 - secondsLeft) * 75; // 600Hz at 10s up to 1275Hz at 1s
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.08);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Sci-fi pneumatic charging sound while holding Space for 1 second
   */
  public playChargeHum(progress: number) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = 220 + progress * 440; // 220Hz up to 660Hz
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Powerful charge-complete sound when 1.0s is reached
   */
  public playChargeComplete() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  /**
   * Urgent emergency siren for 10-second KO countdown
   */
  public playKOSiren() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(587.33, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  /**
   * Dramatic KO final whistle & buzzer
   */
  public playKOBuzzer() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [146.83, 220.0, 293.66].forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.9);
      });
    } catch {}
  }

  /**
   * Grand Victory Fanfare for Tournament Championship (defeating Team Taiwan!)
   * Multi-note royal brass flourish and stadium cheers
   */
  public playGrandVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Trumpet fanfare notes: C5, E5, G5, high C6 chord sustained
      const notes = [
        { f: 523.25, time: 0, dur: 0.18 },
        { f: 659.25, time: 0.18, dur: 0.18 },
        { f: 783.99, time: 0.36, dur: 0.22 },
        { f: 1046.5, time: 0.58, dur: 1.2 },
        { f: 783.99, time: 0.58, dur: 1.2 },
        { f: 523.25, time: 0.58, dur: 1.2 },
      ];

      notes.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.time);

        gain.gain.setValueAtTime(0.01, now + n.time);
        gain.gain.linearRampToValueAtTime(0.24, now + n.time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });

      // Cheering backdrop
      setTimeout(() => {
        this.playCheer();
      }, 400);
      setTimeout(() => {
        this.playCheer();
      }, 1200);
    } catch {}
  }

  /**
   * Blooket-style crisp correct answer chime (Rising major triad chime)
   */
  public playCorrect() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.12 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.14 }, // G5
        { freq: 1046.50, time: 0.24, dur: 0.35 }, // C6
      ];

      notes.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        gain.gain.setValueAtTime(0.01, now + n.time);
        gain.gain.linearRampToValueAtTime(0.2, now + n.time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    } catch {}
  }

  /**
   * Blooket-style wrong answer penalty buzz (dissonant low warning)
   */
  public playWrong() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [196.0, 185.0]; // Low jarring dissonance
      freqs.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.linearRampToValueAtTime(f * 0.75, now + 0.38);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {}
  }

  /**
   * Shouting MIXUE exact audio matching user uploaded audio, with no background music while shouting
   */
  public playMixueShout() {
    if (this.isMuted) return;
    this.initCtx();

    // Pause/stop background music while shouting
    const wasMusicPlaying = this.isMusicPlaying;
    if (wasMusicPlaying) {
      this.stopMusic();
    }

    try {
      if (typeof Audio !== 'undefined') {
        const audio = new Audio(mixueShoutAudio);
        audio.volume = 1.0;
        audio.currentTime = 0;

        let hasResumed = false;
        const resumeMusic = () => {
          if (hasResumed) return;
          hasResumed = true;
          if (wasMusicPlaying && !this.isMuted && !this.isMusicPlaying) {
            this.startMusic();
          }
        };

        audio.onended = resumeMusic;
        audio.onerror = resumeMusic;

        // Safety fallback timer to resume music if onended does not trigger
        setTimeout(resumeMusic, 6000);

        audio.play().catch(() => {
          resumeMusic();
        });
      }
    } catch {
      if (wasMusicPlaying && !this.isMuted && !this.isMusicPlaying) {
        this.startMusic();
      }
    }
  }

  /**
   * Derrick's "Ur prize!" Mixue celebration jingle
   */
  public playMixuePrize() {
    if (this.isMuted || !this.ctx) return;
    try {
      this.playGrandVictoryFanfare();
    } catch {}
  }
}

export const sound = new AudioService();
