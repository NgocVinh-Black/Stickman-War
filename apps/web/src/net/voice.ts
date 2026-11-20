import type { ClientMsg, SignalData, VoicePeer } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import { load, save } from '../lib/storage';

const ICE: RTCConfiguration = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] };
const TALK_LEVEL = 0.035;

type Peer = {
  pc: RTCPeerConnection;
  audio: HTMLAudioElement;
  /** Ứng viên ICE đến trước khi có mô tả phiên của bên kia. */
  pending: RTCIceCandidateInit[];
  level: (() => number) | null;
  state: 'connecting' | 'connected' | 'failed';
};

/**
 * Thoại trong phòng: mỗi người nối WebRTC thẳng tới từng người khác, máy chủ game chỉ chuyển tin bắt tay.
 * Bên có mã thoại nhỏ hơn gửi lời mời trước, nên hai bên không bao giờ mời nhau cùng lúc.
 * Mic được gắn vào kênh âm thanh đã thương lượng sẵn (replaceTrack), bật / tắt không cần bắt tay lại.
 */
export class Voice {
  me: string | null = null;
  peers: VoicePeer[] = [];
  micOn = false;
  talking = new Set<string>();
  /** Gọi khi danh sách / trạng thái kết nối đổi (vẽ lại bảng thoại). */
  onChange: () => void = () => {};
  /** Gọi khi ai đó bắt đầu / thôi nói (chỉ đổi đèn, không vẽ lại). */
  onTalk: () => void = () => {};
  onError: (msg: string) => void = () => {};

  private conns = new Map<string, Peer>();
  private track: MediaStreamTrack | null = null;
  private localLevel: (() => number) | null = null;
  private ctx: AudioContext | null = null;
  private poll = 0;
  private volumes: Record<string, number> = load('voiceVol', {});

  constructor(private readonly send: (m: ClientMsg) => void) {}

  get joined(): boolean {
    return this.me !== null;
  }

  join(): void {
    // Tạo AudioContext ngay trong lúc bấm nút để trình duyệt cho phát âm thanh
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    this.send({ t: 'voice', on: true });
  }

  leave(): void {
    if (this.joined) this.send({ t: 'voice', on: false });
    this.teardown();
    this.peers = [];
    this.onChange();
  }

  /** Mất kết nối / rời phòng: dọn sạch, không báo máy chủ. */
  teardown(): void {
    for (const id of [...this.conns.keys()]) this.drop(id);
    this.track?.stop();
    this.track = null;
    this.localLevel = null;
    this.micOn = false;
    this.me = null;
    this.talking.clear();
    clearInterval(this.poll);
    this.poll = 0;
  }

