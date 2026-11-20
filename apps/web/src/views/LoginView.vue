<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { lang, t } from '@stickman-war/i18n';
import { sound } from '../lib/sound';
import { auth, renderGoogleButton } from '../net/account';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';

/**
 * Màn đăng nhập: nền public/bg-desktop.* (màn ngang) và public/bg-mobile.* (màn dọc) + logo public/logo.*, biển vàng Google, chơi khách,
 * ô đồng ý điều khoản (bắt buộc), cài đặt, khẩu hiệu.
 */
const settings = useSettings();
const ui = useUi();
const router = useRouter();
const note = ref('');
const shake = ref(false);
const gis = ref<HTMLElement>();
const plaque = ref<HTMLElement>();
const asset = (f: string) => import.meta.env.BASE_URL + f;

function needAgree(): boolean {
  if (settings.agree) return false;
  shake.value = false;
  void nextTick(() => (shake.value = true));
  ui.toast(t('login.agreeFirst'), 2200);
  return true;
}

/** Nút Google thật (iframe của Google) phủ kín tấm biển vàng, gần như trong suốt: bấm biển là bấm nút Google. */
function fitGis(): void {
  const el = gis.value;
  const frame = el?.firstElementChild as HTMLElement | null;
  if (!el || !frame || !plaque.value) return;
  const w = frame.offsetWidth || 1;
  const h = frame.offsetHeight || 1;
  el.style.transform = `translate(-50%, -50%) scale(${plaque.value.clientWidth / w}, ${plaque.value.clientHeight / h})`;
  el.style.pointerEvents = settings.agree ? 'auto' : 'none';
}

async function paintGoogle(): Promise<void> {
  if (!auth.clientId || !gis.value) return;
  note.value = '';
  await renderGoogleButton(gis.value, (msg) => (note.value = msg));
  setTimeout(fitGis, 300);
}

function onPlaque(): void {
  if (needAgree()) return;
  if (!auth.clientId) {
    note.value = !auth.reachable ? t('login.noServer') : t('login.noGoogle');
  }
}

function playGuest(): void {
  if (needAgree()) return;
  sound.click();
  settings.guest = true;
  void router.push('/');
}

function toggleAgree(): void {
  sound.click();
  settings.agree = !settings.agree;
  fitGis();
}

// Đăng nhập Google xong (hoặc còn phiên) thì vào sảnh
watch(
  () => auth.account,
  (a) => a && void router.push('/'),
  { immediate: true },
);
watch(
  () => auth.clientId,
  () => void paintGoogle(),
);
onMounted(() => {
  void paintGoogle();
  window.addEventListener('resize', fitGis);
});
onBeforeUnmount(() => window.removeEventListener('resize', fitGis));
</script>

<template>
  <main class="login-art">
    <div class="la-bg" />
    <div class="la-vignette" />
    <button class="la-gear" :aria-label="t('lobby.settings')" @click="(sound.click(), ui.show({ kind: 'settings' }))">⚙</button>
    <div class="la-center">
      <picture class="la-logo">
        <source :srcset="asset('logo.webp')" type="image/webp" />
        <img :src="asset('logo.png')" alt="Stickman War" />
      </picture>
      <div class="la-actions">
        <button ref="plaque" class="la-google" :aria-label="t('login.google')" @click="onPlaque">
          <span class="la-google-face">
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"
              />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z" />
              <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z" />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
              />
            </svg>
            <b>{{ t('login.google') }}</b>
          </span>
          <span class="la-glow" />
          <span ref="gis" class="la-gis" />
        </button>
        <p v-if="note" class="la-note">{{ note }}</p>
        <div class="la-or">
          <span>{{ t('login.or') }}</span>
        </div>
        <button class="la-guest" @click="playGuest">
          <span>{{ t('login.guest') }}</span>
        </button>
      </div>
    </div>
    <div class="la-agree">
      <button
        class="la-check"
        :class="{ on: settings.agree, shake }"
        role="checkbox"
        :aria-checked="settings.agree"
        :aria-label="t('login.agree')"
        @click="toggleAgree"
      />
      <span>
        {{ t('login.agreeA') }}
        <button class="la-a" @click="ui.show({ kind: 'legal', which: 'terms' })">{{ t('login.terms') }}</button>
        {{ t('login.and') }}
        <button class="la-a" @click="ui.show({ kind: 'legal', which: 'privacy' })">{{ t('login.privacy') }}</button>
      </span>
    </div>
    <!-- Khẩu hiệu là ảnh chữ tiếng Việt: chỉ hiện khi chọn tiếng Việt -->
    <picture v-if="lang === 'vi'" class="la-slogan la-slogan-fight">
      <source :srcset="asset('chien-dau-khong-gioi-han.webp')" type="image/webp" />
      <img :src="asset('chien-dau-khong-gioi-han.png')" alt="Chiến Đấu Không Giới Hạn" />
    </picture>
    <picture v-if="lang === 'vi'" class="la-slogan la-slogan-legend">
      <source :srcset="asset('tro-thanh-huyen-thoai.webp')" type="image/webp" />
      <img :src="asset('tro-thanh-huyen-thoai.png')" alt="Trở thành Huyền Thoại!" />
    </picture>
  </main>
</template>
