<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { t } from '@stickman-war/i18n';
import { sound } from '../lib/sound';
import { useOnline } from '../stores/online';

/** Nút thoại nổi + bảng thoại: vào / rời thoại, bật / tắt mic (phím M), âm lượng riêng từng người. */
const online = useOnline();
const voice = online.voice;
const open = ref(false);
/** Âm lượng trước khi tắt tiếng một người, để bấm lại thì trả về đúng mức cũ. */
const restore = new Map<string, number>();

// voiceTick đổi mỗi khi thoại đổi: đọc nó để Vue vẽ lại danh sách
const peers = computed(() => (online.voiceTick, [...voice.peers]));
const joined = computed(() => (online.voiceTick, voice.joined));
const micOn = computed(() => (online.voiceTick, voice.micOn));
const talkingAny = computed(() => (online.voiceTick, voice.talking.size > 0));
const isTalking = (id: string) => (online.voiceTick, voice.talking.has(id));
const stateOf = (id: string) => (online.voiceTick, voice.stateOf(id));
const vols = ref<Record<string, number>>({});
const volOf = (name: string) => vols.value[name] ?? voice.volume(name);

function toggleMic(): void {
  if (!voice.joined) return;
  sound.click();
  void voice.setMic(!voice.micOn);
}
function setVol(name: string, v: number): void {
  voice.setVolume(name, v);
  vols.value = { ...vols.value, [name]: v };
}
function mute(name: string): void {
  const v = volOf(name);
  if (v) restore.set(name, v);
  setVol(name, v ? 0 : (restore.get(name) ?? 100));
}
const onKey = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement || e.repeat) return;
  if (e.key.toLowerCase() === 'm' && voice.joined) toggleMic();
};
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="voice" :class="{ open }">
    <button
      class="voice-toggle"
      :class="{ joined, talking: talkingAny }"
      :title="t('voice.title') + (joined ? t('voice.mHint') : '')"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ joined ? (micOn ? '🎤' : '🔇') : '🎙' }}<span v-if="peers.length">{{ peers.length }}</span>
    </button>
    <div v-if="open && !joined" class="voice-body">
      <p>
        {{ t('voice.intro') }}
        <template v-if="peers.length">
          <b>{{ peers.length }}</b> {{ t('voice.peers') }}
        </template>
      </p>
      <button class="btn btn-primary" @click="(sound.click(), voice.join())">{{ t('voice.join') }}</button>
      <p class="small">{{ t('voice.joinHint') }}</p>
    </div>
    <div v-else-if="open" class="voice-body">
      <div class="voice-actions">
        <button class="btn" :class="{ 'btn-primary': micOn }" @click="toggleMic">
          {{ micOn ? t('voice.micOn') : t('voice.micOff') }}
        </button>
        <button class="btn btn-ghost" @click="(sound.click(), voice.leave())">{{ t('voice.leave') }}</button>
      </div>
      <div class="voice-list">
        <div v-for="p in peers" :key="p.id" class="voice-peer" :class="{ talking: isTalking(p.id) }">
          <div class="voice-name">
            <i class="voice-dot" /><b>{{ p.name }}</b>
            <small v-if="p.id === voice.me"> ({{ t('common.you') }})</small>
            <small v-if="p.role === 'watcher'">👁</small>
            <span v-if="p.muted" :title="t('voice.muted')"> 🔇</span>
            <span v-if="p.id !== voice.me && stateOf(p.id) === 'failed'" :title="t('voice.failed')"> ⚠️</span>
            <small v-else-if="p.id !== voice.me && stateOf(p.id) === 'connecting'"> …</small>
          </div>
          <div v-if="p.id !== voice.me" class="voice-vol">
            <button class="voice-mute" :title="t('voice.mutePeer')" @click="mute(p.name)">{{ volOf(p.name) ? '🔊' : '🔈' }}</button>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              :value="volOf(p.name)"
              :aria-label="t('voice.volumeOf', { name: p.name })"
              @input="setVol(p.name, Number(($event.target as HTMLInputElement).value))"
            />
            <output>{{ volOf(p.name) }}%</output>
          </div>
        </div>
      </div>
      <p class="small">{{ t('voice.volumeHint') }} <kbd>M</kbd> {{ t('voice.micKey') }}</p>
    </div>
  </div>
</template>
