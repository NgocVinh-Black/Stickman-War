<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { nextTick, onMounted, ref } from 'vue';
import { loginOptions, loginWithGoogle, loginWithToken } from '../lib/api';
import { renderGoogleButton } from '../lib/google';
import LangSwitch from '../components/LangSwitch.vue';

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
          error.value = t('admin.login.googleFail');
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
      <LangSwitch class="login-lang" />
      <h1>{{ t('admin.login.title') }}</h1>
      <p class="muted">{{ t('admin.login.intro') }}</p>

      <template v-if="opts">
        <div v-if="opts.google && opts.clientId" ref="googleEl" class="google-slot" />
        <p v-else-if="opts.google" class="hint">{{ t('admin.login.googleOff') }}</p>

        <div v-if="opts.google && opts.clientId && opts.token" class="or">
          <span>{{ t('admin.login.or') }}</span>
        </div>

        <form v-if="opts.token" class="token-form" @submit.prevent="submitToken">
          <label for="admin-token">{{ t('admin.login.token') }}</label>
          <input
            id="admin-token"
            v-model="token"
            type="password"
            autocomplete="current-password"
            :placeholder="t('admin.login.tokenPh')"
            :disabled="busy"
          />
          <button class="btn gold" type="submit" :disabled="busy || !token.trim()">{{ t('admin.login.enter') }}</button>
        </form>

        <p v-if="!opts.google && !opts.token" class="hint">
          {{ t('admin.login.offA') }} <code>ADMIN_EMAILS</code> {{ t('admin.login.offB') }} <code>ADMIN_TOKEN</code>
          {{ t('admin.login.offC') }} <code>apps/server/.env</code> {{ t('admin.login.offD') }}
        </p>
      </template>
      <p v-else-if="!error" class="muted">{{ t('admin.login.connecting') }}</p>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </section>
  </main>
</template>
