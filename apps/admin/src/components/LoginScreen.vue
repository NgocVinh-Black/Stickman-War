<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { loginOptions, loginWithGoogle, loginWithToken } from '../api';
import { renderGoogleButton } from '../google';

const opts = ref<{ google: boolean; token: boolean; clientId: string } | null>(null);
const token = ref('');
const error = ref('');
const busy = ref(false);
const googleEl = ref<HTMLElement | null>(null);
const logo = new URL('../../../web/public/logo.webp', import.meta.url).href;

async function run(fn: () => Promise<void>) {
  error.value = '';
  busy.value = true;
  try {
    await fn();
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    busy.value = false;
  }
}

function submitToken() {
  const t = token.value.trim();
  if (!t) return;
  void run(async () => {
    await loginWithToken(t);
    token.value = '';
  });
}

onMounted(() =>
  run(async () => {
    opts.value = await loginOptions();
    if (opts.value.google && opts.value.clientId) {
      await nextTick();
      if (googleEl.value) {
        await renderGoogleButton(googleEl.value, opts.value.clientId, (c) => void run(() => loginWithGoogle(c))).catch(() => {
          error.value = 'Không tải được nút Google (mạng chặn accounts.google.com?)';
        });
      }
    }
  }),
);
</script>

<template>
  <main class="login">
    <section class="login-card">
      <img class="login-logo" :src="logo" alt="Stickman War" />
      <h1>Trang quản trị</h1>
      <p class="muted">Xem tài khoản người chơi đã đăng ký. Chỉ quản trị viên mới vào được.</p>

      <template v-if="opts">
        <div v-if="opts.google && opts.clientId" ref="googleEl" class="google-slot" />
        <p v-else-if="opts.google" class="hint">Máy chủ có ADMIN_EMAILS nhưng chưa đặt GOOGLE_CLIENT_ID nên chưa đăng nhập Google được.</p>

        <div v-if="opts.google && opts.clientId && opts.token" class="or"><span>hoặc</span></div>

        <form v-if="opts.token" class="token-form" @submit.prevent="submitToken">
          <label for="admin-token">Mã quản trị</label>
          <input
            id="admin-token"
            v-model="token"
            type="password"
            autocomplete="current-password"
            placeholder="ADMIN_TOKEN trong .env máy chủ"
            :disabled="busy"
          />
          <button class="btn gold" type="submit" :disabled="busy || !token.trim()">Vào trang quản trị</button>
        </form>

        <p v-if="!opts.google && !opts.token" class="hint">
          Máy chủ chưa bật trang quản trị. Đặt <code>ADMIN_EMAILS</code> (email Google) hoặc <code>ADMIN_TOKEN</code> (≥ 16 ký tự) trong
          <code>apps/server/.env</code> rồi chạy lại máy chủ.
        </p>
      </template>
      <p v-else-if="!error" class="muted">Đang kết nối máy chủ…</p>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>