  async setMic(on: boolean): Promise<void> {
    if (!this.joined) return;
    if (on && !this.track) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        this.track = stream.getAudioTracks()[0];
        this.localLevel = this.meter(stream);
        for (const peer of this.conns.values()) void this.attachMic(peer.pc);
      } catch {
        this.onError(window.isSecureContext ? t('voice.noMic') : t('voice.httpsOnly'));
        return;
      }
    }
    if (this.track) this.track.enabled = on;
    this.micOn = on;
    this.send({ t: 'voiceMute', muted: !on });
    this.onChange();
  }

  volume(name: string): number {
    return this.volumes[name] ?? 100;
  }

  setVolume(name: string, vol: number): void {
    this.volumes[name] = vol;
    save('voiceVol', this.volumes);
    for (const [id, peer] of this.conns) {
      if (this.peers.find((p) => p.id === id)?.name === name) peer.audio.volume = vol / 100;
    }
  }

  stateOf(id: string): Peer['state'] | null {
    return this.conns.get(id)?.state ?? null;
  }

  /** Danh sách người trong thoại từ máy chủ: nối tới người mới, ngắt người đã đi. */
  updatePeers(you: string | null, peers: VoicePeer[]): void {
    this.peers = peers;
    if (you === null) {
      if (this.joined) this.teardown();
      this.onChange();
      return;
    }
    this.me = you;
    if (!this.poll) this.poll = window.setInterval(() => this.checkTalking(), 150);
    const ids = new Set(peers.map((p) => p.id));
    for (const id of [...this.conns.keys()]) if (!ids.has(id)) this.drop(id);
    for (const p of peers) {
      if (p.id !== you && !this.conns.has(p.id) && you < p.id) void this.call(p.id);
    }
    this.onChange();
  }

  async onSignal(from: string, data: SignalData): Promise<void> {
    if (!this.joined || !this.peers.some((p) => p.id === from)) return;
    const peer = this.conns.get(from) ?? this.connect(from);
    const { pc } = peer;
    try {
      if (data.description) {
        await pc.setRemoteDescription(data.description as RTCSessionDescriptionInit);
        for (const c of peer.pending.splice(0)) await pc.addIceCandidate(c).catch(() => {});
        if (data.description.type === 'offer') {
          const tr = pc.getTransceivers()[0];
          if (tr) tr.direction = 'sendrecv';
          await this.attachMic(pc);
          await pc.setLocalDescription(await pc.createAnswer());
          this.signal(from, { description: pc.localDescription!.toJSON() });
        }
      } else if (data.candidate) {
        if (pc.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => {});
        else peer.pending.push(data.candidate);
      }
    } catch {
      peer.state = 'failed';
      this.onChange();
    }
  }

  private signal(to: string, data: SignalData): void {
    this.send({ t: 'signal', to, data });
  }

  private connect(id: string): Peer {
    const pc = new RTCPeerConnection(ICE);
    const audio = new Audio();
    audio.autoplay = true;
    const peer: Peer = { pc, audio, pending: [], level: null, state: 'connecting' };
    this.conns.set(id, peer);
    pc.onicecandidate = (e) => e.candidate && this.signal(id, { candidate: e.candidate.toJSON() as SignalData['candidate'] });
    pc.ontrack = (e) => {
      const stream = e.streams[0] ?? new MediaStream([e.track]);
      audio.srcObject = stream;
      const name = this.peers.find((p) => p.id === id)?.name ?? '';
      audio.volume = this.volume(name) / 100;
      void audio.play().catch(() => {});
      peer.level = this.meter(stream);
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      const next = s === 'connected' ? 'connected' : s === 'failed' ? 'failed' : peer.state;
      if (next !== peer.state) {
        peer.state = next;
        this.onChange();
      }
    };
    return peer;
  }

  /** Bên mời: tạo sẵn kênh âm thanh hai chiều rồi gửi lời mời. */
  private async call(id: string): Promise<void> {
    const { pc } = this.connect(id);
    pc.addTransceiver('audio', { direction: 'sendrecv' });
    await this.attachMic(pc);
    await pc.setLocalDescription(await pc.createOffer());
    this.signal(id, { description: pc.localDescription!.toJSON() });
  }

  private async attachMic(pc: RTCPeerConnection): Promise<void> {
    const sender = pc.getTransceivers()[0]?.sender;
    if (sender && this.track && sender.track !== this.track) await sender.replaceTrack(this.track).catch(() => {});
  }

  private drop(id: string): void {
    const peer = this.conns.get(id);
    if (!peer) return;
    peer.pc.close();
    peer.audio.srcObject = null;
    this.conns.delete(id);
    this.talking.delete(id);
  }

  /** Đo độ to của một luồng âm thanh (để sáng đèn người đang nói). */
  private meter(stream: MediaStream): (() => number) | null {
    if (!this.ctx) return null;
    try {
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 512;
      this.ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      return () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        return Math.sqrt(sum / buf.length);
      };
    } catch {
      return null;
    }
  }

  private checkTalking(): void {
    const next = new Set<string>();
    if (this.me && this.micOn && (this.localLevel?.() ?? 0) > TALK_LEVEL) next.add(this.me);
    for (const [id, peer] of this.conns) {
      if (peer.audio.volume > 0 && (peer.level?.() ?? 0) > TALK_LEVEL) next.add(id);
    }
    const changed = next.size !== this.talking.size || [...next].some((id) => !this.talking.has(id));
    this.talking = next;
    if (changed) this.onTalk();
  }
}
