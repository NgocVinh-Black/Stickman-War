<script setup lang="ts">
import { FACTION_ORDER } from '@nguoi-que/core';
import { onMounted, watch } from 'vue';
import AppDialog from './components/AppDialog.vue';
import ToastHost from './components/ToastHost.vue';
import VoicePanel from './components/VoicePanel.vue';
import { auth, initAuth } from './net/account';
import { router } from './router';
import { useOnline } from './stores/online';
import { useSettings } from './stores/settings';

const settings = useSettings();
const online = useOnline();

// Đăng nhập rồi thì dùng tên / tộc của tài khoản
watch(
  () => auth.account,
  (a) => {
    if (!a) return;
    settings.name = a.name;
    if (FACTION_ORDER.includes(a.faction)) settings.faction = a.faction;
  },
);
// Phiên đăng nhập hết hạn / đăng xuất mà chưa chọn khách: quay lại màn đăng nhập
watch(
  () => auth.session,
  (s) => {
    if (!s && !settings.guest && router.currentRoute.value.path === '/') void router.push('/login');
  },
);

onMounted(() => {
  void initAuth();
  // Mở bằng link mời ?room=MÃ thì vào thẳng phòng (phòng đã đủ người thì máy chủ hỏi có muốn xem không)
  const invite = new URLSearchParams(location.search).get('room');
  if (invite) {
    settings.guest = true;
    settings.tab = 'online';
    void online.go({ t: 'join', code: invite.toUpperCase().slice(0, 4), as: 'play' });
  }
});
</script>

<template>
  <RouterView />
  <AppDialog />
  <ToastHost />
  <VoicePanel v-if="online.voiceVisible" />
</template>
