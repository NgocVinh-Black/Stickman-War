import { load, save } from './storage';

/** Âm thanh tổng hợp bằng WebAudio, không cần file asset. */
class Sound {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private last = new Map<string, number>();
  muted = load('muted', false);
  /** Âm lượng chung 0..1 (nhân vào mọi tiếng). */
  volume = Math.min(1, Math.max(0, load('volume', 1)));

  setVolume(v: number): void {
    this.volume = Math.min(1, Math.max(0, v));
    save('volume', this.volume);
  }

  toggle(): boolean {
    this.muted = !this.muted;
    save('muted', this.muted);
    return this.muted;
  }

  private audio(): AudioContext | null {
    if (this.muted || this.volume <= 0) return null;
    try {
      this.ctx ??= new AudioContext();
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Giới hạn tần suất để trận đông quân không bị ồn. */
  private throttle(key: string, ms: number): boolean {
    const now = performance.now();
    if (now - (this.last.get(key) ?? 0) < ms) return false;
    this.last.set(key, now);
    return true;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', delay = 0, volume = 0.12, slideTo?: number) {
    const ctx = this.audio();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
    gain.gain.setValueAtTime(Math.max(0.0011, volume * this.volume), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  private hiss(duration: number, volume: number, freq: number) {
    const ctx = this.audio();
    if (!ctx) return;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(Math.max(0.0011, volume * this.volume), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t);
    src.stop(t + duration);
  }

  click() {
    this.tone(700, 0.05, 'triangle', 0, 0.08);
  }
  hit() {
    if (this.throttle('hit', 70)) this.hiss(0.08, 0.12, 1800);
  }
  swing() {
    if (this.throttle('swing', 90)) this.hiss(0.1, 0.05, 3500);
  }
  arrow() {
    if (this.throttle('arrow', 90)) this.tone(900, 0.08, 'triangle', 0, 0.05, 400);
  }
  explode() {
    if (!this.throttle('explode', 120)) return;
    this.hiss(0.45, 0.25, 600);
    this.tone(120, 0.3, 'sine', 0, 0.2, 40);
  }
  death() {
    if (this.throttle('death', 120)) this.tone(300, 0.2, 'sawtooth', 0, 0.04, 90);
  }
  coin() {
    if (!this.throttle('coin', 150)) return;
    this.tone(1320, 0.08, 'square', 0, 0.035);
    this.tone(1760, 0.12, 'square', 0.06, 0.035);
  }
  trained() {
    this.tone(520, 0.1, 'triangle', 0, 0.08);
    this.tone(780, 0.14, 'triangle', 0.08, 0.08);
  }
  statueHit() {
    if (this.throttle('statue', 250)) this.tone(90, 0.25, 'sine', 0, 0.2, 50);
  }
  horn() {
    this.tone(220, 0.5, 'sawtooth', 0, 0.06);
    this.tone(330, 0.6, 'sawtooth', 0.15, 0.06);
  }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.3, 'triangle', i * 0.14, 0.12));
  }
  lose() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.35, 'sawtooth', i * 0.2, 0.06));
  }
}

export const sound = new Sound();
