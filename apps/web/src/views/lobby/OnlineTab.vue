<script setup lang="ts">
import { ref } from 'vue';
import { auth } from '../../net/account';
import { useOnline } from '../../stores/online';
import { useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';

/** Online 1v1: tìm trận nhanh, tạo phòng, vào phòng bằng mã. */
const settings = useSettings();
const online = useOnline();
const ui = useUi();
const code = ref((new URLSearchParams(location.search).get('room') ?? '').toUpperCase().slice(0, 4));
const nameInput = ref(settings.name);

function saveName(): void {
  settings.setName(nameInput.value);
  nameInput.value = settings.name;
}
function onCode(e: Event): void {
  code.value = (e.target as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function join(as: 'play' | 'watch'): void {
  if (code.value.length !== 4) return ui.toast('Nhập mã phòng gồm 4 ký tự');
  void online.go({ t: 'join', code: code.value, as });
}
</script>

<template>
  <label class="field">
    <span>Tên của bạn</span>
    <input
      v-model="nameInput"
      maxlength="16"
      autocomplete="nickname"
      :disabled="!!auth.account"
      :title="auth.account ? 'Đổi tên ở mục Tài khoản' : undefined"
      @change="saveName"
    />
  </label>
  <button class="btn btn-primary wide" @click="online.go({ t: 'quick' })">⚡ Tìm trận nhanh</button>
  <button class="btn wide" @click="online.go({ t: 'create' })">➕ Tạo phòng mời bạn</button>
  <div class="join-row">
    <input :value="code" maxlength="4" placeholder="Mã phòng" autocapitalize="characters" @input="onCode" @keydown.enter="join('play')" />
    <button class="btn" @click="join('play')">▶ Chơi</button>
    <button class="btn" title="Vào xem trận" @click="join('watch')">👁 Xem</button>
  </div>
  <p class="online-status">{{ online.lastOnline ? `🟢 ${online.lastOnline} người đang trực tuyến` : online.status }}</p>
</template>
